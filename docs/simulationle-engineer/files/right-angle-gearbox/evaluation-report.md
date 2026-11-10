# 直角齿轮箱：公开契约复测

版本：public-contract-v2；运行：20261109T143444Z；状态：completed。

在首轮题面公开三轴有效轴段、2.2 mm 半径／4.4 mm 直径、分轴启发式、Python 内置函数及导入白名单，并提供只读的静态兼容检查工具。原始传动目标、评分器、软件镜像与预算保持一致。
正式评分仍只执行冻结的自包含 final.py，没有改成 STEP 交付。旧轮次完整保留，各模型本轮均从空白目录开始。
共同预算：2 小时、36 回复、96 工具、98,304 累计输出 token、单次 32,768、medium、8 CPU／12 GiB、单命令 180 秒、最多 3 次正式快照。内部建模及公开静态检查可在共同预算内反复执行。
参考解新增一次验收：0.977125677，与旧轮五次一致；公开检查工具及执行限制对照均通过准入检查。

| 模型 | 旧功能分 | 本轮功能分 | reward | CAD 构建 | 输出转速 | 开发用时 | 回复／工具 | 原因 |
|---|---:|---:|---:|---:|---|---:|---:|---|
| gpt-6-luna | 0.000000 | 0.000000 | 0.050000 | 1 | 未进入仿真 | 4.60 分钟 | 4／4 | intersecting_bodies |
| gpt-6.1-sol | 0.000000 | 0.000000 | 0.050000 | 1 | 0.000000 rpm | 30.97 分钟 | 27／27 | Functional simulation completed |
| deepseek-v4.1-flash-1017 | 0.000000 | 0.248322 | 0.285906 | 1 | -1.780900 rpm | 18.39 分钟 | 36／35 | Functional simulation completed |

overall_score 是原版 [0,1] 连续功能分，没有官方二值通过线。reward = 0.05 × build_success + 0.95 × overall_score；0.05 不代表传动成功。

## gpt-6-luna

停止原因：explicit_finish；输出 token：1857；正式快照：1；开发中收到的公开静态诊断：2 次（读取工具源码不计入）。
冻结文件一致：True；验收副本一致：True。

该模型主动提前结束，没有用尽回复预算；本结果不能表述为用满全部预算后的能力上限。

模型结束时的交付说明：
Completed self-contained four-solid bevel-style compound gearbox model and verified it executes under the public checker with correct structure, shaft assignments and envelope. The public checker reports an intersection between the first-stage gears; no simulation evaluator was available.

API 网关并发上限导致 1 次中断；从原请求和保存点恢复，累计回复、工具、token 与已运行时间均保留，仅扣除进程暂停等待恢复的间隔。全部失败 API 记录保留；主机未修改模型设计。

冻结后静态诊断检出 1 对初始穿插，最大体积 72.159994 mm³。这是几何缺陷，与文件交付格式不同。

最终冻结交付的补充静态诊断：

```json
{
  "build_compatible": true,
  "solid_count": 4,
  "solids": [
    {
      "index": 0,
      "valid": true,
      "volume_mm3": 459.2968746989479,
      "bbox": {
        "min_x": 4.5,
        "min_y": -7.5,
        "min_z": 21.433823529411764,
        "max_x": 19.5,
        "max_y": 7.5,
        "max_z": 26.5,
        "size_x": 15.0,
        "size_y": 15.0,
        "size_z": 5.0661764705882355,
        "center_x": 12.0,
        "center_y": 0.0,
        "center_z": 23.966911764705884
      },
      "inferred_axis": "z",
      "attached_flags": {
        "input": true,
        "compound": false,
        "output": false
      },
      "assignment": "input"
    },
    {
      "index": 1,
      "valid": true,
      "volume_mm3": 719.8866920168643,
      "bbox": {
        "min_x": 13.188775510204081,
        "min_y": -10.5,
        "min_z": 7.5,
        "max_x": 17.000000000000004,
        "max_y": 10.5,
        "max_z": 28.5,
        "size_x": 3.811224489795922,
        "size_y": 21.0,
        "size_z": 21.0,
        "center_x": 15.094387755102042,
        "center_y": 0.0,
        "center_z": 18.0
      },
      "inferred_axis": "x",
      "attached_flags": {
        "input": true,
        "compound": true,
        "output": false
      },
      "assignment": "compound"
    },
    {
      "index": 2,
      "valid": true,
      "volume_mm3": 157.88751857569014,
      "bbox": {
        "min_x": 35.63265306122449,
        "min_y": -5.5,
        "min_z": 12.499999999999998,
        "max_x": 39.0,
        "max_y": 5.5,
        "max_z": 23.5,
        "size_x": 3.367346938775512,
        "size_y": 11.0,
        "size_z": 11.000000000000002,
        "center_x": 37.316326530612244,
        "center_y": 0.0,
        "center_z": 18.0
      },
      "inferred_axis": "x",
      "attached_flags": {
        "input": false,
        "compound": true,
        "output": true
      },
      "assignment": "compound"
    },
    {
      "index": 3,
      "valid": true,
      "volume_mm3": 350.1251775515572,
      "bbox": {
        "min_x": 32.5,
        "min_y": 1.659420289855072,
        "min_z": 10.5,
        "max_x": 47.5,
        "max_y": 5.500000000000003,
        "max_z": 25.5,
        "size_x": 15.0,
        "size_y": 3.8405797101449304,
        "size_z": 15.0,
        "center_x": 40.0,
        "center_y": 3.5797101449275375,
        "center_z": 18.0
      },
      "inferred_axis": "y",
      "attached_flags": {
        "input": false,
        "compound": true,
        "output": true
      },
      "assignment": "output"
    }
  ],
  "counts": {
    "input": 1,
    "compound": 2,
    "output": 1,
    "bridge": 0,
    "free": 0
  },
  "mounting_failure": "",
  "pairwise_intersections": [
    {
      "a": 0,
      "b": 1,
      "volume_mm3": 72.15999416701678
    },
    {
      "a": 0,
      "b": 2,
      "volume_mm3": 0.0
    },
    {
      "a": 0,
      "b": 3,
      "volume_mm3": 0.0
    },
    {
      "a": 1,
      "b": 2,
      "volume_mm3": 0.0
    },
    {
      "a": 1,
      "b": 3,
      "volume_mm3": 0.0
    },
    {
      "a": 2,
      "b": 3,
      "volume_mm3": 0.0
    }
  ],
  "public_envelope_satisfied": true,
  "requested_four_gear_structure": true,
  "note": "Development diagnostics only. Does not run contact dynamics or predict the official score.",
  "wall_seconds": 9.146
}
```

本模型未进入正式运动仿真；原拒绝原因不应描述为实测传动失败。

## gpt-6.1-sol

停止原因：explicit_finish；输出 token：12618；正式快照：1；开发中收到的公开静态诊断：3 次（读取工具源码不计入）。
冻结文件一致：True；验收副本一致：True。

该模型主动提前结束，没有用尽回复预算；本结果不能表述为用满全部预算后的能力上限。

模型结束时的交付说明：
Completed self-contained final.py defining four separate valid bevel gear solids with 4.50 mm bores. Matched 14:20 and 10:14 right-angle stages give an intended -0.5 overall ratio. Public compatibility checker passes all mounting assignments, envelope constraints, solid validity, and zero pairwise intersection checks. Inspected tessellated geometry and performed independent development contact-motion tests for both stages.

API 网关并发上限导致 1 次中断；从原请求和保存点恢复，累计回复、工具、token 与已运行时间均保留，仅扣除进程暂停等待恢复的间隔。全部失败 API 记录保留；主机未修改模型设计。

最终冻结交付的补充静态诊断：

```json
{
  "build_compatible": true,
  "solid_count": 4,
  "solids": [
    {
      "index": 0,
      "valid": true,
      "volume_mm3": 327.00388821770366,
      "bbox": {
        "min_x": 4.267548596581906,
        "min_y": -7.618762280868686,
        "min_z": 24.134821145038806,
        "max_x": 19.732451403418093,
        "max_y": 7.618762280868683,
        "max_z": 28.63876366843037,
        "size_x": 15.464902806836186,
        "size_y": 15.23752456173737,
        "size_z": 4.503942523391565,
        "center_x": 12.0,
        "center_y": -1.3322676295501878e-15,
        "center_z": 26.38679240673459
      },
      "inferred_axis": "z",
      "attached_flags": {
        "input": true,
        "compound": false,
        "output": false
      },
      "assignment": "input"
    },
    {
      "index": 1,
      "valid": true,
      "volume_mm3": 560.8944408958043,
      "bbox": {
        "min_x": 16.0420539697094,
        "min_y": -10.428493358266422,
        "min_z": 7.571506641733578,
        "max_x": 19.947697317672265,
        "max_y": 10.428493358266422,
        "max_z": 28.428493358266422,
        "size_x": 3.905643347962865,
        "size_y": 20.856986716532845,
        "size_z": 20.856986716532845,
        "center_x": 17.994875643690833,
        "center_y": 0.0,
        "center_z": 18.0
      },
      "inferred_axis": "x",
      "attached_flags": {
        "input": false,
        "compound": true,
        "output": false
      },
      "assignment": "compound"
    },
    {
      "index": 2,
      "valid": true,
      "volume_mm3": 67.42556385185205,
      "bbox": {
        "min_x": 32.75413322703816,
        "min_y": -5.4303143113112915,
        "min_z": 12.736224299410488,
        "max_x": 35.42601131668108,
        "max_y": 5.4303143113112915,
        "max_z": 23.263775700589512,
        "size_x": 2.6718780896429166,
        "size_y": 10.860628622622583,
        "size_z": 10.527551401179025,
        "center_x": 34.09007227185962,
        "center_y": 0.0,
        "center_z": 18.0
      },
      "inferred_axis": "x",
      "attached_flags": {
        "input": false,
        "compound": true,
        "output": false
      },
      "assignment": "compound"
    },
    {
      "index": 3,
      "valid": true,
      "volume_mm3": 129.58282867333278,
      "bbox": {
        "min_x": 32.98428775103469,
        "min_y": 3.003550900640227,
        "min_z": 10.88522362794473,
        "max_x": 47.01571224896531,
        "max_y": 5.628509148959656,
        "max_z": 25.114776372055267,
        "size_x": 14.031424497930615,
        "size_y": 2.6249582483194294,
        "size_z": 14.229552744110537,
        "center_x": 40.0,
        "center_y": 4.316030024799941,
        "center_z": 18.0
      },
      "inferred_axis": "y",
      "attached_flags": {
        "input": false,
        "compound": false,
        "output": true
      },
      "assignment": "output"
    }
  ],
  "counts": {
    "input": 1,
    "compound": 2,
    "output": 1,
    "bridge": 0,
    "free": 0
  },
  "mounting_failure": "",
  "pairwise_intersections": [
    {
      "a": 0,
      "b": 1,
      "volume_mm3": 0.0
    },
    {
      "a": 0,
      "b": 2,
      "volume_mm3": 0.0
    },
    {
      "a": 0,
      "b": 3,
      "volume_mm3": 0.0
    },
    {
      "a": 1,
      "b": 2,
      "volume_mm3": 0.0
    },
    {
      "a": 1,
      "b": 3,
      "volume_mm3": 0.0
    },
    {
      "a": 2,
      "b": 3,
      "volume_mm3": 0.0
    }
  ],
  "public_envelope_satisfied": true,
  "requested_four_gear_structure": true,
  "note": "Development diagnostics only. Does not run contact dynamics or predict the official score.",
  "wall_seconds": 12.982
}
```

已经进入原版运动仿真：输出 0.000000 rpm，目标约 −15 rpm；engaged=0.0，speed_score=0.0，direction_score=0.0。连续功能分不等于完成率，进入仿真本身也不代表目标转速达标。

原版接触仿真指标：

```json
{
  "mid_rpm": -20.997820693235685,
  "output_rpm": 0.0,
  "direction_score": 0.0,
  "speed_score": 0.0,
  "ratio_score": 0.0,
  "engaged": 0.0,
  "stop_fraction": 1.0,
  "sim_error": "",
  "input_rpm_measured": 30.00000008830165,
  "window_stop_fraction": 1.0,
  "frames": 150.0,
  "phase_b_deg": 0.0,
  "phase_c_deg": 0.0
}
```

## deepseek-v4.1-flash-1017

停止原因：response_budget；输出 token：92829；正式快照：1；开发中收到的公开静态诊断：1 次（读取工具源码不计入）。
冻结文件一致：True；验收副本一致：True。

最终冻结交付的补充静态诊断：

```json
{
  "build_compatible": true,
  "solid_count": 4,
  "solids": [
    {
      "index": 0,
      "valid": true,
      "volume_mm3": 240.87009895251094,
      "bbox": {
        "min_x": 4.289141184980485,
        "min_y": -7.574278306162594,
        "min_z": 23.761164141424974,
        "max_x": 19.710858815019513,
        "max_y": 7.574278306162594,
        "max_z": 27.251089467453866,
        "size_x": 15.421717630039028,
        "size_y": 15.148556612325187,
        "size_z": 3.4899253260288923,
        "center_x": 12.0,
        "center_y": 0.0,
        "center_z": 25.50612680443942
      },
      "inferred_axis": "z",
      "attached_flags": {
        "input": true,
        "compound": false,
        "output": false
      },
      "assignment": "input"
    },
    {
      "index": 1,
      "valid": true,
      "volume_mm3": 327.6859316291083,
      "bbox": {
        "min_x": 15.892351761309946,
        "min_y": -10.294408976625116,
        "min_z": 7.798757877071651,
        "max_x": 18.250211502179763,
        "max_y": 10.294408976625116,
        "max_z": 28.20124212292835,
        "size_x": 2.3578597408698165,
        "size_y": 20.58881795325023,
        "size_z": 20.402484245856698,
        "center_x": 17.071281631744853,
        "center_y": 0.0,
        "center_z": 18.0
      },
      "inferred_axis": "x",
      "attached_flags": {
        "input": false,
        "compound": true,
        "output": false
      },
      "assignment": "compound"
    },
    {
      "index": 2,
      "valid": true,
      "volume_mm3": 77.54134924588139,
      "bbox": {
        "min_x": 33.27755301117998,
        "min_y": -5.649692423063686,
        "min_z": 12.268669555524054,
        "max_x": 35.81535696857855,
        "max_y": 5.733668675682675,
        "max_z": 23.731330444475944,
        "size_x": 2.537803957398566,
        "size_y": 11.383361098746361,
        "size_z": 11.46266088895189,
        "center_x": 34.546454989879265,
        "center_y": 0.041988126309494334,
        "center_z": 18.0
      },
      "inferred_axis": "x",
      "attached_flags": {
        "input": false,
        "compound": true,
        "output": false
      },
      "assignment": "compound"
    },
    {
      "index": 3,
      "valid": true,
      "volume_mm3": 115.99658726892899,
      "bbox": {
        "min_x": 32.569906335725776,
        "min_y": 2.918328340999415,
        "min_z": 10.512494662050624,
        "max_x": 47.48914783182822,
        "max_y": 4.688167526126034,
        "max_z": 25.487505337949376,
        "size_x": 14.919241496102444,
        "size_y": 1.769839185126619,
        "size_z": 14.975010675898751,
        "center_x": 40.029527083777,
        "center_y": 3.8032479335627247,
        "center_z": 18.0
      },
      "inferred_axis": "y",
      "attached_flags": {
        "input": false,
        "compound": true,
        "output": true
      },
      "assignment": "output"
    }
  ],
  "counts": {
    "input": 1,
    "compound": 2,
    "output": 1,
    "bridge": 0,
    "free": 0
  },
  "mounting_failure": "",
  "pairwise_intersections": [
    {
      "a": 0,
      "b": 1,
      "volume_mm3": 0.0
    },
    {
      "a": 0,
      "b": 2,
      "volume_mm3": 0.0
    },
    {
      "a": 0,
      "b": 3,
      "volume_mm3": 0.0
    },
    {
      "a": 1,
      "b": 2,
      "volume_mm3": 0.0
    },
    {
      "a": 1,
      "b": 3,
      "volume_mm3": 0.0
    },
    {
      "a": 2,
      "b": 3,
      "volume_mm3": 0.0
    }
  ],
  "public_envelope_satisfied": true,
  "requested_four_gear_structure": true,
  "note": "Development diagnostics only. Does not run contact dynamics or predict the official score.",
  "wall_seconds": 5.663
}
```

已经进入原版运动仿真：输出 -1.780900 rpm，目标约 −15 rpm；engaged=0.0，speed_score=0.0，direction_score=1.0。连续功能分不等于完成率，进入仿真本身也不代表目标转速达标。

原版接触仿真指标：

```json
{
  "mid_rpm": -16.730603988380757,
  "output_rpm": -1.7808996877168337,
  "direction_score": 1.0,
  "speed_score": 0.0,
  "ratio_score": 0.0,
  "engaged": 0.0,
  "stop_fraction": 0.006711409395973154,
  "sim_error": "",
  "input_rpm_measured": 30.000000110747905,
  "window_stop_fraction": 0.1,
  "frames": 150.0,
  "phase_b_deg": 0.0,
  "phase_c_deg": 0.0
}
```

## 解读边界

本轮公开静态检查会增加开发反馈，与旧轮差异不仅是题面文字。因此不能将分数变化单独归因于某一个参数公开。每模型只独立运行一次，不能据此建立稳定排名。
公开原分轴规则使其可预先检查，但它仍是包围盒及径向分位数启发式。初始几何合格也不证明齿形共轭、无卡滞、输出方向和转速正确。Blender 接触代理分不等于真实强度、效率、寿命或制造认证。
保留原始分数、模型自查轨迹和冻结后补充诊断；主机没有修复或重新选择模型交付。未改变原版公式和评分源码。
