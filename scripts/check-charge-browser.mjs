import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.CHARGE_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const docs=path.join(root,'docs'),out=path.join(root,'browser-qa');await fsp.mkdir(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.mp4':'video/mp4','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{
 try{let file=path.resolve(docs,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(docs+path.sep)){res.writeHead(403).end();return}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404).end();return}const size=fs.statSync(file).size;res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);if(range){const start=+range[1],end=range[2]?Math.min(+range[2],size-1):size-1;if(start>=size){res.writeHead(416).end();return}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(file,{start,end}).pipe(res)}else{res.writeHead(200,{'Content-Length':size});fs.createReadStream(file).pipe(res)}}catch(e){res.writeHead(500).end(e.message)}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/charge-foley/`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:1080}}),page=await context.newPage();
const errors=[],bad=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)bad.push([r.url(),r.status()])});
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForSelector('.criterion');assert.equal(await page.locator('.criterion').count(),24);assert.equal(await page.locator('.result').count(),3);
 assert.deepEqual(await page.locator('.result .score').allTextContents(),['39.41 / 100','69.16 / 100','52.75 / 100']);checks.push('three totals and all24rubrics');
 await page.waitForFunction(()=>[...document.querySelectorAll('.result video')].every(v=>v.readyState>=1));
 assert((await page.locator('.result video').evaluateAll(vs=>vs.map(v=>v.duration))).every(t=>Math.abs(t-88)<.1));
 for(const slug of ['luna','sol','deepseek']){await page.selectOption('#stage-'+slug,'v1');await page.waitForFunction(s=>{const v=document.querySelector('#video-'+s);return v.readyState>=1&&Math.abs(v.duration-90)<.1},slug);await page.selectOption('#stage-'+slug,'v2');await page.waitForFunction(s=>{const v=document.querySelector('#video-'+s);return v.readyState>=1&&Math.abs(v.duration-88)<.1},slug)}checks.push('all six candidate videos switch and decode');
 await page.selectOption('#input-stage','v2');await page.waitForFunction(()=>Math.abs(document.querySelector('#input-video').duration-88)<.1);checks.push('two silent input variants');
 await page.waitForFunction(()=>Math.abs(document.querySelector('#reference-video').duration-90)<.1);
 await page.selectOption('#reference-stage','v2');await page.waitForFunction(()=>Math.abs(document.querySelector('#reference-video').duration-88)<.1);assert((await page.locator('#reference-caption').textContent()).includes('未执行环境总线降低4 dB'));
 await page.locator('#reference-video').evaluate(v=>v.play());await page.waitForFunction(()=>!document.querySelector('#reference-video').paused);
 await page.locator('#video-sol').evaluate(v=>v.play());await page.waitForFunction(()=>document.querySelector('#reference-video').paused);await page.locator('#video-sol').evaluate(v=>v.pause());
 assert((await page.locator('#cross-software').textContent()).includes('同一 Windows'));assert((await page.locator('#sound-sources').textContent()).includes('不提供固定音效库'));checks.push('two official audio references, exclusive playback and software/source disclosures');
 await page.selectOption('#rubric-filter','C');assert.equal(await page.locator('.criterion').count(),10);await page.selectOption('#rubric-filter','T');assert.equal(await page.locator('.criterion').count(),5);await page.selectOption('#rubric-filter','all');
 await page.locator('.criterion[data-id="C08"] summary').click();const button=page.locator('.criterion[data-id="C08"] button[data-slug="sol"][data-stage="v2"]').first();const seek=Number(await button.getAttribute('data-time'));await button.click();await page.waitForFunction(t=>Math.abs(document.querySelector('#video-sol').currentTime-t)<.25,seek);await page.locator('#video-sol').evaluate(v=>v.pause());checks.push('rubric filtering, evidence and correct model/version seeking');
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForSelector('.criterion');await page.screenshot({path:path.join(out,'desktop-top.png')});await page.locator('#results').screenshot({path:path.join(out,'desktop-results.png')});
 await page.locator('.criterion[data-id="T02"] summary').click();await page.locator('.criterion[data-id="T02"]').screenshot({path:path.join(out,'desktop-rubric.png')});
 await page.goto(base+'traces.html?model=sol',{waitUntil:'domcontentloaded'});await page.waitForSelector('.trace-event');assert.equal(await page.locator('.trace-event').count(),95);await page.selectOption('#trace-action','frames');assert.equal(await page.locator('.trace-event').count(),13);await page.locator('.trace-event summary').first().click();await page.waitForFunction(()=>[...document.querySelectorAll('.trace-event[open] img')].some(i=>i.complete&&i.naturalWidth>0));await page.screenshot({path:path.join(out,'desktop-traces.png')});
 await page.selectOption('#trace-model','luna');await page.waitForFunction(()=>document.querySelectorAll('.trace-event').length===45);await page.selectOption('#trace-model','deepseek');await page.waitForFunction(()=>document.querySelectorAll('.trace-event').length===300);await page.locator('#trace-search').fill('__no_match__');assert.equal(await page.locator('.trace-event').count(),0);await page.locator('#trace-search').fill('');checks.push('all440trace events, filters and observed images');
 await page.goto(base+'review.html',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.rubric').count(),24);const auto=Number(await page.locator('#humanTotal').textContent());await page.locator('.rubric summary').first().click();await page.locator('input[data-score="P01"]').fill('0');const changed=Number(await page.locator('#humanTotal').textContent());assert(Math.abs((auto-changed)-2.67)<.02);await page.reload();assert.equal(await page.locator('input[data-score="P01"]').inputValue(),'0');await page.evaluate(()=>localStorage.clear());checks.push('manual score recalculation and local persistence');
 await page.setViewportSize({width:390,height:844});await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForSelector('.criterion');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'mobile-top.png')});await page.locator('#result-sol').screenshot({path:path.join(out,'mobile-sol.png')});
 await page.goto(base+'traces.html?model=luna',{waitUntil:'domcontentloaded'});await page.waitForSelector('.trace-event');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push('390px main and trajectory layouts without page overflow');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 const report={passed:true,checks,browser_errors:errors,bad_responses:bad};await fsp.writeFile(path.join(root,'docs/charge-foley/files/browser-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await context.close();await browser.close();await new Promise(r=>server.close(r))}
