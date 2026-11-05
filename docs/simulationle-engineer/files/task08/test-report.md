# Task08：GPT-6 Luna 与 GPT-6.1 Sol 实测报告

测试日期：2026-11-05（北京时间）。使用用户指定服务注册的 `gpt-6-luna` 与 `gpt-6.1-sol`；以下为实际 agent 提交经官方 Linux Docker verifier 得到的成绩。

固定源版本：`c6bf572283b5453c0ee76eaa3054f23d691e433d`。全部 307 个原始源文件保持不变。

两个模型统一使用 Harbor 0.21.0 的原生 Codex agent、Codex CLI 0.118.0、high reasoning、公开英文题面与组件。开发上限 7200 秒，评分上限 5400 秒，每个容器 4 CPU / 4096 MiB；仅允许访问指定模型 API。每模型仅 1 个有效 trial，成绩不是多次平均或成功率估计。

| 模型 | 官方得分 / 100 | 门槛限制 | 开发时间 | Shell 命令数 | 输出 token |
|---|---:|---|---:|---:|---:|
| gpt-6-luna | 15.00 | 触发 | 5.63 min | 24 | 13421 |
| gpt-6.1-sol | 54.05 | 未触发 | 68.77 min | 87 | 98399 |

Luna 的原始加权分为 37.96/100，但 `S1.structure` 未通过，按原版规则封顶为 15 分。只读诊断显示四个轮轴中心距离最近结构件约 0.19 m，超过 0.005 m 阈值。

Sol 通过结构门槛；官方货架目标通过 62/72，其中 Panda 为 24/24、UR5e 为 22/24、xArm7 为 16/24。两模型的最终静态稳定贡献均为 0；Sol 的动态场景 C 也为 0，因此它仍有明显工程性能缺口。Sol 自报的 72/72 是其开发期自测，不能代替带进程隔离及响应时限的官方验收。

Oracle 参考解在同一服务器的官方得分为 **75.64/100**，单独列示，不属于受测模型成绩。

| 模型 | 物理有效性（15） | 设计效率（35） | 静态稳定（15） | 动态稳定（20） | 货架控制（15） |
|---|---:|---:|---:|---:|---:|
| gpt-6-luna | 12.00 | 21.56 | 0.00 | 4.40 | 0.00 |
| gpt-6.1-sol | 14.25 | 17.60 | 0.00 | 12.20 | 10.00 |

分项为原版各阶段的加权贡献；总分还应用原版有效性门槛。逐检查点取三种机械臂最低值，因此分项不能理解为三臂平均表现。

| 检查点 | 含义 | Luna 原始检查点值 | Sol 原始检查点值 |
|---|---|---:|---:|
| S1.load | 模型加载 | 1.0000 | 1.0000 |
| S1.inertia | 惯量有效性 | 1.0000 | 1.0000 |
| S1.structure | 结构连接 | 0.0000 | 1.0000 |
| S1.mecanum | 麦克纳姆全向运动 | 1.0000 | 0.7500 |
| S1.equilibrium | 初始平衡 | 1.0000 | 1.0000 |
| S3.still_valid | 设计仍满足有效性 | 0.0000 | 0.0000 |
| S3.resource_constraints | 资源约束 | 1.0000 | 1.0000 |
| S3.design_efficiency | 设计效率 | 0.5255 | 0.3456 |
| S3.reach_preserved | 保持机械臂工作范围 | 1.0000 | 1.0000 |
| S3.reach_beyond | 越过底盘的工作范围 | 1.0000 | 1.0000 |
| S3.battery_onboard | 电池安装 | 1.0000 | 1.0000 |
| S3.static_margin | 静态稳定裕度 | 0.0000 | 0.0000 |
| S5.testB | 动态场景 B | 0.0989 | 0.7133 |
| S5.testC | 动态场景 C | 0.0000 | 0.0000 |
| S5.testD1 | 动态场景 D1 | 1.0000 | 0.6667 |
| S5.testD2 | 动态场景 D2 | 0.0000 | 1.0000 |
| S5.testE | 动态场景 E | 0.0000 | 0.6688 |
| S7.pick_compat | 1 kg 货架控制 | 0.0000 | 0.6667 |
| S7.payload_margin | 2 kg 货架控制 | 0.0000 | 0.6667 |

检查点值的满分为 1；各项权重不同，不能直接平均。

| 模型 | 机械臂 | 1 kg 成功 / 实际试验数 | 2 kg 成功 / 实际试验数 | 确定性检查 |
|---|---|---:|---:|---|
| gpt-6-luna | panda | 0/12 | 0/12 | True |
| gpt-6-luna | ur5e | 5/12 | 5/12 | True |
| gpt-6-luna | xarm7 | 2/12 | 2/12 | True |
| gpt-6.1-sol | panda | 12/12 | 12/12 | True |
| gpt-6.1-sol | ur5e | 11/12 | 11/12 | True |
| gpt-6.1-sol | xarm7 | 8/12 | 8/12 | True |

目标试验为 12 目标 × 2 负载 × 3 机械臂，另有各臂首目标重放。如果提交未通过加载或其他前置检查，不能把未执行的目标算成已测 0/72。

## 失败与产物证据

### gpt-6-luna

- 原始加权分：37.96/100；最终官方分：15.0/100。
- 官方门槛失败：`["S1.structure"]`。
- 官方顶层 errors：`[]`；基础设施异常标记：`False`。
- 货架失败原因计数：`{"pressed into the shelf": 58}`。
- 未满分检查点：`{"S1.structure": 0.0, "S3.still_valid": 0.0, "S3.design_efficiency": 0.5255, "S3.static_margin": 0.0, "S5.testB": 0.0989, "S5.testC": 0.0, "S5.testD2": 0.0, "S5.testE": 0.0, "S7.pick_compat": 0.0, "S7.payload_margin": 0.0}`。
- 评分原文：[report.json](luna/report.json)。

| 机械臂 | 官方失败原因 | 控制器错误详情 | 数量 |
|---|---|---|---:|
| panda | pressed into the shelf | — | 24 |
| ur5e | pressed into the shelf | — | 14 |
| xarm7 | pressed into the shelf | — | 20 |

最终资产（保持模型原样；SHA256 见 SUMMARY.json）：

- manifest.json（完整本地归档），156 bytes。
- controller.py（完整本地归档），4320 bytes。
- robot.xml（完整本地归档），37279 bytes。

评分后的只读结构诊断（调用原版检查器，未修改提交或官方得分）：

| 机械臂 | 结构检查 | 轮组最大表面间隙 / m | 轮轴中心最大间隙 / m |
|---|---|---:|---:|
| panda | 失败 | 0.09035 | 0.19000 |
| ur5e | 失败 | 0.09035 | 0.19000 |
| xarm7 | 失败 | 0.09035 | 0.19000 |

原版阈值分别为 0.05 m 和 0.005 m。完整诊断（完整本地归档）。

官方评分器生成的提交预览：

!gpt-6-luna 提交预览（完整本地归档）

模型结束时的原文：

```text
Created both submission files in `/logs/artifacts/`:

- `robot.xml` — compact 2020-profile chassis, rigidly mounted 10 kg battery, direct-child `arm_mount_site`, preserved mecanum wheel assemblies, and the preview Panda subtree.
- `controller.py` — deterministic wheel-position feedback and staged arm IK for shelf entry and target holding.

`scene.xml` compiles in MuJoCo 3.5.0. I verified the required wheel/roller names and mount-site parent, and ran a Panda simulation sanity check. I did not run the full three-arm, 12-target evaluation.
```

### gpt-6.1-sol

- 原始加权分：54.05/100；最终官方分：54.05/100。
- 官方门槛失败：`[]`。
- 官方顶层 errors：`[]`；基础设施异常标记：`False`。
- 货架失败原因计数：`{"pressed into the shelf": 2, "controller fault": 8}`。
- 未满分检查点：`{"S1.mecanum": 0.75, "S3.still_valid": 0.0, "S3.design_efficiency": 0.3456, "S3.static_margin": 0.0, "S5.testB": 0.7133, "S5.testC": 0.0, "S5.testD1": 0.6667, "S5.testE": 0.6688, "S7.pick_compat": 0.6667, "S7.payload_margin": 0.6667}`。
- 评分原文：[report.json](sol/report.json)。

| 机械臂 | 官方失败原因 | 控制器错误详情 | 数量 |
|---|---|---|---:|
| ur5e | pressed into the shelf | — | 2 |
| xarm7 | controller fault | controller response timeout | 8 |

原版控制器时限为启动 30 秒、后续每次回复 2 秒、worker 总 CPU 60 秒。上述响应超时记录的仿真时间均为 0 秒。分数按原版控制器验收失败计入；官方报告未将其标记为评分器崩溃。

最终资产（保持模型原样；SHA256 见 SUMMARY.json）：

- manifest.json（完整本地归档），156 bytes。
- controller.py（完整本地归档），15140 bytes。
- robot.xml（完整本地归档），42570 bytes。

官方评分器生成的提交预览：

!gpt-6.1-sol 提交预览（完整本地归档）

模型结束时的原文：

```text
Submitted:
- `/logs/artifacts/robot.xml:1`
- `/logs/artifacts/controller.py:1`

The shared base uses unchanged mecanum components, a low-mounted 10 kg battery, and **4.14 m of 4040 profile**. Its footprint is approximately **0.559 × 0.559 m**; assembled masses including the adapter are **41.14 kg Panda, 45.44 kg UR5e, and 35.76 kg xArm7**, excluding payload.

**Local validation:** MuJoCo 3.5.0 compilation succeeds. All **72 trials**—three arms, twelve targets, and both payloads—pass the local checks, with at least **5.02 s continuous holding**, positive stability margins, and shelf forces below **2 N**. Fresh-process action-stream replays match for every arm. These are local results, not official verifier scores.
```

## 运行环境与重试记录

保留 2 次排除出模型评分的基础设施尝试：首次为 Harbor 受控网络阻断 Docker DNS，第二次为 Codex 在 /tmp 下未能建立 apply_patch helper。修复后，两模型均从公开空白工作区重新开始并获得完整预算。没有人工修改模型资产，也没有择优挑选多次有效成绩。

最终环境补齐官方 Codex 二进制、其 bundled ripgrep 和标准 apply_patch symlink。Harbor 网络适配只允许在 API allowlist 阶段向服务器配置的两个 DNS 解析器发送 UDP/53；评分器维持 no-network。指定网关以 HTTP/SSE 连接，禁用不兼容的 WebSocket。

原题、物理参数、组件、控制器限制、评分器与阈值均未调整。镜像、源文件哈希、隔离探测、完整 agent 轨迹及排除尝试均保存在 evidence 中。API key 与 SSH 密码不写入交付文档；导出时对日志进行确切 key 字符串检查。

结果包 SHA256：`f8a3f8b1daf07105626b43561910dff901bdd98c44362c18643630cbcb47b360`。

机器可读原始结果见各模型 report.json；完整证据目录见本地 validation_models/evidence；官方运行配置（完整本地归档）。
