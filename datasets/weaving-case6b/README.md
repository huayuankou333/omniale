# Case 6B · 编织教程理解转换 · 2.1.0

展示页：https://huayuankou333.github.io/omniale/weaving/

## 原始候选数据

[下载完整原始候选ZIP](https://github.com/huayuankou333/omniale/releases/download/case6b-data-v2.1.0-20261103/case6b-v2.1.0-candidate-only.zip)。包含冻结题目、原视频（1280×720，797.884秒）、自动英文字幕、四组七张练习图、材料与来源说明。不是整个上游数据集。

ZIP SHA-256：`3b9d79b445bcab125dfc4998196873cca196478c9e5fd19ae9317c8f2af1903d`。
原视频SHA-256：`4cf1953b6a18b4ae77597b733d41e1a9b998d5b851d47091790cf331b0246b66`。
逐文件字节数和哈希见original-data-manifest.json。解压后只向受测者分发candidate/。

## 模型原始交付与公开运行包

- [gpt-6-luna公开运行包](https://github.com/huayuankou333/omniale/releases/download/case6b-data-v2.1.0-20261103/case6b-gpt-6-luna-public-run-v2.1.0.zip)：原始PDF、原始来源索引、工具轨迹、实际输入图像快照及路径归一化的首请求。
- [gpt-6.1-sol公开运行包](https://github.com/huayuankou333/omniale/releases/download/case6b-data-v2.1.0-20261103/case6b-gpt-6.1-sol-public-run-v2.1.0.zip)：原始PDF、原始来源索引、工具轨迹、实际输入图像快照及路径归一化的首请求。

公开轨迹保留实际调用和结果，不包含内部推理、原始API响应、认证信息或私有评审。observations/只发布留存且写入时间可核对的最后一次工具图像；日志省略图像base64，被覆盖的中间图明确标缺失，不拿后来覆盖的同名文件代替。

## 来源与分发边界

原作者Paracord Creative；原作How to Make the Interwoven Cross Hitch Paracord Bracelet，2015-02-05；https://www.youtube.com/watch?v=qoMFkhnb9Lg 。本地来源许可记录为Creative Commons Attribution license (reuse allowed)，未记录具体版本，不推定版本。中文教材、截图裁切标注、练习图灰度及方位变化均属改编。

网页视频为有损缩放预览，PDF页图为阅读派生；原视频及原始提交在ZIP中保持字节不变。私有评分规则、参考答案和旧模型结果不在候选包；评后网页与公开轨迹不能用作受测输入。

每模型一次60分钟/120工具/100请求，high，自选帧+自动字幕。分数为作者代理暂评，正式专家分null；未做独立专家、实物恢复或新手跟做。


## 2026-11-03追加评测

- [gpt-6-astra公开运行包](https://github.com/huayuankou333/omniale/releases/download/case6b-gpt-6-astra-v2.1.0-20261103/case6b-gpt-6-astra-public-run-v2.1.0.zip)：原始11页PDF、来源索引、完整工具轨迹、全部54幅实际发送图像的不可变快照及公开首请求。ZIP SHA-256：`f6889b7bd87456bf6e963577c8b35fe525919975ee83cef770f6683235713ca1`。

Astra遇到网关429和连接断开，在同一上下文恢复原逻辑请求；原始开始时间、工具/请求计数和60分钟限时保留，停机时间计入总耗时。未加入内容指导；此传输历史与旧两路不同，网页单列披露。Astra全部历史图像采用运行时逐次保存的实际输出字节快照，旧两路的缺失标记维持原状。

GLM 5.3与Kimi K3 Pro在原API试调用均返回404 model_not_found，无配置通道，未开始正式评测，没有分数或交付物。Claude Opus 5此前401未运行，后由用户改为本次Astra请求。状态见evaluation-status.json；各模型公开元数据见case.json。

## 评分修订 v3.0.0

2026-11-04增加20条独立rubric，每项0/2.5/5。该量表是已知旧提交后的修订，尚无独立专家/盲评校准。v3.0历史暂评：Luna 42.5；Sol原始72.5、封顶59；Astra82.5。正式专家分仍为null。原始运行包保留旧评测元数据，当前量表与逐项证据单独保存于[网页评分区](https://huayuankou333.github.io/omniale/weaving/#rubric-v3)及[scoring/v3](https://github.com/huayuankou333/omniale/tree/main/docs/weaving/scoring/v3)。候选题目与输入包没有变更。

## 二元计分 v3.1.0（当前版本）

2026-11-04按用户要求将20项统一改为只计完整达标：原5分保留，原0/2.5分均计0。依据同一批逐项观察确定性重算，没有新增受测运行。当前作者暂评：Luna **15**（3/20项）；Sol **55**（11/20项，原始55低于59上限）；Astra **65**（13/20项）。维度权重、满分标准、证据与严重错误封顶不改。原v3.0文件保留，当前[评分与逐项证据](https://huayuankou333.github.io/omniale/weaving/#rubric-v3)位于scoring/v3.1/；题目和受测输入仍为2.1.0，正式专家分仍为null。
