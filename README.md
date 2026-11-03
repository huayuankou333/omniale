# OmniALE · D1 Review Desk v4

公开展示：https://huayuankou333.github.io/omniale/review/

新版加入时间对齐、工单依赖和发布计划联动；四模型共用视觉、ASR与PCM工具，主模型预算统一为15轮。成绩从实际终态确定性计算，接口故障单独保留为N/A。

## GitHub Pages

仓库 `main` 分支的 `/docs` 目录自动发布。无需前端编译或额外服务器。

- `docs/weaving/`：Case 6B v2.1.0，编绳视频转中文图文PDF与四组中途续作；完整公开题目、原始输入、Luna/Sol原始PDF、逐次工具轨迹和图像留存说明。[在线展示](https://huayuankou333.github.io/omniale/weaving/)。作者暂评41.5/59，正式专家分未评。
- `datasets/weaving-case6b/`：原始候选数据清单和SHA256；原视频及完整候选ZIP、两模型公开运行包在Release `case6b-data-v2.1.0-20261103`。

- `docs/omni2web-starss23/`：STARSS23真实空间音视频→交互探索网页；题面、可播放输入、两模型成品、完整轨迹与评分。单次交付Luna69.30，Sol83.24。
- `docs/omni2web-urmp/`：URMP v2主动取证与语义排练卡；画面重排、匿名独立音轨与三条自然语言请求。单次交付Luna40，Sol97；内容/执行分别报告，详见失分边界。
- `datasets/omni2web/`：以上两个case的原始数据与封存结果下载目录、逐文件来源清单和SHA256。完整源片段与任务输入在本仓库GitHub Release `omni2web-data-2026-10-30`，并非整个上游数据集。网页副本只适配媒体路径，原始交付保持不变。

- `docs/review/`：v4任务定义、四模型结果、逐项评分、轨迹、失败分析。
- `docs/review/data/`：报告和所有实际尝试的原始证据。
- `docs/review/media/`：会议、源视频、源音轨和初始抽帧。
- `docs/review/files/`：规范、编辑事件表、评前冻结、评后真值、共同观察缓存和代码包。
- `docs/review/reproduction/`：独立复算终态的评分器快照。
- `docs/review-v2/`：原v2展示归档；不与新版成绩混用。
- `docs/video2code/`：D2 原生图像试测。WebCompass #78 三维积木录屏、24项/43个断言、15轮预算。Luna 67.00、Sol 93.56、Kimi重试89.75；GLM-5.3-Flash重试429/503为N/A。含代码ZIP、实际轨迹、双judge、代理复核和验收录像；详见该目录README与实际协议。
- `docs/video2code-flowboard/`：独立原创 Flowboard 题。132.76 秒新录屏、17 阶段、40 项/53 个功能断言；组合、连线绑定、撤销分支、快照和 JSON 往返。参考回放与边界检查已通过，四模型尚未重测，不能宣称 ≤80。旧题成绩保留。

## 验证与预览

```sh
node scripts/check-site.mjs
node docs/review/reproduction/rescore.mjs
python -m http.server 8000 --directory docs
```

通过HTTP打开 `/review/`；轨迹JSON按需加载。完整复现步骤见 `docs/review/README.md`。发布前应同时校验报告JSON/JS、所有原始轨迹和评分终态，不能只修改显示分数。

所有模型API密钥与GitHub令牌仅在调用进程环境中使用，不保存在仓库。评后公开的答案不能进入被测模型输入。

Review任务为合成开发样本，采用共同工具辅助感知；Video2Code为公开录屏派生开发题，采用原生图像输入。单次结果不代表稳定排名。上游模型身份以代理返回标识为准，未独立认证。
