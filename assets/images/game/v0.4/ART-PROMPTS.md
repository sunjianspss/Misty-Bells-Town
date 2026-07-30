# v0.4 阶段 0–2C 素材生成记录

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

## 阶段 2A 地形材质图集

输入参考：

- `backgrounds/scene_bridge_dusk_bg_576x448_v01.png`：现有样片的材质、配色与像素密度。
- `reference/bridge-dusk-direction.png`：整体完成度方向。

最终生成约束：

```text
Create exactly one square 4-column × 4-row terrain material atlas with sixteen
equal square cells. Row 1: four seamless spring-grass variants without flowers.
Row 2: four warm ochre dirt-path variants. Row 3: four old mauve-gray stone
plaza variants. Row 4: four blue-green river variants with sparse horizontal
ripples. Use polished original top-down pixel art designed to reduce to 32 × 32
pixels per cell, neutral spring daylight, consistent texture scale and crisp
1–3 pixel clusters. Cells are edge-to-edge with no margin, gutter, grid, label,
border or perspective. No shoreline, props, characters, buildings, bridge, UI,
text, logo, watermark, painterly blur, antialiasing or baked dusk lighting.
```

使用 OpenAI 内置图像生成工具得到的源图保存为
`source/terrain-materials-atlas-source-v01.png`。随后由
`scripts/prepare_stage2a_terrain.py` 按比例完整分格、缩放、统一同材质的色值与对比度，
并为每行四个变体建立共享的 4 像素环绕边缘后输出：

- `tiles/tile_terrain_base_4x4_v01.png`

运行时图集为 `128 × 128`，单元 `32 × 32`；第 0–3 行依次为草地、泥路、石广场和水面，
每行四个确定性变体。任意同材质变体横向或纵向相邻时外沿像素一致；素材加载失败时，
正式七天流程继续回退原程序绘制。

## 阶段 2B 地标、剧情道具与河岸

输入参考：

- `backgrounds/scene_bridge_dusk_bg_576x448_v01.png`：建筑、桥梁与水岸的材质密度。
- `reference/bridge-dusk-direction.png`：靛蓝屋瓦、暖木、苔绿与黄铜高光的综合色调。
- 阶段 2A 正式流程截图：只用于锁定原 `18 × 14` 空间、固体格和互动脚点。

四张源图均由 OpenAI 内置图像生成工具生成在完全平坦的 `#FF00FF` 背景上；没有从封面或
方向图裁切素材：

- `source/landmarks-keyed-v01.png`：两列，面包房与横向木桥。
- `source/herb-shed-keyed-v01.png`：两列，关闭 / 打开旧种子箱的通透药草棚。
- `source/story-props-keyed-v01.png`：严格 `4 × 3`，公告板、白布桌和村口节庆门状态。
- `source/riverbank-overlays-keyed-v01.png`：严格 `4 × 2`，北岸、西岸、转角、桥口与贴岸石组。

地标与剧情道具提示约束：

```text
Create original production-ready top-down pixel-art source sheets for the
formal seven-day map. Match the Stage 1B indigo roof tiles, warm cedar,
moss/sage greens, cream cloth, brass highlights and crisp 32 × 32 tile
density. Keep every object isolated and fully inside its prescribed cell on
a perfectly flat #FF00FF background. The landmark sheet contains a warm
bakery and a horizontal four-tile timber bridge without baked lantern,
wind-chime or ribbon effects. The 4 × 3 story sheet contains four progressive
notice-board states, four delivery/preparation table states, two festival
tables and two village-gate states. No people, ground, cast shadow, grid,
label, readable text, UI, logo or watermark.
```

河岸提示约束：

```text
Create one exact 4-column × 2-row transparent-ready riverbank overlay sheet
for 32 × 32 native tiles. Include two north-bank trims, two west-bank trims,
a northwest corner, a bridge-mouth bank, and two attached-stone variants.
Use mossy gray-violet stones and sparse reeds that match the formal blue-green
river. Do not include water fill, bridge deck, stepping-stone crossing,
characters, labels, grid, border or baked lighting. Use a perfectly flat
#FF00FF background.
```

药草棚补图提示约束：

```text
Create a two-column original pixel-art herb-stall source sheet. Both columns
share the same airy timber frame, moss-green cloth awning with indigo edge,
hanging dried herbs, cream tags without readable text and a lower shelf.
Column one has a closed seed crate at lower-right; column two has the same
crate open after the seed is found. The stall must read as pass-through
scenery because collision cannot change. Use crisp top-down three-quarter
pixel art on a perfectly flat #FF00FF background, with no ground, shadow,
rain, people, grid, label or watermark.
```

`scripts/prepare_stage2b_assets.py` 自带确定性色键、去品红溢色、硬 Alpha、无抖动减色、
分格、脚点对齐和前景遮挡层生成。仓库内源图可直接生成最终文件，不依赖未保存的临时透明图：

```bash
uv run --python 3.12 python scripts/prepare_stage2b_assets.py \
  --landmarks assets/images/game/v0.4/source/landmarks-keyed-v01.png \
  --herb-shed assets/images/game/v0.4/source/herb-shed-keyed-v01.png \
  --story-props assets/images/game/v0.4/source/story-props-keyed-v01.png \
  --riverbank assets/images/game/v0.4/source/riverbank-overlays-keyed-v01.png \
  --landmark-output assets/images/game/v0.4/props/prop_landmarks_layers_2x2_v01.png \
  --herb-output assets/images/game/v0.4/props/prop_herb_shed_layers_2x2_v01.png \
  --story-output assets/images/game/v0.4/props/prop_story_props_4x3_v01.png \
  --riverbank-output assets/images/game/v0.4/tiles/tile_riverbank_overlay_4x2_v01.png
```

运行时图集契约：

- `prop_landmarks_layers_2x2_v01.png`：`384 × 320`，单元 `192 × 160`；面包房 /
  桥梁各有 base 与 foreground。
- `prop_herb_shed_layers_2x2_v01.png`：`192 × 160`，单元 `96 × 80`；关闭 / 打开种子箱
  各有 base 与 foreground。
- `prop_story_props_4x3_v01.png`：`256 × 192`，单元 `64 × 64`；12 格均有内容。
- `tile_riverbank_overlay_4x2_v01.png`：`128 × 64`，单元 `32 × 32`；8 格均有内容。

四张图集均只含 `0 / 255` Alpha，运行时可见像素没有精确或近似品红。相同源图和脚本重复
运行会得到字节一致的 PNG。新素材加载失败时，正式流程继续执行原程序绘制。

## 阶段 2C 静态核心美术收尾

生成方式仍为 Codex 内置 `image_gen`，使用全新生成模式；没有使用封面裁切、外部素材或
图片编辑模式。四张生成源图均以 `#FF00FF` 为目标的品红色键底生成；处理器会采样边缘
色差并确定性清除，而不假定生成图每个背景像素完全同色。

### 分层春树

```text
Create one original isolated pixel-art spring tree asset for a cozy top-down
3/4-view East Asian riverside village game. This is a production game sprite
source, not an illustration. Show exactly ONE mature asymmetrical village
tree: a sturdy dark warm-brown trunk with visible roots, layered mossy
sage-green foliage, small muted dusty-pink spring blossoms, sparse warm-gold
leaf highlights, and deep cool green-violet shadow clusters. The silhouette
must be organic and clearly non-rectangular, broad enough to visually cover a
2x2 tile collision footprint, with the trunk centered near the bottom and a
few canopy branches extending toward the upper-right. Match this palette:
dark wood #56372D, warm wood #95603E, grass shadow #536A45, moss/sage
#78925E, blossom pink #D795A0, cream #E9E2CE, restrained gold #F0BF6D.
Crisp handcrafted pixel art, hard 1–2 pixel edge clusters, no antialias blur,
no gradients, no pure black outline, readable at tiny game scale. Center the
entire tree with generous empty space on every side. Use a perfectly uniform
flat #FF00FF background all the way to every image edge for chroma keying.
Absolutely no ground tile, grass patch, water, cast shadow, frame, grid,
label, text, UI, characters, buildings, extra objects, logo, or watermark.
```

### 花簇与芦苇

```text
Create one exact 4-column by 2-row production sprite source sheet of original
small pixel-art vegetation for a cozy top-down 3/4-view East Asian riverside
village game. The sheet must contain exactly EIGHT isolated centered sprites
with large clean gaps; four equally spaced columns and two equally spaced
rows, no cell borders and no grid lines. Top row, left to right: (1) compact
warm honey-gold wildflower cluster with leaves, (2) compact dusty-pink spring
flower cluster with leaves, (3) compact pale cream/light-gold flower cluster
with leaves, (4) mixed tiny pink-gold-cream flower cluster. Bottom row, left
to right: (1) short three-stem river reed clump, (2) taller five-stem reed
clump with subtle seed heads, (3) left-leaning reed clump, (4) right-leaning
reed clump with a few narrow leaves. Every sprite is a freestanding
transparent-ready prop with no grass or water tile beneath it. Match palette:
grass shadow #536A45, moss #78925E, reed #6B8E59, gold #F4C467 and #F0BF6D,
dusty pink #D795A0, cream #E9E2CE. Crisp handcrafted pixel art, hard 1–2
pixel clusters, no antialias blur, no gradients, no pure black outlines,
readable at 16x16 logical-pixel game scale. Use a perfectly uniform flat
#FF00FF background across the entire image and to every edge for chroma
keying. Absolutely no ground, water, shadows, pots, baskets, characters,
labels, text, numbers, UI, borders, grid, logo, or watermark.
```

### 节庆静态附件

```text
Create one exact 4-column by 2-row production sprite source sheet of original
small pixel-art festival props for a cozy top-down 3/4-view East Asian
riverside village game. The sheet must contain exactly EIGHT isolated
centered sprites with large clean gaps; four equally spaced columns and two
equally spaced rows, no cell borders and no grid lines. Every cell is a
distinct freestanding prop on the same scale.
Top row, left to right: (1) a plain low wooden village display rack, (2) the
same low rack carrying three neatly rolled fabrics in dusty coral, sage green,
and warm apricot gold, (3) a low offering rack with two small woven baskets
and cream parcels, (4) a slender dark-warm timber bridge lamp post with a
short horizontal hook and an EMPTY hanging gap—no lantern body and no flame,
because an animated lantern sprite will overlay it.
Bottom row, left to right: (1) an airy two-post bridge festival scaffold with
one thin upper cord and three empty hanging points, (2) the same scaffold with
small coral/cream/sage static knots for tied ribbons but no long moving cloth,
(3) the same scaffold with exactly three small cream rectangular lamp-test
tags hanging from the upper cord, (4) the same scaffold with an extra upper
wish cord and several short coral/sage/gold wish tags. Do not include wind
chimes, lantern flames, long waving ribbons, particles, or glow; those remain
separate animated layers.
Match palette: dark wood #56372D, warm wood #95603E, grass shadow #536A45,
sage #7AA091, gold #F0BF6D, dusty coral #DE9471, dusty pink #D795A0, cloth
blue #7AA8C3, cream #E9E2CE and #F0E3C7. Crisp handcrafted pixel art,
top-down three-quarter view, hard 1–2 pixel clusters, no antialias blur, no
gradients, no pure black outlines, readable at tiny game scale. Use a
perfectly uniform flat #FF00FF background across the entire image and to every
edge for chroma keying. Absolutely no ground, water, bridge deck, cast
shadows, people, buildings, labels, readable text, numbers, UI, borders,
grid, logo, or watermark.
```

### 春 7 匿名集会人群

```text
Create one exact 5-column by 1-row production sprite source sheet of original
anonymous festival crowd characters for a cozy top-down 3/4-view East Asian
riverside village pixel game. Show exactly FIVE isolated full-body villagers,
equally spaced left-to-right, all in a neutral standing down-facing pose with
their feet aligned on one common baseline. They are existing unnamed festival
bystanders, not story characters. Keep every person centered in an
equal-width cell with large clean gaps and no overlap, no cell borders and no
grid lines.
Left to right: (1) a short young villager with a round sage cap, cream shirt
and muted coral vest; (2) a slim adult with dark tied hair, indigo-blue jacket
and apricot sash; (3) a broad older adult with a small straw cap, warm brown
vest and cream sleeves; (4) a petite elder with a pale head scarf, dusty pink
outer robe and sage apron; (5) a tall adult with dark bobbed hair, muted teal
tunic and warm-gold scarf. Make all five immediately distinguishable by hat
or hair silhouette, body proportion, and clothing shape, while preserving a
cohesive village palette. No one holds a weapon; optional tiny static basket
or folded fan is acceptable but must stay inside that character cell.
Match the existing game character scale and palette: dark outline-brown
#56372D, warm brown #95603E, sage #7AA091, indigo/cloth blue #5E7894 and
#7AA8C3, dusty coral #DE9471, dusty pink #D795A0, cream #E9E2CE, gold
#F0BF6D. Crisp handcrafted pixel art with expressive tiny faces, hard 1–2
pixel clusters, no antialias blur, no gradients, no pure black outlines. Use
a perfectly uniform flat #FF00FF background across the whole image and to
every edge for chroma keying. Absolutely no ground, shadows, scenery, props
between characters, labels, text, numbers, UI, borders, grid, logo, or
watermark.
```

源图与运行时文件：

- `source/tree-keyed-v01.png` →
  `props/prop_tree_layers_1x2_v01.png`（`96 × 192`，单元 `96 × 96`）。
- `source/flora-static-keyed-v01.png` →
  `tiles/tile_flora_static_4x2_v01.png`（`128 × 64`，单元 `32 × 32`）。
- `source/festival-accents-keyed-v01.png` →
  `props/prop_festival_accents_4x2_v01.png`（`256 × 128`，单元 `64 × 64`）。
- `source/festival-crowd-keyed-v01.png` →
  `characters/chr_festival_crowd_idle_5x1_v01.png`（`200 × 48`，单元 `40 × 48`）。
- `source/villagers-idle-transparent-v01.png` →
  `characters/chr_villagers_idle_4dir_v02.png`（`160 × 192`）。
- `source/azhi-walk-keyed.png` →
  `characters/chr_azhi_walk_4dir_4f_v02.png`（`160 × 192`）。

最后两张 `v02` 沿用已经生成并入库的原创人物源图，只做内容分带、统一比例、脚点修正、
硬 Alpha 与无抖动减色，没有重新生成角色设计。六张运行时图集可由仓库脚本复现：

```bash
uv run --python 3.12 python scripts/prepare_stage2c_assets.py \
  --tree assets/images/game/v0.4/source/tree-keyed-v01.png \
  --flora assets/images/game/v0.4/source/flora-static-keyed-v01.png \
  --festival-accents assets/images/game/v0.4/source/festival-accents-keyed-v01.png \
  --festival-crowd assets/images/game/v0.4/source/festival-crowd-keyed-v01.png \
  --villagers assets/images/game/v0.4/source/villagers-idle-transparent-v01.png \
  --azhi assets/images/game/v0.4/source/azhi-walk-keyed.png \
  --tree-output assets/images/game/v0.4/props/prop_tree_layers_1x2_v01.png \
  --flora-output assets/images/game/v0.4/tiles/tile_flora_static_4x2_v01.png \
  --festival-output assets/images/game/v0.4/props/prop_festival_accents_4x2_v01.png \
  --crowd-output assets/images/game/v0.4/characters/chr_festival_crowd_idle_5x1_v01.png \
  --villagers-output assets/images/game/v0.4/characters/chr_villagers_idle_4dir_v02.png \
  --azhi-output assets/images/game/v0.4/characters/chr_azhi_walk_4dir_4f_v02.png
```

处理脚本执行确定性色键、去品红 / 绿幕、可见 Alpha 裁切、内容分带、脚点对齐、硬 Alpha、
无抖动减色与树冠前景层生成。相同源图重复运行得到字节一致的 PNG；任一运行时素材失败时
只回退对应旧绘制。
