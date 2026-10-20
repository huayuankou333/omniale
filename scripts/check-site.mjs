import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../docs/review');
const read=async p=>fs.readFile(path.join(root,p),'utf8');
const report=JSON.parse(await read('data/report.json'));
const ctx={window:{}};vm.runInNewContext(await read('data/report.js'),ctx);assert.equal(JSON.stringify(ctx.window.REPORT),JSON.stringify(report));
assert.equal(report.models.length,4);
for(const m of report.models){
 const traceText=await read(`data/${m.id}/agent_trace.json`),trace=JSON.parse(traceText),evaluation=JSON.parse(await read(`data/${m.id}/evaluation.json`));
 assert.equal(crypto.createHash('sha256').update(traceText).digest('hex'),m.raw_trace_sha256);
 assert.equal(evaluation.score,m.score);assert.equal(trace.turns.length,m.turns);assert.equal(m.decisions.length,20);
 assert.equal(Math.round((m.decision_score+m.preserve_score+m.extra_score)*100)/100,m.score);
 const c={window:{}};vm.runInNewContext(await read(`data/${m.id}.js`),c);const display=c.window.TRACES[m.id];
 assert.equal(display.turns.length,m.turns);
 for(const turn of display.turns)for(const call of turn.calls||[])for(const image of call.result?._images||(call.result?._image?[call.result._image]:[]))await fs.access(path.join(root,image));
}
let textFiles=0,totalFiles=0;for(const f of await fs.readdir(root,{recursive:true})){
 const p=path.join(root,f),stat=await fs.stat(p);if(!stat.isFile())continue;totalFiles++;
 assert(stat.size<100*1024*1024,`File exceeds GitHub individual size limit: ${f}`);
 if(!/\.(html|css|js|mjs|json|md|txt|ps1|py)$/.test(f))continue;textFiles++;const s=await read(f);
 assert(!/\b(?:github_pat_[a-zA-Z0-9_]{20,}|ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9_-]{20,})/.test(s),`Credential-like content in ${f}`);
 if(f.endsWith('.html'))for(const match of s.matchAll(/(?:href|src)="([^"]+)"/g)){
   const u=match[1];if(/^(?:https?:|data:|#)/.test(u))continue;
   const local=decodeURIComponent(u.split(/[?#]/)[0]);if(!local)continue;await fs.access(path.resolve(path.dirname(p),local));
 }
}
console.log(JSON.stringify({pass:true,models:4,totalFiles,textFiles,checks:['JSON/JS consistency','Scores and raw-trace hashes','All trace image files','HTML local links','No credential patterns','File size limits']},null,2));
