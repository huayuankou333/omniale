# Task07 来源与素材

- Task07 来源：RLE-Bench，https://github.com/RLE-Bench/RLE-Bench ，固定 commit `c6bf572283b5453c0ee76eaa3054f23d691e433d`。许可原文见 `RLE-Bench-LICENSE.txt`。
- Panda 机器人资产源于上游随附 Franka Emika Panda 模型，许可原文见 `Panda-LICENSE.txt`。
- 页面使用本项目正式 verifier 生成的原生仿真录像及抽帧；静态 preview 是公开场景渲染，不是模型分数。没有使用生成式图片替代运行证据。
- mixed-v1 的三类零件、工位和规则为 SimulationLE 改编；不代表论文原题或论文成绩。
- 页面视觉沿用 SimulationLE/Engineer 已有案例集，信息结构参考用户此前指定的 OmniALE 展示网站。网页代码独立编写。
- 六份 policy.py 为冻结时原样模型输出；对应 SHA-256 见每份分数数据与 manifest。可见工具轨迹经过字段筛选，不含系统提示和认证材料。
