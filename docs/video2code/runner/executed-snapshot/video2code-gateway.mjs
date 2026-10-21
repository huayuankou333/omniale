import {chatRequest} from './video2code-chat-transport.mjs';
import fs from 'node:fs/promises';
export const BASE='https://api-temporary.nju-link.com/v1';
export const MODELS=[{id:'glm-5.3-flash',env:'OMNIALE_GLM_KEY'},{id:'gpt-6-luna',env:'OMNIALE_GPT_KEY'},{id:'k3',env:'OMNIALE_KIMI_KEY'},{id:'gpt-6.1-sol',env:'OMNIALE_GPT_KEY'}];
export const safe=x=>String(x).replace(/sk-[\w-]+/g,'[REDACTED]').replace(/github_pat_[\w]+/g,'[REDACTED]');
export async function request({model,input,instructions,tools=[],max_output_tokens=9000,reasoning='high',attempts=3,timeout=600000,log}){
 if(model==='glm-5.3-flash')return chatRequest({model,input,instructions,tools,max_output_tokens,reasoning,attempts,timeout,log});
 const meta=MODELS.find(x=>x.id===model);const key=process.env[meta?.env];if(!key)throw Error('Missing credential for '+model);
 for(let attempt=1;attempt<=attempts;attempt++){
  const begin=Date.now();
  try{
   const r=await fetch(BASE+'/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,input,instructions,tools,reasoning:{effort:reasoning},max_output_tokens,store:false,stream:true}),signal:AbortSignal.timeout(timeout)});
   if(!r.ok)throw Error('HTTP '+r.status+': '+safe((await r.text()).slice(0,1200)));
   let result;
   if(r.headers.get('content-type')?.includes('event-stream')){
    const reader=r.body.getReader(),decoder=new TextDecoder();let buf='';
    while(true){const {value,done}=await reader.read();if(done)break;buf+=decoder.decode(value,{stream:true}).replace(/\r/g,'');let end;
     while((end=buf.indexOf('\n\n'))>=0){const event=buf.slice(0,end);buf=buf.slice(end+2);const data=event.split('\n').filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trim()).join('\n');if(!data||data==='[DONE]')continue;let p;try{p=JSON.parse(data)}catch{continue}
      if(['response.completed','response.incomplete'].includes(p.type))result=p.response;
      if(['error','response.failed'].includes(p.type))throw Error(safe(JSON.stringify(p.error||p.response?.error||p)));
     }
    }
    if(!result)throw Error('Stream closed without final response');
   }else result=await r.json();
   if(!Array.isArray(result.output))throw Error('Invalid response: '+safe(JSON.stringify(result).slice(0,1000)));
   result.transport={requested_model:model,attempt,latency_ms:Date.now()-begin,time:new Date().toISOString()};
   if(log)await fs.writeFile(log,safe(JSON.stringify(result,null,2)));
   return result;
  }catch(e){const error=safe(e.message);console.log(JSON.stringify({model,attempt,error,latency_ms:Date.now()-begin}));if(log)await fs.writeFile(log+'.error-'+attempt+'.json',JSON.stringify({model,attempt,error,time:new Date().toISOString()},null,2));
   if(attempt===attempts||!/HTTP (429|50[0234])|overload|rate.limit|fetch failed|terminated|ECONNRESET|timeout|timed out|abort|Stream closed/i.test(error))throw Error(error);
   await new Promise(r=>setTimeout(r,3000*attempt));
  }
 }
}
export const textOf=r=>r.output.filter(x=>x.type==='message').flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n');
export async function imagePart(path){return {type:'input_image',image_url:'data:image/png;base64,'+(await fs.readFile(path)).toString('base64'),detail:'high'};}
