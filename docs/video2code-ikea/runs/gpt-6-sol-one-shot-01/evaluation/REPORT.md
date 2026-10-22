# gpt-6-sol · IKEA 单次交付评测

总分：85.625/100。

功能通过 25/28。I01 颜色筛选与清除：白色筛选仅显示87与white标签并重排，前后仍为同22件商品；黑棕TV柜、胡桃木台面和黑棕组合仍保留，未真实过滤；I04 比较增删：比较页无相似商品或加入70245848入口；00245842移除可用，但无法完成三列增删；S06 安装费联动：安装复选框可切换且显示117，但勾选后Total excluding tax仍490，未增加至607

- 执行：10.0/10.0
- 导航：15.0/15.0
- 交互：20.0/25.0
- 状态：17.5/20.0
- 视觉：23.125/30.0

视觉采用单一匿名 k3 judge；并非双模型共识或人工认证。无返修或分数封顶。

[操作轨迹](operator-records.json) · [运行录像](evaluation.mp4) · [清理说明](operator-cleanup.json)

|ID|检查点|得分|依据|
|---|---|---|---|
|E01|启动与可操作首页|2.5/2.5|首页正常加载，可使用导航与搜索|
|E02|主流程稳定|2.5/2.5|搜索→详情→组件→购物袋主流程无未捕获错误，浏览器错误日志为空|
|E03|离线资源|2.5/2.5|外网阻断下首页、列表、比较、详情、组件和购物袋主要本地图片均正常加载|
|E04|本地深链|2.5/2.5|搜索、商品和购物袋直接打开本地深链并刷新均显示对应页面|
|N01|两级菜单|2.5/2.5|Products菜单Storage标签展示对应子类并可Escape关闭|
|N02|搜索联想与提交|2.5/2.5|besta输入出现联想，Enter进入本地带查询的搜索结果|
|N03|列表进入组合详情|2.5/2.5|列表原木色组合进入对应s29209829本地地址、名称与图片|
|N04|组件跳转与返回|2.5/2.5|组件打开20293568并可经浏览器历史返回29209829|
|N05|变体本地导航|2.5/2.5|胡桃木变体切换至29612189，图片、名称及地址对应改变|
|N06|跨页购物袋状态|2.5/2.5|购物袋返回详情后经顶部图标再次进入，2组合1柜脚490保留|
|I01|颜色筛选与清除|0.0/2.5|白色筛选仅显示87与white标签并重排，前后仍为同22件商品；黑棕TV柜、胡桃木台面和黑棕组合仍保留，未真实过滤|
|I02|价格排序|2.5/2.5|低价排序显示8/8/12/12/17/20...，Best match恢复55/76/197|
|I03|双商品比较|2.5/2.5|双商品对应55/76价格与47¼/23⅝宽、15/75⅝高和15¾深|
|I04|比较增删|0.0/2.5|比较页无相似商品或加入70245848入口；00245842移除可用，但无法完成三列增删|
|I05|图库与弹层|2.5/2.5|缩略图更换主图；All media展示真实图集，Escape关闭返回详情|
|I06|尺寸展示|2.5/2.5|Measurement显示当前组合47¼×16½×29⅛尺寸图|
|I07|组合清单|2.5/2.5|组件清单六类身份与数量1/4/2/1/2/2正确|
|I08|邮编验证|2.5/2.5|abc显示无效错误，95054保存并更新顶部与配送|
|I09|门店库存|2.5/2.5|East Palo Alto选择同步顶部、当前商品In stock与Click and collect|
|I10|评论排序|2.5/2.5|默认首条Dylan两星，最低评分排序后So disappointed一星在前，后续显示一星且顺序改变|
|S01|独立组件入袋|2.5/2.5|2包STUBBARP独立行、数量2、原价金额20|
|S02|正确变体与初始总额|2.5/2.5|两行分别2包独立柜脚20与1个胡桃木组合240，合计260且Family节省单列|
|S03|改数量后金额|2.5/2.5|组合数量2行480，独立柜脚1行10，产品合计490|
|S04|组成数量倍增|2.5/2.5|2个组合袋内组件2/8/4/2/4/4，独立原木柜脚仍为1包|
|S05|刷新恢复|2.5/2.5|刷新保留2组合1柜脚490及95054/East Palo Alto|
|S06|安装费联动|0.0/2.5|安装复选框可切换且显示117，但勾选后Total excluding tax仍490，未增加至607|
|S07|删除与撤销|2.5/2.5|删除独立柜脚合计480，Undo恢复1包与490|
|S08|折扣码失败不改金额|2.5/2.5|OMNIALE-DEMO显示无效错误且仍2组合1柜脚490|
|V01|首页与共同导航|2.5/2.5|头部黑条(US/English / Shop new arrivals / ZIP / Select store)、IKEA标志、主导航、搜索框、分类胶囊行与主视觉栅格的结构、比例、层级均吻合：左大视频位+右上大图+下方双卡布局一致。左图与右上视频画面内容不同、缺少暂停键及'IKEA Family price'/'New'角标，属于动态宣传画面豁免项；仅搜索框图标位置(左右)与购物袋图标样式有细微差异，不影响整体样式吻合。|
|V02|分层菜单|1.875/2.5|宽幅分层菜单整体结构吻合：顶部胶囊行含高亮'New & trending'活动项、左侧粗体链接列(Explore all new/Limited collections/Home accessories shop/IKEA for Business)、分栏链接密度与下方背景页一致。差异：参考含Trending/Seasonal/Food三链接列，候选缺少'Food'列(其Food recipes并入Seasonal)；候选右侧多出沙发图片且橙色促销块文案不同(参考为YXSTABY/XBOX文案)；候选底部无cookie条(状态可接受)。属同状态关键布局正确、仅局部差异。|
|V03|搜索与白色筛选|1.25/2.5|可辨认同页面：搜索'besta'、帮助横幅、'87 items for "besta"'标题、右侧Design your own BESTÅ框、'white'活动筛选chip、Compare复选框与商品栅格、IKEA Family price/价格/折扣文字层级均一致。但左侧筛选栏状态明显不同：参考Color筛选展开并显示彩色色板网格(Gray/White/Black/Beige/Brown/Green及数量，White带勾选圈)，候选全部筛选折叠为Sort/Size/Color/Type/Category等纯文字列表，色板区这一重要部分缺失，构成一个重要部分缺失。|
|V04|比较页面|2.5/2.5|Product comparison页结构吻合：标题、居中两列等宽对比卡、商品图、关闭X、心形、IKEA Family price蓝色标签、BESTÅ品名规格、大号价格$55/$76、折扣与常规价格行、星级评分(1550)/(4773)、蓝色圆形加购按钮及底部'Key features'分栏表位置均一致。仅局部细微差异：候选搜索框残留'besta'文本、第二件折扣写16%(参考15%)、多出'More options'链接、Key features表行略偏下未入视口。列宽、图片、价格与属性表分隔均吻合。|
|V05|原木色组合详情|1.875/2.5|同状态关键布局正确：面包屑、左侧缩略图列、中央主图、右侧价格/变体色板/Design it yourself 层级与官网一致；但候选截图整体比例偏大导致右栏文本左侧被裁切（如 BESTÅ 显示为 TA、价格 197 前 $ 缺失），主图下方的 All media/View in 3D 按钮及右上收藏心形在对应区域不可见，属少量局部差异。|
|V06|All media 弹层|1.875/2.5|白色大弹层、居中 All media/Video/Measurement 标签、右上关闭 X、主产品图+生活场景图的栅格均吻合；差异在于候选弹层上移覆盖了顶部黑色导航条（参考中黑条完整露出）、弹层内栅格继续展示更多图片行而参考为大量留白，且右侧滚动条样式不同，关键结构正确但有多处局部差异。|
|V07|详情组件标签|1.875/2.5|What's included 横向标签栏（Overview/Product details/Measurements/What's included）、说明文字、四张组件卡片（1x Frame/4x Shelf/2x Leg STUBBARP/1x Support leg，含货号黑标）与右侧大图的布局、比例、样式高度一致；差异为候选滚动位置更靠上，缺少参考顶部的图库大图与缩略图条，右上方内容也不同（组装/退货提示 vs 支付信息），Frame 卡片缩略图角度略异。|
|V08|独立组件详情|2.5/2.5|STUBBARP 配件页主要结构、比例、图片、层级和样式均吻合：面包屑、左侧三张缩略图、双木腿大图、右侧 IKEA Family price、$8.00/2 pack 价格与 20% off 说明、颜色变体缩略图（含选中描边）、数量步进器与蓝色 Add to bag、Collect 8 points 与退货信息位置全部对应；仅评论数（123 vs 867）等数据文本与个别小图标存在细微差别。|
|V09|胡桃木效果详情|1.875/2.5|Same product-detail state: walnut variant image, name, price block, color swatch grid, All media/View in 3D pills and Add-to-bag all match in structure and proportion. Local differences: candidate shows full site header above breadcrumb, discount text '18% off' vs '17% off', swatch grid lacks the '+12' overflow tile and shows a room-scene swatch instead, title wraps differently.|
|V10|购物袋|1.875/2.5|Key bag layout correct: delivery/pickup/collect summary row, two line items with thumbnails, prices, discount lines, availability dots, quantity steppers, right-side order summary with $260 total, Afterpay/Family savings and Continue-to-checkout button all present. Local differences: candidate lacks the black top utility bar (white header), item order reversed (STUBBARP first), BESTÅ quantity 2 vs 1, assembly-fee row values differ ($5.20 vs $58.50), extra payment-icon row under checkout button.|
|V11|袋内组件抽屉|1.875/2.5|Dimmed background with right-side BESTÅ parts drawer matches: 'made up of 6 parts', same six part entries with correct quantities (2/8/4/2/4/4), dividers, spacing and close button. Local differences: part subtitles truncated/altered (no frame dimensions, 'Support leg, black-brown' vs 'gray, 3 7/8"', 'Door, black-brown' vs 'brown/walnut effect, 23 5/8x25 1/4"'), background bag scroll position differs.|
|V12|评论抽屉|1.25/2.5|Recognizable reviews modal with matching 3.7 score, identical distribution bars (54/30/10/12/17) and sub-scores, but layout is single-column centered instead of the reference two-column panel; Filter/Sort-by buttons, country tabs, AI reviews summary, topics chips and the review content column are entirely absent in the visible state, close X is mid-left, and 'Customer reviews' heading sits at the bottom. Multiple obvious differences and the important review-list column missing.|