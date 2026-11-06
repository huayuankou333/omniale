import numpy as np
try:
    import cv2
except ImportError:
    import raster as cv2
from scipy.spatial.transform import Rotation
from scipy.optimize import minimize
from scipy.ndimage import gaussian_filter, binary_fill_holes

_HANDS = None


def hand_masks(state, views):
    global _HANDS
    if _HANDS is None:
        from hand_geometry import Hands
        _HANDS=Hands()
    shapes=_HANDS.shapes(state)
    masks=[]
    for camera in views:
        mask=np.zeros((224,224),np.uint8)
        for points in shapes:
            local=(points-camera[0])@camera[1]
            if np.any(local[:,2]>-.015):continue
            pixels=project(points,camera)
            polygon=cv2.convexHull(np.round(pixels).astype(np.int32))
            cv2.fillConvexPoly(mask,polygon,1)
        masks.append(cv2.dilate(mask,np.ones((3,3),np.uint8))>0)
    return masks


def rotation(quat):
    return Rotation.from_quat(quat, scalar_first=True).as_matrix()


def cameras(state):
    result = [(np.array([-1.3, 0., 2.2]), rotation([.6532815, .2705981, -.2705981, -.6532815]), 112 / np.tan(np.pi / 8))]
    for start in (7, 0):
        matrix = rotation(state[start + 3:start + 7]) @ np.diag([-1., -1., 1.])
        result.append((state[start:start + 3] + matrix @ np.array([.14, .03, .04]), matrix @ rotation([-.353553, .612372, -.612372, .353553]), 112 / np.tan(np.pi / 6)))
    return result


def project(points, camera):
    position, matrix, focal = camera
    local = (points - position) @ matrix
    return np.column_stack((111.5 - focal * local[:, 0] / local[:, 2], 111.5 + focal * local[:, 1] / local[:, 2]))


def color_masks(image):
    red, green, blue = image.astype(float).transpose(2, 0, 1)
    peg = (red - blue > 40) & (green - blue > 25) & (red > 120) & (red < green * 1.30) & (green > blue * 1.40)
    tray = (blue > red * 1.20) & (green > red * 1.07) & (red > blue * .45) & (green > blue * .72) & (red > 12) & (red < 180)
    return peg, tray


def component(mask, minimum=10):
    count, labels, stats, centers = cv2.connectedComponentsWithStats(mask.astype(np.uint8))
    if count <= 1:
        return mask & False
    index = 1 + np.argmax(stats[1:, 4])
    if stats[index, 4] < minimum:
        return mask & False
    return labels == index


TRAY_POINTS = np.array([[horizontal, lateral, height] for height in (0.,.0135) for horizontal in (-.09,.09) for lateral in (-.09,.09)] + [[horizontal, lateral, height] for height in (.0135,.126) for horizontal,lateral in ((-.05625,-.0315),(-.0315,-.05625),(.0315,-.05625),(.05625,-.0315),(.05625,.0315),(.0315,.05625),(-.0315,.05625),(-.05625,.0315))])


def tray_silhouette(pose, camera):
    matrix = tray_rotation(pose)
    pixels = project(TRAY_POINTS @ matrix.T + pose[:3], camera)
    mask = np.zeros((896, 896), np.uint8)
    for subset in (pixels[:8], pixels[8:]):
        polygon = cv2.convexHull(np.round(subset * 4 + 1.5).astype(np.int32))
        cv2.fillConvexPoly(mask, polygon, 255)
    return cv2.resize(mask,(224,224),interpolation=cv2.INTER_AREA).astype(float) / 255.


def tray_rotation(pose):
    return Rotation.from_euler('z',pose[3]).as_matrix() if len(pose)==4 else Rotation.from_rotvec(pose[3:6]).as_matrix()


def fit_tray(obs):
    views = cameras(obs['state'])
    images = [obs[key] for key in ('base', 'wrist_left', 'wrist_right')]
    masks = [binary_fill_holes(component(color_masks(image)[1])) for image in images]
    targets = [gaussian_filter(mask.astype(float), .65) for mask in masks]
    valid = [index for index, mask in enumerate(masks) if mask.sum() > 40]
    def loss(pose):
        if not (-.5 < pose[0] < .2 and -.2 < pose[1] < .5 and .80 < pose[2] < 1.03):
            return 100
        return sum(np.square(gaussian_filter(tray_silhouette(pose, views[index]), .65) - targets[index]).sum() / max(50, masks[index].sum()) for index in valid)
    candidates = []
    for yaw in [0., .4, -.4, .78]:
        fit = minimize(loss, [-.1, .16, .92, yaw], method='Powell', options={'maxiter':30,'xtol':.0003,'ftol':.0001})
        candidates.append(fit)
    fit = min(candidates, key=lambda candidate:candidate.fun)
    return fit.x, fit.fun


PEG_CYLINDER = np.array([[radius*np.cos(angle), radius*np.sin(angle), height] for height,radius in ((.0135,.0157185),(.01575,.0179685),(.23625,.0179685),(.2385,.0157185)) for angle in np.linspace(0,2*np.pi,32,endpoint=False)])


def peg_matrix(yaw):
    return Rotation.from_euler('z',yaw).as_matrix() @ Rotation.from_euler('y',np.pi/2).as_matrix()


def peg_silhouette(pose, camera):
    matrix = peg_matrix(pose[3])
    mask = np.zeros((896,896),np.uint8)
    for points in (PEG_CYLINDER,):
        pixels=project(points@matrix.T+pose[:3],camera)
        polygon=cv2.convexHull(np.round(pixels*4+1.5).astype(np.int32))
        cv2.fillConvexPoly(mask,polygon,255)
    return cv2.resize(mask,(224,224),interpolation=cv2.INTER_AREA).astype(float)/255.


def fit_peg_fast(obs, table_height):
    views=cameras(obs['state'])
    masks=[component(color_masks(obs[key])[0]) for key in ('base','wrist_left','wrist_right')]
    valid=[index for index,mask in enumerate(masks) if mask.sum()>15]
    if not valid:
        return np.array([-.1,-.16,table_height+.02,.35]),10.
    targets=[gaussian_filter(mask.astype(float),.65) for mask in masks]
    index=max(valid,key=lambda index:masks[index].sum())
    pixels=np.argwhere(masks[index])[:,::-1]
    cam=views[index]
    rays=np.column_stack(((pixels[:,0]-111.5)/cam[2],-(pixels[:,1]-111.5)/cam[2],-np.ones(len(pixels))))@cam[1].T
    points=cam[0]+rays*((table_height+.018-cam[0][2])/rays[:,2:3])
    center=points.mean(0)
    values,vectors=np.linalg.eigh(np.cov(points[:,:2].T))
    axis=vectors[:,-1]*np.sign(vectors[0,-1])
    yaw=np.arctan2(axis[1],axis[0])
    start=center.copy();start[:2]-=axis*.126;start[2]=table_height+.01785
    def loss(pose):
        return sum(np.square(gaussian_filter(peg_silhouette(pose,views[index]),.65)-targets[index]).sum()/max(50,masks[index].sum()) for index in valid) + ((pose[2]-table_height-.01785)/.02)**2*.01
    fit=minimize(loss,[*start,yaw],method='Powell',options={'maxiter':35,'xtol':.0001,'ftol':.0001})
    return fit.x,fit.fun


def cylinder_silhouette(position, matrix, camera):
    pixels=project(PEG_CYLINDER@matrix.T+position,camera)
    polygon=cv2.convexHull(np.round(pixels*4+1.5).astype(np.int32))
    mask=np.zeros((896,896),np.uint8)
    cv2.fillConvexPoly(mask,polygon,255)
    return cv2.resize(mask,(224,224),interpolation=cv2.INTER_AREA).astype(float)/255.


def refine_peg(obs, position, matrix, max_translation=.05):
    views=cameras(obs['state'])
    hands=hand_masks(obs['state'],views)
    targets=[]
    visibility=[]
    valid=[]
    for index,key in enumerate(('base','wrist_left','wrist_right')):
        image=obs[key]
        region=cv2.dilate((cylinder_silhouette(position,matrix,views[index])>.1).astype(np.uint8),np.ones((31,31),np.uint8))>0
        mask=color_masks(image)[0]&region
        targets.append(gaussian_filter(mask.astype(float),.7))
        visible=(image.max(2)>135)&~color_masks(image)[1]&(~hands[index]|color_masks(image)[0])
        visibility.append(gaussian_filter(visible.astype(float),.5))
        if (mask&visible).sum()>20:valid.append(index)
    if not valid:return position,matrix,10.
    def loss(parameters):
        translation=parameters[:3]
        turn=parameters[3:]
        if np.linalg.norm(translation)>max_translation or np.linalg.norm(turn)>.5:return 10.
        candidate=Rotation.from_rotvec(turn).as_matrix()@matrix
        result=0.
        for index in valid:
            predicted=gaussian_filter(cylinder_silhouette(position+translation,candidate,views[index]),.7)
            residual=(predicted-targets[index])*visibility[index]
            result+=np.square(residual).sum()/max(40,targets[index].sum())
        return result+np.square(turn).sum()*.02+np.square(translation).sum()*2.
    fit=minimize(loss,np.zeros(6),method='Powell',options={'maxiter':12,'xtol':.0001,'ftol':.0003})
    return position+fit.x[:3],Rotation.from_rotvec(fit.x[3:]).as_matrix()@matrix,fit.fun


def refine_tray(obs, prior):
    views=cameras(obs['state'])
    hands=hand_masks(obs['state'],views)
    targets=[]
    visibility=[]
    valid=[]
    for index,key in enumerate(('base','wrist_left','wrist_right')):
        image=obs[key]
        region=cv2.dilate((tray_silhouette(prior,views[index])>.1).astype(np.uint8),np.ones((21,21),np.uint8))>0
        mask=binary_fill_holes(color_masks(image)[1]&region)
        targets.append(gaussian_filter(mask.astype(float),.7))
        red,green,blue=image.astype(float).transpose(2,0,1)
        visibility.append(gaussian_filter((~((image.max(2)<145)&(np.abs(red-blue)<18))&(~hands[index]|color_masks(image)[1])).astype(float),.5))
        expected=tray_silhouette(prior,views[index]).sum()
        if mask.sum()>50 and mask.sum()>expected*.35:valid.append(index)
    if not valid:return prior,10.
    initial_rotation=tray_rotation(prior)
    def candidate(delta):
        matrix=Rotation.from_rotvec(delta[3:]).as_matrix()@initial_rotation
        return np.r_[prior[:3]+delta[:3],Rotation.from_matrix(matrix).as_rotvec()]
    def loss(delta):
        if np.linalg.norm(delta[:3])>.07 or np.linalg.norm(delta[3:])>.3:return 10.
        result=0.
        for index in valid:
            predicted=gaussian_filter(tray_silhouette(candidate(delta),views[index]),.7)
            result+=np.square((predicted-targets[index])*visibility[index]).sum()/max(50,targets[index].sum())
        return result+np.square(delta[:3]).sum()*.1+np.square(delta[3:]).sum()*.005
    fit=minimize(loss,np.zeros(6),method='Powell',options={'maxiter':18,'xtol':.0001,'ftol':.0003})
    return candidate(fit.x),fit.fun
