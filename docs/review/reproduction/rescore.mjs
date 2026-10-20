import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {evaluate,referenceState} from './pipeline/evaluate.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const report=await read('data/report.json');
assert.equal((await evaluate(await referenceState())).score,100);
const results=[];
for(const a of report.attempts){
 const original=await read(`${a.path}/evaluation.json`),state=await read(`${a.path}/state.json`),rescored=await evaluate(state);
 assert.equal(rescored.score,a.valid?original.score:original.diagnostic_partial_state_score);
 assert.deepEqual(rescored.section_scores,original.section_scores);
 results.push({model:a.model,path:a.path,valid:a.valid,official_score:a.valid?rescored.score:null});
}
console.log(JSON.stringify({pass:true,reference_score:100,attempts:results,note:'Infrastructure-error state diagnostics remain excluded from model scores.'},null,2));
