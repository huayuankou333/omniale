# 原论文评测对照

本目录复刻的是 DexJoCo 原环境及官方 OpenPI 测试流程，未采用 EFE 的固定初态、取消时间限制等改编。

| 项目 | 本复现采用的设置 | 主源 |
|---|---|---|
| 环境 | `bimanual_assembly`，双 Panda + 双 Allegro | `upstream/dexjoco/dexjoco/tasks/bimanual_assembly/config.py` |
| 物理 | MuJoCo 3.4.0；physics_dt=0.002；control_dt=0.02 | 环境源码与 pyproject |
| 实时时序 | 原环境每控制步尽量按 30 Hz wall pacing；渲染/计算更慢时不强行追帧 | 环境 `step()` 的 sleep |
| 终止 | 成功，或 env_step≥1500；不能把构造参数 time_limit=10 当作实际回合上限 | 环境 `step()` |
| 成功 | 销与孔底指定 geom 连续接触≥30步 | `_compute_success_metrics()` |
| rand-obj | 物体位置、yaw、桌高随机；固定名义动力学 | `configs/rand_obj/bimanual_assembly.yaml` 与 reset |
| rand-full | 上述随机化，再增加外部相机、光照和桌面纹理 | `configs/rand_full/bimanual_assembly.yaml` 与 reset |
| rand-dynamics | 不启用，论文额外实验需另列 | evaluator 默认参数 |
| 观测 | 三路224² RGB + 前46维本体信息 + 指令 | `dexjoco_openpi_env.py` |
| 推理 | 独立进程异步请求策略；30步动作chunk；replan_ratio=.8；原版时间戳对齐和重叠融合 | `eval_dexjoco_openpi.py` |
| 无新动作 | 使用原版stay继续step；不暂停仿真等待策略 | 同上 |
| 回合与种子 | 每设置50回合/seed，seeds=0,1,2 | evaluator默认50；`scripts/evaluate_pi05.bash`列出3seed |
| 主表汇总 | 每设置3个seed成功率的mean与std；同时保留sample与population std | 论文Table2；本地聚合明确列两种std |
| 完整回合数 | rand-obj 150 + rand-full 150，共300 | 上述测试计划 |
| 录像 | 原 evaluator 每回合保存三路 MP4、success/failure目录及成功数marker | 原 evaluator |

物体采样范围（米）：销xy从[-.30,-.25]到[-.25,-.20]；托盘xy从[-.30,.15]到[-.20,.25]；yaw分别±10°、±20°；桌高偏移U(0,.05)。每seed保留原随机数流，不自行对每回合重新设seed。

## 原论文成绩，非本地成绩

下表抄录论文 Table 2 的 Assembly 行，单位为成功率百分比：

| 论文模型 | rand-obj | rand-full |
|---|---:|---:|
| DP-T | 4.7±3.1 | 0.0±0.0 |
| DP-C | 3.3±1.2 | 0.0±0.0 |
| ACT | 0.0±0.0 | 0.0±0.0 |
| π0.5 | 5.3±1.2 | 0.0±0.0 |
| GR00T N1.5 | 0.7±1.2 | 1.3±1.2 |

这说明该任务对论文测试的操作策略困难，不表示 GPT coding agent 在开发预算下必然取得相同成绩。论文统计训练条件与agent开发评测的预算条件须分别说明。

`rand-obj` 与 `rand-full` 主表使用各自数据设置训练的策略。复现 π0.5 主表时分别载入官方 HF 权重的 `pi05_dexjoco_ckpt/bimanual_assembly` 和 `pi05_dexjoco_rand_full_ckpt/bimanual_assembly`，后者 OpenPI 配置名为 `bimanual_assembly_rand_full`。不能将一个权重直接测两设置后称为主表复现。

## 三种结果的边界

1. `results/verification`：环境、渲染、策略观测权限与随机重置验证，无策略成绩。
2. `results/replay_reference`（参考示范）与 `results/replay_diagnostic`（首个示范）：恢复官方human demo的初态并回放动作；这是环境诊断，不是50回合随机化测试，也不是模型成绩。
3. `results/hold_smoke*`：hold诊断策略通过原 evaluator 完整跑一个1500步回合，验证异步传输、终止、录像、marker和聚合；不属于论文基线。

只有 `--suite paper` 执行完指定设置的3×50回合且保留完整日志/录像，才报告该设置的正式成功率。两设置均完成才是完整300回合测试。公开seed与数据不构成隐藏测试集。

基础设施报错、推理子进程崩溃、超时、缺失结果marker及不完整录像目录均由 supervisor 标为无有效成绩；不会自动记为策略0分。原 evaluator 未被修改。该 supervisor 的错误检测和墙钟超时位于评测外围。

## 硬件与可比性

当前服务器未检测到 NVIDIA/CUDA；使用 CPU 物理与 OSMesa 软件渲染，可以验证并执行任务。官方 OpenPI 学习策略栈单独依赖 CUDA JAX，不能安装到 MuJoCo 的 NumPy1.26环境中。

本轮未把论文公开 π0.5 权重加载推理，也未验证 CPU 上的 π0.5 推理速度。需要完整复现论文基线成绩时，应运行独立的官方 OpenPI 推理环境，连接本仿真端，并记录设备、每次推理耗时和训练/权重版本。

异步评测对时延敏感。CPU软件渲染若使每步远慢于原30Hz wall pacing，策略每个仿真步可用的推理时间随之变化。因此“代码与随机化协议相同”不等于“硬件时序与论文相同”，CPU所得成绩不能直接宣称复现论文数字。

## 固定来源

- 论文：https://arxiv.org/html/2605.16257v1
- 项目：https://dexjoco.github.io/
- 源码commit：`8d23b0fab23b17a58c4b55f3942e17013aaf8267`
- 官方原数据：`DexJoCo/DexJoCo-Datasets-Raw`，revision `125df5c1019e97503929ef1a0ad8f90373436afa`
- 官方π0.5权重：`DexJoCo/DexJoCo-Pi05`，revision `8d253e04e1b82c452c5804273939ff7f002f217f`
- `provenance/upstream-files.json`保存全部1588个源码/资产文件SHA256；`demo.json`保存下载示范各文件SHA256。
- `provenance/requirements.freeze.txt`、`docker-image.json`记录服务器实际依赖和镜像。
