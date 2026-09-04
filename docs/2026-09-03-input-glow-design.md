# 设计文档：输入框氛围灯（Ambient Edge）

- 日期：2026-09-03
- 状态：已确认（用户批准）
- 版本目标：zcode-skin-manager v2.0.0

## 背景与目标

为 ZCode 聊天输入框外圈实现"嵌在组件内部的环境光轨"（隐藏光源、连续灯带、低亮度分层 + 预设灯效、状态联动、参数可调），兼顾高级感与状态反馈。

定位：**环境光缝，不是霓虹边框**。光线让位于文字、光标、发送按钮。

## 视觉规格

### 三层结构

1. 环境光轨（常驻）：细边缘（默认 1.5px）低亮度双色/三色渐变环绕，慢速流动（默认 18s 周期），外侧柔光晕。
2. 聚焦/输入层：focus 增亮（默认 +10%）、typing 提速（默认 1.5x）、blur 降亮（默认 −50%），停输入 idleBack 秒后回落。
3. 状态反馈层：send 扫光（0.8s）、working 流动（5s 周期）、done 扩散（1.2s）、error 双脉冲（1.6s），结束后恢复环境光。

### 默认配色（青蓝紫）

`#38D9E8 → #5B8CFF → #A78BFA`

## 面板结构

主面板新增「✨ 输入框氛围灯」分组：总开关 + 当前模式 + 「配置…」打开独立二级面板（340px、可滚动、三折叠区）：

1. 环境光轨：模式（Lounge/Aurora/Reactive）、配色库色卡 8 个、渐变色标编辑器（2–6 标）、方向（水平左右/往返/环绕 CW/CCW）、周期 2–60s、亮度 0–40%、光轨宽 1–3px、晕扩散 0–24px、晕强度 0–100%、全谱 hue-rotate 开关+范围 15–360°。
2. 状态反馈：每个状态独立开关+颜色+参数，行内「▶ 预览」按钮。
3. 高级：夜间降亮（时段+幅度）、缓动函数、恢复默认；reduced-motion 兼容不可关。
4. 用户预设：最多 5 个命名预设，随配置 JSON 导入/导出。

## 配色库

青蓝紫（默认）/ 暖夜 `#F5E6C8 → #D4A95C → #C97B4A` / 极光 `#34D399 → #22D3EE → #818CF8` / 玫瑰暮色 `#FDA4AF → #F472B6 → #C084FC` / 冰川蓝 `#A5F3FC → #67E8F9 → #38BDF8` / 赛博霓虹 `#F0ABFC → #E879F9 → #22D3EE` / 日落 `#FDE68A → #FB923C → #F43F5E` / 单色青 `#22D3EE`。

## 技术方案

- 光轨：`@property --zc-glow-angle`（Chromium 支持）+ `conic-gradient` 角度动画，GPU 合成不重排；伪元素绘制，光线藏于容器内部。
- 色彩：CSS 变量注入 `--zc-glow-c0..c5`，改变量即全层生效。
- 速度/亮度：`animation-duration` / `opacity` 变量。
- 状态：容器打 `data-zc-state` 属性，CSS 按属性切换动画；▶ 预览由 JS 临时加状态。
- composer 定位：MutationObserver + 启动重试打标（复用 spinner 同一方法论），黑名单排除皮肤面板/设置页/搜索框/终端。
- 状态检测：focusin/focusout（focus 层）、input 事件 + debounce（typing）、已有 `__zcodeSkinSpinSync` 同源逻辑识别生成态（working，svg.animate-spin 在聊天主窗口出现即视为 working）、send 用 Enter/发送后短暂窗口、done/error 由 working 结束后的错误红点/正常态推断。

## 配置结构（localStorage `zcode-skin-config` 内 `inputGlow` 键）

```json
{
  "enabled": true, "mode": "lounge",
  "colors": ["#38D9E8", "#5B8CFF", "#A78BFA"],
  "direction": "cw", "period": 18,
  "brightness": 12, "trackWidth": 1.5,
  "glowBlur": 10, "glowOpacity": 35,
  "hueCycle": false, "hueRange": 60,
  "states": {
    "focus": {"on": true, "boost": 10},
    "typing": {"on": true, "speedup": 1.5},
    "blur": {"on": true, "dim": 50},
    "send": {"on": true, "color": "#22D3EE", "dur": 0.8, "dir": "lr"},
    "working": {"on": true, "mode": "flow", "color": "#818CF8", "period": 5},
    "done": {"on": true, "color": "#34D399", "anim": "bloom", "dur": 1.2},
    "error": {"on": true, "color": "#F59E0B", "pulses": 2, "dur": 1.6},
    "idleBack": 2
  },
  "night": {"on": false, "from": "22:00", "to": "06:00", "dim": 40},
  "easing": "ease-in-out",
  "userPresets": {}
}
```

## 同步决策

- **删除现有「预设主题」PRESETS 功能**（占位符无实际价值，用户已确认），释放面板空间给氛围灯配置。
- 版本号升至 v2.0.0。

## 验收标准

- 开箱即得 Lounge 效果（不配置即有完整高级感）。
- 30+ 参数全部可调且实时生效，无需重启。
- ▶ 预览即点即播。
- 导入/导出包含 inputGlow。
- 性能：仅 transform/filter/opacity 动画；reduced-motion 时静止。
- 语法验证通过 + code-reviewer 审查通过。
