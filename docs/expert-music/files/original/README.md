# 聆谱 · 离线音乐分析研习室

从包含 `output/` 的目录运行：

```sh
python -m http.server 8000 --directory output/site
```

打开 `http://localhost:8000/`。如果当前就在 `output/`，把参数改为 `--directory site`。只需 Python 3 及支持 WAV / MP3、JavaScript 和 `<dialog>` 的现代浏览器。不需要外网、CDN、构建工具或额外音频插件。原媒体约 333 MiB；普通 `http.server` 不支持分段请求时，网页首次访问每首录音会从本机服务载入该原文件以支持任意定位。等播放器显示载入结束；同一会话的再次访问无需重新载入该录音。页面所有按钮共用一个播放器，定界回放到终点即停；“全篇”解除窗口约束。

## 文件与时间

- `answers.json`：20 个作答条目；选择题答案字段只含字母。音高中的 `b` / `#` 为降 / 升，八度以中央 C 为 C4。小节拍位采用 `bar` / `beat`；成对的小节号或按顺序的项目以数组给出。
- `evidence.json`：`audio_ranges_s` 为文件内秒数的 `[开始, 结束]`；多个范围用于对照。钢琴以完整 WAV 起点计时；H01–H08 以官方截段的 MP3 起点计时，**不加原歌曲偏移**。Q07 答案用 `M:SS` 向下取整。`score_regions` 的 `page` 为从 1 开始的原 PDF 页序，`rect_norm` 为从左上角起算的 `[x, y, 宽, 高]`，相对于整页归一化。H 类没有提供谱面，值为 `null`。
- `site/`：题卡含双语题目、证据回放、揭晓、谱页定位与标框。研习进度只保存在当前浏览器。谱面使用原始 PNG 和 PDF，不是从音频转写的仿谱。

## 来源与限制

Q01–12：MuSP-Bench（Milan Liessens Dujardin、Song-Ze Yu、Kevin Miao；固定版本 `ebb8fdc0d0f49d427e48b15f257fa39056b5e525`），上游题目及衍生题包按 CC BY-NC-SA 4.0。录音及谱面另见原来源声明（ASAP / (n)ASAP、PianoCoRe、MAESTRO）。Q13–20：HumMusQA（Weck 等，DOI `10.5281/zenodo.18462524`），题集 CC BY 4.0，各轨道许可证与作者署名独立保留。详见 `site/data/SOURCES_AND_LICENSES.md`、`SOURCE_NOTICES.md` 和 `LICENSE.MuSP.md`。

原 WAV、MP3、PDF 和谱页逐字节复制；未变速、变调、重剪交付录音，未生成独立声部。听辨以原始混音为限；音头、局部频谱、谱面位置和重听互相校验，而不是把连线、力度记号当作演奏事实。细小力度差异、音色过渡、风格术语与个别混音声部有不确定性（尤其 Q15）。没有用发布方答案键，不冒报来源精确得分或 ±1 秒得分；这两种分数需由持有来源参考答案的评测方计算。
