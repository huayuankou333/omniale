import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateTicket} from '../app/engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export async function evaluate(state, truthOverride) {
  const truth=truthOverride||JSON.parse(await fs.readFile(path.join(root,'private/truth.json'),'utf8'));
  const initial=JSON.parse(await fs.readFile(path.join(root,'private/initial.json'),'utf8'));
  const checks=[],matched=new Set();
  const weight=80/truth.targets.length/5;
  const groups=[
    ['identity',weight,(a,b)=>a.asset_id===b.asset_id&&a.version===b.version&&a.issue_type===b.issue_type],
    ['source_range',weight,(a,b)=>Math.abs(a.in_seconds-b.in_seconds)<=truth.range_tolerance_seconds&&Math.abs(a.out_seconds-b.out_seconds)<=truth.range_tolerance_seconds],
    ['owner',weight,(a,b)=>a.owner===b.owner],
    ['status',weight,(a,b)=>a.status===b.status],
    ['priority',weight,(a,b)=>a.priority===b.priority]
  ];
  for (let i=0;i<truth.targets.length;i++) {
    const target=truth.targets[i];
    // New records require correct asset/version/type before field points are considered.
    const candidates=state.tickets.filter(t=>!matched.has(t.id)&&(target.id ? t.id===target.id :
      !initial.tickets.some(old=>old.id===t.id)&&t.asset_id===target.asset_id&&t.version===target.version&&t.issue_type===target.issue_type));
    candidates.sort((a,b)=>Math.abs(a.in_seconds-target.in_seconds)-Math.abs(b.in_seconds-target.in_seconds));
    const actual=candidates[0];if(actual)matched.add(actual.id);
    for (const [field,weight,fn] of groups)
      checks.push({id:`decision_${i+1}.${field}`,weight,ok:!!actual&&fn(actual,target),expected:target,actual:actual||null});
  }
  const preserved=truth.protected.map(id=>{
    const before=initial.tickets.find(t=>t.id===id),after=state.tickets.find(t=>t.id===id);
    return {id,ok:equal(before,after),before,after};
  });
  checks.push({id:'preserve_unrequested_records',weight:10,credit:preserved.filter(p=>p.ok).length/preserved.length,ok:preserved.every(p=>p.ok),evidence:preserved});
  const unexpected=state.tickets.filter(t=>!matched.has(t.id)&&!truth.protected.includes(t.id));
  const missingOld=initial.tickets.filter(t=>!state.tickets.some(s=>s.id===t.id));
  checks.push({id:'no_extra_or_deleted_records',weight:10,ok:unexpected.length===0&&missingOld.length===0,evidence:{unexpected,missingOld}});
  let valid=true;try{for(const t of state.tickets)validateTicket(t,state);if(new Set(state.tickets.map(t=>t.id)).size!==state.tickets.length)valid=false;}catch{valid=false}
  const score=valid?Math.round(checks.reduce((s,c)=>s+c.weight*(c.credit??Number(c.ok)),0)*100)/100:0;
  return {score,maximum:100,valid,success:score===100,checks,scoring_version:'case1-v2-same-80-10-10-field-scheme',
    note:'Partial field scoring; final persisted business state. Evidence notes are not scored.'};
}
export async function referenceState() {
  const state=JSON.parse(await fs.readFile(path.join(root,'private/initial.json'),'utf8'));
  const {targets}=JSON.parse(await fs.readFile(path.join(root,'private/truth.json'),'utf8'));
  for(const target of targets) {
    if(target.id)Object.assign(state.tickets.find(t=>t.id===target.id),target);
    else state.tickets.push({...target,id:`N${state.next_id++}`});
  }
  return state;
}
