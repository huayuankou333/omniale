import numpy as np
import mujoco
from scipy.optimize import least_squares
from scipy.ndimage import median_filter


class Policy:
    def __init__(self):
        self.debug = False

    # ------------------------------------------------------------------ setup
    def reset(self, cell_spec, seed):
        self.spec = cell_spec
        self.rng = np.random.default_rng(seed)
        self.model = mujoco.MjModel.from_binary_path(cell_spec['model_file'])
        self.fkm = mujoco.MjData(self.model)
        self.adr = [self.model.jnt_qposadr[self.model.joint(f'arm_joint{i}').id]
                    for i in range(1, 8)]
        self.lo = np.array([self.model.jnt_range[
            self.model.joint(f'arm_joint{i}').id][0] for i in range(1, 8)])
        self.hi = np.array([self.model.jnt_range[
            self.model.joint(f'arm_joint{i}').id][1] for i in range(1, 8)])
        self.bin_lo = np.asarray(cell_spec['bin_lo'], float)
        self.bin_hi = np.asarray(cell_spec['bin_hi'], float)
        self.bin_floor = float(self.bin_lo[2])
        self.bin_rim = float(cell_spec['bin_top_z'])
        self.belt_top = float(cell_spec['belt_top'])
        self.head_h = float(cell_spec['mag_head_h'])
        self.nests = [((np.asarray(n['lo'], float) + np.asarray(n['hi'], float)) / 2)
                      for n in cell_spec['sort_nests']]
        self.K = np.asarray(cell_spec['overhead_K'], float)
        self.Tov = np.asarray(cell_spec['overhead_T_world_cam'], float)
        self.q = np.asarray(cell_spec['arm_home'], float)
        self.home = self.q.copy()
        self.hover_z = 0.56
        self.lift_z = 0.60
        self.min_face = self.bin_floor + 0.012
        self.place_face_lo = self.belt_top + 0.016
        self.protos = np.array([2.05, 3.02, 3.72])
        self.phase = 'warm'
        self.tick = 0
        self.traj = []
        self.pt = 0
        self.cur_target = None
        self.surface = None
        self.surface_t = -10.0
        self.black = []
        self.fsamples = []
        self.fpre = None
        self.fhold = None
        self.payload_xy = np.zeros(2)
        self.cls = None
        self.fails = 0
        self.tgt_fails = {}
        self.desc_z = self.hover_z
        self.contact = 0
        self.park_until = 0.0
        self.phase_t0 = 0.0
        self.log = []

    # ------------------------------------------------------------------ FK/IK
    def fk(self, q):
        self.fkm.qpos[self.adr] = q
        mujoco.mj_kinematics(self.model, self.fkm)
        bid = self.model.body('arm_magnet').id
        return self.fkm.xpos[bid].copy(), self.fkm.xmat[bid].reshape(3, 3).copy()

    def world_ft(self, obs):
        f = np.asarray(obs['ft'], float)
        _, R = self.fk(np.asarray(obs['qpos'], float))
        return np.r_[R @ f[:3], R @ f[3:]]

    def Rtar(self):
        return np.array([[0.0, -1.0, 0.0],
                         [-1.0, 0.0, 0.0],
                         [0.0, 0.0, -1.0]])

    def ik(self, xyz, seed):
        Rt = self.Rtar()

        def res(q):
            p, R = self.fk(q)
            return np.r_[(p - xyz) * 20.0, (R - Rt).ravel() * 0.5]

        sol = least_squares(res, np.asarray(seed, float),
                            bounds=(self.lo, self.hi), max_nfev=90,
                            xtol=1e-7, ftol=1e-7, gtol=1e-7)
        return sol.x

    def planline(self, a, b, start=None, step=.03, reps=2):
        a = np.asarray(a, float)
        b = np.asarray(b, float)
        q0 = self.q.copy() if start is None else np.asarray(start, float)
        n = max(1, int(np.ceil(np.linalg.norm(b - a) / step)))
        out = []
        for k in range(1, n + 1):
            p = a * (1.0 - k / n) + b * (k / n)
            q = self.ik(p, q0)
            out.extend([q] * reps)
            q0 = q
        return out

    def addseg(self, tr, a, b, mag, start=None, step=.03, reps=2):
        tr.extend((q, float(mag)) for q in self.planline(a, b, start, step, reps))
        return tr

    # ------------------------------------------------------------- perception
    def observe_overhead(self, obs):
        depth = np.asarray(obs.get('overhead_depth', None), dtype=np.float32)
        rgb = np.asarray(obs.get('overhead_rgb', None))
        if depth is None or rgb is None or depth.ndim != 2:
            return
        self._update_tool_clearance(obs)
        if not self.tool_clear:
            return

        valid = np.isfinite(depth) & (depth > 0.02) & (depth < 3.0)
        dfill = depth.copy()
        dfill[~valid] = 3.0
        d = median_filter(dfill, size=3, mode='nearest')
        d[~valid] = np.nan

        h, w = d.shape
        u, v = np.meshgrid(np.arange(w), np.arange(h))
        fx, cx = self.K[0, 0], self.K[0, 2]
        fy, cy = self.K[1, 1], self.K[1, 2]
        with np.errstate(invalid='ignore'):
            x = self.Tov[0, 3] + (u - cx) / fx * d
            y = self.Tov[1, 3] - (v - cy) / fy * d
            z = self.Tov[2, 3] - d

        sat = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)
        gray = (sat < 48) & (rgb.mean(axis=2) > 58)
        margin = 0.032
        mask = (np.isfinite(z) & gray
                & (x > self.bin_lo[0] + margin) & (x < self.bin_hi[0] - margin)
                & (y > self.bin_lo[1] + margin) & (y < self.bin_hi[1] - margin)
                & (z > self.bin_floor + 0.004) & (z < self.bin_rim - 0.025))
        if not mask.any():
            return

        now = self.tick / 20.0
        self.black = [(bx, by, bt, br) for bx, by, bt, br in self.black
                      if bt > now]
        if self.black:
            keep = mask.copy()
            for bx, by, _, br in self.black:
                keep &= ((x - bx) ** 2 + (y - by) ** 2 > br ** 2)
            if keep.sum() >= 12:
                mask = keep

        xs = x[mask]; ys = y[mask]; zs = z[mask]
        ztop = np.quantile(zs, 0.995)
        near = zs > ztop - 0.006
        xr = xs[near]; yr = ys[near]; zr = zs[near]
        # densest 6 mm cell of the highest surface patch
        cell = 0.008
        xi = np.floor((xr - self.bin_lo[0]) / cell).astype(np.int64)
        yi = np.floor((yr - self.bin_lo[1]) / cell).astype(np.int64)
        key = xi * 1000 + yi
        best_key, best_n = 0, -1
        for avoid in (0,):
            uniq, cnt = np.unique(key, return_counts=True)
            best_key = int(uniq[int(np.argmax(cnt))])
            best_n = int(cnt.max())
        sel = key == best_key
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                sel |= key == best_key + dx * 1000 + dy
        if sel.sum() < 3:
            sel = near
        self.surface = np.array([float(np.median(xr[sel])),
                                 float(np.median(yr[sel])),
                                 float(np.quantile(zr[sel], 0.80))])
        self.surface_t = now
        if self.debug:
            print('SURF', np.round(self.surface, 3), 'n', int(sel.sum()),
                  't', now, flush=True)

    def _update_tool_clearance(self, obs):
        try:
            p, R = self.fk(np.asarray(obs['qpos'], float))
            face = p + R @ np.array([0.0, 0.0, self.head_h])
            self.tool_clear = bool(
                face[2] > self.bin_rim + 0.18 or
                face[0] < self.bin_lo[0] or face[0] > self.bin_hi[0] or
                face[1] < self.bin_lo[1] or face[1] > self.bin_hi[1])
        except Exception:
            self.tool_clear = True

    # ------------------------------------------------------------------- flow
    def plan_park(self):
        tr = []
        pnow = self.fk(self.q)[0]
        self.addseg(tr, pnow, np.array([0.42, -0.02, 0.62]), 0.0,
                    self.q, step=.09)
        self.traj = tr
        self.phase = 'exec'
        self.pt = 0
        self.after = 'park'

    def next_pick(self):
        now = self.tick / 20.0
        if now > 117.0:
            self.phase = 'done'
            return
        if self.surface is None or now - self.surface_t > 2.5:
            if now < self.park_until:
                self.phase = 'hold'
                return
            self.park_until = now + 0.8
            self.plan_park()
            return
        tx, ty, tz = self.surface
        tx = float(np.clip(tx, self.bin_lo[0] + 0.030, self.bin_hi[0] - 0.030))
        ty = float(np.clip(ty, self.bin_lo[1] + 0.030, self.bin_hi[1] - 0.030))
        self.cur_target = np.array([tx, ty, tz])
        if self.debug:
            print('TARGET', np.round(self.cur_target, 3), 't', now, flush=True)
        up = np.array([tx, ty, self.hover_z])
        tr = []
        pnow = self.fk(self.q)[0]
        self.addseg(tr, pnow, up, 0.0, self.q, step=.09)
        self.traj = tr
        self.phase = 'exec'
        self.pt = 0
        self.after = 'approach'
        self.fails = 0

    def begin_lift(self):
        p0 = self.fk(self.q)[0]
        self.lift_xy = np.array([p0[0], p0[1]])
        self.lift_cur = float(p0[2])
        self.lift_n = 0
        self.phase = 'lift'

    def plan_place(self):
        if self.debug:
            print('PLACE', self.cls, 'off', np.round(self.payload_xy, 3),
                  't', round(self.tick / 20, 2), flush=True)
        cx, cy, _ = self.nests[int(self.cls)]
        x = float(cx) - float(self.payload_xy[0])
        y = float(cy) - float(self.payload_xy[1])
        x = float(np.clip(x, 0.12, 0.74))
        y = float(np.clip(y, 0.24, 0.52))
        self.place_xy = np.array([x, y])
        up = np.array([x, y, 0.56])
        tr = []
        pnow = self.fk(self.q)[0]
        self.addseg(tr, pnow, up, 128.0, self.q, step=.09)
        self.traj = tr
        self.phase = 'exec'
        self.pt = 0
        self.after = 'place_approach'

    def plan_retry(self):
        tr = []
        pnow = self.fk(self.q)[0]
        b = np.array([0.47, -0.27, 0.56])
        self.addseg(tr, pnow, b, 128.0, self.q, step=.06)
        qh = tr[-1][0] if tr else self.q
        tr += [(qh, 0.0)] * 7
        self.addseg(tr, b, np.array([0.42, -0.02, 0.60]), 0.0, qh, step=.06)
        self.traj = tr
        self.phase = 'exec'
        self.pt = 0
        self.after = 'retry'

    def plan_abort(self):
        self.abort_q = self.q.copy()
        self.abort_ticks = 0
        self.phase = 'abort'

    def plan_abort_retreat(self):
        tr = []
        p0 = self.fk(self.q)[0]
        b = np.array([p0[0], p0[1], min(0.60, p0[2] + 0.10)])
        self.addseg(tr, p0, b, 0.0, self.q, step=.03)
        b2 = np.array([0.42, -0.02, 0.62])
        self.addseg(tr, b, b2, 0.0, tr[-1][0] if tr else self.q, step=.06)
        self.traj = tr
        self.phase = 'exec'
        self.pt = 0
        self.after = 'retry'

    def hold_cmd(self):
        if self.traj:
            q, mag = self.traj[-1]
            return np.r_[np.asarray(q, float), float(mag)]
        return np.r_[self.q, 0.0]

    def execute(self):
        if self.pt < len(self.traj):
            q, mag = self.traj[self.pt]
            self.pt += 1
            if self.pt == len(self.traj):
                self.ptick = self.tick
                self.phase = 'settle'
            return np.r_[np.asarray(q, float), float(mag)]
        self.ptick = self.tick
        self.phase = 'settle'
        return self.hold_cmd()

    def classify(self, obs):
        f = np.median(np.asarray(self.fsamples[-7:]), axis=0)
        d = f[:3] - self.fpre[:3]
        dm = float(np.linalg.norm(d))
        dz = abs(float(d[2]))
        lat = float(np.linalg.norm(d[:2]))
        dist = np.abs(self.protos - dm)
        cls = int(np.argmin(dist))
        valid = bool(1.55 < dm < 4.75 and dz > 0.70 * dm and lat < 1.0
                     and dist[cls] < 0.60)
        # line of action of the payload relative to the tool origin
        tq = np.median(np.asarray(self.fsamples[-7:])[:, 3:], axis=0)
        tp = self.fpre[3:]
        dT = tq - tp
        denom = max(float(d @ d), 1e-6)
        rw = np.cross(d, dT) / denom
        if np.linalg.norm(rw[:2]) < 0.10:
            self.payload_xy = rw[:2].copy()
        else:
            self.payload_xy = np.zeros(2)
        if self.debug:
            print('CLASS dm', round(dm, 3), 'dz', round(dz, 3), 'cls', cls,
                  'valid', valid, 't', round(self.tick / 20, 2),
                  'D', np.round(d, 2), 'DT', np.round(dT, 3),
                  'r', np.round(rw, 3), flush=True)
        return cls if valid else None

    # -------------------------------------------------------------------- act
    def act(self, obs):
        self.q = np.asarray(obs['qpos'], float)
        ft = np.asarray(obs['ft'], float)
        self.ftw = self.world_ft(obs)
        self.tick += 1
        if 'overhead_depth' in obs:
            self.observe_overhead(obs)

        if self.phase == 'warm':
            self.fsamples.append(ft)
            if self.tick >= 10:
                self.fsamples = []
                self.phase = 'idle'
            return np.r_[self.home, 0.0]

        if self.phase == 'idle':
            self.next_pick()
            if self.phase == 'exec':
                return self.execute()
            return np.r_[self.q, 0.0]

        if self.phase == 'hold':
            if self.tick / 20.0 >= self.park_until:
                self.phase = 'idle'
            return np.r_[self.q, 0.0]

        if self.phase == 'exec':
            return self.execute()

        if self.phase == 'descend':
            d = self.ftw[:3] - self.fpre[:3]
            dev = float(np.linalg.norm(d))
            self.slow_ticks += 1
            if dev > 1.5:
                self.dev_streak += 1
            else:
                self.dev_streak = 0
            if dev > 6.0 or self.dev_streak >= 3:
                self.contact += 2
            else:
                self.contact = 0
            tx, ty = self.desc_xy
            if self.contact >= 2 or self.desc_z <= self.desc_bottom:
                if self.debug:
                    print('DESCSTOP z', round(self.desc_z, 3), 'dev',
                          round(dev, 2), 'contact', self.contact, 'slow',
                          self.slow_ticks, 'bottom', round(self.desc_bottom, 3),
                          't', round(self.tick / 20, 2), flush=True)
                self.begin_lift()
                return np.r_[self.q, 128.0]
            self.desc_z = max(self.desc_bottom, self.desc_z - 0.002)
            q = self.ik(np.array([tx, ty, self.desc_z]), self.q)
            return np.r_[q, 128.0]

        if self.phase == 'place_descend':
            d = self.ftw[:3] - self.fhold[:3]
            dev = float(np.linalg.norm(d))
            if dev > 0.85:
                self.contact += 1
            else:
                self.contact = 0
            x, y = self.place_xy
            if self.contact >= 2 or self.desc_z <= self.place_min:
                if self.debug:
                    print('PLACESTOP z', round(self.desc_z, 3), 'dev',
                          round(dev, 2), 'contact', self.contact, 't',
                          round(self.tick / 20, 2), flush=True)
                tr = [(self.ik(np.array([x, y, self.desc_z]), self.q), 0.0)] * 8
                tr += [(self.ik(np.array([x, y, self.hover_z]), self.q), 0.0)] * 12
                self.traj = tr
                self.phase = 'exec'
                self.pt = 0
                self.after = 'place'
                return self.execute()
            self.desc_z = max(self.place_min, self.desc_z - 0.009)
            q = self.ik(np.array([x, y, self.desc_z]), self.q)
            return np.r_[q, 128.0]

        if self.phase == 'lift':
            dev = float(np.linalg.norm(self.ftw[:3] - self.fpre[:3]))
            if dev > 420.0:
                if self.debug:
                    print('ABORTJAM dev', round(dev, 1), 'z',
                          round(self.lift_cur, 3), 't',
                          round(self.tick / 20, 2), flush=True)
                self.plan_abort()
                return self.execute()
            step = 0.003 if self.lift_n < 6 else 0.010
            self.lift_n += 1
            self.lift_cur = min(self.lift_z, self.lift_cur + step)
            q = self.ik(np.array([self.lift_xy[0], self.lift_xy[1],
                                  self.lift_cur]), self.q)
            self.traj = [(q, 128.0)]
            if self.lift_cur >= self.lift_z - 1e-9:
                self.traj = [(q, 128.0)]
                self.ptick = self.tick
                self.fsamples = []
                self.phase = 'settle'
                self.after = 'pick'
            return np.r_[q, 128.0]

        if self.phase == 'abort':
            self.abort_ticks += 1
            hold = getattr(self, 'abort_q', self.q)
            if self.abort_ticks > 5:
                self.plan_abort_retreat()
                return self.execute()
            return np.r_[np.asarray(hold, float), 0.0]

        if self.phase == 'settle':
            ctrl = self.hold_cmd()
            if self.after in ('approach', 'pick', 'place_approach', 'desc_fast'):
                self.fsamples.append(self.ftw)
            if self.after == 'approach':
                wait = 12
            elif self.after == 'pick':
                wait = 10
            elif self.after == 'place_approach':
                wait = 10
            else:
                wait = 4
            if self.tick - self.ptick > wait:
                if self.after == 'approach':
                    self.fpre = np.median(np.asarray(self.fsamples[-6:]), axis=0)
                    self.fsamples = []
                    tx, ty, _ = self.cur_target
                    self.desc_xy = np.array([tx, ty])
                    self.min_body = self.min_face + self.head_h
                    tz = float(self.cur_target[2])
                    self.fast_stop = tz + self.head_h + 0.030
                    self.desc_bottom = max(self.min_body,
                                           tz + self.head_h - 0.014)
                    tr = []
                    pnow = self.fk(self.q)[0]
                    self.addseg(tr, pnow, np.array([tx, ty, self.fast_stop]),
                                128.0, self.q, step=.020, reps=1)
                    qf = tr[-1][0]
                    tr += [(qf, 128.0)] * 6
                    self.traj = tr
                    self.phase = 'exec'
                    self.pt = 0
                    self.after = 'desc_fast'
                    return self.execute()
                if self.after == 'desc_fast':
                    self.fpre = np.median(np.asarray(self.fsamples[-4:]), axis=0)
                    self.fsamples = []
                    self.desc_z = self.fast_stop
                    self.slow_ticks = 0
                    self.dev_streak = 0
                    self.contact = 0
                    self.phase = 'descend'
                    tx, ty = self.desc_xy
                    return np.r_[self.ik(np.array([tx, ty, self.desc_z]),
                                         self.q), 128.0]
                if self.after == 'pick':
                    cls = self.classify(obs)
                    if cls is None:
                        dm_now = float(np.linalg.norm(
                            np.median(np.asarray(self.fsamples[-7:]), axis=0)[:3]
                            - self.fpre[:3]))
                        if dm_now > 4.75:
                            self.blacklist(20.0, 0.060)
                        else:
                            self.blacklist(12.0, 0.040)
                        self.fails += 1
                        self.plan_retry()
                    else:
                        self.cls = cls
                        self.plan_place()
                    return self.execute()
                if self.after == 'place_approach':
                    x, y = self.place_xy
                    zrel = self.belt_top + 0.060 + self.head_h
                    tr = []
                    pnow = self.fk(self.q)[0]
                    self.addseg(tr, pnow, np.array([x, y, zrel]), 128.0,
                                self.q, step=.025)
                    qd = tr[-1][0]
                    tr += [(qd, 0.0)] * 9
                    self.addseg(tr, np.array([x, y, zrel]),
                                np.array([x, y, self.hover_z]), 0.0, qd,
                                step=.040)
                    self.traj = tr
                    self.phase = 'exec'
                    self.pt = 0
                    self.after = 'place'
                    return self.execute()
                if self.after == 'retry':
                    self.cur_target = None
                    self.phase = 'idle'
                    return np.r_[self.q, 0.0]
                if self.after == 'park':
                    self.phase = 'idle'
                    return np.r_[self.q, 0.0]
                self.cur_target = None
                self.phase = 'idle'
                return np.r_[self.q, 0.0]
            return ctrl

        if self.phase == 'done':
            return np.r_[self.home, 0.0]
        return np.r_[self.q, 0.0]

    def blacklist(self, seconds, radius=0.040):
        if self.cur_target is None:
            return
        x, y = float(self.cur_target[0]), float(self.cur_target[1])
        kx, ky = int(round(x / 0.02)), int(round(y / 0.02))
        self.tgt_fails[(kx, ky)] = self.tgt_fails.get((kx, ky), 0) + 1
        sec = seconds * (1 + self.tgt_fails[(kx, ky)] - 1)
        self.black.append((x, y, self.tick / 20.0 + min(sec, 45.0),
                           float(radius)))


def make_policy():
    return Policy()
