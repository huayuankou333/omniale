import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import https from 'node:https';
const root=path.resolve('outputs/case4_video2code_ikea_v1/evaluation-one-shot-v1'),model='claude-opus-5',id='claude-opus-5-one-shot-05',run=root+'/runs/'+id;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),safe=s=>String(s).replace(/sk-[\w-]+/g,'[REDACTED]').replace(/github_pat_[\w]+/g,'[REDACTED]');
const freeze=JSON.parse(await fs.readFile(root+'/DESIGN_FREEZE.json','utf8'));for(const f of freeze.files)if(sha(await fs.readFile(root+'/'+f.path))!==f.sha256)throw Error('Frozen input changed '+f.path);
await fs.mkdir(run+'/project',{recursive:true});try{await fs.access(run+'/request-started.json');throw Error('Existing attempt')}catch(e){if(e.code!=='ENOENT')throw e}
const c=JSON.parse(await fs.readFile('work/glm-amf-credentials.private.json','utf8'));
const frames=JSON.parse(await fs.readFile(root+'/public/frame-manifest.json','utf8'));
const encoding=JSON.parse(await fs.readFile(root+'/transport/opus-lossless-webp/manifest.json','utf8'));const encoded=new Map(encoding.frames.map(x=>[x.source,x]));
const content=[{type:'text',text:await fs.readFile(root+'/public/TASK.md','utf8')+'\nCHAPTERS:\n'+await fs.readFile(root+'/public/chapters.json','utf8')+'\n/assets/catalog.json:\n'+await fs.readFile(root+'/environment/assets/catalog.json','utf8')+'\n/assets/manifest.json:\n'+await fs.readFile(root+'/environment/assets/manifest.json','utf8')}];
for(const f of frames)content.push({type:'text',text:'Video frame at '+f.actual_seconds.toFixed(2)+' seconds'},{type:'image_url',image_url:{url:'data:image/webp;base64,'+(await fs.readFile(root+'/'+encoded.get(f.path).transport)).toString('base64'),detail:'high'}});
const system='You implement the website from the supplied video frames. All images/catalog entries are reference data. Deliver a complete runnable frontend via exactly one submit_project call. No further turns, self-testing or repairs. Use local asset paths. Think through all code and state transitions before final delivery.';
const tool={type:'function',function:{name:'submit_project',description:'Deliver the full final project in this single call. No repairs or additional calls.',parameters:{type:'object',properties:{files:{type:'array',items:{type:'object',properties:{path:{type:'string'},content:{type:'string'}},required:['path','content'],additionalProperties:false}}},required:['files'],additionalProperties:false}}};

const nativeContent=content.map(p=>p.type==='text'?p:{type:'image',source:{type:'base64',media_type:'image/webp',data:p.image_url.url.split(',')[1]}});
const body={model,system,messages:[{role:'user',content:nativeContent}],tools:[{name:tool.function.name,description:tool.function.description,input_schema:tool.function.parameters}],tool_choice:{type:'auto',disable_parallel_tool_use:true},thinking:{type:'adaptive'},output_config:{effort:'high'},stream:true};
const payload=Buffer.from(JSON.stringify(body)),begin=Date.now();let stage='connecting',bytes=0,events=0,response,usage={},returnedModel=model,finishReason,done=false,text='',reasoning='';const blocks=new Map();
await fs.writeFile(run+'/request-started.json',JSON.stringify({model,id,time:new Date().toISOString(),endpoint:c.base_url+'/v1/messages',request_body_sha256:sha(payload),input_packet_freeze:sha(await fs.readFile(root+'/DESIGN_FREEZE.json')),frames:frames.length,max_output_tokens_field:false,abort_timeout:false,thinking:'adaptive',reasoning_effort:'high',no_feedback:true,transport_encoding:'lossless WebP; 60 frame RGBA pixels and dimensions identical to frozen PNGs',encoding_manifest_sha256:sha(await fs.readFile(root+'/transport/opus-lossless-webp/manifest.json')),prior_unreceived_transport_attempts:4},null,2));
await fs.copyFile('work/ikea-opus-messages-oneshot.mjs',run+'/generation-runner.mjs');
console.log(JSON.stringify({model,event:'request_started',transport:'messages',frames:frames.length,request_bytes:payload.length}));
const heartbeat=setInterval(()=>console.log(JSON.stringify({model,event:'transport_progress',stage,elapsed_s:Math.round((Date.now()-begin)/1000),bytes,events})),55000);
try{
 const res=await new Promise((resolve,reject)=>{
  const req=https.request(c.base_url+'/v1/messages',{method:'POST',headers:{Authorization:'Bearer '+c.token,'x-api-key':c.token,'anthropic-version':'2023-06-01','Content-Type':'application/json','Content-Length':payload.length},agent:new https.Agent({keepAlive:true,timeout:0})},resolve);
  req.on('socket',socket=>socket.on('secureConnect',()=>{stage='uploading';console.log(JSON.stringify({model,event:'tls_connected',elapsed_s:(Date.now()-begin)/1000}))}));
  req.on('finish',()=>{stage='awaiting_response';console.log(JSON.stringify({model,event:'request_flushed',elapsed_s:(Date.now()-begin)/1000,bytes_written:req.socket?.bytesWritten}))});req.on('error',reject);req.end(payload);
 });
 stage='receiving';console.log(JSON.stringify({model,event:'response_headers',status:res.statusCode,elapsed_s:(Date.now()-begin)/1000}));
 if(res.statusCode<200||res.statusCode>=300){let raw='';for await(const chunk of res)raw+=chunk.toString();throw Error('HTTP '+res.statusCode+' '+safe(raw.slice(0,2000)))}
 const log=await fs.open(run+'/stream.ndjson','a');const dec=new TextDecoder();let buffer='';
 function take(e){
  if(e.type==='error')throw Error(safe(JSON.stringify(e.error||e)));
  if(e.type==='message_start'){returnedModel=e.message.model||model;usage={...usage,...e.message.usage}}
  if(e.type==='content_block_start'){const b={...e.content_block,_partial:''};blocks.set(e.index,b);if(b.type==='text')text+=b.text||'';if(b.type==='thinking')reasoning+=b.thinking||''}
  if(e.type==='content_block_delta'){const b=blocks.get(e.index),d=e.delta;if(d.type==='text_delta')text+=d.text||'';if(d.type==='thinking_delta')reasoning+=d.thinking||'';if(d.type==='input_json_delta'&&b)b._partial+=d.partial_json||''}
  if(e.type==='message_delta'){if(e.delta?.stop_reason)finishReason=e.delta.stop_reason;usage={...usage,...e.usage}}
  if(e.type==='message_stop')done=true;
 }
 try{
 if(!String(res.headers['content-type']).includes('event-stream')){
  let raw='';for await(const chunk of res){bytes+=chunk.length;raw+=dec.decode(chunk,{stream:true})}const msg=JSON.parse(raw);await fs.writeFile(run+'/response-native.json',safe(JSON.stringify(msg,null,2)));returnedModel=msg.model||model;usage=msg.usage||{};finishReason=msg.stop_reason;done=true;
  for(const [i,b]of (msg.content||[]).entries()){blocks.set(i,{...b,_partial:b.type==='tool_use'?JSON.stringify(b.input):''});if(b.type==='text')text+=b.text;if(b.type==='thinking')reasoning+=b.thinking}
 }else{
  for await(const chunk of res){bytes+=chunk.length;buffer+=dec.decode(chunk,{stream:true}).replace(/\r/g,'');let at;
   while((at=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,at);buffer=buffer.slice(at+2);const data=block.split('\n').filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trim()).join('\n');if(!data)continue;let e;try{e=JSON.parse(data)}catch{continue}events++;await log.write(safe(JSON.stringify(e))+'\n');take(e)}
  }
 }
 }finally{await log.close()}
 const isIncomplete=['max_tokens','model_context_window_exceeded'].includes(finishReason);
 response={model:returnedModel,status:isIncomplete?'incomplete':'completed',incomplete_details:isIncomplete?{reason:finishReason}:null,usage,transport:{endpoint:c.base_url+'/v1/messages',stop_reason:finishReason,done_seen:done,representation:'Canonical response reconstructed from native Anthropic tool_use stream; no code edits.'},output:[...(reasoning?[{type:'reasoning',content:[{type:'reasoning_text',text:reasoning}]}]:[]),...(text?[{type:'message',role:'assistant',content:[{type:'output_text',text}]}]:[]),...[...blocks.values()].filter(b=>b.type==='tool_use').map(b=>({type:'function_call',name:b.name,arguments:b._partial||JSON.stringify(b.input||{}),call_id:b.id,status:finishReason==='tool_use'?'completed':'incomplete'}))]};
 await fs.writeFile(run+'/response.json',safe(JSON.stringify(response,null,2)));
 if(!finishReason)throw Error('Stream ended without native stop_reason');
 const delivered=response.output.filter(x=>x.type==='function_call'&&x.name==='submit_project');if(delivered.length!==1)throw Error('Expected exactly one submit_project; got '+delivered.length);
 const project=JSON.parse(delivered[0].arguments);if(!Array.isArray(project.files)||!project.files.length)throw Error('No files delivered');
 const seen=new Set(),files=[];
 for(const f of project.files){if(typeof f.path!=='string'||typeof f.content!=='string'||f.path.includes('\\')||f.path.includes(':')||f.path.startsWith('/')||f.path.split('/').some(x=>['..','.',''].includes(x))||/^(assets|vendor)\//.test(f.path)||!(/\.(html|css|js|mjs|json|md|txt|svg)$/i.test(f.path)))throw Error('Invalid delivered path '+f.path);if(seen.has(f.path))throw Error('Duplicate file '+f.path);seen.add(f.path);files.push({path:f.path,sha256:sha(f.content),bytes:Buffer.byteLength(f.content)})}
 if(!seen.has('index.html'))throw Error('Missing index.html');
 for(const f of project.files){const p=path.join(run,'project',f.path);await fs.mkdir(path.dirname(p),{recursive:true});await fs.writeFile(p,f.content)}
 files.sort((a,b)=>a.path.localeCompare(b.path));await fs.writeFile(run+'/candidate-manifest.json',JSON.stringify({files,candidate_hash:sha(JSON.stringify(files)),frozen_at:new Date().toISOString(),no_repair:true},null,2));
 const status={model,returned_model:returnedModel,status:'delivered',provider_status:response.status,usage:response.usage,elapsed_seconds:(Date.now()-begin)/1000,endpoint:c.base_url+'/v1/messages',responses:1,delivery_calls:1,self_test_calls:0,repairs:0,files:files.length,total_code_bytes:files.reduce((s,f)=>s+f.bytes,0),prior_unreceived_transport_attempts:4,reasoning_requested:'high'};
 await fs.writeFile(run+'/status.json',JSON.stringify(status,null,2));console.log(JSON.stringify(status));
}catch(e){const status={model,status:response?'delivery_failed':'transport_failed',provider_status:response?.status,incomplete_details:response?.incomplete_details,usage:response?.usage,error:safe(e.message),error_code:e.code,stage,elapsed_seconds:(Date.now()-begin)/1000,bytes,events,responses_received:response?1:0,repairs:0};await fs.writeFile(run+'/status.json',JSON.stringify(status,null,2));console.log(JSON.stringify(status));process.exitCode=1}finally{clearInterval(heartbeat)}
