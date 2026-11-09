import os
import numpy as np
import mujoco

class Policy:
    def reset(self, cell_spec, seed):
        self.s=cell_spec
        self.model=mujoco.MjModel.from_binary_path(cell_spec['model_file'])
        self.data=mujoco.MjData(self.model)
        self.site=mujoco.mj_name2id(self.model,mujoco.mjtObj.mjOBJ_SITE,'grip')
        self.jids=[mujoco.mj_name2id(self.model,mujoco.mjtObj.mjOBJ_JOINT,f'arm_joint{i}') for i in range(1,8)]
        self.qadr=[self.model.jnt_qposadr[j] for j in self.jids]
        self.dadr=[self.model.jnt_dofadr[j] for j in self.jids]
        self.home=np.array(cell_spec['arm_home'],float)
        self.target=self.home.copy(); self.phase='home'; self.tick=0; self.mag=0
        self.pick=None; self.pick_z=.25; self.frames=0; self.last_t=0
        self.K=np.array(cell_spec['overhead_K']); self.T=np.array(cell_spec['overhead_T_world_cam'])

    def ik(self, xyz, qstart):
        q=qstart.copy(); jp=np.zeros((3,self.model.nv)); jr=np.zeros((3,self.model.nv))
        for _ in range(90):
            for a,v in zip(self.qadr,q): self.data.qpos[a]=v
            mujoco.mj_forward(self.model,self.data)
            err=xyz-self.data.site_xpos[self.site]
            if np.linalg.norm(err)<.002: break
            mujoco.mj_jacSite(self.model,self.data,jp,jr,self.site)
            J=jp[:,self.dadr]
            dq=J.T@np.linalg.solve(J@J.T+0.002*np.eye(3),err)
            n=np.linalg.norm(dq)
            if n>.12: dq*=.12/n
            q+=dq
            q=np.minimum(np.maximum(q,self.model.jnt_range[[self.model.joint(j).id for j in self.jids],0]),self.model.jnt_range[[self.model.joint(j).id for j in self.jids],1])
        return q

    def image_target(self, obs):
        d=obs.get('overhead_depth')
        if d is None:return None
        # Convert valid bin pixels to world coordinates; nearest visible metal is highest.
        H,W=d.shape; u,v=np.meshgrid(np.arange(W),np.arange(H))
        zc=-d
        X=(u-self.K[0,2])*d/self.K[0,0]; Y=-(v-self.K[1,2])*d/self.K[1,1]
        pts=np.stack([X,Y,zc],-1)@self.T[:3,:3].T+self.T[:3,3]
        lo=np.array(self.s['bin_lo']); hi=np.array(self.s['bin_hi'])
        mask=np.isfinite(d)&(pts[:,:,0]>lo[0]+.025)&(pts[:,:,0]<hi[0]-.025)&(pts[:,:,1]>lo[1]+.025)&(pts[:,:,1]<hi[1]-.025)&(pts[:,:,2]>.12)
        # Highest surface region robustly selected from upper height quantile, avoid isolated noisy pixels.
        if mask.sum()<30:return None
        z=pts[:,:,2][mask]; cutoff=np.quantile(z,.995)
        yy,xx=np.where(mask&(pts[:,:,2]>=cutoff))
        if len(xx)<1:return None
        x=float(np.median(pts[yy,xx,0])); y=float(np.median(pts[yy,xx,1])); top=float(np.median(pts[yy,xx,2]))
        return x,y,top

    def act(self,obs):
        self.tick+=1; t=float(obs['t']); q=np.array(obs['qpos'])
        if 'overhead_depth' in obs and self.phase in ('home','seek'):
            found=self.image_target(obs)
            if found:
                x,y,z=found; self.pick=(x,y); self.pick_z=z
                self.target=self.ik([x,y,z+.003],q); self.phase='approach'; self.mag=0
        if self.phase=='home': self.target=self.home.copy()
        elif self.phase=='approach':
            if np.max(np.abs(q-self.target))<.12:
                x,y=self.pick; self.target=self.ik([x,y,self.pick_z+.001],q); self.phase='contact'
        elif self.phase=='contact':
            if np.max(np.abs(q-self.target))<.10:
                self.mag=255; x,y=self.pick
                self.target=self.ik([x,y,self.pick_z+.12],q); self.phase='lift'
        elif self.phase=='lift':
            if np.max(np.abs(q-self.target))<.12:
                # zone center, face 12 cm above belt then lower to placement height
                self.target=self.ik([.45,.38,.30],q); self.phase='travel'
        elif self.phase=='travel':
            if np.max(np.abs(q-self.target))<.12:
                self.target=self.ik([.45,.38,.145],q); self.phase='place'
        elif self.phase=='place':
            if np.max(np.abs(q-self.target))<.10:
                self.mag=0; self.target=self.ik([.45,.38,.32],q); self.phase='release'
        elif self.phase=='release':
            if np.max(np.abs(q-self.target))<.12:
                self.target=self.home.copy(); self.phase='return'
        elif self.phase=='return':
            if np.max(np.abs(q-self.target))<.12: self.phase='seek'
        return np.r_[self.target,float(self.mag)]

def make_policy(): return Policy()
