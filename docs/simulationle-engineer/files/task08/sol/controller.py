import os

os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'

import numpy as np
import mujoco
from scipy.optimize import least_squares
from scipy.spatial import ConvexHull


class Controller:
    def reset(self, context, seed):
        self.model = mujoco.MjModel.from_binary_path(context['model_file'])
        self.data = mujoco.MjData(self.model)
        self.data.qpos[:] = context['qpos']
        self.data.qvel[:] = context['qvel']
        self.initial = np.array(context['qpos'], dtype=float)
        self.controls = np.array(context['ctrl'], dtype=float)
        self.arm = context['arm']
        self.target = np.array(context['target'], dtype=float)
        self.aim = self.target.copy()
        self.aim[0] -= .022
        if self.target[2]<.5:
            self.aim[2] += .015
        self.arm_ids = np.array([self.model.actuator(name).id for name in context['arm_actuator_names']])
        self.wheel_ids = np.array([self.model.actuator(name).id for name in context['wheel_actuator_names']])
        joint_ids = np.array([self.model.joint(name).id for name in context['arm_joint_names']])
        self.addresses = self.model.jnt_qposadr[joint_ids]
        self.dofs = self.model.jnt_dofadr[joint_ids]
        self.ee = self.model.site(context['ee_site']).id
        base_joint = self.model.joint(context['base_joint']).id
        self.base_adr = self.model.jnt_qposadr[base_joint]
        self.base_dof = self.model.jnt_dofadr[base_joint]
        self.base_body = self.model.jnt_bodyid[base_joint]
        self.qstart = self.initial[self.addresses].copy()
        mujoco.mj_forward(self.model,self.data)
        root_body = self.model.body_parentid[self.model.jnt_bodyid[joint_ids[0]]]
        relative_rotation = self.data.xmat[self.base_body].reshape(3,3).T@self.data.xmat[root_body].reshape(3,3)
        root_yaw = np.arctan2(relative_rotation[1,0],relative_rotation[0,0])
        self.ur_seed_offset = np.arctan2(np.sin(np.pi-root_yaw),np.cos(np.pi-root_yaw))
        self.lower = np.maximum(self.model.jnt_range[joint_ids, 0], self.model.actuator_ctrlrange[self.arm_ids, 0]) + .015
        self.upper = np.minimum(self.model.jnt_range[joint_ids, 1], self.model.actuator_ctrlrange[self.arm_ids, 1]) - .015
        self.shelf = [index for index in range(self.model.ngeom) if self.model.geom(index).name.startswith('pod_')]
        arm_bodies = set(self.model.jnt_bodyid[joint_ids].tolist())
        descendants = set(arm_bodies)
        for body in range(1, self.model.nbody):
            if self.model.body_parentid[body] in descendants:
                descendants.add(body)
        self.moving = [index for index in range(self.model.ngeom) if self.model.geom_contype[index] and (self.model.geom_bodyid[index] in descendants or self.model.geom(index).name.startswith('arm_') or self.model.body(self.model.geom_bodyid[index]).name.startswith('arm_') or 'payload' in self.model.geom(index).name)]
        samples = []
        radii = []
        sample_geoms = []
        self.sample_starts = []
        for geom in self.moving:
            self.sample_starts.append(len(samples))
            shape = self.model.geom_type[geom]
            size = self.model.geom_size[geom]
            if shape == mujoco.mjtGeom.mjGEOM_MESH:
                mesh = self.model.geom_dataid[geom]
                start = self.model.mesh_vertadr[mesh]
                vertices = self.model.mesh_vert[start:start+self.model.mesh_vertnum[mesh]].astype(float)
                _, indices = np.unique(np.round(vertices/.02), axis=0, return_index=True)
                surface = vertices[indices]
                hull = ConvexHull(vertices)
                axes = [np.arange(vertices[:,axis].min(), vertices[:,axis].max()+.0175, .035) for axis in range(3)]
                grid = np.stack(np.meshgrid(*axes, indexing='ij'), axis=-1).reshape(-1, 3)
                grid = grid[np.max(grid@hull.equations[:,:3].T+hull.equations[:,3], axis=1) <= .002]
                points = np.r_[surface, grid]
                radius = np.r_[np.full(len(surface), .013), np.full(len(grid), .021)]
            elif shape == mujoco.mjtGeom.mjGEOM_CAPSULE:
                points = np.zeros((17, 3))
                points[:, 2] = np.linspace(-size[1], size[1], 17)
                radius = np.full(17, size[0]+.002)
            elif shape == mujoco.mjtGeom.mjGEOM_CYLINDER:
                points = np.zeros((1, 3))
                radius = np.array([np.hypot(size[0],size[1])])
            else:
                points = np.zeros((1, 3))
                radius = np.array([size[0]])
            samples.extend(points)
            radii.extend(radius)
            sample_geoms.extend([geom]*len(points))
        self.samples = np.array(samples)
        self.radii = np.array(radii)
        self.sample_geoms = np.array(sample_geoms)
        self.moving_set = set(self.moving)
        self.shelf_set = set(self.shelf)
        self.jacobian = np.zeros((3, self.model.nv))
        self.rot_jacobian = np.zeros((3, self.model.nv))
        self.plan(seed)
        self.last_wheels = np.zeros(4)
        self.travel_started = False

    def plan(self, seed):
        count = len(self.addresses)
        desired = self.aim.copy()
        lower = np.r_[self.lower, -.12, -.55]
        upper = np.r_[self.upper, .105, .55]
        nominal = np.r_[self.qstart, .085, self.target[1]]
        reference = nominal.copy()
        self.data.qvel[:] = 0
        panel_sizes = self.model.geom_size[self.shelf].copy()
        panel_positions = self.model.geom_pos[self.shelf].copy()
        panel_sizes[:, 0] += .4
        panel_positions[:, 0] += .4
        required_clearance = np.full(len(self.shelf),.016)
        if self.target[2]<.5:
            for index,panel in enumerate(self.shelf):
                if self.model.geom(panel).name=='pod_plate_0':
                    required_clearance[index] = .04

        def residual(configuration):
            self.data.qpos[:] = self.initial
            self.data.qpos[self.addresses] = configuration[:count]
            self.data.qpos[self.base_adr:self.base_adr+2] = configuration[count:]
            mujoco.mj_forward(self.model, self.data)
            position = self.data.site_xpos[self.ee]
            normal = self.data.site_xmat[self.ee].reshape(3, 3)[:, 2]
            rotations = self.data.geom_xmat[self.sample_geoms].reshape(-1, 3, 3)
            points = np.einsum('nij,nj->ni', rotations, self.samples)+self.data.geom_xpos[self.sample_geoms]
            separation = np.abs(points[:,None,:]-panel_positions[None,:,:])-panel_sizes[None,:,:]
            distances = np.linalg.norm(np.maximum(separation,0),axis=2)+np.minimum(np.max(separation,axis=2),0)-self.radii[:,None]
            closest = np.minimum.reduceat(distances, self.sample_starts, axis=0)
            collision = np.maximum(required_clearance[None,:]-closest,0).ravel()
            internal = np.zeros(len(self.moving))
            for contact in self.data.contact:
                if contact.geom1 not in self.shelf_set and contact.geom2 not in self.shelf_set:
                    for geom in [contact.geom1,contact.geom2]:
                        if geom in self.moving_set:
                            slot = self.moving.index(geom)
                            internal[slot] = max(internal[slot],-contact.dist-.003)
            ground = np.maximum(.025-np.minimum.reduceat(points[:,2]-self.radii,self.sample_starts),0)
            center = self.data.subtree_com[self.base_body] - self.data.xpos[self.base_body]
            balance = np.r_[np.maximum(np.abs(center[:2]) - [.145, .16], 0),.25*max(abs(center[0])/.203+abs(center[1])/.25-.78,0)]
            return np.r_[25*(position-desired), .15*(normal-[1, 0, 0]), 60*collision, 60*internal, 40*ground, 8*balance, .018*(configuration[:count]-reference[:count]), .04*(configuration[count:]-reference[count:])]

        random = np.random.default_rng(seed)
        guesses = [nominal]
        if self.arm == 'panda':
            guesses += [np.r_[[0, .5, 0, -1.5, 0, 1.8, .8], .1, self.target[1]], np.r_[[0, 1, 0, -1.5, 0, .5, .8], .1, self.target[1]]]
            if self.target[2] < .5:
                side = 1 if self.target[1] >= 0 else -1
                guesses.insert(0,np.r_[[side*1.3653,1.7473,-side*.7711,-1.6546,side*.6911,3.6141,.785], .0855+self.target[0]-.68, self.target[1]-side*.2981])
        elif self.arm == 'xarm7':
            guesses += [np.r_[[0, .7, 0, 1.5, 0, 1., 0], .1, self.target[1]], np.r_[[0, 1.5, 0, 1.3, 0, -.5, 0], .1, self.target[1]]]
        else:
            guesses += [np.r_[[self.ur_seed_offset, -1.5, -1.5, -1.7, -1.5, 0], .1, self.target[1]], np.r_[[self.ur_seed_offset, -1., 1.5, -2., -1.5, 0], .1, self.target[1]]]
            if self.target[2]<.5:
                guesses.insert(0,np.r_[[-2.8545+self.ur_seed_offset,.9681,-1.1206,-2.6012,-1.9667,3.03382],-.1058+self.target[0]-.68,self.target[1]-.3043])
                guesses.insert(1,np.r_[[2.8545+self.ur_seed_offset,.9681,-1.1206,-2.6012,1.9667,3.03382],-.1058+self.target[0]-.68,self.target[1]+.3043])
        best = None
        best_safe = False
        for index in range(45):
            guess = guesses[index] if index < len(guesses) else np.r_[random.uniform(self.lower,self.upper), .095, self.target[1]]
            for joint in range(count):
                alternatives = guess[joint]+2*np.pi*np.arange(-2,3)
                valid = alternatives[(alternatives>=self.lower[joint]) & (alternatives<=self.upper[joint])]
                if len(valid):
                    guess[joint] = valid[np.argmin(np.abs(valid-self.qstart[joint]))]
            guess = np.clip(guess, lower+.0001, upper-.0001)
            result = least_squares(residual, guess, bounds=(lower, upper), max_nfev=160, ftol=1e-5, xtol=1e-5, gtol=1e-5, diff_step=1e-4)
            for joint in range(count):
                alternatives = result.x[joint] + 2*np.pi*np.arange(-2, 3)
                valid = alternatives[(alternatives>=self.lower[joint]) & (alternatives<=self.upper[joint])]
                result.x[joint] = valid[np.argmin(np.abs(valid-self.qstart[joint]))]
            value = np.linalg.norm(residual(result.x))
            safe = self.path_safe(result.x[:count])
            if best is None or (safe and not best_safe) or (safe==best_safe and value<best[0]):
                best = (value, result.x.copy())
                best_safe = safe
            if safe and value < .12:
                break
        self.qgoal = best[1][:count]
        self.base_goal = best[1][count:]
        self.plan_score = best[0]
        self.command = self.qstart.copy()

    def path_safe(self, goal):
        for fraction in np.linspace(0,1,21):
            self.data.qpos[:] = self.initial
            self.data.qpos[self.addresses] = self.qstart+fraction*(goal-self.qstart)
            mujoco.mj_forward(self.model,self.data)
            center = self.data.subtree_com[self.base_body]-self.data.xpos[self.base_body]
            if np.any(np.abs(center[:2])>[.17,.18]):
                return False
            if abs(center[0])/.203+abs(center[1])/.25>.94:
                return False
            for contact in self.data.contact:
                if (contact.geom1 in self.moving_set or contact.geom2 in self.moving_set) and contact.dist<-.006:
                    return False
            rotations = self.data.geom_xmat[self.sample_geoms].reshape(-1,3,3)
            points = np.einsum('nij,nj->ni',rotations,self.samples)+self.data.geom_xpos[self.sample_geoms]
            if np.min(points[:,2]-self.radii)<.018:
                return False
        return True

    def act(self, observation):
        elapsed = float(observation['time'])
        self.data.qpos[:] = observation['qpos']
        self.data.qvel[:] = observation['qvel']
        mujoco.mj_forward(self.model, self.data)
        blend = np.clip((elapsed-.6)/8., 0., 1.)
        blend = blend*blend*(3-2*blend)
        desired = self.qstart + blend*(self.qgoal-self.qstart)
        if elapsed > 9.2 and np.max(np.abs(self.data.qpos[self.addresses]-self.qgoal)) < .08 and np.max(np.abs(self.data.qvel[self.dofs])) < .2:
            self.travel_started = True
        if self.travel_started:
            error = self.aim.copy()
            error -= self.data.site_xpos[self.ee]
            if np.linalg.norm(self.data.qpos[self.base_adr:self.base_adr+2]-self.base_goal) < (.035 if self.arm == 'ur5e' else .01):
                mujoco.mj_jacSite(self.model, self.data, self.jacobian, self.rot_jacobian, self.ee)
                jacobian = self.jacobian[:, self.dofs]
                correction = jacobian.T @ np.linalg.solve(jacobian@jacobian.T+.005*np.eye(3), error)
                correction -= .02*(self.command-self.qgoal)
                desired = np.clip(self.command+.10*correction,self.qgoal-.035,self.qgoal+.035)
                if not self.safe_correction(desired):
                    desired = self.qgoal.copy()
        self.command += np.clip(desired-self.command, -.016, .016)
        self.command = np.clip(self.command, self.lower, self.upper)
        compensation = self.data.qfrc_bias[self.dofs] / self.model.actuator_gainprm[self.arm_ids, 0]
        self.controls[self.arm_ids] = np.clip(self.command+compensation, self.lower, self.upper)
        base_position = self.data.qpos[self.base_adr:self.base_adr+2]
        base_rotation = self.data.xmat[self.base_body].reshape(3, 3)
        yaw = np.arctan2(base_rotation[1, 0], base_rotation[0, 0])
        goal = self.base_goal if self.travel_started else self.initial[self.base_adr:self.base_adr+2]
        world_velocity = np.clip(1.2*(goal-base_position), -.08, .08)
        if abs(goal[1]-base_position[1]) > .015:
            world_velocity[0] = np.clip(1.2*(self.initial[self.base_adr]-base_position[0]), -.04, .04)
        velocity = base_rotation[:2, :2].T @ world_velocity
        angular = np.clip(-2.5*yaw, -.25, .25)
        forward, lateral = velocity
        wheels = np.array([forward-lateral-.453*angular, forward+lateral+.453*angular, forward+lateral-.453*angular, forward-lateral+.453*angular])/.076
        self.last_wheels += np.clip(wheels-self.last_wheels, -.035, .035)
        self.controls[self.wheel_ids] = self.last_wheels
        return self.controls.tolist()

    def safe_correction(self, configuration):
        original = self.data.qpos[self.addresses].copy()
        self.data.qpos[self.addresses] = configuration
        mujoco.mj_forward(self.model,self.data)
        rotations = self.data.geom_xmat[self.sample_geoms].reshape(-1,3,3)
        points = np.einsum('nij,nj->ni',rotations,self.samples)+self.data.geom_xpos[self.sample_geoms]
        separation = np.abs(points[:,None,:]-self.model.geom_pos[self.shelf][None,:,:])-self.model.geom_size[self.shelf][None,:,:]
        distances = np.linalg.norm(np.maximum(separation,0),axis=2)+np.minimum(np.max(separation,axis=2),0)-self.radii[:,None]
        safe = np.min(distances)>.008
        self.data.qpos[self.addresses] = original
        mujoco.mj_forward(self.model,self.data)
        return safe


def make_controller():
    return Controller()
