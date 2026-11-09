import cv2
import mujoco
import numpy as np
from scipy.spatial.transform import Rotation


class Policy:
    def reset(self, cell_spec, seed):
        cv2.setNumThreads(1)
        self.spec = cell_spec
        self.rng = np.random.default_rng(seed)
        self.model = mujoco.MjModel.from_binary_path(cell_spec['model_file'])
        self.data = mujoco.MjData(self.model)
        self.site = self.model.site('arm_grip').id
        self.jacp = np.zeros((3, self.model.nv))
        self.jacr = np.zeros((3, self.model.nv))
        self.home = np.array(cell_spec['arm_home'])
        self.qcmd = self.home.copy()
        self.rot = np.diag([1., -1., -1.])
        self.lo = np.array(cell_spec['bin_lo'])
        self.hi = np.array(cell_spec['bin_hi'])
        self.center = np.round((self.lo[:2] + self.hi[:2]) / 2, 6)
        self.rim = float(cell_spec['bin_top_z'])
        self.lift_z = round(self.rim + .158, 6)
        self.above_z = round(self.rim + .068, 6)
        self.look_pos = np.array([round(self.center[0]-.02, 6),
                                  round(self.hi[1]+.12, 6),
                                  round(self.rim+.138, 6)])
        self.tip_pos = np.r_[self.center, round(self.rim+.198, 6)]
        self.place_z = round(cell_spec['belt_top']+.073, 6)
        self.retract_z = round(cell_spec['belt_top']+.31, 6)
        self.zone = (np.array(cell_spec['zone_lo']) + cell_spec['zone_hi']) / 2
        self.zone[2] = self.lift_z
        self.K = np.array(cell_spec['overhead_K'])
        self.T = np.array(cell_spec['overhead_T_world_cam'])
        height, width = cell_spec['overhead_wh'][1], cell_spec['overhead_wh'][0]
        pixels_y, pixels_x = np.indices((height, width))
        self.rays = np.stack([(pixels_x-self.K[0, 2])/self.K[0, 0],
                              -(pixels_y-self.K[1, 2])/self.K[1, 1],
                              -np.ones((height, width))], axis=-1)
        self.state = 'init'
        self.start_t = 0.
        self.duration = 1.
        self.start_q = self.home.copy()
        self.target_q = self.home.copy()
        self.mag = 0.
        self.frame = None
        self.failures = []
        self.cycle = 0
        self.shakes = 0
        self.force_history = []
        self.norm_history = []
        self.discarded = False

    def fk(self, joints):
        self.data.qpos[:7] = joints
        mujoco.mj_kinematics(self.model, self.data)
        mujoco.mj_comPos(self.model, self.data)
        return self.data.site_xpos[self.site].copy()

    def ik(self, position, initial=None):
        joints = self.qcmd.copy() if initial is None else initial.copy()
        for iteration in range(100):
            point = self.fk(joints)
            current = self.data.site_xmat[self.site].reshape(3, 3)
            angular = Rotation.from_matrix(self.rot @ current.T).as_rotvec()
            error = np.r_[position-point, angular * .35]
            if np.linalg.norm(error) < .00015:
                break
            mujoco.mj_jacSite(self.model, self.data, self.jacp, self.jacr, self.site)
            jacobian = np.vstack([self.jacp[:, :7], self.jacr[:, :7]*.35])
            delta = jacobian.T @ np.linalg.solve(jacobian@jacobian.T + np.eye(6)*.0002, error)
            joints += delta * min(1., .18 / max(.0001, np.max(np.abs(delta))))
            joints = np.clip(joints, self.model.jnt_range[:7, 0]+.01, self.model.jnt_range[:7, 1]-.01)
        return joints

    def move(self, position, duration, state, obs, mag=None):
        self.start_q = self.qcmd.copy()
        self.target_q = self.ik(np.array(position))
        speed = 1.5 if state in ('center_tip', 'tip', 'untip') else 1.8
        self.duration = max(duration, np.max(np.abs(self.target_q-self.start_q)) / speed)
        self.start_pos = self.fk(self.start_q)
        self.start_rot = self.data.site_xmat[self.site].reshape(3, 3).copy()
        self.target_pos = np.array(position).copy()
        self.start_t = obs['t']
        self.state = state
        if mag is not None:
            self.mag = mag

    def perceive(self):
        if self.frame is None:
            return None
        rgb, depth = self.frame
        points = depth[..., None] * self.rays
        points = points @ self.T[:3, :3].T + self.T[:3, 3]
        colors = rgb.astype(float)
        mask = (np.max(colors, axis=2)-np.min(colors, axis=2) < 36)
        mask &= (colors[..., 0] > 45) & (colors[..., 2] > colors[..., 0]*.95)
        mask &= np.isfinite(depth)
        mask &= (points[..., 0] > self.lo[0]+.023) & (points[..., 0] < self.hi[0]-.023)
        mask &= (points[..., 1] > self.lo[1]+.023) & (points[..., 1] < self.hi[1]-.023)
        mask &= (points[..., 2] > self.lo[2]+.003) & (points[..., 2] < round(self.rim+.038, 6))
        mask = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
        if mask.sum() < 15:
            return None
        smooth = cv2.medianBlur(np.nan_to_num(depth, nan=2.).astype(np.float32), 5)
        z = self.T[2, 3] - smooth
        top = np.percentile(z[mask], 98)
        high = mask & (z > top-.012)
        distance = cv2.distanceTransform(high.astype(np.uint8), cv2.DIST_L2, 5)
        score = distance + (z-top)*100
        for failed in self.failures[-4:]:
            score -= 12 * np.exp(-((points[..., 0]-failed[0])**2+(points[..., 1]-failed[1])**2)/.00025)
        score[~high] = -1e6
        row, col = np.unravel_index(np.argmax(score), score.shape)
        target = points[row, col].copy()
        target[2] = z[row, col]
        return target

    def act(self, obs):
        if 'overhead_rgb' in obs:
            self.frame = (obs['overhead_rgb'], obs['overhead_depth'])
        time = obs['t']
        if self.state == 'init':
            self.qcmd = np.array(obs['qpos']).copy()
            self.move(self.look_pos, 1.1, 'look', obs, 0)
        elapsed = time-self.start_t
        fraction = np.clip(elapsed/self.duration, 0, 1)
        blend = fraction*fraction*(3-2*fraction)
        self.qcmd = self.start_q + blend*(self.target_q-self.start_q)
        if self.state in ('tip', 'untip'):
            final_rot = self.rot.copy()
            rotation_delta = Rotation.from_matrix(final_rot @ self.start_rot.T).as_rotvec()
            self.rot = Rotation.from_rotvec(blend*rotation_delta).as_matrix() @ self.start_rot
            self.qcmd = self.ik(self.start_pos + blend*(self.target_pos-self.start_pos), self.qcmd)
            self.rot = final_rot
        if self.state in ('approach', 'touch', 'lift', 'place', 'reject', 'discard_lower'):
            self.qcmd = self.ik(self.start_pos + blend*(self.target_pos-self.start_pos), self.qcmd)
        self.force_history.append(float(obs['ft'][2]))
        self.force_history = self.force_history[-8:]
        self.norm_history.append(float(np.linalg.norm(obs['ft'][:3])))
        self.norm_history = self.norm_history[-8:]
        if self.state == 'lift' and elapsed > .30 and np.linalg.norm(obs['ft'][:3]) > 55:
            self.failures.append(self.pick.copy())
            self.qcmd = np.array(obs['qpos']).copy()
            actual = self.fk(self.qcmd)
            self.move([actual[0], actual[1], self.lift_z], .7, 'rejected', obs, 0)
            return np.r_[self.qcmd, self.mag]
        if self.state == 'discard_lower' and elapsed > .25 and obs['ft'][2] > -8.0:
            self.qcmd = np.array(obs['qpos']).copy()
            actual = self.fk(self.qcmd)
            self.move([actual[0], actual[1], self.lift_z], .6, 'discard_retract', obs, 0)
            return np.r_[self.qcmd, self.mag]
        if self.state in ('approach', 'touch') and elapsed > .1:
            if obs['ft'][2] > 6 or np.linalg.norm(obs['ft'][:2]) > 15:
                self.qcmd = np.array(obs['qpos']).copy()
                self.move([self.pick[0], self.pick[1], self.lift_z], .7, 'lift', obs)
                self.force_history = []
                self.shakes = 0
                return np.r_[self.qcmd, self.mag]
        if self.state == 'place' and elapsed > .15 and obs['ft'][2] > 8:
            self.qcmd = np.array(obs['qpos']).copy()
            self.move([self.zone[0], self.zone[1], self.look_pos[2]], .55, 'retract', obs, 0)
            return np.r_[self.qcmd, self.mag]
        if elapsed >= self.duration+.10:
            if self.state == 'look':
                self.pick = self.perceive()
                if self.pick is not None:
                    self.discarded = False
                    self.rot = np.diag([1., -1., -1.])
                    self.move([self.pick[0], self.pick[1], max(self.above_z, self.pick[2]+.09)], .60, 'above', obs)
                else:
                    self.start_t = time
                    self.duration = .5
            elif self.state == 'above':
                self.move([self.pick[0], self.pick[1], self.pick[2]+.012], .40, 'approach', obs, 255)
            elif self.state == 'approach':
                self.move([self.pick[0], self.pick[1], max(self.lo[2]+.001, self.pick[2]-.012)], .45, 'touch', obs)
            elif self.state == 'touch':
                self.move([self.pick[0], self.pick[1], self.lift_z], .7, 'lift', obs)
                self.shakes = 0
                self.force_history = []
            elif self.state == 'lift':
                self.start_t = time
                self.duration = .20
                self.start_q = self.qcmd.copy()
                self.target_q = self.qcmd.copy()
                self.state = 'weigh'
                self.force_history = []
            elif self.state == 'weigh':
                weight = -np.median(self.force_history[-6:])
                if weight < 8.0:
                    self.failures.append(self.pick.copy())
                    self.move(self.look_pos, .7, 'look', obs, 0)
                elif weight > 11.2:
                    if self.shakes < 1:
                        self.shakes += 1
                        self.move(self.tip_pos, .45, 'center_tip', obs)
                    else:
                        self.move([self.pick[0], self.pick[1], self.pick[2]+.03], .65, 'reject', obs)
                else:
                    self.failures = []
                    self.move(self.zone, .9, 'transfer', obs)
            elif self.state == 'center_tip':
                self.rot = Rotation.from_euler('y', -110, degrees=True).as_matrix() @ np.diag([1., -1., -1.])
                self.move(self.tip_pos, .65, 'tip', obs)
            elif self.state == 'tip':
                self.state = 'tip_weigh'
                self.start_t = time
                self.duration = .2
                self.start_q = self.qcmd.copy()
                self.target_q = self.qcmd.copy()
                self.norm_history = []
            elif self.state == 'tip_weigh':
                weight = np.median(self.norm_history[-5:])
                if weight > 11.2:
                    self.discarded = True
                self.rot = np.diag([1., -1., -1.])
                self.move(self.tip_pos, .65, 'untip', obs)
            elif self.state == 'untip':
                if self.discarded:
                    self.failures.append(self.pick.copy())
                    self.move([self.center[0], self.center[1], self.lo[2]+.045], 1.5, 'discard_lower', obs)
                else:
                    self.state = 'weigh'
                    self.start_t = time
                    self.duration = .20
                    self.start_q = self.qcmd.copy()
                    self.target_q = self.qcmd.copy()
                    self.force_history = []
            elif self.state == 'reject':
                self.failures.append(self.pick.copy())
                self.move([self.pick[0], self.pick[1], self.look_pos[2]], .7, 'rejected', obs, 0)
            elif self.state == 'discard_lower':
                self.move([self.center[0], self.center[1], self.lift_z], .6, 'discard_retract', obs, 0)
            elif self.state == 'discard_retract':
                self.move(self.look_pos, .65, 'look', obs, 0)
            elif self.state == 'rejected':
                self.move(self.look_pos, .7, 'look', obs)
            elif self.state == 'transfer':
                self.move([self.zone[0], self.zone[1], self.place_z], .5, 'place', obs)
            elif self.state == 'place':
                self.mag = 0
                self.move([self.zone[0], self.zone[1], self.retract_z], .50, 'retract', obs)
            elif self.state == 'retract':
                self.cycle += 1
                self.state = 'look'
                self.start_t = time
                self.duration = .05
                self.start_q = self.qcmd.copy()
                self.target_q = self.qcmd.copy()
        return np.r_[self.qcmd, self.mag]


def make_policy():
    return Policy()
