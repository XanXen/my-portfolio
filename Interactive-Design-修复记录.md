# Interactive Design 页面 - 问题与修复记录

## 修复日期：2026-05-13 ~ 2026-05-14

---

## Bug 列表

### 1. p5.js Canvas 被 hero 完全遮盖（严重）
- **问题**：`.interactive-hero` 设置了 `position: fixed`，p5.js canvas 在文档流中被完全挡住，用户看不到也无法交互
- **修复**：将 hero 改为 `position: relative`，canvas 放入独立的 `.canvas-section` 区域并使用 `#canvas-wrapper` 作为 p5.js 的 parent 容器

### 2. 缺少返回按钮/导航动画（功能缺失）
- **问题**：其他子页面（game-design、vulnerable fence、board game）都有返回按钮和页面进出动画，此页面完全没有
- **修复**：添加了与其他页面一致的 `moveInBottom`/`moveOut` 动画，导航链接点击时带退出动画跳转

### 3. 没有 cursor 效果（功能缺失）
- **问题**：页面只加载了 `Interactive Design.js`（纯 p5.js），没有加载 `script.js`，也没有自己处理 cursor 逻辑。光标元素存在但不会移动
- **修复**：在 JS 中添加了完整的 cursor 效果逻辑（lerp 插值跟随、hover 放大、light-mode 白色光标），与其他子页面保持一致

### 4. Mobile 菜单无法打开（Bug）
- **问题**：HTML 中有 `.menu-btn` 和 `.nav-links` 元素，但没有任何 JS 处理点击事件，移动端汉堡菜单完全无法使用
- **修复**：添加了 mobile menu toggle 逻辑

### 5. Hero hover 交互不完整（设计缺陷）
- **问题**：hover 时图片向外滑动 50%，但下面什么内容都没有——交互没有意义
- **修复**：在每个 hero-left/right 中添加了 `.hero-reveal` 层，hover 时图片滑开露出项目标题、描述和标签

### 6. 缺少图片 0.jpg ~ 7.jpg（隐含 Bug）
- **问题**：原 JS 的 `preload()` 尝试加载 `0.jpg` 到 `7.jpg`，但 images 目录中根本没有这些文件，控制台会报 8 个加载失败错误
- **修复**：移除了 `preload()` 和 `img[]` 数组，直接使用程序生成的植物图案 `generatedImages[]`，消除无意义的网络请求和控制台报错

### 7. Canvas 固定尺寸 1495x785 不响应（Bug）
- **问题**：canvas 硬编码为 1495x785，`windowResized()` 函数体为空，窗口变化时 canvas 不自适应
- **修复**：canvas 尺寸改为基于 `#canvas-wrapper` 容器宽度动态计算，`windowResized()` 中重新调整 canvas 和所有 generatedImages 的尺寸

### 8. Save 按钮绝对定位 position(1250, 28)（Bug）
- **问题**：按钮固定在 x=1250 的位置，小于 1250px 宽度的屏幕上按钮会超出视口不可见
- **修复**：按钮改为 CSS 定位（`position: absolute; top: 16px; right: 16px`），始终在 canvas 右上角

### 9. Body 背景色冲突（隐含 Bug）
- **问题**：`style.css` 中 body 背景为白色 `#ffffff`，但此页面需要黑色背景，原来没有覆盖
- **修复**：在 `<style>` 标签中显式设置 `body { background: #000 }`

### 10. Header 结构不一致（代码问题）
- **问题**：原 HTML 的 navbar 直接放在 `.container` 中，没有 `#header` 包裹，与 game-design.html 等页面的结构不一致
- **修复**：添加 `#header` 包裹层，CSS 中为其设置 `position: fixed` 和暗色背景样式

### 11. `copy()` 参数越界导致图像错位（隐含 Bug）
- **问题**：原 `draw()` 中 `fake.copy(sourceImg, mouseX - size1/2, ...)` 当鼠标靠近边缘时，源坐标可能为负数或超出图像范围，导致渲染异常
- **修复**：使用 `constrain()` 限制源坐标在合法范围内

---

## 新增功能

1. **Hero 交互揭示层**：hover 图片滑开后显示项目标题、描述文字和引导箭头
2. **项目信息区域**：页面底部添加了项目介绍和元数据（年份、类型、工具、角色）
3. **响应式设计**：900px 和 600px 两个断点，移动端 hero 改为纵向排列并默认显示信息层
4. **页面进出动画**：与其他子页面保持一致的滑入/滑出效果

## 修改的文件

- `Interactive Design.html` — 重构页面结构（双面板 hero + 项目详情页入口）
- `Interactive Design.css` — 完全重写样式（hero 面板滑动 + 信息覆盖层）
- `Interactive Design.js` — 重写交互逻辑（JS 管理 hover 状态 + 光标 + 导航动画）

---

## 2026-05-13 ~ 2026-05-14 追加修复

### 12. Interactive Design hero 交互重构（重大）
- **问题**：原 hero 交互为 CSS `:hover` 驱动面板缩放，存在闪烁问题（面板移开后失去 hover 状态→无限循环）
- **修复**：改为 JS `mousemove` 管理 hover 状态，鼠标在左侧→左面板滑动到右侧覆盖右面板，项目介绍出现在左侧空出的位置；反之亦然。`mouseleave` 时平滑回到 50/50 初始状态

### 13. Plant Sense Party 详情页 — 光标全程可用（重大）
- **问题**：iframe 捕获鼠标事件导致父页面自定义光标冻结。之前方案是隐藏光标，用户不满意
- **修复**：透明 overlay 拦截事件 → 光标正常追踪 → postMessage 转发坐标到 iframe → sketch.js 接收外部鼠标状态
- **相关文件**：`plant-sense-party.html`, `sketch/sketch.js`

### 14. iframe canvas 尺寸适配（Bug）
- **问题**：iframe 用 `width: 100%` 但内部 canvas 固定 1495x785，尺寸不匹配
- **修复**：iframe 保持原始 1495x785，CSS `transform: scale()` 等比缩放到容器宽度，容器高度动态计算

### 15. 全站光标反色效果（新功能）
- **问题**：用户要求光标在白色背景自动变黑，黑色背景自动变白
- **修复**：`style.css` 中 `.cursor` 父容器添加 `mix-blend-mode: difference`，光标圆统一白色，移除所有 `light-mode`/`dark-mode` CSS 和 JS 逻辑
- **影响文件**：`style.css`, `game-design.css`, `Interactive Design.css`, 所有详情页

### 16. isMobile 误判（Bug，全站）
- **问题**：`"ontouchstart" in window` 在 Mac 触控板上为 true，`||` 逻辑导致桌面端被判定为移动端，光标被删除
- **修复**：`||` 改为 `&&`
- **影响文件**：`Interactive Design.js`, `game-design.js`, `plant-sense-party.html`, `daoist-doctrine.html`

### 17. vulnerable fence / board game — 光标缺失 + 按钮被遮挡（Bug）
- **问题**：两个页面完全没有自定义光标 HTML/JS；body 的 `transform: translateY()` 动画破坏 `position: fixed` 定位，导致 "Back to Game Design" 按钮被内容遮挡
- **修复**：添加光标 HTML + JS；入场动画改为 opacity-only（不使用 transform）；清理冲突的 CSS 覆盖
- **影响文件**：`vulnerable fence.html`, `board game.html`, `vulnerable.css`, `board game.css`

---

## 全部修改文件汇总

| 文件 | 修改内容 |
|------|----------|
| `Interactive Design.html` | 重构 hero 双面板结构 |
| `Interactive Design.css` | hero 面板滑动动画 + 信息覆盖层样式，移除 light-mode |
| `Interactive Design.js` | JS 管理 hover + 光标（移除 light-mode / transform 覆盖），isMobile 修复 |
| `plant-sense-party.html` | overlay + postMessage 架构，iframe 缩放，光标全程可用 |
| `daoist-doctrine.html` | 移除 light-mode，isMobile 修复 |
| `sketch/sketch.js` | 添加 extMouse + message 监听，draw() 使用外部坐标 |
| `vulnerable fence.html` | 重写：添加光标，opacity-only 动画 |
| `board game.html` | 重写：添加光标，opacity-only 动画，z-index 修复 |
| `style.css` | .cursor 父容器 mix-blend-mode: difference，光标圆改 position: absolute |
| `game-design.css` | 移除 dark-mode/light-mode 覆盖 |
| `vulnerable.css` | 移除光标样式覆盖 |
| `board game.css` | 移除 background-color: white |
| `game-design.js` | isMobile 修复 |
