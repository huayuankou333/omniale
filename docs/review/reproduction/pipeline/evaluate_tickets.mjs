import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateTicket} from '../app/engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const identity=t=>[t.asset_id,t.version,t.issue_type].join('|');
const key=t=>t.id?'existing:'+t.id:'new:'+identity(t);

export async function evaluate(state,truthOverride){
 const truth=truthOverride||JSON.parse(await fs.readFile(path.join(root,'private/truth.json'),'utf8'));
 const initial=JSON.parse(await fs.readFile(path.join(root,'private/initial.json'),'utf8'));
 const oldIds=new Set(initial.tickets.map(t=>t.id));
 const groups=[
  ['identity',(a,b)=>identity(a)===identity(b)],
  ['source_range',(a,b)=>Math.abs(a.in_seconds-b.in_seconds)<=truth.range_tolerance_seconds&&Math.abs(a.out_seconds-b.out_seconds)<=truth.range_tolerance_seconds],
  ['owner',(a,b)=>a.owner===b.owner],['status',(a,b)=>a.status===b.status],['priority',(a,b)=>a.priority===b.priority]
 ];
 const targets=new Map();truth.targets.forEach((t,i)=>{const k=key(t);if(!targets.has(k))targets.set(k,[]);targets.get(k).push({t,i});});
 const assigned=new Map(),matched=new Set();
 // Maximum field-credit matching within each exact identity group. No record-order dependence
 // when two similar inserts need separate tickets. Existing records remain locked to their ID.
 for(const [k,ts] of targets){
  const candidates=state.tickets.filter(t=>k.startsWith('existing:')?t.id===ts[0].t.id:!oldIds.has(t.id)&&identity(t)===identity(ts[0].t));
  let dp=new Map([[0,{points:0,pairs:[]}]]);
  for(const c of candidates){
   const next=new Map(dp);
   for(const [mask,entry] of dp)for(let j=0;j<ts.length;j++)if(!(mask&(1<<j))){
    const points=entry.points+groups.reduce((n,[,fn])=>n+Number(fn(c,ts[j].t)),0);
    const m=mask|(1<<j);if(!next.has(m)||next.get(m).points<points)next.set(m,{points,pairs:[...entry.pairs,[ts[j].i,c]]});
   }
   dp=next;
  }
  const best=[...dp.values()].sort((a,b)=>b.points-a.points||b.pairs.length-a.pairs.length)[0];
  for(const [i,c] of best.pairs){assigned.set(i,c);matched.add(c.id);}
 }
 const checks=[],weight=80/truth.targets.length/5;let complete=0;
 truth.targets.forEach((expected,i)=>{
  const actual=assigned.get(i);let passed=0;
  for(const [field,fn] of groups){const ok=!!actual&&fn(actual,expected);passed+=Number(ok);checks.push({id:`decision_${i+1}.${field}`,weight,ok,expected,actual:actual||null});}
  if(passed===5)complete++;
 });
 const preserved=truth.protected.map(id=>{const before=initial.tickets.find(t=>t.id===id),after=state.tickets.find(t=>t.id===id);return {id,ok:equal(before,after),before,after};});
 checks.push({id:'preserve_unrequested_records',weight:10,credit:preserved.filter(p=>p.ok).length/preserved.length,ok:preserved.every(p=>p.ok),evidence:preserved});
 const unexpected=state.tickets.filter(t=>!matched.has(t.id)&&!truth.protected.includes(t.id));
 const missingOld=initial.tickets.filter(t=>!state.tickets.some(s=>s.id===t.id));
 checks.push({id:'no_extra_or_deleted_records',weight:10,ok:unexpected.length===0&&missingOld.length===0,evidence:{unexpected,missingOld}});
 let valid=true;try{for(const t of state.tickets)validateTicket(t,state);if(new Set(state.tickets.map(t=>t.id)).size!==state.tickets.length)valid=false;}catch{valid=false;}
 const score=valid?Math.round(checks.reduce((s,c)=>s+c.weight*(c.credit??Number(c.ok)),0)*100)/100:0;
 return {score,maximum:100,valid,success:score===100,complete_decisions:complete,target_count:truth.targets.length,checks,
  scoring_version:'case1-v3-same-80-10-10-optimal-identity-assignment',note:'Same 80/10/10 field weights; notes are not scored except preserved history. No score cap.'};
}
export async function referenceState(){
 const state=JSON.parse(await fs.readFile(path.join(root,'private/initial.json'),'utf8'));
 const {targets}=JSON.parse(await fs.readFile(path.join(root,'private/truth.json'),'utf8'));
 for(const t of targets)if(t.id)Object.assign(state.tickets.find(r=>r.id===t.id),t);else state.tickets.push({...t,id:`N${state.next_id++}`});
 return state;
}
