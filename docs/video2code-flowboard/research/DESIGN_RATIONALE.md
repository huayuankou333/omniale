# 为什么换题而不是扣旧分

旧题41.33秒。有效成绩为 Luna 67.00、Sol 93.56、Kimi 89.75；GLM N/A。Sol/Kimi 已通过绝大部分行为，只在擦除悬停反馈等细节丢分。说明任务的信息量、状态关系和持久化需求不足；只提高视觉扣分力度不能可靠区分能力。

新题选择“有绑定关系的流程图编辑”而非普通营销页。对同一图进行组合、复制、解组、图层操作和撤销分支，然后经历快照、JSON 导入与刷新，再继续编辑。一个节点的变化必须同时反映到文字、连线、选择框和历史。复制必须分配独立身份，恢复必须保留可计算的关系。表面像素相似不足以通过。

调研依据是官方 Excalidraw README 和组件 API 文档，而不是 WebCompass 题库。官方 README 列出了 arrow-binding、undo/redo、zoom/panning、开放 JSON 格式和本地优先应用；保存在本目录。选择它是因为可以固定版本、本地运行和复录，省去账号/网络依赖。

- 官方源码说明：https://github.com/excalidraw/excalidraw
- 官方组件 API：https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/excalidraw-api
- 固定 npm 包：@excalidraw/excalidraw 0.18.1；package-lock.json 保存实际依赖。
- 官方许可证：https://github.com/excalidraw/excalidraw/blob/v0.18.1/LICENSE

本次网页检索工具未返回可用搜索内容，来源通过直接读取上述官方资源核验，原始文件随 case 归档。没有把未完成的广泛网站比较写成已完成调研。

更严格的地方是：80%分值来自实际可执行断言；功能按具体 probe 二元计分；视觉跨多个固定状态；恢复后必须继续操作；进行有限的同语义参数复测；取证错误不能计模型失败。没有“任意模型最高79分”的封顶，也不改动旧分数。

不能保证四模型均≤80。如果新题仍有高分，应该将其作为有效结果保留，再设计下一版包含新的可观察工作链；不能拿既有输出反复调权直到满足阈值。当前是公开开发题，不是独立保密测试集。正式研究应另建不参与调参的任务留出集。
