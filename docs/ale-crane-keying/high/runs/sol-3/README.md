# 白鹤原视频 → 纯绿背景

## 正式交付
- `output.mp4`：DaVinci Resolve 原生渲染的 H.264 成片，1280×544，24 fps，241 帧，10.041667 秒，无音频。
- `project.drp`：本次独立工程的原生导出，可导入后继续编辑、调整遮罩和重渲染。
- `final_fusion.comp`：额外提供的最终 Fusion 图文本快照，便于审阅节点与参数；正式工程以 DRP 为准。

时间线为 `Crane_Green_Master`，起始时间码 00:00:00:00，仅使用完整的 `input/media/input.mp4`。素材引用保留在工程媒体池和 MediaIn 中；移动工程到其他机器后，请将该素材重新链接到原视频。`input.png` 只用于观察目标外观，没有作为视频或主体替代素材使用。没有重定时、冻结、画面位移、替代主体或裁去难帧。

## 方法与主要节点
1. **MediaIn1 → SquarePixelInterpretation**：保留整个 1280×544 像素画布，Crop 偏移为零、尺寸不变，仅将源文件约 0.991667 的 PAR 元数据重解释为方形像素，避免合成/输出自动比例匹配影响像素位置。
2. **CraneEnvelopeFullLegs / MotionEnvelopeMatte**：原生 Polyline 垃圾遮罩，包含整个白鹤运动范围，排除远处中性云层。
3. **Animated_WingGarbageSupport**：根据实际解码帧记录的 41 个姿态关键帧（每 6 帧一组），使用原生 BezierSpline 数值动画控制下翼外围包络。包络留有约 18 像素横向扩展及 30 像素额外下缘余量；后翼区域另有安全保留。该节点只限制背景候选区域，不生成轮廓或替换原始运动。
4. **SkyChromaticMatte**：原生 Custom 通道数学软键。蓝差为 `B-min(R,G)`，主要软过渡区间 0.010–0.043；联合暗羽、亮羽保护。亮部保护区间约 0.86–0.96。喙部增加局部亮度软键以保留受天空蓝污染的细尖，腿部区域增加亮度筛选以去除邻近中性亮云。RGB 始终来自原视频。
5. **HighConfidenceCore → CoreMatte_IslandRemoval → RestoreFeatherEdgeSupport**：高置信 alpha 核心映射 0.94–0.99，轻度腐蚀 -0.0017、再扩展 +0.004（Fusion 归一化 Amount），用来拒绝孤立云斑。其结果只是软键的支持范围，不直接替代最终轮廓；细黑羽、腿和头颈有独立保护分支。
6. **FeatherSafe_FinalRGBA → CraneOverGreen → MediaOut1**：最终预乘 RGBA 通过原生 Merge 合成到 `PureGreen_00FF00`，Background RGBA 精确设为 (0,1,0,1)。

主要节点均附有 Comments，公式、静态多边形及数值动画都保存在工程内部，不依赖外部抠像模型、图像序列或脚本运行。

## 实际检查与局限
已多轮渲染并查看真实导出帧，覆盖首尾、约四分之一秒间隔的姿态和若干快速拍翼过渡帧；对喙尖、两腿、薄翼、灰羽孔洞和云块残留进行了修正。最后还对编码输出做了实际 RGB 抽检：空背景采样为 (0,252,0)，属于本次 H.264/视频色彩量化的小偏差，工程合成背景仍是 #00FF00。

源片本身为有损编码、且白鹤已与天空合成。非常细的羽端、脚趾及运动模糊边缘仍可能有轻微软化、亚像素色边或少量边缘透明度损失；本结果不宣称能无损恢复原始合成前的 alpha。没有大面积天空或云层保留。

目录内 `test_*.mp4`、`diagnostic_source.mp4` 和 `working_inspection.comp` 是过程诊断文件，不属于正式成片；请以 `output.mp4`、`project.drp` 和本说明为交付入口。
