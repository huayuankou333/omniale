# Beta-multiplier 电流基准：原题与评分复现

原题：Analog Design Bench 的 `sky130-beta-multiplier-reference-pvt-mc`。
固定提交：`972f7cd7c95381134387b250edf18f3bd23bdd25`。
完整原题见 `TASK.md`；原文件、参考电路、测试台、评分器和来源 SHA256 在 `upstream/`。

模型从原始空白 starter 开始，自主实现自偏置、能启动的晶体管级电流基准；
唯一提交物为 `circuit.spi`，接口为：

```spice
.subckt beta_multiplier_reference vss vdd vref iout
```

本版本保留上游电气/netlist 任务，没有把 Xschem 原理图、版图或流片要求加入正式分数。
受测模型通过固定文件与仿真工具修改设计，不执行模型生成的 shell/Python。
模型可读取原始器件指南和公开测试台；参考解与正式验收源码不向模型开放。

## 电气验收与分数

- 标称 TT/1.8 V/27°C：35–45 µA。
- 27 个 PVT 组合：tt/ss/ff × 1.62/1.8/1.98 V × -40/27/125°C。
- PVT：20–60 µA、VREF 0.60–0.75 V、总 DUT 功耗不超过 100 µW。
- 输出端从 0.4 到 1.6 V：电流峰峰值/均值不超过 8%。
- 18 个启动工况：规定的三种供电/温度配对、三个角、1/10 µs 供电爬升；
  验证最终状态、稳定时间、过冲、涌流和能量。
- 50 个 process+local-mismatch 样本：至少 90% 在 30–50 µA，样本 sigma ≤4 µA。

完整验收执行 95 个 ngspice 进程；同一 DC sweep 同时提取 PVT 与 compliance 指标。
评分调用未修改的上游 `score_results`：12 项通过比例，再应用上游的关键失败分数上限。
因此正式 reward、12 项通过数和整体是否达标分别报告，不能互相替代。

原公开 Monte Carlo 使用 31000–31007；正式使用 31000–31049，前八个样本重叠。
本复现保留此规则，不声称它们是完全独立的隐藏样本。

## 运行

在本目录运行：

```powershell
.\validate.ps1       # 环境/参考校验，不调用 API
.\run.ps1            # 使用已有服务测试两个精确模型 ID；凭据隐藏输入
.\reproduce.ps1      # 从最近一次冻结提交重放全部验收，不调用 API
```

API 服务沿用已有配置；精确请求 `gpt-6-luna` 与 `gpt-6.1-sol`，先查询模型可用性，
不替换成其他模型。API key 仅在进程内存中，不写入代码、命令参数、日志或报告。
中断后的基础设施恢复可以使用 `run.ps1 --resume <完整运行目录>`；协议哈希必须一致。

每个模型同预算：36 次响应、32 次开发诊断、最多 160 次开发 ngspice 运行、
70,000 输出 token（含服务计入的推理 token）、单次响应 8,192 token、两小时 agent 时间。
每模型一次独立上下文运行，串行 API。最终评测在冻结后执行，不返还正式结果继续修复。
服务报告的模型 ID 不等于独立验证底层权重。

## 环境与复现边界

复用项目内 `runtime/python`、`runtime/ngspice` 和已有 LDO 保存的同一镜像 SKY130 模型。
Windows 适配只处理进程、路径、日志与超时；工况生成、波形指标和评分函数直接复用原文件。
上游 Linux 为 ngspice 46，本地为 Windows ngspice 47，数值不保证逐位一致。
参考电路在本地全部通过；参考 MC sigma 本地约 1.106 µA，上游报告约 1.048 µA。
临界提交可能受版本差异影响，因此本结果属于保留原电气协议的 Windows 复现，
不能当作原 Linux 镜像下逐位相同的官方运行。

就绪校验见 `validation/READY.json`，包括参考 12/12、95 波形独立 NumPy 重算、
五种非法提交对照、缺失提交、实际不达标电路、公开 MC 重放核对。
运行时与器件模型哈希在 `runtime_manifest.json`；每轮 API 请求/响应、工具结果、
源码快照、预算和冻结提交保存在 `runs/`。`audit.py` 可从 API 输出重建最终源码。

最近真实模型运行在 `latest_run.json`；该轮结果与报告位于对应 `runs/<运行号>/`。

## 首轮实测（2026-11-05）

运行号：`20261105_152447`。每模型一次 agent 运行，使用同样预算。

| 模型 | 原题 reward / 100 | 电气检查 | 整体达标 |
|---|---:|---:|---|
| gpt-6-luna | 58.33 | 7/12 | 否 |
| gpt-6.1-sol | 100.00 | 12/12 | 是 |

Luna 的标称电流与 MC 通过，主要失败在 PVT 电流/VREF、功耗、输出适应性与启动最终状态。
Sol 的 27 点 PVT/compliance、18 个启动工况、50 个 MC 样本全部通过。
完整证据见 `runs/20261105_152447/REPORT.md`、`authorship_audit.json` 与 `replays/`。
单次结果说明此题在本协议下有区分度，不能据此估计稳定成功率；本次 Sol 已通过原题。
