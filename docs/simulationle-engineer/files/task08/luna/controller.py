import numpy as np
import mujoco


class Controller:
    def reset(self, context, seed):
        self.context = context
        self.model = mujoco.MjModel.from_binary_path(context['model_file'])
        self.data = mujoco.MjData(self.model)
        self.actuator_names = list(context['actuator_names'])
        self.arm_actuator_names = list(context['arm_actuator_names'])
        self.wheel_actuator_names = list(context['wheel_actuator_names'])
        self.act_ids = {name: i for i, name in enumerate(self.actuator_names)}
        self.site_id = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_SITE, context['ee_site'])
        self.joint_ids = [mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_JOINT, n)
                          for n in context['arm_joint_names']]
        self.qadr = [int(self.model.jnt_qposadr[j]) for j in self.joint_ids]
        self.dadr = [int(self.model.jnt_dofadr[j]) for j in self.joint_ids]
        self.base_joint = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_JOINT, context['base_joint'])
        self.base_qadr = int(self.model.jnt_qposadr[self.base_joint])
        self.qinit = np.asarray(context['qpos'], dtype=float)
        self.target = np.asarray(context['target'], dtype=float)
        self.arm = context['arm']
        self.limits = np.asarray([self.model.jnt_range[j] for j in self.joint_ids])
        self.arm_ctrl_indices = [self.act_ids[n] for n in self.arm_actuator_names]
        self.wheel_indices = [self.act_ids[n] for n in self.wheel_actuator_names]
        self.initial_arm = self.qinit[self.qadr].copy()
        # Plan in the fixed world frame from the intended staging pose.
        self.data.qpos[:] = self.qinit
        self.data.qpos[self.base_qadr:self.base_qadr + 7] = [-0.10, 0.0, 0.08, 1.0, 0.0, 0.0, 0.0]
        mujoco.mj_forward(self.model, self.data)
        first = self._ik(np.array([0.20, self.target[1], self.target[2] + 0.14]), self.initial_arm)
        second = self._ik(np.array([0.34, self.target[1], self.target[2] + 0.14]), first)
        final = self._ik(self.target.copy(), second)
        self.path = [first, second, final]
        self.stage_times = [4.0, 8.0, 13.0, 18.0]

    def _ik(self, goal, seed):
        q = np.asarray(seed, dtype=float).copy()
        jacp = np.zeros((3, self.model.nv))
        jacr = np.zeros((3, self.model.nv))
        for _ in range(180):
            self.data.qpos[self.qadr] = q
            mujoco.mj_forward(self.model, self.data)
            error = goal - self.data.site_xpos[self.site_id]
            if np.linalg.norm(error) < 0.008:
                break
            mujoco.mj_jacSite(self.model, self.data, jacp, jacr, self.site_id)
            jac = jacp[:, self.dadr]
            dq = jac.T @ np.linalg.solve(jac @ jac.T + 0.012 * np.eye(3), error)
            scale = max(1.0, np.max(np.abs(dq)) / 0.12)
            q = np.clip(q + dq / scale, self.limits[:, 0] + 0.015, self.limits[:, 1] - 0.015)
        return q

    def act(self, observation):
        t = float(observation['time'])
        qpos = np.asarray(observation['qpos'], dtype=float)
        controls = np.asarray(observation['ctrl'], dtype=float).copy()
        x = qpos[self.base_qadr]
        # Feedback-controlled forward translation; reverse the wheels to brake overshoot.
        drive = float(np.clip(18.0 * (-0.10 - x), -4.0, 4.0)) if t < 5.0 else 0.0
        for idx in self.wheel_indices:
            controls[idx] = drive
        if t < self.stage_times[0]:
            desired = self.initial_arm
        elif t < self.stage_times[1]:
            u = (t - self.stage_times[0]) / (self.stage_times[1] - self.stage_times[0])
            desired = self.initial_arm * (1.0 - u) + self.path[0] * u
        elif t < self.stage_times[2]:
            u = (t - self.stage_times[1]) / (self.stage_times[2] - self.stage_times[1])
            desired = self.path[0] * (1.0 - u) + self.path[1] * u
        elif t < self.stage_times[3]:
            u = (t - self.stage_times[2]) / (self.stage_times[3] - self.stage_times[2])
            desired = self.path[1] * (1.0 - u) + self.path[2] * u
        else:
            desired = self.path[2]
        for i, idx in enumerate(self.arm_ctrl_indices):
            controls[idx] = float(desired[i])
        return controls.tolist()


def make_controller():
    return Controller()
