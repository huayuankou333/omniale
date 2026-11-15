# 联网自主选材版：Sol 复评

辅助诊断：**未给出可信质量总分**。交付门槛：**通过**。

本版取消三首候选，Sol 自行联网搜索、核对授权和下载素材。输入仍为相同的80秒长版、20秒重排短版无声锁画，不含原片原声或原配乐。仅测试 gpt-6.1-sol / high；Qwen 仅为独立辅助评审。

## 预算与条件

- 实际外部 HTTP 请求 10/60，成功下载 2 个音乐文件。失败、重定向和显式重试计数；本轮精确 URL 缓存不重复计数。
- 成功制作模型调用 51/140，输出 49029/131072 tokens，有效工作 51.7/120 分钟；结束原因 `model_finished`。
- 4 CPU / 8 GB，制作、联网传输和验收均在服务器 Docker。制作容器无直接网络，通过独立工具联网。
- Sol 使用真实抽帧图片与音频分析工具；本轮没有给制作模型原生音频或视频输入，不能将其描述为直接听过音乐。
- 冻结题目、评分规则、运行器和预算核验：通过。

## 选材与来源

| 曲目 | 作者 | 许可 |
|---|---|---|
| Childhood | Scott Buckley | CC BY 4.0 |
| Felicity | Scott Buckley | CC BY 4.0 |

Two used recordings traced to original author-hosted downloads and explicit CC BY 4.0 author pages; full originals, credits and modifications retained. Both full decodes and the +3-semitone/EQ derivative were independently reproduced. All native project audio references belong to those verified files.

原始下载、SHA256、许可页面、工程引用和处理关系见 source-manifest.json、source-audit.json、source-review.json。授权合规为门槛，不奖励质量分。

## 客观验收

| 项目 | 长版 | 短版 |
|---|---|---|
| 格式、帧率与时长 | 通过 | 通过 |
| 画面帧数、顺序和内容 | 通过 | 通过 |
| 成片与独立 WAV 同混音 | 通过 | 通过 |
| 存在有效音乐 | 通过 | 通过 |

- 长版：-15.94 LUFS，真峰值 -1.51 dBTP；迁移 REAPER 独立重渲染匹配，相对 RMS 误差 0.0。

- 短版：-15.92 LUFS，真峰值 -2.16 dBTP；迁移 REAPER 独立重渲染匹配，相对 RMS 误差 0.0。

工程通过只说明可移交与可重渲染；声音和叙事质量按35/40/15/10规则另评。

## 实际工程结构

| 工程 | 音频来源 | 目标起点 / 秒 | 长度 / 秒 |
|---|---|---:|---:|
| project/long.RPP | Childhood-48k.wav | 0.000 | 44.958 |
| project/long.RPP | Childhood-48k.wav | 44.458 | 6.250 |
| project/long.RPP | Childhood-48k.wav | 49.600 | 9.550 |
| project/long.RPP | Childhood-48k.wav | 58.000 | 15.667 |
| project/long.RPP | Felicity-E-48k.wav | 73.167 | 5.396 |
| project/long.RPP | Felicity-E-48k.wav | 78.480 | 1.520 |
| project/short.RPP | Childhood-48k.wav | 0.000 | 5.600 |
| project/short.RPP | Childhood-48k.wav | 5.000 | 5.300 |
| project/short.RPP | Childhood-48k.wav | 9.900 | 5.720 |
| project/short.RPP | Felicity-E-48k.wav | 15.167 | 3.550 |
| project/short.RPP | Felicity-E-48k.wav | 18.620 | 1.380 |

以上是读取原生工程得到的制作事实。剪辑次数不直接决定品质；模型的意图陈述见 edit-notes.md，不把意图当作已实现的听觉效果。

## 辅助评审与评分边界

最初将带音轨视频直接传给 Qwen 的路线，在已知有音乐、缺口及全静音的对照上失败，出现了根据画面臆测环境声的现象；该路线全部数字停用，失败记录保留。
之后单独登记了显式音频输入加无声视频的传输路线，使用另一组固定对照与共享12次请求预算。对全静音的判定器曾错误要求 heard_audio=true；按事先登记的音乐存在、时长、静音覆盖条件修正了实现，保留前后记录，没有重新请求回答。显式音频路线的粗事实检查：通过。
通过粗事实检查仅表明该路线能区分音乐和较长静音。缺口对照仍出现一个不合题意的1秒范围，时间不适合精确到拍或帧；音乐艺术判断也未经专家标定。聆听代理使用320kbps MP3，不能据此认证细微伪影或声像质量。

辅助评审未取得足够可靠证据，未强行输出总分。具体缺失：`short: musical_ending`。本轮短版音乐结尾为 null，不用任意系数补齐，也没有为得到分数重新提问。

其“单曲连续铺底”等制作推断与原生工程中两首音乐、长版6项/短版5项的结构不符；这不能证明接缝一定可闻，也不能作为“没有剪辑”的依据。其音画适配意见仅供试听核对。

| 项目 | 满分 | 长版系数 | 短版系数 | 已取得的加权诊断分 |
|---|---:|---:|---:|---:|
| 故事弧线 | 12 | 0.50 | 0.50 | 6.00 |
| 画面事件 | 12 | 0.40 | 0.25 | 4.08 |
| 情绪控制 | 11 | 0.60 | 0.50 | 6.16 |
| 结构乐句 | 12 | 0.70 | 0.75 | 8.64 |
| 编辑透明度 | 12 | 0.80 | 1.00 | 10.56 |
| 素材统一 | 10 | 0.50 | 0.50 | 5.00 |
| 音乐收束 | 6 | 0.30 | 未判 | 无法汇总 |
| 可闻瑕疵 | 4 | 0.90 | 1.00 | 3.76 |
| 两版共同身份 | 5 | 联合项 | 联合项 | 5.00 |
| 短版重构 | 10 | 联合项 | 联合项 | 7.50 |
| 响度、真峰值、音轨一致性测量 | 6 | 实测 | 实测 | 6.0 |

以上是辅助模型的未完整意见表，系数乘分值、长短版60/40计算；不是专家分。缺失项导致总分保持 null，不能将表中其他分数补齐后宣称已完成有效质量评分。

## 同素材连续直铺对照

按照成片产生前登记的规则，使用本轮首个成功下载的音乐，从源0秒开始连续铺满两版，只进行响度规范化，不设计乐句重排或结尾。
同一辅助评审路线对直铺对照也没有给出完整音乐收束判断：`long: musical_ending, short: musical_ending`，因此同样没有总分。两轮辅助评审均保持缺失，不宣称 Sol 胜过或输给直铺。所有12次辅助HTTP请求已用完，没有为了补分重问。
对照仅用于辅助试听，连续配乐可能天然适合某些画面，不能预先规定其必须低分。两版预览为 baseline-long.mp4、baseline-short.mp4，原始意见见 baseline-auxiliary-score.json，曲目署名与授权沿用 source-manifest.json。

冻结规则要求两位有经验评审独立盲评并完成基线标定，本轮没有该专家面板，因此正式总分保留 null。旧版30分来自用户试听反馈和工程事实形成的初估；两轮素材条件、评分依据均不同，不能计算严格可比的提高幅度。

## 本地交付

- `long.mp4`、`short.mp4`：Sol 原始成片。
- `long-music.wav`、`short-music.wav`：原始音乐交付。
- `Sol-deliverables.tar.gz`：原始完整工程、来源和交付，未替模型修复。
- `index.html`：本地预览入口；本轮未替换或发布旧展示网页。
- `FILES.sha256.json`：服务器导出校验；下载器另生成 DOWNLOAD-VERIFIED.json。
