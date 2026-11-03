# Case 6B · 编织教程理解转换 · 2.1.0

展示页：https://huayuankou333.github.io/omniale/weaving/

## 原始候选数据

[下载完整原始候选ZIP](https://github.com/huayuankou333/omniale/releases/download/case6b-data-v2.1.0-20261103/case6b-v2.1.0-candidate-only.zip)。包含冻结题目、原视频（1280×720，797.884秒）、自动英文字幕、四组七张练习图、材料与来源说明。不是整个上游数据集。

ZIP SHA-256：`3b9d79b445bcab125dfc4998196873cca196478c9e5fd19ae9317c8f2af1903d`。
原视频SHA-256：`4cf1953b6a18b4ae77597b733d41e1a9b998d5b851d47091790cf331b0246b66`。
逐文件字节数和哈希见original-data-manifest.json。解压后只向受测者分发candidate/。

## 两模型原始交付与公开运行包

- [gpt-6-luna公开运行包](https://github.com/huayuankou333/omniale/releases/download/case6b-data-v2.1.0-20261103/case6b-gpt-6-luna-public-run-v2.1.0.zip)：原始PDF、原始来源索引、工具轨迹、实际输入图像快照及路径归一化的首请求。
- [gpt-6.1-sol公开运行包](https://github.com/huayuankou333/omniale/releases/download/case6b-data-v2.1.0-20261103/case6b-gpt-6.1-sol-public-run-v2.1.0.zip)：原始PDF、原始来源索引、工具轨迹、实际输入图像快照及路径归一化的首请求。

公开轨迹保留实际调用和结果，不包含内部推理、原始API响应、认证信息或私有评审。observations/只发布留存且写入时间可核对的最后一次工具图像；日志省略图像base64，被覆盖的中间图明确标缺失，不拿后来覆盖的同名文件代替。

## 来源与分发边界

原作者Paracord Creative；原作How to Make the Interwoven Cross Hitch Paracord Bracelet，2015-02-05；https://www.youtube.com/watch?v=qoMFkhnb9Lg 。本地来源许可记录为Creative Commons Attribution license (reuse allowed)，未记录具体版本，不推定版本。中文教材、截图裁切标注、练习图灰度及方位变化均属改编。

网页视频为有损缩放预览，PDF页图为阅读派生；原视频及原始提交在ZIP中保持字节不变。私有评分规则、参考答案和旧模型结果不在候选包；评后网页与公开轨迹不能用作受测输入。

每模型一次60分钟/120工具/100请求，high，自选帧+自动字幕。分数为作者代理暂评，正式专家分null；未做独立专家、实物恢复或新手跟做。
