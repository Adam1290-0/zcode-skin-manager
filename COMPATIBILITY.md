# 兼容性 / Compatibility

## ⚠️ 版本针对性（务必先读）

本补丁**已在 ZCode 3.7.6 / 3.8.1 / 3.9.1 / 3.9.2 / 3.10.1 上开发和验证**。ZCode 3.7.6 对应 Electron 41.0.3；3.9.x/3.10.x 的 Electron 版本以你本地安装为准。

- ✅ 已测试版本：**ZCode 3.7.6 / 3.8.1 / 3.9.1 / 3.9.2 / 3.10.1**
- ❌ **其他版本不保证可用**。ZCode 是闭源应用，其内部实现（CSS 变量名、主题 class、`app.asar` 结构、preload API）会随版本变化，任何改动都可能导致本补丁失效甚至让 ZCode 无法启动。

**使用前请先确认你的 ZCode 版本是 3.7.6 / 3.8.1 / 3.9.1 / 3.9.2 / 3.10.1。** 若版本不符，请勿直接打补丁，等待适配或自行评估风险。

---

## 已验证环境

| 项 | 值 |
|---|---|
| 操作系统 | Windows 11（build 26200） |
| **ZCode 版本** | **3.7.6（Electron 41.0.3）/ 3.8.1 / 3.9.1 / 3.9.2 / 3.10.1 — 已验证版本** |
| 安装路径 | `H:\Zcode\`（默认安装位置） |
| Node.js | v24.x（`npx` 解包/重打包用） |
| Python | 3.14.x（注入脚本用） |

## 依赖的内部结构

本补丁依赖以下 ZCode 内部实现，**若这些结构在后续版本变化，补丁必然失效**：

| 依赖 | 说明 |
|---|---|
| `--color-*` CSS 变量 | Tailwind v4 语义 token（`--color-background-win-alt`、`--color-background`、`--color-surface`、`--color-surface-hover`、`--color-background-alt` 等） |
| `.theme-zai-dark` / `.theme-zai-light` | 内置主题 class（由 `localStorage['zcode-theme']` 驱动） |
| `window.zcode.selectFile` | preload 暴露的原生文件选择器 |
| `out/renderer/index.html` | 注入点（`</body>` 前） |

## 已知限制

| 限制 | 说明 |
|---|---|
| 仅 Windows | `patch.bat` 是 Windows 批处理；路径处理针对 Windows |
| 仅深色主题 | 变量覆盖针对 `.theme-zai-dark`（ZCode 默认深色） |
| 视频需 webm | Electron 默认无 H.264 解码器，mp4 大概率无法播放 |
| 更新会失效 | ZCode 自动更新覆盖 `app.asar` 后需重新打补丁 |
| 无官方插件接口 | 官方插件系统无 UI 扩展点，只能用 asar 注入方式 |

## 如何确认你的 ZCode 版本

1. 打开 ZCode，查看「设置 / 关于」或启动日志
2. 或查看安装目录：`H:\Zcode\resources\app-update.yml` 或 `app.asar` 内 `package.json` 的 `version` 字段

## 未来兼容性建议

若 ZCode 官方开放主题/外观设置入口（`zcode-theme` 键名和 `theme-zai-*` 类名暗示官方预留了扩展点），建议改用官方能力，本补丁作为过渡方案。
