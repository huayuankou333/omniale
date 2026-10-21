from PIL import Image
from pathlib import Path
import sys,json,hashlib
src=Path(sys.argv[1]);dst=Path(sys.argv[2]);im=Image.open(src).convert('RGB');im.save(dst,format='WEBP',lossless=True,method=3)
decoded=Image.open(dst).convert('RGB');assert im.size==decoded.size and im.tobytes()==decoded.tobytes()
print(json.dumps({'png_bytes':src.stat().st_size,'webp_bytes':dst.stat().st_size,'pixel_sha256':hashlib.sha256(im.tobytes()).hexdigest(),'dimensions':im.size,'lossless_verified':True}))
