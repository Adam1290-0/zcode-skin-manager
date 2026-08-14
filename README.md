# ZCode Skin Manager / ZCode 皮肤管理器

[English](#english) · [中文](#中文)

给 [ZCode](https://zcode.z.ai) 桌面端加上「皮肤设置」功能：壁纸（图片/视频）、分区透明度、毛玻璃、动态特效，右上角一个可拖动的 🎨 按钮一键调节。

Give the [ZCode](https://zcode.z.ai) desktop app a "skin" feature: wallpaper (image/video), per-region opacity, frosted glass, dynamic effects — all adjustable from a draggable 🎨 button in the top-right corner.

> ⚠️ 本项目是**社区第三方补丁**，通过修改 ZCode 的 `app.asar` 注入前端脚本实现，**与 ZCode 官方无关**。使用前请阅读 [DISCLAIMER.md](DISCLAIMER.md) 和 [COMPATIBILITY.md](COMPATIBILITY.md)。
>
> ⚠️ This is a **community third-party patch**. It works by modifying ZCode's `app.asar` and injecting a frontend script, and is **not affiliated with ZCode**. Read [DISCLAIMER.md](DISCLAIMER.md) and [COMPATIBILITY.md](COMPATIBILITY.md) before use.

---

<a name="english"></a>
## English

### Features

- 🎨 Draggable skin button in the top-right corner (position is remembered)
- 🖼️ Wallpaper: static image / GIF / animated WebP / **video wallpaper** (webm)
- 🪟 Per-region opacity: 11 independent sliders (main area, sidebar, header, panel, card, input, terminal, border, etc.)
- 🌫️ Frosted glass (backdrop-filter) + wallpaper blur
- ✨ Dynamic effects: starfield / snow / aurora gradient
- 🎬 Video wallpaper controls: playback speed, pause
- 🎭 4 preset themes + export/import config as JSON
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
| Change region opacity | Drag the corresponding slider (0 = fully transparent, 1 = solid) |
| Enable frosted glass | Drag the 「毛玻璃」 slider (0 = off) |
| Add dynamic effects | Pick starfield/snow/aurora from the 「动态特效」 dropdown |
| Video wallpaper | Select a `.webm` file — speed/pause controls appear automatically |
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
A: Updates overwrite `app.asar`. Re-run `patch.bat` (your settings live in localStorage and are not lost).

**Q: mp4 video wallpaper won't play?**
A: Electron ships without an H.264 decoder by default. Convert to `.webm` (VP8/VP9):
```
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -an output.webm
```

**Q: The button overlaps other buttons?**
A: Drag it with the mouse — the position is remembered.

**Q: Want to reset to defaults?**
A: Use the 「恢复默认」 button at the bottom of the panel.

### How it works

ZCode is an Electron + React + Tailwind v4 app. All colors are driven by `--color-*` CSS variables, and it ships a `zai-dark`/`zai-light` theme with no UI entry point. This tool injects a script into `app.asar`'s `index.html` that overrides the `.theme-zai-dark` variables to semi-transparent and mounts a wallpaper layer.

Key points:
- The wallpaper uses `<img>`/`<video>` elements (ZCode's `html,body,#root{background:0 0!important}` blocks `background`-based wallpapers)
- `--color-background-win-alt` must be overridden (the main UI root uses it)

---

<a name="中文"></a>
## 中文

### 功能

- 🎨 右上角可拖动的皮肤按钮（位置自动记忆）
- 🖼️ 壁纸：静态图 / GIF / 动态 WebP / **视频壁纸**（webm）
- 🪟 分区透明度：11 个独立滑杆（主区、侧栏、顶栏、面板、卡片、输入框、终端、边框等）
- 🌫️ 毛玻璃（backdrop-filter）+ 壁纸模糊
- ✨ 动态特效：星空 / 飘雪 / 极光渐变
- 🎬 视频壁纸控制：播放速度、暂停
- 🎭 4 套预设主题 + 配置 JSON 导入/导出
- 💾 设置实时生效并持久化到 localStorage

### 安装

**前置条件**：Windows 10/11、Python 3、Node.js（`npx`）。

1. **完全退出 ZCode**（右键系统托盘图标 → 退出，不是关窗口）
2. 双击 `patch.bat`
3. 等待出现 `[SUCCESS] Patch completed!`
4. 重新打开 ZCode → 右上角出现 🎨 按钮

### 卸载

1. 退出 ZCode
2. 双击 `unpatch.bat`
3. 恢复原始 `app.asar`（首次打补丁时自动备份为 `app.asar.skinbak`）

### 使用说明

| 你想做什么 | 怎么做 |
|---|---|
| 换壁纸 | 壁纸输入框右侧点「浏览…」选图片/视频 |
| 调分区透明度 | 拖对应滑杆（0=全透，1=实底） |
| 开毛玻璃 | 拖「毛玻璃」滑杆（0=关） |
| 加动态特效 | 「动态特效」下拉选星空/飘雪/极光 |
| 视频壁纸 | 选 `.webm` 文件，自动出现速度/暂停控制 |
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
A：更新会覆盖 `app.asar`，重新双击 `patch.bat` 即可（皮肤配置在 localStorage，不会丢）。

**Q：mp4 视频壁纸放不出来？**
A：Electron 默认不带 H.264 解码器，请转成 `.webm`（VP8/VP9）：
```
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -an output.webm
```

**Q：按钮挡住了别的按钮？**
A：鼠标按住 🎨 按钮拖动即可，位置会记住。

**Q：想恢复默认设置？**
A：面板底部「恢复默认」按钮。

### 原理

ZCode 是 Electron + React + Tailwind v4 应用，所有颜色由 `--color-*` CSS 变量驱动，内置 `zai-dark`/`zai-light` 主题但无 UI 入口。本工具在 `app.asar` 的 `index.html` 注入脚本，把 `.theme-zai-dark` 的变量覆盖为半透明 + 挂载壁纸层。

关键点：
- 壁纸用 `<img>`/`<video>` 元素挂载（官方 `html,body,#root{background:0 0!important}` 封死了 background 挂图）
- 必须覆盖 `--color-background-win-alt`（主 UI 根容器用它）

## License

[MIT](LICENSE)
