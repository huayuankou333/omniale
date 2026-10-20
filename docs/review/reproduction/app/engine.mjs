import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
export const enums={issue_type:['audio_gap','av_sync','channel_swap','click','subtitle','title','logo','crop','color','endcard'],owner:['audio','design','editorial','color','production'],status:['open','blocked','resolved','dismissed'],priority:['p1','p2','p3']};
export const editable=['asset_id','version','issue_type','in_seconds','out_seconds','owner','status','priority','note','depends_on','split_from','superseded_by','duplicate_of'];
export const durationOf=(asset,version)=>asset.version_durations?.[version]??asset.duration;
export async function readState(file){return JSON.parse(await fs.readFile(file,'utf8'));}
const ids=(x,name)=>{if(!Array.isArray(x)||x.some(id=>typeof id!=='string')||new Set(x).size!==x.length)throw new Error(`Invalid ${name}: use unique ticket IDs`);};
export function validateTicket(ticket,state){
 const asset=state.assets.find(a=>a.id===ticket.asset_id&&a.versions.includes(ticket.version));if(!asset)throw new Error('Unknown asset/version');
 for(const [field,allowed] of Object.entries(enums))if(!allowed.includes(ticket[field]))throw new Error(`Invalid ${field}`);
 if(!Number.isFinite(ticket.in_seconds)||!Number.isFinite(ticket.out_seconds)||ticket.in_seconds<0||ticket.out_seconds<=ticket.in_seconds||ticket.out_seconds>durationOf(asset,ticket.version))throw new Error('Invalid source-relative interval for this version');
 if(ticket.note!==undefined&&(typeof ticket.note!=='string'||ticket.note.length>2000))throw new Error('Invalid note');
 for(const field of ['depends_on','superseded_by'])if(ticket[field]!==undefined)ids(ticket[field],field);
 for(const field of ['split_from','duplicate_of'])if(ticket[field]!==undefined&&ticket[field]!==null&&typeof ticket[field]!=='string')throw new Error(`Invalid ${field}`);
}
export function validateGraph(state){
 const by=new Map(state.tickets.map(t=>[t.id,t]));if(by.size!==state.tickets.length)throw new Error('Duplicate ticket ID');
 for(const t of state.tickets){validateTicket(t,state);
  for(const id of [...(t.depends_on||[]),...(t.superseded_by||[]),t.split_from,t.duplicate_of].filter(Boolean))if(id===t.id||!by.has(id))throw new Error(`Unknown/self ticket reference from ${t.id}`);
  if(t.duplicate_of&&t.status!=='dismissed')throw new Error('A duplicate must be dismissed');
  if(t.superseded_by?.length&&t.status!=='dismissed')throw new Error('A superseded bundle must be dismissed');
 }
 for(const field of ['depends_on','duplicate_of','superseded_by']){
  const active=new Set(),done=new Set();const visit=id=>{if(active.has(id))throw new Error(`${field} cycle`);if(done.has(id))return;active.add(id);const value=by.get(id)[field];for(const next of Array.isArray(value)?value:value?[value]:[])visit(next);active.delete(id);done.add(id);};
  for(const id of by.keys())visit(id);
 }
}
export function releaseGate(state,required){
 ids(required,'required_ticket_ids');const by=new Map(state.tickets.map(t=>[t.id,t])),seen=new Set(),active=new Set();
 function visit(id){if(active.has(id))throw new Error('Dependency cycle');if(seen.has(id))return;const t=by.get(id);if(!t)throw new Error('Unknown release requirement');active.add(id);seen.add(id);for(const d of t.depends_on||[])visit(d);active.delete(id);}
 required.forEach(visit);const blockers=[...seen].filter(id=>by.get(id).status==='blocked').sort();
 return {status:blockers.length?'hold':[...seen].some(id=>by.get(id).status==='open')?'queued':'ready',blocker_ticket_ids:blockers,closure:[...seen].sort()};
}
function requestId(request){if(typeof request.request_id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(request.request_id))throw new Error('Invalid request_id');}
function requestDigest(kind,operations){return crypto.createHash('sha256').update(JSON.stringify({kind,operations})).digest('hex');}
function replay(original,request,digest){const found=original.receipts.find(r=>r.request_id===request.request_id);if(found){if(found.digest!==digest)throw new Error('request_id already used for a different transaction');return {state:original,receipt:found,replay:true};}}
function commit(state,request,digest,changed,kind){state.revision++;const receipt={request_id:request.request_id,digest,changed,revision:state.revision,kind};state.receipts.push(receipt);return {state,receipt,replay:false};}
export function transaction(original,request){
 requestId(request);const digest=requestDigest('tickets',request.operations),replayed=replay(original,request,digest);if(replayed)return replayed;
 if(!Array.isArray(request.operations)||request.operations.length<1||request.operations.length>30)throw new Error('Supply 1-30 operations');
 const state=structuredClone(original),changed=[];
 for(const op of request.operations){
  if(!['create','update'].includes(op.action))throw new Error('Only create/update supported; retain withdrawn records as dismissed');
  if(!op.fields||Object.keys(op.fields).some(k=>!editable.includes(k)))throw new Error('Unknown ticket field');let ticket;
  if(op.action==='create'){
   ticket={id:`N${state.next_id++}`,...op.fields};validateTicket(ticket,state);
   if(state.tickets.some(t=>t.asset_id===ticket.asset_id&&t.version===ticket.version&&t.issue_type===ticket.issue_type&&Math.abs(t.in_seconds-ticket.in_seconds)<.25&&Math.abs(t.out_seconds-ticket.out_seconds)<.25))throw new Error('Duplicate ticket interval; reuse or merge the existing record');state.tickets.push(ticket);
  }else{ticket=state.tickets.find(t=>t.id===op.id);if(!ticket)throw new Error('Unknown ticket id');Object.assign(ticket,op.fields);validateTicket(ticket,state);}
  changed.push(ticket.id);
 }
 validateGraph(state);return commit(state,request,digest,changed,'tickets');
}
export function releaseTransaction(original,request){
 requestId(request);const digest=requestDigest('releases',request.operations),replayed=replay(original,request,digest);if(replayed)return replayed;
 if(!Number.isInteger(request.expected_revision)||request.expected_revision!==original.revision)throw new Error(`Revision conflict; current revision is ${original.revision}`);
 if(!Array.isArray(request.operations)||request.operations.length<1||request.operations.length>12)throw new Error('Supply 1-12 release operations');
 const state=structuredClone(original),changed=[];
 for(const op of request.operations){
  const plan=state.releases.find(r=>r.id===op.id);if(!plan)throw new Error('Unknown release plan');const f=op.fields,allowed=['version','required_ticket_ids','status','blocker_ticket_ids'];
  if(!f||Object.keys(f).some(k=>!allowed.includes(k))||allowed.some(k=>!(k in f)))throw new Error('Supply exactly version, required_ticket_ids, status, blocker_ticket_ids');
  if(!state.assets.some(a=>a.id===plan.asset_id&&a.versions.includes(f.version)))throw new Error('Unknown release version');ids(f.required_ticket_ids,'required_ticket_ids');ids(f.blocker_ticket_ids,'blocker_ticket_ids');
  if(!f.required_ticket_ids.length)throw new Error('A configured release needs at least one requirement');const gate=releaseGate(state,f.required_ticket_ids);
  if(f.status!==gate.status||JSON.stringify([...f.blocker_ticket_ids].sort())!==JSON.stringify(gate.blocker_ticket_ids))throw new Error('Inconsistent live dependency gate: '+JSON.stringify(gate));
  Object.assign(plan,structuredClone(f));changed.push(plan.id);
 }
 return commit(state,request,digest,changed,'releases');
}
async function persist(file,request,fn){const result=fn(await readState(file),request);if(!result.replay){await fs.mkdir(path.dirname(file),{recursive:true});const temp=`${file}.tmp`;await fs.writeFile(temp,JSON.stringify(result.state,null,2));await fs.rename(temp,file);}return result.receipt;}
export const applyTransaction=(file,request)=>persist(file,request,transaction);
export const applyReleaseTransaction=(file,request)=>persist(file,request,releaseTransaction);
