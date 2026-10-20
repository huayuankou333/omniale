import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../docs/review');
const read=async p=>fs.readFile(path.join(root,p),'utf8'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const report=JSON.parse(await read('data/report.json')),ctx={window:{}};vm.runInNewContext(await read('data/report.js'),ctx);
assert.equal(JSON.stringify(ctx.window.REPORT),JSON.stringify(report));assert.equal(report.models.length,4);assert.equal(report.truth.targets.length,39);assert.equal(report.truth.releases.length,8);assert.equal(report.protocol.limits.model_turns,15);
for(const m of report.models){
 const traceText=await read(`${m.path}/agent_trace.json`),trace=JSON.parse(traceText),e=JSON.parse(await read(`${m.path}/evaluation.json`)),manifest=JSON.parse(await read(`${m.path}/manifest.json`));
 assert.equal(sha(traceText),m.raw_trace_sha256);assert.equal(e.score,m.score);assert.equal(e.valid_model_trial,m.valid);assert.equal(trace.turns.length,m.turns);
 assert.equal(e.target_count,39);assert.equal(m.complete_releases,e.complete_releases);assert.equal(m.initial_input_sha256,manifest.initial_input_sha256);
 assert(trace.turns.every(t=>t.request_image_count===0));assert(trace.turns.length<=15);
 assert.equal(Math.round(e.checks.reduce((s,c)=>s+c.weight,0)*100)/100,100);
 if(m.valid)assert.equal(Math.round(e.checks.reduce((s,c)=>s+c.weight*(c.credit??Number(c.ok)),0)*100)/100,m.score);else assert.equal(m.score,null);
 const audit=JSON.parse(await read(`${m.path}/model_input_audit.json`));assert.equal(audit.candidate_raw_image_count,0);assert(audit.tools.some(t=>t.name==='update_releases'));assert(!JSON.stringify(audit.text_blocks).includes('required_keys'));
 for(const event of trace.perception_events||[]){const r=JSON.parse(await read(`files/shared-cache/${event.evidence_id}.json`));assert.equal(r.payload_sha256,event.payload_sha256);}
}
assert.equal(report.all_below_80,report.comparable&&report.models.every(m=>m.valid&&m.score<80));
for(const a of report.attempts){const e=JSON.parse(await read(`${a.path}/evaluation.json`));assert.equal(e.score,a.score);}
let textFiles=0,totalFiles=0;
for(const f of await fs.readdir(root,{recursive:true})){
 const p=path.join(root,f),stat=await fs.stat(p);if(!stat.isFile())continue;totalFiles++;
 assert(stat.size<100*1024*1024,`File too large: ${f}`);
 if(!/\.(html|css|js|mjs|json|md|txt|ps1|py)$/.test(f))continue;textFiles++;const s=await read(f);
 assert(!/\b(?:github_pat_[a-zA-Z0-9_]{20,}|ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9_-]{20,})/.test(s),`Credential-like content: ${f}`);
 if(f.endsWith('.html'))for(const match of s.matchAll(/(?:href|src)="([^"]+)"/g)){
  const u=match[1];if(/^(?:https?:|data:|#)/.test(u))continue;
  const local=decodeURIComponent(u.split(/[?#]/)[0]);if(local)await fs.access(path.resolve(path.dirname(p),local));
 }
}
const result={pass:true,models:4,totalFiles,textFiles,checks:['four-model JSON/JS consistency','score recomputation and trace hashes','15turn limit and zero raw images','frozen protocol comparison','shared evidence cache hashes','private answer isolation','all HTML local links','no credential patterns','GitHub individual file limits']};
await fs.writeFile(path.join(root,'files/site-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
