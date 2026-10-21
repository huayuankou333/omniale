import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
import {Browser} from './eval-browser.mjs';
const ROOT=path.resolve(import.meta.dirname,'..');const runId=process.argv[2];if(!runId||!/^[\w.-]+$/.test(runId))throw Error('Run ID required');const run=path.join(ROOT,'runs',runId),project=path.join(run,'project'),out=path.join(run,process.argv[3]||'evaluation');await fs.mkdir(out,{recursive:true});
const candidate=JSON.parse(await fs.readFile(path.join(run,'candidate-manifest.json'),'utf8'));const records=[];
// Run only the immutable trusted server after checking it has not changed.
const bytes=await fs.readFile(path.join(project,'server.mjs'));if(!bytes.equals(await fs.readFile(path.join(ROOT,'environment','server-template.mjs'))))throw Error('Trusted server changed');
const env={};for(const k of ['SystemRoot','WINDIR','PATH','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
const child=spawn(process.execPath,[path.join(project,'server.mjs'),'--host','0.0.0.0','--port','3002'],{cwd:project,env,windowsHide:true,stdio:['ignore','pipe','pipe']});let startup='';child.stdout.on('data',b=>startup+=b);child.stderr.on('data',b=>startup+=b);
await new Promise(r=>setTimeout(r,900));let response;try{response=await fetch('http://127.0.0.1:3002/');await fs.writeFile(path.join(out,'execution.json'),JSON.stringify({command:'npm run dev -- --host 0.0.0.0 --port 3002',actual_invocation:'node server.mjs --host 0.0.0.0 --port 3002 (the immutable npm dev script; evaluation port separated from generator)',node:process.version,port:3002,status:response.status,stdout:startup,candidate_hash:candidate.candidate_hash},null,2))}finally{child.kill();await new Promise(r=>child.once('exit',r));}
const b=new Browser(project,out);await b.start({video:true});
let busy=false;
async function saveManifest(){const artifacts={};for(const f of await fs.readdir(out)){const ext=path.extname(f);if(!['.png','.webm','.json'].includes(ext)||f==='manifest.json')continue;const buffer=await fs.readFile(path.join(out,f));artifacts[f.replace(/\.[^.]+$/,'')]={path:f,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),kind:ext==='.png'?'candidate_screenshot':ext==='.webm'?'candidate_video':f==='execution.json'?'execution_log':'browser_log'}}await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({run_id:runId,candidate_hash:candidate.candidate_hash,trial_status:'valid',browser:b.version,viewport:{width:1280,height:804},artifacts},null,2));}
const server=http.createServer(async(req,res)=>{
 try{if(req.method!=='POST'||req.url!=='/command')throw Error('Use POST /command');if(busy)throw Error('Busy');busy=true;let raw='';for await(const c of req)raw+=c;const data=JSON.parse(raw);const result={};
  if(data.close){await b.close();await saveManifest();result.closed=true;server.close();}
  else{if(data.note)records.push({label:data.label,note:data.note,time:Date.now()});const capture=async label=>{const s=await b.inspect(label);records.push({label,screenshot:path.basename(s.file),controls:s.controls});return s};result.before=await capture((data.label||'snapshot')+'-before');
   for(let i=0;i<(data.actions||[]).length;i++){await b.action(data.actions[i]);if(data.capture_each)await capture((data.label||'action')+'-'+(i+1))}
   if(data.motion_frames){for(let i=0;i<Math.min(data.motion_frames,40);i++){await b.page.waitForTimeout(80);await capture((data.label||'motion')+'-motion-'+String(i+1).padStart(2,'0'));}}
   result.after=await capture((data.label||'snapshot')+'-after');await fs.writeFile(path.join(out,'operator-records.json'),JSON.stringify(records,null,2));await saveManifest();}
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));
 }catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}finally{busy=false;}
});server.listen(3011,'127.0.0.1',()=>console.log(JSON.stringify({ready:true,run:runId,control:'http://127.0.0.1:3011/command'})));
