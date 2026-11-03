const {chromium}=await import(process.env.RESOLVE_PLAYWRIGHT_MODULE || 'playwright');
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const work=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const docs=path.join(work,'docs'),out=path.join(work,'resolve-site-qa');await fsp.mkdir(out,{recursive:true});
const report=JSON.parse(await fsp.readFile(path.join(docs,'resolve/data/report.json'),'utf8'));
const analysis=JSON.parse(await fsp.readFile(path.join(docs,'resolve/data/analysis.json'),'utf8'));
const phaseCount=Object.values(analysis.phases).reduce((n,rows)=>n+rows.length,0);
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.mp4':'video/mp4','.jpg':'image/jpeg','.png':'image/png','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.zip':'application/zip','.drp':'application/octet-stream'};
const server=http.createServer((req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let target=path.resolve(docs,'.'+p);if(!target.startsWith(docs)){res.writeHead(403).end();return;}if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');if(!fs.existsSync(target)){res.writeHead(404).end();return;}const stat=fs.statSync(target);res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);if(range){const start=+range[1],end=range[2]?Math.min(+range[2],stat.size-1):stat.size-1;res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});fs.createReadStream(target,{start,end}).pipe(res);}else{res.writeHead(200,{'Content-Length':stat.size});fs.createReadStream(target).pipe(res);}}catch(e){res.writeHead(500).end(e.message);}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/resolve/`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[],badResponses=[];
const context=await browser.newContext({viewport:{width:1440,height:1050}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)badResponses.push([r.url(),r.status()]);});
const checks=[];
async function captureEvidenceSection(selector,file){
 // Keep capture geometry stable while lazy images decode and smooth scrolling settles.
 await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
 const section=page.locator(selector);
 await section.locator('img').evaluateAll(async imgs=>{
  await Promise.all(imgs.map(async img=>{img.loading='eager';await img.decode();}));
 });
 await page.evaluate(()=>document.fonts.ready);
 await section.scrollIntoViewIfNeeded();
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert(await section.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)));
 const bytes=await section.screenshot({path:path.join(out,file)});
 const colors=await page.evaluate(async encoded=>{
  const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const distinct=new Set();for(let i=0;i<rgba.length;i+=388)distinct.add(`${rgba[i]},${rgba[i+1]},${rgba[i+2]}`);
  return distinct.size;
 },bytes.toString('base64'));
 assert(colors>100,'evidence screenshot is blank or lacks image content');
}
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForSelector('.criterion');assert.equal(await page.locator('.criterion').count(),24);checks.push('24 v3 rubric rows render from score JSON');
 assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.result').count(),report.models.length);
 await page.waitForFunction(()=>[...document.querySelectorAll('.result video')].every(v=>v.readyState>=1));
 const media=await page.locator('.result video').evaluateAll(vs=>vs.map(v=>({id:v.id,duration:v.duration,width:v.videoWidth,height:v.videoHeight,error:v.error?.message||null})));
 for(const m of report.models){const loaded=media.find(v=>v.id===`video-${m.id}`);assert(loaded&&Math.abs(loaded.duration-m.duration)<.1);}
 assert(media.every(x=>x.width===1280&&x.height===720&&!x.error));checks.push('all actual browser videos load matching duration and dimensions');
 await page.screenshot({path:path.join(out,'desktop-top.png')});
 await page.locator('#results').screenshot({path:path.join(out,'desktop-results.png')});
 await page.selectOption('#rubric-filter','O');assert.equal(await page.locator('.criterion').count(),8);
 const texts=await page.locator('.criterion[data-id="O08"] .criterion-points span').allTextContents();assert.deepEqual(texts,['0.50 / 5','1 / 5','5 / 5']);
 await page.locator('.criterion[data-id="O08"] > summary').click();await page.waitForSelector('.criterion[data-id="O08"] .criterion-body');
 assert.equal(await page.locator('.criterion[data-id="O08"] .adjudication').count(),2);
 assert((await page.locator('.criterion[data-id="O08"] .criterion-definition').textContent()).includes('视觉层级'));
 await page.locator('.criterion[data-id="O08"]').screenshot({path:path.join(out,'desktop-v3-subtitle-components.png')});
 await page.locator('.criterion[data-id="O01"] > summary').click();await page.waitForSelector('.criterion[data-id="O01"] .criterion-body');
 assert((await page.locator('.criterion[data-id="O01"] .criterion-definition').textContent()).includes('v2.1'));
 await page.locator('.criterion[data-id="O01"]').screenshot({path:path.join(out,'desktop-v3-attribution.png')});
 checks.push('8 Omni rows, expanded grading definitions and partial O08 subtitle adjudication display');
 await page.selectOption('#rubric-filter','all');await page.locator('#rubric').screenshot({path:path.join(out,'desktop-v3-rubric.png')});
 await page.locator('.criterion[data-id="C04"] > summary').click();await page.waitForSelector('.criterion[data-id="C04"] .criterion-definition');
 assert((await page.locator('.criterion[data-id="C04"] .criterion-definition').textContent()).includes('约 1 欧元'));
 assert.equal(await page.locator('.criterion[data-id="C04"] .source-judgments').count(),3);checks.push('content module necessary links and all three source-judgment audits render');
 await page.locator('#analysis .seek[data-model="sol"]').click();await page.waitForFunction(()=>Math.abs(document.querySelector('#video-sol').currentTime-57.48)<.1);checks.push('evidence button seeks correct model to57.48seconds');
 await page.selectOption('#camera','Closeup2');await page.waitForFunction(()=>document.querySelector('#source-video').readyState>=1&&document.querySelector('#source-video').currentSrc.includes('Closeup2'));
 assert(Math.abs(await page.locator('#source-video').evaluate(v=>v.duration)-12)<.1);checks.push('five-camera input preview switches with real media');
 await page.goto(base+'index.v2.1.html#rubric',{waitUntil:'domcontentloaded'});await page.waitForSelector('.criterion');assert.equal(await page.locator('.criterion').count(),39);
 assert((await page.locator('#history-banner').textContent()).includes('历史版本'));
 assert.deepEqual(await page.locator('.result .score').allTextContents(),['38.67 / 100','83.33 / 100','85.75 / 100']);
 await page.locator('#rubric').screenshot({path:path.join(out,'desktop-v2-history-rubric.png')});
 await page.goto(base+'analysis.v2.1.html',{waitUntil:'domcontentloaded'});assert((await page.locator('#sol-lcd').textContent()).includes('O02为2/10'));
 checks.push('historical 39-row rubric, three original totals and old event attribution remain available');
 await page.goto(base+'traces.html?model=gpt-6.1-sol',{waitUntil:'domcontentloaded'});await page.waitForSelector('.trace-event');assert.equal(await page.locator('.trace-event').count(),108);
 await page.selectOption('#trace-action','frames');assert.equal(await page.locator('.trace-event').count(),16);await page.locator('.trace-event summary').first().click();await page.waitForFunction(()=>[...document.querySelectorAll('.trace-event[open] img')].some(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:path.join(out,'desktop-traces.png')});checks.push('Sol108events,16framecalls and actual observed images');
 await page.selectOption('#trace-model','gpt-6-luna');await page.waitForFunction(()=>document.querySelectorAll('.trace-event').length===38);await page.locator('#trace-query').fill('字幕');assert((await page.locator('.trace-event').count())>0);await page.locator('#trace-query').fill('__no_such_event__');assert.equal(await page.locator('.trace-event').count(),0);await page.locator('#trace-query').fill('');await page.locator('#errors-only').check();assert((await page.locator('.trace-event').count())>=1);checks.push('Luna38events and search/error filters');
 for(const m of report.models.slice(2)){
  await page.goto(base+'traces.html?model='+encodeURIComponent(m.model),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(n=>document.querySelectorAll('.trace-event').length===n,m.trace_events);
  assert.equal(await page.locator('#trace-model').inputValue(),m.model);
  await page.goto(base+`?model=${m.id}&time=10#results`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(id=>Math.abs(document.querySelector('#video-'+id).currentTime-10)<.1,m.id);
  checks.push(m.model+' actual trace and model-specific video deep link');
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForSelector('.criterion');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'mobile-top.png')});
 await page.locator('#inputs').screenshot({path:path.join(out,'mobile-inputs.png')});checks.push('390px mobile layout has no page overflow');
 await page.goto(base+'traces.html?model=gpt-6.1-sol',{waitUntil:'domcontentloaded'});await page.waitForSelector('.trace-event');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push('mobile trace controls and events have no page overflow');
 await page.setViewportSize({width:1440,height:1050});await page.goto(base+'analysis.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.error-detail').count(),analysis.errors.length);assert.equal(await page.locator('.phase').count(),phaseCount);
 await page.screenshot({path:path.join(out,'desktop-analysis.png')});
 await captureEvidenceSection('#sol-lcd','desktop-speaker-error.png');checks.push('speaker evidence images decode and captured card contains actual image pixels');
 for(const m of report.models.slice(2)){
  const evidence=analysis.errors.find(e=>e.model===m.model&&e.image);
  if(evidence){await captureEvidenceSection('#'+evidence.id,`desktop-${m.id}-evidence.png`);checks.push(m.model+' new evidence card captures decoded real output image');}
 }
 await page.locator('#sol-lcd a').filter({hasText:'打开成片定位'}).click();await page.waitForFunction(()=>Math.abs(document.querySelector('#video-sol').currentTime-57.48)<.1);checks.push(analysis.errors.length+' detailed evidence cards, '+phaseCount+' execution phases and cross-page video seek');
 await page.goto(base+'traces.html?model=gpt-6.1-sol#event-80',{waitUntil:'domcontentloaded'});await page.waitForSelector('#event-80[open]');checks.push('analysis links open the exact original trace event');
 await page.setViewportSize({width:390,height:844});await page.goto(base+'analysis.html',{waitUntil:'domcontentloaded'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'mobile-analysis.png')});checks.push('detailed analysis is readable on390px mobile layout');
 assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);checks.push('no browser runtime exceptions or local HTTP errors');
 const result={pass:true,browser:'system Chrome / Playwright',viewports:[[1440,1050],[390,844]],media,checks,console_errors:errors,bad_http_responses:badResponses,screenshots:['desktop-top.png','desktop-results.png','desktop-v3-rubric.png','desktop-v3-attribution.png','desktop-v3-subtitle-components.png','desktop-v2-history-rubric.png','desktop-traces.png','mobile-top.png','mobile-inputs.png','desktop-analysis.png','desktop-speaker-error.png','mobile-analysis.png']};
 await fsp.writeFile(path.join(docs,'resolve/files/browser-validation.json'),JSON.stringify(result,null,2)+'\n');await fsp.writeFile(path.join(out,'browser-validation.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser.close();server.close();}
