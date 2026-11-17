# 来源、用途与许可

1. Strazisar, Wood, Hathaway, Suder. Laser Anemometer Measurements in a Transonic Axial-Flow Fan Rotor. NASA TP2879, 1989, NTRS19900001929. https://ntrs.nasa.gov/citations/19900001929 。主实验与几何来源；PDF pp38–40对应印刷pp34–36的表III/IV。完整220页PDF保存。
2. HiOCFD4 C2 NASA Rotor67，Cenaero。https://how4.cenaero.be/content/c2-nasa-rotor-67 。两种间隙状态STEP/Parasolid下载档案已保存；页面公开但未见明确开源/再许可条款。本包用于用户研究服务器，后续公开镜像CAD须保留归属并确认权利。
3. Dang, Evaluation of 3D Inverse Code Using Rotor67 as Test Case. NASA/CR-1998-206994, NTRS19980017285. https://ntrs.nasa.gov/citations/19980017285 。说明三维负荷分配/逆向改形研究背景；不是本题参考解，其原设计工况与假设不可直接移植。
4. The Effect of Ultrapolish on a Transonic Axial Rotor, NTRS20050196726. https://ntrs.nasa.gov/citations/20050196726 。表面粗糙度与60/80/100%转速影响的研究背景；不同实验活动，不与TP2879混成同一验证集。
5. Gmsh官方文档 https://gmsh.info/doc/texinfo/ ，用于OCC/CAD和网格接口。实际构建使用服务器gmsh4.13.1，派生检查不是仿真。
6. SU2官方配置模板 https://github.com/su2code/SU2/blob/master/config_template.cfg ，供求解者查阅可压缩旋转/透平机械接口；本包不将动态master代码作为冻结求解器，不承诺SU2预装。

每个下载资产URL、字节数和SHA256见sources/asset_manifest.json。NASA原始文件版权声明保持不变，公开访问不等于统一CC许可。所有原创要求已明确标注，不暗示NASA认可或认证。未使用第三方学生仓库结果作为参考答案。
