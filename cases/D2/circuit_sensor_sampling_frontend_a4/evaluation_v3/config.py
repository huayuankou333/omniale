from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parent
CASE='A4'
BASE_IMAGE='ghcr.io/arcadia-1/analog-arena-sky130-tools@sha256:668783dd8cbcd5ebce5264785803ce73a9466e79dbe4c98cdf4566348a33437a'
AGENT_IMAGE='sha256:1c2bcad24e264302928cbe44d78eda66350f71131b789d051503203b6147ae1f'
VERIFIER_IMAGE='sha256:81136b2a3a1ba3297b697dd1886b134ba2c11c57e3bb52128b842cfc6b9eeac1'
PROFILE={'kind':'adb','top':'sampling_feedback_ota'}
MODELS=['gpt-6.1-sol']
BASE_URL='https://api-temporary.nju-link.com/v1'
LIMITS=dict(max_designs=1000000,max_policy_errors=1000000,max_native_runs=160,max_responses=48,max_tool_calls=120,max_output_tokens=131072,max_output_per_response=32768,reasoning_effort='medium',max_wall_seconds=7200,simulation_timeout=120,terminal_timeout=180)
def save(path,value):
    p=Path(path);p.parent.mkdir(parents=True,exist_ok=True)
    tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(value,indent=2,ensure_ascii=False,allow_nan=False)+'\n');tmp.replace(p)
def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
