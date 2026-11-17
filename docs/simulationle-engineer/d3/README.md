# D3 工程仿真案例展示网页

直接双击 `index.html` 即可离线使用。也可以在此目录执行：

```sh
python -m http.server 8765 --bind 127.0.0.1
```

然后打开 `http://127.0.0.1:8765/`。不需要 npm、CDN、外部字体、后端或联网。

包含 Francis-99、NIST AM-Bench、AHEAD/HYLON、多热源冷板、OC6、NASA Rotor 67 六个案例。支持状态筛选、关键词 / 软件搜索、案例切换、章节跳转、完整题目与报告阅读、原始文档下载、轨迹时间滑杆、PIV 工况切换、Ypad 场切换与网格值读取、图片放大及打印当前案例。新增两例各有独立页面、11张模型原图、交付对照、验收缺口及可切换诊断图。

## 线上访问

案例库：https://huayuankou333.github.io/omniale/simulationle-engineer/d3/

- OC6 独立页：https://huayuankou333.github.io/omniale/simulationle-engineer/d3/oc6/
- Rotor 67 独立页：https://huayuankou333.github.io/omniale/simulationle-engineer/d3/rotor67/
- 完全复现的相关工作位于主站独立的 related-work/ 子网页。

2026-11-17新增内容的构建、保留、发布与浏览器检查脚本及回执位于项目 `SLE_E_D3/work/github_pages/`。完整冻结工程继续保留在研究服务器；网页从归档证据复制，没有重启求解器或修改模型提交。

## 证据与解释边界

- `data.js`：原四例内容、保留文档原文与图表数据；`recent-cases.js` 增加 OC6 与 Rotor 67；直接嵌入以支持 file:// 离线打开。
- `assets/`：模型原始图和出题方冷板输入图，来源分别标注。
- `documents/`：六份冻结题目、已有模型报告与独立评审原文；新增两例附数据审计、交付格式、验收协议和来源。
- `evidence/`：重绘所需 CSV / JSON / NPY、评分 / 检查记录与 SHA-256 来源清单。
- 页面不含参考解；评分非专家最终分数。冷板状态随本轮 sol 测试记录更新。
- AM-Bench 九场景最坏 J 从原 JSON 重新取最大值，约改善 0.66%；nominal 单场景约 0.67%。不将不同时间精度的指标混算。
- 模型原报告中的发布时点表述原样保留；最新状态以案例介绍和独立评审为准。
- 展示包是便携证据子集，不是所有原始输入或完整可求解工程的镜像。完整工程与大场仍在原服务器。
- `files/*-task-and-contract.zip` 仅公开题面及验收参数；第三方论文、CAD等材料按官方来源获取。
- OC6 与 Rotor 67 均为 unresolved，尚未达到工程验收要求。数值门槛是原创建题的委托验收条件，不代表 IEC、DNV、ISO 或适航认证。
- OC6 的30/100是作者暂评，原始分40，封顶解释待专家确认；CPU配额异常使该试次不适合严格等算力排名。Rotor 67 保留首次中断、上下文恢复和最终日志同步异常的说明；正式状态以恢复段独立核验为准。

网页源码为 `index.html`、`styles.css`、`app.js` 及 `recent-*.js/css`。更新需保留冻结题目和模型交付，重新校验文件哈希与浏览器功能后发布；原一次性构建脚本不能直接重复执行以免追加重复内容。
