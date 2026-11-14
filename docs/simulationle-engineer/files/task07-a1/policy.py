import os
import warnings
import numpy as np
import mujoco
import cv2
from scipy.spatial.transform import Rotation
from scipy.optimize import least_squares, minimize
from scipy.ndimage import median_filter, gaussian_filter


FLIP = np.diag([1., -1., -1.])


def box_dist(points, length):
    distances = []
    half = np.array([length / 2, .021, .0025])
    delta = np.abs(points) - half
    distances.append(np.linalg.norm(np.maximum(delta, 0), axis=1) + np.minimum(np.max(delta, axis=1), 0))
    for side in [-1, 1]:
        angle = np.pi / 2 + side * np.deg2rad(14)
        rotation = Rotation.from_rotvec([angle, 0, 0]).as_matrix()
        center = [0, side * (.022 + .017 * np.sin(np.deg2rad(14))), .015]
        local = (points - center) @ rotation
        delta = np.abs(local) - [length / 2, .017, .0025]
        distances.append(np.linalg.norm(np.maximum(delta, 0), axis=1) + np.minimum(np.max(delta, axis=1), 0))
    return np.min(np.abs(distances), axis=0)


def ray_depth(origins, directions, parameters, length):
    rotation = Rotation.from_euler('xyz', parameters[3:]).as_matrix()
    origins = (origins - parameters[:3]) @ rotation
    directions = directions @ rotation
    depths = []
    for side in [0, -1, 1]:
        if side == 0:
            center = np.zeros(3)
            box_rotation = np.eye(3)
            half = [length / 2, .021, .0025]
        else:
            box_rotation = Rotation.from_rotvec([np.pi / 2 + side * np.deg2rad(14), 0, 0]).as_matrix()
            center = [0, side * (.022 + .017 * np.sin(np.deg2rad(14))), .015]
            half = [length / 2, .017, .0025]
        local_origin = (origins - center) @ box_rotation
        local_direction = directions @ box_rotation
        inverse = 1 / np.where(np.abs(local_direction) > 1e-9, local_direction, 1e-9)
        near = (-np.array(half) - local_origin) * inverse
        far = (np.array(half) - local_origin) * inverse
        enter = np.max(np.minimum(near, far), axis=1)
        leave = np.min(np.maximum(near, far), axis=1)
        depths.append(np.where((leave >= enter) & (enter > 0), enter, 10.))
    return np.min(depths, axis=0)


class Policy:
    def reset(self, cell_spec, seed):
        self.spec = cell_spec
        self.model = mujoco.MjModel.from_binary_path(cell_spec['model_file'])
        self.data = mujoco.MjData(self.model)
        self.site = self.model.site('arm_grip').id
        self.qadr = np.array([self.model.joint('arm_joint%d' % index).qposadr[0] for index in range(1, 8)])
        self.dadr = np.array([self.model.joint('arm_joint%d' % index).dofadr[0] for index in range(1, 8)])
        self.lower = self.model.jnt_range[:7, 0] + .005
        self.upper = self.model.jnt_range[:7, 1] - .005
        self.jacp = np.zeros((3, self.model.nv))
        self.jacr = np.zeros((3, self.model.nv))
        self.state = 'start'
        self.start_t = 0
        self.mag = 0
        self.frames = {}
        self.queue = []
        self.target = None
        self.failures = []
        self.cycle = 0
        self.last_fit = None
        self.wrist_history = []
        self.hold = np.array(cell_spec['arm_home'])
        position, rotation = self.fk(self.hold)
        camera_id = self.model.camera('arm_wrist').id
        camera_rotation = self.data.cam_xmat[camera_id].reshape(3, 3)
        camera_position = self.data.cam_xpos[camera_id]
        self.camera_grip_position = camera_rotation.T @ (position - camera_position)
        self.camera_grip_rotation = camera_rotation.T @ rotation

    def ik_best(self, position, rotation, initial):
        seeds = [initial, np.array(self.spec['arm_home'])]
        home = np.array(self.spec['arm_home'])
        home[0] = np.arctan2(position[1], position[0])
        seeds += [home.copy()]
        best = None
        for seed in seeds:
            joints = self.ik(position, rotation, seed)
            actual, current = self.fk(joints)
            error = np.linalg.norm(actual - position) + .3 * np.linalg.norm(Rotation.from_matrix(rotation @ current.T).as_rotvec())
            cost = 1000 * error + np.max(np.abs(joints - initial)) + .1 * np.linalg.norm(joints - initial)
            if best is None or cost < best[0]:
                best = cost, joints, error
            if error < .0006 and np.max(np.abs(joints - initial)) < 1:
                break
        return best[1], best[2]

    def fk(self, qpos):
        self.data.qpos[self.qadr] = qpos
        mujoco.mj_forward(self.model, self.data)
        return self.data.site_xpos[self.site].copy(), self.data.site_xmat[self.site].reshape(3, 3).copy()

    def ik(self, position, rotation, initial):
        joints = initial.copy()
        for iteration in range(55):
            actual, current = self.fk(joints)
            error = np.r_[position - actual, Rotation.from_matrix(rotation @ current.T).as_rotvec() * .45]
            if np.linalg.norm(error) < .0002:
                break
            mujoco.mj_jacSite(self.model, self.data, self.jacp, self.jacr, self.site)
            jacobian = np.vstack([self.jacp[:, self.dadr], .45 * self.jacr[:, self.dadr]])
            change = jacobian.T @ np.linalg.solve(jacobian @ jacobian.T + np.eye(6) * .00015, error)
            joints = np.clip(joints + np.clip(change, -.18, .18), self.lower, self.upper)
        return joints

    def cloud(self, camera):
        depth = self.frames[camera + '_depth']
        intrinsic = np.array(self.spec[camera + '_K'])
        transform = np.array(self.frames['wrist_T_world_cam'] if camera == 'wrist' else self.spec[camera + '_T_world_cam'])
        rows, cols = np.indices(depth.shape)
        cloud = np.stack([(cols - intrinsic[0, 2]) * depth / intrinsic[0, 0], -(rows - intrinsic[1, 2]) * depth / intrinsic[1, 1], -depth], axis=-1)
        return cloud @ transform[:3, :3].T + transform[:3, 3]

    def select_pick(self):
        regions = [('inspection', (.225, .375, .48, .605, .128))]
        for nest in self.spec['sort_nests']:
            regions.append(('inspection', (nest['lo'][0], nest['hi'][0], .31, .45, .128)))
        regions.append(('overhead', (.315, .625, -.375, -.165, .119)))
        for camera, limits in regions:
            cloud = self.cloud(camera)
            rgb = self.frames[camera + '_rgb'].astype(float)
            gray = (np.max(rgb, axis=2) - np.min(rgb, axis=2)) < 36
            valid = np.isfinite(cloud).all(axis=2) & gray
            valid &= (cloud[:, :, 0] > limits[0]) & (cloud[:, :, 0] < limits[1]) & (cloud[:, :, 1] > limits[2]) & (cloud[:, :, 1] < limits[3]) & (cloud[:, :, 2] > limits[4]) & (cloud[:, :, 2] < .29)
            alternatives = valid.copy()
            for bad in self.failures[-4:]:
                alternatives &= np.linalg.norm(cloud[:, :, :2] - bad[:2], axis=2) > .045
            if np.sum(alternatives) > 100:
                valid = alternatives
            points = cloud[valid]
            if len(points) < 35:
                continue
            if camera == 'overhead':
                heights = cv2.medianBlur(np.nan_to_num(cloud[:, :, 2], nan=0).astype(np.float32), 3)
                histogram, edges = np.histogram(points[:, 2], bins=np.arange(.118, .29, .003))
                peaks = np.argsort(histogram)[-10:]
                best_web = None
                for peak in peaks:
                    level = (edges[peak] + edges[peak + 1]) / 2
                    planar = valid & (np.abs(heights - level) < .004)
                    planar = cv2.morphologyEx(planar.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
                    clearance = cv2.distanceTransform(planar, cv2.DIST_L2, 5)
                    clearance[~valid] = 0
                    row, col = np.unravel_index(np.argmax(clearance), clearance.shape)
                    meters = clearance[row, col] * (.98 - level) / self.spec['overhead_K'][0][0]
                    score = meters * (1 + 2 * (level - .12) / .15)
                    if meters > .007 and (best_web is None or score > best_web[0]):
                        best_web = score, row, col, level
                if best_web is not None:
                    _, row, col, level = best_web
                    pick = cloud[row, col].copy()
                    pick[2] = level
                    print('WEB', np.round(pick, 3), flush=True)
                    return pick, camera
            top = np.percentile(points[:, 2], 97)
            high = valid & (cloud[:, :, 2] > top - .009) & (cloud[:, :, 2] < top + .009)
            score = cv2.GaussianBlur(high.astype(np.float32), (0, 0), 4)
            for bad in self.failures[-5:]:
                score[np.linalg.norm(cloud[:, :, :2] - bad[:2], axis=2) < .025] *= .1
            score[~high] = 0
            row, col = np.unravel_index(np.argmax(score), score.shape)
            nearby = high & (np.linalg.norm(cloud[:, :, :2] - cloud[row, col, :2], axis=2) < .018)
            patch = cloud[nearby]
            if len(patch) < 5:
                continue
            pick = np.median(patch, axis=0)
            pick[2] = np.percentile(patch[:, 2], 35)
            pick[2] -= .003
            return pick, camera
        return None, None

    def fit_held(self, position, rotation):
        cloud = self.cloud('wrist').reshape(-1, 3)
        camera = np.array(self.frames['wrist_T_world_cam'])
        frame_position = camera[:3, 3] + camera[:3, :3] @ self.camera_grip_position
        frame_rotation = camera[:3, :3] @ self.camera_grip_rotation
        reference = frame_rotation @ FLIP
        points = (cloud - frame_position) @ reference
        valid = np.isfinite(points).all(axis=1) & (points[:, 2] < .005) & (points[:, 2] > -.14) & (np.linalg.norm(points[:, :2], axis=1) < .115)
        rgb = self.frames['wrist_rgb'].reshape(-1, 3).astype(float)
        steel = ((np.max(rgb, axis=1) - np.min(rgb, axis=1)) < 30) & (rgb[:, 0] > 40) & (rgb[:, 2] >= rgb[:, 0] - 3)
        valid &= steel
        points = points[valid]
        points = points[(np.linalg.norm(points[:, :2], axis=1) > .021) | (points[:, 2] < -.006)]
        if len(points) < 45:
            print('EMPTY', len(points), flush=True)
            return None
        points = points[::max(1, len(points) // 450)]
        self.held_cloud = points.copy()
        depth = self.frames['wrist_depth'][::2, ::2].reshape(-1)
        intrinsic = np.array(self.spec['wrist_K'])
        rows, cols = np.indices(self.frames['wrist_depth'][::2, ::2].shape)
        rays = np.stack([(cols * 2 - intrinsic[0, 2]) / intrinsic[0, 0], -(rows * 2 - intrinsic[1, 2]) / intrinsic[1, 1], -np.ones_like(rows)], axis=-1).reshape(-1, 3)
        camera = np.array(self.frames['wrist_T_world_cam'])
        origin = (camera[:3, 3] - frame_position) @ reference
        directions = rays @ camera[:3, :3].T @ reference
        observed = origin + directions * depth[:, None]
        plane = origin + directions * ((-.03 - origin[2]) / directions[:, 2])[:, None]
        valid_rays = np.isfinite(depth) & (np.linalg.norm(plane[:, :2], axis=1) < .12)
        valid_rays &= ~((observed[:, 2] > -.005) & (np.linalg.norm(observed[:, :2], axis=1) < .025))
        valid_rays &= observed[:, 2] < .006
        rgb_small = self.frames['wrist_rgb'][::2, ::2].reshape(-1, 3).astype(float)
        steel_small = ((np.max(rgb_small, axis=1) - np.min(rgb_small, axis=1)) < 30) & (rgb_small[:, 0] > 40) & (rgb_small[:, 2] >= rgb_small[:, 0] - 3)
        valid_rays &= (rgb_small[:, 0] - rgb_small[:, 2]) < 18
        directions = directions[valid_rays]
        depth = depth[valid_rays]
        steel_small = steel_small[valid_rays]
        origins = np.broadcast_to(origin, directions.shape)
        def image_loss(parameters, length):
            predicted = ray_depth(origins, directions, parameters, length)
            measured_foreground = (depth < .32) & steel_small
            predicted_foreground = predicted < .32
            mismatch = np.sum(measured_foreground != predicted_foreground) / max(1, np.sum(measured_foreground))
            common = measured_foreground & predicted_foreground
            depth_error = np.mean(np.minimum(np.abs(predicted[common] - depth[common]), .02)) if np.any(common) else .02
            return .01 * mismatch + .15 * depth_error
        center = np.median(points, axis=0)
        eigenvalues, eigenvectors = np.linalg.eigh(np.cov(points[:, :2].T))
        yaw = np.arctan2(eigenvectors[1, -1], eigenvectors[0, -1])
        candidates = []
        initial_poses = []
        for angle in list(np.arange(0, np.pi, np.pi / 6)) + [yaw, yaw + np.pi / 2]:
            initial_poses.append(np.r_[center[:2], np.percentile(points[:, 2], 25), 0., 0., angle])
        generator = np.random.default_rng(42)
        best_plane = None
        for iteration in range(100):
            sample = points[generator.choice(len(points), 3, replace=False)]
            normal = np.cross(sample[1] - sample[0], sample[2] - sample[0])
            normal /= max(1e-9, np.linalg.norm(normal))
            if normal[2] < 0:
                normal = -normal
            plane_distance = np.abs((points - sample[0]) @ normal)
            inliers = plane_distance < .0025
            count = np.sum(inliers)
            if best_plane is None or count > best_plane[0]:
                best_plane = count, normal, inliers
        _, normal, inliers = best_plane
        plane_points = points[inliers]
        plane_center = np.median(plane_points, axis=0)
        _, plane_axes = np.linalg.eigh(np.cov(plane_points.T))
        axis = plane_axes[:, -1]
        axis -= normal * (axis @ normal)
        axis /= max(1e-9, np.linalg.norm(axis))
        for sign in [1, -1]:
            facing = normal * sign
            base = np.column_stack([axis, np.cross(facing, axis), facing])
            for swap in [0, np.pi / 2]:
                plane_rotation = base @ Rotation.from_euler('z', swap).as_matrix()
                initial_poses.append(np.r_[plane_center - .0025 * facing, Rotation.from_matrix(plane_rotation).as_euler('xyz')])
                for side in [-1, 1]:
                    orientation = plane_rotation @ Rotation.from_euler('x', -(np.pi / 2 + side * np.deg2rad(14))).as_matrix()
                    offset = [0, side * (.022 + .017 * np.sin(np.deg2rad(14))), .015]
                    origin = plane_center - orientation @ offset
                    initial_poses.append(np.r_[origin, Rotation.from_matrix(orientation).as_euler('xyz')])
        for cls, length in enumerate([.0504, .072, .09]):
            for initial in initial_poses:
                initial = initial.copy()
                def residual(parameters):
                    orientation = Rotation.from_euler('xyz', parameters[3:]).as_matrix()
                    local = (points - parameters[:3]) @ orientation
                    return box_dist(local, length)
                initial[2] = np.clip(initial[2], -.09, 0)
                initial[:3] = np.clip(initial[:3], [-.119, -.119, -.119], [.119, .119, .009])
                result = least_squares(residual, initial, bounds=([-.12, -.12, -.12, -3.2, -1.58, -10], [.12, .12, .01, 3.2, 1.58, 10]), loss='soft_l1', f_scale=.002, max_nfev=35, diff_step=1e-4)
                distances = residual(result.x)
                score = np.mean(np.minimum(distances, .015) ** 2) ** .5
                rendered = image_loss(result.x, length)
                candidates.append((rendered, cls, result.x, np.mean(distances > .006), score))
                if rendered < .00055 and score < .003:
                    break
        candidates.sort(key=lambda value: value[0])
        refined = []
        for cls in ([] if candidates[0][0] < .00045 else range(3)):
            candidate = min((value for value in candidates if value[1] == cls), key=lambda value: value[0])
            parameters = candidate[2]
            length = [.0504, .072, .09][cls]
            scales = np.array([.008, .008, .004, .15, .15, .20])
            def objective(change):
                return image_loss(parameters + change * scales, length)
            result = minimize(objective, np.zeros(6), method='Powell', bounds=[(-1., 1.)] * 6, options={'maxiter': 3, 'maxfev': 160, 'xtol': .025, 'ftol': .001})
            final = parameters + result.x * scales
            distances = box_dist((points - final[:3]) @ Rotation.from_euler('xyz', final[3:]).as_matrix(), length)
            refined.append((objective(result.x), cls, final, np.mean(distances > .006), np.mean(np.minimum(distances, .015) ** 2) ** .5))
        candidates = sorted(candidates[:1] + refined, key=lambda value: value[0])
        rendered, cls, parameters, outliers, score = candidates[0]
        self.fit_ray_error = rendered
        body_rotation = rotation @ FLIP @ Rotation.from_euler('xyz', parameters[3:]).as_matrix()
        body_position = position + rotation @ FLIP @ parameters[:3]
        print('FIT', self.cycle, len(points), round(score, 4), 'ray', round(rendered, 5), cls, np.round(parameters, 3), round(outliers, 2), flush=True)
        return cls, body_position, body_rotation, score, outliers

    def move(self, position, rotation, duration, next_state, obs, mag=None):
        self.motion_start = obs['t']
        self.motion_duration = duration
        self.motion_from, self.rotation_from = self.fk(obs['qpos'])
        self.motion_to = np.array(position)
        self.rotation_to = rotation.copy()
        self.rotation_delta = Rotation.from_matrix(rotation @ self.rotation_from.T).as_rotvec()
        self.joint_from = obs['qpos'].copy()
        self.joint_to, error = self.ik_best(self.motion_to, rotation, self.joint_from)
        self.motion_duration = max(duration, np.max(np.abs(self.joint_to - self.joint_from)) * .75)
        print('MOVE', next_state, 'err', round(error, 4), 'dur', round(self.motion_duration, 2), flush=True)
        self.next_state = next_state
        self.state = 'moving'
        if mag is not None:
            self.mag = mag

    def act(self, obs):
        if 'wrist_depth' in obs:
            self.wrist_history.append((obs['t'], obs['wrist_depth'].copy()))
            self.wrist_history = self.wrist_history[-8:]
        for key in obs:
            if 'rgb' in key or 'depth' in key or key == 'wrist_T_world_cam':
                self.frames[key] = obs[key]
        now = obs['t']
        position, rotation = self.fk(obs['qpos'])
        command = self.hold.copy()
        if self.state == 'start':
            self.move([.43, -.20, .44], FLIP, 1.0, 'choose', obs, 0)
        elif self.state == 'choose':
            pick, camera = self.select_pick()
            if pick is not None:
                self.pick = pick
                self.pick_camera = camera
                self.cycle += 1
                candidates = []
                for yaw in [0, -np.pi/2, np.pi/2, np.pi, -np.pi/4, np.pi/4]:
                    candidate_rotation = Rotation.from_euler('z', yaw).as_matrix() @ FLIP
                    joints, error = self.ik_best(pick + [0, 0, .01], candidate_rotation, obs['qpos'])
                    candidates.append((error * 1000 + np.max(np.abs(joints - obs['qpos'])), candidate_rotation))
                self.pick_rotation = min(candidates, key=lambda value: value[0])[1]
                self.move([pick[0], pick[1], max(.36, pick[2] + .11)], self.pick_rotation, max(.5, np.linalg.norm(position[:2] - pick[:2]) / .65), 'approach', obs, 0)
            else:
                self.move([.43, -.20, .44], FLIP, .5, 'choose', obs, 0)
        elif self.state == 'approach':
            self.move(self.pick + [0, 0, .045], self.pick_rotation, max(.35, (position[2] - self.pick[2] - .045) / .28), 'touch', obs, 0)
        elif self.state == 'touch':
            self.mag = 255
            self.touch_start = now
            self.touch_z = position[2]
            self.state = 'descending'
        elif self.state == 'descending':
            target = np.array([*self.pick[:2], self.touch_z - .055 * (now - self.touch_start)])
            command = self.ik(target, self.pick_rotation, obs['qpos'])
            if obs['ft'][2] > 5 or now - self.touch_start > 1.55 or target[2] < self.pick[2] - .02:
                self.move([*self.pick[:2], .49], self.pick_rotation, .85, 'inspect', obs, 255)
        elif self.state == 'inspect':
            self.inspect_time = now
            self.state = 'inspect_wait'
        elif self.state == 'inspect_wait' and now - self.inspect_time >= .50:
            images = [image for stamp, image in self.wrist_history if stamp >= self.inspect_time]
            if len(images) >= 3:
                with warnings.catch_warnings():
                    warnings.simplefilter('ignore', RuntimeWarning)
                    self.frames['wrist_depth'] = np.nanmedian(np.stack(images), axis=0)
            payload = max(0, (-obs['ft'][2] - 6.9) / 9.81)
            if payload > .86:
                self.failures.append(self.pick.copy())
                self.drop_rotation = rotation.copy()
                self.drop_tool = np.array([.47, -.27, max(.24, self.pick[2] + .025)])
                self.move(self.drop_tool, rotation, .7, 'release', obs)
                return np.r_[self.hold, self.mag]
            fit = self.fit_held(position, rotation) if obs['ft'][2] < -8.4 else None
            if fit is None:
                self.failures.append(self.pick.copy())
                self.state = 'choose'
                self.mag = 0
            else:
                cls, body_position, body_rotation, score, outliers = fit
                payload = max(0, (-obs['ft'][2] - 6.9) / 9.81)
                if payload > .86 or self.fit_ray_error > .0035:
                    self.quarantine = True
                    self.failures.append(self.pick.copy())
                    self.drop_tool = np.array([.47, -.27, max(.24, self.pick[2] + .025)])
                    self.drop_rotation = rotation.copy()
                    self.move(self.drop_tool, rotation, .65, 'release', obs)
                    return np.r_[self.hold, self.mag]
                self.quarantine = False
                self.held_rel_position = rotation.T @ (body_position - position)
                self.held_rel_rotation = rotation.T @ body_rotation
                self.cls = cls
                target_yaw = self.spec['sort_nests'][cls]['target_yaw']
                nest = self.spec['sort_nests'][cls]
                self.drop_body = np.array([(nest['lo'][0] + nest['hi'][0]) / 2, .38, .124])
                candidates = []
                for yaw in [target_yaw, target_yaw + np.pi]:
                    desired_body_rotation = Rotation.from_euler('z', yaw).as_matrix()
                    desired_tool_rotation = desired_body_rotation @ self.held_rel_rotation.T
                    tool = self.drop_body - desired_tool_rotation @ self.held_rel_position
                    joints, error = self.ik_best(tool, desired_tool_rotation, obs['qpos'])
                    candidates.append((error * 1000 + np.max(np.abs(joints - obs['qpos'])), desired_tool_rotation, tool))
                _, self.drop_rotation, self.drop_tool = min(candidates, key=lambda value: value[0])
                _, placement_error = self.ik_best(self.drop_tool, self.drop_rotation, obs['qpos'])
                if placement_error > .006 or self.drop_rotation[2, 2] > 0:
                    self.failures.append(self.pick.copy())
                    self.drop_rotation = self.pick_rotation.copy()
                    self.drop_tool = np.array([.47, -.27, max(.24, self.pick[2] + .025)])
                    self.move(self.drop_tool, self.drop_rotation, 1.0, 'release', obs)
                    return np.r_[self.hold, self.mag]
                self.move(self.drop_tool + [0, 0, .20], self.drop_rotation, max(.8, np.linalg.norm(position - (self.drop_tool + [0, 0, .20])) / .7), 'place', obs)
        elif self.state == 'place':
            self.move(self.drop_tool + [0, 0, .003], self.drop_rotation, .65, 'release', obs)
        elif self.state == 'release':
            self.mag = 0
            self.release_time = now
            self.state = 'release_wait'
        elif self.state == 'release_wait' and now - self.release_time > .15:
            self.move(position + [0, 0, .18], rotation, .45, 'choose', obs, 0)
        if self.state == 'moving':
            fraction = np.clip((now - self.motion_start + .05) / self.motion_duration, 0, 1)
            smooth = fraction * fraction * (3 - 2 * fraction)
            velocity = 6 * fraction * (1 - fraction) / self.motion_duration
            command = self.joint_from + smooth * (self.joint_to - self.joint_from)
            command += .08 * velocity * (self.joint_to - self.joint_from)
            if fraction >= 1 and (np.linalg.norm(position - self.motion_to) < .012 or now - self.motion_start > self.motion_duration + .5):
                self.state = self.next_state
        self.hold = command.copy()
        return np.r_[command, self.mag]


def make_policy():
    return Policy()
