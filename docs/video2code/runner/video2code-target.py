"""Pick a visible colored surface from pixels only; no candidate internals."""
import sys,json
from PIL import Image
import numpy as np
from scipy import ndimage
im=np.array(Image.open(sys.argv[1]).convert('RGB')).astype(float)/255
r,g,b=im[:,:,0],im[:,:,1],im[:,:,2]
color=sys.argv[2]
if color=='red':mask=(r>g*1.55)&(r>b*1.35)&(r>.22)
elif color=='green':mask=(g>r*1.35)&(g>b*1.13)&(g>.12)
elif color=='purple':mask=(b>g*1.4)&(r>g*1.3)&(b>.18)
else:raise ValueError(color)
mask[:90]=False;mask[680:]=False;mask[:,:85]=False;mask[:,1200:]=False
labels,n=ndimage.label(mask);objects=ndimage.find_objects(labels)
items=[]
for i,s in enumerate(objects):
    if not s:continue
    area=int((labels[s]==i+1).sum())
    if area<40:continue
    ys,xs=s;y0,y1=ys.start,ys.stop;x0,x1=xs.start,xs.stop
    items.append({'area':area,'box':[x0,y0,x1-x0,y1-y0],'x':round((x0+x1)/2),'y':round(y0+(y1-y0)*.30)})
print(json.dumps(sorted(items,key=lambda x:-x['area'])[:8]))
