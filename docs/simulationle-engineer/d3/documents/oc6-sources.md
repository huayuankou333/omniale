# 来源与许可边界

1. WDH OC6 Phase Ib，DOI 10.21947/1775070。元数据与四份附属PDF来自官方数据集：
   https://wdh.energy.gov/data/oc6/oc6.phase1b
   元数据接口：https://wdh.energy.gov/api/datasets/oc6/oc6.phase1b
2. Wang et al., *OC6 Phase Ib: Validation of the CFD predictions of difference-frequency wave excitation on a FOWT semisubmersible*, Ocean Engineering，DOI 10.1016/j.oceaneng.2021.110026。
   作者接受稿：https://www.osti.gov/servlets/purl/1881411 。Table 1/2/7作为数值来源；PDF原文保存。接受稿的公共访问不等于自行添加CC许可。
3. Robertson et al., *OC6 Phase Ib: Floating Wind Component Experiment for Difference-Frequency Hydrodynamic Load Validation*, Energies 14, 6417，DOI 10.3390/en14196417。使用WDH提供版本，保留原文版权/许可说明。
4. Fowler/UMaine, *1/50-scale DeepCwind Semi-Submersible Component Wave Testing*, 21-47-1860 Rev0, 2021-04-05；及NREL最终数据格式说明，来自WDH附属文件。没有假定全部原始数据可自由再许可。
5. Robertson et al., *Definition of the Semisubmersible Floating System for Phase II of OC4*, NREL/TP-5000-60601：
   https://docs.nlr.gov/docs/fy14osti/60601.pdf 。用于平台几何、质量、系泊与原始建模局限。
6. OpenFAST/r-test，固定commit **dd5feaaaa500ba7283140107806300d551cff0a7**：
   https://github.com/OpenFAST/r-test/tree/dd5feaaaa500ba7283140107806300d551cff0a7
   Apache-2.0 LICENSE原样保留；仅提供所需OC4源输入/水动力数据，不含原版求解输出；例子配置不是本题完整可运行解，引用依赖需自己适配。
7. OpenFAST HydroDyn 官方文档（访问2026-11-16）：
   https://openfast.readthedocs.io/en/main/source/user/hydrodyn/index.html 。用于软件接口/适用范围，不作为物理验证结果。

具体每个下载文件的URL、路径、bytes与SHA256见 `sources/asset_manifest.json`。所有原创海况/约束均在相应JSON标注。上传到用户服务器用于研究；若后续公开网页，应保留作者归属，并按各源许可决定是否镜像整篇PDF。当前没有发布网页。
