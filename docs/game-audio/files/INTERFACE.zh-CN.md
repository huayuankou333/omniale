# 引擎接口与玩法

Godot 4.5.1，兼容渲染器。保留 `main.gd`、`main.tscn` 和 `project.godot` 原样，声音代码放在 `audio/`，资产可放 `assets/`，可以增加声音节点、总线、配置和其他声音相关文件。

## 玩法

目标是修好两台设备，打开隔离门，到右后方出口标记完成任务。WASD 移动，Shift 跑，Space 跳，J/鼠标左键按住再松开操作工具，1/2 测试对应设备，E 操作门，P 暂停，R 重置，Esc 退出。

设备测试后逐渐升速，未修复设备连续工作超过 5.5 秒会故障停转，再按对应数字键可重试。工具蓄能 1.15 秒后可以释放，靠近设备所在横向范围、站在设备前方且设备转速达到 0.55 时有效；有效脉冲会重置故障计时，累计两次后该设备稳定工作。持续蓄能到 2.65 秒会过热。两台设备均修好后门解锁。屏幕显示实际状态与进度。

以上是玩法规则，不能替代参考试玩中的声音判断。素材用途、具体声层、响度、音高和音频过渡不包含在接口里。

## 声音入口

```gdscript
extends Node
func setup(world: Node3D) -> void:
    pass
func update_state(state: Dictionary, events: Array) -> void:
    pass
func shutdown() -> void:
    pass
```

主程序创建声音节点后调用 `setup`，每个实际逻辑帧调用 `update_state`。手动模式使用实际 dt（上限 0.05 秒），回放固定 30 Hz。

| 状态 | 语义 |
|---|---|
| frame / time / dt | 回放帧、玩法累计时间、帧间隔；暂停时 time 停止，frame 仍推进以读取后续恢复输入 |
| paused | 当前是否暂停 |
| pilot | 玩家 position、moving、speed、grounded、phase、zone |
| unit | 自主单元 position、speed、phase、zone，独立于玩家 |
| tool | mode（idle/charging/ready/cooling）、charge、cooldown |
| bulkhead | position（0 关闭，1 打开）、direction（-1/0/1） |
| machines | 两个字典，各含 id、position、on、rpm（0–1）、timer、fault、repairs（0–2） |
| powered / completed | 供电恢复、目标完成状态 |
| view_right | 当前相机在世界中的右方向 Vector3，用于可选的空间投影 |

phase 与可见步态同源，不是音效事件；zone 是 polymer/alloy。世界位置均为 Vector3。相机有两个可能视角，声源不应写死在屏幕一侧。

本帧客观事件：launch、contact（impact/zone）；trigger_down、abort（reason/charge）、discharge（charge/valid/target）、thermal_limit；machine_switch（id/on）、machine_fault（id）、receiver_result（id/repairs）；mechanism_locked、mechanism_direction（direction/position）、mechanism_limit；power_restored、mission_complete。

事件提供已经发生的玩法事实，不是声音事件表。持续状态和声音退出应通过当前状态维护。不得根据回放名称、绝对帧号或私有文件恢复声音。

暂停期间如果松开工具，恢复时玩法会按当前按键状态立即处理松开；暂停前蓄能不足则取消，已就绪则按正常释放规则处理。声音模块跟随恢复帧给出的状态和事件，不自行补放暂停期间的声音。

## 回放与录制

JSON 有 frames、start_x、start_z、camera、unit_phase_offset 和 commands。commands 按 frame 更新 x/z、run、jump、fire、gate、m1、m2、pause；未出现的控制保持原值，按钮按下和松开用两条命令。可以自行新增开发回放。

```bash
python tools/render.py --project project --replay input/development-replay.json --output /workspace/submission/preview/development.mp4
```

使用真实 Godot Movie Maker 同时录制画面和声音，输出 MP4 与同源 48 kHz PCM WAV。不要修改录制工具后期加声。正式验收使用组织者的录制副本。
