from build123d import *
import math

# Straight bevel tooth surfaces are generated on concentric cone-distance
# sections. Both members of each pair share their apex and cone distance.
def bevel(teeth, mate, module, inner, origin, axis, u, v, phase):
    pi=math.pi
    d=math.atan(teeth/mate)
    R=module*math.sqrt(teeth*teeth+mate*mate)/2
    pitch=R*math.sin(d)
    rv=pitch/math.cos(d)
    alpha=20*pi/180
    base=rv*math.cos(alpha)
    root=d-1.20*module/R
    tip=d+0.93*module/R
    invp=math.tan(alpha)-alpha
    half=pi/(2*teeth)-0.032/module/teeth
    def width(t):
        rr=rv+R*(t-d)
        a=math.acos(min(1,base/rr))
        return half+(invp-(math.tan(a)-a))/math.cos(d)
    # radial flank stations resolve the involute, plus a broad root land.
    start=max(root,d+(base-rv)/R)
    profile=[]
    for k in range(teeth):
        mid=phase+2*pi*k/teeth
        w=width(start)
        profile.append((root,mid-pi/teeth))
        profile.append((root,mid-w))
        for j in range(5):
            t=start+(tip-start)*j/4
            profile.append((t,mid-width(t)))
        for j in range(4,-1,-1):
            t=start+(tip-start)*j/4
            profile.append((t,mid+width(t)))
        profile.append((root,mid+w))
    # A polygonal sewn BREP preserves true separate solids (not display meshes).
    def xyz(r,theta,q):
        return tuple(origin[i]+axis[i]*q+u[i]*r*math.cos(theta)+v[i]*r*math.sin(theta) for i in range(3))
    rings=[]
    for scale,bore in [(1,False),(inner,False),(1,True),(inner,True)]:
        ring=[]
        for t,theta in profile:
            rad=2.25 if bore else R*scale*math.sin(t)
            q=R*scale*math.cos(root if bore else t)
            ring.append(xyz(rad,theta,q))
        rings.append(ring)
    faces=[]
    def face(points):
        clean=[]
        for p in points:
            if not clean or sum((p[k]-clean[-1][k])**2 for k in range(3))>1e-16:
                clean.append(p)
        if len(clean)>2 and sum((clean[0][k]-clean[-1][k])**2 for k in range(3))<1e-16:
            clean=clean[:-1]
        if len(clean)>2:
            a=Vector(clean[1])-Vector(clean[0])
            b=Vector(clean[2])-Vector(clean[0])
            if a.cross(b).length>1e-9:
                faces.append(Face(Wire.make_polygon(clean)))
    n=len(profile)
    # all six-sided cells share exactly the same seam vertices
    for i in range(n):
        j=(i+1)%n
        # straight tooth flank and cylindrical bore strips
        face([rings[0][i],rings[1][i],rings[1][j],rings[0][j]])
        face([rings[2][j],rings[3][j],rings[3][i],rings[2][i]])
        # triangulated annular ends accommodate spherical cone-distance sections
        face([rings[0][j],rings[2][j],rings[2][i]])
        face([rings[0][j],rings[2][i],rings[0][i]])
        face([rings[1][i],rings[3][i],rings[3][j]])
        face([rings[1][i],rings[3][j],rings[1][j]])
    gear=Solid(Shell(faces))
    return gear

# Stage I: 14:20 teeth, positive-Z / positive-X cones, common apex.
# Stage II: 10:14 teeth, negative-X / positive-Y cones, common apex.
# Thus omega_X = -14/20 omega_Z, omega_Y = 10/14 omega_X:
# +30 rpm input corresponds to -15 rpm output.
# Bores are 4.50 mm, providing clearance for the fixed 4.40 mm shafts.
input_gear=bevel(14,20,1.0,.65,(12,0,18),(0,0,1),(1,0,0),(0,1,0),0)
compound_large=bevel(20,14,1.0,.65,(12,0,18),(1,0,0),(0,1,0),(0,0,1),math.pi/2+math.pi/20)
compound_small=bevel(10,14,.95,.75,(40,0,18),(-1,0,0),(0,1,0),(0,0,-1),0)
output_gear=bevel(14,10,.95,.75,(40,0,18),(0,1,0),(-1,0,0),(0,0,1),math.pi/14)
input_gear.label="Input - 14 teeth"
compound_large.label="Compound I - 20 teeth"
compound_small.label="Compound II - 10 teeth"
output_gear.label="Output - 14 teeth"
part=Compound(children=[input_gear,compound_large,compound_small,output_gear])
