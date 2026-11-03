import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const docs=path.join(root,'docs'),site=path.join(docs,'weaving');
const output=path.resolve(process.env.CASE6B_QA_OUTPUT||path.join(root,'outputs/case6b-site-qa'));
await fs.mkdir(output,{recursive:true});
const read=rel=>fs.readFile(path.join(site,rel),'utf8');
const json=async rel=>JSON.parse(await read(rel));
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const data=await json('data/case.json');
assert.equal(data.case_version,'2.1.0');assert(data.models.length>=2);
const analysis=await json('data/detailed-analysis.json');
assert.equal(analysis.case_version,data.case_version);assert.equal(analysis.final_score,null);
assert.deepEqual(analysis.models.map(m=>m.id),data.models.map(m=>m.id));
const homepage=await read('index.html');let analysisFindings=0,analysisPhases=0,errorChains=0;
const audit=await json('data/publication-audit.json');assert.equal(audit.private_evaluator_material_published,false);assert.equal(audit.raw_api_responses_published,false);assert.equal(audit.original_submissions_unchanged,true);
const forbidden=/\b(?:github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,})/;
let files=0,links=0;let totalBytes=0;
for(const rel of await fs.readdir(site,{recursive:true})){
 const p=path.join(site,rel),stat=await fs.stat(p);if(!stat.isFile())continue;files++;totalBytes+=stat.size;
 assert(stat.size<100*1024*1024,`Oversized Git file: ${rel}`);
 assert(!/(?:^|[/\\])(?:evaluator|responses|requests|infrastructure)(?:[/\\]|$)/.test(rel),`Private directory published: ${rel}`);
 if(!/\.(html|css|js|json|md|txt|vtt)$/.test(rel))continue;
 const s=await fs.readFile(p,'utf8');assert(!forbidden.test(s),`Credential pattern: ${rel}`);assert(!s.includes('\uFFFD'),`Encoding replacement: ${rel}`);
 assert(!s.includes('encrypted_content'),`Raw API reasoning: ${rel}`);
 if(rel.endsWith('.html'))for(const match of s.matchAll(/(?:href|src)="([^"]+)"/g)){
   const url=match[1];if(/^(?:https?:|data:|#)/.test(url))continue;
   const local=decodeURIComponent(url.split(/[?#]/)[0]);if(!local)continue;
   const target=path.resolve(path.dirname(p),local);assert(target===docs||target.startsWith(docs+path.sep),`Link escapes docs: ${url}`);
   await fs.access(target);links++;
 }
 if(rel.endsWith('.js'))new vm.Script(s,{filename:rel});
}
for(const file of data.candidate_files){
 if(file.path.endsWith('/tutorial.mp4'))continue;
 assert.equal(sha(await fs.readFile(path.join(site,file.path))),file.sha256,`Candidate modified: ${file.path}`);
}
assert.equal(sha(await fs.readFile(path.join(site,data.preview.path))),data.preview.sha256,'Preview video modified');
let preserved=0,missing=0;
for(const model of data.models){
 const record='records/'+model.id+'/';
 for(const [filename,digest] of Object.entries(model.artifact_sha256)){
  let bytes;
  if(model.artifact_urls?.[filename]){
   const url=model.artifact_urls[filename];assert(url.startsWith('https://github.com/huayuankou333/omniale/releases/download/'));
   assert.equal(model.external_artifact_digests[filename],'sha256:'+digest);
   console.log(`Verifying original external artifact: ${model.id}/${filename}`);
   if(process.env.CASE6B_EXTERNAL_ARTIFACT_CACHE){
    bytes=await fs.readFile(path.join(process.env.CASE6B_EXTERNAL_ARTIFACT_CACHE,model.id,filename));
   }else{
    const response=await fetch(url,{signal:AbortSignal.timeout(180000)});assert.equal(response.status,200);bytes=Buffer.from(await response.arrayBuffer());
   }
  }else bytes=await fs.readFile(path.join(site,record,filename));
  assert.equal(sha(bytes),digest,`Original submission modified: ${model.id}/${filename}`);
 }
 const trace=await json(record+'trajectory.json');const tools=trace.events.filter(e=>e.kind==='tool');
 assert.equal(tools.length,model.tool_calls);assert.equal(trace.events.filter(e=>e.kind==='api_retry').length,model.api_retries);
 assert.equal(trace.events.flatMap(e=>e.images||[]).length,model.observations);
 for(const event of tools)for(const image of event.images){
  if(!image.available){missing++;assert(image.omission_reason.includes('No later image substituted'));continue;}
  preserved++;assert.equal(sha(await fs.readFile(path.join(site,record,image.path))),image.sha256);await fs.access(path.join(site,record,image.thumbnail));
 }
 const pages=await json(record+'pages.json');assert.equal(pages.length,model.pages);
 for(const p of pages)await fs.access(path.join(site,record,p.image));
 assert.equal(model.final_score,null);
 const detail=analysis.models.find(m=>m.id===model.id);
 const sourceTimes=[...new Set(tools.filter(e=>e.action==='extract_frames'&&e.status==='ok').flatMap(e=>e.params.times))].sort((a,b)=>a-b);
 assert.deepEqual(detail.source_times_seconds,sourceTimes,`Source evidence count mismatch: ${model.id}`);
 for(const finding of detail.findings){
  analysisFindings++;assert(homepage.includes(`id="${finding.id}"`));
  for(const n of finding.tools){assert(tools.some(t=>t.tool_call===n));assert(homepage.includes(`#trajectory-${model.id}-tool-${n}`));}
  for(const n of finding.pages)assert(n>=1&&n<=model.pages);
  assert(finding.observation&&finding.impact&&finding.boundary);
  if(finding.image)await fs.access(path.join(site,finding.image));
 }
 for(const phase of detail.phases){analysisPhases++;assert(phase.first_tool<=phase.last_tool);assert(tools.some(t=>t.tool_call===phase.first_tool));assert(tools.some(t=>t.tool_call===phase.last_tool));}
 assert.equal(detail.recoverable_errors.length,model.recoverable_tool_errors);
 for(const chain of detail.recoverable_errors){errorChains++;assert.equal(tools.find(t=>t.tool_call===chain.tool).status,'error');if(chain.recovery_tool!==null)assert.equal(tools.find(t=>t.tool_call===chain.recovery_tool).status,'ok');else assert(chain.outcome);}
 if(model.historical_image_method==='exact_outgoing_image_snapshots')assert.equal(trace.counts.missing_images,0);
 if(model.transport_recovery){for(const file of model.transport_recovery_records||['transport-recovery.json']){const recovery=await json(record+file);assert(recovery.same_context&&recovery.original_started_at_and_budgets_retained&&!recovery.new_model_hints);}assert(homepage.includes('id="transport-'+model.id+'"'));}
}
for(const match of homepage.matchAll(/href="#trajectory-([^"]+)-tool-(\d+)"/g)){
 const model=data.models.find(m=>m.id===match[1]);assert(model,`Unknown trace model: ${match[1]}`);assert(Number(match[2])>=1&&Number(match[2])<=model.tool_calls);
}
const pending=await json('data/evaluation-status.json');
const statusEntries=pending.requested_evaluations||[pending];
for(const entry of statusEntries){
 if(entry.status==='completed'){assert(entry.formal_evaluation_started);assert(data.models.some(m=>m.id===entry.requested_model));}
 else{assert.equal(entry.score,null);assert.equal(entry.artifact,null);}
 if(entry.status==='not_started_api_unsupported'){assert.equal(entry.formal_evaluation_started,false);assert.equal(entry.http_status,404);}
}
const report={static_checks_passed:true,case_version:data.case_version,files,links,total_bytes:totalBytes,
  external_artifact_source:process.env.CASE6B_EXTERNAL_ARTIFACT_CACHE?'separately downloaded cache, verified against frozen SHA256':'live Release download, verified against frozen SHA256',
  models:data.models.map(m=>({model:m.id,tools:m.tool_calls,pages:m.pages,original_artifacts_hash_match:true})),
  historical_images:{preserved,missing,overwritten_images_substituted:false},analysis:{findings:analysisFindings,phases:analysisPhases,recoverable_error_chains:errorChains},browser_checks:'not_requested'};

if(process.argv.includes('--browser')){
 const require=createRequire(import.meta.url);const {chromium}=require(process.env.CASE6B_PLAYWRIGHT_MODULE||'playwright');
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.vtt':'text/vtt; charset=utf-8','.mp4':'video/mp4','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost'),rel=decodeURIComponent(url.pathname);let p=path.resolve(docs,'.'+rel);
   if(!p.startsWith(docs+path.sep)){res.writeHead(403).end();return;}
   let stat=await fs.stat(p);if(stat.isDirectory()){p=path.join(p,'index.html');stat=await fs.stat(p);}
   const buffer=await fs.readFile(p),headers={'Content-Type':types[path.extname(p)]||'application/octet-stream','Accept-Ranges':'bytes'};
   const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);
   if(range){const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):stat.size-1,stat.size-1);res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});res.end(buffer.subarray(start,end+1));}
   else{res.writeHead(200,{...headers,'Content-Length':stat.size});res.end(buffer);}
  }catch{res.writeHead(404).end('Not found');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/weaving/`;
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});const errors=[];
 const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(`HTTP ${r.status()} ${r.url()}`);});
 try{
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('.trace-event').first().waitFor();
  assert((await page.locator('#task').textContent()).includes('加入至少两项常见问题的可逆排查与恢复方法'));
  assert.equal(await page.locator('.trace-event').count(),data.models[0].tool_calls+data.models[0].api_retries);
  await page.screenshot({path:path.join(output,'case-desktop-top.png')});
  await page.locator('#inputs').screenshot({path:path.join(output,'case-inputs.png')});
  await page.locator('#results').screenshot({path:path.join(output,'case-results.png')});
  await page.locator('#analysis .finding[open] img').evaluateAll(async images=>{await Promise.all(images.map(image=>{image.loading='eager';return image.decode();}));});
  await page.locator('#analysis').screenshot({path:path.join(output,'case-analysis-desktop.png')});
  await page.locator('#source-coverage summary').click();await page.locator('#source-coverage').screenshot({path:path.join(output,'case-source-coverage.png')});
  await page.locator('#source-coverage summary').click();
  await page.locator('[id="phases-gpt-6.1-sol"] summary').click();await page.locator('[id="phases-gpt-6.1-sol"]').screenshot({path:path.join(output,'case-sol-phases.png')});
  await page.locator('[id="phases-gpt-6.1-sol"] summary').click();
  await page.locator('video').evaluate(v=>{v.load();v.play().catch(()=>{});});
  await page.waitForFunction(()=>document.querySelector('video').readyState>=1,{},{timeout:15000});
  report.media=await page.locator('video').evaluate(v=>({duration:v.duration,readyState:v.readyState,codec:v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')}));
  await page.waitForFunction(()=>document.querySelector('video').currentTime>0.05,{},{timeout:15000});
  await page.locator('video').evaluate(v=>v.pause());
  const duration=await page.locator('video').evaluate(v=>v.duration);assert(Math.abs(duration-797.884)<1,`Video duration ${duration}`);
  const sol=data.models.find(m=>m.id==='gpt-6.1-sol');
  await page.selectOption('#trace-model',sol.id);await page.waitForFunction(n=>document.querySelectorAll('.trace-event').length===n,sol.tool_calls+sol.api_retries);
  await page.selectOption('#trace-filter','errors');await page.waitForFunction(n=>document.querySelectorAll('.trace-event').length===n,sol.recoverable_tool_errors+sol.api_retries);
  await page.selectOption('#trace-filter','images');await page.locator('.trace-event summary').first().click();await page.locator('.trace-images img').first().waitFor();
  await page.locator('.trace-images img').first().evaluate(img=>img.decode());
  await page.locator('#trajectory').screenshot({path:path.join(output,'case-trajectory.png')});
  await page.fill('#trace-search','NO_MATCH_TEST_903824');await page.waitForFunction(()=>document.querySelectorAll('.trace-event').length===0);
  await page.fill('#trace-search','');
  await page.selectOption('#trace-filter','errors');await page.fill('#trace-search','NO_MATCH_TEST');
  await page.goto(base+'#trajectory-gpt-6-luna-tool-26');
  await page.waitForFunction(()=>document.querySelector('#trace-gpt-6-luna-tool-26')?.open===true);
  assert.equal(await page.locator('#trace-model').inputValue(),'gpt-6-luna');assert.equal(await page.locator('#trace-filter').inputValue(),'all');assert.equal(await page.locator('#trace-search').inputValue(),'');
  assert((await page.locator('#trace-gpt-6-luna-tool-26').textContent()).includes('author_additions'));
  await page.goto(base+'#trajectory-gpt-6.1-sol-tool-44');await page.waitForFunction(()=>document.getElementById('trace-gpt-6.1-sol-tool-44')?.open===true);
  assert.equal(await page.locator('#trace-model').inputValue(),'gpt-6.1-sol');
  assert((await page.locator('[data-tool="44"]').textContent()).includes('non-zero exit status 1'));
  await page.screenshot({path:path.join(output,'case-tool-deeplink.png')});
  await page.goto(base+'#analysis');await page.locator('#sol-rc03 a[href="#trajectory-gpt-6.1-sol-tool-49"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-tool="49"]')?.open===true);
  assert((await page.locator('[data-tool="49"]').textContent()).includes('mechanical_only'));
  for(const model of data.models.slice(2)){
   await page.goto(base+'#trajectory-'+model.id+'-tool-1');
   await page.waitForFunction(id=>document.getElementById('trace-'+id+'-tool-1')?.open===true,model.id);
   assert.equal(await page.locator('#trace-model').inputValue(),model.id);
   await page.selectOption('#trace-filter','errors');
   await page.waitForFunction(n=>document.querySelectorAll('.trace-event').length===n,model.recoverable_tool_errors+model.api_retries);
   await page.goto(base+'#analysis-'+model.id);
   const article=page.locator('[id="analysis-'+model.id+'"]');
   await article.locator('.finding').first().evaluate(element=>element.open=true);
   await article.screenshot({path:path.join(output,model.id+'-analysis.png')});
   const phase=page.locator('[id="phases-'+model.id+'"]');await phase.locator('summary').click();
   await phase.screenshot({path:path.join(output,model.id+'-phases.png')});
  }
  for(const model of data.models){
   await page.goto(base+model.viewer,{waitUntil:'networkidle'});
   await page.locator('#pdf-page').evaluate(img=>img.decode());await page.screenshot({path:path.join(output,model.id+'-reader.png')});
   await page.click('#next-page');assert.equal(await page.locator('#page-select').inputValue(),'2');
   await page.selectOption('#page-select',String(model.pages));assert((await page.locator('#pdf-page').getAttribute('src')).endsWith(`page-${String(model.pages).padStart(2,'0')}.jpg`));
   assert.equal(await page.locator('#next-page').isDisabled(),true);await page.click('#zoom-page');assert.equal(await page.locator('#zoom-page').getAttribute('aria-pressed'),'true');
   await page.goto(base+model.viewer+'#page='+Math.min(model.pages,12),{waitUntil:'networkidle'});assert.equal(await page.locator('#page-select').inputValue(),String(Math.min(model.pages,12)));
  }
  await page.setViewportSize({width:390,height:844});await page.goto(base,{waitUntil:'networkidle'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Mobile horizontal overflow');
  await page.screenshot({path:path.join(output,'case-mobile-top.png')});
  await page.locator('#analysis .finding[open] img').evaluateAll(async images=>{await Promise.all(images.map(image=>{image.loading='eager';return image.decode();}));});
  await page.locator('#luna-rc01').screenshot({path:path.join(output,'case-analysis-mobile.png')});
  await page.locator('#sol-rc03').screenshot({path:path.join(output,'case-sol-error-mobile.png')});
  await page.goto(base+'#trajectory-gpt-6.1-sol-tool-42');await page.waitForFunction(()=>document.querySelector('[data-tool="42"]')?.open===true);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Mobile tool deep-link overflow');
  assert((await page.locator('[data-tool="42"]').textContent()).includes('JSONDecodeError'));
  await page.screenshot({path:path.join(output,'case-tool-mobile.png')});
  await page.goto(base+'deliverables/gpt-6.1-sol/',{waitUntil:'networkidle'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Mobile reader overflow');
  await page.screenshot({path:path.join(output,'sol-mobile-reader.png')});
  for(const model of data.models.slice(2)){
   await page.goto(base+model.viewer,{waitUntil:'networkidle'});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Additional mobile reader overflow');
   await page.screenshot({path:path.join(output,model.id+'-mobile-reader.png')});
   await page.goto(base+'#analysis-'+model.id);await page.locator('[id="analysis-'+model.id+'"] .finding').first().evaluate(element=>element.open=true);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Additional mobile analysis overflow');
   await page.screenshot({path:path.join(output,model.id+'-mobile-analysis.png')});
  }
  assert.deepEqual(errors,[]);report.browser_checks='passed';report.browser_validated=['desktop and mobile layout','detailed analysis and source-time chart','phase tables','cross-model tool deep links reset filters and search','analysis links open the original tool result','malformed JSON tool event displays safely','video duration and range playback','all tool traces plus retries','error and image filters','search','historical image rendering','all PDF readers','page navigation, deep links and zoom','no page errors or missing local assets'];
 }catch(error){report.browser_checks='failed';report.failure=error.stack;report.media=await page.locator('video').evaluate(v=>v?({readyState:v.readyState,networkState:v.networkState,error:v.error?{code:v.error.code,message:v.error.message}:null,currentSrc:v.currentSrc,codec:v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')}):null).catch(()=>null);await fs.writeFile(path.join(output,'validation.json'),JSON.stringify(report,null,2)+'\n');throw error;}
 finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
await fs.writeFile(path.join(output,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
