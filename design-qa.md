# 阶段 2D.1 花草密度重制 QA

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

final result: passed
