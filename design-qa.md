# 雾铃小镇 v0.4 视觉 QA

## 阶段 2D.1 花草密度重制

## 验证范围

- 目标：让正式七天流程的草坪重新拥有样图中可直接辨认的花与草，同时保留人物、任务点、
  道路和互动目标的可读性。
- 本轮新增：`v02` 透明花草细节图集、当前日 NPC 清晰区、分带密度、每格 `±2` 原生像素
  的确定性错位散布。
- 本轮不改：`18 × 14` 地图、碰撞、NPC 与互动坐标、七天剧情、存档、键盘 / 触屏操作、
  字体、文案、UI 布局与响应式 CSS。

## 视觉证据

- 目标参考：`/Users/sun/Documents/gpt-5.4/farm-game/artifacts/stage2d1-reference-flora-density.png`
  - `1280 × 720`，用户指定的花草密度样图。
- 最终桌面实现：`/Users/sun/Documents/gpt-5.4/farm-game/artifacts/stage2d1-implementation-desktop.png`
  - 浏览器视口 `1440 × 1000`；游戏画布显示 `1152 × 896`，对应原生 `576 × 448` 的
    整数 `2×` 显示。
  - 正式流程春 1 清晨薄雾状态。
- 最终游戏画布裁片：`/Users/sun/Documents/gpt-5.4/farm-game/artifacts/stage2d1-implementation-canvas.png`
  - `1152 × 896`。
- 手机实现：`/Users/sun/Documents/gpt-5.4/farm-game/artifacts/stage2d1-implementation-mobile.jpg`
  - `390 × 844`，正式流程画布以 `288px` 整数对齐策略显示。
- 合并对照：`/Users/sun/Documents/gpt-5.4/farm-game/artifacts/stage2d1-design-qa-comparison.png`
  - `1400 × 980`；上方为完整场景并排，下方为花草重点区域并排。

参考图与实现图的时段、天气和部分地图美术状态不同，所以只比较花草的可见密度、尺度、
色彩节奏与散布方式，不把清晨 / 黄昏色温差或场景布局差当作偏差。

## 必查视觉面

### 图像、颜色与像素质量

- `tile_grass_details_4x4_v02.png` 为 `128 × 128` RGBA PNG，保持严格 `4 × 4`、
  `32 × 32` 单元与硬 Alpha；没有模糊、半透明白边、品红底或拉伸。
- 紫、粉、金三色碎花及绿 / 金草穗来自项目既有原创花草图集的确定性重排；没有裁切封面、
  复制参考截图像素或引入外部美术。
- 清晨薄雾会自然降低饱和度，但合并对照中仍能在上方草场、道路边缘和下方草坪直接辨认
  花点与草穗，不再只剩均匀绿色底纹。

### 密度、布局与层级

- 高密生态带每个 `2 × 2` 宏块最多三处强细节，中密 / 道路边缘最多两处，普通区域一处；
  形成连续花草节奏而不是全图同密度铺满。
- 每个细节带确定性 `±2` 像素错位，最终画面未发现明显棋盘中心、整齐横行或移动闪烁。
- 当前日 NPC 脚点与既有互动格不放置细节；人物、任务菱形、公告板、桥头与村口路牌仍
  位于视觉最上层，无关键目标被花草遮挡。
- 字体、文案、卡片、按钮、图标、圆角、间距和页面信息顺序未改，未引入通用占位卡片、
  CSS 插画、手写 SVG 或其他视觉捷径。

### 响应式、交互与可访问性

- 桌面 `1440 × 1000` 与手机 `390 × 844` 均无画布裁切、横向溢出或 UI 重叠；手机继续
  使用 `288px` 游戏宽度，像素边缘清楚。
- 手机正式流程中“右”触屏按钮唯一命中并成功触发移动；本地服务随后收到
  `assets/audio/sfx-step.wav` 请求，证明输入链路仍正常。
- 任务提示、当前目标与操作说明继续保留；系统“减少动态效果”路径及焦点 / 语义按钮代码
  未由本轮修改。

## 迭代记录

1. 第一轮 P1：花与草尺寸偏大且形成棋盘式符号。缩小运行时细节、降低单格内容量并保留
   硬 Alpha。证据：`artifacts/stage2d1-iteration-1.png`。
2. 第二轮 P2：符号感减弱，但碎花仍偏少。重排强 / 弱细节池并缩小混合花簇。证据：
   `artifacts/stage2d1-iteration-2.png`。
3. 第三轮 P1：画面过度保守，无法达到用户所指的样图密度。改为当前日清晰区并增加生态带
   的强细节名额。证据：`artifacts/stage2d1-iteration-3.png`。
4. 第四轮 P2：密度已接近目标，但局部仍有图块中心排列。加入确定性 `±2` 像素错位并
   微调紫 / 粉 / 金权重。证据：`artifacts/stage2d1-iteration-4.png`。
5. 最终合并对照确认：花草已清楚可见，人物与互动点保持清晰，无未修复的 P0 / P1 / P2。

## 技术验证

- `node --check script.js`：通过。
- `node --check assets/game-art-v04.js`：通过。
- `uv run --python 3.12 python -m py_compile scripts/prepare_stage2d_assets.py`：通过。
- `git diff --check`：通过。
- 草地底纹、跨格草团和 `v02` 细节图集重新生成后逐字节一致。
- 本地服务日志确认 `tile_grass_base_4x2_v01.png`、`tile_grass_patches_4x2_v01.png`、
  `tile_grass_details_4x4_v02.png` 均返回 HTTP 200。
- 桌面与手机正式流程控制台均无 warning / error。

## 最终发现

- P0：无。
- P1：无。
- P2：无。

阶段 2D.1 result: passed

## 阶段 3A 人物基础动画

### 验证范围

- 保留 `18 × 14` 地图、全部碰撞、五位 NPC 的既有坐标 / 互动 ID、七天剧情、存档与键盘 /
  触屏操作，只更换人物运行时图集和渲染选择逻辑。
- 玩家维持四方向四步移动；阿栀与四位村民具备两帧待机；打开对话时，只有当前行对应的
  具名 NPC 使用两帧举手交谈姿态。公告栏和旁白不会触发人物动作。
- `?motion=reduce` 与系统减少动态效果路径固定首帧；移动、交谈、剧情推进和存档不等待动画。

### 技术与素材验证

- `node --check script.js` 与 `node --check assets/game-art-v04.js`：通过。
- `uv run --python 3.12 python -m py_compile scripts/prepare_stage3a_assets.py`：通过。
- `git diff --check`：通过。
- `prepare_stage3a_assets.py` 重新生成的四张图集均通过尺寸、硬 Alpha、非空内容和统一
  `y=46` 脚点验证；与入库 PNG 逐字节比较一致。
- 本地 HTTP 服务确认 `chr_player_walk_4dir_4f_v02.png`、`chr_azhi_talk_4dir_2f_v01.png`、
  `chr_villagers_idle_4dir_2f_v03.png`、`chr_villagers_talk_4dir_2f_v01.png` 全部返回 HTTP 200。

### 交互与响应式验证

- 桌面真实浏览器：从标题页开始，按上 / 右靠近阿栀并打开三行对话；说话人姿态正确加载，
  对话能完整关闭。
- `?motion=reduce`：重复上述对话流程后，游戏恢复移动；无动画依赖导致的卡死。
- `390 × 844` 手机视口：对话卡片、触屏方向键和“交谈 / 互动”按钮均可访问；“上”触屏按钮
  成功触发移动并请求脚步音。
- 桌面与手机浏览器控制台均无 warning / error。

### 最终发现

- P0：无。
- P1：无。
- P2：无。

阶段 3A result: passed

## 阶段 3B 人物专属动作

### 验证范围

- 保留 `18 × 14` 地图、碰撞、NPC / 互动坐标、七天剧情、存档、键盘与触屏操作；本轮仅增加
  五位既有角色的可选专属动作图集与渲染优先级。
- 阿栀在春 6 / 春 7 整理布条；林麦递出面包篮；沈砚自春 4 起试灯 / 拉铃绳；许槐自春 4 起
  敲击风铃；秦婆婆自春 5 起查看药草。未满足日期时各角色沿用阶段 3A 待机。
- 具名对话的交谈动作优先于专属动作；对话打开时其余角色不播放工作动作；
  `?motion=reduce` 与系统减少动态效果路径固定首帧，剧情与操作不依赖动画。

### 技术与素材验证

- `node --check script.js` 与 `node --check assets/game-art-v04.js`：通过。
- `uv run --python 3.12 python -m py_compile scripts/prepare_stage3b_assets.py`：通过。
- `git diff --check`：通过。
- `prepare_stage3b_assets.py` 重新生成两张图集均通过尺寸、硬 Alpha、非空内容和统一 `y=46`
  脚点验证；与入库 PNG 逐字节比较一致。
- 本地 HTTP 服务确认 `chr_azhi_ribbons_4dir_2f_v01.png` 与
  `chr_villagers_work_4dir_2f_v01.png` 均返回 HTTP 200。

### 交互与响应式验证

- 桌面真实浏览器的春 6 桥边样片中，阿栀布条、林麦面包篮、沈砚绳索、许槐工具与秦婆婆药草
  均正常出现；画布无拉伸或层级遮挡。
- 靠近沈砚并打开对话后，沈砚切换为交谈姿态，专属动作停止，关闭对话后可恢复；浏览器控制台
  无 warning / error。
- `?scene=bridge-dusk&motion=reduce` 可正常进入样片且动画固定首帧；`390 × 844` 手机视口中
  画布、方向键和“交谈 / 互动”按钮均无裁切或重叠，控制台无 warning / error。

### 最终发现

- P0：无。
- P1：无。
- P2：无。

阶段 3B result: passed

## 阶段 3C 环境动画演出

### 验证范围

- 保留 `18 × 14` 地图、碰撞、NPC / 互动坐标、七天剧情、任务布尔值、存档格式、键盘与
  触屏操作；本轮只增加环境帧选择、两帧匿名人群及雨水 / 花瓣特效。
- 正式流程继续使用既有四帧风铃、布条、灯笼与水面反光；春 4 增加四处水洼涟漪，春 6
  增加暖岸 / 冷河像素光界，春 7 增加三处错相风铃、两帧人群与低密度花瓣流。
- `?motion=reduce` 与系统减少动态效果路径固定全部环境动画首帧；移动、互动、任务与剧情
  不等待动画事件。

### 技术与素材验证

- `node --check script.js` 与 `node --check assets/game-art-v04.js`：通过。
- `uv run --python 3.12 python -m py_compile scripts/prepare_stage3c_assets.py`：通过。
- `git diff --check`：通过。
- `prepare_stage3c_assets.py` 重新生成两张图集后通过尺寸、硬 Alpha、非空内容与人群统一
  `y=46` 脚点验证；与工作区 PNG 逐字节比较一致。
- 本地 HTTP 服务确认 `chr_festival_crowd_idle_10x1_2f_v02.png` 与
  `fx_weather_4x2_4f_v01.png` 均返回 HTTP 200。

### 交互与响应式验证

- 桌面真实浏览器分别进入春 4 清晨、春 6 黄昏与春 7 黄昏：雨线 / 水洼、暖冷光界 / 三盏
  桥灯、连续风铃 / 人群 / 花瓣均正常出现，人物脚点、桥面和任务标记未被遮挡。
- 春 7 动态模式间隔 `750 ms` 的两张画布可见人群、花瓣和水面帧变化；减少动态效果模式
  间隔 `1000 ms` 的两张 `576 × 448` 画布 SHA-256 完全一致。
- `390 × 844` 手机视口保留 `288px` 游戏显示、方向键与“交谈 / 互动”按钮；“左”触屏按钮
  成功触发移动。桌面与手机控制台均无 warning / error。

### 最终发现

- P0：无。
- P1：无。
- P2：无。

final result: passed

## 阶段 4A 村落民居与街巷

### 验证范围

- 保留 `18 × 14` 地图、全部既有固体格、五位 NPC / 互动坐标、七天剧情、任务状态、存档格式
  和键盘 / 触屏操作；暖木民居位于南街中段，鼠尾草民居移到东北河岸无任务空地。
- 南街横路与回接支路连接村口和桥头，东北河岸短街从广场东侧延伸到住宅门前；没有新增
  室内地图、村民、对白、任务或存档字段。

### 素材与技术验证

- `prop_village_houses_layers_2x2_v01.png` 为 `256 × 256` RGBA PNG，严格 `2 × 2`、
  `128 × 128` 单元与硬 Alpha；上行为两栋房屋基底，下行为对应屋顶前景。
- 品红底原创源图由内置图像生成工具生成，透明中间稿通过严格近色阈值去背；未使用外部素材、
  封面裁切、截图复制、文字或水印。
- `node --check script.js`、`node --check assets/game-art-v04.js`、Python 编译检查与
  `git diff --check`：通过。
- `prepare_stage4a_village_assets.py` 重建图集后与工作区 PNG 逐字节一致。

### 交互与响应式验证

- 桌面证据：`output/playwright/stage4a1-house-layout-desktop.png`；两栋民居已分散在南街和
  东北河岸，阿栀、玩家、任务标记与桥头路线均完整可见。
- 景深证据：`output/playwright/stage4a1-house-depth-front.png`；玩家站在南街门前时绘制在屋檐
  前，不再被固定前景层压住。
- 手机证据：`output/playwright/stage4a1-house-layout-mobile.png`；`390 × 844` 视口继续使用
  `288px` 游戏画布，两栋房屋均在画面内且无横向溢出。
- 玩家到达南街门前 `(8, 11)` 后向下移动，存档坐标仍为 `(8, 11)`；墙体碰撞生效，村口纵路
  与阿栀所在格保持开放。
- 桌面 / 手机同一真实浏览器会话的控制台为 `0 error / 0 warning`。

### 最终发现

- P0：无。
- P1：无。
- P2：已修复两栋房屋集中在地图底部、屋顶固定覆盖门前人物的问题。

final result: passed

## 桥面碰撞与桥灯通行修正

### 根因与修复

- 灯笼从未加入 `world.solids`；真正的隐形墙来自画面呈现上下两排木板，而 `world.bridge`
  只登记了下排 `y=10`，所以玩家从截图中的 `(11,9)` 向右会把上排木板误判为水格。
- `world.bridge` 现在覆盖 `x=11–14, y=9–10`；桥外仍保持水体碰撞，沈砚等 NPC 仍保持
  原坐标与实体碰撞。
- 春 1–5 与春 6 的桥灯绘制锚点统一抬到北侧栏杆 / 水边；`lantern-left`、
  `lantern-center`、`lantern-right` 的互动格与剧情状态保持不变。
- 玩家在桥边撞到 NPC 时提示交谈或绕行，撞到真正的桥外水面时提示沿木板行走。

### 交互与视觉验证

- `output/playwright/bridge-two-row-passage.png`：春 1 玩家已从截图起点绕过沈砚走到下排
  `(14,10)`，上下两排木板与桥灯位置清楚可见。
- `output/playwright/bridge-lantern-upper-lane.png`：春 6 傍晚三盏灯点亮时，玩家站在上排
  `(13,9)`，灯笼均位于桥栏侧。
- Playwright 从截图坐标实走：`(11,9) → (12,9) → (13,9)`；向沈砚所在 `(14,9)` 移动时
  保持 `(13,9)`，随后 `(13,10) → (14,10)` 可从下排绕过。春 6 点灯状态重复验证上排
  `(11,9) → (12,9) → (13,9)`。
- 浏览器控制台 `0 error / 0 warning`；`node --check script.js` 与 `git diff --check` 通过。

### 最终发现

- P0：无。
- P1：无。
- P2：桥面画面 / 碰撞不一致与灯笼假碰撞均已修复。

final result: passed
