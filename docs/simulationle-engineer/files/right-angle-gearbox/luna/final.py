from build123d import *
# bevel-like conical gear blanks, center bore

def gear(axis, start, length, r0, r1, center, teeth):
    # cone along local z, base at z=0 then orient
    s=Cone(r0,r1,length, align=(Align.CENTER,Align.CENTER,Align.MIN))
    # radial tooth blocks positioned at outer end, axial thin band
    for i in range(teeth):
        a=360*i/teeth
        tooth=Box(max(0.8, r1*0.24), r1*0.32, length*0.48, align=(Align.CENTER,Align.CENTER,Align.CENTER))
        tooth=Pos(r1*0.86,0,length*0.72)*tooth
        tooth=Rot(0,0,a)*tooth
        s=s+tooth
    hole=Cylinder(2.2,length+1,align=(Align.CENTER,Align.CENTER,Align.MIN))
    s=s-hole
    if axis=='z': return Pos(center[0],center[1],start)*s
    if axis=='x': return Pos(start,center[1],center[2])*Rot(0,90,0)*s
    return Pos(center[0],start,center[2])*Rot(-90,0,0)*s
# Axes point from apex toward mounting half axis
part=Compound(children=[
 gear('z',20,6.5,0.7,7.5,(12,0,0),12),
 gear('x',12.5,4.5,0.7,10.5,(0,0,18),16),
 gear('x',34,5,0.6,5.5,(0,0,18),10),
 gear('y',0.5,5,0.6,7.5,(40,0,18),12)
])
