import numpy as np
import mujoco
import cv2


class Policy:
    def reset(self, cell_spec, seed):
        cv2.setNumThreads(1)
        self.spec = cell_spec
        self.model = mujoco.MjModel.from_binary_path(cell_spec['model_file'])
        self.data = mujoco.MjData(self.model)
        self.site = self.model.site('arm_grip').id
        self.jacp = np.zeros((3, self.model.nv))
        self.jacr = np.zeros((3, self.model.nv))
        self.down = np.diag([1., -1., -1.])
        self.limits = self.model.actuator_ctrlrange[:7].copy()
        self.gains = self.model.actuator_gainprm[:7, 0].copy()
        self.damping_ratio = -self.model.actuator_biasprm[:7,2]/self.gains
        self.class_masses = .30888*np.asarray(cell_spec['part_length_scales'])
        self.state = 'init'
        self.mag = 0.
        self.frames = None
        self.samples = []
        self.bad = []
        self.recovery = False
        self.wrist_frame = None

    def fk(self, joints):
        self.data.qpos[:7] = joints
        self.data.qvel[:] = 0
        mujoco.mj_forward(self.model, self.data)
        return self.data.site_xpos[self.site].copy()

    def ik(self, pos, start):
        result, error = self.solve_ik(pos, start)
        if error > .003:
            home = np.asarray(self.spec['arm_home']).copy()
            home[0] = np.arctan2(pos[1], pos[0])
            candidate, residual = self.solve_ik(pos, home)
            if residual < error:
                result = candidate
        return result

    def solve_ik(self, pos, start):
        joints = start.copy()
        best_joints = joints.copy()
        best_error = float('inf')
        for iteration in range(85):
            current = self.fk(joints)
            rotation = self.data.site_xmat[self.site].reshape(3, 3)
            approach = rotation[:, 2]
            error_r = .5*(self.down[:, 2]-approach)
            error = np.r_[pos-current, error_r]
            residual = np.linalg.norm(error)
            if residual < best_error:
                best_joints, best_error = joints.copy(), residual
            if np.linalg.norm(error) < .00015:
                break
            mujoco.mj_jacSite(self.model, self.data, self.jacp, self.jacr, self.site)
            cross = np.array([[0., -approach[2], approach[1]], [approach[2], 0., -approach[0]], [-approach[1], approach[0], 0.]])
            jacobian = np.vstack([self.jacp[:, :7], -.5*cross @ self.jacr[:, :7]])
            delta = jacobian.T @ np.linalg.solve(jacobian @ jacobian.T + np.eye(6)*.0002, error)
            joints += delta * min(1., .14/max(.0001, np.max(np.abs(delta))))
            joints = np.clip(joints, self.limits[:, 0]+.001, self.limits[:, 1]-.001)
        return best_joints, best_error

    def move(self, obs, target, duration, next_state):
        goal = self.ik(np.array(target), np.array(obs['qpos']))
        self.move_joints(obs, goal, duration, next_state)

    def move_joints(self, obs, goal, duration, next_state):
        self.start_q = np.array(obs['qpos']).copy()
        self.goal_q = np.asarray(goal).copy()
        self.start_t = obs['t']
        self.duration = duration
        self.next_state = next_state
        self.state = 'move'

    def pick_target(self):
        rgb, depth = self.frames
        depth = cv2.medianBlur(np.nan_to_num(depth, nan=3.).astype(np.float32), 5)
        intr = np.asarray(self.spec['overhead_K'])
        cam = np.asarray(self.spec['overhead_T_world_cam'])
        rows, cols = np.indices(depth.shape)
        world_x = cam[0, 3] + (cols-intr[0, 2])*depth/intr[0, 0]
        world_y = cam[1, 3] - (rows-intr[1, 2])*depth/intr[1, 1]
        world_z = cam[2, 3]-depth
        color = rgb.astype(float)
        lo, hi = np.array(self.spec['bin_lo']), np.array(self.spec['bin_hi'])
        valid = ((color[:, :, 0] > .83*color[:, :, 1]) &
                 (color[:, :, 2] > .83*color[:, :, 1]) &
                 (world_x > lo[0]+.023) & (world_x < hi[0]-.023) &
                 (world_y > lo[1]+.023) & (world_y < hi[1]-.023) &
                 (world_z > lo[2]+.004) & (world_z < .36))
        valid = cv2.erode(valid.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        if valid.sum() < 6:
            return None
        score = world_z.copy()
        for point in self.bad[-4:]:
            score -= .08*np.exp(-((world_x-point[0])**2+(world_y-point[1])**2)/.0016)
        score[~valid] = -10
        row, col = np.unravel_index(np.argmax(score), score.shape)
        point = np.array([world_x[row, col], world_y[row, col], world_z[row, col]])
        delta_x, delta_y = world_x-point[0], world_y-point[1]
        patch = valid & (delta_x**2+delta_y**2 < .022**2) & (np.abs(world_z-point[2]) < .006)
        if patch.sum() >= 10:
            planar = np.column_stack([delta_x[patch], delta_y[patch]])
            values, vectors = np.linalg.eigh(np.cov(planar.T))
            if values[1] > 3.5*max(values[0], .000001):
                normal = vectors[:,0]
                along = delta_x*vectors[0,1]+delta_y*vectors[1,1]
                across = delta_x*normal[0]+delta_y*normal[1]
                heights = []
                for sign in (-1., 1.):
                    side = (np.abs(across-sign*.025) < .008) & (np.abs(along) < .018) & (world_z > lo[2]-.005)
                    heights.append(np.median(world_z[side]) if side.sum() else lo[2])
                sign = -1. if heights[0] < heights[1] else 1.
                point[:2] += sign*.012*normal
                point[:2] = np.clip(point[:2], lo[:2]+.023, hi[:2]-.023)
        return point

    def act(self, obs):
        if 'overhead_depth' in obs:
            self.frames = (obs['overhead_rgb'], obs['overhead_depth'])
        if 'wrist_depth' in obs:
            self.wrist_frame = (obs['wrist_rgb'], obs['wrist_depth'], obs['wrist_T_world_cam'])
        joints = np.asarray(obs['qpos'])
        tip = self.fk(joints)
        command = getattr(self, 'hold_q', joints).copy()
        state = self.state
        if state == 'init':
            self.move(obs, [.45, .08, .48], 1.2, 'select')
        elif state == 'move':
            progress = np.clip((obs['t']-self.start_t)/self.duration, 0, 1)
            smooth = progress**3*(10-15*progress+6*progress**2)
            command = self.start_q + smooth*(self.goal_q-self.start_q)
            velocity = (self.goal_q-self.start_q)*30*progress**2*(1-progress)**2/self.duration
            command += self.damping_ratio*velocity
            settled = np.max(np.abs(joints-self.goal_q)) < .055 and np.linalg.norm(obs['qvel']) < .4
            if progress >= 1 and (settled or obs['t']-self.start_t > self.duration+.8):
                self.state = self.next_state
                self.state_t = obs['t']
                self.samples = []
                self.hold_q = self.goal_q.copy()
                if self.state == 'weigh':
                    self.weigh_enter = obs['t']
        elif state == 'select':
            self.target = self.pick_target()
            if self.target is not None:
                self.recovery = False
                self.mag = 255.
                self.move(obs, [*self.target[:2], .43], .85, 'approach')
            else:
                self.bad = []
                self.mag = 0.
                self.move(obs, [.43, .34, .43], .9, 'inspect')
        elif state == 'inspect':
            if obs['t']-self.state_t > .3:
                self.target = self.belt_target()
                if self.target is not None:
                    self.recovery = True
                    self.mag = 255.
                    self.move(obs, [*self.target[:2], .32], .6, 'approach')
                else:
                    self.move(obs, [.45, .08, .48], .8, 'select')
        elif state == 'approach':
            self.mag = 255.
            self.move(obs, self.target + [0, 0, .023], .55, 'descend')
        elif state == 'descend':
            elapsed = obs['t']-self.state_t
            desired_z = self.target[2] + .023 - elapsed*.045
            command = self.ik(np.r_[self.target[:2], max(self.target[2]-.012, desired_z)], joints)
            if desired_z < self.target[2]-.014 or (elapsed > .2 and (obs['ft'][2] > -3.0 or np.linalg.norm(obs['ft'][:3]) > 17)):
                self.move(obs, [*tip[:2], .36 if self.recovery else .43], .75, 'weigh')
        elif state == 'weigh':
            if obs['t']-self.weigh_enter > 3.5 and len(self.samples) < 8:
                self.down = np.diag([1., -1., -1.])
                self.move(obs, [.47, -.27, .30], .9, 'return_release')
                return self.output(self.start_q)
            if np.linalg.norm(obs['qvel']) > .15 or self.data.site_xmat[self.site].reshape(3,3)[2,2] > -.999:
                self.samples = []
                self.state_t = obs['t']
            else:
                self.samples.append(np.asarray(obs['ft']).copy())
            stable = len(self.samples) >= 8 and np.std(np.asarray(self.samples[-7:])[:, 2]) < .35
            if obs['t']-self.state_t > .70 and (stable or obs['t']-self.state_t > 1.8):
                wrench = np.mean(self.samples[-7:], axis=0)
                force = abs(wrench[2])
                self.payload = force/9.81-.67
                ambiguous = any(abs(self.payload-boundary) < .014 for boundary in (.2625, .3475, .414))
                if ambiguous and obs['t']-self.state_t < 1.15:
                    return self.output(command)
                if obs['t']-self.state_t >= 1.15:
                    wrench = np.mean(self.samples[-14:], axis=0)
                    self.payload = abs(wrench[2])/9.81-.67
                if self.payload < .10:
                    self.bad.append(self.target[:2].copy())
                    self.mag = 0
                    self.move(obs, [.45, .08, .48], .7, 'select')
                elif self.payload > .414:
                    self.shake_point = np.array([.45, -.27, max(.26, min(.32, self.target[2]+.07))])
                    angle = .78
                    tilt = np.array([[1, 0, 0], [0, np.cos(angle), -np.sin(angle)], [0, np.sin(angle), np.cos(angle)]])
                    self.down = tilt @ np.diag([1., -1., -1.])
                    self.move(obs, self.shake_point, .85, 'side_release')
                else:
                    self.class_id = int(np.argmin(abs(self.class_masses-self.payload)))
                    nest = self.spec['sort_nests'][self.class_id]
                    self.dest = (np.array(nest['lo'])+np.array(nest['hi']))/2
                    self.move(obs, [*self.dest[:2], .39], 1., 'place')
        elif state == 'side_release':
            self.mag = 0.
            if obs['t']-self.state_t > .3:
                self.bad.append(self.target[:2].copy())
                self.bad.append(self.shake_point[:2].copy())
                self.down = np.diag([1., -1., -1.])
                self.move(obs, [.45, .08, .48], .9, 'select')
        elif state == 'return_release':
            self.mag = 0
            self.bad.append(self.target[:2].copy())
            self.move(obs, [.45, .08, .48], .9, 'select')
        elif state == 'place':
            placement = np.r_[self.dest[:2], .25]
            self.move(obs, placement, .6, 'release')
        elif state == 'release':
            self.mag = 0
            self.target = self.pick_target()
            if self.target is not None:
                self.recovery = False
                self.move(obs, [*self.target[:2], .43], 1., 'approach')
            else:
                self.move(obs, [*self.dest[:2], .39], .7, 'select')
        if self.state == 'move' and state != 'move':
            command = self.start_q.copy()
        return self.output(command)

    def output(self, command):
        self.fk(command)
        command = command + self.data.qfrc_bias[:7]/self.gains
        return np.r_[np.clip(command, self.limits[:, 0], self.limits[:, 1]), self.mag]

    def belt_target(self):
        if self.wrist_frame is None:
            return None
        rgb, depth, transform = self.wrist_frame
        depth = cv2.medianBlur(np.nan_to_num(depth, nan=3.).astype(np.float32), 5)
        intr = np.asarray(self.spec['wrist_K'])
        rows, cols = np.indices(depth.shape)
        camera_points = np.stack([(cols-intr[0,2])*depth/intr[0,0], -(rows-intr[1,2])*depth/intr[1,1], -depth], axis=-1)
        transform = np.asarray(transform)
        points = camera_points @ transform[:3,:3].T + transform[:3,3]
        color = rgb.astype(float)
        valid = ((points[:,:,0] > .15) & (points[:,:,0] < .73) &
                 (points[:,:,1] > .318) & (points[:,:,1] < .49) &
                 (points[:,:,2] > self.spec['belt_top']+.007) & (points[:,:,2] < .24) &
                 (color[:,:,0] > .84*color[:,:,1]) & (color[:,:,0] < 1.16*color[:,:,1]) &
                 (color[:,:,2] > .84*color[:,:,1]) & (color[:,:,2] < 1.18*color[:,:,1]) &
                 (color[:,:,0] > 65))
        valid = cv2.erode(valid.astype(np.uint8), np.ones((3,3), np.uint8)).astype(bool)
        if valid.sum() < 6:
            return None
        score = np.where(valid, points[:,:,2], -10.)
        row, col = np.unravel_index(np.argmax(score), score.shape)
        return points[row,col].copy()


def make_policy():
    return Policy()
