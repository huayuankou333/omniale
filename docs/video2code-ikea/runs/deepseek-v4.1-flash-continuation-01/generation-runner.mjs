import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';

const root=path.resolve('outputs/case4_video2code_ikea_v1/evaluation-one-shot-v1');
const run=root+'/runs/deepseek-v4.1-flash-continuation-01';
const model='deepseek-v4.1-flash';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const safe=x=>String(x).replace(/sk-[\w-]+/g,'[REDACTED]').replace(/github_pat_[\w]+/g,'[REDACTED]');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const save=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2));
const freeze=await read(root+'/DESIGN_FREEZE.json');
for(const f of freeze.files)if(sha(await fs.readFile(root+'/'+f.path))!==f.sha256)throw Error('Frozen input changed '+f.path);
const creds=await read('work/glm-amf-credentials.private.json');
const seed=await read(run+'/seed.json');
await fs.mkdir(run+'/project',{recursive:true});
await fs.copyFile('work/deepseek-continue-project.mjs',run+'/generation-runner.mjs');
let state;
try{state=await read(run+'/continuation-state.json')}catch(e){if(e.code!=='ENOENT')throw e;state={started_at:new Date().toISOString(),source_run:seed.source_run,files:seed.files.map(f=>({...f})),turns:[],complete:false,feedback:''};await save(run+'/continuation-state.json',state)}
if(state.complete)throw Error('Project already finalized; refusing another generation');
for(const f of state.files)await fs.writeFile(run+'/project/'+f.path,f.content);

const frames=await read(root+'/public/frame-manifest.json');
const task=await fs.readFile(root+'/public/TASK.md','utf8');
const baseContent=[{type:'input_text',text:task+'\nCHAPTERS:\n'+await fs.readFile(root+'/public/chapters.json','utf8')+'\n/assets/catalog.json:\n'+await fs.readFile(root+'/environment/assets/catalog.json','utf8')+'\n/assets/manifest.json:\n'+await fs.readFile(root+'/environment/assets/manifest.json','utf8')}];
for(const f of frames)baseContent.push({type:'input_text',text:'Video frame at '+f.actual_seconds.toFixed(2)+' seconds'},{type:'input_image',image_url:'data:image/png;base64,'+(await fs.readFile(root+'/'+f.path)).toString('base64'),detail:'high'});

const instructions=`Continue the supplied incomplete website implementation from its exact stopping point. The HUMAN USER HAS NOW OVERRIDDEN ONLY THE DELIVERY BUDGET: multiple model responses and file chunks are allowed until one complete project is delivered. This supersedes any earlier one-response, submit_project-only or do-not-wait wording in TASK.md. All original website requirements, video, assets and scoring remain unchanged. No browser execution, self-test, grading feedback or code revisions are available. Previously emitted characters are immutable: only append missing source text. Already complete files must not be rewritten. You are continuing your previous code, not generating an alternative. Use append_file_chunk for exactly one manageable chunk of at most about 12000 source characters in this response; subsequent responses may append further chunks with NO overall turn or output-token budget. This chunk guidance avoids the gateway's per-response truncation; it is not an overall project budget. Start exactly after the pending file prefix, including any unfinished token, without repeating the prefix or adding markdown fences. Set file_complete only when the full file is finished. Set project_complete only when all needed project files have been completed. You may add a new file only after the pending file is complete. Use the exact UTF-8 byte offset provided. Do not explain or summarize instead of returning code.`;
const tool={type:'function',name:'append_file_chunk',description:'Append exact missing source text to an unfinished file, or start a new required file after the previous file is complete. No rewriting or runtime feedback.',parameters:{type:'object',properties:{path:{type:'string'},offset_utf8_bytes:{type:'integer'},content:{type:'string'},file_complete:{type:'boolean'},project_complete:{type:'boolean'}},required:['path','offset_utf8_bytes','content','file_complete','project_complete'],additionalProperties:false}};

function validPath(p){return typeof p==='string'&&!p.includes('\\')&&!p.includes(':')&&!p.startsWith('/')&&!p.split('/').some(x=>['..','.',''].includes(x))&&!/^(assets|vendor)\//.test(p)&&/\.(html|css|js|mjs|json|md|txt|svg)$/i.test(p)}
async function request(body,dir){
 const payload=Buffer.from(JSON.stringify(body));
 await save(dir+'/request-started.json',{model,time:new Date().toISOString(),request_body_sha256:sha(payload),frames:frames.length,input_packet_freeze:sha(await fs.readFile(root+'/DESIGN_FREEZE.json')),max_output_tokens_field:false,max_tokens_field:false,abort_timeout:false,requested_reasoning:'high',endpoint:creds.base_url+'/v1/responses',request_bytes:payload.length,files_before:state.files.map(f=>({path:f.path,bytes:Buffer.byteLength(f.content),sha256:sha(f.content),complete:f.complete}))});
 let bytes=0,events=0,stage='connecting',response;const started=Date.now(),deltas=new Map();
 const heartbeat=setInterval(()=>console.log(JSON.stringify({event:'progress',turn:state.turns.length+1,stage,elapsed_seconds:Math.round((Date.now()-started)/1000),bytes,events})),45000);
 try{
  const res=await new Promise((resolve,reject)=>{const req=https.request(creds.base_url+'/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+creds.token,'Content-Type':'application/json','Content-Length':payload.length},agent:new https.Agent({keepAlive:true,timeout:0})},resolve);req.on('finish',()=>{stage='awaiting_response'});req.on('error',reject);req.setTimeout(0);req.end(payload)});
  stage='receiving';
  if(res.statusCode<200||res.statusCode>=300){let txt='';for await(const c of res)txt+=c.toString();throw Error('HTTP '+res.statusCode+' '+safe(txt.slice(0,2000)))}
  const log=await fs.open(dir+'/stream.ndjson','a'),dec=new TextDecoder();let buffer='';
  try{for await(const c of res){bytes+=c.length;buffer+=dec.decode(c,{stream:true}).replace(/\r/g,'');let at;while((at=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,at);buffer=buffer.slice(at+2);const data=block.split('\n').filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trim()).join('\n');if(!data||data==='[DONE]')continue;let e;try{e=JSON.parse(data)}catch{continue}events++;await log.write(safe(JSON.stringify(e))+'\n');if(e.type==='response.function_call_arguments.delta')deltas.set(e.item_id,(deltas.get(e.item_id)||'')+e.delta);if(['response.completed','response.incomplete','response.failed'].includes(e.type))response=e.response;if(e.type==='error')throw Error(safe(JSON.stringify(e)))}}}finally{await log.close()}
  if(response)await fs.writeFile(dir+'/response.json',safe(JSON.stringify(response,null,2)));
  await save(dir+'/tool-argument-deltas.json',Object.fromEntries(deltas));
  if(!response)throw Error('Stream ended without terminal response');
  return {response,elapsed_seconds:(Date.now()-started)/1000,bytes,events};
 }finally{clearInterval(heartbeat)}
}

let failures=0;
while(!state.complete){
 const turn=state.turns.length+1,dir=run+'/turn-'+String(turn).padStart(3,'0');
 await fs.mkdir(dir,{recursive:true});
 const pending=state.files.find(f=>!f.complete);
 const deliveryState={files:state.files,pending_file:pending?{path:pending.path,offset_utf8_bytes:Buffer.byteLength(pending.content),tail:pending.content.slice(-1400)}:null,transport_feedback:state.feedback||null};
 const body={model,instructions,input:[{role:'user',content:baseContent},{role:'user',content:[{type:'input_text',text:'CONTINUATION STATE. The following source has already been emitted by you and must remain immutable. Append only the missing suffix. All files and the pending file prefix are provided in full:\n'+JSON.stringify(deliveryState)}]}],tools:[tool],tool_choice:'auto',parallel_tool_calls:false,reasoning:{effort:'high'},store:false,stream:true};
 console.log(JSON.stringify({event:'turn_started',turn,pending_file:pending?.path,offset_utf8_bytes:pending?Buffer.byteLength(pending.content):0}));
 let record={turn,started_at:new Date().toISOString()};
 try{
  const r=await request(body,dir),resp=r.response;
  record={...record,...r,response:undefined,provider_status:resp.status,incomplete_details:resp.incomplete_details,usage:resp.usage};
  const calls=(resp.output||[]).filter(x=>x.type==='function_call'&&x.name==='append_file_chunk');
  if(calls.length!==1)throw Error('Serialization: expected one append_file_chunk, got '+calls.length);
  const c=JSON.parse(calls[0].arguments);
  if(!validPath(c.path)||typeof c.content!=='string'||!Number.isInteger(c.offset_utf8_bytes)||typeof c.file_complete!=='boolean'||typeof c.project_complete!=='boolean')throw Error('Serialization: invalid chunk schema');
  let file=state.files.find(f=>f.path===c.path);
  if(pending&&pending.path!==c.path)throw Error('Serialization: current unfinished file must be continued first');
  if(file?.complete)throw Error('Serialization: rewriting completed files is not allowed');
  if(!file){file={path:c.path,content:'',complete:false};if(c.offset_utf8_bytes!==0)throw Error('Serialization: new file offset must be zero')}
  if(c.offset_utf8_bytes!==Buffer.byteLength(file.content))throw Error('Serialization: offset does not match current file size');
  if(!c.content.length&&!c.file_complete)throw Error('Serialization: no progress in chunk');
  if(c.project_complete&&!c.file_complete)throw Error('Serialization: project cannot be complete with an unfinished file');
  const before=Buffer.byteLength(file.content),prefixHash=sha(file.content);
  if(!state.files.includes(file))state.files.push(file);
  file.content+=c.content;file.complete=c.file_complete;
  const target=path.join(run,'project',c.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,file.content);
  record.accepted={path:c.path,offset_utf8_bytes:before,appended_bytes:Buffer.byteLength(c.content),prefix_sha256:prefixHash,chunk_sha256:sha(c.content),result_sha256:sha(file.content),file_complete:file.complete,project_complete:c.project_complete};
  await save(dir+'/accepted-chunk.json',{...record.accepted,content:c.content});
  state.complete=c.project_complete&&state.files.every(f=>f.complete)&&state.files.some(f=>f.path==='index.html');
  state.feedback='Last chunk accepted unchanged. Continue at the current offset, or add any remaining required file.';failures=0;
 }catch(e){record.error=safe(e.message);state.feedback='Delivery serialization or transport issue only (no runtime testing occurred): '+record.error+'. Return one valid append_file_chunk at the provided current offset. Previously accepted content remains immutable.';failures++}
 state.turns.push(record);await save(dir+'/status.json',record);await save(run+'/continuation-state.json',state);
 const usage=state.turns.reduce((a,t)=>({input_tokens:a.input_tokens+(t.usage?.input_tokens||0),output_tokens:a.output_tokens+(t.usage?.output_tokens||0),reasoning_tokens:a.reasoning_tokens+(t.usage?.output_tokens_details?.reasoning_tokens||0)}),{input_tokens:0,output_tokens:0,reasoning_tokens:0});
 await save(run+'/status.json',{model,status:state.complete?'delivered':'running',protocol:'multi-call-continuation-v1',seed_run:seed.source_run,continuation_calls:state.turns.length,source_generation_calls:1,total_generation_calls:state.turns.length+1,usage,source_usage:(await read(root+'/runs/'+seed.source_run+'/status.json')).usage,elapsed_seconds:(Date.now()-Date.parse(state.started_at))/1000,repairs:0,self_test_calls:0,immutable_prefix:true,files:state.files.map(f=>({path:f.path,bytes:Buffer.byteLength(f.content),complete:f.complete})),last_error:record.error||null});
 console.log(JSON.stringify({event:'turn_finished',turn,...record,response:undefined,usage}));
 if(failures>=3)throw Error('Three consecutive delivery/transport errors; state preserved for protocol recovery, not restarting generation');
}
for(const original of seed.files){const current=state.files.find(f=>f.path===original.path);if(!current?.content.startsWith(original.content)||original.complete&&current.content!==original.content)throw Error('Seed prefix changed')}
const files=state.files.map(f=>({path:f.path,bytes:Buffer.byteLength(f.content),sha256:sha(f.content)})).sort((a,b)=>a.path.localeCompare(b.path));
await save(run+'/candidate-manifest.json',{files,candidate_hash:sha(JSON.stringify(files)),frozen_at:new Date().toISOString(),protocol:'multi-call-continuation-v1',source_run:seed.source_run,seed_sha256:sha(await fs.readFile(run+'/seed.json')),no_repair:true,all_seed_prefixes_unmodified:true,continuation_calls:state.turns.length});
await save(run+'/response.json',{model,status:'completed',representation:'Unmodified file chunks appended to the prior truncated generation; complete chronological evidence in continuation-state.json and turn directories.',output:[{type:'function_call',name:'submit_project',arguments:JSON.stringify({files:state.files.map(({path,content})=>({path,content}))}),synthetic_envelope:true}],usage:state.turns.reduce((a,t)=>({input_tokens:a.input_tokens+(t.usage?.input_tokens||0),output_tokens:a.output_tokens+(t.usage?.output_tokens||0)}),{input_tokens:0,output_tokens:0})});
console.log(JSON.stringify({event:'project_complete',files:files.length,continuation_calls:state.turns.length,candidate_hash:sha(JSON.stringify(files))}));
