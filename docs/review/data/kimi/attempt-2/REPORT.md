# Case1 v4：15轮共同感知评测

模型 k3；状态 finished；输入 full；感知路线 shared_tools。

分数 100/100；分项 {"tickets":60,"links":15,"releases":15,"integrity":10}；发布计划 8/8；旧工单权重辅助分 100（不可当作旧版实测）；完整决策 39/39；9 轮、38 次工具调用、0 次工具错误。

有效任务评测；本次是否严格低于80分：false。

冻结文件校验：true。这是合成开发样本、工具辅助感知；不是原生 Omni 或稳定上限结论。未对分数设上限。

| 项 | 对象 | 期望区间 | 期望业务字段 | 实际 | 失败字段 |
|---|---|---|---|---|---|
| 1 | H17/v5/subtitle | 7–9 | editorial/open/p1 | R209: 7–9, editorial/open/p1 | 通过 |
| 2 | H17/v5/subtitle | 15–16.6 | editorial/open/p1 | N301: 15–16.6, editorial/open/p1 | 通过 |
| 3 | H17/v5/crop | 26.6–32.8 | editorial/open/p2 | N308: 26.6–32.8, editorial/open/p2 | 通过 |
| 4 | M42/v5/subtitle | 17–21 | editorial/open/p2 | N303: 17–21, editorial/open/p2 | 通过 |
| 5 | M42/v5/crop | 36.8–41.8 | editorial/blocked/p2 | N309: 36.8–41.8, editorial/blocked/p2 | 通过 |
| 6 | C63/v5/subtitle | 24.5–29.5 | editorial/open/p2 | N304: 24.5–29.5, editorial/open/p2 | 通过 |
| 7 | C63/v5/crop | 2–6 | editorial/open/p1 | N310: 2–6, editorial/open/p1 | 通过 |
| 8 | G28/v5/subtitle | 26–30 | editorial/open/p1 | N307: 26–30, editorial/open/p1 | 通过 |
| 9 | G28/v5/crop | 41–45 | editorial/blocked/p2 | N311: 41–45, editorial/blocked/p2 | 通过 |
| 10 | H17/v5/subtitle | 42.8–47.8 | editorial/blocked/p2 | N302: 42.8–47.8, editorial/blocked/p2 | 通过 |
| 11 | C63/v5/subtitle | 8–11 | editorial/open/p2 | N305: 8–11, editorial/open/p2 | 通过 |
| 12 | C63/v5/subtitle | 16–17.5 | editorial/open/p2 | N306: 16–17.5, editorial/open/p2 | 通过 |
| 13 | M42/v5/crop | 7–9 | editorial/open/p2 | N312: 7–9, editorial/open/p2 | 通过 |
| 14 | M42/v5/crop | 13–17 | editorial/open/p2 | N313: 13–17, editorial/open/p2 | 通过 |
| 15 | G28/v5/crop | 6–8 | editorial/open/p1 | N314: 6–8, editorial/open/p1 | 通过 |
| 16 | G28/v5/crop | 14–17 | editorial/open/p1 | N315: 14–17, editorial/open/p1 | 通过 |
| 17 | H17/v5/endcard | 16.6–20.6 | production/blocked/p2 | N316: 16.6–20.6, production/blocked/p2 | 通过 |
| 18 | M42/v5/endcard | 41.8–47.8 | design/open/p1 | N318: 41.8–47.8, design/open/p1 | 通过 |
| 19 | C63/v5/endcard | 29.5–35.5 | production/blocked/p2 | N320: 29.5–35.5, production/blocked/p2 | 通过 |
| 20 | G28/v5/endcard | 30–36 | design/open/p2 | N321: 30–36, design/open/p2 | 通过 |
| 21 | H17/v5/endcard | 32.8–36.8 | design/blocked/p3 | N317: 32.8–36.8, design/blocked/p3 | 通过 |
| 22 | M42/v5/endcard | 2–7 | production/blocked/p2 | N319: 2–7, production/blocked/p2 | 通过 |
| 23 | C63/v5/endcard | 44.5–50.5 | design/open/p1 | R210: 44.5–50.5, design/open/p1 | 通过 |
| 24 | G28/v5/endcard | 2–6 | design/open/p2 | N322: 2–6, design/open/p2 | 通过 |
| 25 | M42/v5/title | 28.6–30.2 | design/open/p1 | N323: 28.6–30.2, design/open/p1 | 通过 |
| 26 | G28/v5/title | 8–14 | design/open/p2 | N324: 8–14, design/open/p2 | 通过 |
| 27 | H17/v2/channel_swap | 6–12 | audio/open/p1 | N326: 6–12, audio/open/p1 | 通过 |
| 28 | H17/v3/av_sync | 21–27 | audio/blocked/p1 | N325: 21–27, audio/blocked/p1 | 通过 |
| 29 | M42/v2/av_sync | 12–17 | audio/open/p1 | N328: 12–17, audio/open/p1 | 通过 |
| 30 | M42/v4/audio_gap | 32–37 | audio/open/p1 | N329: 32–37, audio/open/p1 | 通过 |
| 31 | C63/v2/audio_gap | 17–23 | audio/open/p1 | N327: 17–23, audio/open/p1 | 通过 |
| 32 | C63/v3/channel_swap | 27–32 | audio/open/p1 | N330: 27–32, audio/open/p1 | 通过 |
| 33 | G28/v2/av_sync | 17–23 | audio/open/p1 | N331: 17–23, audio/open/p1 | 通过 |
| 34 | G28/v2/channel_swap | 17–23 | audio/open/p1 | N332: 17–23, audio/open/p1 | 通过 |
| 35 | M42/v2/audio_gap | 12–17 | audio/dismissed/p2 | R201: 12–17, audio/dismissed/p2 | 通过 |
| 36 | G28/v4/logo | 41–47 | production/resolved/p1 | R202: 41–47, production/resolved/p1 | 通过 |
| 37 | H17/v3/subtitle | 7–47 | editorial/dismissed/p2 | R213: 7–47, editorial/dismissed/p2 | 通过 |
| 38 | M42/v4/crop | 37–41 | editorial/dismissed/p2 | R214: 37–41, editorial/dismissed/p2 | 通过 |
| 39 | C63/v3/endcard | 36–42 | production/dismissed/p2 | R215: 36–42, production/dismissed/p2 | 通过 |

工具错误：[]
