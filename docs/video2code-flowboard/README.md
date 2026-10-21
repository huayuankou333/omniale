# OmniALE case3 / Flowboard v1

2026-10-22。独立设计的 Video2Code 开发题。与旧 WebCompass 积木题分开存放，旧分数不变。

真实可运行参考网页已完成；原创录屏约 133 秒、17 章、24 个参考截图。脚本通过 21 个参考状态检查。此检查用于核对录制内容，不等于独立评测认证，也不是四模型分数。

核心交付：public/TASK.md、public/inputs/demo.mp4、public/chapters.json、evaluator/checklist.json、evaluator/JUDGE.md、evaluator/scenarios.json、reference/record.mjs、evaluator/reference-replay/audit.json、protocol.json、DESIGN_FREEZE.json。

参考实现使用固定 @excalidraw/excalidraw 0.18.1。其编辑器为既有开源组件；Flowboard 外壳、初始图、操作流程、录屏和评测清单为本次独立设计，没有复制 WebCompass 题目或视频。reference/ 为评测者参考，不能放入候选工作目录。需要源代码时在 reference/ 执行 npm ci、npm run build、npm run dev；浏览器地址 http://127.0.0.1:3210。

runner/ 从旧版已验证的原生图像评测框架适配，采用 1440×900 和新版时长/帧。保留 15 轮限制。还需在候选试测前执行接口和预算预检。运行示例：node runner/run.mjs gpt-6.1-sol gpt-6.1-sol-trial-01。密钥只用进程环境变量，API 地址沿用已获授权的网关。

本版本状态：reference_verified / candidate_not_run。不能宣称四模型 ≤80。正式比较至少须取得四份有效候选、逐项浏览器取证、匿名 judge 和分歧复核；稳定性校准建议每模型三次，全部试次公开。已知 GLM 网关曾 429/503，本版接口状态未预检。

环境沿用本机先前评测：Node 22.19.0，F:/annconda/python.exe，PyAV 在 D:/omniale/.deps，Playwright 在 D:/omniale/node_modules，Chromium 1200 在本机 ms-playwright 缓存。跨机器运行须调整 runner/browser.mjs 和 runner/run.mjs 中这些路径。GLM 使用无损 WebP 传输，相同解码像素；辅助转换脚本已经包含。网页/评分器/runner 烟测结果见 evaluator/qa/，均不属于模型得分。
