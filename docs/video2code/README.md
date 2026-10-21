# OmniALE D2 · Video2Code / 3D Brick Studio

状态：**设计与输入已落盘，尚未进行四模型实测**。此包是从 WebCompass video-generation #78 派生的开发案例，不宣称是独立未见过的新基准，也不宣称四个模型已低于 80 分。

核心任务是观看三维积木网页的演示录屏，创建、启动并调试一个具有相同可观察行为的网站。输出是可运行代码与应用，属于“视频输入 → 系统产物和操作”的 D 类任务。

- `public/TASK.md`：仅此说明和 `public/inputs/demo.mp4` 进入候选工作区。
- `design/方案说明.md`：选题、证据核对、难度设计和校准办法。
- `evaluator/checklist.json`：逐项评分规则，合计 100 分。
- `evaluator/scenarios.json`：回放和组合测试；交互执行者先产出证据，judge 再评分。
- `evaluator/JUDGE.md`：盲评、证据和分歧处理协议。
- `evaluator/references/`：42 张逐秒精确解码参考帧，仅供验收与展示；它们不是候选的文字答案。
- `tools/score.py`：验证证据、汇总两名 judge 的评分，不调用模型。
- `tools/check_package.py`：校验输入哈希、分值、证据锚点、候选边界和结果状态。
- `tools/media.py`：对原视频精确抽帧和局部放大。
- `protocol.json`：四模型统一预算的拟定协议。
- `results.json`：四个模型均为 `not_run`，分数为 `null`。
- `index.html`：可本地打开的设计展示页，含原始视频、分段定位和评分清单。

## 查看

直接打开 `index.html`，或在本目录执行 `node tools/serve.mjs` 后访问 `http://127.0.0.1:8767`。内置服务器支持视频 Range 请求和章节跳转。展示页不依赖远程脚本或 API。

## 检查

```powershell
python tools/check_package.py
python tools/score.py --self-test
```

评测执行前还必须完成 `evaluator/READINESS.md` 中的参考实现验收、环境与 judge 冻结。工具自测的 100 分仅用于验证加法与边界，并非任何模型成绩或已验证的参考网站成绩。

## 来源

- 官方项目：https://github.com/NJU-LINK/WebCompass
- 官方数据：https://huggingface.co/datasets/NJU-LINK/WebCompass
- 选用录屏：https://huggingface.co/datasets/NJU-LINK/WebCompass/resolve/main/video/generation/videos/78.mp4
- 原题 checklist：https://huggingface.co/datasets/NJU-LINK/WebCompass/blob/main/video/generation/data.jsonl

视频字节不作修改，来源和 SHA-256 见 `provenance.json`。数据集卡标注 Apache-2.0；保留来源声明。本包新增设计与评分代码和原始录屏分别标明来源，不声称拥有原网站品牌或商标。

现有 Review Desk v4 仍保存在 `D:/omniale/case1_review_v4`；本设计不修改该 case 或其已发布成绩。
