# A4 拓扑、时序与测量口径

固定网络：CsP 接底板 bp 与 vinp，CsN 接 bn 与 vinn；CfP 接 voutn 与 vinp，CfN 接 voutp 与 vinn。复位开关分别短接各反馈电容；采集开关 drvp↔bp、drvn↔bn；转移开关 vocm↔bp、vocm↔bn。全部开关由 `public/fixtures/sample_switch.spi` 提供。Cs=1pF，Cf=125fF，CL=250fF，不给候选修改。传感器接口没有时钟或输出端口。

复位负反馈使采集时输入和输出靠近vocm，Cs保存 `vocm−sensor` 的电荷。转移时底板回到vocm、Cf上的变化补偿Cs电荷，因此本平台的理想目标是 `Voutp−Voutn=−8×(Vsensp−Vsensn)`。实际夹具含Ron、时钟耦合及有限增益，这些误差不能在计算目标时扣掉。校准须用独立理想夹具对照验证符号和振幅，不能从测试候选输出拟合期望值。

时钟用公开PWL生成，VT=VDD/2、VH=0的SW模型，Ron=50Ω、Roff=1e12Ω；每个模拟端到时钟固定2fF。0.1ns边沿，采集/复位/转移三相彼此按题面定义。关断阈值发生在边沿中点；45.1/46.1ns是边沿结束的保守标记。把该夹具称作固定电容feedthrough模型，不称为完整MOS channel charge injection仿真。

每周期的干扰积分窗口为相对时间[0,2]ns、[43.9,47.1]ns、[98.9,100]ns。这些窗口不覆盖5–6ns的源命令更新；跨周期端点只有零测度重复。基准传感器独立拥有同源、同R、同200fF，但没有接口负载，不将其支路电流计入功耗。每腿 `delta_v=V(sens)−V(unloaded)`，`delta_i=(V(source)−V(sens))/Rs−(V(source)−V(unloaded))/Rs`。组3检查每窗口 `max(abs(delta_v))≤1mV` 和 `integral(abs(delta_i))≤5fC`；44ns处还需≤0.25mV。绝对值积分不能用正负抵消的净电荷替代。这里包含DUT加载效应，并非只量开关尖峰。

波形文件 `wave.dat` 的首列为时间，其余列顺序见 index.json 的 vectors；wrdata使用单一scale、带列名。所有量须有限且覆盖全时段，每窗加入插值端点。读数在80ns；保持90–98ns；共模在80ns及保持窗≤25mV。建立检查在56.1–98ns连续满足9mV带，并报告最后一次出带至46.1ns之差；基于全存储步长和阈值交叉插值，不仅检查单个点。

历史分组按相同PVT/Rs键配对 `positive_history` 和 `negative_history` 两次独立从操作点开始的完整运行。8周期preamble后共同16探针的对应读数差≤1mV。任一缺失/不收敛，整个历史组失败。各序列周期0/1预热，2–23全计入精度、建立、扰动、功耗。

采集相噪声平台将reset/track固定高、transfer固定低，输入差模0；用 `.noise v(drvp,drvn) VSENSP dec 80 10 10G` 的 `onoise_total`。这只在一个静态工作点线性化，不包含周期时变噪声折叠或完整采样噪声。原题输出噪声验收照旧运行。未来若要增加采样后总噪声评分，必须在新版本中给出独立有效方法、对照与阈值，不能在看到模型结果后临时追加。

系统功耗取周期2起至24周期终点，逐源正功率再求和平均：VDD、VOCM、VSENSP、VSENSN、VRESET、VTRACK、VTRANSFER。IREF=50µA从VDD引出，已被VDD支路测量包含，不重复计数。为基准传感器提供的独立VSBASEP/VSBASEN不计入。时钟的2fF电容损耗及返回电流按各源正功率定义处理。不得以带符号净功耗抵消其他供电。

新增瞬态数值：reltol=1e−4、abstol=1e−12、vntol=1e−7、Gear2，最大步长20ps、输出步长20ps，24周期总2.4µs。20ps为100ps时钟边沿的1/5，正式校准还须10ps对照，检查脉冲峰值/积分/误差带判定对步长敏感性。原题仿真选项不得被新平台设置覆盖。
