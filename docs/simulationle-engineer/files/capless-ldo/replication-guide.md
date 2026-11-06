# LDO 自主设计与原生资产评测

题目入口：`TASK.md`。本目录与此前 `circuit/` 的固定 OTA 调参题独立。

## 运行新模型测试

在 `D:\LINK\SimulationLE` 执行：

```powershell
.\run_ldo_case.ps1
```

API key 通过终端隐藏输入读取，仅存在于当前进程内存；不保存到源代码、参数、日志或报告。
默认使用此前指定的服务和 `gpt-6-luna`、`gpt-6.1-sol`，先查询模型列表。服务返回的模型名不代表独立验证过模型权重。

## 不调用 API，重放冻结资产

```powershell
.\reproduce_ldo_case.ps1
```

重放会从冻结的参数设计重新生成 Xschem 原理图，由原生 Xschem 导出 SPICE，再执行全部 PVT 验收。不会覆盖原始模型运行。

## 文件布局

- `public/`：提供给受测模型的电气要求、资产格式和器件文档。
- `engine.py`：固定 SPICE 文法、Windows 运行适配、正式矩阵；复用上游指标函数与测试台。
- `asset.py`：与拓扑无关的参数展开、原理图生成、原生导出及连接核对。
- `run_models.py`：真实 Responses 工具循环、固定预算、完整 API 原文、不可变源快照、正式冻结。
- `validate.py`、`validation/`：参考电路、违规提交对照和原始波形交叉检查。
- `upstream/`：固定版本上游题目、参考电路、测试台、镜像信息与来源哈希。
- `assets/`：从上游固定镜像提取的真实 SKY130 模型、便携 Xschem、原生 Gawk 及原始归档。
- `reference/`：参考资产，仅用于校准，从未通过工具暴露给受测模型。
- `runs/`：模型开发轨迹、API 请求/响应、逐轮源码、实际网表、仿真日志、波形和冻结验收。
- `latest_run.json`：最近一次真实 API 测试。

使用现有 `runtime/python/Scripts/python.exe` 和 `benchmark/assets/Spice64/bin/ngspice_con.exe`。
模型只有声明的文件与仿真工具，不执行模型提供的 Python/Tcl/任意 shell。
参考电路通过 8/8 电气验收；违规指令、行为源、超电容预算等有独立失败对照。30 份负载阶跃原始波形经过独立 NumPy 采样核查。

正式协议保存在每次运行的 `protocol.json`。评测器、题目和测试台的哈希在调用模型之前固定。所有开发仿真和正式仿真均由真实 ngspice 执行。
