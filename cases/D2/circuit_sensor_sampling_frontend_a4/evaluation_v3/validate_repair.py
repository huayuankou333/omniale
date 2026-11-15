import subprocess,sys
from pathlib import Path
r=Path(__file__).resolve().parent
for name in ["check_gateway.py","preflight.py","check_measurements.py","seal.py"]:
 print("STEP",name,flush=True)
 subprocess.run([sys.executable,str(r/name)],check=True)
print("REPAIR_READY",flush=True)
