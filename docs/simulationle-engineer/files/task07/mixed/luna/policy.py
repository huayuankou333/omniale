import numpy as np
import mujoco
from scipy.optimize import least_squares


class Policy:
    def reset(self, cell_spec, seed):
        self.spec = cell_spec
        self.model = mujoco.MjModel.from_binary_path(cell_spec['model_file'])
        self.data = mujoco.MjData(self.model)
        self.site = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_SITE, 'grip')
        self.arm = np.array(cell_spec['arm_home'], dtype=float)
        self.phase = 'scan'
        self.target = None
        self.target_class = 1
        self.last_frame = -1
        self.rng = np.random.default_rng(seed)
        self.count = 0
        self.frame_count = 0

    def _pose(self, q):
        self.data.qpos[:7] = q
        mujoco.mj_forward(self.model, self.data)
        return self.data.site_xpos[self.site].copy(), self.data.site_xmat[self.site].reshape(3, 3).copy()

    def _ik(self, pos, seed):
        target_R = np.diag([1., -1., -1.])
        def residual(q):
            p, R = self._pose(q)
            orient = (R - target_R).reshape(-1)
            return np.r_[((p-pos)*4.0), orient*0.5, (q-seed)*0.015]
        sol = least_squares(residual, seed, max_nfev=35, ftol=0.02)
        return sol.x

    def _find_target(self, obs):
        d = obs.get('overhead_depth')
        if d is None:
            return None
        lo = np.asarray(self.spec['bin_lo']); hi = np.asarray(self.spec['bin_hi'])
        K = np.asarray(self.spec['overhead_K']); T = np.asarray(self.spec['overhead_T_world_cam'])
        ys, xs = np.where(np.isfinite(d) & (d > 0.2) & (d < 1.0))
        if len(xs) == 0: return None
        z = d[ys, xs]
        cam = np.stack([(xs-K[0,2])*z/K[0,0], (K[1,2]-ys)*z/K[1,1], -z, np.ones_like(z)], axis=0)
        # Camera optical axis is local -z; depth is positive range.
        world = T @ cam
        inside = ((world[0] >= lo[0]+.025)&(world[0] <= hi[0]-.025)&
                  (world[1] >= lo[1]+.025)&(world[1] <= hi[1]-.025))
        if not inside.any(): return None
        # Highest visible surface, with deterministic spatial tie-breaking.
        ids = np.where(inside)[0]
        topz = world[2, ids]
        zmax = np.nanmax(topz)
        cand = ids[topz > zmax-.012]
        k = cand[len(cand)//2]
        return np.array([world[0,k], world[1,k], world[2,k]+.008])

    def act(self, obs):
        q = np.asarray(obs['qpos'], dtype=float)
        t = float(obs['t'])
        self.frame_count += 1
        if self.phase == 'scan':
            target = self._find_target(obs)
            if target is not None:
                self.target = target
                self.pick_q = self._ik(target + [0,0,.20], q)
                self.touch_q = self._ik(target, self.pick_q)
                self.lift_q = self.pick_q
                self.drop_q = self._ik(np.array([.43,.38,.12+.197]), self.pick_q)
                self.phase = 'approach'
                self.phase_t = t
        if self.phase == 'scan': return np.r_[q, 0.]
        elapsed = t-self.phase_t
        if self.phase == 'approach':
            out = self.pick_q
            if elapsed > 1.0: self.phase='dive'; self.phase_t=t
            mag=0
        elif self.phase == 'dive':
            out=self.touch_q; mag=0
            if elapsed > .8: self.phase='hold'; self.phase_t=t
        elif self.phase == 'hold':
            out=self.touch_q; mag=255
            if elapsed > .35: self.phase='lift'; self.phase_t=t
        elif self.phase == 'lift':
            out=self.lift_q; mag=255
            if elapsed > 1.0: self.phase='carry'; self.phase_t=t
        elif self.phase == 'carry':
            out=self.drop_q; mag=255
            if elapsed > 1.2: self.phase='release'; self.phase_t=t
        elif self.phase == 'release':
            out=self.drop_q; mag=0
            if elapsed > .3: self.phase='retreat'; self.phase_t=t
        else:
            out=self.arm; mag=0
            if elapsed > .8:
                self.count += 1
                self.phase='scan'
        return np.r_[out, mag]


def make_policy():
    return Policy()
