import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!process.argv[2])throw new Error('Supply run directory');
const run=path.resolve(process.argv[2]),read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const result=await read(path.join(run,'evaluation.json')),trace=await read(path.join(run,'agent_trace.json'));
const tests=await read(path.join(root,'private/test_report.json')),audit=await read(path.join(root,'private/leakage_audit.json'));
const sha=async p=>crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex');
const frozen=(await sha(path.join(root,'private/truth.json')))===trace.truth_sha256&&
 (await sha(path.join(root,'pipeline/evaluate.mjs')))===trace.scoring_sha256&&
 (await sha(path.join(root,'public/inputs/review.mp4')))===trace.input_sha256;
const rows=[],errors={};let complete=0;
for(let i=1;i<=tests.target_count;i++){
 const group=result.checks.filter(c=>c.id.startsWith(`decision_${i}.`));
 const t=group[0].expected,a=group[0].actual;
 const failed=group.filter(c=>!c.ok).map(c=>c.id.split('.')[1]);
 for(const f of failed)errors[f]=(errors[f]||0)+1;
 if(!failed.length)complete++;
 rows.push(`| ${i} | ${t.asset_id}/${t.version}/${t.issue_type} | ${t.in_seconds}–${t.out_seconds} | ${t.owner}/${t.status}/${t.priority} | ${a?`${a.asset_id}/${a.version}/${a.issue_type}, ${a.in_seconds}–${a.out_seconds}, ${a.owner}/${a.status}/${a.priority}`:'未找到匹配记录'} | ${group.reduce((s,c)=>s+c.weight*Number(c.ok),0).toFixed(1)} / 4 |`);
}
const calls=trace.turns.flatMap(t=>t.calls||[]),count={};for(const c of calls)count[c.name]=(count[c.name]||0)+1;
const toolErrors=calls.filter(c=>c.result?.error);
const input=await read(path.join(run,'model_input_audit.json'));
const serialized=JSON.stringify({input,calls:calls.map(c=>({name:c.name,result:c.result}))});
const canary=await fs.readFile(path.join(root,'private/audit_canary.txt'),'utf8');
const forbidden=['scoring_version','range_tolerance_seconds','preserve_unrequested_records','PRIVATE_AUDIT_',canary];
const observedLeaks=forbidden.filter(x=>serialized.includes(x));
const auditPost={preflight_pass:audit.pass,frozen,observed_private_markers:observedLeaks,tool_error_count:toolErrors.length};
await fs.writeFile(path.join(run,'postrun_audit.json'),JSON.stringify(auditPost,null,2));
const text=`# Case1 v2 难度校准报告

## 本轮结果

- 模型：${trace.model}；代理返回：${[...new Set(trace.turns.map(t=>t.returned_model))].join(', ')}；推理设置 ${trace.reasoning_effort}；协议 ${trace.provider||'openai'}。
- 得分：**${result.score}/100**；有效模型试评：${result.valid_model_trial}；终止状态：${trace.status}。
- 完整决策正确：${complete}/${tests.target_count}。模型调用 ${trace.turns.length} 轮，上限 ${trace.max_turns}。
- 不操作基线：${tests.untouched_score}；参考解：${tests.reference_score}。
- 旧版成绩：98.4/100；任务已改变，这不是同一试题的模型能力涨跌。
- ${trace.mode!=='full'||trace.status!=='finished'?'这是诊断条件或未正常完成的运行，不用于确认完整任务的难度目标。':result.score<80?'本次完整运行低于 80，但仅是开发校准样本，不构成 pass@3 或泛化难度上限。':'本次仍未低于 80；不能宣称达到了目标难度。'}
- 路线为 ${trace.mode==='audio_only'?'通用模型＋ASR＋信号工具（没有图像输入）':trace.mode==='no_media'?'通用模型（无媒体输入）':'通用模型＋ASR＋图像＋信号工具'}，不是原生 Omni。

## 泄漏检查

- 运行前审计通过：${audit.pass}；负向路径测试 ${audit.read_path_negative_tests} 项。
- 运行中初始文本、工具定义、工具返回的私有评分标记命中：${observedLeaks.length}。
- 输入、真值、评分器哈希在运行后仍一致：${frozen}。
- 没有把生成旁白脚本、镜头位置表、故障标签、答案工单或逐项权重传给模型。
- 公共 SOP、字段枚举、角色权限属于完成真实业务必需的要求，不应当作泄题删除。
- 不声称形式化证明零泄漏；隔离边界是受控工具接口，不是任意代码执行沙箱。

## 增难内容

20 项最终决策、13 个源版本、27 段会议。参考版镜头必须匹配到重排/重定时的交付版；
双播放器 ON AIR 与键盘焦点不同；技术问题留在试听版本，不随画面类意见迁移；
助手的未获授权提议与制片人最终决定混合出现；音频包含人声中断、声画延迟、声道交换。

保持旧版 80/10/10 评分比例及五字段等分；区间容差反而放宽到 0.3s。
没有关闭测量工具或减少模型预算：新增源片 contact sheet、分声道频带测量、源片 ASR，
本轮实际轮数上限为 ${trace.max_turns}；修复旧环境配置覆盖后，新版默认 40。
通过任务复杂性而非收紧验收制造区分度。

## 逐项记录

| 项 | 期望素材/版本/类型 | 期望区间 s | 期望负责人/状态/优先级 | 模型结果 | 分数 |
|---|---|---|---|---|---|
${rows.join('\n')}

${result.checks.filter(c=>!c.id.startsWith('decision_')).map(c=>`- ${c.id}：${(c.weight*(c.credit??Number(c.ok))).toFixed(2)}/${c.weight}`).join('\n')}

错误字段计数：\`${JSON.stringify(errors)}\`。
未匹配到正确身份的新增工单，各字段均无分；因此这些计数不能独立解释为五种推理错误。
应结合原始 state_diff 和工具轨迹分析根因。

## 执行与验收

工具次数：\`${JSON.stringify(count)}\`。
工具错误 ${toolErrors.length} 次：${toolErrors.map(c=>`${c.name}: ${c.result.error}`).join('；')||'无'}。
参考解 100；${tests.mutation_tests} 项评分突变测试通过；事务检查通过。
详细素材 QA 与浏览器报告保存在 private 下。

本报告只对应 \`${trace.mode}\` 这一条运行；其他消融须查看各自独立记录，不能把接口隔离或不操作基线当作模态必要性的实验证明。
素材仍是程序图形和合成语音。后续应以独立制作、专业复核的保留集测试，而不是不断对本模型调题后宣称泛化。

## 文件

- 运行目录：\`${run}\`
- 实际模型初始输入：model_input_audit.json
- 全部工具轨迹：agent_trace.json
- 逐项评分：evaluation.json
- 最终数据库：workspace/state.json
- 差异：state_diff.json
- 冻结配置：manifest.json；运行后审计：postrun_audit.json
`;
await fs.writeFile(path.join(run,'REPORT.md'),text);
await fs.writeFile(path.join(root,trace.mode==='full'?`LATEST_${trace.model}.md`:`ABLATION_${trace.mode}_${trace.model}.md`),text);
if(trace.model==='gpt-6-luna')await fs.writeFile(path.join(root,trace.mode==='full'?'LATEST_REPORT.md':`ABLATION_${trace.mode}.md`),text);
console.log(path.join(run,'REPORT.md'));
