# 一手来源与用途

实际下载文件、URL、SHA256和权限说明见 `sources/asset_manifest.json`。资料仅作为研究与本项目内部建题输入；原有版权和授权条件保留，不能把本题作者的原创许可套在第三方文件上。

1. **Qu, W.; Mudawar, I. (2002)**. Experimental and numerical study of pressure drop and heat transfer in a single-phase micro-channel heat sink. IJHMT 45, 2549–2565. DOI `10.1016/S0017-9310(01)00337-4`。原作者Purdue站点：[论文](https://engineering.purdue.edu/mudawar/files/articles-all/2002/2002_1.pdf)。取得17页全文。本题使用Fig.4b实验压降、Fig.7实验测温和Table 1几何；出版图数字化并非原始仪器数据。
2. **Kuiphuis, Terpstra, Wits & Rohlfs (2025)**. Thermal-hydrodynamic modeling and design for microchannel cold plates subjected to multiple heat sources. Applied Thermal Engineering 262, 125220. DOI `10.1016/j.applthermaleng.2024.125220`。[大学作者库全文](https://ris.utwente.nl/ws/portalfiles/portal/480381856/1-s2.0-S1359431124028886-main.pdf)，CC BY 4.0，15页。研究与Thales Nederland、NLR相关；本文的行业背景、压力损失/热扩散模型及适用范围是建题依据，不等于本题已取得工业认证。
3. **Kuiphuis (2024), MicroAnalytix v1**. DOI `10.17632/gwnt75p22n.1`。[作者代码](https://data.mendeley.com/datasets/gwnt75p22n/1)，CC BY 4.0。2,078,319字节ZIP，原发布SHA256 `3c1b1644909d9ee12647d94a4e5f1906b08f574d8619e27ec9d5fb4ee357a619`。可移植其MATLAB模型；未要求或提供MATLAB运行许可。
4. **Urge (2025), MIMO Cold Plate Design & Dataset v1**. DOI `10.5281/zenodo.17242451`。[作者数据](https://zenodo.org/records/17242451)，CC BY 4.0。2,270,922字节ZIP，发布MD5 `18791287b59c59f7436d8026e5c1a2d8`。包含ANSYS Fluent仿真时序与参数，缺完整CAD和项目，仅作可选研究输入。
5. **Sadir et al. (2020)**. CFD Simulation of Flow Maldistribution due to Blockage in Microstructured Heat Exchanger. DOI `10.11159/ffhmt20.176`。[一页原始摘要](https://www.avestia.com/FFHMT2020_Proceedings/files/paper/FFHMT_176.pdf)。作者研究用OpenFOAM与压降实验检查堵塞影响；当前公开文件不含数值观测，不纳入验证真值。
6. **Koolance PMP-450**。[厂家产品页](https://koolance.com/pmp-450-pump-id-13mm-1-2in)及[P-Q图](https://koolance.com/files/products/graphs/pmp-450_g2.png)。本地保留规格PDF、曲线图片、原网页快照。读取12V曲线；厂家无本题用的效率图，不自行编造。外部回路、退化因子和图读储备为原创合同输入。
7. **NIST Chemistry WebBook, SRD 69, Water**。[水物性入口](https://webbook.nist.gov/cgi/fluid.cgi?ID=C7732185&Action=Page)。本地原始TSV来自2bar、5–120°C、5°C步长的等压查询。完整查询URL存于资产清单；cp从J/(g K)转成J/(kg K)，黏度从μPa·s转成Pa·s。
8. **Hehr et al. / JPL (2020/2021)**. Hot Isostatic Pressing of Ultrasonic Additive Manufacturing Liquid Cold Plate Heat Exchangers. Article DOI `10.2514/1.A34888`；[JPL原始文稿](https://dataverse.jpl.nasa.gov/api/access/datafile/69927)，仓库DOI `10.48577/jpl.FV0SGH`。资料讨论冷板制造、泄漏、爆破和材料试验；不含本题热工验证数据。本题制造交付必须明确未覆盖的连接工艺与台架资格。

资料搜索也检查了单相/两相微通道、双层冷板和第三方仓库；与本题单相水冷不匹配、仅有稿件而无原始实验数据的条目未强行列为强制数据集。完整发现记录保留于建题工作目录research/，冻结包只包含实际使用及明确标注的可选来源。
