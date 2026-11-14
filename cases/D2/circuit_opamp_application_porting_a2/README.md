# A2 · 保持应用功能的低压运放迁移

已验收的工程改编任务。保留 AnalogPortBench T3 原题八项要求，同时增加闭环传感器接口的范围、负载、跟踪、稳定性与过载恢复要求。

## 版本与证据

- `frozen_v1/`：正式试验前封存的 184 个文件，逐字节匹配原 seal。Sol **20/100，FullPass=0；原题 8/8，新增 1/5 组**。结果只属于此版本及报告中的单次运行预算。
- `runtime_v1_1/`：修复公开 policy helper 挂载及题面逐字节复制，未再测试 Sol。电气合同、评分器、参考解、预算不变。不能把 v1 成绩标成 v1.1 成绩。
- `../../../docs/simulationle-engineer/files/opamp-application-a2/`：完整报告、合同、预算、封存包、校准与负对照、Sol 轨迹和冻结提交、初始及后续审计。

v1 初始审计因 runner 将 TASK 的 CRLF 规范为 LF 报警；文本一致、题面只读、首次快照等于终态。第 41 轮直接 policy helper 命令缺失；157 批自动网关 policy 检查均通过，65 批最终验收完成。两项问题与修复证据完整保留，未据此重写历史成绩。

## 使用

两个目录及 ZIP 都是**研究者包，含参考电路和独立验收代码**。不要把整包作为模型工作目录；只通过 runner 暴露 public/starter 白名单。实际容器固定摘要及预算见各版本 `config.py`、`profile.json` 和 `run_agent.py`。部署时使用 runtime_v1_1，并重新记录本次环境与运行证据；不要覆盖 frozen_v1。

本次发布只复制既有封存产物，没有重跑模型、校准或仿真。A1 仍保留在原归档。

上游：AnalogPortBench，commit `5dc16f1c01858664f1912a84abfc06fd4c69f6de`；上游 MIT 许可与作者声明位于每版本 `upstream/LICENSE`。本任务新增应用合同属于 SimulationLE 改编；不将成绩当作上游论文官方成绩。
