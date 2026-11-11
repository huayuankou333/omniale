# 将白鹤抠像复现加入 ALE 汇总站

展示页：https://huayuankou333.github.io/omniale/ale-crane-keying/

目标仓库：wang-jiahao/wang-jiahao.github.io，分支 master。补丁基于提交 37b77f676d14c425374ae0587c3f61935e4f9e29。

修改两处：ale-reproduction/index.html 新增第4张案例卡并更新数量；ale-reproduction/cases.json 增加同一案例和两模型各三次统计。封面直接引用已发布展示页的真实输入/输出拼图，其他案例保留。

在目标仓库执行：git apply --check ale-reproduction-entry.patch，然后 git apply ale-reproduction-entry.patch。若源站在此之后有更新，请只合并新增案例条目和数量/描述改动。ZIP 内同时提供完整更新文件便于查看；不要覆盖后续他人的修改。

当前凭据只能读取汇总站仓库，创建 fork 返回 GitHub HTTP 403 Resource not accessible by personal access token；因此本包尚未推送或合并到汇总站，也没有可用PR。站点维护者合入补丁后，入口链接即指向已经上线的独立展示页。

比较设置：ALE原生规则，Astra替代默认GPT-5.4软裁判，Resolve API桥接。六次全部纳入，均值0.5099542809009429 / 0.18569642812967085，满分1。
