# Case1 v4：15轮共同感知评测

模型 glm-5.3；状态 infrastructure_error；输入 full；感知路线 shared_tools。

分数 N/A/100；分项 {"tickets":6.46,"links":4.12,"releases":1.41,"integrity":10}；发布计划 0/8；旧工单权重辅助分 28.62（不可当作旧版实测）；完整决策 0/39；4 轮、7 次工具调用、1 次工具错误。

本条不是有效的任务评测，不用于判定严格低于80分目标。

冻结文件校验：true。这是合成开发样本、工具辅助感知；不是原生 Omni 或稳定上限结论。未对分数设上限。

| 项 | 对象 | 期望区间 | 期望业务字段 | 实际 | 失败字段 |
|---|---|---|---|---|---|
| 1 | H17/v5/subtitle | 7–9 | editorial/open/p1 | R209: 7–11, editorial/resolved/p2 | identity, source_range, status, priority |
| 2 | H17/v5/subtitle | 15–16.6 | editorial/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 3 | H17/v5/crop | 26.6–32.8 | editorial/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 4 | M42/v5/subtitle | 17–21 | editorial/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 5 | M42/v5/crop | 36.8–41.8 | editorial/blocked/p2 | 缺失 | identity, source_range, owner, status, priority |
| 6 | C63/v5/subtitle | 24.5–29.5 | editorial/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 7 | C63/v5/crop | 2–6 | editorial/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 8 | G28/v5/subtitle | 26–30 | editorial/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 9 | G28/v5/crop | 41–45 | editorial/blocked/p2 | 缺失 | identity, source_range, owner, status, priority |
| 10 | H17/v5/subtitle | 42.8–47.8 | editorial/blocked/p2 | 缺失 | identity, source_range, owner, status, priority |
| 11 | C63/v5/subtitle | 8–11 | editorial/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 12 | C63/v5/subtitle | 16–17.5 | editorial/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 13 | M42/v5/crop | 7–9 | editorial/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 14 | M42/v5/crop | 13–17 | editorial/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 15 | G28/v5/crop | 6–8 | editorial/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 16 | G28/v5/crop | 14–17 | editorial/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 17 | H17/v5/endcard | 16.6–20.6 | production/blocked/p2 | 缺失 | identity, source_range, owner, status, priority |
| 18 | M42/v5/endcard | 41.8–47.8 | design/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 19 | C63/v5/endcard | 29.5–35.5 | production/blocked/p2 | 缺失 | identity, source_range, owner, status, priority |
| 20 | G28/v5/endcard | 30–36 | design/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 21 | H17/v5/endcard | 32.8–36.8 | design/blocked/p3 | 缺失 | identity, source_range, owner, status, priority |
| 22 | M42/v5/endcard | 2–7 | production/blocked/p2 | 缺失 | identity, source_range, owner, status, priority |
| 23 | C63/v5/endcard | 44.5–50.5 | design/open/p1 | R210: 36–42, production/blocked/p2 | identity, source_range, owner, status, priority |
| 24 | G28/v5/endcard | 2–6 | design/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 25 | M42/v5/title | 28.6–30.2 | design/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 26 | G28/v5/title | 8–14 | design/open/p2 | 缺失 | identity, source_range, owner, status, priority |
| 27 | H17/v2/channel_swap | 6–12 | audio/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 28 | H17/v3/av_sync | 21–27 | audio/blocked/p1 | 缺失 | identity, source_range, owner, status, priority |
| 29 | M42/v2/av_sync | 12–17 | audio/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 30 | M42/v4/audio_gap | 32–37 | audio/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 31 | C63/v2/audio_gap | 17–23 | audio/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 32 | C63/v3/channel_swap | 27–32 | audio/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 33 | G28/v2/av_sync | 17–23 | audio/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 34 | G28/v2/channel_swap | 17–23 | audio/open/p1 | 缺失 | identity, source_range, owner, status, priority |
| 35 | M42/v2/audio_gap | 12–17 | audio/dismissed/p2 | R201: 12–17, audio/open/p2 | status |
| 36 | G28/v4/logo | 41–47 | production/resolved/p1 | R202: 41–47, production/blocked/p1 | status |
| 37 | H17/v3/subtitle | 7–47 | editorial/dismissed/p2 | R213: 7–47, editorial/open/p2 | status |
| 38 | M42/v4/crop | 37–41 | editorial/dismissed/p2 | R214: 37–41, editorial/open/p2 | status |
| 39 | C63/v3/endcard | 36–42 | production/dismissed/p2 | R215: 36–42, production/open/p2 | status |

工具错误：[{"tool":"contact_sheet","error":"fetch failed"}]
