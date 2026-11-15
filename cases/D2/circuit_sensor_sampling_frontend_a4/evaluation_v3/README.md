# A4 题目构建包 — draft v0.1

本包是题面、接口、固定夹具和验收定义的构建草案；新增指标未经过可行解和负对照校准。没有启动模型试验，没有运行模拟电路求解，也没有验证生产评测链。

- `TASK.md`：可以审阅的中文完整改编题面。
- `ORIGINAL_TASK.md`：原始英文题面，字节级保留。
- `contract.json`：本次改编的唯一数值配置；原题原始代码/数值仍以 `researcher/original/tests/` 为准。
- `public/`：环境模型、测量定义、原始开发平台、器件指南。
- `starter/`：无已知可行解的提交骨架；TODO 部分必须由解题模型自行设计。
- `tools/build_benches.py`：将声明的新增工况生成 SPICE 文件与工况索引；只写文件，不运行 ngspice。
- `tools/score.py`：验收端可信结果聚合，不是完整验收程序。
- `researcher/`：原题封存、保留映射、校准计划、运行状态和原题验收 Docker 配方；不应暴露给解题模型。

生成新增平台：

```sh
python tools/build_benches.py --out /tmp/a4_benches --dut /app/circuit.spi --model /opt/sky130/continuous/sky130.lib.spice
```

输出包含固定模型副本、每个工况的 `.cir` 和 `index.json`。SPICE 路径允许空格但不能含引号/换行。生成器使用整个同一份 `circuit.spi`，没有为原题和改编题替换不同设计的入口。

原始公开平台在 `public/original_testbench/` 中逐字节保留；实际开发时复制到 `/app/testbench/`，把候选放在 `/app/circuit.spi`，再从 testbench 目录运行。不能从包内原始平台的当前相对位置直接推定可执行布局。

模型可见内容限 `TASK.md`、`ORIGINAL_TASK.md`、`contract.json`、`public/`、`starter/` 和受控开发工具。不得直接把整个研究者包挂载进 agent；尤其不能暴露正式验收代码、未来校准答案或密钥。

当前只完成构建与静态自检。新增平台的语法、极性、测量解析和数值收敛尚需实际运行校准；不能宣称已有可行解、难度合格、某模型不能满分或可直接投入正式评测。预算草案见 `budget.json`，本轮实际模型调用与模拟求解均为 0。
