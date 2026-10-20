// Transport-only adaptation. Never imports authoring data or the evaluator.
export const SYSTEM = 'You are a review operations agent. Interpret the supplied audiovisual review evidence and apply its final decisions to the live business system. Use only provided tools. Do not assume hidden grading answers. Source audio measurement is available when relevant. Finish only after making and checking changes.';

export function toAnthropic(history) {
 const messages=[];
 const push=(role,content)=>{
  if(messages.at(-1)?.role===role)messages.at(-1).content.push(...content);
  else messages.push({role,content:[...content]});
 };
 for(const item of history){
  if(item.type==='anthropic_message'){push('assistant',item.content);continue;}
  if(item.type==='function_call_output'){
   let error=false;try{error=!!JSON.parse(item.output).error}catch{}
   push('user',[{type:'tool_result',tool_use_id:item.call_id,content:item.output,is_error:error}]);continue;
  }
  // Tool calls already exist inside the preserved signed Anthropic content.
  if(item.type==='function_call')continue;
  if(item.role==='user'){
   push('user',item.content.map(c=>{
    if(c.type==='input_text')return {type:'text',text:c.text};
    const match=/^data:(image\/[\w+.-]+);base64,(.+)$/s.exec(c.image_url);
    if(c.type!=='input_image'||!match)throw new Error('Unsupported image content');
    return {type:'image',source:{type:'base64',media_type:match[1],data:match[2]}};
   }));
  }else throw new Error(`Unsupported history item ${item.type||item.role}`);
 }
 return messages;
}

export function requestSpec({provider,base,key,model,history,tools,maxOutput=9000}){
 if(provider==='anthropic')return {
  url:`${base.replace(/\/$/,'')}/v1/messages`,
  headers:{'x-api-key':key,'anthropic-version':'2023-06-01','Content-Type':'application/json'},
  body:{model,system:SYSTEM,messages:toAnthropic(history),max_tokens:maxOutput,
    thinking:{type:'adaptive'},output_config:{effort:'medium'},
    tools:tools.map(t=>({name:t.name,description:t.description,input_schema:t.parameters}))}
 };
 if(provider!=='openai')throw new Error(`Unknown provider ${provider}`);
 return {
  url:`${base.replace(/\/$/,'')}/responses`,
  headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
  body:{model,instructions:SYSTEM,input:history,tools,reasoning:{effort:'medium'},store:false,max_output_tokens:maxOutput}
 };
}

async function requestModelOnce(config){
 const request=requestSpec(config);
 if(process.env.CASE1_STREAM==='1'&&config.provider==='openai')request.body.stream=true;
 const started=Date.now();
 const response=await fetch(request.url,{method:'POST',headers:request.headers,
  body:JSON.stringify(request.body),signal:AbortSignal.timeout(request.body.stream?600000:240000)});
 let payload;
 if(response.ok&&response.headers.get('content-type')?.includes('text/event-stream')){
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',completed=null;
   while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true}).replace(/\r/g,'');
     let boundary;while((boundary=buffer.indexOf('\n\n'))>=0){
       const event=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);
       const data=event.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');
       if(!data||data==='[DONE]')continue;
       let parsed;try{parsed=JSON.parse(data)}catch{continue;}
       if(['response.completed','response.incomplete'].includes(parsed.type))completed=parsed.response;
       if(parsed.type==='response.failed'||parsed.type==='error')throw new Error('Stream error: '+JSON.stringify(parsed.error||parsed.response?.error||parsed).replaceAll(config.key,'[REDACTED]').slice(0,1000));
     }
   }
   if(!completed)throw new Error('Stream closed before completed response');payload=completed;
 }else{const text=await response.text();try{payload=JSON.parse(text)}catch{throw new Error(`Proxy HTTP ${response.status}: non-JSON response`)}}
 if(!response.ok){
  const safe=JSON.stringify(payload).replaceAll(config.key,'[REDACTED]').replace(/sk-[a-zA-Z0-9_-]+/g,'[REDACTED]');
  throw new Error(`Proxy HTTP ${response.status}: ${safe.slice(0,1200)}`);
 }
 const requestImages=config.history.filter(m=>m.role==='user').reduce((n,m)=>n+(m.content||[]).filter(c=>c.type==='input_image').length,0);
 if(config.provider==='anthropic'){
  if(!Array.isArray(payload.content))throw new Error('Missing Anthropic content');
  return {id:payload.id,model:payload.model,usage:payload.usage,stop_reason:payload.stop_reason,
   latency_ms:Date.now()-started,request_image_count:requestImages,
   output:[{type:'anthropic_message',role:'assistant',content:payload.content},
    ...payload.content.filter(c=>c.type==='tool_use').map(c=>({type:'function_call',call_id:c.id,name:c.name,arguments:JSON.stringify(c.input)}))]};
 }
 if(!Array.isArray(payload.output))throw new Error('Missing Responses output');
 return {...payload,latency_ms:Date.now()-started,request_image_count:requestImages};
}

// Retry transport failures only; task inputs, tools and reasoning budget are unchanged.
export async function requestModel(config){
 const started=Date.now();
 for(let attempt=0;attempt<3;attempt++){
  try {const result=await requestModelOnce(config);return {...result,latency_ms:Date.now()-started,transport_retry_count:attempt};}
  catch(e){
   if(attempt===2||!/fetch failed|timeout|timed out|aborted|Stream closed|overloaded|service_unavailable|rate_limit|Proxy HTTP (429|50[0234])/i.test(e.message))throw e;
   console.error(`Transport retry ${attempt+1}/2: ${e.message.replaceAll(config.key,'[REDACTED]').slice(0,180)}`);
   await new Promise(resolve=>setTimeout(resolve,2000*(attempt+1)));
  }
 }
}
