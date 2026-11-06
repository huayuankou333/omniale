import numpy as np
from scipy.spatial.transform import Rotation
from vision import fit_tray, fit_peg_fast, peg_matrix, refine_peg, refine_tray, tray_rotation


OPEN = np.array([0., .05, .05, .05] * 3 + [.6, .1, .1, .1])
CLOSE = np.array([0., 1.05, 1.1, .85] * 3 + [1.25, .25, 1.05, .85])
TRAY_CLOSE = np.array([0., .75, .65, .65] * 3 + [1.15, .2, .65, .65])


def pose_matrix(state, start):
    return Rotation.from_quat(state[start + 3:start + 7], scalar_first=True).as_matrix()


class AssemblyPolicy:
    def __init__(self):
        self.stage = 'initialize'
        self.previous = None
        self.debug = {}
        self.seen_motion = False

    def initialize(self, obs):
        self.tray, tray_error = fit_tray(obs)
        self.peg, peg_error = fit_peg_fast(obs, self.tray[2])
        self.configure(obs['state'])
        self.approach_refined=False
        self.debug = {'tray': self.tray.tolist(), 'peg':self.peg.tolist(), 'fit_error':[tray_error,peg_error]}

    def configure(self, state):
        direction = np.array([np.cos(self.peg[3]), np.sin(self.peg[3]), 0.])
        self.grasp_rotation = np.column_stack((np.cross(direction, [0.,0.,-1.]), direction, [0.,0.,-1.]))
        self.grasp_local = np.array([.068, -.025, .10])
        self.grasp_position = self.peg[:3] + direction * .165 - self.grasp_rotation @ self.grasp_local
        self.peg_relative_rotation = self.grasp_rotation.T @ peg_matrix(self.peg[3])
        self.peg_relative_position = self.grasp_rotation.T @ (self.peg[:3] - self.grasp_position)
        self.left_position = state[7:10].copy()
        self.left_rotation = pose_matrix(state, 7)
        self.left_grasp_rotation=np.column_stack(([0.,-1.,0.],[-1.,0.,0.],[0.,0.,-1.]))
        self.left_grasp_position=self.tray[:3]+[0.,.095,.175]
        self.left_hand=OPEN.copy()
        self.recovery_count=0
        self.stage = 'approach'

    def measure_held(self,obs):
        state=obs['state']
        actual_matrix=pose_matrix(state,0)
        expected_position=state[:3]+actual_matrix@self.peg_relative_position
        expected_matrix=actual_matrix@self.peg_relative_rotation
        position,matrix,error=refine_peg(obs,expected_position,expected_matrix)
        if error<.5:
            self.peg_relative_position=actual_matrix.T@(position-state[:3])
            self.peg_relative_rotation=actual_matrix.T@matrix
        self.debug['held_fit']=[position.tolist(),matrix[:,2].tolist(),error]
        return position,matrix,error

    def tray_axis(self):
        return tray_rotation(self.tray)[:,2]

    def insertion_origin(self,height):
        return self.tray[:3]+self.tray_axis()*height

    def infer(self, obs):
        state = np.asarray(obs['state'])
        at_start=np.linalg.norm(state[:3]-[-.442948,-.4,1.517014])<.015 and np.linalg.norm(state[14:26])<.12
        if not at_start:self.seen_motion=True
        if self.stage != 'initialize' and getattr(self,'seen_motion',False) and at_start:
            self.stage='initialize'
            self.seen_motion=False
        if self.stage == 'initialize':
            self.initialize(obs)
        position = self.grasp_position.copy()
        matrix = self.grasp_rotation.copy()
        hand = OPEN.copy()
        current_matrix = pose_matrix(state,0)
        for unused in range(12):
            if self.stage == 'approach':
                position = self.grasp_position + [0.,0.,.18]
                hand=OPEN.copy()
                if np.linalg.norm(state[:3]-position)<.012 and Rotation.from_matrix(matrix @ current_matrix.T).magnitude()<.12:
                    if not getattr(self,'approach_refined',False):
                        updated,error=fit_peg_fast(obs,self.tray[2])
                        if error<max(.12,self.debug['fit_error'][1]*1.2) and np.linalg.norm(updated[:3]-self.peg[:3])<.1:
                            self.peg=updated
                            self.configure(state)
                            self.debug['approach_fit']=[updated.tolist(),error]
                        self.approach_refined=True
                        continue
                    self.stage='descend'
                    continue
            elif self.stage == 'descend':
                position=self.grasp_position.copy()
                hand=OPEN.copy()
                if np.linalg.norm(state[:3]-position)<.006:
                    self.stage='close'
                    continue
            elif self.stage == 'close':
                hand=CLOSE.copy()
                position=self.grasp_position.copy()
                settled=self.previous is not None and np.max(np.abs(state[14:30]-self.previous[14:30]))<.035
                if np.mean(state[15:26])>.65 and settled:
                    self.stage='lift'
                    continue
            elif self.stage == 'lift':
                hand=CLOSE.copy()
                position=self.grasp_position+[0.,0.,.25]
                if np.linalg.norm(state[:3]-position)<.012:
                    self.measure_held(obs)
                    self.upright_matrix=self.grasp_rotation@Rotation.from_euler('x',-np.pi/2).as_matrix()
                    current_object=self.upright_matrix@self.peg_relative_rotation
                    correction=Rotation.align_vectors([self.tray_axis()],[current_object[:,2]])[0].as_matrix()
                    self.upright_matrix=correction@self.upright_matrix
                    self.stage='upright'
                    continue
            elif self.stage == 'upright':
                hand=CLOSE.copy()
                matrix=self.upright_matrix
                origin=np.array([self.peg[0],self.peg[1],self.tray[2]+.23])
                position=origin-matrix@self.peg_relative_position
                self.left_position=self.left_grasp_position+[0.,0.,.15]
                self.left_rotation=self.left_grasp_rotation
                settled=self.previous is not None and np.linalg.norm(state[:3]-self.previous[:3])<.002
                orientation_error=Rotation.from_matrix(matrix@current_matrix.T).magnitude()
                position_error=np.linalg.norm(state[:3]-position)
                if (position_error<.012 and orientation_error<.08) or (settled and position_error<.06 and orientation_error<.8):
                    self.measure_held(obs)
                    current_object=matrix@self.peg_relative_rotation
                    matrix=Rotation.align_vectors([self.tray_axis()],[current_object[:,2]])[0].as_matrix()@matrix
                    self.upright_matrix=matrix
                    self.stage='transport'
                    continue
            elif self.stage == 'transport':
                hand=CLOSE.copy()
                matrix=self.upright_matrix
                origin=self.insertion_origin(.19)
                position=origin-matrix@self.peg_relative_position
                self.left_position=self.left_grasp_position.copy()
                self.left_rotation=self.left_grasp_rotation
                if np.linalg.norm(state[:3]-position)<.015 and np.linalg.norm(state[7:10]-self.left_position)<.01:
                    self.left_hand=TRAY_CLOSE.copy()
                    self.stage='align'
                    continue
            elif self.stage == 'align':
                hand=CLOSE.copy()
                matrix=self.upright_matrix
                position=self.insertion_origin(.19)-matrix@self.peg_relative_position
                self.left_hand=TRAY_CLOSE.copy()
                if self.previous is not None and np.mean(state[30:42])>.25 and np.max(np.abs(state[30:]-self.previous[30:]))<.04:
                    updated,error=refine_tray(obs,self.tray)
                    if error<.4:self.tray=updated
                    self.measure_held(obs)
                    current_object=matrix@self.peg_relative_rotation
                    self.upright_matrix=Rotation.align_vectors([self.tray_axis()],[current_object[:,2]])[0].as_matrix()@matrix
                    self.hover_verified=False
                    self.stage='hover_correct'
                    continue
            elif self.stage == 'hover_correct':
                hand=CLOSE.copy()
                matrix=self.upright_matrix
                position=self.insertion_origin(.19)-matrix@self.peg_relative_position
                orientation_tolerance=.08 if getattr(self,'hover_verified',False) else .25
                if np.linalg.norm(state[:3]-position)<.015 and Rotation.from_matrix(matrix@current_matrix.T).magnitude()<orientation_tolerance:
                    if not getattr(self,'hover_verified',False):
                        self.measure_held(obs)
                        updated,error=refine_tray(obs,self.tray)
                        if error<.4:self.tray=updated
                        axis=current_matrix@self.peg_relative_rotation[:,2]
                        self.upright_matrix=Rotation.align_vectors([self.tray_axis()],[axis])[0].as_matrix()@current_matrix
                        self.hover_verified=True
                        continue
                    self.stage='release_tray'
                    continue
            elif self.stage == 'release_tray':
                hand=CLOSE.copy()
                matrix=self.upright_matrix
                position=self.insertion_origin(.19)-matrix@self.peg_relative_position
                self.left_hand=OPEN.copy()
                if np.mean(np.abs(state[30:42]))<.16:
                    self.stage='clearance'
                    continue
            elif self.stage == 'clearance':
                hand=CLOSE.copy()
                matrix=self.upright_matrix
                position=self.insertion_origin(.19)-matrix@self.peg_relative_position
                self.left_hand=OPEN.copy()
                self.left_position=self.left_grasp_position+[0.,.15,.02]
                if np.linalg.norm(state[7:10]-self.left_position)<.012 and np.max(state[31:34])<.2:
                    updated,error=refine_tray(obs,self.tray)
                    if error<.4:self.tray=updated
                    self.stage='preinsert'
                    continue
            elif self.stage == 'preinsert':
                hand=CLOSE.copy()
                matrix=self.upright_matrix
                position=self.insertion_origin(.125)-matrix@self.peg_relative_position
                if np.linalg.norm(state[:3]-position)<.015 and Rotation.from_matrix(matrix@current_matrix.T).magnitude()<.12:
                    previous_relative=self.peg_relative_position.copy()
                    self.measure_held(obs)
                    updated,error=refine_tray(obs,self.tray)
                    if error<.4:self.tray=updated
                    current_object=matrix@self.peg_relative_rotation
                    correction=Rotation.align_vectors([self.tray_axis()],[current_object[:,2]])[0]
                    self.upright_matrix=correction.as_matrix()@matrix
                    if correction.magnitude()>.06 or np.linalg.norm(self.peg_relative_position-previous_relative)>.012:
                        self.recovery_count=getattr(self,'recovery_count',0)+1
                        if self.recovery_count>=2:
                            self.left_hand=OPEN.copy()
                            self.left_position=self.left_grasp_position+[0.,.15,.02]
                        self.hover_verified=False
                        self.stage='hover_correct'
                        continue
                    actual_axis=current_matrix@self.peg_relative_rotation[:,2]
                    actual_correction=Rotation.align_vectors([self.tray_axis()],[actual_axis])[0]
                    if actual_correction.magnitude()>.025:
                        self.upright_matrix=actual_correction.as_matrix()@self.upright_matrix
                        matrix=self.upright_matrix
                        position=self.insertion_origin(.125)-matrix@self.peg_relative_position
                        self.debug['axis_correction']=actual_correction.magnitude()
                        break
                    self.search_index=0
                    self.search_offset=np.zeros(2)
                    self.stage='insert'
                    continue
            elif self.stage == 'insert':
                hand=CLOSE.copy()
                matrix=self.upright_matrix
                position=self.insertion_origin(.001)-matrix@self.peg_relative_position
                if not hasattr(self,'search_index'):
                    self.search_index=0
                    self.search_offset=np.zeros(2)
                current_origin=state[:3]+current_matrix@self.peg_relative_position
                self.gentle_insert=False
                if self.previous is not None:
                    stationary=np.linalg.norm(state[:3]-self.previous[:3])<.002
                    reached=np.linalg.norm(state[:2]-(position[:2]+self.search_offset))<.0015
                    self.gentle_insert=stationary and current_origin[2]>self.tray[2]+.085
                    if stationary and reached and current_origin[2]>self.tray[2]+.085:
                        self.search_index+=1
                        angle=self.search_index*np.pi/4
                        radius=.0025*(1+(self.search_index-1)//8)
                        radius=min(radius,.012)
                        self.search_offset=radius*np.array([np.cos(angle),np.sin(angle)])
                position[:2]+=self.search_offset
                self.debug['search']=[self.search_index,self.search_offset.tolist(),current_origin.tolist()]
            break
        self.previous=state.copy()
        self.debug['stage']=self.stage
        return {'actions':self.plan(state,position,matrix,hand,self.left_position,self.left_rotation,self.left_hand)}

    def plan(self,state,right_position,right_matrix,right_hand,left_position,left_matrix,left_hand):
        actions=np.zeros((30,44),dtype=np.float64)
        for start,offset,position,matrix,hand,joints in ((0,0,right_position,right_matrix,right_hand,14),(7,22,left_position,left_matrix,left_hand,30)):
            current=state[start:start+3]
            initial=pose_matrix(state,start)
            difference=position-current
            distance=np.linalg.norm(difference)
            rot_difference=Rotation.from_matrix(matrix @ initial.T).as_rotvec()
            angle=np.linalg.norm(rot_difference)
            for index in range(30):
                limit=.06 if self.stage in ('descend','insert') else .12
                fraction=min(1.,limit/max(distance,1e-9))
                rot_fraction=min(1.,.9/max(angle,1e-9))
                actions[index,offset:offset+3]=current+difference*fraction
                if self.stage=='insert' and start==0:
                    actions[index,:2]=position[:2]
                    vertical_limit=.004 if getattr(self,'gentle_insert',False) else .05
                    actions[index,2]=current[2]+np.clip(difference[2],-vertical_limit,vertical_limit)
                actions[index,offset+3:offset+6]=Rotation.from_matrix(Rotation.from_rotvec(rot_difference*rot_fraction).as_matrix()@initial).as_rotvec()
                actions[index,offset+6:offset+22]=hand
        return actions


def create_policy():
    return AssemblyPolicy()
