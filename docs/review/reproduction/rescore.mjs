import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {evaluate} from './case1_review_v2/pipeline/evaluate.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const report=JSON.parse(await fs.readFile(path.join(root,'data/report.json'),'utf8'));
for(const m of report.models){const state=JSON.parse(await fs.readFile(path.join(root,'data',m.id,'final-state.json'),'utf8'));const result=await evaluate(state);assert.equal(result.score,m.score);console.log(JSON.stringify({model:m.label,score:result.score,success:result.success,source:m.provenance}));}
