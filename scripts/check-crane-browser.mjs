const { chromium } = await import(process.env.CRANE_PLAYWRIGHT_MODULE || 'playwright');
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const output = new URL('../crane-site-qa/', import.meta.url);
await fs.mkdir(output, {recursive:true});
const docs = fileURLToPath(new URL('../docs/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp4':'video/mp4','.png':'image/png','.jpg':'image/jpeg'};
let server;
let base=process.env.CRANE_QA_URL;
if(!base){
  server=http.createServer((req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      let target=path.resolve(docs,'.'+pathname);
      if(!target.startsWith(path.resolve(docs)+path.sep)){res.writeHead(403).end();return;}
      if(fsSync.existsSync(target)&&fsSync.statSync(target).isDirectory())target=path.join(target,'index.html');
      if(!fsSync.existsSync(target)){res.writeHead(404).end();return;}
      const stat=fsSync.statSync(target),range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');
      res.setHeader('Accept-Ranges','bytes');
      if(range){
        const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;
        if(start> end){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
        res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});
        fsSync.createReadStream(target,{start,end}).pipe(res);
      }else{
        res.writeHead(200,{'Content-Length':stat.size});fsSync.createReadStream(target).pipe(res);
      }
    }catch(error){res.writeHead(500).end(String(error));}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  base=`http://127.0.0.1:${server.address().port}/ale-crane-keying/`;
}
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || undefined,headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1080}});
const errors = [], failures = [], checks = [];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)failures.push([r.status(),r.url()]);});
const assert = (ok, description) => {if(!ok)throw Error(description);checks.push(description);};
try{
await page.goto(base,{waitUntil:'networkidle'});
await page.locator('#frame-scores tr').last().waitFor();
assert(await page.locator('#frame-scores tr').count() === 5,'Five breakpoint rows loaded');
assert(await page.locator('.score-card').count() === 2,'Both model aggregate cards present');
await page.screenshot({path:new URL('desktop-top.png',output).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:false});
await page.locator('#compare').scrollIntoViewIfNeeded();
await page.waitForFunction(()=>[...document.querySelectorAll('#compare video')].every(v=>v.readyState>=1));
await page.screenshot({path:new URL('desktop-compare.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
const metadata = await page.locator('#compare video').evaluateAll(vs=>vs.map(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight})));
console.log(JSON.stringify({browser_media_metadata:metadata}));
// Chrome expands the input's display height to 549 for SAR 119:120.
// The independently verified encoded raster is 1280x544; delivery containers are square-pixel.
assert(metadata.every((v,i)=>Math.abs(v.duration-10.041667)<.02&&v.width===1280&&v.height===(i===0?549:544)),'Browser playback preserves full duration and correct aspect-aware dimensions');
for(const id of ['sol-1','luna-1','sol-2','luna-2','sol-3','luna-3']){
  await page.selectOption('#score-run',id);
  assert(await page.locator('#score-frames img').count()===5,`Five authentic output frames for ${id}`);
  assert((await page.locator('#score-json').getAttribute('href')).includes(id),`Correct score artifact for ${id}`);
}
await page.selectOption('#sol-run','sol-3');
await page.selectOption('#luna-run','luna-2');
await page.waitForFunction(()=>document.querySelector('#compare-sol').readyState>=2&&document.querySelector('#compare-luna').readyState>=2);
await page.locator('[data-seek="7"]').click();
await page.waitForFunction(()=>[...document.querySelectorAll('#compare video')].every(v=>Math.abs(v.currentTime-7)<.04&&!v.seeking));
assert(true,'Cross-trial selectors and synchronized 7-second seek work');
await page.locator('#play-toggle').click();
await page.waitForTimeout(1400);
const times=await page.locator('#compare video').evaluateAll(vs=>vs.map(v=>({time:v.currentTime,paused:v.paused})));
assert(times.every(v=>!v.paused&&v.time>7.5)&&Math.max(...times.map(v=>v.time))-Math.min(...times.map(v=>v.time))<.18,'All three videos play with synchronized clocks');
await page.locator('#play-toggle').click();
await page.locator('#restart').click();
await page.waitForFunction(()=>[...document.querySelectorAll('#compare video')].every(v=>v.currentTime<.05));
assert(true,'Pause and restart reset all three players');
await page.selectOption('#score-run','luna-1');
assert((await page.locator('#judge-details').innerText()).includes('原始三项软判断'),'Judge evidence panels loaded');
await page.locator('#judge-details details').first().locator('summary').click();
assert((await page.locator('#judge-details details').first().innerText()).includes('主体合理保留：NO'),'Luna 1 negative foreground judgment retained');
await page.goto(base+'traces.html?run=sol-3#event-47',{waitUntil:'networkidle'});
await page.locator('#event-47 pre').first().waitFor();
assert(await page.locator('.event').count()===86,'All 86 Sol 3 tool events available');
assert(await page.locator('#event-47').getAttribute('open')!==null,'Deep link expands actual tool event');
await page.screenshot({path:new URL('desktop-trace.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
await page.selectOption('#trace-action','render_video');
assert((await page.locator('#trace-status').innerText()).includes('显示'),'Action filter works');
await page.selectOption('#trace-action','');
await page.fill('#trace-search','B-min');
assert(await page.locator('.event').count()>0,'Code keyword search matches actual trace');
await page.fill('#trace-search','');
await page.selectOption('#trace-run','luna-3');
await page.waitForFunction(()=>document.querySelector('#trace-status').textContent.includes('/ 30 '));
await page.check('#trace-errors');
assert(await page.locator('.event').count()>0,'Error-only filter exposes real tool failures');
await page.locator('.event summary').first().click();
await page.locator('.event pre').first().waitFor();
await page.uncheck('#trace-errors');
for(const viewport of [{width:390,height:844},{width:768,height:1024}]){
  await page.setViewportSize(viewport);
  await page.goto(base,{waitUntil:'networkidle'});
  const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert(sizes.scroll<=sizes.client,`No page overflow at ${viewport.width}px`);
  await page.screenshot({path:new URL(`mobile-${viewport.width}.png`,output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await page.goto(base+'traces.html?run=luna-1#event-4',{waitUntil:'networkidle'});
  await page.locator('#event-4 img').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#event-4 img')?.naturalWidth>0);
  const traceSizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert(traceSizes.scroll<=traceSizes.client,`Expanded trace has no page overflow at ${viewport.width}px`);
  await page.screenshot({path:fileURLToPath(new URL(`mobile-trace-${viewport.width}.png`,output))});
}
assert(errors.length===0,'No JavaScript runtime errors');
assert(failures.length===0,'No HTTP failures in browsing flow');
await fs.writeFile(new URL('browser-report.json',output),JSON.stringify({at:new Date().toISOString(),base,checks,errors,failures,metadata,playback:times},null,2));
console.log(JSON.stringify({passed:true,checks:checks.length,errors,failures,output:path.resolve(new URL(output).pathname.replace(/^\/([A-Z]:)/,'$1'))}));
}catch(error){
  const media=await page.locator('video').evaluateAll(vs=>vs.map(v=>({src:v.currentSrc,time:v.currentTime,seeking:v.seeking,ready:v.readyState,paused:v.paused,error:v.error?.message,buffered:Array.from({length:v.buffered.length},(_,i)=>[v.buffered.start(i),v.buffered.end(i)])}))).catch(()=>[]);
  await fs.writeFile(new URL('failure-report.json',output),JSON.stringify({error:String(error),checks,errors,failures,media},null,2));
  await page.screenshot({path:fileURLToPath(new URL('failure.png',output))}).catch(()=>{});
  console.log(JSON.stringify({media}));
  throw error;
}finally{
  await browser.close();server?.close();
}
