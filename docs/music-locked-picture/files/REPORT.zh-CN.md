# 动作喜剧配乐v3：Qwen3.8辅助评测与原声对照

2026年11月18日。使用qwen3.8-omni-flash，服务器Docker全长显式音频＋同步4fps无声视频；两模型各长版、短版、联合评价，共6请求。模型成片、题目、评分权重和门槛均未改变。

| 模型 | Qwen内容分 | 辅助总分 | 正式专家分 |
|---|---:|---:|---|
| sol | 57.3/90 | 67.1/100 | 空 |
| deepseek | 28.8/78已评子项；另12分未评 | 未形成完整总分 | 空 |

## 这些数字的范围

Qwen3.8此前未通过已知静音区间定位校验。本次按用户明确要求另立计划使用它作为未校准辅助judge，不宣称通过校验，不视为人类专家结论。此前失败证据不覆盖；不重抽作品回答直到分数满意。模型名、原片声音、期望分数和制作说明均未提供给judge。

评审存在内部矛盾：两模型的单短版判词描述配乐错位、突跳，联合判词却描述与长版复用且节奏适合。Sol长版多个系数接近1，短版多数接近0.1。保留这些原始系数，不人为压低或抬高；这些分数不能可靠证明实际专业质量。

DeepSeek长版只返回13组动作评价，而冻结表有14组，索引无法完整校验。12分动作响应项不计分、不计零，也不按其余13组外推；仅展示其余78分内容子项的小计28.8。缺项原始回答和失败原因公开。

## 计算

内容90＝叙事35＋音乐剪辑40＋短版15。另可闻瑕疵4＋客观混音6，组成辅助总分100。一般项按长60%/短40%；动作组内等权平均后按60/40；共同身份5与短版独立结构10联合打分。门槛通过不加内容分。仅最终显示四舍五入至1位，计算原值保留。

### sol

| 子项 | 原值 |
|---|---:|
| narrative_arc | 8.04 |
| event_relationship | 8.314285714285713 |
| emotional_control | 7.04 |
| structure_phrasing | 7.559999999999999 |
| edit_transparency | 7.08 |
| material_coherence | 6.4 |
| musical_ending | 4.08 |
| shared_identity | 3.75 |
| short_reconstruction | 5.0 |
| artifact_freedom | 3.84 |

客观混音：6.0/6。完整系数、各版本证据与API原文见qwen38-auxiliary/sol-auxiliary-score.json及其链接文件。

### deepseek

| 子项 | 原值 |
|---|---:|
| narrative_arc | 3.0 |
| event_relationship | 缺项未评 |
| emotional_control | 2.75 |
| structure_phrasing | 3.0 |
| edit_transparency | 3.0 |
| material_coherence | 2.5 |
| musical_ending | 3.3 |
| shared_identity | 3.75 |
| short_reconstruction | 7.5 |
| artifact_freedom | 4.0 |

客观混音：6.0/6。完整系数、各版本证据与API原文见qwen38-auxiliary/deepseek-auxiliary-score.json及其链接文件。

## 原片声音对照

网页增加与两版锁画同起止点的原片音轨，含原配乐、音效和角色声音，仅供人工对照；未用于参试输入或此次评审。原电影音乐Torin Borrowdale、声音设计Sander Houtman，依据原片片尾核验；CC BY4.0。音频同采样位置相关性和预览帧数检查通过。

## 既有客观核验

两模型工程、来源、锁画与预算门槛均通过，客观混音均6/6。DeepSeek按交付说明执行REAPER导出与master.sh完整流程可以复现。既有详细客观报告见REPORT-before-qwen38.zh-CN.md，既有失败judge校验见judge-evidence/。所有原始交付未修改。
