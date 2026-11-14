"""Launch authenticated work with secrets only in process memory/stdin."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
from config import ROOT

def main():
    ap=argparse.ArgumentParser();ap.add_argument('mode',choices=['preflight','run']);args=ap.parse_args()
    key=sys.stdin.readline().strip()
    assert key
    if args.mode=='preflight':
        result=subprocess.run([sys.executable,str(ROOT/'run_agent.py'),'preflight','--key-stdin'],input=key+'\n',text=True,capture_output=True,timeout=90)
        print(result.stdout.replace(key,'<redacted>'),end='');print(result.stderr.replace(key,'<redacted>'),end='',file=sys.stderr)
        raise SystemExit(result.returncode)
    log=(ROOT/'run_models.log').open('ab')
    process=subprocess.Popen([sys.executable,'-u',str(ROOT/'run_agent.py'),'run','--key-stdin'],
                             stdin=subprocess.PIPE,stdout=log,stderr=subprocess.STDOUT,
                             start_new_session=True,close_fds=True,cwd=ROOT)
    process.stdin.write((key+'\n').encode());process.stdin.close();log.close()
    print(json.dumps({'pid':process.pid,'log':str(ROOT/'run_models.log'),'credential_storage':'process memory only'}))

if __name__=='__main__':main()
