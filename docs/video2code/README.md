# OmniALE Video2Code 原生图像试测

2026-10-21：GPT-6-Luna **67.00**；GPT-6.1-Sol **93.56**；GLM-5.3-Flash、Kimi-K3 **N/A（接口故障）**。没有达到四模型均低于80分的目标。

输入为 WebCompass #78 的41.333秒三维积木网站录屏。交付物为可运行网站代码。冻结评分为执行10、交互60、视觉25、可用性5，共43条断言。

## 使用与复核

- `downloads/*-candidate.zip`：两份实际输出，解压后按 RUNNING.md 启动。无需模型API，Three.js已内置。
- `results.json`：分数、完整尝试状态、逐轮轨迹、扣分依据。
- `runs/*/evaluation/`：原始judge、代理复核、分数、验收录像和证据哈希。
- `PROTOCOL_EFFECTIVE.json`：合并基础设施修订后的实际协议。原 protocol.json 和所有冻结/修订文件保留。
- `runner/executed-snapshot/`：执行时工作区辅助程序原件；runner中的副本仅做相对路径打包修正，见 PACKAGING_MANIFEST.json。
- `downloads/design-v1.zip`：原设计版本。Review Desk v4未更改。

## 边界

这是一轮试测，只有两份有效结果。两个judge均来自GPT家族，主代理进行证据复核；不冒称独立人工认证。网关忽略输出token上限，因此统一预算是15轮、120次工具和帧数限制，实际输出token在成绩中单列。GLM已经通过原生图像预检，但完整任务连接不稳定；Kimi在第三轮后持续503。故障没有计为0分。

运行原生runner需同机 Node22.19.0、F:/annconda/python.exe、D:/omniale/.deps中的PyAV、D:/omniale/node_modules中的Playwright1.64.1，以及Chromium143 build1200。所有模型密钥只由进程环境 OMNIALE_GLM_KEY / OMNIALE_GPT_KEY / OMNIALE_KIMI_KEY读取；目标服务为用户授权的 api-temporary.nju-link.com。API模型身份以网关返回为准。

示例（从本目录运行，使用新run id，避免覆盖）：
```
node runner/run.mjs glm-5.3-flash glm-5.3-flash-new-run
python tools/score.py --manifest runs/gpt-6-luna-trial-01/evaluation/manifest.json --judges runs/gpt-6-luna-trial-01/evaluation/judge-gpt-6.1-sol.json runs/gpt-6-luna-trial-01/evaluation/judge-gpt-6-luna.json --adjudication runs/gpt-6-luna-trial-01/evaluation/adjudication.json
```

公开网页保留所有被judge/复核引用的证据、未剪辑压缩验收录像、原始接口输出和轨迹。全部原始PNG/WebM在本地完整包；网页不托管数百MB的原始WebM。发布副本证据清单只删减未引用文件，分数重新校验一致。
