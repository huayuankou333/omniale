import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadEnv} from '../../harness/config.mjs';
import {readState,applyTransaction,validateTicket} from '../app/engine.mjs';
import {evaluate} from './evaluate.mjs';
import {requestModel} from './providers.mjs';
loadEnv();
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const FFMPEG=process.env.FFMPEG_PATH||'F:\\annconda\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
const PYTHON=process.env.CASE1_PYTHON||'F:\\annconda\\python.exe';
const mode=process.env.CASE1_MODE||'full';
if(!['full','no_media','video_only','audio_only'].includes(mode))throw new Error('Invalid CASE1_MODE');
const provider=process.env.CASE1_PROVIDER||'openai';
const key=(provider==='anthropic'?process.env.OMNIALE_ANTHROPIC_KEY:process.env.OMNIALE_PROXY_KEY)?.trim();
const base=(provider==='anthropic'?(process.env.OMNIALE_ANTHROPIC_BASE_URL||'https://routify-pub.alibaba-inc.com/protocol/anthropic'):
 (process.env.OMNIALE_PROXY_BASE_URL||'https://api-temporary.nju-link.com/v1')).replace(/\/$/,'');
const model=process.env.CASE1_MODEL||'gpt-6-luna';
if(!/^[\w.-]+$/.test(model))throw new Error('Invalid model identifier');
const maxTurns=Math.min(60,Math.max(1,Number(process.env.CASE1_MAX_TURNS||40)));
const object=(properties={},required=[])=>({type:'object',properties,required,additionalProperties:false});
const str={type:'string'},num={type:'number'};
const tool=(name,description,parameters=object())=>({type:'function',name,description,parameters,strict:false});
export function allowedReadPath(p){return typeof p==='string'&&['task.md','app/engine.mjs'].includes(p);}
export const tools=[
 tool('get_state','Read the live persistent database and source asset/version catalog.'),
 tool('read_file','Read task.md or app/engine.mjs only. The normal app has no hidden business answers.',object({path:str},['path'])),
 tool('apply_changes','Atomically create/update persistent review tickets. Use one request_id per distinct transaction; identical retries are idempotent. Update existing tickets by id. No hidden answer feedback is returned.',
   object({request_id:str,operations:{type:'array',items:object({action:{type:'string',enum:['create','update']},id:str,fields:object({
     asset_id:str,version:str,issue_type:str,in_seconds:num,out_seconds:num,owner:str,status:str,priority:str,note:str
   })},['action','fields'])}},['request_id','operations'])),
 tool('get_frame','Inspect a frame of the review recording at meeting-relative seconds. Returns a real decoded image; no scene annotations.',
   object({seconds:num},['seconds'])),
 tool('contact_sheet','Inspect up to 256 frames from review or a source export, automatically paginated into readable 16-frame sheets with no subsampling. For source specify asset_id/version; times are source-relative. Sampling is [start_seconds,end_seconds); end may equal video duration. Equal start/end requests one frame. No shot labels or boundaries are supplied.',
   object({media:{type:'string',enum:['review','source']},asset_id:str,version:str,start_seconds:num,end_seconds:num,step_seconds:num},['media','start_seconds','end_seconds','step_seconds'])),
 tool('transcribe_source','Independently transcribe speech from a selected source export interval (max 30s). Does not classify faults.',
   object({asset_id:str,version:str,start_seconds:num,end_seconds:num},['asset_id','version','start_seconds','end_seconds'])),
 tool('get_transcript','Read independently transcribed recording speech in a meeting-relative time window. Contains ASR errors, not ground truth.',
   object({start_seconds:num,end_seconds:num},['start_seconds','end_seconds'])),
 tool('measure_audio','Measure 100ms L/R RMS plus spectral band energies of a source export. Does not identify events, label faults or provide ticket answers.',
   object({asset_id:str,version:str,start_seconds:num,end_seconds:num},['asset_id','version','start_seconds','end_seconds'])),
 tool('public_check','Check persisted data schema and duplicate intervals only. Does not evaluate the review decisions.'),
 tool('finish','Finish the task. The database state, not this summary, is the deliverable.',object({summary:str},['summary']))
];
function child(exe,args){
 return new Promise((resolve,reject)=>{
  const p=spawn(exe,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let out='',err='';
  const timer=setTimeout(()=>{p.kill();reject(new Error('Tool timed out'));},60000);
  p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);
  p.on('error',e=>{clearTimeout(timer);reject(e)});
  p.on('exit',code=>{clearTimeout(timer);code===0?resolve(out):reject(new Error(err.slice(0,1500)))});
 });
}
const sha=async file=>crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
async function main(){
 if(!key)throw new Error('Set the provider key in the process environment. Keys are never saved by this pipeline.');
 const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
 const resume=process.env.CASE1_RESUME_RUN;
 const runDir=resume?path.resolve(resume):path.join(path.dirname(ROOT),'runs',`case1_review_v2-${model}-${mode}-${stamp}`);
 const saved=resume?JSON.parse(await fs.readFile(path.join(runDir,'agent_trace.json'),'utf8')):null;
 if(saved&&(saved.model!==model||saved.mode!==mode||saved.status!=='infrastructure_error'))throw new Error('Resume requires matching model/mode and an interrupted infrastructure-error run');
 const workspace=path.join(runDir,'workspace');
 await fs.mkdir(path.join(workspace,'app'),{recursive:true});
 if(!resume){await fs.cp(path.join(ROOT,'public'),workspace,{recursive:true});
 await fs.copyFile(path.join(ROOT,'app/engine.mjs'),path.join(workspace,'app/engine.mjs'));}
 const stateFile=path.join(workspace,'state.json');
 const prepared=path.join(ROOT,'prepared');
 let transcript={segments:[],duration_seconds:0},frames=[];
 if(mode!=='no_media'){
   transcript=JSON.parse(await fs.readFile(path.join(prepared,'transcript.json'),'utf8'));
   frames=JSON.parse(await fs.readFile(path.join(prepared,'frames.json'),'utf8'));
 }
 const audioEnabled=['full','audio_only'].includes(mode),videoEnabled=['full','video_only'].includes(mode);
 const brief=await fs.readFile(path.join(workspace,'task.md'),'utf8');
 const content=[{type:'input_text',text:brief+`\n\nRoute: ${mode}. This is a general model plus perception tools, NOT native audiovisual input. `+
   `Use the tools to inspect evidence and change the live database. You have at most ${maxTurns} model turns. `+
   (audioEnabled?'\nIndependent timestamped ASR:\n'+transcript.segments.map(s=>`[${s.start}-${s.end}s] ${s.text}`).join('\n'):'\nAudio evidence is unavailable in this ablation.')+
   (videoEnabled?'\nRegular sampled frames follow. Request additional exact-time frames when needed.':'\nVideo evidence is unavailable in this ablation.')}];
 if(videoEnabled)for(const f of frames){
   content.push({type:'input_text',text:`Review recording timestamp ${f.time} seconds:`});
   content.push({type:'input_image',image_url:`data:image/jpeg;base64,${(await fs.readFile(path.join(prepared,f.file))).toString('base64')}`,detail:'high'});
 }
 const history=[{role:'user',content}];
 const audit=JSON.parse(await fs.readFile(path.join(ROOT,'private/leakage_audit.json'),'utf8'));
 if(!audit.pass)throw new Error('Run the leakage audit successfully before evaluation');
 await fs.writeFile(path.join(runDir,'model_input_audit.json'),JSON.stringify({
   text_blocks:content.filter(x=>x.type==='input_text'),tools,frame_files:videoEnabled?frames:[],public_workspace_files:audit.public_files,
   note:'Exact initial text/tool schemas; image bytes are represented by actual prepared files.'},null,2));
 const frozen={model,requested_model:model,provider,base_url:base,mode,route:'general-agent + sampled frames + independent ASR + callable PCM measurements',
   asr_model:audioEnabled?transcript.model:null,initial_frame_count:videoEnabled?frames.length:0,max_turns:maxTurns,
   scoring_sha256:await sha(path.join(ROOT,'pipeline/evaluate.mjs')),truth_sha256:await sha(path.join(ROOT,'private/truth.json')),
   input_sha256:await sha(path.join(workspace,'inputs/review.mp4')),task_sha256:await sha(path.join(workspace,'task.md')),
   harness_sha256:await sha(path.join(ROOT,'pipeline/run.mjs')),media_tools_sha256:await sha(path.join(ROOT,'pipeline/media.py')),
   provider_adapter_sha256:await sha(path.join(ROOT,'pipeline/providers.mjs')),
   source_catalog_sha256:await sha(path.join(ROOT,'public/state.json')),
   thinking_configuration:provider==='anthropic'?{type:'adaptive',effort:'medium'}:{effort:'medium'},max_output_tokens:9000,
   transport:{stream:process.env.CASE1_STREAM==='1',request_timeout_ms:process.env.CASE1_STREAM==='1'?600000:240000,max_transport_attempts:3},
   created_at:new Date().toISOString(),leakage_audit:audit,reasoning_effort:'medium',private_data_exposed:false};
 if(!resume)await fs.writeFile(path.join(runDir,'manifest.json'),JSON.stringify(frozen,null,2));
 const trace=saved||{...frozen,turns:[],status:'running'};
 if(saved){
   for(const k of ['input_sha256','truth_sha256','scoring_sha256','task_sha256','media_tools_sha256'])if(saved[k]!==frozen[k])throw new Error(`Cannot resume changed task: ${k}`);
   await fs.copyFile(path.join(runDir,'agent_trace.json'),path.join(runDir,`interrupted-trace-${stamp}.json`));
   await fs.copyFile(path.join(runDir,'evaluation.json'),path.join(runDir,`interrupted-evaluation-${stamp}.json`));
   trace.infrastructure_events=[...(trace.infrastructure_events||[]),{error:trace.error,at:trace.finished_at,completed_turns:trace.turns.length,resumed_at:new Date().toISOString(),resume_harness_sha256:frozen.harness_sha256,resume_provider_sha256:frozen.provider_adapter_sha256,transport:frozen.transport}];
   trace.status='running';delete trace.error;delete trace.finished_at;
   for(const turn of trace.turns){
     history.push(...turn.output);const images=[];
     for(let i=0;i<turn.calls.length;i++){
       const c=turn.calls[i],call=turn.output.filter(x=>x.type==='function_call')[i],r=c.result;
       const paths=r._images||(r._image?[r._image]:[]);
       const safe=paths.length?{seconds:r.seconds,times:r.times,image_pages:paths.length,pagination:r.pagination}:r;
       history.push({type:'function_call_output',call_id:call.call_id,output:JSON.stringify(safe)});
       for(let page=0;page<paths.length;page++)images.push({role:'user',content:[{type:'input_text',text:`Requested media inspection: ${JSON.stringify(c.args)}, page ${page+1}/${paths.length}`},{type:'input_image',image_url:`data:image/jpeg;base64,${(await fs.readFile(paths[page])).toString('base64')}`,detail:'high'}]});
     }
     history.push(...images);
   }
 }
 console.log(`Run directory: ${runDir}`);
 async function execute(name,args){
  if(name==='get_state')return await readState(stateFile);
  if(name==='read_file'){
   if(!allowedReadPath(args.path))throw new Error('Only task.md and app/engine.mjs are readable with this tool.');
   return {path:args.path,content:await fs.readFile(path.join(workspace,args.path),'utf8')};
  }
  if(name==='apply_changes')return await applyTransaction(stateFile,args);
  if(name==='get_transcript'){
   if(!audioEnabled)throw new Error('Audio unavailable in this ablation.');
   if(!Number.isFinite(args.start_seconds)||!Number.isFinite(args.end_seconds)||args.end_seconds<=args.start_seconds)throw new Error('Invalid time window');
   return {segments:transcript.segments.filter(s=>s.end>=args.start_seconds&&s.start<=args.end_seconds)};
  }
  if(name==='get_frame'){
   if(!videoEnabled)throw new Error('Video unavailable in this ablation.');
   const t=args.seconds;if(!Number.isFinite(t)||t<0||t>=transcript.duration_seconds)throw new Error('Invalid recording time');
   const frame=path.join(runDir,`requested-frame-${String(t).replaceAll('.','_')}.jpg`);
   await child(FFMPEG,['-v','error','-y','-ss',String(t),'-i',path.join(workspace,'inputs/review.mp4'),'-frames:v','1','-q:v','3',frame]);
   await fs.access(frame);
   return {seconds:t,_image:frame};
  }
  if(name==='contact_sheet'||name==='transcribe_source'){
   const review=name==='contact_sheet'&&args.media==='review';
   if(name==='contact_sheet'&&!videoEnabled)throw new Error('Video unavailable in this ablation');
   if(name==='transcribe_source'&&!audioEnabled)throw new Error('Audio unavailable in this ablation');
   if(!review){
     const s=await readState(stateFile);
     if(!s.assets.some(a=>a.id===args.asset_id&&a.versions.includes(args.version)))throw new Error('Unknown source');
   }
   const file=review?path.join(workspace,'inputs/review.mp4'):path.join(workspace,'sources',`${args.asset_id}_${args.version}.${name==='transcribe_source'?'wav':'mp4'}`);
   if(!Number.isFinite(args.start_seconds)||!Number.isFinite(args.end_seconds)||
       args.start_seconds<0||args.start_seconds>=(review?transcript.duration_seconds:40)||
       args.end_seconds>(review?transcript.duration_seconds:40)||args.end_seconds<args.start_seconds)
       throw new Error('Use 0 <= start < duration and start <= end <= duration; end is exclusive for frame sampling.');
   const params=[path.join(ROOT,'pipeline/media.py'),name==='transcribe_source'?'source_asr':'sheet',file,String(args.start_seconds),String(args.end_seconds)];
   if(name==='contact_sheet'){
     if(!Number.isFinite(args.step_seconds))throw new Error('Invalid sampling step');
     params.push(String(args.step_seconds),path.join(runDir,`sheet-${crypto.randomUUID()}.jpg`));
   }
   return JSON.parse(await child(PYTHON,params));
  }
  if(name==='measure_audio'){
   if(!audioEnabled)throw new Error('Audio unavailable in this ablation.');
   const s=await readState(stateFile);
   if(!s.assets.some(a=>a.id===args.asset_id&&a.versions.includes(args.version)))throw new Error('Unknown source');
   if(!Number.isFinite(args.start_seconds)||!Number.isFinite(args.end_seconds))throw new Error('Invalid times');
   return JSON.parse(await child(PYTHON,[path.join(ROOT,'pipeline/media.py'),'analyze',
     path.join(workspace,'sources',`${args.asset_id}_${args.version}.wav`),String(args.start_seconds),String(args.end_seconds)]));
  }
  if(name==='public_check'){
   const state=await readState(stateFile);for(const t of state.tickets)validateTicket(t,state);
   const signatures=state.tickets.map(t=>[t.asset_id,t.version,t.issue_type,t.in_seconds,t.out_seconds].join('|'));
   return {schema_valid:true,duplicate_intervals:signatures.length-new Set(signatures).size,record_count:state.tickets.length,
     message:'This checks integrity only, not whether review decisions were understood.'};
  }
  if(name==='finish')return {finished:true,summary:String(args.summary||'')};
  throw new Error('Unknown tool');
 }
 try{
  for(let turn=trace.turns.length+1;turn<=maxTurns;turn++){
   const payload=await requestModel({provider,base,key,model,history,tools});
   const log={turn,response_id:payload.id,returned_model:payload.model,usage:payload.usage,output:payload.output,
     stop_reason:payload.stop_reason||payload.status,latency_ms:payload.latency_ms,request_image_count:payload.request_image_count,transport_retry_count:payload.transport_retry_count||0,calls:[]};
   trace.turns.push(log);history.push(...payload.output);
   const calls=payload.output.filter(item=>item.type==='function_call');
   console.log(`Turn ${turn}: ${calls.map(c=>c.name).join(', ')||'text only'}`);
   const requestedImages=[];
   for(const call of calls){
    let args,result;
    try{args=JSON.parse(call.arguments||'{}');result=await execute(call.name,args);}
    catch(e){result={error:e.message};}
    log.calls.push({name:call.name,args,result});
    const images=result._images||(result._image?[result._image]:[]);
    const safe=images.length?{seconds:result.seconds,times:result.times,image_pages:images.length,pagination:result.pagination}:result;
    history.push({type:'function_call_output',call_id:call.call_id,output:JSON.stringify(safe)});
    for(let page=0;page<images.length;page++)requestedImages.push({role:'user',content:[
      {type:'input_text',text:`Requested media inspection: ${JSON.stringify(args)}, page ${page+1}/${images.length}`},
      {type:'input_image',image_url:`data:image/jpeg;base64,${(await fs.readFile(images[page])).toString('base64')}`,detail:'high'}]});
    if(call.name==='finish'&&!result.error)trace.status='finished';
   }
   history.push(...requestedImages);
   await fs.writeFile(path.join(runDir,'agent_trace.json'),JSON.stringify(trace,null,2));
   if(trace.status==='finished')break;
   if(!calls.length){trace.status='model_stopped';break;}
  }
  if(trace.status==='running')trace.status='turn_limit';
 }catch(e){trace.status='infrastructure_error';trace.error=e.message.replaceAll(key,'[REDACTED]');console.error(trace.error);process.exitCode=2;}
 finally{
   trace.finished_at=new Date().toISOString();
   await fs.writeFile(path.join(runDir,'agent_trace.json'),JSON.stringify(trace,null,2));
   const state=await readState(stateFile),result=await evaluate(state);
   result.run_status=trace.status;result.valid_model_trial=trace.status!=='infrastructure_error';
   await fs.writeFile(path.join(runDir,'evaluation.json'),JSON.stringify(result,null,2));
   const initial=JSON.parse(await fs.readFile(path.join(ROOT,'private/initial.json'),'utf8'));
   const changes=state.tickets.filter(t=>JSON.stringify(t)!==JSON.stringify(initial.tickets.find(x=>x.id===t.id)));
   await fs.writeFile(path.join(runDir,'state_diff.json'),JSON.stringify(changes,null,2));
   console.log(JSON.stringify({runDir,status:trace.status,score:result.score,valid_model_trial:result.valid_model_trial,changed_records:changes.length},null,2));
   try{console.log(await child(process.execPath,[path.join(ROOT,'pipeline/report.mjs'),runDir]));}
   catch(e){console.error(`Evaluation saved; optional report generation failed: ${e.message}`);}
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error(e.stack||e.message);process.exitCode=2});
