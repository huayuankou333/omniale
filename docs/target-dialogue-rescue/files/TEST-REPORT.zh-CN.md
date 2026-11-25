# 6.2sol 测试记录：画面指定人物的真实重叠原声抢救

运行已结束；实际模型 `gpt-6.2-sol`，reasoning=high，终止原因 `model_finished`。三条输入各 60 秒，候选只读取公开题包。原始提交已冻结，工程验收在迁移副本上进行。

工程门槛：**通过**。REAPER 原生打开得到 12 条轨道、12 个媒体项、3 个区域，坏媒体 0；默认仅目标 WAV 发声。具体结果见 ENGINEERING.json 与 VIDEO-CHECKS.json。

| 成功调用 | 有效工作时间 | 输入 / 输出 tokens | 外部 HTTP 请求 | 下载计数 |
|---:|---:|---:|---:|---:|
| 119 / 140 | 88.5 / 120 分钟 | 13,114,195 / 85,437 | 11 / 80 | 65.1 MiB / 2 GiB |

**本轮不生成正式总分。** 冻结的验收单元仍为标注初筛状态，尚无独立盲听确认的单元集及完整的高质量解法/实际基线校准；按题包原有评分规则，总分应为 null。不能用能量衰减、ASR 转写、文件完整性或一个整体印象分代替 C/S/F 逐单元验收。

Qwen3.8-omni-flash 通过了静音/三音计数与粗起音校准，也通过了匿名原混合/静音/近讲目标的类别控制。以下仅为自动听审的质性第二意见，不是人工结论或正式评分：

**A**：Qwen 返回的未经复核观察：X段（120-180秒）整体听感沉闷、发糊，高频细节大量缺失。目标语音虽然可辨，但清晰度显著低于REF和MIX段，且背景中持续存在明显的数字压缩伪影（类似水下声或金属颤音），导致人声与底噪分离度差。

单元返回 18/18。
听审完整性问题：Some P units were described as pauses; P denotes other target vocal activity, so these observations need identity/content recheck.

**B**：Qwen 返回的未经复核观察：X段（120-180秒）为高保真近讲录音，信噪比极高。目标语音清晰、饱满且无空间混响，背景中几乎听不到任何环境噪声或其他人声泄漏。与MIX段相比，X段完全剥离了房间声学特征和干扰声，呈现出类似演播室或耳机直录的纯净度。

单元返回 13/21。
听审完整性问题：Incomplete fixed-unit coverage; missing B-N01, B-N02, B-N03, B-N04, B-N05, B-N06, B-N07, B-N08；Some P units were described as pauses; P denotes other target vocal activity, so these observations need identity/content recheck.

**C**：Qwen 返回的未经复核观察：X段（120-180秒）整体听感极度沉闷，高频严重缺失，呈现明显的低通滤波或“水下”效果。目标语音虽然可辨，但清晰度远低于REF和MIX段，辅音细节大量丢失。背景中持续存在类似水流或重度压缩的噪声底噪，且部分时段有其他人声泄漏，干扰了主要内容的听取。

单元返回 18/18。
听审完整性问题：Some P units were described as pauses; P denotes other target vocal activity, so these observations need identity/content recheck.；Response used separate group arrays instead of requested single units array; all arrays included in coverage audit.

辅助听审存在漏单元和将 P 类误解为停顿的问题，尤其 B 的正面整体判断不能直接当作高质量结论。上述听感描述尚需独立核验，三段均未生成数值内容分。

独立核对了 47 个声明文件的哈希及 11 次联网记录；未发现对应数据集答案/标注请求，未发现 TTS/重配音处理路线。完整分离流水线没有从零重跑，此项不冒充完整复现。

本轮 Sol 的 Responses 接口拒绝音频输入，Chat 音频探针回答错误；其生产路线是实际视频帧、音频 DSP 和本地 ASR，未接入听音助手。此限制须与模型完整的 omni 能力区分。部分公共模型下载通道不可达或超时，也不应作为内容难度证据。

全部制作、接口调用、工程检查和辅助声音评审均在服务器 Docker 内完成。只把报告、原始交付 ZIP 和预览下载至本地；未改展示网页。

原始交付 ZIP：`sol62-av-dialogue-v1-submission.zip`，622,281,243 bytes，SHA256 `9922f3da0c0d561926f29347ce65d67736b7a38acb2b00a0d2b668dfaca03cd5`。

对照页：`preview/index.html`。原混合与目标预览均保持完整 60 秒；后续正式声音评分应读取原交付的 48kHz float WAV，预览是压缩副本。
