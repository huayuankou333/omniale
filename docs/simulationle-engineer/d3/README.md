# D3 工程仿真案例展示网页

直接双击 `index.html` 即可离线使用。也可以在此目录执行：

```sh
python -m http.server 8765 --bind 127.0.0.1
```

然后打开 `http://127.0.0.1:8765/`。不需要 npm、CDN、外部字体、后端或联网。

包含 Francis-99、NIST AM-Bench、AHEAD/HYLON、多热源冷板四个案例。支持状态筛选、关键词 / 软件搜索、案例切换、章节跳转、完整题目与报告阅读、原始文档下载、轨迹时间滑杆、PIV 工况切换、Ypad 场切换与网格值读取、图片放大及打印当前案例。

## 线上访问

当前公网入口：https://hospital-thereby-democrat-relative.trycloudflare.com/

网页静态文件已上传至服务器 `SLE_E_D3/showcase/D3_case_showcase_20261116/`。服务由用户级 systemd 管理，不依赖本地预览程序继续运行。当前使用 Cloudflare 临时隧道；重建隧道时地址可能改变。

更新流程：生成内容、通过浏览器检查、重新打包，再执行 `SLE_E_D3/work/D3_case_showcase/sync_online_site.py`。该脚本校验归档与文件哈希后同步线上文件；SSH 密码只从进程环境读取。首次部署回执与在线检查位于 `SLE_E_D3/work/D3_case_showcase/checks/`，服务器运行回执位于 `SLE_E_D3/showcase/online_receipt.json`。

## 证据与解释边界

- `data.js`：案例编辑内容、保留文档原文与图表数据；直接嵌入以支持 file:// 离线打开。
- `assets/`：模型原始图和出题方冷板输入图，来源分别标注。
- `documents/`：四份冻结题目、已有模型报告与独立评审原文；冷板附数据审计和来源。
- `evidence/`：重绘所需 CSV / JSON / NPY、评分 / 检查记录与 SHA-256 来源清单。
- 页面不含参考解；评分非专家最终分数。冷板状态随本轮 sol 测试记录更新。
- AM-Bench 九场景最坏 J 从原 JSON 重新取最大值，约改善 0.66%；nominal 单场景约 0.67%。不将不同时间精度的指标混算。
- 模型原报告中的发布时点表述原样保留；最新状态以案例介绍和独立评审为准。
- 展示包是便携证据子集，不是所有原始输入或完整可求解工程的镜像。完整工程与大场仍在原服务器。

如需更新内容，在项目根目录执行 `python SLE_E_D3/work/D3_case_showcase/build_content.py`，该脚本仅读取原有保留包，不修改冻结题目和模型交付。网页源码为 `index.html`、`styles.css` 和 `app.js`。
