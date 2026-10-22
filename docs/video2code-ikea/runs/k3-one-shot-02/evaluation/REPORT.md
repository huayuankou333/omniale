# k3 · IKEA 单次交付评测

总分：83.75/100。

功能通过 27/28。I04 比较增删：比较页无相似商品或Add more入口，无法加入70245848；移除00245842可用但未完成要求的三列增删

- 执行：10.0/10.0
- 导航：15.0/15.0
- 交互：22.5/25.0
- 状态：20.0/20.0
- 视觉：16.25/30.0

视觉采用单一匿名 gpt-6.1-sol judge；并非双模型共识或人工认证。无返修或分数封顶。

[操作轨迹](operator-records.json) · [运行录像](evaluation.mp4) · [清理说明](operator-cleanup.json)

|ID|检查点|得分|依据|
|---|---|---|---|
|E01|启动与可操作首页|2.5/2.5|首页渲染且有可用导航搜索|
|E02|主流程稳定|2.5/2.5|搜索至详情、组件、购物袋全流程无未捕获运行错误，浏览器错误日志为空|
|E03|离线资源|2.5/2.5|外网阻断下首页、列表、比较、详情、组件与购物袋主要本地资源加载正常|
|E04|本地深链|2.5/2.5|搜索、商品和购物袋本地hash深链直接进入与刷新均正常|
|N01|两级菜单|2.5/2.5|Products的Storage标签切换至对应子类并Escape关闭|
|N02|搜索联想与提交|2.5/2.5|besta联想显示并Enter进入保留查询的本地搜索页|
|N03|列表进入组合详情|2.5/2.5|列表原木色组合进入s29209829且商品身份图片对应|
|N04|组件跳转与返回|2.5/2.5|组件详情打开20293568，加入后通过历史返回原组合|
|N05|变体本地导航|2.5/2.5|胡桃木变体本地s29612189、名称和主图同步改变|
|N06|跨页购物袋状态|2.5/2.5|购物袋图标从商品详情返回本地购物袋，保持两组合一柜脚及490|
|I01|颜色筛选与清除|2.5/2.5|白色筛选保留活动项、87结果与过滤商品；清除恢复165|
|I02|价格排序|2.5/2.5|低价排序按8/12/12/20...升序，Best match恢复55/76/197/136|
|I03|双商品比较|2.5/2.5|正确两商品55/76与宽高深差异|
|I04|比较增删|0.0/2.5|比较页无相似商品或Add more入口，无法加入70245848；移除00245842可用但未完成要求的三列增删|
|I05|图库与弹层|2.5/2.5|缩略图更换主图，All media打开真实图片且Escape正常返回|
|I06|尺寸展示|2.5/2.5|尺寸标签显示当前组合尺寸图与47 1/4、16 1/2、29 1/8尺寸|
|I07|组合清单|2.5/2.5|六类组件及1/4/2/1/2/2数量正确|
|I08|邮编验证|2.5/2.5|abc拒绝，95054保存并更新顶部和配送|
|I09|门店库存|2.5/2.5|East Palo Alto更新顶部、In stock和Click and collect|
|I10|评论排序|2.5/2.5|评论最低评分排序后第一条由Dylan两星变为So disappointed一星，列表按评分升序变化|
|S01|独立组件入袋|2.5/2.5|STUBBARP独立行2包、原价金额20，与组合内部配件分离|
|S02|正确变体与初始总额|2.5/2.5|胡桃木组合240加独立两包柜脚20合计260，优惠单列|
|S03|改数量后金额|2.5/2.5|两组合480加1配件10，产品合计490|
|S04|组成数量倍增|2.5/2.5|两组合清单2/8/4/2/4/4，独立柜脚未吞并|
|S05|刷新恢复|2.5/2.5|刷新保持两组合一柜脚490以及95054和门店|
|S06|安装费联动|2.5/2.5|开启安装费117合计607，关闭恢复490，数量不变|
|S07|删除与撤销|2.5/2.5|删独立柜脚480、Undo恢复1包及490|
|S08|折扣码失败不改金额|2.5/2.5|OMNIALE-DEMO报Please enter a valid discount code，产品490及数量不变|
|V01|首页与共同导航|1.25/2.5|The black utility bar, navigation, category pills, and promotional mosaic are recognizable. However, the mosaic begins at y216 rather than y282 and is substantially shorter: the candidate reveals the next section while the reference imagery continues below the viewport. The upper-right tile is also shorter, and the search field and navigation are shifted left.|
|V02|分层菜单|1.25/2.5|The wide menu includes the matching category tabs, active outline, and main link groups. Column proportions differ substantially: Trending begins near x318 instead of x466, and the links are vertically compressed. The menu ends near y557 instead of y627. The promotional card includes an additional image, and the underlying page is not dimmed as in the reference.|
|V03|搜索与白色筛选|1.25/2.5|The left filter sidebar, selected white swatch, active filter chip, and four-column product grid are present. However, product images begin around y410 instead of y512 and are smaller, substantially compressing the cards vertically. The third product shows a wood finish rather than white, and the fourth product is a shelving unit rather than the reference TV bench. Price and promotional information remain recognizable but differ in sizing and spacing.|
|V04|比较页面|1.25/2.5|Both matching products, prices, promotional details, ratings, and the beginning of the feature comparison are present. The comparison columns are left-aligned rather than centered, leaving a large empty right side. Product images are smaller, the heading is larger, and the details are more vertically compressed. The visible feature row lacks the reference's gray cell backgrounds and dividing treatment.|
|V05|原木色组合详情|1.875/2.5|The thumbnail rail, large oak cabinet image, breadcrumbs, pricing hierarchy and two-row variant selector match the reference structure. The gallery begins about 25 px higher, the product-information column sits farther left, and smaller text changes wrapping and spacing. The media buttons are centered beneath the image rather than aligned toward its lower-right corner.|
|V06|All media 弹层|1.25/2.5|The dimmed backdrop, large white modal, media tabs and upper-right close control are present. However, the reference's two equally sized media tiles are not reproduced: the candidate enlarges the cabinet tile and renders the video preview as a small thumbnail with a detached play button. Additional images enter the bottom of the viewport, substantially changing the grid and whitespace.|
|V07|详情组件标签|1.25/2.5|The component section is recognizable, with six illustrated component cards, quantities, article numbers and a large cabinet image on the right. The supplied view does not show the reference's horizontal tabs or sticky navigation, and the component section starts near the top instead of below the gallery and payment area. Wider rounded cards and the visible reviews section further change the composition.|
|V08|独立组件详情|1.875/2.5|The large STUBBARP leg image, three-image thumbnail rail, family price with 2-pack notation, four color options, quantity stepper and blue add-to-bag button reproduce the key layout. The gallery starts higher, the information column shifts left, and smaller typography alters the price treatment. Extra spacing and dividers push the purchase controls lower, while the media buttons are centered rather than right-aligned.|
|V09|胡桃木效果详情|1.25/2.5|The walnut product image, product name, pricing hierarchy and two-row variant selector correspond. However, the candidate retains a large navigation header, shifting the product area downward. The details column starts farther left, uses smaller typography and different wrapping, and pushes the Add to bag button below the viewport. Gallery thumbnails, variant ordering and media-button placement also differ.|
|V10|购物袋|1.25/2.5|The delivery summary, product-list column and right-hand order summary are recognizable. However, the product rows are reversed, leaving the walnut cabinet largely below the viewport. The candidate lacks the reference's gray page background and distinct white panels, uses different product-row spacing and quantity-control alignment, and replaces the large rectangular checkout button with a shorter pill-shaped button.|
|V11|袋内组件抽屉|1.25/2.5|The dimmed backdrop and right-side drawer contain the corresponding six components and quantities. The drawer is narrower, its heading and list begin substantially higher, and component text lacks the reference's reserved left gutter. The background is also at a substantially different scroll position, showing recommendations instead of the delivery summary and two product rows visible in the reference.|
|V12|评论抽屉|1.25/2.5|The candidate reproduces the two-column reviews modal, rating breakdown, category scores, filtering controls, summary and matching review content. Multiple conspicuous differences remain: the overall rating is left-aligned rather than centered, rating-distribution bars have substantially different proportions, a vertical column divider is added, and filter/topic controls are outlined instead of mostly filled. Column widths, typography and review-action placement also differ.|