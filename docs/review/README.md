# OmniALE D1 · Review Desk v2 四模型展示

生成日期：2026-10-20（北京时间）。

## 打开页面

直接用浏览器打开本目录 `index.html`。所有数据脚本、媒体和轨迹都使用相对路径，无需联网或构建。保留整个目录结构。

也可以在本目录运行 `node serve.mjs`，再访问 `http://127.0.0.1:4186/`。服务器仅监听本机。`traces.html` 为可筛选、搜索的运行轨迹浏览器。

## 结果与限制

|模型|成绩 / 100|完整决策|来源与条件|
|---|---:|---:|---|
|gpt-6-luna|43.60|3/20|已有最终有效 full 基线|
|kimi-k3（API ID: k3）|100.00|20/20|本次 full 新测，13轮，0工具错误|
|glm-5.3|64.73（诊断）|1/20|本次 audio_only 诊断；完整图片输入被接口拒绝，正式 full 成绩 N/A|
|gpt-6.1-sol|100.00（历史）|20/20|已有有效运行；本次新测在5轮后因网络和服务器过载中断，未完成|

这不是四个模型同条件的新跑排行榜。GLM 的视觉输入缺失、GPT 的历史来源在首页和分析中显著标注。

任务素材是音视频；本次 harness 是抽帧、独立 Whisper ASR、PCM 数值测量与函数工具，不是原生 Omni 输入。素材为合成图形与语音。评分保持原题80/10/10、20项五字段等分、区间容差±0.3秒；success 需要100分。

本次没有完成新的 GPT 有效试评。第一条新运行未返回模型输出；第二条在5轮后中断。普通请求重试、保存轨迹恢复、流式接收后均持续得到 service_unavailable_error / servers overloaded。所有尝试保留，不以初始数据库26.4分冒充模型成绩。服务恢复后可用下方命令继续同一条新轨迹。

## 轨迹和复现

- `data/report.json`：分数、20项逐项比较、工具统计、历史尝试清单与可比性信息。
- `data/<model>/agent_trace.json`：原始轨迹；未添加模型未返回的内部推理。
- `data/<model>/final-state.json`：最终持久化数据库。
- `data/<model>/evaluation.json`：102条确定性检查明细。
- `data/<model>/manifest.json`：原始冻结配置与哈希。
- `data/<model>/interrupted-*.json`：断点恢复前保留的中断记录（如存在）。
- `files/attempts/`：未作为主结果展示的校准及基础设施失败记录。
- `media/`：会议录屏、13个源视频及对应音轨、初始抽帧。
- `reproduction/`：独立重评分所需的评分器、业务引擎、初始状态、真值、最终状态和运行器源码快照。

在此目录执行 `node reproduction/rescore.mjs`，可离线重新核对四份持久化状态的得分，不调用API。

原项目位于 `D:\omniale\case1_review_v2`，本次运行位于 `D:\omniale\runs`。任务、真值、评分器、媒体工具与源文件未修改；只在运行器/传输层增加网络重试、流式接收和断点恢复，修正报告中 audio_only 路线说明。恢复重建相同历史，不重复执行已完成工具调用；当前每轮模型输出上限仍为9,000 tokens，最大40轮，reasoning medium。

继续本次 GPT 新测（先在当前进程环境设置 `OMNIALE_PROXY_KEY`；不要写入脚本或页面）：

```powershell
$env:CASE1_MODEL = 'gpt-6.1-sol'
$env:CASE1_MODE = 'full'
$env:CASE1_MAX_TURNS = '40'
$env:CASE1_STREAM = '1'
$env:CASE1_RESUME_RUN = 'D:\omniale\runs\case1_review_v2-gpt-6.1-sol-full-2026-10-20T08-45-47-135Z'
node D:\omniale\case1_review_v2\pipeline\run.mjs
```

新开一次完整试评时清除 `CASE1_RESUME_RUN`；GLM 的图片接口支持情况应先重新检测，不能把 audio_only 诊断当作 full。

## 验证

参考解100分、107项评分突变测试、6项事务测试、9项读取隔离负向测试通过。额外测试了流式解析、网络重试请求不变。四份最终状态重新评分；页面在独立DOM环境执行，检查四模型卡片、80个决策详情按钮、工具筛选、搜索及资源链接。文本交付物扫描未检出API密钥。

本会话本地HTTP预览连接超时，内置浏览器禁止file协议，未完成真实浏览器截图、响应式布局与媒体播放实测。DOM检查不等同于视觉验收。详情见 `files/validation.json`。

## 来源

任务分类参考用户提供的飞书文档；页面布局参照用户提供的钢琴案例：浅色文档页面、任务定义、结果表、独立轨迹浏览器和证据化失败分析。两个链接均已实际读取。分析依据本地评测结果、工具轨迹与最终状态。

页面中展示的隐藏真值为评测后公开，未进入被测模型输入。API密钥未保存到文件。模型标识来自用户指定网关，未独立验证其上游模型实现。
