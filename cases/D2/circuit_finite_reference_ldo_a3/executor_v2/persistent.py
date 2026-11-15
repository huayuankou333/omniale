"""Persistent sandbox pool: avoid Docker teardown delays being scored as DUT errors."""
from contextlib import contextmanager
from pathlib import Path
import json,os,queue,shutil,subprocess,threading,time,uuid
from config import ROOT,CASE,BASE_IMAGE,save,digest
_pool=None

class Pool:
    def __init__(self):
        self.lock=threading.Lock();self.available=queue.Queue();self.entries=[]
        self.add()
    def add(self):
        i=len(self.entries);folder=ROOT/'worker_slots'/f'{os.getpid()}_{i}_{uuid.uuid4().hex[:6]}'
        app=folder/'app';logs=folder/'logs';app.mkdir(parents=True);logs.mkdir()
        name='simle-'+CASE.lower()+'-persistent-'+uuid.uuid4().hex[:12]
        cmd=['docker','run','-d','--name',name,'--network','none','--cpus','2','--memory','4g','--pids-limit','128','--cap-drop','ALL','--security-opt','no-new-privileges',
             '--user',f'{os.getuid()}:{os.getgid()}','--read-only','--tmpfs','/tmp:rw,nosuid,size=512m',
             '-e','HOME=/tmp','-e','OMP_NUM_THREADS=1','-e','OMP_THREAD_LIMIT=1','-e','OMP_WAIT_POLICY=PASSIVE','-e','OPENBLAS_NUM_THREADS=1','-e','PYTHONDONTWRITEBYTECODE=1',
             '-v',f'{app}:/app','-v',f'{logs}:/logs/verifier','-v',f'{ROOT}:/trusted:ro',BASE_IMAGE,'sleep','infinity']
        t=time.monotonic();r=subprocess.run(cmd,capture_output=True,text=True,timeout=180)
        if r.returncode:raise RuntimeError('Native sandbox startup failed: '+r.stderr[-1000:])
        entry={'name':name,'app':app,'logs':logs,'folder':folder,'startup_seconds':time.monotonic()-t}
        self.entries.append(entry);self.available.put(entry)
        save(folder/'sandbox.json',{k:str(v) if isinstance(v,Path) else v for k,v in entry.items()})
    @contextmanager
    def slot(self):
        e=self.available.get()
        try:yield e
        finally:self.available.put(e)
    def close(self):
        for e in self.entries:
            try:subprocess.run(['docker','rm','-f',e['name']],capture_output=True,timeout=15)
            except subprocess.TimeoutExpired:pass

def pool():
    global _pool
    if _pool is None:_pool=Pool()
    return _pool

def reset_app(entry):
    app=entry['app']
    assert app.resolve().is_relative_to((ROOT/'worker_slots').resolve()) and app.name=='app'
    for p in app.iterdir():
        if p.is_dir() and not p.is_symlink():shutil.rmtree(p)
        else:p.unlink()
    for p in entry['logs'].iterdir():
        if p.is_file():p.unlink()

def run(entry,command,cwd,timeout):
    cmd=['docker','exec',entry['name'],'python3','/trusted/worker_exec.py','--timeout',str(timeout),'--cwd',cwd,'--',*command]
    started=time.monotonic()
    try:r=subprocess.run(cmd,capture_output=True,text=True,errors='replace',timeout=timeout+60)
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError('Docker exec transport stalled outside the native solver timer') from exc
    if r.returncode:raise RuntimeError('Docker exec infrastructure failed: '+r.stderr[-1500:])
    try:answer=json.loads(r.stdout)
    except ValueError as exc:raise RuntimeError('Native sandbox returned malformed transport data') from exc
    answer['docker_exec_wall_seconds']=round(time.monotonic()-started,3)
    return answer

def simulate_snapshot(snapshot,cwd,argv,timeout):
    # Serialized by development broker. Formal application uses individual slots.
    with pool().slot() as e:
        reset_app(e);app=e['app']
        shutil.copytree(snapshot,app,dirs_exist_ok=True)
        (app/'circuit.spi').chmod(0o444);before=digest(app/'circuit.spi')
        answer=run(e,['ngspice','-n',*argv],cwd,timeout)
        if digest(app/'circuit.spi')!=before:raise RuntimeError('DUT changed inside native worker')
        # Copy native outputs back; source snapshot remains auditable.
        for p in app.rglob('*'):
            if p.is_file() and not p.is_symlink() and p.relative_to(app).as_posix()!='circuit.spi':
                q=Path(snapshot)/p.relative_to(app);q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
        return answer

def simulate_application(circuit,root,row,timeout):
    with pool().slot() as e:
        reset_app(e);app=e['app'];job=app/'job';job.mkdir()
        shutil.copyfile(circuit,app/'circuit.spi');(app/'circuit.spi').chmod(0o444)
        before=digest(app/'circuit.spi')
        for name in ['finite_reference.spi','sample_switch.spi']:
            if (root/name).exists():shutil.copyfile(root/name,app/name)
        deck=(root/row['deck']).read_text().replace('/eval/finite_reference.spi','/app/finite_reference.spi').replace('/eval/sample_switch.spi','/app/sample_switch.spi')
        (job/'bench.cir').write_text(deck)
        answer=run(e,['ngspice','-n','-b','bench.cir'],'/app/job',timeout)
        assert digest(app/'circuit.spi')==before
        dest=root/Path(row['deck']).parent
        for p in job.iterdir():
            if p.is_file() and p.name!='bench.cir':shutil.copy2(p,dest/p.name)
        return answer

def run_original(circuit,destination):
    with pool().slot() as e:
        reset_app(e);app=e['app'];shutil.copyfile(circuit,app/'circuit.spi');(app/'circuit.spi').chmod(0o444)
        before=digest(app/'circuit.spi')
        answer=run(e,['python3','/trusted/researcher/original/tests/verify.py'],'/app',3600)
        assert digest(app/'circuit.spi')==before
        logs=Path(destination)/'logs';logs.mkdir(parents=True,exist_ok=True)
        shutil.copytree(e['logs'],logs,dirs_exist_ok=True)
        return answer

def close():
    if _pool is not None:_pool.close()
