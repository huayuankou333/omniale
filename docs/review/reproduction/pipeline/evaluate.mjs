import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {evaluate as ticketEvaluation} from './evaluate_tickets.mjs';
import {editable,validateGraph,releaseGate} from '../app/engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async name=>JSON.parse(await fs.readFile(path.join(root,'private',name),'utf8'));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sets=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&same([...a].sort(),[...b].sort());
export async function evaluate(state,truthOverride){
 const truth=truthOverride||await read('truth.json'),initial=await read('initial.json');const ticket=await ticketEvaluation(state,truth),matched=new Map();
 truth.targets.forEach((t,i)=>{const row=ticket.checks.find(c=>c.id===`decision_${i+1}.identity`);if(row?.actual)matched.set(t._key,row.actual);});
 const ids=keys=>keys.map(k=>matched.get(k)?.id||`MISSING:${k}`);
 const checks=ticket.checks.filter(c=>c.id.startsWith('decision_')).map(c=>({...c,weight:60/truth.targets.length/5,section:'tickets'})),relationChecks=[];
 for(const expected of truth.targets){
  const t=matched.get(expected._key),want=truth.relations[expected._key],fields=[];
  for(const field of ['depends_on','superseded_by'])fields.push(!!t&&sets(t[field]||[],ids(want[field])));
  for(const field of ['split_from','duplicate_of'])fields.push(!!t&&(t[field]||null)===(want[field]?matched.get(want[field])?.id||`MISSING:${want[field]}`:null));
  if(['R213','R214','R215'].includes(expected.id))fields.push(!!t&&t.note===initial.tickets.find(x=>x.id===expected.id).note);
  const active=Object.values(want).some(x=>Array.isArray(x)?x.length:!!x);
  relationChecks.push({id:`links.${active?'':'empty.'}${expected._key}`,weight:0,ok:fields.every(Boolean),credit:active?fields.filter(Boolean).length/fields.length:Number(fields.every(Boolean)),expected:want,actual:t||null,section:'links',empty:!active});
 }
 const active=relationChecks.filter(c=>!c.empty),empty=relationChecks.filter(c=>c.empty);active.forEach(c=>c.weight=12/active.length);empty.forEach(c=>c.weight=3/empty.length);checks.push(...relationChecks);
 for(const expected of truth.releases){
  const actual=state.releases?.find(r=>r.id===expected.id),original=initial.releases.find(r=>r.id===expected.id);
  const fields=[['identity',!!actual&&actual.version===expected.version&&actual.asset_id===original.asset_id&&actual.channel===original.channel&&actual.note===original.note],['requirements',!!actual&&sets(actual.required_ticket_ids,ids(expected.required_keys))],['status',actual?.status===expected.status],['blockers',!!actual&&sets(actual.blocker_ticket_ids,ids(expected.blocked_keys))]];
  for(const [field,ok] of fields)checks.push({id:`release.${expected.id}.${field}`,weight:15/truth.releases.length/4,ok,expected,actual:actual||null,section:'releases'});
 }
 const protectedRows=[...truth.protected.map(id=>({id,ok:same(state.tickets.find(t=>t.id===id),initial.tickets.find(t=>t.id===id))})),...truth.protected_releases.map(id=>({id,ok:same(state.releases?.find(t=>t.id===id),initial.releases.find(t=>t.id===id))}))];
 checks.push({id:'preservation',weight:5,ok:protectedRows.every(x=>x.ok),credit:protectedRows.filter(x=>x.ok).length/protectedRows.length,evidence:protectedRows,section:'integrity'});
 const matchIds=new Set([...matched.values()].map(t=>t.id)),extra=state.tickets.filter(t=>!matchIds.has(t.id)&&!truth.protected.includes(t.id)),missing=initial.tickets.filter(t=>!state.tickets.some(x=>x.id===t.id));
 const releaseIds=new Set(initial.releases.map(r=>r.id)),releaseIntegrity=state.releases?.length===initial.releases.length&&state.releases.every(r=>releaseIds.has(r.id))&&new Set(state.releases.map(r=>r.id)).size===state.releases.length;
 checks.push({id:'no_extra_or_deleted',weight:5,ok:extra.length===0&&missing.length===0&&releaseIntegrity,evidence:{extra,missing,releaseIntegrity},section:'integrity'});
 let valid=ticket.valid;try{validateGraph(state);}catch{valid=false;}
 const score=valid?Math.round(checks.reduce((s,c)=>s+c.weight*(c.credit??Number(c.ok)),0)*100)/100:0;
 const section_scores=Object.fromEntries(['tickets','links','releases','integrity'].map(k=>[k,Math.round(checks.filter(c=>c.section===k).reduce((n,c)=>n+c.weight*(c.credit??Number(c.ok)),0)*100)/100]));
 return {score,maximum:100,valid,success:score===100,complete_decisions:ticket.complete_decisions,target_count:truth.targets.length,complete_releases:truth.releases.filter(r=>checks.filter(c=>c.id.startsWith(`release.${r.id}.`)).every(c=>c.ok)).length,section_scores,checks,legacy_ticket_score:ticket.score,scoring_version:'case1-v4-60-15-15-10-frozen-before-evaluation',note:'Primary score adds dependency and release outcomes. Legacy 80/10/10 ticket score is separately reported; no score cap.'};
}
export async function referenceState(){
 const truth=await read('truth.json'),state=await read('initial.json'),mapping={};
 for(const t of truth.targets){const fields=Object.fromEntries(Object.entries(t).filter(([k])=>editable.includes(k)));
  if(t.id){Object.assign(state.tickets.find(x=>x.id===t.id),fields);mapping[t._key]=t.id;}else{const id=`N${state.next_id++}`;state.tickets.push({id,...fields});mapping[t._key]=id;}}
 for(const [key,rel] of Object.entries(truth.relations)){const t=state.tickets.find(x=>x.id===mapping[key]);for(const field of ['depends_on','superseded_by'])t[field]=rel[field].map(k=>mapping[k]);for(const field of ['split_from','duplicate_of'])t[field]=rel[field]?mapping[rel[field]]:null;}
 for(const r of truth.releases){const plan=state.releases.find(x=>x.id===r.id),required=r.required_keys.map(k=>mapping[k]),gate=releaseGate(state,required);Object.assign(plan,{version:r.version,required_ticket_ids:required,status:gate.status,blocker_ticket_ids:gate.blocker_ticket_ids});}
 return state;
}
