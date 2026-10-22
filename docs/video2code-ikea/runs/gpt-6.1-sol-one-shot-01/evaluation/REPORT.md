# gpt-6.1-sol — IKEA one-shot-v1

总分：64.38/100。单次生成、无模型自测、无返修。

| 类别 | 得分 |
|---|---|
| execution | 5.00/10 |
| navigation | 12.50/15 |
| interaction | 25.00/25 |
| state | 0.00/20 |
| visual | 21.88/30 |

| ID | 评测项 | 得分 | 原因 |
|---|---|---|---|
| E01 | 启动与可操作首页 | 2.50/2.5 | 正常加载首页，存在可用搜索、分层导航和本地购物袋入口。 |
| E02 | 主流程稳定 | 2.50/2.5 | 主要浏览测试未出现未捕获异常；购物袋错误属于路由渲染缺失，单独在E04/N06/S项记录。浏览器日志无pageerror。 |
| E03 | 离线资源 | 0.00/2.5 | 外网阻断时已实现页面图像正常，但清单要求的购物袋主要产品图和布局未出现：购物袋路由错误显示商品详情。 |
| E04 | 本地深链 | 0.00/2.5 | 搜索和组合深链可直接打开/刷新；shoppingcart和/cart都错误渲染原木组合详情，未得到对应购物袋页。 |
| N01 | 两级菜单 | 2.50/2.5 | Products展开可进入Storage & organization并列出子类；补充实测Escape关闭菜单。 |
| N02 | 搜索联想与提交 | 2.50/2.5 | besta 输入出现5项联想及商品建议，Enter 跳本地搜索路由并保留查询。 |
| N03 | 列表进入组合详情 | 2.50/2.5 | 列表点击原木色组合柜，进入本地s29209829，主图/名称/197会员价及240原价对应。 |
| N04 | 组件跳转与返回 | 2.50/2.5 | 从组合组件清单进入20293568 STUBBARP详情，浏览器返回恢复s29209829上下文。 |
| N05 | 变体本地导航 | 2.50/2.5 | 变体按钮切换后进入s29612189，本地地址、胡桃木图片和black-brown/walnut名称同步改变。 |
| N06 | 跨页购物袋状态 | 0.00/2.5 | 加入独立柜脚和胡桃木组合后，点击Go to shopping bag只切换地址并显示原木色商品，无法完成袋→详情→袋往返。 |
| I01 | 颜色筛选与清除 | 2.50/2.5 | 白色筛选把165变87，出现white chip并移除棕色商品；Clear all恢复165与原列表。 |
| I02 | 价格排序 | 2.50/2.5 | 价格升序实际排列为8/8/12/12/17/20…，重新展开Sort选Best match后回到55/76/197。先前关闭排序后点击不存在选项为定位错误，已按UI重试。 |
| I03 | 双商品比较 | 2.50/2.5 | 比较页为指定60245844/00245842，价格55/76、原价65/90，宽47¼/23⅝、高15/75⅝、深15¾对应。 |
| I04 | 比较增删 | 2.50/2.5 | 相似商品抽屉添加小柜体70245848后出现38美元第三列；移除高柜后55/38两件保留。 |
| I05 | 图库与弹层 | 2.50/2.5 | 缩略图切换后主图改变，All media弹层展示多张实际图片，可关闭返回原商品详情。 |
| I06 | 尺寸展示 | 2.50/2.5 | Measurement 显示组合柜尺寸图，宽120cm/47¼、高74cm/29⅛、深42cm/16½。 |
| I07 | 组合清单 | 2.50/2.5 | 组件清单六种类型及数量为Frame1、Shelf4、STUBBARP2、Support leg1、Hinge2、Door2。 |
| I08 | 邮编验证 | 2.50/2.5 | abc 显示Please enter a valid ZIP code且未保存，95054保存后顶部和Home delivery均更新。 |
| I09 | 门店库存 | 2.50/2.5 | 选择East Palo Alto即保存，顶部门店、In stock、Click and collect及2美元/Family免费联动显示。 |
| I10 | 评论排序 | 2.50/2.5 | 评论弹层显示评分分布和多条评论；Lowest rated把默认Looks good…换成So disappointed…，截图显示第一条1星，随后1星及更高评分。 |
| S01 | 独立组件入袋 | 0.00/2.5 | 实际已加入柜脚2包及胡桃木组合，计数随加入和刷新保留；但购物袋链接、直接shoppingcart和/cart及刷新均显示原木色详情，无商品行/金额、数量编辑、组件抽屉、安装选项、删除撤销或折扣表单。独立重入复核后仍不可操作，不能凭源码中未接入的功能计分。共同根因为购物袋未渲染，非8个独立算法错误。 |
| S02 | 正确变体与初始总额 | 0.00/2.5 | 实际已加入柜脚2包及胡桃木组合，计数随加入和刷新保留；但购物袋链接、直接shoppingcart和/cart及刷新均显示原木色详情，无商品行/金额、数量编辑、组件抽屉、安装选项、删除撤销或折扣表单。独立重入复核后仍不可操作，不能凭源码中未接入的功能计分。共同根因为购物袋未渲染，非8个独立算法错误。 |
| S03 | 改数量后金额 | 0.00/2.5 | 实际已加入柜脚2包及胡桃木组合，计数随加入和刷新保留；但购物袋链接、直接shoppingcart和/cart及刷新均显示原木色详情，无商品行/金额、数量编辑、组件抽屉、安装选项、删除撤销或折扣表单。独立重入复核后仍不可操作，不能凭源码中未接入的功能计分。共同根因为购物袋未渲染，非8个独立算法错误。 |
| S04 | 组成数量倍增 | 0.00/2.5 | 实际已加入柜脚2包及胡桃木组合，计数随加入和刷新保留；但购物袋链接、直接shoppingcart和/cart及刷新均显示原木色详情，无商品行/金额、数量编辑、组件抽屉、安装选项、删除撤销或折扣表单。独立重入复核后仍不可操作，不能凭源码中未接入的功能计分。共同根因为购物袋未渲染，非8个独立算法错误。 |
| S05 | 刷新恢复 | 0.00/2.5 | 实际已加入柜脚2包及胡桃木组合，计数随加入和刷新保留；但购物袋链接、直接shoppingcart和/cart及刷新均显示原木色详情，无商品行/金额、数量编辑、组件抽屉、安装选项、删除撤销或折扣表单。独立重入复核后仍不可操作，不能凭源码中未接入的功能计分。共同根因为购物袋未渲染，非8个独立算法错误。 |
| S06 | 安装费联动 | 0.00/2.5 | 实际已加入柜脚2包及胡桃木组合，计数随加入和刷新保留；但购物袋链接、直接shoppingcart和/cart及刷新均显示原木色详情，无商品行/金额、数量编辑、组件抽屉、安装选项、删除撤销或折扣表单。独立重入复核后仍不可操作，不能凭源码中未接入的功能计分。共同根因为购物袋未渲染，非8个独立算法错误。 |
| S07 | 删除与撤销 | 0.00/2.5 | 实际已加入柜脚2包及胡桃木组合，计数随加入和刷新保留；但购物袋链接、直接shoppingcart和/cart及刷新均显示原木色详情，无商品行/金额、数量编辑、组件抽屉、安装选项、删除撤销或折扣表单。独立重入复核后仍不可操作，不能凭源码中未接入的功能计分。共同根因为购物袋未渲染，非8个独立算法错误。 |
| S08 | 折扣码失败不改金额 | 0.00/2.5 | 实际已加入柜脚2包及胡桃木组合，计数随加入和刷新保留；但购物袋链接、直接shoppingcart和/cart及刷新均显示原木色详情，无商品行/金额、数量编辑、组件抽屉、安装选项、删除撤销或折扣表单。独立重入复核后仍不可操作，不能凭源码中未接入的功能计分。共同根因为购物袋未渲染，非8个独立算法错误。 |
| V01 | 首页与共同导航 | 1.88/2.5 | Black top bar, IKEA header, nav, search and hero image grid match in structure/proportion/hierarchy; differences are local: category-chip icons are shifted/mismatched (Deals shows a tree instead of tag, Winter holiday shows a cabinet instead of tree, etc.), candidate shows a bottom cookie banner not present in reference home state, and the reference video pause overlay is absent (dynamic promo exempted). |
| V02 | 分层菜单 | 1.25/2.5 | Same wide Products mega-menu with active 'New & trending' pill and dimmed page background, but column structure differs materially: reference has three text columns (Trending / Seasonal / Food) with the orange YXSTABY card at lower right, while candidate drops the entire Food column, keeps only two text columns, and adds a dining photo above the orange promo card; right tab also shows full 'Kitchen, appliances & supplies' without the truncated arrow. One important section (Food column) is missing. |
| V03 | 搜索与白色筛选 | 1.88/2.5 | Search 'besta', help banner, '87 items', design-your-own card, left filter rail, active white chip and 4-column product grid with IKEA Family price/discount hierarchy all match; key differences: candidate left Color filter is collapsed (reference shows expanded color swatches with White checked and counts), candidate adds 'Clear all', Best-seller badge and product order/assortment differ (3rd/4th tiles not identical). Same filtered state, local differences only. |
| V04 | 比较页面 | 2.50/2.5 | Product comparison page matches: same title, two equal columns with remove-X, same BESTÅ product images, IKEA Family price labels, $55/$76 prices, 15%-off save lines, regular price/validity text, star ratings (1550)/(4773) and Key features section; column widths, spacing and separators align. Only trivial local icon placement (heart/bag) and a 'More options' link differ. |
| V05 | 原木色组合详情 | 2.50/2.5 | Overall structure matches: top bar, breadcrumb, left thumbnail column with large main oak cabinet image, right column with IKEA Family price $197.00, 17% off text, star rating (123), Choose color swatch grid with +12 tile, Design it yourself and How to get it sections, All media/View in 3D buttons. Only trivial difference: candidate renders an extra bordered (selected-looking) black swatch alongside the oak selection. |
| V06 | All media 弹层 | 1.88/2.5 | Overlay with gray mask, white modal, All media/Video/Measurement tabs and top-right close X all match. Key layout correct but local differences: candidate shows a second row of thumbnails below the two large images and uses a white centered play triangle instead of the reference's dark circular play button; reference also shows a small list icon at lower-left of the lifestyle image which is absent. |
| V07 | 详情组件标签 | 2.50/2.5 | Matches reference: partial gallery header with thumbnails and main lifestyle image, More ways to pay / Afterpay / Visa card panel, horizontal tabs with 'What's included' active, four visible component cards (1x Frame, 4x Shelf, 2x Leg STUBBARP, 1x Support leg) with quantities, dimensions and black article-number chips, plus large cabinet image on right. |
| V08 | 独立组件详情 | 2.50/2.5 | STUBBARP accessory page matches: breadcrumb ending in STUBBARP Leg, left thumbnails and large two-leg oak image, right panel with IKEA Family price $8.00/2 pack, 20% off save $2.00, regular price, rating (867), Choose color swatches with oak selected, How to get it, quantity stepper with Add to bag button, and Collect 8 points section. Layout, proportions and imagery align. |
| V09 | 胡桃木效果详情 | 2.50/2.5 | 胡桃木变体状态完整吻合：主图切换为brown walnut效果柜体，名称/价格/折扣/评分与参考一致，变体缩略图网格选中态、左侧媒体栏、共用详情布局（Design it yourself、How to get it、Add to bag）均匹配；仅左侧媒体栏多一张缩略图和顶部导航可见性差异，属可忽略局部差异。 |
| V10 | 购物袋 | 0.00/2.5 | 实际候选功能缺失，不是评测环境不足。shoppingcart链接、/cart深链与刷新都可正常加载候选脚本并显示原木色商品详情；其他页面/资源正常且无运行异常。原始候选app.js第51行render()未接入bagPage()，虽然第47行定义了它。未修改/调用候选内部函数或注入状态。故V10购物袋及V11袋内组件状态确实不可通过合法UI到达，按冻结missing-state=0裁定；保留K3原始null票及理由。 |
| V11 | 袋内组件抽屉 | 0.00/2.5 | 实际候选功能缺失，不是评测环境不足。shoppingcart链接、/cart深链与刷新都可正常加载候选脚本并显示原木色商品详情；其他页面/资源正常且无运行异常。原始候选app.js第51行render()未接入bagPage()，虽然第47行定义了它。未修改/调用候选内部函数或注入状态。故V10购物袋及V11袋内组件状态确实不可通过合法UI到达，按冻结missing-state=0裁定；保留K3原始null票及理由。 |
| V12 | 评论抽屉 | 2.50/2.5 | 评论抽屉双栏弹层完整吻合：3.7评分与星标、基于123条评论、5-1星分布条形及数量(54/30/10/12/17)、五项分项分数(4.3/3.9/3.5/3.6/3.7)、Write a review按钮、Filter/Sort by、United States/Other countries标签、AI评论摘要、Topics筛选药丸、首条评论'Looks good, functions bad'全文、Dylan署名、Report/Helpful?(1)及IKEA回复均一致；仅AI图标字形和背景页内容有细微差异。 |

使用统计：

```json
{
  "status": "delivered",
  "elapsed_seconds": 750.354,
  "responses": 1,
  "repairs": 0
}
```

实际视觉judge：k3

限制：
- 仅各一次候选生成，分数不代表总体能力。
- 输入是同一录屏的60张无损定点帧，非原生视频接口。
- 未主动设时间或输出token上限；reasoning effort=high，不代表能取消服务自身推理限制。
- GLM视觉judge接口503不可用，原始失败记录保留；实际judge及任何代理裁定逐项披露。
- 交付失败与业务能力分开解释；不对候选代码做人工修复。

候选 SHA256：`4b665b37e07533fff80c96867fb2949af62d4731a4f35a368395f1dc601651ca`。冻结输入及候选哈希均已验证。

## 失败原因与解释

购物袋路由被识别，但 render() 缺少购物袋分支，最终渲染了商品详情页。通过加入商品、袋子入口、独立深链和刷新均复现。购物袋、数量、价格、安装、删除/撤销与折扣操作因此不可达。

这是同一个页面渲染遗漏影响多个验收条款，不是八个独立状态算法错误。固定清单按可见结果评分；源码仅用于解释原因。定义位于 project/app.js:47，缺失分支位于 project/app.js:51。

## 复核与轨迹

实际视觉复核为 K3 单模型 judge；主代理根据实际浏览器证据，将 Sol V10/V11 从 N/A 裁定为缺失状态 0 分，并将 Luna 全部条款裁定为 N/A。GLM-5.3-flash judge 返回 503，无成功票；并非双模型或人工一致性认证。原始票、裁定与失败记录保留。

[操作轨迹](operator-records.json) · [浏览器日志](browser-log.json) · [运行录像](evaluation.mp4) · [录像和清理说明](operator-cleanup.json) · [候选哈希](../candidate-manifest.json)
