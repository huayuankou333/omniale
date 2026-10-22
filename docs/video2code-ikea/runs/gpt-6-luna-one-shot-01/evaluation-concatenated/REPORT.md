# gpt-6-luna · IKEA 单次交付评测

总分：78.125/100。

组装后主购物流程可运行。Products 的 Storage 标题没有真正的二级导航；比较页无法完成指定第三件商品的增删；评论排序改变文案但星级顺序仍不正确；两套组合的组件数量没有倍增；安装费选择未进入总额。

- 执行：10.0/10.0
- 导航：12.5/15.0
- 交互：20.0/25.0
- 状态：15.0/20.0
- 视觉：20.625/30.0

视觉采用单一匿名 k3 judge；并非双模型共识或人工认证。无返修或分数封顶。

用户授权将三个同名 app.js 按原序以换行拼接。原始交付失败记录保留；没有模型重生成或代码修补。

[操作轨迹](operator-records.json) · [运行录像](evaluation.mp4) · [清理说明](operator-cleanup.json)

|ID|检查点|得分|依据|
|---|---|---|---|
|E01|启动与可操作首页|2.5/2.5|首页可用；输入besta出现联想，Enter显示并保留查询|
|E02|主流程稳定|2.5/2.5|完整流程无未捕获运行错误；浏览器外网阻断，首页列表比较详情组件购物袋主要资源正常加载|
|E03|离线资源|2.5/2.5|完整流程无未捕获运行错误；浏览器外网阻断，首页列表比较详情组件购物袋主要资源正常加载|
|E04|本地深链|2.5/2.5|搜索、商品、购物袋各自深链直接打开并刷新显示相应页面|
|N01|两级菜单|0.0/2.5|Products可展开关闭，但Storage & organization是静态标题，点击不进入第二级菜单|
|N02|搜索联想与提交|2.5/2.5|首页可用；输入besta出现联想，Enter显示并保留查询|
|N03|列表进入组合详情|2.5/2.5|从列表点击原木色组合进入29209829详情|
|N04|组件跳转与返回|2.5/2.5|从组件清单打开20293568并使用浏览器后退返回29209829|
|N05|变体本地导航|2.5/2.5|切换胡桃木后本地地址29612189，商品名称和图片改变|
|N06|跨页购物袋状态|2.5/2.5|袋返回详情后通过头部购物袋入口保留组合2、脚1、总额490|
|I01|颜色筛选与清除|2.5/2.5|白色筛选改变可见列表，可清除；低价排序为38/55/76/76/136/145/197/197，恢复原顺序|
|I02|价格排序|2.5/2.5|白色筛选改变可见列表，可清除；低价排序为38/55/76/76/136/145/197/197，恢复原顺序|
|I03|双商品比较|2.5/2.5|选择60245844/00245842后显示两者对应价格和不同宽高深|
|I04|比较增删|0.0/2.5|比较可加入第三列，但实际第三件为60245919；指定70245848缺少可达入口。移除按钮亦被叠层拦截，未完成指定增删场景|
|I05|图库与弹层|2.5/2.5|图库主图和Measurement可用；关闭按钮被modalhead遮挡，但点击遮罩可正常关闭；组件实际显示六种、数量1/4/2/1/2/2|
|I06|尺寸展示|2.5/2.5|图库主图和Measurement可用；关闭按钮被modalhead遮挡，但点击遮罩可正常关闭；组件实际显示六种、数量1/4/2/1/2/2|
|I07|组合清单|2.5/2.5|图库主图和Measurement可用；关闭按钮被modalhead遮挡，但点击遮罩可正常关闭；组件实际显示六种、数量1/4/2/1/2/2|
|I08|邮编验证|2.5/2.5|abc被拒绝显示错误，95054保存并显示顶部及配送区域|
|I09|门店库存|2.5/2.5|选择East Palo Alto后顶部及商品库存区域均更新|
|I10|评论排序|0.0/2.5|最低评分选项改变文本顺序但首条仍渲染两星、下一条一星，未按评分升序。选择后直到其他重绘才更新。|
|S01|独立组件入袋|2.5/2.5|独立STUBBARP一行，数量2，原价行金额20|
|S02|正确变体与初始总额|2.5/2.5|原木独立柜脚2包20，胡桃木组合1个240，产品260，Family优惠独立47|
|S03|改数量后金额|2.5/2.5|独立柜脚2减至1，组合1增至2，行金额10和480，合计490|
|S04|组成数量倍增|0.0/2.5|两件组合的袋内组件仍显示1/4/2/1/2/2，未倍增为2/8/4/2/4/4；独立行保留|
|S05|刷新恢复|2.5/2.5|刷新后组合2、独立脚1、产品490及邮编门店保留|
|S06|安装费联动|0.0/2.5|安装服务标价117，但勾选及取消后总额均490，未加至607|
|S07|删除与撤销|2.5/2.5|删除独立脚产品变480，Undo恢复数量1与490|
|S08|折扣码失败不改金额|2.5/2.5|无效折扣码显示提示，行数量及总额490不变|
|V01|首页与共同导航|1.875/2.5|Same overall structure: black utility bar, IKEA logo, main nav, centered search, login/wishlist icons, category chip row, and hero grid with identical large left drawer image plus right-side image stack. Differences: category chips lack the small thumbnail icons, cart/bag icon replaced, right-side promo images differ (dynamic content exempted but layout slots also slightly rearranged). Key layout correct with only local differences.|
|V02|分层菜单|1.25/2.5|Recognizably the same open mega-menu state: left bold link column (Explore all/Limited collections/Home accessories/IKEA for Business), category columns, right promo area, dimmed page background. But the reference's category pill tab row (New & trending, Winter holiday shop, etc. with active outlined tab) is entirely missing, only 2 link columns vs 3 (Trending/Seasonal/Food), and right area shows a cabinet product photo instead of the orange promo card. One important part missing plus multiple density/content differences.|
|V03|搜索与白色筛选|1.875/2.5|Same filtered search state: '87 items for "besta"', help banner, left filter rail with Sort/Size/Color and color swatches in identical arrangement, active 'white' filter pill, 4-column product grid with matching products, IKEA Family price labels and prices. Differences: search-suggestions dropdown left open over the page, white swatch lacks the selected check ring, product cards lack the heart and blue cart buttons, and candidate shows ratings/regular-price lines not visible in reference cards. Key layout correct with local differences.|
|V04|比较页面|1.875/2.5|Same comparison state: 'Product comparison' heading, two equal product columns with matching BESTÅ images, close-X on first column, family-price label, product names, $55.00/$76.00 prices, star ratings with counts, and Key features attribute rows (Width/Height/Depth). Differences: search-suggestions dropdown overlays the second column, heart/cart action buttons missing, discount ('15% off, save…') and price-validity text lines absent. Key layout correct with local differences.|
|V05|原木色组合详情|1.875/2.5|Key layout matches: left thumbnail column, large main product image, right info column with IKEA Family price/$197.00/17% off, ratings, color swatch grid, How to get it and Add to bag. Local differences: breadcrumb truncated (ends at 'BESTÅ', missing sideboards/product segments), search box contains 'besta' text, 'Design it yourself' section and All media/View in 3D overlay buttons missing, swatch grid composition differs (no '+12' overflow tile, different variant set).|
|V06|All media 弹层|1.875/2.5|Same state: dimmed backdrop, large white modal, All media/Video/Measurement tabs with underline on active tab, close X at top right, image grid of same product photos. Differences: reference shows two large side-by-side images filling the modal width, candidate uses a denser 4-column grid of smaller images; candidate modal is narrower so the IKEA logo and right-side page content show outside the modal; no visible internal scrollbar.|
|V07|详情组件标签|1.25/2.5|Recognizable same tab state: horizontal tabs with 'What's included' active, intro sentence, six components with quantities and images. Multiple clear differences: reference uses 2-column cards with black article-number chips and a large product image occupying the right third; candidate uses 3-column grid with no right-side large image (an important section missing), article numbers rendered as plain text and partially wrong (902.473.75 repeated for Shelf/Support leg/Door, '20293568' unformatted), and component images are paler/incorrect (white frame and shelf vs oak).|
|V08|独立组件详情|1.875/2.5|Same page structure and hierarchy: left thumbnails, large main image, right column with IKEA Family price, STUBBARP title, '$8.00 /2 pack', 20% off line, regular price, 867 ratings, Choose color swatches, quantity stepper and blue Add to bag. Differences: main image shows a single leg close-up under a cabinet instead of the two-leg product shot with visible screw tops; selected swatch highlight is on the dark variant while oak text/price shown; breadcrumb truncated to 'STUBBARP'; missing All media/View in 3D buttons and the yellow chat/return panel.|
|V09|胡桃木效果详情|1.875/2.5|共用详情布局吻合：面包屑、左侧缩略图列、主图与右侧信息面板（IKEA Family价格、BESTÅ、变体名、$197、17% off、评分、Choose color双行缩略图、Add to bag）结构、比例与样式均吻合，变体已正确切换为胡桃木效果。局部差异：缺少Design it yourself区块、Collect points条、主图上All media/View in 3D按钮、收藏心形图标与+12更多色块，评价数为867而非123。|
|V10|购物袋|1.875/2.5|购物袋关键布局正确：配送摘要三卡、两行商品（图片+名称+折扣蓝字+可用性圆点+Save for later+数量步进器+Assembly行）、右侧订单摘要$260、Afterpay、Apply discount code、Continue to checkout均吻合。局部差异：两件商品顺序对调（STUBBARB在前）、缺少IKEA Visa Credit Card推广块与Collect points/ Save $47条目样式不同、缺少'Pick up yourself at East Palo Alto'链接、支付图标行缺失。|
|V11|袋内组件抽屉|1.875/2.5|背景遮罩与右侧部件抽屉结构吻合：标题BESTÅ、'This product is made up of 6 parts'、6个部件分组（名称+Quantity）列表、分隔线与间距一致。局部差异：部件名称缺少尺寸描述（如Frame, black-brown, 47 1/4x15...），各部件数量与参考不同（2/8/4/2/4 vs 1/4/2/1/2/2），抽屉宽度略窄。|
|V12|评论抽屉|1.25/2.5|双栏弹层可辨认且多项吻合：左侧3.7大分数、星级、Based on 123 reviews、5-1星分布条、Write a review按钮；右侧Filter/Sort by、United States/Other countries标签、Reviews summary、Topics chips、评论卡（标题Looks good, functions bad、正文、Helpful?）。但完全缺失分项分数区块（Appearance 4.3/Ease of assembly/Product quality/Value for money/Works as expected），这是一个重要部分缺失；此外缺少Response from IKEA与Report按钮，评价人显示为Anonymous reviewer而非具名标签。|