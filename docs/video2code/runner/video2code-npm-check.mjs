import fs from 'node:fs/promises';import path from 'node:path';import {spawn,spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');const run=path.join(root,'runs',process.argv[2]);const project=path.join(run,'project');
if(!(await fs.readFile(path.join(project,'server.mjs'))).equals(await fs.readFile(path.join(root,'environment/server-template.mjs'))))throw Error('Trusted launcher mismatch');
const pkg=JSON.parse(await fs.readFile(path.join(project,'package.json'),'utf8'));if(JSON.stringify(pkg.scripts)!==JSON.stringify({dev:'node server.mjs'}))throw Error('Unexpected scripts');
const env={};for(const k of ['SystemRoot','WINDIR','PATH','TEMP','TMP','COMSPEC','PATHEXT','USERPROFILE','APPDATA','LOCALAPPDATA'])if(process.env[k])env[k]=process.env[k];
const args=['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','dev','--','--host','0.0.0.0','--port','3000'];let stdout='',stderr='';const p=spawn(process.execPath,args,{cwd:project,env,windowsHide:true,stdio:['ignore','pipe','pipe']});p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);let status=null,error=null;
try{for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,250));try{const r=await fetch('http://127.0.0.1:3000/');status=r.status;await r.body.cancel();break}catch{}}if(status!==200)error='No successful HTTP response';}
finally{spawnSync('taskkill',['/PID',String(p.pid),'/T','/F'],{windowsHide:true,encoding:'utf8'});}
const result={command:'npm run dev -- --host 0.0.0.0 --port 3000',actual_invocation:{file:process.execPath,args},port:3000,status,stdout,stderr,error,node:process.version,time:new Date().toISOString(),launcher_integrity:'matches immutable environment template'};
await fs.writeFile(path.join(run,'evaluation','npm-start-3000.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
