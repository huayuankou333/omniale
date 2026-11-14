import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from check_netlist import check,benchmark_rules

def main():
 try:
  source=Path(sys.argv[1]).read_text()
  cleaned,unsafe,violations,notes=check(source,'iref inp inn out')
  violations+=benchmark_rules(cleaned,'iref inp inn out')
  report={'unsafe':unsafe,'violations':violations,'notes':notes,'passed':not unsafe and not violations}
 except (IndexError,ValueError,KeyError,TypeError) as exc:
  report={'passed':False,'parser_error':str(exc)}
 print(json.dumps(report))
 raise SystemExit(0 if report['passed'] else 1)
if __name__=='__main__':main()
