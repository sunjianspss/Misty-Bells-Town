# v0.4 阶段 0–1B 素材生成记录

生成方式：Codex 内置 `image_gen`。以下均为原创方向稿，不使用封面裁切。

## 桥边黄昏方向图

```text
Create a polished, original top-down 2D pixel-art concept for an 18 × 14 tile
spring village map. Place a blue-green river and dark timber bridge in the
lower-right quadrant, a warm bakery in the upper-left, and readable ochre
paths between them. Near the bridge place a moss-capped player, Azhi with
plum twin buns and coral clothing, handmade brass wind chimes, three cloth
ribbons and three lanterns. Use 32 × 32 environment-tile density, crisp
1–3 pixel clusters, a cool mauve-blue dusk layer, apricot/gold light pools
and broken warm reflections on the river. Keep the map navigable and the
interaction props legible. No UI, labels, text, logo, watermark, extra named
villagers, copied game assets, isometric camera or painterly blur.
```

## 玩家四方向行走图集

```text
Create an original 4 × 4 pixel-art walk atlas for a young village newcomer:
moss-green round cap, dark chestnut hair, deep teal vest, cream shirt, ochre
scarf, brown satchel, dark trousers and brown boots. Four directions and four
contact/pass frames per direction, identical proportions and foot baseline,
32 × 40 visible character scale, crisp clusters and no smoothing. Put exactly
one full character in each equal cell on one perfectly flat #ff00ff
chroma-key background. No grid, text, shadow, extra character or watermark.
```

## 阿栀四方向行走图集

```text
Create an original 4 × 4 pixel-art walk atlas for Azhi: unmistakable
plum-purple twin side buns, loose bangs, coral tunic over a warm cream shirt,
deep-rose apron layer, dark leggings, brown boots and honey-gold shoulder
ribbons. Rows are down, left, right, up; columns are four contact/pass
walking frames. Keep identity, proportions and foot baseline stable at a
32 × 40 visible scale. Use a perfectly flat #00ff00 chroma-key background.
No grid, text, shadow, props, extra character or watermark.
```

## 桥边四组动画道具

```text
Create one strict 4 × 4 transparent-ready pixel-art atlas for a 32 × 32 tile
game. Row 1: the same brass wind chime in four sway frames. Row 2: the same
coral, cream and muted-blue ribbon bundle in four wind frames. Row 3: the same
dark timber lantern in unlit, ember, lit and breathing-lit states. Row 4:
four broken apricot/gold river-reflection ripple frames with no opaque water.
Use dark walnut outlines, honey-gold highlights and cool mauve shadows on a
perfectly flat #ff00ff chroma-key background. No labels, borders, UI, extra
objects, soft gradients or watermark.
```

最终运行时文件：

- `characters/chr_player_walk_4dir_4f_v01.png`
- `characters/chr_azhi_walk_4dir_4f_v01.png`
- `props/prop_bridge_fx_4x4_v01.png`

`source/` 保留内置生成器原始色键图；运行时不会加载这些大图。色键去除后通过
`scripts/normalize_v04_atlas.py` 以最近邻采样规整到原生像素网格。

## 阶段 1B 高完成度场景

输入角色：

- 现有 `576 × 448` 可玩截图：严格空间与碰撞布局参考。
- `reference/bridge-dusk-direction.png`：材质、配色、细节密度与黄昏光影参考。

最终生成约束：

```text
Repaint the existing playable 18 × 14 map as a production-quality original
pixel-art environment. Preserve the upper-left bakery, central stone plaza,
open dirt paths, lower-right river and the horizontal bridge at the existing
gameplay anchors. Match the direction image's dark-blue roof tiles, layered
spring grass, warm bakery windows, indigo water, amber lamps and cool/warm
dusk boundary. Produce an environment-only plate with no player, NPC, crowd,
animal, UI, text or watermark. Keep the bridge deck and paths unobstructed so
separate moving sprites, water shimmer, lamp glow, ribbons, petals and
foreground occlusion can render above it.
```

内置生成结果保存为 `source/scene_bridge_dusk_stage1b_source_v01.png`。为避免生成稿的有机
构图偏离既有碰撞，`scripts/prepare_stage1b_scene.py` 会在不改变逻辑地图的前提下完成
确定性对齐：河道锁定第 `12–17` 列 / 第 `8–13` 行，桥面锁定第 `11–14` 列 / 第 `10`
行，并将面包房、公告板、桌台、村口标记和桥端挡柱落回原占地。方向图没有被裁切成运行时
素材。脚本最终生成：

- `backgrounds/scene_bridge_dusk_bg_576x448_v01.png`
- `foregrounds/scene_bridge_dusk_fg_576x448_v01.png`

## 阶段 1B 四村民方向图集

```text
Create one exact 4-column by 4-row pixel-art NPC atlas. Columns are Linmai
(cream bakery apron and red scarf), Shenyan (straw hat and indigo work
clothes), Xuhuai (brown carpenter jacket and tool-belt accent), and Granny
Qin (silver bun, moss-green clothes and sage shawl). Rows are facing down,
left, right and up. Match the existing player and Azhi sprite density and
foot baseline. Exactly one sprite per cell on a flat #ff00ff chroma-key
background; no grid, text, shadows, props, UI or watermark.
```

最终运行时文件：

- `characters/chr_villagers_idle_4dir_v01.png`
- `reference/bridge-dusk-stage1b-playable.png`
