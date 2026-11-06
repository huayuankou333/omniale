import numpy as np
from scipy import ndimage
from scipy.spatial.transform import Rotation


IMAGE_CENTER = 111.5
TABLE_Z = 0.92
BASE_FOCAL = 224.0 / (2.0 * np.tan(np.deg2rad(45.0) / 2.0))
BASE_CAMERA_POS = np.array([-1.3, 0.0, 2.2])
BASE_CAMERA_ROT = np.array([
    [0.0, 0.7071068, -0.7071068],
    [-1.0, 0.0, 0.0],
    [0.0, 0.7071068, 0.7071068],
])


def _component(image, kind):
    rgb = np.asarray(image, dtype=np.uint8)
    red = rgb[:, :, 0].astype(float)
    green = rgb[:, :, 1].astype(float)
    blue = rgb[:, :, 2].astype(float)
    if kind == "peg":
        mask = ((red > 125) & (green > 85) & (red > green * 1.04)
                & (green > blue * 1.12) & (red - blue > 65))
        mask[:55] = False
        mask[170:] = False
        mask[:, :92] = False
        mask[:, 205:] = False
    else:
        mask = ((blue > 45) & (blue > red * 1.15) & (blue > green * 1.0)
                & (blue - red > 20))
        mask[:75] = False
        mask[175:] = False
        mask[:, :35] = False
        mask[:, 112:] = False
    labels, count = ndimage.label(mask)
    if count == 0:
        return None, None
    areas = np.bincount(labels.ravel())
    areas[0] = 0
    label = int(np.argmax(areas))
    if areas[label] < 12:
        return None, None
    yy, xx = np.nonzero(labels == label)
    center = np.array([xx.mean(), yy.mean()])
    return center, np.column_stack((xx, yy))


def _base_point(pixel, height):
    if pixel is None:
        return None
    u, v = pixel
    ray_camera = np.array([(u - IMAGE_CENTER) / BASE_FOCAL,
                           -(v - IMAGE_CENTER) / BASE_FOCAL, -1.0])
    ray_world = BASE_CAMERA_ROT @ ray_camera
    if abs(ray_world[2]) < 1e-6:
        return None
    distance = (height - BASE_CAMERA_POS[2]) / ray_world[2]
    return BASE_CAMERA_POS + distance * ray_world


def _base_pixel(point):
    camera_point = BASE_CAMERA_ROT.T @ (np.asarray(point) - BASE_CAMERA_POS)
    depth = -camera_point[2]
    if depth <= 1e-6:
        return None
    return np.array([IMAGE_CENTER + BASE_FOCAL * camera_point[0] / depth,
                     IMAGE_CENTER - BASE_FOCAL * camera_point[1] / depth])


def _rotation(state, offset):
    q = state[offset + 3:offset + 7]
    return Rotation.from_quat([q[1], q[2], q[3], q[0]])


def _rotvec(rotation):
    return rotation.as_rotvec()


class AssemblyPolicy:
    def __init__(self):
        self.initialized = False
        self.peg_start = None
        self.tray_start = None
        self.peg_pixel = None
        self.tray_pixel = None
        self.peg_axis = np.array([1.0, 0.0, 0.0])
        self.peg_grasp_orientation = None
        self.peg_orientation = None
        self.insertion_started = False
        self.table_z = TABLE_Z
        self.contact_observations = 0
        self.retry_state = 0
        self.stationary_observations = 0
        self.retry_attempts = 0
        self.retry_offset = np.zeros(3)

    def _initialize(self, obs, state):
        self.table_z = TABLE_Z
        self.contact_observations = 0
        self.retry_state = 0
        self.stationary_observations = 0
        self.retry_attempts = 0
        self.retry_offset = np.zeros(3)
        self.peg_axis = np.array([1.0, 0.0, 0.0])
        peg_px, peg_pixels = _component(obs["base"], "peg")
        tray_px, _ = _component(obs["base"], "tray")
        self.peg_pixel = peg_px
        self.tray_pixel = tray_px
        self.peg_start = _base_point(peg_px, self.table_z + 0.02)
        self.tray_start = _base_point(tray_px, self.table_z + 0.06)
        if peg_pixels is not None and len(peg_pixels) > 20:
            centered = peg_pixels.astype(float) - peg_pixels.mean(axis=0)
            _, _, vectors = np.linalg.svd(centered, full_matrices=False)
            axis_px = vectors[0]
            ends = np.array([peg_pixels.mean(axis=0) - axis_px * 6.0,
                             peg_pixels.mean(axis=0) + axis_px * 6.0])
            world_ends = [_base_point(point, self.table_z + 0.02) for point in ends]
            if all(point is not None for point in world_ends):
                axis = world_ends[1] - world_ends[0]
                axis[2] = 0.0
                if np.linalg.norm(axis) > 1e-5:
                    self.peg_axis = axis / np.linalg.norm(axis)
        if self.peg_start is None:
            self.peg_start = np.array([-0.15, -0.16, TABLE_Z + 0.02])
        if self.tray_start is None:
            self.tray_start = np.array([-0.15, 0.16, TABLE_Z])
        self.initialized = True

    @staticmethod
    def _closed(hand):
        return float(np.max(hand[[1, 2, 5, 6, 9, 10]])) > 0.55

    def infer(self, obs):
        state = np.asarray(obs["state"], dtype=float)
        if not hasattr(self, "retry_state"):
            self.retry_state = 0
        if not hasattr(self, "stationary_observations"):
            self.stationary_observations = 0
        if not hasattr(self, "retry_attempts"):
            self.retry_attempts = 0
        if not hasattr(self, "retry_offset"):
            self.retry_offset = np.zeros(3)
        restarted = (self.initialized and state[2] > 1.4 and state[9] > 1.4
                     and np.linalg.norm(state[:3] - [-0.443, -0.4, 1.517]) < 0.03
                     and np.linalg.norm(state[7:10] - [-0.443, 0.4, 1.517]) < 0.03)
        if not self.initialized or restarted:
            self._initialize(obs, state)
            self.peg_grasp_orientation = None
            self.peg_orientation = None
            self.insertion_started = False

        right_pos = state[:3].copy()
        left_pos = state[7:10].copy()
        right_rot = _rotation(state, 0)
        right_actual_rot = right_rot
        left_rot = _rotation(state, 7)
        right_hand = state[14:30].copy()
        left_hand = state[30:46].copy()

        if self.peg_grasp_orientation is None:
            finger_axis = right_rot.apply([1.0, 0.0, 0.0])[:2]
            desired_axis = np.array([-self.peg_axis[1], self.peg_axis[0]])
            desired_axis /= max(np.linalg.norm(desired_axis), 1e-8)
            if np.dot(finger_axis, desired_axis) < 0.0:
                desired_axis = -desired_axis
            angle = np.arctan2(finger_axis[0] * desired_axis[1]
                               - finger_axis[1] * desired_axis[0],
                               np.dot(finger_axis, desired_axis))
            align = Rotation.from_rotvec([0.0, 0.0, angle])
            self.peg_grasp_orientation = align * right_rot
        if not self._closed(right_hand):
            right_rot = self.peg_grasp_orientation

        right_axis = right_rot.apply([1.0, 0.0, 0.0])
        peg_grasp = self.peg_start.copy()
        peg_grasp[:2] -= right_axis[:2] * 0.06
        peg_grasp[2] = self.table_z + 0.04

        left_axis = left_rot.apply([1.0, 0.0, 0.0])
        tray_grasp = self.tray_start.copy()
        tray_grasp[:2] -= left_axis[:2] * 0.06
        tray_grasp[2] = self.table_z + 0.15

        right_xy_error = np.linalg.norm(right_pos[:2] - peg_grasp[:2])
        left_xy_error = np.linalg.norm(left_pos[:2] - tray_grasp[:2])
        if (right_xy_error < 0.09 and left_xy_error < 0.12
                and not self._closed(right_hand) and not self._closed(left_hand)):
            right_estimate = right_pos[2] - 0.04
            left_estimate = left_pos[2] - 0.15
            if (right_estimate > self.table_z + 0.02
                    and left_estimate > self.table_z + 0.02
                    and abs(right_estimate - left_estimate) < 0.04):
                self.contact_observations += 1
                self.table_z = float(np.clip((right_estimate + left_estimate) / 2.0,
                                             self.table_z, 1.02))
                self.peg_start = _base_point(self.peg_pixel, self.table_z + 0.02)
                self.tray_start = _base_point(self.tray_pixel, self.table_z + 0.06)
                peg_grasp = self.peg_start.copy()
                peg_grasp[:2] -= right_axis[:2] * 0.06
                peg_grasp[2] = self.table_z + 0.04
                tray_grasp = self.tray_start.copy()
                tray_grasp[:2] -= left_axis[:2] * 0.06
                tray_grasp[2] = self.table_z + 0.15

        right_closed = self._closed(right_hand)
        left_closed = self._closed(left_hand)
        right_near = (np.linalg.norm(right_pos[:2] - peg_grasp[:2]) < 0.075
                      and abs(right_pos[2] - peg_grasp[2]) < 0.04)
        left_near = (np.linalg.norm(left_pos[:2] - tray_grasp[:2]) < 0.10
                     and abs(left_pos[2] - tray_grasp[2]) < 0.04)

        right_target = peg_grasp.copy()
        left_target = tray_grasp.copy()
        right_fingers = np.zeros(16)
        left_fingers = np.zeros(16)
        right_fingers[12] = left_fingers[12] = 0.263

        if right_closed:
            if self.peg_orientation is None:
                self.peg_orientation = right_rot
            right_target[2] += 0.13
            if right_pos[2] > self.table_z + 0.13 or self.insertion_started:
                cross_axis = np.cross(self.peg_axis, [0.0, 0.0, 1.0])
                if np.linalg.norm(cross_axis) > 1e-5:
                    rotate_up = Rotation.from_rotvec(
                        cross_axis / np.linalg.norm(cross_axis) * (np.pi / 2.0))
                    right_rot = rotate_up * self.peg_orientation
                grasp_offset = right_rot.apply([0.06, 0.0, 0.03])
                peg_center = self.tray_start.copy()
                peg_center[2] = self.table_z + 0.24
                right_target = peg_center - grasp_offset
                if (np.linalg.norm(right_pos[:2] - right_target[:2]) < 0.045
                        and right_pos[2] > self.table_z + 0.16):
                    self.insertion_started = True
                if self.insertion_started:
                    peg_center[2] = self.table_z + 0.114
                    right_target = peg_center - grasp_offset
        if left_closed:
            left_target[2] += 0.13

        if right_near or right_closed:
                right_fingers = np.array([0.0, 1.0, 1.4, -0.9,
                                          0.0, 1.0, 1.4, -0.9,
                                          0.0, 1.0, 1.4, -0.9,
                                          1.0, 1.0, 1.4, 1.4])
        if left_near or left_closed:
            left_fingers = np.array([0.0, 1.0, 1.4, -0.9,
                                     0.0, 1.0, 1.4, -0.9,
                                     0.0, 1.0, 1.4, -0.9,
                                     1.0, 1.0, 1.4, 1.4])

        detected_peg_pixel = None
        if self.peg_pixel is not None and right_closed and right_pos[2] > self.table_z + 0.13:
            detected_peg_pixel, _ = _component(obs["base"], "peg")
            if detected_peg_pixel is not None:
                predicted_peg_pixel = _base_pixel(
                    right_pos + right_actual_rot.apply([0.06, 0.0, 0.03]))
                if (predicted_peg_pixel is None
                        or np.linalg.norm(detected_peg_pixel - predicted_peg_pixel) > 12.0):
                    self.stationary_observations += 1
                else:
                    self.stationary_observations = 0
        else:
            self.stationary_observations = 0
        if self.stationary_observations >= 1 and self.retry_state == 0:
            self.retry_state = 1
            self.stationary_observations = 0
            self.retry_attempts += 1
            adjustment = [0.03, -0.03, 0.0][(self.retry_attempts - 1) % 3]
            self.retry_offset = self.peg_axis * adjustment
            if detected_peg_pixel is not None:
                self.peg_pixel = detected_peg_pixel
                self.peg_start = _base_point(self.peg_pixel, self.table_z + 0.02)
                peg_grasp = self.peg_start.copy()
                peg_grasp[:2] -= self.peg_grasp_orientation.apply([0.06, 0.0, 0.0])[:2]
                peg_grasp[2] = self.table_z + 0.04
        if self.retry_state == 1:
            right_target = peg_grasp + self.retry_offset
            right_rot = self.peg_grasp_orientation
            right_fingers = np.zeros(16)
            right_fingers[12] = 0.263
            if (not right_closed
                    and np.linalg.norm(right_pos[:2] - peg_grasp[:2]) < 0.07
                    and abs(right_pos[2] - peg_grasp[2]) < 0.04):
                self.retry_state = 2
        if self.retry_state == 2:
            right_target = peg_grasp + self.retry_offset
            right_rot = self.peg_grasp_orientation
            if right_near or right_closed:
                right_fingers = np.array([0.0, 1.0, 1.4, -0.9,
                                          0.0, 1.0, 1.4, -0.9,
                                          0.0, 1.0, 1.4, -0.9,
                                          1.0, 1.0, 1.4, 1.4])
            if right_closed:
                self.retry_state = 0
                self.peg_orientation = self.peg_grasp_orientation

        actions = np.zeros((30, 44), dtype=float)
        for row in range(30):
            blend = min(1.0, (row + 1) / 18.0)
            actions[row, 0:3] = right_pos + blend * (right_target - right_pos)
            actions[row, 3:6] = _rotvec(right_rot)
            actions[row, 6:22] = right_hand + min(1.0, max(0.0, (row - 12) / 10.0)) * (right_fingers - right_hand)
            actions[row, 22:25] = left_pos + blend * (left_target - left_pos)
            actions[row, 25:28] = _rotvec(left_rot)
            actions[row, 28:44] = left_hand + min(1.0, max(0.0, (row - 12) / 10.0)) * (left_fingers - left_hand)
        return {"actions": actions}


def create_policy():
    return AssemblyPolicy()
