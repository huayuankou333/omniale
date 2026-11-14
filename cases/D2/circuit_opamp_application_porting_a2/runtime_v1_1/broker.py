"""Host-owned budget gateway. The agent chooses every testbench and condition.

Only native execution, artifact capture, policy and budget enforcement live here.
The worker has no verifier, reference circuit, API token or host Docker socket.
"""
import base64
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import socketserver
import threading
import tempfile
import time
import uuid

from config import BASE_IMAGE, LIMITS, ROOT, PROFILE, save, digest
from native import flags, capture, policy

def canonical(source):
    return '\n'.join(' '.join(line.strip().lower().split()) for line in source.splitlines()
                     if line.strip() and not line.lstrip().startswith(('*',';')))

def safe_copy(source, destination):
    source=Path(source).resolve(); destination=Path(destination)
    total=0
    for root, dirs, files in os.walk(source, followlinks=False):
        (destination/Path(root).relative_to(source)).mkdir(parents=True,exist_ok=True)
        for name in dirs+files:
            p=Path(root)/name
            if p.is_symlink():
                raise ValueError('Workspace symlinks are unsupported at simulation snapshot: '+str(p.relative_to(source)))
        for name in files:
            p=Path(root)/name
            if not p.is_file():raise ValueError('Non-regular workspace entry')
            total+=p.stat().st_size
            if total>100*1024*1024:raise ValueError('Workspace snapshot exceeds 100 MiB')
            q=destination/p.relative_to(source);q.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(p,q)

def validate_deck(path, workspace):
    """Allow arbitrary analysis of the submitted DUT; reject shadow circuits or
    commands that mutate it inside one simulator process without a new budget entry.
    This is a constrained benchmark contract, not a general SPICE interpreter.
    """
    workspace=Path(workspace).resolve(); seen=set(); has_design=False
    dut_text=(workspace/'circuit.spi').read_text()
    dut_parameters={m.lower() for raw in dut_text.splitlines() if raw.strip().lower().startswith('.param') for m in re.findall(r'(\w+)\s*=',raw)}
    external_sources={line.split()[0].lower() for f in workspace.rglob('*') if f.is_file() and f.suffix.lower() in ('.spi','.sp','.cir') and f.name!='circuit.spi' and f.stat().st_size<2*1024*1024 for line in f.read_text(errors='replace').splitlines() if re.match(r'^\s*[VI][a-zA-Z0-9_]+\s',line)}
    def visit(p):
        nonlocal has_design
        p=Path(p).resolve()
        if p in seen:return
        seen.add(p)
        if not p.is_relative_to(workspace):raise ValueError('Local include escapes workspace')
        if p==workspace/'circuit.spi':
            has_design=True;return
        if not p.is_file():raise ValueError('Missing include: '+str(p.relative_to(workspace)))
        if p.stat().st_size>2*1024*1024:raise ValueError('Testbench/include exceeds 2 MiB')
        for raw in p.read_text(errors='replace').splitlines():
            line=raw.strip()
            if not line or line.startswith(('*',';')):continue
            token=line.split()[0].lower()
            if token in ('.subckt','.model','.func'):
                raise ValueError('Define the submitted DUT only in /app/circuit.spi; use fixed PDK models')
            if token in ('.alter','.step','altermod','alterparam','source','edit','shell','osdi','codemodel','pre_osdi') or line.startswith('!'):
                raise ValueError('In-process circuit alteration or subprocess execution is outside the audited development contract: '+token)
            if token=='alter':
                words=line.split()
                if len(words)<2 or not re.fullmatch(r'[vi][a-zA-Z0-9_]+',words[1],re.I) or words[1].lower() not in external_sources:
                    raise ValueError('Only independently defined external V/I test sources may be altered')
            if token in ('.param','alterparam') and any(re.search(r'\b'+re.escape(v)+r'\s*=',line,re.I) for v in dut_parameters):
                raise ValueError('Testbench cannot override DUT parameter names')
            if any(ch in line for ch in ('`',)):
                raise ValueError('SPICE command substitution is outside the audited batch interface')
            if token in ('.include','.inc','.lib'):
                match=re.match(r'\.(?:include|inc|lib)\s+(?:"([^"]+)"|\x27([^\x27]+)\x27|(\S+))',line,re.I)
                if not match:raise ValueError('Malformed include')
                name=next(x for x in match.groups() if x is not None)
                # A one-argument .lib declares a section inside a wrapper.
                if token=='.lib' and not any(c in name for c in '/.\\') and len(line.split())==2:continue
                if name.startswith('/opt/sky130/'):
                    if '..' in PurePosixPath(name).parts:raise ValueError('Invalid PDK path')
                    continue
                if name.startswith('/app/'):
                    visit(workspace/name[5:])
                elif name.startswith('/'):
                    raise ValueError('Includes must use /app or the fixed /opt/sky130 PDK')
                else:visit(p.parent/name)
            # The DUT interface has no adjustable parameters; attaching overrides
            # to its testbench instance would create an uncounted design.
            if token.startswith('x'):
                words=line.split()
                for pos, word in enumerate(words):
                    if word.lower()=='dut' and pos!=len(words)-1:
                        raise ValueError('DUT instance parameter overrides are unsupported')
    visit(path)
    if not has_design:raise ValueError('Testbench must include /app/circuit.spi')

class Broker:
    def __init__(self, run, workspace, limits=None):
        self.run=Path(run).resolve();self.workspace=Path(workspace).resolve()
        self.limits=dict(LIMITS if limits is None else limits)
        self.run.mkdir(parents=True,exist_ok=True)
        self.lock=threading.Lock()
        self.state={'designs':[],'native_runs':0,'policy_errors':0,'requests':0}
        self.uid=os.getuid();self.closed=False
        self.socket_dir=Path(tempfile.mkdtemp(prefix='simle-a2-'))
        socketpath=self.socket_dir/'broker.sock'
        if socketpath.exists():socketpath.unlink()
        broker=self
        class Handler(socketserver.StreamRequestHandler):
            def handle(self):
                try:
                    raw=self.rfile.readline(3*1024*1024)
                    request=json.loads(raw)
                    answer=broker.handle(request)
                except Exception as exc:
                    answer={'exit_code':2,'stdout':'','stderr':str(exc)+'\n'}
                self.wfile.write(json.dumps(answer).encode())
        self.server=socketserver.ThreadingUnixStreamServer(str(socketpath),Handler)
        os.chmod(socketpath,0o666)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True)
        self.thread.start()
        save(self.run/'limits.json',self.limits)

    def handle(self, request):
        with self.lock:
            if self.closed:return dict(exit_code=2,stderr='Development is frozen\n')
            if request.get('op')=='version':
                return capture(flags('simle-a2-version-'+uuid.uuid4().hex[:8],self.uid)+[BASE_IMAGE,'ngspice','--version'],20)
            self.state['requests']+=1
            idx=self.state['requests']; folder=self.run/f'request_{idx:03d}'
            folder.mkdir()
            save(folder/'request.json',request)
            started=time.monotonic()
            try:
                answer=self.simulate(request,folder)
            except Exception as exc:
                answer={'exit_code':2,'stdout':'','stderr':'Simulation gateway: '+str(exc)+'\n'}
            answer['gateway']=dict(designs_used=len(self.state['designs']),max_designs=self.limits['max_designs'],
                                   native_runs=self.state['native_runs'],max_native_runs=self.limits['max_native_runs'])
            save(folder/'result.json',answer);save(self.run/'state.json',self.state)
            return answer

    def simulate(self,request,folder):
        if self.state['native_runs']>=self.limits['max_native_runs']:raise ValueError('Native simulation budget exhausted')
        if self.state['policy_errors']>self.limits['max_policy_errors']:raise ValueError('Netlist policy error budget exhausted')
        circuit=self.workspace/'circuit.spi'
        if not circuit.is_file() or circuit.is_symlink():raise ValueError('Missing regular /app/circuit.spi')
        snapshot=folder/'work';safe_copy(self.workspace,snapshot)
        cmdargs=request.get('argv',[])
        if not isinstance(cmdargs,list) or not all(isinstance(v,str) for v in cmdargs):raise ValueError('Invalid ngspice argv')
        # Preserve raw CLI options only from this supported batch subset.
        value_flags={'-o','--output','-r','--rawfile'};skip=False;decks=[]
        for word in cmdargs:
            if skip:
                if word.startswith('/') and not word.startswith('/app/'):
                    raise ValueError('Write -o/-r output under /app/experiments; worker /tmp is separate')
                skip=False;continue
            if word in value_flags:skip=True;continue
            if word.startswith('-'):
                if word not in ('-b','--batch','-n','--no-spiceinit','-a','--autorun'):
                    raise ValueError('Unsupported batch flag: '+word)
            else:decks.append(word)
        if len(decks)!=1 or not any(v in cmdargs for v in ('-b','--batch')):raise ValueError('One batch input is required')
        cwd=request.get('cwd','/app')
        if cwd!='/app' and not cwd.startswith('/app/'):
            cwd='/app'
        relcwd=Path(cwd.removeprefix('/app').lstrip('/'))
        if '..' in relcwd.parts:raise ValueError('Invalid cwd')
        hostcwd=snapshot/relcwd;hostcwd.mkdir(parents=True,exist_ok=True)
        original_deck=PurePosixPath(request['deck_path'])
        raw=base64.b64decode(request['deck_base64'],validate=True)
        if len(raw)>2*1024*1024:raise ValueError('Input deck too large')
        if str(original_deck).startswith('/app/') and '..' not in original_deck.parts:
            deck=snapshot/str(original_deck)[5:]
            if deck==snapshot/'circuit.spi':raise ValueError('Use a separate testbench')
        else:
            deck=hostcwd/('_gateway_'+hashlib.sha256(raw).hexdigest()[:12]+'.spi')
        deck.parent.mkdir(parents=True,exist_ok=True);deck.write_bytes(raw)
        validate_deck(deck,snapshot)
        argv=[('/app/'+deck.relative_to(snapshot).as_posix()) if v==decks[0] else v for v in cmdargs]
        checked=policy(snapshot/'circuit.spi','simle-a2-policy-'+uuid.uuid4().hex[:10])
        save(folder/'policy.json',checked)
        if checked['exit_code']:
            self.state['policy_errors']+=1
            return {'exit_code':checked['exit_code'],'stdout':checked['stdout'],'stderr':checked['stderr']}
        normalized=canonical((snapshot/'circuit.spi').read_text())
        key=hashlib.sha256(normalized.encode()).hexdigest()
        keys=[d['canonical_sha256'] for d in self.state['designs']]
        if key not in keys:
            if len(keys)>=self.limits['max_designs']:raise ValueError('Candidate audit bound exhausted')
            entry=dict(number=len(keys)+1,canonical_sha256=key,source_sha256=digest(snapshot/'circuit.spi'),first_request=self.state['requests'])
            self.state['designs'].append(entry)
            cdir=self.run/'candidates'/f'{entry["number"]:03d}';cdir.mkdir(parents=True)
            shutil.copy2(snapshot/'circuit.spi',cdir/'circuit.spi');save(cdir/'manifest.json',entry)
        self.state['native_runs']+=1
        save(self.run/'state.json',self.state)
        # Freeze the DUT file even inside the worker. Native output goes to the
        # agent-chosen directories in a copy; nothing can change the saved source.
        before={p.relative_to(snapshot).as_posix():digest(p) for p in snapshot.rglob('*') if p.is_file()}
        cmd=flags('simle-a2-native-'+uuid.uuid4().hex[:12],self.uid)+[
            '-v',f'{snapshot}:/app','-v',f'{snapshot/"circuit.spi"}:/app/circuit.spi:ro',
            '-e','HOME=/tmp','-w',cwd]+(
            ['-v',f'{ROOT/"trusted.spiceinit"}:/app/{relcwd.as_posix()}/.spiceinit:ro',
             '-v',f'{ROOT/"trusted.spiceinit"}:/tmp/.spiceinit:ro'] if PROFILE['kind']=='port' else [])+[BASE_IMAGE,'ngspice']+([] if PROFILE['kind']=='port' else ['-n'])+[v for v in argv if PROFILE['kind']!='port' or v not in ('-n','--no-spiceinit')]
        answer=capture(cmd,self.limits['simulation_timeout'])
        (folder/'stdout.log').write_text(answer['stdout']);(folder/'stderr.log').write_text(answer['stderr'])
        artifacts=[]
        for p in snapshot.rglob('*'):
            if not p.is_file() or p.is_symlink():continue
            rel=p.relative_to(snapshot).as_posix()
            if rel=='circuit.spi' or rel.startswith('testbench/') or rel.startswith('_gateway_'):continue
            if rel in before and before[rel]==digest(p):continue
            if p.stat().st_size>20*1024*1024:continue
            dest=self.workspace/rel
            if dest.is_symlink() or not dest.resolve().is_relative_to(self.workspace):continue
            dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest);artifacts.append(rel)
        save(folder/'artifact_files.json',artifacts)
        return answer

    def freeze(self):
        with self.lock:
            self.closed=True
            save(self.run/'state.json',self.state)
        self.server.shutdown();self.server.server_close()
        shutil.rmtree(self.socket_dir)
