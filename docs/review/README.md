# Review Desk v4 · 15轮共同感知评测

本页展示合成审片会议驱动的系统操作任务。主要交付是持久化工单、工单关系和发布计划。页面中的标准答案、逐字段检查与参考终态均在评测完成后公开；候选模型工作区只包含公开输入与业务引擎。

## 变化与设置

- 会议 1,023.3 秒，21 个源版本，39 项工单目标，8 个待更新发布计划。另保留 8 条无关历史工单与 1 个归档计划。
- 最终 v5 交付包含拆分、重排、变速和局部区间指令；公开 `conform.json` 仅提供编辑事件坐标，不含工单答案。
- 支持直接依赖、拆分来源、被替代关系、重复关联，以及按依赖闭包计算的发布状态和阻塞清单。
- 四模型均使用 `shared_tools` 路线：固定 `gpt-6.1-sol / low` 视觉观察器、独立 Whisper `base.en / CPU int8`、相同 PCM 测量工具。候选模型不接收原始图片、语音或视频。
- 主模型最多 15 个逻辑轮，同轮相同输入的网络重试另计；每轮最多 9,000 输出 tokens，总量 135,000；工具 120 次、视觉 1,024 帧、ASR 1,800 秒、PCM 测量 900 秒。初始证据也占对应预算，相同缓存请求仍计费。
- 主模型 reasoning 为 high。候选 ID：`gpt-6-luna`、`glm-5.3`、`k3`、`gpt-6.1-sol`。名称是代理报告标识，未独立认证上游实现。

评分为工单字段60 + 关系15 + 发布15 + 保留/额外操作10。无 LLM 裁判；不对分数设上限。评分器、真值、输入和运行协议在首次实际模型评测前冻结，详见 `files/pre-eval-freeze.json`。

原始状态基线为21.99分。标准终态通过同一业务API以5次事务写入可以达到100分；这验证系统可达性，不证明模型能在5轮内完成推断。每模型使用首个有效trial，基础设施失败最多从初始状态全新重试两次，所有尝试均保留。服务失败为N/A，不记低分。不同版本的成绩不能直接比较。原定只允许一次全新重试；GLM第二次又因独立视觉服务故障中断，已在第三次运行前记录适用于所有候选的重试规则调整，见 `files/transport-amendment.json`。该调整不改变已冻结的输入、工具、推理设置、逻辑预算或评分；已有效的结果不重新选择。另一次GLM恢复尝试因执行端同时运行多个恢复进程触发网关并发上限，作为执行事故作废，在其他请求结束后串行替换一次；事故和修正均保留于同一调整记录。

## 文件

`data/report.json` 包含展示结果、逐项评分、分析和可比性校验。`data/<model>/attempt-N/` 保留每次尝试的轨迹、manifest、输入审计、终态、差异与评分。`media/` 提供会议、初始帧、全部源视频和音轨。`files/shared-cache/` 提供实际使用的共同感知缓存，含输入媒体哈希和输出哈希。

`files/case1-v4-code.zip` 包含Windows下的运行、工具、业务引擎、评分和素材构建代码，并带有必要的小型状态与元数据；不重复打包视频。共享工具方案不是原生Omni评测，也不是对各模型感知能力的独立对照。正式基准需要独立人工复核、更多样本和重复运行。

无需API即可复算所有展示终态：在仓库根目录运行 `node docs/review/reproduction/rescore.mjs`。它同时验证标准终态为100分，并保持基础设施故障的正式分数为N/A。

## 复现实测

1. 解压代码包，保持 `harness/` 与 `case1_review_v4/` 并列。安装Node.js、Python，以及numpy、Pillow、scipy、faster-whisper；准备FFmpeg。素材生成使用Windows字体与桌面TTS，重建媒体可能与评测快照存在字节差异。
2. 从本页把 `media/review.mp4` 放到 `case1_review_v4/public/inputs/review.mp4`，把 `media/sources/` 中全部 `.mp4` 与 `.wav` 放到 `public/sources/`，把 `media/initial-frames/` 中帧放到 `prepared/frames/`。代码包已包含冻结的ASR和帧时间清单。
3. 可将 `files/shared-cache/` 复制到 `case1_review_v4/shared_cache/case1-v4-shared-15turns-v1/` 复用观察结果。即使缓存命中，各候选仍扣除相同逻辑预算。缓存身份包含服务地址、观察模型、提示词、媒体哈希和请求参数；改变其中任何一项会重新生成证据。
4. 在当前PowerShell进程中设置 `CASE1_PYTHON`、`FFMPEG_PATH`，以及 `OMNIALE_GPT_KEY`、`OMNIALE_GLM_KEY`、`OMNIALE_KIMI_KEY`。不要将密钥写入仓库。`OMNIALE_PROXY_BASE_URL` 必须是密钥所属且获得授权的服务地址。
5. 运行 `node case1_review_v4/pipeline/audit.mjs` 与 `node case1_review_v4/pipeline/test_v4.mjs`，再运行 `node case1_review_v4/pipeline/run_suite.mjs`。默认每个候选从独立初始工作区开始，输出写到同级 `runs/`。运行器禁止沿用中断trial继续补预算。

要重新构建全套合成媒体，可显式运行 `pipeline/all.ps1 -Rebuild -SkipModel`；它会重建输入和真值，属于新的开发构建，应重新做QA和冻结。不要把重建后的媒体哈希与本页快照混为一谈。`pipeline/all.ps1 -SkipModel` 仅运行验证。

要查看可操作的本地业务系统，先把初始 `state.json` 复制到一个测试文件，通过 `CASE1_STATE` 指定副本，再启动 `node case1_review_v4/app/server.mjs`。工单使用 `/api/transaction`，发布使用 `/api/releases`。网页展示是GitHub Pages静态站点，不在公开服务器上执行业务写入。

## 静态网页维护

仓库 `main` 分支的 `/docs` 由GitHub Pages发布。新版入口 `/omniale/review/`；旧版保留在 `/omniale/review-v2/`。本地可在仓库根目录使用 `python -m http.server 8000 --directory docs`，通过HTTP打开 `/review/`；轨迹浏览器会按需加载JSON。提交前运行 `node scripts/check-site.mjs`。
