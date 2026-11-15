# 保留映射

原源文件 instruction、tests、bench、utils、test.sh 均字节级保留；哈希见 original_identity.json。原先8项分类和early gate原样运行。加入缓冲后整个同一capless_ldo在原平台通过，不能只从新电路截取一个较容易的子电路去跑原题。

| 原难点 | 新增耦合 | 验收 |
|---|---|---|
| 全PVT稳压、分压与偏置 | 有限参考驱动和双向加载；参考trim跟随 | 原DC+新group1/2 |
| 空载100µA、≤1nF | 参考模块/缓冲也占供电；缓冲电容仍算DUT | 原IQ/器件策略+新group5 |
| 五角PSR | 参考供电也被扰动 | 原三频PSR+新group3 |
| 负载阶跃和启动 | 参考状态启动、输入回灌、耦合环路 | 原step/start+新group2/4 |

不把原100µA替换成更大预算，不把原1µs边沿或20µs恢复放宽，不把原startup删除。模型只需交付SPICE与结构化说明；不宣称早期Xschem图形资产质量已被继承。
