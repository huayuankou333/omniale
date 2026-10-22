# gpt-6-astra · IKEA 单次交付评测

总分：95.625/100。

28 项功能检查全部通过，覆盖比较增删、独立配件、组件倍增、260/490/607 金额链和刷新恢复。视觉仍有菜单密度、缩略图数量、抽屉行距等局部差异；本试次超过80，表明现有case仍不能稳定区分更强模型。

- 执行：10.0/10.0
- 导航：15.0/15.0
- 交互：25.0/25.0
- 状态：20.0/20.0
- 视觉：25.625/30.0

视觉采用单一匿名 k3 judge；并非双模型共识或人工认证。无返修或分数封顶。

[操作轨迹](operator-records.json) · [运行录像](evaluation.mp4) · [清理说明](operator-cleanup.json)

|ID|检查点|得分|依据|
|---|---|---|---|
|E01|启动与可操作首页|2.5/2.5|首页可用；Products可进入Storage二级类别并Escape关闭；besta联想与Enter搜索保留查询|
|E02|主流程稳定|2.5/2.5|主链路无未捕获运行错误；阻断外网下六类页面主要本地资源可见|
|E03|离线资源|2.5/2.5|主链路无未捕获运行错误；阻断外网下六类页面主要本地资源可见|
|E04|本地深链|2.5/2.5|搜索、商品、购物袋本地深链直接打开并刷新成功|
|N01|两级菜单|2.5/2.5|首页可用；Products可进入Storage二级类别并Escape关闭；besta联想与Enter搜索保留查询|
|N02|搜索联想与提交|2.5/2.5|首页可用；Products可进入Storage二级类别并Escape关闭；besta联想与Enter搜索保留查询|
|N03|列表进入组合详情|2.5/2.5|从列表点击原木色商品进入s29209829对应详情|
|N04|组件跳转与返回|2.5/2.5|组件清单打开20293568并通过浏览器返回原组合|
|N05|变体本地导航|2.5/2.5|变体名称图片与s29612189本地地址同时改变|
|N06|跨页购物袋状态|2.5/2.5|离开袋到详情再从头部购物袋返回，保留两组合一柜脚490|
|I01|颜色筛选与清除|2.5/2.5|白色筛选显示87并过滤变体；清除恢复165|
|I02|价格排序|2.5/2.5|低价排序按实际价格升序，Best match恢复55/76/197/136等原次序|
|I03|双商品比较|2.5/2.5|两件正确商品价格55/76与宽高深差异实际显示|
|I04|比较增删|2.5/2.5|相似商品加入70245848形成第三列，移除00245842后仅保留60245844和70245848|
|I05|图库与弹层|2.5/2.5|缩略图主图变化，All media展示商品照片并正常关闭|
|I06|尺寸展示|2.5/2.5|Measurement有当前尺寸图及47 1/4×16 1/2×29 1/8尺寸|
|I07|组合清单|2.5/2.5|组件清单逐项显示1/4/2/1/2/2及六种正确类别|
|I08|邮编验证|2.5/2.5|abc显示无效错误；95054保存并出现在顶部和配送区|
|I09|门店库存|2.5/2.5|East Palo Alto同时更新顶部、库存及Click and collect|
|I10|评论排序|2.5/2.5|默认2/4/4星变为最低排序1/1/1星，首条改为So disappointed并有评分分布|
|S01|独立组件入袋|2.5/2.5|独立STUBBARP行数量2、金额20|
|S02|正确变体与初始总额|2.5/2.5|两行正确身份及原价产品合计260，Family优惠单列|
|S03|改数量后金额|2.5/2.5|数量改为2组合1柜脚，行金额480/10、产品合计490|
|S04|组成数量倍增|2.5/2.5|袋内六类组件2/8/4/2/4/4，独立配件仍1包|
|S05|刷新恢复|2.5/2.5|刷新保留2组合1配件490与95054和门店|
|S06|安装费联动|2.5/2.5|开安装117合计607，关闭490，数量不变|
|S07|删除与撤销|2.5/2.5|删除独立柜脚合计480，Undo恢复1包和490|
|S08|折扣码失败不改金额|2.5/2.5|无效码明确报错，商品数量和产品合计490保持|
|V01|首页与共同导航|1.875/2.5|Header black bar, IKEA logo, nav links, search pill, login text and icons all match in structure, size and hierarchy; hero collage (large left Family-price image, right cooking pan image with 'New, must-try kitchen accessories' caption, bottom two tiles) matches with identical imagery and proportions. Local differences: category chip icons differ (Winter holiday shop shows a box icon instead of the reference's tree; Beds & mattresses icon is a lamp instead of a bed), and the hero video pause control visible in the reference is absent. These are small local deviations on an otherwise matching state.|
|V02|分层菜单|1.875/2.5|Same wide dropdown-menu pattern: full-width panel with bold left link column, multi-column link lists, active tab outlined with dark border, and dimmed page background below — all matching the reference. Differences: a different tab is open (Storage & organization vs the reference's New & trending), the link area has 2 columns instead of the reference's 3 (Trending/Seasonal/Food), and the orange promo block content and position differ (candidate adds a photo above the orange box and shows 'Shop our newest arrivals' vs 'Game on with YXSTABY'). Key layout correct, moderate local differences.|
|V03|搜索与白色筛选|1.875/2.5|Same page state and skeleton: search field showing 'besta', '87 items for "besta"' heading, BESTÅ planning banner, 'Design your own BESTÅ storage' card at right, left filter sidebar, 'white ×' active filter chip, 4-column product grid with Compare checkboxes, IKEA Family price / BESTÅ / price / 15%-off promo hierarchy, blue cart buttons and hearts. Differences: the Color filter is collapsed so the reference's prominent color swatch grid (Gray/White checked/Black/Beige/Brown/Green) is not visible; a 'Clear all' link is added beside the chip; products from slot 3 onward differ (oak unit, shelving unit, Best-seller badge on slot 4 vs slot 3); the vertical mini-scrollbar between sidebar and grid in the reference is absent. Same key layout, several local differences.|
|V04|比较页面|2.5/2.5|Essentially identical: 'Product comparison' heading, two comparison columns with × remove buttons, same product images, IKEA Family price labels, BESTÅ names, $55.00/$76.00 prices, 15%-off savings lines, regular price and validity text, star ratings with (1550)/(4773) counts, and 'Key features' section below. Only trivial deviations: candidate adds a small 'More options' link under each rating and the viewport is scrolled slightly higher so the Width attribute rows visible at the bottom of the reference are just out of frame. Structure, proportions, images, hierarchy and styling all match.|
|V05|原木色组合详情|2.5/2.5|整体结构、比例与层级高度吻合：左侧缩略图列+主图、右侧IKEA Family价格/折扣/评分/颜色变体网格、顶部面包屑与导航均一致，主图为同一白蜡木纹BESTÅ组合。仅有微小差异：面包屑分隔间距略宽、变体选中框与'+12'位置略移、右下角聊天气泡位置略偏，均为局部细节。|
|V06|All media 弹层|1.875/2.5|关键布局正确：半透明遮罩、白色大弹层、右上关闭X、居中All media/Video/Measurement标签及下划线态、图片栅格均吻合，首行左产品图+右深蓝墙生活场景图一致。差异：参考图右图带视频播放按钮与左下滤镜按钮覆盖层，候选图无此覆盖图标；候选首屏多露出第二行两张镜像场景图，栅格可见内容与参考首屏略有不同。|
|V07|详情组件标签|1.875/2.5|核心结构吻合：横向Overview/Product details/Measurements/What's included标签（What's included激活下划线）、说明文案、左侧两列组件卡片（数量+名称+货号黑标签）、右侧大产品图均一致，候选完整展示六种组件（Frame/Shelf/Leg/Support leg/Hinge/Door），卡片图文与数量正确。差异：参考图在该滚动位置顶部仍露出主图库横条与右侧More ways to pay面板，候选同状态顶部直接为标签栏，首屏可见内容组成不同，卡片高度与间距也略紧凑。|
|V08|独立组件详情|2.5/2.5|结构、比例、图片与层级均吻合：STUBBARP配件大图（双木腿金属螺杆）、左侧缩略图、右侧IKEA Family价格$8.00/2 pack、折扣说明、评分(867)、颜色变体、数量步进器+蓝色Add to bag按钮、Collect points条目全部对应。仅局部细微差异：折扣文案'20% off'对'19% off'（实时数据差异）、心形收藏位置略偏、底部退货栏裁剪位置略不同。|
|V09|胡桃木效果详情|1.875/2.5|切换后的胡桃木主图、产品名称、价格、选中态变体缩略图与整体详情布局均吻合；差异为左侧图库多出一格米色变体缩略图（参考为4格含尺寸图），以及候选截图含完整页头而参考为下滚后的裁剪视图，属少量局部差异。|
|V10|购物袋|2.5/2.5|配送摘要三列、两行商品（BESTÅ与STUBBARP）、数量步进控件、原价/优惠价、右侧订单摘要（$260合计、Afterpay、Continue to checkout）结构与比例高度一致；仅到达日期Oct 27 vs Oct 26及次要折扣文案19% vs 20%等细微文本差异。|
|V11|袋内组件抽屉|1.875/2.5|背景遮罩、右侧部件抽屉、6项部件清单及数量（2/8/4/2/4/4）完全对应；但候选在部件行内加入了产品小图导致行高与间距与参考（纯文本行）明显不同，属关键布局正确下的局部差异。|
|V12|评论抽屉|2.5/2.5|双栏评论弹层、3.7总分与123条基数、5-1星分布条及计数、五项分项分数、筛选/排序、AI摘要、主题筛选丸、评论正文与IKEA回复均吻合；仅Durability丸完整显示而参考被截断、Helpful图标样式细微差别。|