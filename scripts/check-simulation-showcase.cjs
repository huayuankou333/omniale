const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'../docs');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.mp4':'video/mp4','.md':'text/plain; charset=utf-8','.zip':'application/zip'};
const server=http.createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const target=path.resolve(root,'.'+p);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return}const content=await fs.readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'}).end(content)}catch{res.writeHead(404).end('Not found')}});
(async()=>{
 await fs.mkdir('artifacts/simulationle',{recursive:true});
 await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 const errors=[],checks=[];
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 const page=await context.newPage();
 page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 for(const key of ['index','robotic','building','circuit','cfd','structure']){
  await page.goto(`http://127.0.0.1:8765/simulation/${key}.html`,{waitUntil:'networkidle'});
  await page.waitForSelector(key==='index'?'.case-card':'#model-results .attempt');
  checks.push({page:key,title:await page.title(),h1:await page.locator('h1').innerText(),charts:await page.locator('.chart').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  if(key==='index')await page.screenshot({path:'artifacts/simulationle/simulationle-desktop.png',fullPage:true});
  if(key!=='index'){
   const buttons=await page.locator('[data-model]').all();
   for(let i=0;i<buttons.length;i++){
    await buttons[i].click();
    await page.selectOption('#seed-select',{index:19});
    const status=await page.locator('#seed-status').innerText();
    if(!status.includes('PASS'))throw Error(key+' seed switch failed');
    await page.locator('#execution details').first().locator('summary').click();
    if(await page.locator('#execution details[open]').count()<1)throw Error('details failed');
   }
   if(key==='robotic'){
    await page.locator('#frame-slider').focus();
    await page.keyboard.press('Home');
    if(!(await page.locator('#frame-state').innerText()).includes('initial'))throw Error('robot frame slider failed');
    await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
    checks.push({video:await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}))});
   }
   if(key==='building'||key==='cfd'){
    await page.locator('#trajectory').scrollIntoViewIfNeeded();
    await page.screenshot({path:`artifacts/simulationle/simulationle-${key}-detail.png`});
   }
  }
 }
 await page.setViewportSize({width:390,height:844});
 for(const key of ['index','robotic','building','circuit','cfd','structure']){
  await page.goto(`http://127.0.0.1:8765/simulation/${key}.html`,{waitUntil:'networkidle'});
  await page.waitForSelector(key==='index'?'.case-card':'#model-results .attempt');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  checks.push({mobile:key,overflow});
  if(overflow)errors.push('Mobile horizontal overflow: '+key);
  if(key==='index')await page.screenshot({path:'artifacts/simulationle/simulationle-mobile.png',fullPage:true});
 }
 await fs.writeFile('artifacts/simulationle/browser-verification.json',JSON.stringify({checks,errors},null,2));
 console.log(JSON.stringify({checks,errors},null,2));
 await browser.close();server.close();if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exit(1)});

