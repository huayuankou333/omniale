# OmniALE Review Desk v4：15轮共同感知评测

本次未取得四模型全部有效且可比的结果，因此不能声称“四模型均低于80分”。有效成绩和接口故障分开展示。

新版加入时间对齐、工单依赖和发布联动。会议为17分03.3秒，21个源版本，39项工单目标，8个渠道发布计划。候选模型均通过相同视觉、ASR和PCM工具取证。

| 模型 | 总分 | 工单 /60 | 关系 /15 | 发布 /15 | 保留 /10 | 完整工单 | 完整发布 | 轮数 | 状态 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| GPT-6-Luna | 59.88 | 40.92 | 12.55 | 1.41 | 5.00 | 15/39 | 0/8 | 15 | turn_limit |
| GLM-5.3 | N/A | — | — | — | — | 0/39 | 0/8 | 5 | infrastructure_error |
| Kimi-K3 | 100.00 | 60.00 | 15.00 | 15.00 | 10.00 | 39/39 | 8/8 | 9 | finished |
| GPT-6.1-Sol | N/A | — | — | — | — | 0/39 | 0/8 | 1 | infrastructure_error |

## 设计变化

1. 原有画面意见经旧交付版映射到v5，处理镜头拆分、插入、速度变化及局部区间；技术诊断仍归实际试听版本。
2. 系统支持直接依赖、split_from/superseded_by、duplicate_of，保留撤销或合并记录与历史备注；所有引用需存在，事务原子执行。
3. 发布计划维护直接需求、版本、状态和所有传递阻塞ID。任务获准执行不代表完成；工单状态与依赖关系分别维护。

## 评测规则

主模型15个逻辑轮（同轮网络重试另计），单轮9,000输出tokens，总135,000；工具120次、视觉1,024帧、ASR1,800秒、PCM900秒。初始证据和缓存命中均计入相应逻辑预算。主模型high；共同视觉gpt-6.1-sol/low，Whisper base.en/CPU int8。

评前冻结时间：2026-10-20T13:06:24.581419+00:00。评分和输入哈希复核一致。评分60/15/15/10；初始状态21.99分，标准答案经5次业务事务回放100分。原有工单80/10/10权重的辅助分单独披露，不当作旧版实测。

每模型选择首个有效trial，基础设施失败最多两次从初始状态重测。原定一次；GLM第二次在共同视觉服务中断后，于第三次开始前记录了重试规则调整。第三次因执行端并发触发网关限制，单独作废并在其他请求结束后串行替换一次；所有记录均保留。流式传输只用于恢复长响应连接，差异记录在每次manifest和网页尝试表；没有更改任务、工具、推理或逻辑预算。

## GPT-6-Luna

**分辨了部分业务规则，但时间迁移和事务顺序仍出错**：轨迹中第2轮和第4轮重复读取编辑表，第7轮把尚不存在的“TBD”写入duplicate_of，第10轮又因拆分关联不存在而整批失败。后续虽继续修正并落库，15轮结束前未调用update_releases。模型只对Harbor旧交付版额外请求了一次联系表；其余多个对象的v5范围错误说明，读到编辑表并不等于完成了镜头匹配和映射。

- 第5轮 contact_sheet: H17/v3 0–60s，每2秒采样
- 第7轮 R214 duplicate_of=TBD，Unknown/self ticket reference
- 第10轮 R213 引用校验失败
- 第15轮仍在apply_changes；发布计划0/8完整通过

**遗漏或身份不匹配的工单**：7 项目标未匹配到所需身份的工单。身份不匹配时，不再把另外四个字段的失分独立解释为四种能力错误。

- decision_3.identity: H17/v5/crop
- decision_12.identity: C63/v5/subtitle
- decision_21.identity: H17/v5/endcard
- decision_24.identity: G28/v5/endcard
- decision_27.identity: H17/v2/channel_swap
- decision_30.identity: M42/v4/audio_gap

**时间区间对齐未完成**：17 项已匹配工单的起止时间超出 ±0.3 秒容差。任务要求保留旧镜头语义，按每个编辑事件处理拆分和变速；下列为实际终态证据。

- decision_4.source_range: N316 实际 9–13s；应为 17–21s
- decision_6.source_range: N314 实际 11–16s；应为 24.5–29.5s
- decision_7.source_range: N311 实际 35.5–40.5s；应为 2–6s
- decision_8.source_range: N317 实际 6–8s；应为 26–30s
- decision_9.source_range: N304 实际 8–14s；应为 41–45s
- decision_11.source_range: N315 实际 35.5–38.5s；应为 8–11s

**授权范围、责任人或状态落地错误**：已匹配记录中还有 9 个负责人、状态或优先级字段错误。相关字段需按领域权限和具体范围解释，不能把许可当作完成。

- decision_8.priority: N317 实际 p2，应为 p1
- decision_13.status: N303 实际 blocked，应为 open
- decision_15.priority: N313 实际 p2，应为 p1
- decision_16.status: N326 实际 blocked，应为 open
- decision_16.priority: N326 实际 p2，应为 p1

**依赖与发布联动**：工单关系完整通过 24/39 组，发布计划完整通过 0/8 个。轨迹中没有成功的发布计划事务。

- links.empty.T02.0
- links.empty.T04.0
- links.empty.T08.0
- links.T09.0
- links.empty.T10.1

**可观察的执行错误**：2 次工具返回错误。原子事务被拒绝时整批不会写入；若后续没有正确重试，终态会保留旧值。

- 第7轮 apply_changes: Unknown/self ticket reference from R214
- 第10轮 apply_changes: Unknown/self ticket reference from R213

**15轮预算下的执行结果**：实际取得 15 轮响应、调用工具 18 次，结束状态为 turn_limit。预算用尽时仍有上述未完成项；这是本次受限设置下的结果，不是能力上界。

- 输出tokens=6034，视觉帧=133，PCM秒数=23

## GLM-5.3

**基础设施故障，不能计作低分**：本次在 5 轮成功响应后结束，状态为 infrastructure_error。保留终态和诊断分，但不将其作为模型成绩。

- fetch failed

## Kimi-K3

**依赖与发布联动**：工单关系完整通过 39/39 组，发布计划完整通过 8/8 个。成功写入发布计划发生在第 7 轮。

- 发布调用第7轮：成功

**15轮预算下的执行结果**：实际取得 9 轮响应、调用工具 38 次，结束状态为 finished。是否完整交付由数据库验收决定，模型自述完成不能替代验收。

- 输出tokens=39999，视觉帧=319，PCM秒数=44

## GPT-6.1-Sol

**基础设施故障，不能计作低分**：本次在 1 轮成功响应后结束，状态为 infrastructure_error。保留终态和诊断分，但不将其作为模型成绩。

- Stream error: {"type":"service_unavailable_error","param":null,"code":"server_error","message":"Our servers are currently overloaded. Please try again later."}

## 交付与限制

案例代码在D:/omniale/case1_review_v4；原始尝试路径见case1-v4-run-locations.json。代码包、结果JSON和验证JSON与本报告一起交付。

线上展示：https://huayuankou333.github.io/omniale/review/；旧版归档：https://huayuankou333.github.io/omniale/review-v2/。

此结果是一个合成开发case的单次校准，不是原生Omni能力比较。共同观察工具也可能出错，且采用候选模型之一；不能推断稳定排名、泛化能力或后续必然低于80分。正式基准仍需独立人工标注复核和重复测量。
