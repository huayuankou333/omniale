import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire('D:/omniale/package.json');
const {chromium}=require('playwright');
const ROOT=path.resolve(import.meta.dirname,'..');
export const VIEWPORT={width:1280,height:804};
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
export function safePath(root,rel){if(typeof rel!=='string'||rel.includes('\0')||rel.includes(':')||rel.includes('\\'))throw Error('Use relative forward-slash paths');const p=path.resolve(root,rel);if(!p.startsWith(path.resolve(root)+path.sep))throw Error('Path outside project');return p;}
export async function serveStatic(project,port=3000){
 const server=http.createServer(async(req,res)=>{
  try{const u=new URL(req.url,'http://127.0.0.1');let rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';
   const base=rel.startsWith('vendor/')?path.join(ROOT,'environment'):project;
   if(!/\.(html|js|mjs|css|json|svg|png|jpg|jpeg|woff2|txt|md)$/i.test(rel))throw Error('Unsupported path');
   const p=safePath(base,rel);const st=await fs.lstat(p);if(!st.isFile()||st.isSymbolicLink())throw Error('Invalid file');
   res.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'text/plain','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-src 'none'; object-src 'none'; worker-src 'none'"});res.end(await fs.readFile(p));
  }catch(e){res.writeHead(404);res.end('Not found');}
 });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve)});return server;
}
export class Browser {
 constructor(project,out){this.project=project;this.out=out;this.logs=[];this.actions=[];this.sequence=0;this.port=Number(process.env.OMNIALE_BROWSER_PORT||3000);this.origin=`http://127.0.0.1:${this.port}`;}
 async start({video=false}={}){
  await fs.mkdir(this.out,{recursive:true});this.server=await serveStatic(this.project,this.port);
  const temp=path.join(ROOT,'environment','browser-temp');await fs.mkdir(temp,{recursive:true});process.env.TEMP=temp;process.env.TMP=temp;
  const env={};for(const k of ['SystemRoot','WINDIR','PATH','TEMP','TMP','LOCALAPPDATA','USERPROFILE'])if(process.env[k])env[k]=process.env[k];
  this.browser=await chromium.launch({headless:true,chromiumSandbox:true,executablePath:'C:/Users/33317/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe',env,args:['--disable-background-networking','--no-first-run','--disable-component-update','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  this.version=this.browser.version();
  this.context=await this.browser.newContext({viewport:VIEWPORT,deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false,...(video?{recordVideo:{dir:this.out,size:VIEWPORT}}:{})});
  await this.context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin===this.origin)await route.continue();else{this.logs.push({type:'blocked_network',url:u.href});await route.abort('blockedbyclient')}});
  this.page=await this.context.newPage();
  this.page.on('pageerror',e=>this.logs.push({type:'pageerror',message:e.message,time:Date.now()}));
  this.page.on('console',m=>{if(['error','warning'].includes(m.type()))this.logs.push({type:m.type(),text:m.text(),time:Date.now()})});
  this.page.on('requestfailed',r=>this.logs.push({type:'requestfailed',url:r.url(),error:r.failure()}));
  this.page.on('dialog',d=>d.dismiss());this.page.on('popup',p=>p.close());
  await this.page.goto(this.origin+'/',{waitUntil:'load',timeout:30000});await this.page.waitForTimeout(1200);
  this.actions.push({type:'start',browser:this.version,url:this.page.url(),time:Date.now()});
 }
 async action(a){
  const p=this.page;const t=Date.now();
  if(a.type==='click')await p.mouse.click(a.x,a.y,{button:a.button||'left'});
  else if(a.type==='move')await p.mouse.move(a.x,a.y,{steps:a.steps||1});
  else if(a.type==='drag'){await p.mouse.move(a.x,a.y);await p.mouse.down({button:a.button||'left'});await p.mouse.move(a.to_x,a.to_y,{steps:a.steps||20});await p.mouse.up({button:a.button||'left'});}
  else if(a.type==='key')await p.keyboard.press(a.key);
  else if(a.type==='text')await p.keyboard.insertText(a.text);
  else if(a.type==='select')await p.locator('select').nth(a.index||0).selectOption(String(a.value));
  else if(a.type==='reload')await p.reload({waitUntil:'load'});
  else if(a.type==='wait')await p.waitForTimeout(Math.min(a.ms||500,6000));
  else throw Error('Unknown browser action');
  this.actions.push({...a,time:t});await p.waitForTimeout(a.type==='wait'?30:180);
 }
 async inspect(label='page'){
  const id=String(++this.sequence).padStart(4,'0')+'-'+label.replace(/[^\w-]/g,'').slice(0,60),file=path.join(this.out,id+'.png');
  await this.page.screenshot({path:file});
  const dom=await this.page.evaluate(()=>Array.from(document.querySelectorAll('button,select,input,[role="button"]')).filter(el=>el.getBoundingClientRect().width&&el.getBoundingClientRect().height).map(el=>{const b=el.getBoundingClientRect();return {tag:el.tagName,text:el.innerText?.slice(0,100),title:el.getAttribute('title'),aria:el.getAttribute('aria-label'),value:el.value,options:el.tagName==='SELECT'?Array.from(el.options).map(o=>({text:o.text,value:o.value})):undefined,box:{x:b.x,y:b.y,width:b.width,height:b.height}}}));
  await this.flush();return {id,file,url:this.page.url(),controls:dom,logs:this.logs.slice(-12),browser:this.version};
 }
 async flush(){await fs.writeFile(path.join(this.out,'browser-log.json'),JSON.stringify({logs:this.logs,actions:this.actions},null,2));}
 async close(){await this.flush();await this.context?.close();await this.browser?.close();await new Promise(r=>this.server?.close(r)||r());}
}
