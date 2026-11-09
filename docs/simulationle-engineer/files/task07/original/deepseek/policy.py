"""Bin clearing policy.

Overhead depth -> heightmap -> pick point; straight-down approach with
force-torque contact detection; magnet weld; carry to the placement nest;
descend until the part touches the belt; release; repeat.
"""
import numpy as np
import mujoco
from scipy.ndimage import maximum_filter, median_filter, uniform_filter

VEL_GAIN = 10.0          # Panda actuator kp/kv
FT_CONTACT = 2.0         # N above the free-space baseline
FT_PAYLOAD = 1.3         # N payload threshold (one bracket ~= 3.0 N)


def _rot_err(R_des, R):
    Re = R_des @ R.T
    c = min(1.0, max(-1.0, 0.5 * (np.trace(Re) - 1.0)))
    ang = np.arccos(c)
    if ang < 1e-9:
        return np.zeros(3)
    ax = np.array([Re[2, 1] - Re[1, 2], Re[0, 2] - Re[2, 0],
                   Re[1, 0] - Re[0, 1]])
    n = np.linalg.norm(ax)
    if n < 1e-9:
        return np.zeros(3)
    return ax / n * ang


def _down_rot(yaw):
    z = np.array([0.0, 0.0, -1.0])
    x = np.array([np.cos(yaw), np.sin(yaw), 0.0])
    x /= np.linalg.norm(x)
    y = np.cross(z, x)
    return np.column_stack([x, y, z])


class Policy:
    def __init__(self):
        self.ready = False

    def reset(self, cell_spec, seed):
        self.s = dict(cell_spec)
        self.rng = np.random.default_rng(int(seed))
        self.model = mujoco.MjModel.from_binary_path(self.s["model_file"])
        self.data = mujoco.MjData(self.model)
        self.grip_id = self.model.site("arm_grip").id
        self.jacp = np.zeros((3, self.model.nv))
        self.jacr = np.zeros((3, self.model.nv))
        self.arm_home = np.asarray(self.s["arm_home"], float)
        self.qlim_lo = self.model.jnt_range[:, 0] + 2e-4
        self.qlim_hi = self.model.jnt_range[:, 1] - 2e-4

        bl = np.asarray(self.s["bin_lo"], float)
        bh = np.asarray(self.s["bin_hi"], float)
        self.bin_floor_z = float(bl[2])
        self.bin_top_z = float(self.s["bin_top_z"])
        self.bin_lo = bl[:2].copy()
        self.bin_hi = bh[:2].copy()
        self.belt_top = float(self.s["belt_top"])
        self.zone_xy = np.array([0.450, 0.380])

        self.K = np.asarray(self.s["overhead_K"], float)
        self.cam_pos = np.asarray(self.s["overhead_T_world_cam"], float)[:3, 3]

        m = 0.026
        self.pick_lo = self.bin_lo + m
        self.pick_hi = self.bin_hi - m
        self.R_down = _down_rot(np.pi)
        self.home_p = np.array([0.430, -0.040, 0.400])
        self.q_pref = np.array([-0.10, -0.20, 0.00, -2.00, 0.00, 1.95, 0.70])

        self.q = self.arm_home.copy()
        self.q_cmd = self.arm_home.copy()
        self.mag = 0.0
        self.t = 0.0
        self.state = "boot"
        self.state_t = 0.0
        self.target_p = None
        self.ft_hist = []
        self.baseline = None
        self.cands = []
        self.failed = []
        self.picks_done = 0
        self.grabs = 0
        self.hold_delta = 0.0
        self.multi = 0
        self.phase = {}
        self.dbg = {}
        self.scan_t = -1.0
        self.deliveries = []
        self.ready = True

    # ------------------------------------------------------------------- fk
    def fk(self, q):
        self.data.qpos[:] = q
        mujoco.mj_kinematics(self.model, self.data)
        mujoco.mj_comPos(self.model, self.data)
        return (self.data.site_xpos[self.grip_id].copy(),
                self.data.site_xmat[self.grip_id].reshape(3, 3).copy())

    # ---------------------------------------------------------------- servo
    def servo(self, p_des, R_des, vmax, wmax, jvmax=1.8):
        p, R = self.fk(self.q)
        ep = np.asarray(p_des, float) - p
        er = _rot_err(np.asarray(R_des, float), R)
        ne = np.linalg.norm(ep)
        v = ep * 9.0
        nv = np.linalg.norm(v)
        if nv > vmax:
            v *= vmax / nv
        w = er * 7.0
        nw = np.linalg.norm(w)
        if nw > wmax:
            w *= wmax / nw
        mujoco.mj_jacSite(self.model, self.data, self.jacp, self.jacr,
                          self.grip_id)
        J = np.vstack([self.jacp, self.jacr])
        Jp = J.T @ np.linalg.inv(J @ J.T + 0.02 ** 2 * np.eye(6))
        jv = Jp @ np.concatenate([v, w])
        null = (np.eye(self.model.nv) - Jp @ J) @ (2.0 * (self.q_pref - self.q))
        jv = jv + null
        jm = np.abs(jv).max()
        if jm > jvmax:
            jv *= jvmax / jm
        self.q_cmd = np.clip(self.q + jv / VEL_GAIN, self.qlim_lo,
                             self.qlim_hi)
        return ne, np.linalg.norm(er)

    def hold(self):
        self.q_cmd = self.q.copy()

    def ft_mean(self, n=2):
        return np.mean([h[:3] for h in self.ft_hist[-n:]], axis=0)

    def ft_delta(self):
        if not self.ft_hist or self.baseline is None:
            return 0.0
        return float(np.linalg.norm(self.ft_mean() - self.baseline))

    def payload(self):
        """Payload weight projected on the tool axis (robust to swing)."""
        if not self.ft_hist or self.baseline is None:
            return 0.0
        _, R = self.fk(self.q)
        zax = R[:, 2]
        d = self.ft_mean() - self.baseline
        return float(np.dot(d, zax))

    def ft_stable(self):
        if len(self.ft_hist) < 3:
            return False
        a = np.array([h[:3] for h in self.ft_hist[-3:]])
        return float(np.abs(a - a.mean(axis=0)).max()) < 0.55

    def set_baseline(self):
        if len(self.ft_hist) >= 2:
            self.baseline = np.mean([h[:3] for h in self.ft_hist[-2:]],
                                    axis=0)

    # ------------------------------------------------------------ perception
    def scan(self, obs):
        dep = np.asarray(obs.get("overhead_depth"), dtype=np.float64)
        if dep is None or dep.ndim != 2 or not np.isfinite(dep).any():
            return None
        fx, fy = self.K[0, 0], self.K[1, 1]
        cx, cy = self.K[0, 2], self.K[1, 2]
        u0, u1, v0, v1 = 120, 520, 80, 400
        d = dep[v0:v1, u0:u1]
        u = np.arange(u0, u1)[None, :]
        v = np.arange(v0, v1)[:, None]
        valid = np.isfinite(d) & (d > 0.05) & (d < 1.6)
        if valid.sum() < 2000:
            return None
        X = self.cam_pos[0] + (u - cx) / fx * d
        Y = self.cam_pos[1] - (v - cy) / fy * d
        Z = self.cam_pos[2] - d
        inside = (valid & (Z > self.bin_floor_z + 0.020)
                  & (Z < self.bin_top_z - 0.003)
                  & (X > self.bin_lo[0] + 0.004) & (X < self.bin_hi[0] - 0.004)
                  & (Y > self.bin_lo[1] + 0.004) & (Y < self.bin_hi[1] - 0.004))
        binmask = ((X > self.bin_lo[0] + 0.004) & (X < self.bin_hi[0] - 0.004)
                   & (Y > self.bin_lo[1] + 0.004) & (Y < self.bin_hi[1] - 0.004)
                   & (Z > self.bin_floor_z - 0.01) & (Z < self.bin_top_z + 0.05))
        if binmask.sum() < 500:
            return None
        vf = float(np.mean(valid[binmask]))
        self.dbg["vf"] = vf
        if vf < 0.55:
            return None
        if inside.sum() < 120:
            return []
        Xs, Ys, Zs = X[inside], Y[inside], Z[inside]
        cell = 0.005
        nx = int(np.ceil((self.bin_hi[0] - self.bin_lo[0]) / cell))
        ny = int(np.ceil((self.bin_hi[1] - self.bin_lo[1]) / cell))
        ix = np.clip(((Xs - self.bin_lo[0]) / cell).astype(int), 0, nx - 1)
        iy = np.clip(((Ys - self.bin_lo[1]) / cell).astype(int), 0, ny - 1)
        Hm = np.full(nx * ny, -1.0)
        np.maximum.at(Hm, ix * ny + iy, Zs)
        Hm = Hm.reshape(nx, ny)
        occ = (Hm >= 0).astype(np.float64)
        Hf = median_filter(np.where(Hm >= 0, Hm, 0.0), size=3)
        frac = uniform_filter(occ, size=5)
        xs = self.bin_lo[0] + (np.arange(nx) + 0.5) * cell
        ys = self.bin_lo[1] + (np.arange(ny) + 0.5) * cell
        ok = ((Hf > self.bin_floor_z + 0.026) & (frac >= 0.44)
              & (xs[:, None] >= self.pick_lo[0]) & (xs[:, None] <= self.pick_hi[0])
              & (ys[None, :] >= self.pick_lo[1]) & (ys[None, :] <= self.pick_hi[1])
              & (Hf < self.bin_top_z - 0.014))
        ii, jj = np.nonzero(ok)
        if len(ii) == 0:
            return []
        order = np.argsort(-Hf[ii, jj])
        out, raw = [], []
        fails = self.failed[-8:]
        for k in order:
            z = float(Hf[ii[k], jj[k]])
            x = float(xs[ii[k]])
            y = float(ys[jj[k]])
            if any((x - ox) ** 2 + (y - oy) ** 2 < 0.026 ** 2
                   for _, ox, oy in out):
                continue
            if any((x - ax) ** 2 + (y - ay) ** 2 < 0.016 ** 2
                   for ax, ay in fails):
                continue
            out.append((z, x, y))
            if len(out) >= 30:
                break
        if not out:
            for k in order[:12]:
                out.append((float(Hf[ii[k], jj[k]]), float(xs[ii[k]]),
                            float(ys[jj[k]])))
        return out

    def fresh_cands(self, obs):
        c = self.scan(obs)
        if c is None:
            return False
        self.cands = c
        self.scan_t = self.t
        return True

    # ------------------------------------------------------------------ main
    def act(self, obs):
        self.q = np.asarray(obs["qpos"], float)
        self.t = float(obs["t"])
        self.ft_hist.append(np.asarray(obs["ft"], float).copy())
        if len(self.ft_hist) > 6:
            self.ft_hist.pop(0)
        has_frame = "overhead_depth" in obs

        st = self.state
        dt = self.t - self.state_t
        if st == "boot":
            self.hold()
            if has_frame and self.fresh_cands(obs):
                if self.cands:
                    self._goto("approach")
                else:
                    self._goto("scan_pose")
        elif st == "scan_pose":
            # move clear of the bin in joint space (same view as boot), rescan
            self.q_cmd = np.clip(self.q + np.clip(self.arm_home - self.q,
                                                 -0.06, 0.06), self.qlim_lo,
                                 self.qlim_hi)
            near = np.abs(self.q - self.arm_home).max() < 0.08
            if near and has_frame:
                ok = self.fresh_cands(obs)
                if ok and self.cands:
                    self.phase["empty"] = 0
                    self._goto("approach")
                elif ok and not self.cands:
                    self.phase["empty"] = self.phase.get("empty", 0) + 1
                    if self.phase["empty"] >= 3:
                        self._goto("done")
                    else:
                        self._goto("wait_empty")
            elif dt > 5.0:
                self._goto("done")
        elif st == "wait_empty":
            self.q_cmd = np.clip(self.q + np.clip(self.arm_home - self.q,
                                                 -0.04, 0.04), self.qlim_lo,
                                 self.qlim_hi)
            if dt > 0.22:
                self._goto("scan_pose")
        elif st == "done":
            self.mag = 0.0
            self.hold()
        elif st == "approach":
            if self.cands:
                z, x, y = self.cands[0]
                self.phase["z_surf"] = z
                self.target_p = np.array([x, y, min(0.44, z + 0.095)])
                self.dbg["pick"] = (x, y, z)
                n, er = self.servo(self.target_p, self.R_down, 1.15, 2.8)
                if self.mag > 0:
                    self.mag = 0.0
                if n < 0.012 and er < 0.10:
                    self._goto("settle_pick")
                elif dt > 2.5:
                    self.failed.append((x, y))
                    self.cands = self.cands[1:]
                    if not self.cands:
                        self._goto("scan_pose")
            else:
                self._goto("scan_pose")
        elif st == "settle_pick":
            self.servo(self.target_p, self.R_down, 0.15, 0.8)
            if dt > 0.10:
                self.set_baseline()
                zs = self.phase["z_surf"]
                self.phase["zmin"] = max(self.bin_floor_z + 0.004, zs - 0.09)
                self._goto("descend_fast")
        elif st == "descend_fast":
            zf = max(self.phase["zmin"], self.phase["z_surf"] + 0.018)
            self.target_p = np.array([self.target_p[0], self.target_p[1], zf])
            n, er = self.servo(self.target_p, self.R_down, 0.34, 3.0)
            if (n < 0.010 or dt > 0.8):
                self._goto("descend_pick")
            elif self.ft_delta() > 7.0:
                self._start_lift()
        elif st == "descend_pick":
            z = max(self.phase["zmin"], self.target_p[2] - 0.09 * 0.05)
            self.target_p = np.array([self.target_p[0], self.target_p[1], z])
            self.servo(self.target_p, self.R_down, 0.11, 1.2)
            self.dbg["df_pick"] = self.ft_delta()
            if self.ft_delta() > FT_CONTACT or z <= self.phase["zmin"] + 1e-6:
                self._start_lift()
        elif st == "lift_pick":
            self.target_p = np.array([self.target_p[0], self.target_p[1],
                                      self.phase["z_lift"]])
            n, er = self.servo(self.target_p, self.R_down, 0.65, 3.0, jvmax=2.6)
            if n < 0.010 or dt > 1.0:
                self._goto("check")
        elif st == "check":
            self.servo(self.target_p, self.R_down, 0.10, 0.6)
            if dt > 0.10 and self.ft_stable():
                d = self.payload()
                self.hold_delta = d
                self.deliveries.append(dict(t=round(self.t, 2), d=round(float(d), 2),
                                            x=round(float(self.target_p[0]), 3),
                                            y=round(float(self.target_p[1]), 3),
                                            zs=round(float(self.phase.get("z_surf", 0)), 3)))
                if d > 20.0:
                    # jammed against the pile/wall: let go before hurting anything
                    self.mag = 0.0
                    self.failed.append((self.target_p[0], self.target_p[1]))
                    self.cands = self.cands[1:] if self.cands else []
                    self._goto("lift_pick")
                elif d > FT_PAYLOAD:
                    self.grabs += 1
                    self.failed = []
                    self.phase["n_est"] = int(round(d / 3.03))
                    self.phase["dd_x"] = float(self.target_p[0])
                    self.phase["dd_y"] = float(self.target_p[1])
                    if self.phase["n_est"] >= 3:
                        # never deliver 3+ to the nest: put it back and retry
                        self.multi += 1
                        self.failed.append((self.target_p[0], self.target_p[1]))
                        self.cands = self.cands[1:] if self.cands else []
                        self._goto("dd_place")
                    elif self.phase["n_est"] >= 2:
                        self.multi += 1
                        self._goto("carry")
                    else:
                        self._goto("carry")
                else:
                    self.mag = 0.0
                    self.failed.append((self.target_p[0], self.target_p[1]))
                    self.cands = self.cands[1:] if self.cands else []
                    self._goto("approach" if self.cands else "scan_pose")
            elif dt > 0.5:
                self.phase["n_est"] = 0
                self.mag = 0.0
                self.failed.append((self.target_p[0], self.target_p[1]))
                self.cands = self.cands[1:] if self.cands else []
                self._goto("approach" if self.cands else "scan_pose")
        elif st == "reject_double":
            zslow = max(self.bin_floor_z + 0.045,
                        float(self.phase.get("z_surf", 0.15)) + 0.05)
            zf = max(zslow, float(self.target_p[2]) - 0.30 * 0.05)
            self.target_p = np.array([self.target_p[0], self.target_p[1], zf])
            self.servo(self.target_p, self.R_down, 0.30, 2.0)
            df = float(np.linalg.norm(self.ft_mean() - self.base_carry))
            if df > 1.4 or self.target_p[2] <= zslow + 1e-6:
                self.mag = 0.0
                self._goto("reject_up")
        elif st == "reject_up":
            tp = np.array([self.target_p[0], self.target_p[1],
                           min(0.44, self.target_p[2] + 0.20)])
            self.target_p = tp
            self.servo(tp, self.R_down, 0.4, 2.0)
            if dt > 0.35:
                self.failed.append((tp[0], tp[1]))
                self.cands = self.cands[1:] if self.cands else []
                self._goto("approach" if self.cands else "scan_pose")
        elif st == "carry":
            tp = np.array([self.zone_xy[0], self.zone_xy[1], 0.38])
            n, er = self.servo(tp, self.R_down, 1.4, 3.2, jvmax=2.6)
            if (n < 0.012 and er < 0.10) or dt > 1.5:
                self.target_p = tp.copy()
                self._goto("pre_place")
        elif st == "pre_place":
            tp = np.array([self.zone_xy[0], self.zone_xy[1], 0.24])
            n, er = self.servo(tp, self.R_down, 0.80, 1.8)
            self.target_p = tp.copy()
            if n < 0.015 or dt > 0.7:
                self._goto("settle_place")
        elif st == "settle_place":
            self.servo(self.target_p, self.R_down, 0.15, 0.8)
            if dt > 0.08:
                self.set_baseline()
                self.phase["zmin"] = self.belt_top + 0.006
                self._goto("descend_fast_place")
        elif st == "descend_fast_place":
            zf = self.belt_top + 0.065
            self.target_p = np.array([self.target_p[0], self.target_p[1], zf])
            n, er = self.servo(self.target_p, self.R_down, 0.35, 2.0)
            if n < 0.010 or dt > 0.40 or self.ft_delta() > 8.0:
                self._goto("descend_place")
        elif st == "descend_place":
            z = max(self.phase["zmin"], self.target_p[2] - 0.055 * 0.05)
            self.target_p = np.array([self.target_p[0], self.target_p[1], z])
            self.servo(self.target_p, self.R_down, 0.08, 1.4)
            self.dbg["df_place"] = self.ft_delta()
            if self.ft_delta() > 1.0 or z <= self.phase["zmin"] + 1e-6:
                self.mag = 0.0
                self.picks_done += 1
                if self.phase.get("n_est", 1) >= 2:
                    self._goto("dd_wait")
                else:
                    self._goto("retreat")
        elif st == "dd_wait":
            # let the freshly released stack settle, then pull the extra out
            self.servo(self.target_p, self.R_down, 0.15, 0.8)
            if dt > 0.25:
                self._goto("dd_down")
        elif st == "dd_down":
            offs = [(0.0, 0.0), (0.04, 0.0), (-0.04, 0.0),
                    (0.0, 0.04), (0.0, -0.04)]
            k = min(int(self.phase.get("dd_probe", 0)), len(offs) - 1)
            ox, oy = offs[k]
            tp = np.array([self.zone_xy[0] + ox, self.zone_xy[1] + oy,
                           self.belt_top + 0.085])
            n, er = self.servo(tp, self.R_down, 0.35, 2.0)
            self.target_p = tp.copy()
            if n < 0.012 or dt > 0.45:
                self.mag = 255.0
                self._goto("dd_feel")
                self.phase["zmin"] = self.belt_top + 0.010
                self.set_baseline()
        elif st == "dd_feel":
            z = max(self.phase["zmin"], self.target_p[2] - 0.055 * 0.05)
            self.target_p = np.array([self.target_p[0], self.target_p[1], z])
            self.servo(self.target_p, self.R_down, 0.06, 1.2)
            if self.ft_delta() > 1.2:
                self.phase["z_lift"] = z
                self._goto("dd_lift")
            elif z <= self.phase["zmin"] + 1e-6:
                if int(self.phase.get("dd_probe", 0)) < 4:
                    self.phase["dd_probe"] = int(self.phase.get("dd_probe", 0)) + 1
                    self._goto("dd_down")
                else:
                    self.phase["z_lift"] = z
                    self._goto("dd_lift")
        elif st == "dd_lift":
            zp = min(0.34, self.phase["z_lift"] + 0.20)
            self.target_p = np.array([self.target_p[0], self.target_p[1], zp])
            n, er = self.servo(self.target_p, self.R_down, 0.35, 2.0)
            if n < 0.010 or dt > 0.7:
                self.set_baseline()
                self._goto("dd_hold")
        elif st == "dd_hold":
            self.servo(self.target_p, self.R_down, 0.08, 0.5)
            if dt > 0.75:
                self.phase["n_est"] = 0
                self.phase["dd_probe"] = 0
                self._goto("dd_return")
        elif st == "dd_place":
            # big stack: carry it back over the bin (stays pickable)
            bx = float(self.phase.get("dd_x", 0.47))
            by = float(self.phase.get("dd_y", -0.27))
            tp = np.array([bx, by, 0.38])
            n, er = self.servo(tp, self.R_down, 1.4, 3.0, jvmax=2.6)
            if (n < 0.025 and er < 0.18) or dt > 1.5:
                self.target_p = tp.copy()
                self._goto("dd_release")
        elif st == "dd_release":
            zr = max(0.26, float(self.phase.get("z_surf", 0.15)) + 0.06)
            tp = np.array([self.target_p[0], self.target_p[1], zr])
            n, er = self.servo(tp, self.R_down, 0.55, 1.6)
            self.target_p = tp.copy()
            if n < 0.015 or dt > 0.8:
                self.mag = 0.0
                self._goto("dd_up")
        elif st == "dd_up":
            tp = np.array([self.target_p[0], self.target_p[1], 0.40])
            self.servo(tp, self.R_down, 0.7, 2.0)
            if dt > 0.45:
                self._goto("retreat")
        elif st == "dd_return":
            # put the de-doubled extra back into the nest after the other
            # part has been carried away
            tp = np.array([self.zone_xy[0], self.zone_xy[1],
                           self.phase.get("z_lift", self.belt_top + 0.05)])
            n, er = self.servo(tp, self.R_down, 0.35, 2.0)
            self.target_p = tp.copy()
            if n < 0.012 or dt > 0.7:
                self.mag = 0.0
                self._goto("retreat")
        elif st == "retreat":
            tp = np.array([self.zone_xy[0], self.zone_xy[1], 0.40])
            self.servo(tp, self.R_down, 0.7, 2.4)
            if dt > 0.22:
                self._goto("survey")
        elif st == "survey":
            # hold clear of the bin; the overhead camera sees the bin
            # unobstructed from here, so rescan without a home trip
            self.hold()
            if has_frame:
                ok = self.fresh_cands(obs)
                if ok and self.cands:
                    self.failed = []
                    self._goto("approach")
                elif ok:
                    self.phase["empty"] = self.phase.get("empty", 0) + 1
                    self._goto("scan_pose")
            elif dt > 0.35:
                self._goto("scan_pose")
        else:
            self.hold()
        return self._out()

    def _start_lift(self):
        self.mag = 255.0
        self.phase["z_lift"] = min(0.40, self.target_p[2] + 0.22)
        self._goto("lift_pick")

    def _goto(self, st):
        self.state = st
        self.state_t = self.t

    def _out(self):
        ctrl = np.zeros(8)
        ctrl[:7] = self.q_cmd
        ctrl[7] = self.mag
        return ctrl


def make_policy():
    return Policy()
