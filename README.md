# ZCode Skin Manager / ZCode 皮肤管理器

> 🔗 **广告**：[sharellm.net](https://sharellm.net/sign-up?aff=wb5b) — AI 模型共享平台，海量模型一键体验

[English](#english) · [中文](#中文)

给 [ZCode](https://zcode.z.ai) 桌面端加上「皮肤设置」功能：壁纸（图片/视频）、14 区透明度（带红框实时预览）、毛玻璃、动态特效、加载图标 GIF 替换，右上角一个可拖动的 🎨 按钮一键调节。

Give the [ZCode](https://zcode.z.ai) desktop app a "skin" feature: wallpaper (image/video), 14-zone opacity with live red-outline preview, frosted glass, dynamic effects, and a custom GIF loading spinner — all adjustable from a draggable 🎨 button in the top-right corner.

---

## 📌 版本对应表 / Version Matrix

**打补丁前请先核对你的 ZCode 版本！** 查看方法见 [COMPATIBILITY.md](COMPATIBILITY.md#如何确认你的-zcode-版本)。

| 补丁版本 | 适配 ZCode 版本 | 状态 | 主要变化 |
|---|---|---|---|
| **v2.0.3（最新）** | **3.7.6 ~ 3.10.2** | ✅ 当前维护版本 | 🌈 氛围灯升级：热点流动 + 亮度呼吸 |
| v2.0.1 | 3.7.6 ~ 3.10.2 | ✅ | 🐛 修复氛围灯定位、输入遮挡、面板错位 |
| v2.0.0 | 3.7.6 ~ 3.10.2 | ⚠️ 已弃用 | 氛围灯初版，请用 v2.0.1+ |
| v1.8.9 | 3.7.6 / 3.8.1 / 3.9.1 / 3.9.2 / 3.10.1 / 3.10.2 | ✅ | 验证适配 ZCode 3.10.2 |
| v1.8.8 | 3.7.6 ~ 3.10.1 | ✅ | 修复左侧列表运行态图标未替换（黑名单方案回归 + 排除按钮 loading） |
| v1.8.7 | 3.7.6 ~ 3.10.1 | ✅ | inject.py 幂等（与其他注入补丁共存） |
| v1.8.0 | 3.7.6 / 3.8.1 / 3.9.1 | ✅ | 新增界面字号、滚动条样式、主题色、终端光标、全局圆角缩放 |
| v1.7.2 | 3.7.6 / 3.8.1 / 3.9.1 | ✅ | 修复视频壁纸重建、spinner 观察器节流、特效监听器泄漏 |
| v1.7.1 | 3.7.6 / 3.8.1 / 3.9.1 | ✅ | UI 紧凑化：GIF 控件一行、状态色改原生取色器、预览去偏移 |
| v1.7.0 | 3.7.6 / 3.8.1 / 3.9.1 | ✅ | 状态四态配色、失败红点呼吸光晕、完成/错误图标染色 |
| v1.6.0 | 3.7.6 / 3.8.1 / 3.9.1 | ✅ | 回归 background 方案根治 GIF timing 错位；偏移改 px 输入框 |
| v1.5.2 | 3.7.6 / 3.8.1 / 3.9.1 | ⚠️ 被 v1.6+ 取代 | 修复方案B兜底选择器作用域 |

> ⚠️ 本项目是**社区第三方补丁**，通过修改 ZCode 的 `app.asar` 注入前端脚本实现，**与 ZCode 官方无关**。使用前请阅读 [DISCLAIMER.md](DISCLAIMER.md) 和 [COMPATIBILITY.md](COMPATIBILITY.md)。
>
> ⚠️ This is a **community third-party patch**. It works by modifying ZCode's `app.asar` and injecting a frontend script, and is **not affiliated with ZCode**. Read [DISCLAIMER.md](DISCLAIMER.md) and [COMPATIBILITY.md](COMPATIBILITY.md) before use.
>
> **ZCode 是闭源应用且更新频繁**——每次官方更新都可能让补丁失效。若你的 ZCode 版本不在上表中，请勿直接打补丁；可以提 Issue 告知你的版本号，我会评估适配。

---

<a name="english"></a>
## English

### Features

- 🎨 Draggable skin button in the top-right corner (position survives window resize/fullscreen via ratio anchoring)
- 🖼️ Wallpaper: static image / GIF / animated WebP / **video wallpaper** (webm)
- 🪟 Per-region opacity: 14 independent sliders (main area, background ×2, surface ×2, sidebar, header, panel, card, input, tooltip, menu, terminal, border)
- 🔴 **Live region preview**: hovering/dragging a slider draws a pulsing red outline around every UI region it affects — see exactly what you're changing (panel shows a hint if that region isn't currently visible)
- ⏳ **Loading spinner customization**: replace the spinning "working" indicator with your own GIF —
  - auto-detected aspect ratio (non-square/strip images display fully)
  - scale (20–1000%) / X / Y offset inputs in one row + reset button
  - background removal: white-key / black-key / **smart auto-detect**
  - file picker restricted to `.gif`; only task-running indicators are replaced — button loadings stay native
- 🌫️ Frosted glass (backdrop-filter) + wallpaper blur
- ✨ Dynamic effects: starfield / snow / aurora gradient
- 🎬 Video wallpaper: one slider for speed & pause (slide to 0 = pause)
- 🌈 **Input glow (Ambient Edge)**: a soft ambient light track around the chat composer —
  - 3 presets (Lounge / Aurora / Reactive) + fully custom gradient (2–6 color stops), 8 palette chips
  - direction (CW / CCW / ping-pong), period 2–60 s, brightness, track width, outer glow blur & intensity, optional hue cycling
  - state feedback with ▶ preview buttons: focus boost, typing speed-up, blur dimming, send sweep, AI-working flow/breath, done bloom, error pulse — each with its own color & timing
  - night dimming (time window), custom easing, up to 5 named user presets, honors `prefers-reduced-motion`
- 🎭 Export/import config as JSON
- 🔵 **Status indicator colors**: custom colors for error/unread/idle/success dots (native color pickers), optional pulsing glow on the error dot
- 🖌️ **Appearance**: UI font size, scrollbar width/rounding, theme color, terminal cursor color + blink, global corner-radius scale
- 💾 Settings apply instantly and persist in localStorage

### Install

**Prerequisites**: Windows 10/11, Python 3, Node.js (`npx`).

1. **Fully quit ZCode** (right-click the tray icon → Quit, not just closing the window)
2. Double-click `patch.bat`
3. Wait for `[SUCCESS] Patch completed!`
4. Reopen ZCode → a 🎨 button appears in the top-right corner

### Uninstall

1. Quit ZCode
2. Double-click `unpatch.bat`
3. Restores the original `app.asar` (backed up as `app.asar.skinbak` on first patch)

### Usage

| What you want | How |
|---|---|
| Change wallpaper | Click 「浏览…」 next to the wallpaper field and pick an image/video |
| Change region opacity | Drag the corresponding slider (0 = fully transparent, 1 = solid); hover to see the red outline preview |
| Enable frosted glass | Drag the 「毛玻璃」 slider (0 = off) |
| Add dynamic effects | Pick starfield/snow/aurora from the 「动态特效」 dropdown |
| Video wallpaper | Select a `.webm` file — speed slider appears; slide fully left (⏸) to pause |
| Replace loading spinner | 「替换为 GIF」→ pick a `.gif`; adjust size/ratio/offset/background-removal below it |
| Input glow | Main panel → 「✨ 输入框氛围灯」：toggle + 「配置…」 opens the full panel (presets, colors, states with ▶ preview, user presets) |
| Share config | Click 「导出」 to copy JSON; others paste it via 「导入」 |

### Files

```
├── patch.bat        # one-click patch (extract → inject → repack)
├── unpatch.bat      # one-click restore
├── inject.py        # injection helper (called by patch.bat)
└── ui_skin.js       # the skin script injected into ZCode's renderer
```

### FAQ

**Q: Skin disappears after ZCode auto-updates?**
A: Updates overwrite `app.asar`. Re-run `patch.bat`. If ZCode jumped several versions, check the [Version Matrix](#-版本对应表--version-matrix) first — the new version may need patch changes.

**Q: mp4 video wallpaper won't play?**
A: Electron ships without an H.264 decoder by default. Convert to `.webm` (VP8/VP9):
```
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -an output.webm
```

**Q: The button overlaps other buttons?**
A: Drag it with the mouse — position is stored as a window ratio, so it stays put across resizes/fullscreen.

**Q: No red outline when hovering a slider?**
A: That region's panel probably isn't open (e.g. menus/tooltips only exist while shown). The panel shows a yellow hint when this happens. Terminal needs an open terminal tab; border isn't highlightable (it's a stroke, not a fill).

### How it works

ZCode is an Electron + React + Tailwind v4 app. All colors are driven by `--color-*` CSS variables, and it ships a `zai-dark`/`zai-light` theme with no UI entry point. This tool injects a script into `app.asar`'s `index.html` that overrides the `.theme-zai-dark` variables to semi-transparent and mounts a wallpaper layer.

Key points:
- The wallpaper uses `<img>`/`<video>` elements (ZCode's `html,body,#root{background:0 0!important}` blocks `background`-based wallpapers)
- Must override `--color-background-win-alt` / `--color-background` / `--color-surface` (used by the main UI root and surface layers since 3.8.x)
- The loading spinner is a lucide SVG with `.animate-spin` + `currentColor`, so it can be restyled or replaced wholesale

---

<a name="中文"></a>
## 中文

### 功能

- 🎨 右上角可拖动的皮肤按钮（按窗口比例锚定，缩放/全屏不丢失）
- 🖼️ 壁纸：静态图 / GIF / 动态 WebP / **视频壁纸**（webm）
- 🪟 分区透明度：14 个独立滑杆（主区、背景×2、表面×2、侧栏、顶栏、面板、卡片、输入框、提示、菜单、终端、边框）
- 🔴 **滑块高亮预览**：悬停/拖动滑杆时，受影响的 UI 区域显示脉动红框，直观看到改的是哪里（区域未打开时面板会给出黄色提示）
- ⏳ **处理中图标定制**：用 GIF 替换侧栏/任务的旋转加载圈——
  - 自动识别宽高比，长条/非正方形 GIF 完整显示不裁剪
  - 缩放（20–1000%）/ 偏移X / 偏移Y 一行三列输入框 + 一键复位
  - 底色处理：去白底 / 去黑底 / **智能去底**（自动采样边缘像素判断底色）
  - 文件选择限定 .gif 格式；只替换任务运行态图标，按钮 loading 不受影响
- 🌫️ 毛玻璃（backdrop-filter）+ 壁纸模糊
- ✨ 动态特效：星空 / 飘雪 / 极光渐变
- 🎬 视频壁纸：速度与暂停合一滑杆（拉到最左 = 暂停）
- 🌈 **输入框氛围灯（Ambient Edge）**：聊天框外圈的柔和环境光轨——
  - 3 套模式（Lounge 柔和质感 / Aurora 科技感 / Reactive 状态响应）+ 2–6 色标自定义渐变 + 8 个预设配色
  - 流向（顺时针 / 逆时针 / 往返摆动）、周期 2–60s、亮度、光轨宽度、光晕扩散与强度、可选全谱色相循环
  - 状态反馈（每项独立开关/颜色/参数，▶ 一键预览）：聚焦增强、输入提速、失焦降亮、发送扫光、生成中流动/呼吸、完成扩散、失败脉冲
  - 夜间定时降亮、缓动函数自定义、最多 5 个「我的预设」，遵循系统「减少动态」设置
- 🎭 配置 JSON 导入/导出
- 🔵 **状态指示染色**：失败红点/未读蓝点/空闲灰点/完成对勾四态自定义颜色（原生取色器），失败红点可加呼吸光晕
- 🖌️ **外观定制**：界面字号、滚动条宽窄圆角、主题色、终端光标颜色+闪烁、全局圆角缩放
- 💾 设置实时生效并持久化到 localStorage

### 安装

**前置条件**：Windows 10/11、Python 3、Node.js（`npx`）。

1. **完全退出 ZCode**（右键系统托盘图标 → 退出，不是关窗口）
2. 双击 `patch.bat`
3. 等待出现 `[SUCCESS] Patch completed!`
4. 重新打开 ZCode → 右上角出现 🎨 按钮

> 💡 **与其他注入补丁共存**：patch 从**当前** app.asar 解包（不是老备份），注入是幂等的——重打本补丁会自动替换旧注入、保留其他补丁（如 zcode-account-switcher）的修改，两个补丁可以任意顺序反复打，互不覆盖。

### 卸载

1. 退出 ZCode
2. 双击 `unpatch.bat`
3. 恢复原始 `app.asar`（首次打补丁时自动备份为 `app.asar.skinbak`）

### 使用说明

| 你想做什么 | 怎么做 |
|---|---|
| 换壁纸 | 壁纸输入框右侧点「浏览…」选图片/视频 |
| 调分区透明度 | 拖对应滑杆（0=全透，1=实底）；悬停可见红框预览 |
| 开毛玻璃 | 拖「毛玻璃」滑杆（0=关） |
| 加动态特效 | 「动态特效」下拉选星空/飘雪/极光 |
| 视频壁纸 | 选 `.webm` 文件，出现速度滑杆；拉到最左（⏸）暂停 |
| 替换加载图标 | 「替换为 GIF」选一个 .gif；下方调尺寸/比例/位置/去底 |
| 输入框氛围灯 | 主面板「✨ 输入框氛围灯」：开关 + 「配置…」打开独立面板（模式/配色/状态反馈▶预览/我的预设） |
| 分享配置 | 点「导出」复制 JSON，别人「导入」粘贴 |

### 文件说明

```
├── patch.bat        # 一键打补丁（解包 → 注入 → 重打包）
├── unpatch.bat      # 一键还原
├── inject.py        # 注入辅助脚本（patch.bat 调用）
└── ui_skin.js       # 注入到 ZCode 渲染进程的皮肤脚本
```

### 常见问题

**Q：ZCode 自动更新后皮肤没了？**
A：更新会覆盖 `app.asar`，重新双击 `patch.bat` 即可（皮肤配置在 localStorage，不会丢）。若 ZCode 跨了多个版本，先对照上方[版本对应表](#-版本对应表--version-matrix)确认是否需要补丁更新。

**Q：mp4 视频壁纸放不出来？**
A：Electron 默认不带 H.264 解码器，请转成 `.webm`（VP8/VP9）：
```
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -an output.webm
```

**Q：按钮挡住了别的按钮？**
A：鼠标按住 🎨 按钮拖动即可，位置按窗口比例记忆，缩放/全屏都不会跑丢。

**Q：悬停滑杆没有红框？**
A：该区域所在窗口可能没打开（如菜单、悬浮提示只在弹出时存在），此时面板会出现黄色提示。终端需要开着终端页签才有红框；「边框」是描边不是色块，无法框选预览。

**Q：氛围灯的发送扫光没触发？**
A：发送检测监听的是聊天输入框内的 Enter（Shift+Enter 换行不触发）。用鼠标点发送按钮不会触发扫光，属预期。「生成完成/失败」反馈依赖 AI 生成结束后侧栏任务状态，若此前 5 分钟内没有发送过消息则不触发。

**Q：氛围灯找不到输入框？**
A：光轨自动定位主界面聊天输入框（向上找带圆角边框的容器）。皮肤面板、设置对话框、搜索框内的输入框已被排除。若 ZCode 更新后改了输入框 DOM 结构导致找不到，面板里点 ▶ 预览会提示「未找到」。

### 原理

ZCode 是 Electron + React + Tailwind v4 应用，所有颜色由 `--color-*` CSS 变量驱动，内置 `zai-dark`/`zai-light` 主题但无 UI 入口。本工具在 `app.asar` 的 `index.html` 注入脚本，把 `.theme-zai-dark` 的变量覆盖为半透明 + 挂载壁纸层。

关键点：
- 壁纸用 `<img>`/`<video>` 元素挂载（官方 `html,body,#root{background:0 0!important}` 封死了 background 挂图）
- 必须覆盖 `--color-background-win-alt` / `--color-background` / `--color-surface`（3.8.x 起表面层大量使用 surface 变量）
- 加载圈是 lucide SVG + `.animate-spin` + `currentColor`，因此可整体替换为 GIF

### 更新日志 / Changelog

### v2.0.3

- 🌈 氛围灯视觉升级：热点流动（conic 渐变内插透明段产生流光感）+ 亮度呼吸动画（整体缓慢明暗起伏）
- 🎛️ 新增流光热点、呼吸幅度、呼吸周期三个调节滑杆

### v2.0.2

- 🐛 修复失败红点光晕大小/强度不可调
- 🐛 修复二级面板展开内容超出屏幕
- 🐛 修复换颜色等操作导致面板被关闭

### v2.0.1

- 🐛 修复氛围灯找不到输入框、光效遮挡输入、二级面板错位等问题

### v2.0.0

- 🌈 全新「输入框氛围灯（Ambient Edge）」：三层光效设计——
  - 环境光轨：conic 渐变环绕慢流（`@property` 角度插值，GPU 合成不重排），细光芯 + 模糊光晕双层
  - 状态反馈：聚焦增强 / 输入提速 / 失焦降亮 / 发送扫光 / 生成中（流动·呼吸·静态三模式）/ 完成扩散 / 失败脉冲，全部独立开关+颜色+参数，行内 ▶ 预览
  - 独立二级面板：3 套模式、8 个预设配色、2–6 色标自定义渐变、流向/周期/亮度/光轨宽/光晕、夜间定时降亮、缓动、最多 5 个「我的预设」
  - 遵循 `prefers-reduced-motion`（减少动态时冻结为静态渐变）
- 🗑️ 移除「预设主题」占位功能（用户确认无实际价值，面板空间让位给氛围灯）

### v1.8.9

- 🆙 验证适配 ZCode 3.10.2（CSS 与 3.10.1 完全一致，JS 关键结构未变，隔离注入通过）

### v1.8.8

- 🐛 修复左侧对话/任务列表「正在处理」图标未被替换（回到黑名单方案 + 精确排除按钮 loading）

### v1.8.7

- 🔧 inject.py 幂等（与 account-switcher 补丁共存）+ 启动时序兜底

### v1.8.6

- 🐛 修复左侧对话列表的「正在处理」图标未被替换（白名单补充「图标槽位」识别：relative+shrink-0+size-4）

### v1.8.5

- 🐛 修复了一些小 bug

### v1.8.4

- 🆙 验证适配 ZCode 3.10.1（注入点/CSS 变量/spinner/状态点/selectFile 全部未变，隔离注入通过）

### v1.8.3

- 🐛 修复 spinner GIF 在 flex 容器中被压缩（加 flex:0 0 auto）

### v1.8.2

- 🆙 验证适配 ZCode 3.9.2（CSS/注入点/spinner/状态点/preload 结构全部未变，隔离注入测试通过）

### v1.8.1

- 🔄 修复 AI 生成回答时的运行态转圈未被替换（移除 v1.6 时代误加的 `chat-loading-animate` 黑名单，该转圈就是聊天主窗口的生成指示器）

### v1.8.0

- 🆕 外观定制五件套：界面字号（`--ui-font-size`）、滚动条宽窄/圆角、主题色（primary+brand）、终端光标颜色+闪烁、全局圆角缩放

### v1.7.2

- 🐛 修复视频壁纸在改任何配置时都被重建重头播放（路径不变则复用现有元素）
- ⚡ spinner 观察器用 requestAnimationFrame 合帧节流（React DOM 变更频繁）
- 🐛 修复特效 canvas 的 resize 监听器泄漏

### v1.7.1

- 🧹 UI 紧凑化：GIF 缩放/偏移一行三列 + ↺ 复位
- 🎨 状态颜色改原生取色器（点击弹系统调色板）+ 默认恢复按钮
- 🐛 预览只反映缩放/去底，不再应用偏移（修复错位）

### v1.7.0

- 🎨 状态四态自定义配色（失败/未读/空闲/完成，覆盖 `--color-destructive`/`--color-success`）
- ✨ 失败红点呼吸光晕动画
- 🎨 完成对勾 / 错误 X 图标染色

### v1.6.0

- 🔧 回归纯 CSS background 方案，根治 GIF timing 错位（孤儿 img 残留、与红点叠加、hover 消失等一串 bug 全部解决）
- 📍 偏移从 0-100 百分比改为 px 数字输入框，范围 20-1000% 缩放

### v1.5.2

- 🛡️ 修复方案B兜底选择器未限定作用域、可能误伤设置页加载圈的隐患（选择器全部加 #sidebar / 聊天历史区前缀）
- ✅ 全面自检 + 隔离实测通过

### v1.5.1

- 📍 修复 GIF 位置偏移数行：注入时给父级内联 position:relative，定位锚点固定在图标处；img 改用 left/top + 负 margin 定位
- 🔄 修复更换 GIF 后不生效：MutationObserver 回调改调 window 级同步函数，永远拿到最新配置，不再捕获旧闭包
- 🎨 修复去底色失效：给父级设 isolation:isolate，避免 opacity 过渡创建堆叠上下文隔离 mix-blend-mode

### v1.5.0

- 🔧 重写加载圈 GIF 替换为混合方案：有 HTML 包装层的 spinner 注入真实 img（支持去底色+偏移），裸 svg 用 background-image 兜底保证显示
- 根因：ZCode 的 .animate-spin 元素本身就是 lucide 的 svg，往 svg 里塞 img 无效（SVG 命名空间不渲染 HTML img）

### v1.4.6

- 📍 新增 GIF 位置偏移微调：「位置·横」「位置·纵」两个滑杆（0–100%，默认居中），素材不居中时放大后可校正取景位置

### v1.4.5

- 🧹 UI 精简：视频速度与暂停合并为一个滑杆（拉到最左=⏸）；移除加载圈颜色输入（仅保留 GIF 替换）；底色处理下拉同行显示并新增**智能去底**；GIF 文件选择限定 .gif；收紧分区透明度标题空行

### v1.4.4

- 🐛 修复悬停提示导致面板乱抖（提示区改为固定占位）
- 🐛 修复面板内 GIF 预览不显示
- 🐛 修复 GIF 放大被 Tailwind max-width 钳制不生效
- ✨ 新增 GIF 底色透明处理（去白底/去黑底）

### v1.4.0 – v1.4.3

- 🔴 滑块高亮红框预览 + 区域未打开黄色提示
- ⏳ 加载圈替换为 GIF：自动识别宽高比、完整显示非正方形素材、宽度/高度双滑杆、锁定长宽比开关

### v1.3.0

- 🆙 适配 ZCode 3.9.1（核心变量全部仍在，向下兼容 3.7.6 / 3.8.1）

### v1.2.0

- 🆙 适配 ZCode 3.8.1：新增 `--color-background-alt`、`--color-surface`、`--color-surface-hover` 三个分区滑杆（3.8.1 大量使用 `bg-surface` 类）

### v1.1.0

- 🎯 修复皮肤按钮在窗口缩放/全屏后「丢失」（改用相对比例锚点）
- 🧩 修复 patch/unpatch 未备份 `app.asar.unpacked` 原生模块导致终端/SSH 损坏

### v1.0.0

- 首个版本：壁纸、分区透明度、毛玻璃、动态特效、视频壁纸、预设主题、配置导入导出

## License

[MIT](LICENSE)
