# Case1 v2 难度校准报告

## 本轮结果

- 模型：gpt-6.1-sol；代理返回：gpt-6.1-sol；推理设置 medium；协议 openai。
- 得分：**100/100**；有效模型试评：true；终止状态：finished。
- 完整决策正确：20/20。模型调用 7 轮，上限 40。
- 不操作基线：26.4；参考解：100。
- 旧版成绩：98.4/100；任务已改变，这不是同一试题的模型能力涨跌。
- 本次仍未低于 80；不能宣称达到了目标难度。
- 路线仍为通用模型＋ASR＋图像＋信号工具，不是原生 Omni。

## 泄漏检查

- 运行前审计通过：true；负向路径测试 9 项。
- 运行中初始文本、工具定义、工具返回的私有评分标记命中：0。
- 输入、真值、评分器哈希在运行后仍一致：true。
- 没有把生成旁白脚本、镜头位置表、故障标签、答案工单或逐项权重传给模型。
- 公共 SOP、字段枚举、角色权限属于完成真实业务必需的要求，不应当作泄题删除。
- 不声称形式化证明零泄漏；隔离边界是受控工具接口，不是任意代码执行沙箱。

## 增难内容

20 项最终决策、13 个源版本、27 段会议。参考版镜头必须匹配到重排/重定时的交付版；
双播放器 ON AIR 与键盘焦点不同；技术问题留在试听版本，不随画面类意见迁移；
助手的未获授权提议与制片人最终决定混合出现；音频包含人声中断、声画延迟、声道交换。

保持旧版 80/10/10 评分比例及五字段等分；区间容差反而放宽到 0.3s。
没有关闭测量工具或减少模型预算：新增源片 contact sheet、分声道频带测量、源片 ASR，
本轮实际轮数上限为 40；修复旧环境配置覆盖后，新版默认 40。
通过任务复杂性而非收紧验收制造区分度。

## 逐项记录

| 项 | 期望素材/版本/类型 | 期望区间 s | 期望负责人/状态/优先级 | 模型结果 | 分数 |
|---|---|---|---|---|---|
| 1 | H17/v3/subtitle | 9–14 | editorial/open/p2 | H17/v3/subtitle, 9–14, editorial/open/p2 | 4.0 / 4 |
| 2 | H17/v3/crop | 24–32 | editorial/open/p2 | H17/v3/crop, 24–32, editorial/open/p2 | 4.0 / 4 |
| 3 | M42/v3/subtitle | 24–32 | editorial/open/p2 | M42/v3/subtitle, 24–32, editorial/open/p2 | 4.0 / 4 |
| 4 | M42/v3/crop | 2–9 | editorial/blocked/p2 | M42/v3/crop, 2–9, editorial/blocked/p2 | 4.0 / 4 |
| 5 | C63/v3/subtitle | 20–24 | editorial/open/p2 | C63/v3/subtitle, 20–24, editorial/open/p2 | 4.0 / 4 |
| 6 | C63/v3/crop | 9–14 | editorial/open/p2 | C63/v3/crop, 9–14, editorial/open/p2 | 4.0 / 4 |
| 7 | G28/v3/subtitle | 2–9 | editorial/open/p2 | G28/v3/subtitle, 2–9, editorial/open/p2 | 4.0 / 4 |
| 8 | G28/v3/crop | 24–32 | editorial/blocked/p2 | G28/v3/crop, 24–32, editorial/blocked/p2 | 4.0 / 4 |
| 9 | H17/v3/endcard | 20–24 | production/blocked/p2 | H17/v3/endcard, 20–24, production/blocked/p2 | 4.0 / 4 |
| 10 | M42/v3/endcard | 9–14 | design/open/p1 | M42/v3/endcard, 9–14, design/open/p1 | 4.0 / 4 |
| 11 | C63/v3/endcard | 24–32 | production/blocked/p2 | C63/v3/endcard, 24–32, production/blocked/p2 | 4.0 / 4 |
| 12 | G28/v3/endcard | 14–20 | design/open/p2 | G28/v3/endcard, 14–20, design/open/p2 | 4.0 / 4 |
| 13 | H17/v2/channel_swap | 7–14 | audio/open/p1 | H17/v2/channel_swap, 7–14, audio/open/p1 | 4.0 / 4 |
| 14 | H17/v3/av_sync | 14–20 | audio/blocked/p1 | H17/v3/av_sync, 14–20, audio/blocked/p1 | 4.0 / 4 |
| 15 | M42/v2/av_sync | 14–18 | audio/open/p1 | M42/v2/av_sync, 14–18, audio/open/p1 | 4.0 / 4 |
| 16 | M42/v3/audio_gap | 20–24 | audio/open/p1 | M42/v3/audio_gap, 20–24, audio/open/p1 | 4.0 / 4 |
| 17 | C63/v2/audio_gap | 18–26 | audio/open/p1 | C63/v2/audio_gap, 18–26, audio/open/p1 | 4.0 / 4 |
| 18 | C63/v3/channel_swap | 32–38 | audio/open/p1 | C63/v3/channel_swap, 32–38, audio/open/p1 | 4.0 / 4 |
| 19 | M42/v2/audio_gap | 14–18 | audio/dismissed/p2 | M42/v2/audio_gap, 14–18, audio/dismissed/p2 | 4.0 / 4 |
| 20 | G28/v3/logo | 9–14 | production/resolved/p1 | G28/v3/logo, 9–14, production/resolved/p1 | 4.0 / 4 |

- preserve_unrequested_records：10.00/10
- no_extra_or_deleted_records：10.00/10

错误字段计数：`{}`。
未匹配到正确身份的新增工单，各字段均无分；因此这些计数不能独立解释为五种推理错误。
应结合原始 state_diff 和工具轨迹分析根因。

## 执行与验收

工具次数：`{"get_state":1,"contact_sheet":7,"measure_audio":6,"transcribe_source":2,"apply_changes":1,"public_check":1,"finish":1}`。
工具错误 0 次：无。
参考解 100；107 项评分突变测试通过；事务检查通过。
详细素材 QA 与浏览器报告保存在 private 下。

本报告只对应 `full` 这一条运行；其他消融须查看各自独立记录，不能把接口隔离或不操作基线当作模态必要性的实验证明。
素材仍是程序图形和合成语音。后续应以独立制作、专业复核的保留集测试，而不是不断对本模型调题后宣称泛化。

## 文件

- 运行目录：`D:\omniale\runs\case1_review_v2-gpt-6.1-sol-full-2026-10-20T07-29-55-847Z`
- 实际模型初始输入：model_input_audit.json
- 全部工具轨迹：agent_trace.json
- 逐项评分：evaluation.json
- 最终数据库：workspace/state.json
- 差异：state_diff.json
- 冻结配置：manifest.json；运行后审计：postrun_audit.json
