# 6.2sol 文稿语义内容覆盖初评

初步参考信息覆盖分：**65.8/100**。这不是整题总分，也不是已测得准确率P后的原规则A项得分。

比较对象为官方专业AD文稿与模型交付的ad_script.json。本次由评测助手逐项判读语义对应关系，在服务器Docker中计算和留存证据；未调用Qwen。尚未对实际播报独立转写，故准确名称为“文稿对比初评”。

沿用原有19个参考片段等权、片段内部事实等权的设置，27项事实均未增加或删除。

`R = Σ[cᵢⱼ / (19 × nᵢ)]`，`初分 = 100R`；c为完整覆盖1、部分覆盖0.5、未覆盖0。

精确加权覆盖率为 `25/38`，即 `65.789474%`；15项完整、6项部分、6项未覆盖。计分使用权重，不把27项简单平均。

同义改写、拆合句、稳定人物指代可以得满分。非核心光照、树木、家具修饰不单独扣分；动作及人物施受关系须保留。同场景但不同动作不算覆盖。

## 逐项对照

|事实|参考内容|覆盖|候选句|判定理由|
|---|---|---:|---|---|
|R01-F01|阳光照在积雪山峰上。|1|ad-001: Snow streaks a mountain ridge beyond bare trees.|积雪山脊已明确表达；阳光作为非核心光照修饰，本次不单独扣分。|
|R01-F02|主角望向山景。|1|ad-001: Snow streaks a mountain ridge beyond bare trees.<br>ad-002: A man in black looks out.|相邻句先建立山景，再交代黑衣男子望出去，可承接为望向山景；不要求姓名Joel。|
|R02-F01|主角与家人在厨房准备聚餐。|1|ad-003: The kitchen bustles.<br>ad-004: A seasoned turkey sits in a foil pan.<br>ad-005: The family works at the counters.|厨房、待制作的火鸡、家人在料理台忙碌，合起来覆盖家人准备聚餐的核心事件。|
|R03-F01|一栋灰色房子坐落在落叶树木之间。|1|ad-006: He runs up to the gray house.|明确灰房；未说树木环境，但本次按主要静态对象计覆盖，不将非核心环境修饰另作扣分。|
|R04-F01|主角用电动手持搅拌器处理面团。|0|ad-008: A splash in the blue bowl.|只说蓝碗中有水花，没有电动搅拌器或搅拌动作；同场景不等于同事件。|
|R05-F01|主角切草莓。|1|ad-009: He trims strawberries.|修切草莓与切草莓在本次核心动作标准下接受为同义表达；此处不判断播报时机。|
|R06-F01|车辆驶过小镇。|0|ad-011: Brick shops line the street.|说街边砖砌店铺，没有车辆经过的事件。|
|R07-F01|主角与家人面对镜头微笑。|0.5|ad-012: He steps in, smiling.|只覆盖主角微笑，缺少家人共同面对镜头；167秒另一场景的family smiles不补此项。|
|R08-F01|家人在餐厅落座。|0.5|ad-014: Inside a cafe, two men move to a table by tall windows.|覆盖餐饮场所、两人走向餐桌，未交代家人落座；移向桌子不完全等于坐下。|
|R08-F02|主角查看相机中的照片。|0.5|ad-015: One checks his camera.|检查相机只覆盖操作相机，未明确查看其中照片。|
|R09-F01|主角在唱片店翻看唱片。|1|ad-016: They browse bins of records.|翻看唱片箱覆盖在唱片店浏览唱片。|
|R10-F01|主角向同行者展示一张Michael Jackson的Thriller唱片；专名是否必须辨识须核对原片。|0.5|ad-017: The man in black lifts Michael Jackson's Thriller.|正确提到主角举起Thriller，但未交代向同行者展示的关系；不额外要求姓名。|
|R11-F01|他们布置用餐桌。|0|ad-018: They measure in ice cream pints.<br>ad-019: The trifle sits among gold cups marked with names.|冰淇淋量尺及摆好的杯子甜点均未描述布置餐桌这一动作；参考起点不当精确镜头时间。|
|R12-F01|有人给聚餐食物拍照。|0|ad-019: The trifle sits among gold cups marked with names.<br>ad-020: Heads bow in prayer.<br>ad-021: The family eats around the table.|没有给餐食拍照的动作；餐桌物品、祈祷、吃饭不替代拍照。|
|R12-F02|家人围桌祈祷。|1|ad-020: Heads bow in prayer.<br>ad-021: The family eats around the table.|低头祈祷与同场景围桌用餐的相邻句覆盖餐前祈祷。|
|R12-F03|家人开始吃饭。|1|ad-021: The family eats around the table.|明确家人围桌吃饭。|
|R13-F01|主角坐在露台栏杆上。|1|ad-023: He sits on the deck rail.|明确主角坐在露台栏杆。|
|R13-F02|他的影子投到房子外墙上。|1|ad-022: A shadow falls across the siding.<br>ad-023: He sits on the deck rail.|外墙板上的影子与紧接的主角栏杆坐姿可作同场景承接，接受为该视觉构图的覆盖。|
|R14-F01|主角与同行者在屋内桌前一起使用笔记本电脑编辑。|0.5|ad-024: A laptop shows a video editing timeline.<br>ad-025: The two sit side by side.|覆盖两人并坐和笔记本上的视频编辑时间线，未明确两人在操作编辑，给予部分覆盖。|
|R15-F01|主角在沙发附近的茶几上收拾行李。|1|ad-029: Barefoot, he tucks folded pants into a black duffel.|把折叠裤装入行李包完整覆盖收行李核心动作；茶几、沙发的位置不单独扣分。|
|R16-F01|主角站在落叶树林中望向雪山。|1|ad-030: The young man in black again looks out over the snowy ridge.|明确同一主角再次望雪山；落叶树林作为环境修饰未另行扣分。|
|R17-F01|画面出现Thanks for watching；文字可读性及优先级待核对。|1|ad-031: A card reads, “Thanks for watching.”|明确读出Thanks for watching。|
|R17-F02|主角从露台栏杆跳下并翻滚。|1|ad-032: He drops from the rail and rolls on the grass.|明确从栏杆下到草地并翻滚，接受drops与hops的核心动作等价。|
|R18-F01|同行者跑近并拍打主角背部。|0.5|ad-033: A man rushes him.|覆盖跑近主角，缺少拍背的接触动作。|
|R19-F01|两人嬉闹摔跤。|1|ad-034: The man in red clings to his waist.<br>ad-035: They wrestle out of view.|缠住腰部和wrestle覆盖两人嬉闹摔跤；此处不判断描述是否太晚。|
|R19-F02|主角用手臂环住同行者的头。|0|ad-034: The man in red clings to his waist.<br>ad-035: They wrestle out of view.|未说主角环住同行者头部；他人抱腰不能替代此动作或交换施受关系。|
|R19-F03|主角把同行者抱起。|0|ad-034: The man in red clings to his waist.<br>ad-035: They wrestle out of view.|未说主角把同行者抱起。|

## 主要失分

- 完全缺少：电动搅拌、车辆经过、布置餐桌、给餐食拍照、环头动作、抱起同行者。
- 部分覆盖：全家面对镜头微笑、餐厅落座、查看相机照片、向同行者展示唱片、两人使用电脑编辑、跑近并拍背。
- 已覆盖：开头雪山和主角、家人备餐、草莓处理、唱片浏览、祈祷与吃饭、栏杆与影子、收行李、回望雪山、结尾文字及跳下翻滚等。

## 分数边界

这次只回答“参考信息在候选文稿中覆盖了多少”。参考未提到的新增描述不自动算错，也不因多写句子加覆盖分。

原A项还要核验候选全部断言的画面/原声依据得到P，再计算45×5PR/(4P+R)。本次P未测，不用假设P=1凑出A项分数。B/C/D及整题总分均不填。

参考事实尚未冻结，专业起点只作定位，不当精确事件时间。不能用167秒的另一次微笑补59秒的事件，亦未据参考起点计算早晚扣分。

未完成独立听审，未核验自然度、可懂度和对白遮挡。本次未进行新的原片视听核查或下载；提交封存校验和在评测前后保持一致。

完整逐项数据、输入SHA256及计算结果见TEXT-CONTENT-PRELIMINARY.json。
