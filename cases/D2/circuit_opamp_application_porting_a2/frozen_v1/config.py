"""A2 development resources; case construction is not yet sealed."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE_IMAGE = 'ghcr.io/arcadia-1/analog-arena-sky130-tools@sha256:668783dd8cbcd5ebce5264785803ce73a9466e79dbe4c98cdf4566348a33437a'
AGENT_IMAGE = 'sha256:b971dfdad878564f16cb2f8319cd5c6ea2d6518d1db52beb1b85980866e6bc4d'
VERIFIER_IMAGE = 'sha256:3825656aa2a0c4c24cc596922d547920a420d13a5fad076053ef89a618ba1f54'
import json
PROFILE = json.loads((ROOT / 'profile.json').read_text())
MODELS = ['gpt-6.1-sol']
BASE_URL = 'https://api-temporary.nju-link.com/v1'
LIMITS = dict(max_designs=161, max_policy_errors=4, max_native_runs=160,
              max_responses=48, max_tool_calls=120, max_output_tokens=131072,
              max_output_per_response=32768, reasoning_effort='medium',
              max_wall_seconds=7200, simulation_timeout=120, terminal_timeout=180)


def save(path, data):
    import json
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def digest(path):
    import hashlib
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()
