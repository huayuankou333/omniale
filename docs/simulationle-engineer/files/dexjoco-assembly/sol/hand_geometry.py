import numpy as np
import mujoco


class Hands:
    def __init__(self):
        self.model = mujoco.MjModel.from_xml_path('/public/assets/panda_allegro_bimanual.xml')
        self.data = mujoco.MjData(self.model)
        self.collision = {}
        for side in ('right','left'):
            palm=self.model.body('allegro_palm_'+side).id
            bodies={palm}
            for body in range(palm+1,self.model.nbody):
                if self.model.body_parentid[body] in bodies:bodies.add(body)
            self.collision[side]=[index for index in range(self.model.ngeom) if self.model.geom_bodyid[index] in bodies and self.model.geom_group[index]==3]

    def shapes(self,state):
        result=[]
        for side,start,joint_start in (('right',0,14),('left',7,30)):
            for finger_index,finger in enumerate(('ff','mf','rf','th') if side=='right' else ('rf','mf','ff','th')):
                for joint_index in range(4):
                    joint=self.model.joint(f'{finger}j{joint_index}_{side}').id
                    self.data.qpos[self.model.jnt_qposadr[joint]]=state[joint_start+finger_index*4+joint_index]
        mujoco.mj_forward(self.model,self.data)
        from scipy.spatial.transform import Rotation
        for side,start in (('right',0),('left',7)):
            site=self.model.site('attachment_site_'+side).id
            origin=self.data.site_xpos[site]
            site_matrix=self.data.site_xmat[site].reshape(3,3)
            world_matrix=Rotation.from_quat(state[start+3:start+7],scalar_first=True).as_matrix()
            for center,radius in ((-.055,.065),(-.15,.08)):
                points=np.array([[radius*np.sin(latitude)*np.cos(longitude),radius*np.sin(latitude)*np.sin(longitude),center+radius*np.cos(latitude)] for latitude in np.linspace(0,np.pi,7) for longitude in np.linspace(0,2*np.pi,12,endpoint=False)])
                result.append(points@world_matrix.T+state[start:start+3])
            for geom in self.collision[side]:
                size=self.model.geom_size[geom]
                if self.model.geom_type[geom]==mujoco.mjtGeom.mjGEOM_BOX:
                    points=np.array([[horizontal,lateral,height] for horizontal in (-size[0],size[0]) for lateral in (-size[1],size[1]) for height in (-size[2],size[2])])
                elif self.model.geom_type[geom]==mujoco.mjtGeom.mjGEOM_CAPSULE:
                    points=np.array([[size[0]*np.sin(latitude)*np.cos(longitude),size[0]*np.sin(latitude)*np.sin(longitude),size[0]*np.cos(latitude)+sign*size[1]] for sign in (-1,1) for latitude in np.linspace(0,np.pi,5) for longitude in np.linspace(0,2*np.pi,10,endpoint=False)])
                else:continue
                points=points@self.data.geom_xmat[geom].reshape(3,3).T+self.data.geom_xpos[geom]
                local=(points-origin)@site_matrix
                result.append(local@world_matrix.T+state[start:start+3])
        return result

    def geometry(self, joints, side='right'):
        for index, finger in enumerate(('ff','mf','rf','th') if side=='right' else ('rf','mf','ff','th')):
            for joint in range(4):
                name=f'{finger}j{joint}_{side}'
                self.data.qpos[self.model.jnt_qposadr[self.model.joint(name).id]]=joints[index*4+joint]
        mujoco.mj_forward(self.model,self.data)
        site=self.model.site('attachment_site_'+side).id
        origin=self.data.site_xpos[site]
        matrix=self.data.site_xmat[site].reshape(3,3)
        result={}
        for finger in ('ff','mf','rf','th'):
            body=self.model.body(f'{finger}_tip_{side}').id
            geom=np.flatnonzero(self.model.geom_bodyid==body)[-1]
            result[finger]=(self.data.geom_xpos[geom]-origin)@matrix
        return result


if __name__=='__main__':
    hands=Hands()
    for amount in (0,.4,.8,1.2):
        joints=np.array([0,amount,amount,amount]*3+[1.,.2,amount,amount])
        print('amount',amount, joints, hands.geometry(joints))
