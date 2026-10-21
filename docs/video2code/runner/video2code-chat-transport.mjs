import fs from 'node:fs/promises';
import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';
async function losslessHistory(history){const converted=[];const result=[];const dir=path.resolve(import.meta.dirname,'../environment/transport-cache');await fs.mkdir(dir,{recursive:true});
 for(const m of history){if(m.role!=='user'){result.push(m);continue;}const content=[];for(const c of m.content){if(c.type!=='input_image'||!c.image_url.startsWith('data:image/png;base64,')){content.push(c);continue;}const bytes=Buffer.from(c.image_url.split(',')[1],'base64');const id=crypto.createHash('sha256').update(bytes).digest('hex');const src=path.join(dir,id+'.png'),dst=path.join(dir,id+'.webp'),meta=path.join(dir,id+'.json');let record;
  try{record=JSON.parse(await fs.readFile(meta,'utf8'))}catch{await fs.writeFile(src,bytes);const r=spawnSync('F:/annconda/python.exe',[path.join(import.meta.dirname,'video2code-lossless.py'),src,dst],{encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error('Lossless conversion failed: '+r.stderr);record=JSON.parse(r.stdout);await fs.writeFile(meta,JSON.stringify(record));}
  if(!record.lossless_verified)throw Error('Lossless verification failed');converted.push({source_sha256:id,...record});content.push({...c,image_url:'data:image/webp;base64,'+(await fs.readFile(dst)).toString('base64')});
 }result.push({...m,content});}return {history:result,converted};}
function toChat(history){const messages=[];let assistant=null;
 const flush=()=>{if(assistant){if(!assistant.content)assistant.content=null;messages.push(assistant);assistant=null;}};
 for(const m of history){
  if(m.role==='user'){flush();messages.push({role:'user',content:m.content.map(c=>c.type==='input_text'?{type:'text',text:c.text}:{type:'image_url',image_url:{url:c.image_url,detail:'high'}})});}
  else if(m.type==='function_call_output'){flush();messages.push({role:'tool',tool_call_id:m.call_id,content:m.output});}
  else{assistant??={role:'assistant',content:''};if(m.type==='reasoning')assistant.reasoning_content=(assistant.reasoning_content||'')+(m.summary||[]).map(c=>c.text||'').join('\n');if(m.type==='message')assistant.content+=(m.content||[]).map(c=>c.text||'').join('\n');if(m.type==='function_call'){assistant.tool_calls??=[];assistant.tool_calls.push({id:m.call_id,type:'function',function:{name:m.name,arguments:m.arguments}});}}
 }flush();return messages;
}
export async function chatRequest({model,input,instructions,tools=[],max_output_tokens=9000,reasoning='high',attempts=3,timeout=600000,log}){
 const key=process.env.OMNIALE_GLM_KEY;const redact=x=>String(x).replace(/sk-[\w-]+/g,'[REDACTED]');
 const converted=await losslessHistory(input);input=converted.history;
 for(let attempt=1;attempt<=attempts;attempt++){const begin=Date.now();try{
  const body={model,messages:[{role:'system',content:instructions},...toChat(input)],tools:tools.map(t=>({type:'function',function:{name:t.name,description:t.description,parameters:t.parameters,strict:false}})),max_tokens:max_output_tokens,reasoning_effort:reasoning,stream:false};
  const r=await fetch('https://api-temporary.nju-link.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(timeout)});const j=await r.json();if(!r.ok)throw Error('HTTP '+r.status+': '+redact(JSON.stringify(j)));
  const choice=j.choices?.[0];if(!choice)throw Error('Missing chat choice');const m=choice.message;const output=[];
  if(m.reasoning_content)output.push({type:'reasoning',summary:[{type:'summary_text',text:m.reasoning_content}]});if(m.content)output.push({type:'message',role:'assistant',content:[{type:'output_text',text:m.content}]});
  for(const t of m.tool_calls||[])output.push({type:'function_call',call_id:t.id,name:t.function.name,arguments:t.function.arguments});
  const result={id:j.id,model:j.model,status:choice.finish_reason==='length'?'incomplete':'completed',finish_reason:choice.finish_reason,output,usage:{input_tokens:j.usage?.prompt_tokens,output_tokens:j.usage?.completion_tokens,total_tokens:j.usage?.total_tokens,output_tokens_details:j.usage?.completion_tokens_details},transport:{route:'chat/completions',requested_model:model,requested_max_tokens:max_output_tokens,reasoning_effort:reasoning,attempt,latency_ms:Date.now()-begin,time:new Date().toISOString()}};
  result.transport.images=converted.converted;if(log)await fs.writeFile(log,redact(JSON.stringify(result,null,2)));return result;
 }catch(e){const error=redact(e.message);console.log(JSON.stringify({model,route:'chat',attempt,error,latency_ms:Date.now()-begin}));if(log)await fs.writeFile(log+'.error-'+attempt+'.json',JSON.stringify({model,attempt,error,time:new Date().toISOString()},null,2));if(attempt===attempts||!/HTTP (429|50[0234])|overload|fetch failed|terminated|ECONNRESET|timeout|abort/i.test(error))throw e;await new Promise(r=>setTimeout(r,3000*attempt));}}
}
