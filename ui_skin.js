(function () {
  if (window.__ZCODE_SKIN_UI__) return;
  window.__ZCODE_SKIN_UI__ = true;

  var LS_KEY = "zcode-skin-config";
  var STYLE_ID = "zcode-skin-style";
  var IMG_ID = "zcode-skin-img";
  var SIDE_IMG_ID = "zcode-skin-img-side";
  var FX_ID = "zcode-skin-fx";
  var BTN_ID = "zcode-skin-btn";
  var PANEL_ID = "zcode-skin-panel";

  // 当前正在播放的壁纸视频（用于播放控制）
  var wallpaperVideo = null;

  var DEFAULTS = {
    enabled: true,
    wallpaper: "",
    sidebar: "",
    sidebarWidth: 280,
    blurPanel: 12,
    blurWallpaper: 0,
    videoSpeed: 1,
    videoPaused: false,
    tint: "22,22,22",
    effect: "none",
    spinnerGif: "",
    spinnerGifScale: 100,
    spinnerGifRatio: 1,
    spinnerGifBlend: "",
    spinnerGifOffX: 0,
    spinnerGifOffY: 0,
    _gifV2: true,
    statusError: "",
    statusUnread: "",
    statusIdle: "",
    statusSuccess: "",
    statusFailPulse: false,
    uiFontSize: 0,
    scrollbarWidth: 0,
    accentColor: "",
    cursorColor: "",
    cursorBlink: false,
    radiusScale: 100,
    inputGlow: {
      enabled: true,
      mode: "lounge",
      colors: ["#38D9E8", "#5B8CFF", "#A78BFA"],
      direction: "cw",
      period: 18,
      brightness: 12,
      trackWidth: 1.5,
      glowBlur: 10,
      glowOpacity: 35,
      hueCycle: false,
      hueRange: 60,
      states: {
        focus: { on: true, boost: 10 },
        typing: { on: true, speedup: 1.5 },
        blur: { on: true, dim: 50 },
        send: { on: true, color: "#22D3EE", dur: 0.8 },
        working: { on: true, mode: "flow", color: "#818CF8", period: 5 },
        done: { on: true, color: "#34D399", dur: 1.2 },
        error: { on: true, color: "#F59E0B", pulses: 2, dur: 1.6 },
        idleBack: 2
      },
      night: { on: false, from: "22:00", to: "06:00", dim: 40 },
      easing: "ease-in-out",
      userPresets: {}
    },
    opacities: {
      backgroundWinAlt: 0.35,
      background: 0.45,
      backgroundAlt: 0.45,
      surface: 0.45,
      surfaceHover: 0.5,
      sidebar: 0.55,
      header: 0.5,
      panel: 0.6,
      card: 0.65,
      input: 0.7,
      tooltip: 0.92,
      menu: 0.92,
      terminal: 0.9,
      border: 0.12
    }
  };

  var VAR_MAP = {
    backgroundWinAlt: "--color-background-win-alt",
    background: "--color-background",
    backgroundAlt: "--color-background-alt",
    surface: "--color-surface",
    surfaceHover: "--color-surface-hover",
    sidebar: "--color-sidebar",
    header: "--color-header",
    panel: "--color-panel",
    card: "--color-card",
    input: "--color-input",
    tooltip: "--color-tooltip",
    menu: "--color-menu",
    terminal: "--color-terminal-bg",
    border: "--color-border"
  };

  var LABELS = {
    backgroundWinAlt: "主区域",
    background: "背景",
    backgroundAlt: "背景2",
    surface: "表面",
    surfaceHover: "悬停表面",
    sidebar: "侧栏",
    header: "顶栏",
    panel: "面板",
    card: "卡片",
    input: "输入框",
    tooltip: "提示",
    menu: "菜单",
    terminal: "终端",
    border: "边框"
  };

  var EFFECTS = { "none": "无特效", "stars": "星空", "snow": "飘雪", "aurora": "极光渐变" };

  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(LS_KEY));
      if (c && typeof c === "object") {
        var merged = JSON.parse(JSON.stringify(DEFAULTS));
        for (var k in c) merged[k] = c[k];
        if (c.opacities) {
          for (var k2 in c.opacities) merged.opacities[k2] = c.opacities[k2];
        }
        // inputGlow 深合并：旧配置缺新字段时用默认值补齐（升级不丢配置）
        if (c.inputGlow && typeof c.inputGlow === "object") {
          mergeDeep(merged.inputGlow, c.inputGlow);
        }
        // 旧数据迁移：v1.5.x 的 offset 是 0-100 百分比（50=居中），v1.6 起改为 px（0=不偏移）。
        // 缺少 _gifV2 标记的旧配置直接重置 offset 为 0，避免语义错乱。
        if (!merged._gifV2) {
          merged.spinnerGifOffX = 0;
          merged.spinnerGifOffY = 0;
          merged._gifV2 = true;
        }
        return merged;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  function save(c) {
    localStorage.setItem(LS_KEY, JSON.stringify(c));
  }

  // 用 defaults 里缺失的字段补齐 target（只深合并纯对象，数组/原始值直接覆盖）
  function mergeDeep(target, src) {
    for (var k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      var v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v) &&
          target[k] && typeof target[k] === "object" && !Array.isArray(target[k])) {
        mergeDeep(target[k], v);
      } else {
        target[k] = v;
      }
    }
  }

  function toFileUrl(p) {
    if (!p) return "";
    p = String(p).trim();
    if (/^file:\/\//i.test(p)) return p;
    if (/^https?:\/\//i.test(p)) return p;
    if (/^data:/i.test(p)) return p;

    // UNC 路径 \\server\share\img.jpg -> file://server/share/img.jpg
    if (/^\\\\/.test(p)) {
      return "file://" + p.replace(/\\/g, "/").slice(2);
    }

    // Windows 绝对路径 C:\... / C:/...
    if (/^[A-Za-z]:[\\/]/.test(p)) {
      var norm = p.replace(/\\/g, "/");
      var parts = norm.split("/");
      var head = parts.shift(); // 盘符 C:
      return "file:///" + head + "/" + parts.map(encodeURIComponent).join("/");
    }

    // 相对路径：无法可靠定位，提示并原样返回
    if (!/^\//.test(p)) {
      console.warn("[zcode-skin] 检测到相对路径，可能无法加载，建议用绝对路径：", p);
    }
    return p;
  }

  function buildCss(c) {
    var o = c.opacities || {};
    var tint = c.tint || "22,22,22";
    var vars = [];
    for (var k in VAR_MAP) {
      if (o[k] != null && !isNaN(o[k])) {
        vars.push(VAR_MAP[k] + ":rgba(" + tint + "," + o[k] + ")");
      }
    }
    var css = ".theme-zai-dark{" + vars.join(";") + "}";
    if (c.blurPanel > 0) {
      css += ".bg-background,.bg-sidebar,.bg-header,.bg-panel,.bg-background-win-alt{backdrop-filter:blur(" + c.blurPanel + "px)}";
    }
    return css;
  }

  function isVideoSrc(p) {
    return /\.(webm|mp4|mkv|mov|ogv|avi)$/i.test(String(p).split("?")[0]);
  }

  function mkMedia(id, src, w, h, c) {
    var url = toFileUrl(src);
    var media;
    if (isVideoSrc(src)) {
      media = document.createElement("video");
      media.autoplay = true;
      media.muted = true;
      media.loop = true;
      media.setAttribute("playsinline", "");
      media.playbackRate = c.videoSpeed || 1;
      media.src = url;
      media.onerror = function () {
        var fmt = /\.webm$/i.test(src) ? "" : "\n\n提示：mp4 可能因缺少 H.264 解码器无法播放，请转成 .webm（VP8/VP9）格式。";
        console.error("[zcode-skin] 视频加载失败:", url);
        alert("[zcode-skin] 视频壁纸加载失败：\n" + url + fmt);
      };
    } else {
      media = document.createElement("img");
      media.src = url;
      media.onerror = function () {
        console.error("[zcode-skin] 图片加载失败:", url);
      };
    }
    media.id = id;
    media.style.cssText =
      "position:fixed;left:0;top:0;width:" + w + ";height:" + h +
      ";object-fit:cover;z-index:-1;pointer-events:none;user-select:none;background:transparent";
    return media;
  }

  function applyCss(c) {
    var st = document.getElementById(STYLE_ID);
    if (!st) {
      st = document.createElement("style");
      st.id = STYLE_ID;
      document.head.appendChild(st);
    }
    if (!c.enabled) { st.textContent = ""; return; }
    var css = buildCss(c);

    // 会话/任务「处理中」旋转图标：ZCode 的 .animate-spin 元素本身就是 <svg>
    // （lucide createLucideIcon 直接 createElement('svg',{class:'lucide animate-spin'})）。
    // v1.6.0 回归早期 v1.4.0 的纯 CSS background 方案——GIF 直接画在 svg 的 background 上，
    // 不注入任何 DOM 节点。好处（也是修 v1.4.8~v1.5.3 那串 bug 的根本）：
    //   ① timing 完美对齐：GIF 就是 svg 自身的背景，svg 因为 React 状态切换被移除（running→error 等）
    //      时 GIF 随之消失，绝无「孤儿 img 残留」「与红点叠加」「hover 时 GIF 消失」等错位；
    //   ② 无 img 注入，也就无需清理孤儿节点。
    // 缩放用 width/height、偏移用 position:relative+left/top、去底用 mix-blend-mode 作用 svg 本身——
    // 三者都不创建 stacking context（不用 transform / isolation），给 mix-blend-mode 去底最大机会生效。
    // 作用域用 JS 打 data-zcode-skin-host 标记（黑名单排除），CSS 只作用带标记的 svg。
    var spinCss = [];
    if (c.spinnerGif) {
      var scale = Math.max(20, Math.min(1000, Number(c.spinnerGifScale) || 100)) / 100;
      var ratio = Number(c.spinnerGifRatio) || 1;
      if (ratio < 0.2) ratio = 0.2;
      if (ratio > 5) ratio = 5;
      var offX = Number(c.spinnerGifOffX);
      var offY = Number(c.spinnerGifOffY);
      if (isNaN(offX)) offX = 0;
      if (isNaN(offY)) offY = 0;
      offX = Math.max(-200, Math.min(200, offX));
      offY = Math.max(-200, Math.min(200, offY));
      var blendCss = "";
      if (c.spinnerGifBlend === "multiply") {
        blendCss = "mix-blend-mode:multiply !important;";
      } else if (c.spinnerGifBlend === "screen") {
        blendCss = "mix-blend-mode:screen !important;";
      } else if (c.spinnerGifBlend === "auto" && c._gifAutoBlend) {
        blendCss = c._gifAutoBlend;
      }
      var gw = Math.round(scale * 16);
      var gh = Math.round(scale * 16 / ratio);
      spinCss.push(
        "svg.animate-spin[data-zcode-skin-host]{" +
        "animation:none !important;border-radius:0 !important;border:0 !important;" +
        "width:" + gw + "px !important;height:" + gh + "px !important;" +
        "max-width:none !important;max-height:none !important;min-width:0 !important;min-height:0 !important;" +
        // flex-shrink:0 关键：ZCode 的 spinner 往往包在固定 size-4 的 flex 容器里，svg 作为 flex 子项
        // 默认 flex-shrink:1 会被压缩回容器尺寸，导致放大后的 GIF 显示被压缩（如聊天输入栏上方 pZe）。
        "flex:0 0 auto !important;" +
        "position:relative !important;left:" + offX + "px !important;top:" + offY + "px !important;" +
        "background:center / 100% 100% no-repeat url(\"" + toFileUrl(c.spinnerGif).replace(/"/g, "%22") + "\") !important;" +
        blendCss +
        "}" +
        "svg.animate-spin[data-zcode-skin-host]>*{display:none !important}"
      );
    }
    if (spinCss.length) css += spinCss.join("");

    // 状态指示渲染：任务/会话列表的失败红点、未读蓝点、空闲灰点、完成绿对勾。
    // 失败/完成通过覆盖 ZCode 语义色变量（--color-destructive / --color-success），
    // 这样红点、X 图标、所有错误态 / 对勾、成功态一起统一改色；未读/空调用精确 data 锚点。
    var statusCss = [];
    if (c.statusError) statusCss.push(".theme-zai-dark{--color-destructive:" + c.statusError + "}");
    if (c.statusUnread) statusCss.push("[data-unread-indicator]{background-color:" + c.statusUnread + " !important}");
    if (c.statusIdle) statusCss.push("[data-idle-indicator]{background-color:" + c.statusIdle + " !important}");
    if (c.statusSuccess) statusCss.push(".theme-zai-dark{--color-success:" + c.statusSuccess + "}");
    if (c.statusFailPulse) {
      // 心跳式呼吸光晕：双层 box-shadow 波纹扩散 + 红点自身脉动。
      // 光晕颜色用 --zc-fail-glow（默认红），跟随自定义失败色更协调。
      // 旧版单层 7px 扩散在 6px 小圆点+深色 UI 上几乎不可见，是"没效果"的根因。
      statusCss.push(
        ".theme-zai-dark{--zc-fail-glow:rgba(255,80,80,.85)}" +
        (c.statusError ? ".theme-zai-dark{--zc-fail-glow:" + c.statusError + "}" : "") +
        "@keyframes zc-fail-pulse{" +
        "0%{box-shadow:0 0 0 0 var(--zc-fail-glow);transform:scale(1)}" +
        "55%{box-shadow:0 0 0 7px transparent,0 0 0 13px rgba(255,80,80,.25);transform:scale(1.25)}" +
        "100%{box-shadow:0 0 0 7px transparent,0 0 0 13px transparent;transform:scale(1)}" +
        "}" +
        "[data-error-indicator]{animation:zc-fail-pulse 1.6s ease-in-out infinite !important}"
      );
    }
    if (statusCss.length) css += statusCss.join("");

    // 外观定制：字号 / 滚动条 / 主题色 / 终端光标 / 圆角缩放（全部纯 CSS 变量覆盖）
    var lookCss = [];
    if (c.uiFontSize > 0) lookCss.push(".theme-zai-dark{--ui-font-size:" + c.uiFontSize + "px}");
    if (c.scrollbarWidth > 0) {
      lookCss.push(
        "::-webkit-scrollbar{width:" + c.scrollbarWidth + "px !important;height:" + c.scrollbarWidth + "px !important}" +
        "::-webkit-scrollbar-thumb{border-radius:9999px !important;background:var(--color-border) !important}" +
        "::-webkit-scrollbar-track{background:transparent !important}"
      );
    }
    if (c.accentColor) {
      lookCss.push(".theme-zai-dark{--color-primary:" + c.accentColor + ";--color-brand:" + c.accentColor + "}");
    }
    if (c.cursorColor) lookCss.push(".theme-zai-dark{--color-terminal-cursor:" + c.cursorColor + "}");
    if (c.cursorBlink) {
      lookCss.push(
        "@keyframes zc-cursor-blink{0%,49%{opacity:1}50%,100%{opacity:0}}" +
        ".terminal-xterm-shell .xterm-cursor-layer,.terminal-xterm-shell .xterm-screen canvas.xterm-cursor-canvas{animation:zc-cursor-blink 1s step-end infinite !important}"
      );
    }
    if (c.radiusScale !== 100) {
      var rs = Math.max(0, Math.min(300, Number(c.radiusScale) || 100)) / 100;
      lookCss.push(
        ".theme-zai-dark{" +
        "--radius-xs:" + (2 * rs).toFixed(1) + "px;" +
        "--radius-sm:" + (4 * rs).toFixed(1) + "px;" +
        "--radius-md:" + (6 * rs).toFixed(1) + "px;" +
        "--radius-lg:" + (8 * rs).toFixed(1) + "px;" +
        "--radius-xl:" + (12 * rs).toFixed(1) + "px;" +
        "--radius-2xl:" + (16 * rs).toFixed(1) + "px;" +
        "--radius-3xl:" + (24 * rs).toFixed(1) + "px}"
      );
    }
    if (lookCss.length) css += lookCss.join("");

    st.textContent = css;

    // 打标（轻量，无节点注入）：给「应替换」的 svg.animate-spin 打 data-zcode-skin-host，
    // CSS 据此显示 GIF。React 复用节点时标记自动保留、销毁时 observer 重新打标。
    // v1.8.8 回到黑名单排除方案（v1.8.1 已验证能正确替换左侧对话/任务列表），并精确
    // 补充排除「按钮 loading」——svg 的直接父级是 <button> 的，是发送/刷新/保存等临时
    // 操作反馈，不该替换（v1.8.5 白名单方案运行时判定不可靠，导致列表图标漏替换，弃用）。
    window.__zcodeSkinSpinSync = function () {
      var enabled = !!c.enabled && !!c.spinnerGif;
      var spins = document.querySelectorAll("svg.animate-spin");
      for (var i = 0; i < spins.length; i++) {
        var svg = spins[i];
        // 黑名单：
        //   ① 设置对话框（思考强度开关等）、皮肤面板/按钮自身
        //   ② 按钮 loading：svg 的直接父级是 <button>（任务/会话条目的运行态图标在
        //      span 图标槽位里，直接父级不是 button，故不受影响）
        var p = svg.parentElement;
        var directInButton = p && p.tagName === "BUTTON";
        var excluded = svg.closest('[role="dialog"], #zcode-skin-panel, #zcode-skin-btn') || directInButton;
        if (!enabled || excluded) {
          if (svg.hasAttribute("data-zcode-skin-host")) svg.removeAttribute("data-zcode-skin-host");
        } else {
          if (!svg.hasAttribute("data-zcode-skin-host")) svg.setAttribute("data-zcode-skin-host", "1");
        }
      }
    };
    window.__zcodeSkinSpinSync();
    if (c.enabled && c.spinnerGif) {
      if (!window.__zcodeSkinSpinObserver) {
        // 节流：ZCode 是 React 应用，DOM 变更极频繁；observer 回调里全量遍历 svg 每次都跑会卡。
        // 用 requestAnimationFrame 合帧——一帧内的多次变更只执行一次 sync。
        window.__zcodeSkinSpinObserver = new MutationObserver(function () {
          if (window.__zcodeSkinSpinScheduled) return;
          window.__zcodeSkinSpinScheduled = true;
          requestAnimationFrame(function () {
            window.__zcodeSkinSpinScheduled = false;
            if (window.__zcodeSkinSpinSync) window.__zcodeSkinSpinSync();
          });
        });
        window.__zcodeSkinSpinObserver.observe(document.body, { childList: true, subtree: true });
      }
    } else if (window.__zcodeSkinSpinObserver) {
      window.__zcodeSkinSpinObserver.disconnect();
      delete window.__zcodeSkinSpinObserver;
    }
  }

  // 记录当前已挂载的壁纸/侧栏路径：路径没变时复用现有元素，不重建——
  // 否则改任何配置（如透明度滑杆）都会让视频壁纸重头播放（体验 bug）。
  var currentWallpaper = null;
  var currentSidebarImg = null;

  function applyImgs(c) {
    var g = document.getElementById(IMG_ID);
    var v = document.getElementById(SIDE_IMG_ID);

    // 壁纸：路径没变且现有元素是视频 → 不重建，只更新模糊与控制参数
    var wpSame = c.wallpaper === currentWallpaper;
    if (wpSame && g && g.tagName === "VIDEO" && c.enabled) {
      wallpaperVideo = g;
      g.style.filter = c.blurWallpaper > 0 ? "blur(" + c.blurWallpaper + "px)" : "";
      applyVideoControl(c);
    } else {
      if (g) g.remove();
      wallpaperVideo = null;
      if (c.enabled && c.wallpaper) {
        var media = mkMedia(IMG_ID, c.wallpaper, "100vw", "100vh", c);
        if (c.blurWallpaper > 0) media.style.filter = "blur(" + c.blurWallpaper + "px)";
        document.body.appendChild(media);
        if (media.tagName === "VIDEO") {
          wallpaperVideo = media;
          applyVideoControl(c);
        }
      }
    }
    currentWallpaper = c.enabled ? c.wallpaper : "";

    // 侧栏图：路径没变则不重建
    if (c.sidebar !== currentSidebarImg) {
      if (v) v.remove();
      if (c.enabled && c.sidebar) {
        document.body.appendChild(mkMedia(SIDE_IMG_ID, c.sidebar, c.sidebarWidth + "px", "100vh", c));
      }
    }
    currentSidebarImg = c.enabled ? c.sidebar : "";
  }

  function applyVideoControl(c) {
    if (!wallpaperVideo) return;
    wallpaperVideo.playbackRate = c.videoSpeed || 1;
    if (c.videoPaused) wallpaperVideo.pause();
    else {
      var p = wallpaperVideo.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  /* ---------- 特效层（CSS 动画 / canvas 粒子） ---------- */

  var fxTimer = null;
  var fxCanvas = null;
  // resize 监听器引用：applyEffect 每次重建特效时先移除旧的，避免监听器泄漏
  var fxResizeHandler = null;

  function applyEffect(c) {
    var old = document.getElementById(FX_ID);
    if (old) old.remove();
    if (fxTimer) { clearInterval(fxTimer); fxTimer = null; }
    if (fxResizeHandler) { window.removeEventListener("resize", fxResizeHandler); fxResizeHandler = null; }
    fxCanvas = null;
    if (!c.enabled || !c.effect || c.effect === "none") return;

    if (c.effect === "aurora") {
      var d = document.createElement("div");
      d.id = FX_ID;
      d.style.cssText =
        "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;" +
        "background:radial-gradient(ellipse at 20% 30%,rgba(56,189,248,.25),transparent 50%)," +
        "radial-gradient(ellipse at 80% 60%,rgba(168,85,247,.22),transparent 50%)," +
        "radial-gradient(ellipse at 50% 80%,rgba(34,211,238,.2),transparent 50%);" +
        "animation:zcode-aurora 12s ease-in-out infinite alternate";
      document.body.appendChild(d);
      var key = document.createElement("style");
      key.textContent = "@keyframes zcode-aurora{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(40deg)}}";
      document.head.appendChild(key);
      return;
    }

    // stars / snow 用 canvas 粒子
    fxCanvas = document.createElement("canvas");
    fxCanvas.id = FX_ID;
    fxCanvas.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none";
    document.body.appendChild(fxCanvas);
    var ctx = fxCanvas.getContext("2d");
    var W, H, parts = [];
    function resize() {
      W = fxCanvas.width = window.innerWidth;
      H = fxCanvas.height = window.innerHeight;
    }
    resize();
    fxResizeHandler = resize;
    window.addEventListener("resize", resize);

    var count = c.effect === "stars" ? 140 : 90;
    for (var i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: c.effect === "stars" ? Math.random() * 1.6 + 0.3 : Math.random() * 3 + 1,
        vy: c.effect === "stars" ? 0 : Math.random() * 0.8 + 0.3,
        vx: c.effect === "stars" ? 0 : (Math.random() - 0.5) * 0.3,
        a: Math.random() * Math.PI * 2,
        tw: Math.random() * 0.02 + 0.005
      });
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        if (c.effect === "stars") {
          p.a += p.tw;
          ctx.globalAlpha = 0.4 + Math.abs(Math.sin(p.a)) * 0.6;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          p.y += p.vy;
          p.x += p.vx;
          if (p.y > H) { p.y = -5; p.x = Math.random() * W; }
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    fxTimer = setInterval(frame, 1000 / 30);
  }

  /* ---------- 输入框氛围灯（Ambient Edge） ----------
   * 三层结构：环境光轨（常驻 conic 渐变环绕慢流）→ 聚焦/输入层 → 状态反馈层。
   * 光轨画在 composer 容器的 ::before（细环）/ ::after（外晕）上，
   * 全部动画只动 --zc-glow-angle（@property 注册，GPU 合成）、opacity、filter。
   * 状态通过 host 的 data-zc-focus / data-zc-blur / data-zc-state / data-zc-once 属性驱动 CSS。 */

  var GLOW_STYLE_ID = "zcode-skin-glow-style";
  var GLOW_PANEL_ID = "zcode-skin-glow-panel";
  var GLOW_CLASS = "zcode-skin-glow-host";

  var GLOW_PALETTE = [
    { name: "青蓝紫", colors: ["#38D9E8", "#5B8CFF", "#A78BFA"] },
    { name: "暖夜", colors: ["#F5E6C8", "#D4A95C", "#C97B4A"] },
    { name: "极光", colors: ["#34D399", "#22D3EE", "#818CF8"] },
    { name: "玫瑰暮色", colors: ["#FDA4AF", "#F472B6", "#C084FC"] },
    { name: "冰川蓝", colors: ["#A5F3FC", "#67E8F9", "#38BDF8"] },
    { name: "赛博霓虹", colors: ["#F0ABFC", "#E879F9", "#22D3EE"] },
    { name: "日落", colors: ["#FDE68A", "#FB923C", "#F43F5E"] },
    { name: "单色青", colors: ["#22D3EE"] }
  ];

  var GLOW_MODES = {
    lounge: { label: "Lounge（柔和质感）", colors: ["#38D9E8", "#5B8CFF", "#A78BFA"], period: 18, brightness: 12, hueCycle: false },
    aurora: { label: "Aurora（科技感）", colors: ["#34D399", "#22D3EE", "#818CF8"], period: 10, brightness: 18, hueCycle: true, hueRange: 90 },
    reactive: { label: "Reactive（状态响应）", colors: ["#38D9E8", "#5B8CFF", "#A78BFA"], period: 22, brightness: 10, hueCycle: false }
  };

  // 运行时状态（不持久化）
  var glowHost = null;
  var glowOnceTimer = null;
  var glowTypingTimer = null;
  var glowListenersBound = false;
  var glowObserver = null;
  var glowNightTimer = null;
  var glowWorkingOn = false;
  var glowLastSendAt = 0;
  var glowSyncScheduled = false;

  function glowEnabled(c) {
    return !!(c && c.enabled && c.inputGlow && c.inputGlow.enabled);
  }

  function glowGradient(c) {
    var g = c.inputGlow;
    var cols = (g.colors || []).filter(Boolean);
    if (!cols.length) cols = GLOW_PALETTE[0].colors;
    if (cols.length === 1) cols = [cols[0], cols[0]];
    var stops = cols.concat([cols[0]]).join(",");
    return "conic-gradient(from var(--zc-glow-angle)," + stops + ")";
  }

  function glowStateGradient(color) {
    return "conic-gradient(from var(--zc-glow-angle)," + color + "55," + color + "," + color + "88," + color + "55)";
  }

  // 夜间降亮后的实际亮度（0-40）
  function glowEffectiveBrightness(c) {
    var g = c.inputGlow;
    var b = Math.max(0, Math.min(40, Number(g.brightness) || 12));
    if (g.night && g.night.on && glowInNightWindow(g.night)) {
      b = b * (1 - Math.max(0, Math.min(80, Number(g.night.dim) || 0)) / 100);
    }
    return b;
  }

  function glowInNightWindow(night) {
    function toMin(s) {
      var m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "").trim());
      return m ? (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) : null;
    }
    var from = toMin(night.from), to = toMin(night.to);
    if (from == null || to == null) return false;
    var now = new Date();
    var cur = now.getHours() * 60 + now.getMinutes();
    if (from <= to) return cur >= from && cur < to;
    return cur >= from || cur < to; // 跨午夜（如 22:00-06:00）
  }

  function buildGlowCss(c) {
    var g = c.inputGlow;
    var dir = g.direction || "cw";
    var anim;
    if (dir === "ccw") anim = "zc-glow-spin-rev var(--zc-glow-t) linear infinite";
    else if (dir === "alt") anim = "zc-glow-spin var(--zc-glow-t) ease-in-out infinite alternate";
    else anim = "zc-glow-spin var(--zc-glow-t) linear infinite";

    var css =
      // @property 注册自定义属性后 Chromium 才能对其做关键帧插值（角度/百分比），实现 GPU 合成的环形流光
      "@property --zc-glow-angle{syntax:'<angle>';inherits:false;initial-value:0deg}" +
      "@property --zc-glow-hue{syntax:'<angle>';inherits:false;initial-value:0deg}" +
      "@keyframes zc-glow-spin{0%{--zc-glow-angle:0deg}100%{--zc-glow-angle:360deg}}" +
      "@keyframes zc-glow-spin-rev{0%{--zc-glow-angle:360deg}100%{--zc-glow-angle:0deg}}" +
      "@keyframes zc-glow-breathe{0%,100%{filter:brightness(1)}50%{filter:brightness(1.7)}}" +
      "@keyframes zc-glow-send{0%{filter:brightness(1)}25%{filter:brightness(2.4)}100%{filter:brightness(1)}}" +
      "@keyframes zc-glow-bloom{0%{filter:brightness(1)}35%{filter:brightness(1.9)}100%{filter:brightness(1)}}" +
      "@keyframes zc-glow-err{0%,100%{filter:brightness(1)}50%{filter:brightness(2.1)}}" +
      "." + GLOW_CLASS + "{position:relative !important;" +
      "--zc-glow-grad:" + glowGradient(c) + ";" +
      "--zc-glow-t:" + (Number(g.period) || 18) + "s;" +
      "--zc-glow-w:" + (Number(g.trackWidth) || 1.5) + "px;" +
      "--zc-glow-b:" + glowEffectiveBrightness(c) + ";" +
      "--zc-glow-gblur:" + (Number(g.glowBlur) || 0) + "px;" +
      "--zc-glow-gb:" + (Number(g.glowOpacity) || 0) + ";" +
      "--zc-glow-fb:" + (g.states.focus.on ? (Number(g.states.focus.boost) || 0) : 0) + ";" +
      "--zc-glow-dim:" + (g.states.blur.on ? (Number(g.states.blur.dim) || 0) : 0) + ";" +
      "--zc-glow-ease:" + (g.easing || "ease-in-out") + ";" +
      "--zc-glow-odur:" + (Number(g.states.send.dur) || 0.8) + "s;" +
      "--zc-glow-en:" + (Number(g.states.error.pulses) || 2) + ";" +
      "}" +
      "." + GLOW_CLASS + "::before,." + GLOW_CLASS + "::after{content:\"\";position:absolute;pointer-events:none;border-radius:inherit}" +
      // 光芯：细环（mask 挖出环形，conic 渐变随角度旋转）
      "." + GLOW_CLASS + "::before{" +
      "inset:calc(var(--zc-glow-w) * -1 - 1px);padding:var(--zc-glow-w);" +
      "background:var(--zc-glow-grad);" +
      "-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);" +
      "-webkit-mask-composite:xor;" +
      "mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);" +
      "mask-composite:exclude;" +
      "opacity:calc(var(--zc-glow-b)/100);" +
      "animation:" + anim + ";z-index:1}" +
      // 光晕：外层模糊扩散，亮度跟随光芯
      "." + GLOW_CLASS + "::after{" +
      "inset:calc(var(--zc-glow-w) * -1 - var(--zc-glow-gblur) - 1px);" +
      "background:var(--zc-glow-grad);" +
      "filter:blur(var(--zc-glow-gblur));" +
      "opacity:calc(var(--zc-glow-gb)/100*var(--zc-glow-b)/40);" +
      "animation:" + anim + ";z-index:0}" +
      // 聚焦增强 / 失焦降亮
      "." + GLOW_CLASS + "[data-zc-focus]::before{opacity:calc((var(--zc-glow-b) + var(--zc-glow-fb))/100)}" +
      "." + GLOW_CLASS + "[data-zc-focus]::after{opacity:calc(var(--zc-glow-gb)/100*(var(--zc-glow-b) + var(--zc-glow-fb))/40)}" +
      "." + GLOW_CLASS + "[data-zc-blur]::before{opacity:calc(var(--zc-glow-b)*(100 - var(--zc-glow-dim))/10000)}" +
      "." + GLOW_CLASS + "[data-zc-blur]::after{opacity:calc(var(--zc-glow-gb)/100*var(--zc-glow-b)*(100 - var(--zc-glow-dim))/4000)}" +
      // 生成中呼吸模式（flow/static 的颜色与速度由 JS 改 inline 变量）
      "." + GLOW_CLASS + "[data-zc-state='working'][data-zc-wmode='breath']::before{animation:" + anim + ",zc-glow-breathe calc(var(--zc-glow-wt,5)*1s) var(--zc-glow-ease) infinite}" +
      "." + GLOW_CLASS + "[data-zc-state='working'][data-zc-wmode='static']::before{filter:brightness(1.4)}" +
      // 一次性事件：send 扫光 / done 扩散 / error 脉冲（颜色由 JS 临时改 --zc-glow-grad）
      "." + GLOW_CLASS + "[data-zc-once='send']::before{animation:" + anim + ",zc-glow-send var(--zc-glow-odur) ease-out 1}" +
      "." + GLOW_CLASS + "[data-zc-once='done']::before{animation:" + anim + ",zc-glow-bloom var(--zc-glow-odur) var(--zc-glow-ease) 1}" +
      "." + GLOW_CLASS + "[data-zc-once='error']::before{animation:" + anim + ",zc-glow-err calc(var(--zc-glow-odur)/var(--zc-glow-en)) ease-in-out var(--zc-glow-en)}" +
      // 全谱色相循环（hue-rotate 只动 filter，不重排）
      (g.hueCycle
        ? ".zcode-skin-glow-host::before,.zcode-skin-glow-host::after{--zc-glow-hue:0deg}" +
          "@keyframes zc-glow-hue{0%{--zc-glow-hue:0deg}100%{--zc-glow-hue:" + (Number(g.hueRange) || 60) + "deg}}" +
          "." + GLOW_CLASS + "::before{animation:" + anim + ",zc-glow-hue " + ((Number(g.period) || 18) * 2) + "s ease-in-out infinite alternate;filter:hue-rotate(var(--zc-glow-hue))}" +
          "." + GLOW_CLASS + "::after{animation:" + anim + ",zc-glow-hue " + ((Number(g.period) || 18) * 2) + "s ease-in-out infinite alternate;filter:blur(var(--zc-glow-gblur)) hue-rotate(var(--zc-glow-hue))}"
        : "") +
      // 无障碍：系统要求减少动态时冻结为静态渐变
      "@media (prefers-reduced-motion:reduce){" +
      "." + GLOW_CLASS + "::before,." + GLOW_CLASS + "::after{animation:none !important}" +
      "}";
    return css;
  }

  function removeGlowHost() {
    if (glowHost) {
      glowHost.classList.remove(GLOW_CLASS);
      glowHost.removeAttribute("data-zc-focus");
      glowHost.removeAttribute("data-zc-blur");
      glowHost.removeAttribute("data-zc-state");
      glowHost.removeAttribute("data-zc-wmode");
      glowHost.removeAttribute("data-zc-once");
      // 只清自己注入的变量（前缀固定，不会误伤 ZCode 自身样式）
      var style = glowHost.style;
      for (var i = style.length - 1; i >= 0; i--) {
        var prop = style[i];
        if (prop.indexOf("--zc-glow") === 0) style.removeProperty(prop);
      }
      glowHost = null;
      // 重置 working 状态机：生成中禁用→启用后新 host 才能重新拿到 data-zc-state
      glowWorkingOn = false;
    }
  }

  // 定位聊天主输入框容器：找主区域可见 textarea，向上最多 3 层找有圆角+边框的祖先
  function findGlowHost() {
    var list = document.querySelectorAll("textarea");
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t.closest("#" + PANEL_ID + ",#" + BTN_ID + ",#" + GLOW_PANEL_ID + ",[role='dialog']")) continue;
      // xterm 的 helper textarea（隐藏的真实输入元素）不是聊天框
      if (t.closest(".terminal-xterm-shell,.xterm")) continue;
      if (t.classList.contains("xterm-helper-textarea")) continue;
      if (t.offsetParent === null && t !== document.activeElement) continue; // 不可见
      var best = null, node = t;
      for (var up = 0; up < 3 && node; up++) {
        node = node.parentElement;
        if (!node || node === document.body) break;
        var cs = getComputedStyle(node);
        var rad = parseFloat(cs.borderTopLeftRadius) || 0;
        var bw = parseFloat(cs.borderTopWidth) || 0;
        if (rad >= 8 && bw > 0) { best = node; break; }
        if (rad >= 8 && !best) best = node;
      }
      return best || t.parentElement;
    }
    return null;
  }

  function applyGlowInlineVars(c) {
    if (!glowHost) return;
    var g = c.inputGlow;
    var s = glowHost.style;
    s.setProperty("--zc-glow-grad", glowGradient(c));
    s.setProperty("--zc-glow-t", (Number(g.period) || 18) + "s");
    s.setProperty("--zc-glow-w", (Number(g.trackWidth) || 1.5) + "px");
    s.setProperty("--zc-glow-b", glowEffectiveBrightness(c));
    s.setProperty("--zc-glow-gblur", (Number(g.glowBlur) || 0) + "px");
    s.setProperty("--zc-glow-gb", Number(g.glowOpacity) || 0);
    s.setProperty("--zc-glow-ease", g.easing || "ease-in-out");
  }

  function syncGlowHost(c) {
    if (!glowEnabled(c)) { removeGlowHost(); return; }
    var host = findGlowHost();
    if (glowHost && glowHost !== host) removeGlowHost();
    if (!host) return;
    glowHost = host;
    if (!host.classList.contains(GLOW_CLASS)) host.classList.add(GLOW_CLASS);
    applyGlowInlineVars(c);
    // 生成中检测：主区域有运行态 spinner（黑名单同 spinSync）即视为 working
    var working = false;
    var spins = document.querySelectorAll("svg.animate-spin");
    for (var i = 0; i < spins.length; i++) {
      var svg = spins[i];
      var p = svg.parentElement;
      if ((p && p.tagName === "BUTTON") || svg.closest("[role='dialog'],#" + PANEL_ID + ",#" + BTN_ID + ",#" + GLOW_PANEL_ID)) continue;
      // SVGElement 没有 offsetParent（恒 undefined !== null 会恒真），用 getClientRects 判可见性
      if (svg.getClientRects().length) { working = true; break; }
    }
    updateGlowWorking(c, working);
  }

  function setGlowOnce(c, name) {
    if (!glowEnabled(c) || !glowHost) return;
    var s = c.inputGlow.states[name];
    if (!s || !s.on) return;
    if (glowHost.getAttribute("data-zc-state") === "working" && name !== "working") return;
    if (glowOnceTimer) { clearTimeout(glowOnceTimer); glowOnceTimer = null; }
    glowHost.setAttribute("data-zc-once", name);
    glowHost.style.setProperty("--zc-glow-grad", glowStateGradient(s.color || "#22D3EE"));
    glowHost.style.setProperty("--zc-glow-odur", (Number(s.dur) || 0.8) + "s");
    glowHost.style.setProperty("--zc-glow-en", Number(s.pulses) || 2);
    glowOnceTimer = setTimeout(function () {
      glowOnceTimer = null;
      if (!glowHost) return;
      glowHost.removeAttribute("data-zc-once");
      applyGlowInlineVars(getLiveCfg());
    }, (Number(s.dur) || 0.8) * 1000 + 60);
  }

  // working 进入/退出：进入时按模式改色变速；退出时按最近一次发送给 done/error 反馈
  function updateGlowWorking(c, on) {
    var g = c.inputGlow;
    if (on === glowWorkingOn) return;
    glowWorkingOn = on;
    if (!glowHost) return;
    var w = g.states.working;
    if (on) {
      if (!w.on) return;
      glowHost.setAttribute("data-zc-state", "working");
      glowHost.setAttribute("data-zc-wmode", w.mode || "flow");
      glowHost.style.setProperty("--zc-glow-grad", glowStateGradient(w.color || "#818CF8"));
      glowHost.style.setProperty("--zc-glow-wt", Number(w.period) || 5);
      if ((w.mode || "flow") === "flow") glowHost.style.setProperty("--zc-glow-t", (Number(w.period) || 5) + "s");
    } else {
      glowHost.removeAttribute("data-zc-state");
      glowHost.removeAttribute("data-zc-wmode");
      applyGlowInlineVars(c);
      // 刚发过消息且生成正常结束 → done；当前界面有失败红点 → error
      if (w.on && Date.now() - glowLastSendAt < 5 * 60 * 1000) {
        if (document.querySelector("[data-error-indicator]")) setGlowOnce(c, "error");
        else setGlowOnce(c, "done");
      }
    }
  }

  // 实时取当前配置（listener 闭包里拿最新值，避免旧闭包）
  function getLiveCfg() {
    return cfg;
  }

  function bindGlowListeners(c) {
    if (glowListenersBound) return;
    glowListenersBound = true;
    document.addEventListener("focusin", function (e) {
      var host = e.target && e.target.closest && e.target.closest("." + GLOW_CLASS);
      if (!host) return;
      var cc = getLiveCfg();
      host.removeAttribute("data-zc-blur");
      if (cc.inputGlow.states.focus.on) host.setAttribute("data-zc-focus", "1");
    });
    document.addEventListener("focusout", function (e) {
      var host = e.target && e.target.closest && e.target.closest("." + GLOW_CLASS);
      if (!host) return;
      var cc = getLiveCfg();
      host.removeAttribute("data-zc-focus");
      if (cc.inputGlow.states.blur.on) host.setAttribute("data-zc-blur", "1");
    });
    document.addEventListener("input", function (e) {
      var host = e.target && e.target.closest && e.target.closest("." + GLOW_CLASS);
      if (!host) return;
      var cc = getLiveCfg();
      var tp = cc.inputGlow.states.typing;
      host.removeAttribute("data-zc-blur");
      if (tp.on) host.style.setProperty("--zc-glow-t", ((Number(cc.inputGlow.period) || 18) / (Number(tp.speedup) || 1)) + "s");
      if (glowTypingTimer) clearTimeout(glowTypingTimer);
      glowTypingTimer = setTimeout(function () {
        glowTypingTimer = null;
        if (!glowHost) return;
        applyGlowInlineVars(getLiveCfg()); // 回落：恢复环境速度与亮度（用最新配置，避免写回旧值）
      }, (Number(cc.inputGlow.states.idleBack) || 2) * 1000);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey) return;
      if (e.isComposing || e.keyCode === 229) return; // IME 组合词回车（选词）不是发送
      var host = e.target && e.target.closest && e.target.closest("." + GLOW_CLASS);
      if (!host) return;
      glowLastSendAt = Date.now();
      setGlowOnce(getLiveCfg(), "send");
    });
  }

  function ensureGlowObserver(c) {
    if (glowObserver) return;
    glowObserver = new MutationObserver(function () {
      if (glowSyncScheduled) return;
      glowSyncScheduled = true;
      requestAnimationFrame(function () {
        glowSyncScheduled = false;
        if (glowEnabled(getLiveCfg())) syncGlowHost(getLiveCfg());
      });
    });
    glowObserver.observe(document.body, { childList: true, subtree: true });
  }

  function setupGlowNightTimer(c) {
    if (glowNightTimer) { clearInterval(glowNightTimer); glowNightTimer = null; }
    if (!c.inputGlow.night.on) return;
    glowNightTimer = setInterval(function () {
      if (glowEnabled(getLiveCfg()) && glowHost) {
        glowHost.style.setProperty("--zc-glow-b", glowEffectiveBrightness(getLiveCfg()));
      }
    }, 60 * 1000);
  }

  function applyGlow(c) {
    var st = document.getElementById(GLOW_STYLE_ID);
    if (!st) {
      st = document.createElement("style");
      st.id = GLOW_STYLE_ID;
      document.head.appendChild(st);
    }
    if (!glowEnabled(c)) { st.textContent = ""; removeGlowHost(); return; }
    st.textContent = buildGlowCss(c);
    bindGlowListeners(c);
    ensureGlowObserver(c);
    setupGlowNightTimer(c);
    syncGlowHost(c);
  }

  /* ---------- 滑块高亮预览：拖动/悬停滑块时用红框标出受影响的区域 ---------- */

  var HL_STYLE_ID = "zcode-skin-hl-style";
  // 每个 CSS 变量对应页面上带该背景色的 Tailwind 类，用于反查 DOM 元素。
  // 数组形式：多个选择器取并集（例如终端背景同时存在于 xterm 包装层和 canvas 上）。
  var HIGHLIGHT_CLASS = {
    backgroundWinAlt: [".bg-background-win-alt"],
    background: [".bg-background"],
    backgroundAlt: [".bg-background-alt"],
    surface: [".bg-surface"],
    surfaceHover: [".bg-surface-hover", "[class*='hover:bg-surface-hover']"],
    sidebar: [".bg-sidebar"],
    header: [".bg-header"],
    panel: [".bg-panel"],
    card: [".bg-card"],
    input: [".bg-input", "input[type='text']", "textarea"],
    tooltip: ["[role='tooltip']"],
    menu: ["[role='menu']", "[role='listbox']"],
    terminal: [".terminal-xterm-shell", ".xterm-screen"],
    border: null // 边框是描边不是色块，高亮所有带边框元素太吵
  };

  function ensureHlStyle() {
    var st = document.getElementById(HL_STYLE_ID);
    if (!st) {
      st = document.createElement("style");
      st.id = HL_STYLE_ID;
      st.textContent =
        "@keyframes zc-skin-pulse{0%,100%{outline-color:rgba(255,64,64,.95)}50%{outline-color:rgba(255,64,64,.25)}}" +
        ".zc-skin-hl{outline:3px solid rgba(255,64,64,.95) !important;outline-offset:-3px !important;" +
        "animation:zc-skin-pulse 1s ease-in-out infinite !important;z-index:2147482000;position:relative}";
      document.head.appendChild(st);
    }
    return st;
  }

  function clearHighlight() {
    document.querySelectorAll(".zc-skin-hl").forEach(function (n) { n.classList.remove("zc-skin-hl"); });
  }

  function highlightKey(key) {
    ensureHlStyle();
    clearHighlight();
    var sels = HIGHLIGHT_CLASS[key];
    if (!sels) return;
    var sel = sels.join(",");
    var nodes = document.querySelectorAll(sel);
    var count = Math.min(nodes.length, 400); // 上限保护，避免极端情况下卡顿
    for (var i = 0; i < count; i++) nodes[i].classList.add("zc-skin-hl");
    if (!count) console.warn("[zcode-skin] 高亮预览：页面上当前没有匹配「" + (LABELS[key] || key) + "」的可见元素（对应面板可能未打开）");
  }

  function bindSliderPreview(rowEl, key) {
    var range = rowEl.querySelector('input[type="range"]');
    if (!range) return;
    // 拖动时持续高亮；松开后保留 1.5s 再清除，方便看清效果
    var hideTimer = null;
    var matched = null;
    function show() {
      highlightKey(key);
      // 面板上直接显示该区域当前是否有元素可见，避免用户对着不存在的窗口调
      var sels = HIGHLIGHT_CLASS[key];
      try { matched = sels && document.querySelector(sels.join(",")) ? true : false; } catch (e) { matched = false; }
      if (hideTimer) clearTimeout(hideTimer);
    }
    range.addEventListener("input", show);
    range.addEventListener("mousedown", show);
    function scheduleHide() {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(clearHighlight, 1500);
    }
    range.addEventListener("change", scheduleHide);
    range.addEventListener("mouseup", scheduleHide);
    rowEl.addEventListener("mouseenter", show);
    rowEl.addEventListener("mouseleave", function () {
      if (document.activeElement !== range) clearHighlight();
    });
  }

  /* ---------- UI 构建 ---------- */

  function el(tag, css, text) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }

  function mkBtn(text, title) {
    var b = el(
      "button",
      "background:rgba(255,255,255,.08);color:#eee;border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;line-height:1.4"
    );
    b.textContent = text;
    if (title) b.title = title;
    return b;
  }

  function row(label, control) {
    var r = el("div", "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px");
    r.appendChild(el("span", "flex:0 0 84px;color:#bbb;font-size:12px", label));
    r.appendChild(control);
    return r;
  }

  function slider(val, onChange, min, max, step, fmt) {
    min = min || 0;
    max = max || 1;
    step = step || 0.05;
    fmt = fmt || function (v) { return Number(v).toFixed(2); };
    var wrap = el("div", "flex:1;display:flex;align-items:center;gap:6px");
    var r = document.createElement("input");
    r.type = "range";
    r.min = min;
    r.max = max;
    r.step = step;
    r.value = val;
    r.style.cssText = "flex:1;accent-color:#38bdf8;cursor:pointer";
    var num = el("span", "flex:0 0 38px;text-align:right;color:#ddd;font-size:11px", fmt(val));
    r.addEventListener("input", function () {
      num.textContent = fmt(r.value);
      onChange(Number(r.value));
    });
    wrap.appendChild(r);
    wrap.appendChild(num);
    return wrap;
  }

  function textField(label, val, onChange, placeholder, browse, extFilter) {
    var wrap = el("div", "flex:1;display:flex;flex-direction:column;gap:2px;margin-bottom:8px");
    wrap.appendChild(el("div", "color:#bbb;font-size:11px;margin-bottom:2px", label));
    var inputRow = el("div", "display:flex;gap:6px;align-items:center");
    var input = document.createElement("input");
    input.type = "text";
    input.value = val;
    input.placeholder = placeholder || "";
    input.style.cssText =
      "flex:1;min-width:0;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:5px 8px;color:#eee;font-size:12px";
    input.addEventListener("change", function () {
      onChange(input.value.trim());
    });
    inputRow.appendChild(input);
    if (browse) {
      var b = mkBtn("浏览…");
      b.style.cssText += ";flex:0 0 auto;white-space:nowrap";
      b.title = "选择文件" + (extFilter ? "（仅限 " + extFilter + "）" : "");
      b.onclick = function () {
        if (window.zcode && typeof window.zcode.selectFile === "function") {
          Promise.resolve(window.zcode.selectFile()).then(function (path) {
            if (!path) return;
            // ZCode 的 selectFile 不支持传入过滤器，这里前端校验扩展名
            if (extFilter) {
              var exts = extFilter.split(",").map(function (s) { return s.trim().toLowerCase(); });
              var ok = exts.some(function (ext) { return path.toLowerCase().slice(-ext.length) === ext; });
              if (!ok) {
                alert("请选择 " + extFilter + " 格式的文件\n（当前选中：" + path.split(/[\\/]/).pop() + "）");
                return;
              }
            }
            input.value = path;
            onChange(path);
          }).catch(function (e) {
            console.error("[zcode-skin] 选择文件失败:", e);
            alert("选择文件失败：" + (e && e.message ? e.message : e));
          });
        } else {
          alert("当前环境不支持原生文件选择，请手动输入路径");
        }
      };
      inputRow.appendChild(b);
    }
    wrap.appendChild(inputRow);
    return wrap;
  }

  function selectField(label, val, options, onChange) {
    var wrap = el("div", "flex:1;display:flex;flex-direction:column;gap:2px;margin-bottom:8px");
    wrap.appendChild(el("div", "color:#bbb;font-size:11px;margin-bottom:2px", label));
    var s = document.createElement("select");
    s.style.cssText =
      "width:100%;box-sizing:border-box;background:rgba(30,30,30,.95);border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:5px 8px;color:#eee;font-size:12px";
    for (var key in options) {
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = options[key];
      // 显式指定 option 前景/背景色，避免系统下拉面板白底白字
      opt.style.cssText = "background:#1e1e1e;color:#eee";
      if (key === val) opt.selected = true;
      s.appendChild(opt);
    }
    s.addEventListener("change", function () {
      onChange(s.value);
    });
    wrap.appendChild(s);
    return wrap;
  }

  var cfg = load();
  applyCss(cfg);

  function refreshAll(c) {
    save(c);
    applyCss(c);
    applyImgs(c);
    applyEffect(c);
    applyGlow(c);
  }

  function buildPanel(panel, c) {
    panel.innerHTML = "";

    var head = el("div", "display:flex;justify-content:space-between;align-items:center;margin-bottom:12px");
    head.appendChild(el("div", "font-weight:600;font-size:14px;color:#fff", "🎨 皮肤设置"));
    var close = mkBtn("✕", "关闭");
    close.onclick = function () { panel.style.display = "none"; };
    head.appendChild(close);
    panel.appendChild(head);

    // 启用开关
    var en = el("div", "display:flex;align-items:center;gap:8px;margin-bottom:10px");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = c.enabled;
    cb.style.cssText = "accent-color:#38bdf8";
    cb.addEventListener("change", function () {
      c.enabled = cb.checked;
      refreshAll(c);
    });
    en.appendChild(cb);
    en.appendChild(el("span", "color:#ccc;font-size:12px", "启用皮肤"));
    panel.appendChild(en);

    // 壁纸路径
    panel.appendChild(textField("壁纸（图片/视频，视频请用 .webm）", c.wallpaper, function (v) {
      c.wallpaper = v;
      refreshAll(c);
    }, "点击右侧「浏览」选择图片/视频", true));

    panel.appendChild(textField("侧栏图（留空=用全局壁纸）", c.sidebar, function (v) {
      c.sidebar = v;
      refreshAll(c);
    }, "点击右侧「浏览」选择图片/视频", true));

    // 特效
    panel.appendChild(selectField("动态特效", c.effect, EFFECTS, function (v) {
      c.effect = v;
      refreshAll(c);
    }));

    // 视频控制（仅视频壁纸时显示）：速度滑杆拉到最左（0）= 暂停，一行搞定
    if (isVideoSrc(c.wallpaper)) {
      panel.appendChild(row("视频速度", slider(c.videoPaused ? 0 : (c.videoSpeed || 1), function (v) {
        if (v <= 0) {
          c.videoPaused = true;
        } else {
          c.videoPaused = false;
          c.videoSpeed = v;
        }
        save(c);
        applyVideoControl(c);
      }, 0, 2, 0.25, function (v) { return v <= 0 ? "⏸" : v + "x"; })));
    }

    // 处理中图标（旋转齿轮/圆圈）定制
    var spinSub = el("div", "margin:10px 0 6px;color:#999;font-size:11px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px", "处理中图标（加载圈）");
    panel.appendChild(spinSub);
    panel.appendChild(textField("替换为 GIF（留空=用原生圆圈）", c.spinnerGif, function (v) {
      var changed = v !== c.spinnerGif;
      c.spinnerGif = v;
      refreshAll(c);
      if (changed) buildPanel(panel, c);
    }, "点击右侧「浏览」选择 GIF 图片", true, ".gif"));
    if (c.spinnerGif) {
      // 读取图片真实宽高比 + 智能去底时检测底色
      if (!c.spinnerGifRatio || c._gifRatioSrc !== c.spinnerGif) {
        var probe = new Image();
        probe.onload = function () {
          if (probe.naturalHeight > 0) {
            c.spinnerGifRatio = Math.min(5, Math.max(0.2, probe.naturalWidth / probe.naturalHeight));
            c._gifRatioSrc = c.spinnerGif;
            save(c);
            applyCss(c);
            buildPanel(panel, c);
          }
        };
        probe.src = toFileUrl(c.spinnerGif);
      }
      // 智能去底：采样首帧四角+边缘中点像素，取最接近纯色的一块作为背景色，
      // 亮底用 multiply、暗底用 screen；彩色/灰底额外用 saturate+hue-rotate 压制
      if (c.spinnerGifBlend === "auto" && c._gifAutoSrc !== c.spinnerGif) {
        (function detectBg() {
          var img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = function () {
            try {
              var w = img.naturalWidth, h = img.naturalHeight;
              var cv = document.createElement("canvas");
              cv.width = w; cv.height = h;
              var cx = cv.getContext("2d");
              cx.drawImage(img, 0, 0);
              var pts = [[1,1],[w-2,1],[1,h-2],[w-2,h-2],[Math.floor(w/2),1],[Math.floor(w/2),h-2],[1,Math.floor(h/2)],[w-2,Math.floor(h/2)]];
              var rs=0, gs=0, bs=0;
              pts.forEach(function (p) {
                var d = cx.getImageData(p[0], p[1], 1, 1).data;
                rs += d[0]; gs += d[1]; bs += d[2];
              });
              rs /= pts.length; gs /= pts.length; bs /= pts.length;
              var lum = 0.299*rs + 0.587*gs + 0.114*bs; // 0-255
              var maxc = Math.max(rs,gs,bs), minc = Math.min(rs,gs,bs);
              var sat = maxc === 0 ? 0 : (maxc - minc) / maxc; // 0-1 饱和度近似
              var css;
              if (lum >= 128) {
                // 亮底：multiply 去掉；若带颜色（紫/蓝/灰偏色）加饱和度压制
                css = "mix-blend-mode:multiply !important;";
                if (sat > 0.12 || (maxc - minc) > 24) css += "filter:saturate(1.4) contrast(1.15) !important;";
              } else {
                // 暗底：screen 去掉；深灰/深彩同理
                css = "mix-blend-mode:screen !important;";
                if (sat > 0.12 || (maxc - minc) > 24) css += "filter:saturate(1.4) contrast(1.15) !important;";
              }
              c._gifAutoBlend = css;
              c._gifAutoSrc = c.spinnerGif;
              save(c);
              applyCss(c);
            } catch (e) {
              // canvas 被跨域污染等异常：退化为不处理
              c._gifAutoBlend = "";
              c._gifAutoSrc = c.spinnerGif;
              save(c);
            }
          };
          img.src = toFileUrl(c.spinnerGif);
        })();
      }
      // v1.7.1：缩放/偏移一行三列紧凑布局（数字输入 + 单位后缀），复位为同行小按钮
      function applyGifCss() { save(c); applyCss(c); }
      function miniNum(val, onChange, step, minV, maxV, unit, title) {
        var wrap = el("div", "flex:1;min-width:0;display:flex;align-items:center;gap:3px");
        var inp = document.createElement("input");
        inp.type = "number";
        inp.value = val;
        inp.step = step;
        inp.min = minV;
        inp.max = maxV;
        inp.title = title || "";
        inp.style.cssText = "flex:1;min-width:0;width:100%;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:5px;padding:3px 4px;color:#eee;font-size:11px";
        inp.addEventListener("change", function () {
          var v = Number(inp.value);
          if (isNaN(v)) { inp.value = val; return; }
          v = Math.max(minV, Math.min(maxV, v));
          inp.value = v;
          onChange(v);
        });
        wrap.appendChild(inp);
        wrap.appendChild(el("span", "flex:0 0 auto;color:#888;font-size:10px", unit));
        return wrap;
      }
      var grid = el("div", "display:flex;gap:6px;margin-bottom:6px");
      function gridCell(label, ctrl) {
        var cell = el("div", "flex:1;min-width:0");
        cell.appendChild(el("div", "color:#999;font-size:10px;margin-bottom:2px", label));
        cell.appendChild(ctrl);
        return cell;
      }
      grid.appendChild(gridCell("缩放%", miniNum(c.spinnerGifScale, function (v) { c.spinnerGifScale = v; applyGifCss(); }, 10, 20, 1000, "", "GIF 显示宽度，100=原始16px")));
      grid.appendChild(gridCell("偏移X", miniNum(c.spinnerGifOffX, function (v) { c.spinnerGifOffX = v; applyGifCss(); }, 1, -200, 200, "px", "水平偏移，正右负左")));
      grid.appendChild(gridCell("偏移Y", miniNum(c.spinnerGifOffY, function (v) { c.spinnerGifOffY = v; applyGifCss(); }, 1, -200, 200, "px", "垂直偏移，正下负上")));
      var resetGif = mkBtn("↺", "复位：缩放100%·偏移归零");
      resetGif.style.cssText += ";flex:0 0 auto;padding:3px 8px;font-size:12px";
      resetGif.onclick = function () {
        c.spinnerGifScale = 100;
        c.spinnerGifOffX = 0;
        c.spinnerGifOffY = 0;
        save(c);
        applyCss(c);
        buildPanel(panel, c);
      };
      grid.appendChild(resetGif);
      panel.appendChild(grid);
      // 底色处理（下拉）
      var blendRow = el("div", "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px");
      blendRow.appendChild(el("span", "flex:0 0 60px;color:#bbb;font-size:12px", "底色处理"));
      var blendSel = document.createElement("select");
      blendSel.style.cssText = "flex:1;min-width:0;box-sizing:border-box;background:rgba(30,30,30,.95);border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:5px 8px;color:#eee;font-size:12px";
      var blendOpts = {
        "": "不处理",
        "auto": "智能去底（自动识别）",
        "multiply": "去白底",
        "screen": "去黑底"
      };
      for (var bkey in blendOpts) {
        var bopt = document.createElement("option");
        bopt.value = bkey;
        bopt.textContent = blendOpts[bkey];
        bopt.style.cssText = "background:#1e1e1e;color:#eee";
        if (bkey === (c.spinnerGifBlend || "")) bopt.selected = true;
        blendSel.appendChild(bopt);
      }
      blendSel.addEventListener("change", function () {
        c.spinnerGifBlend = blendSel.value;
        refreshAll(c);
      });
      blendRow.appendChild(blendSel);
      panel.appendChild(blendRow);
    }
    // 预览当前效果（用独立类名 + 按配置内联样式，与侧栏全局样式互不干扰）
    var spinPreviewWrap = el("div", "display:flex;align-items:center;gap:12px;margin:2px 0 8px");
    spinPreviewWrap.appendChild(el("span", "color:#bbb;font-size:11px;flex:0 0 auto", "预览："));
    var pv1 = document.createElement("span");
    if (c.spinnerGif) {
      var pvScale = Math.max(20, Math.min(1000, Number(c.spinnerGifScale) || 100)) / 100;
      var pvRatio = Math.min(5, Math.max(0.2, Number(c.spinnerGifRatio) || 1));
      var pvBlend = "";
      if (c.spinnerGifBlend === "multiply") pvBlend = ";mix-blend-mode:multiply";
      else if (c.spinnerGifBlend === "screen") pvBlend = ";mix-blend-mode:screen";
      else if (c.spinnerGifBlend === "auto" && c._gifAutoBlend) {
        // 与全局样式同一份检测结果；把 !important 去掉供内联使用
        pvBlend = ";" + c._gifAutoBlend.replace(/!important/g, "");
      }
      pv1.className = "zcode-skin-pv";
      // 预览只反映缩放与去底效果，不应用偏移——偏移是相对实际图标位置的微调，在侧栏看才有意义
      pv1.style.cssText =
        "display:inline-block;border-radius:0;" +
        "width:" + Math.round(pvScale * 16) + "px;height:" + Math.round(pvScale * 16 / pvRatio) + "px;max-width:none;max-height:none;" +
        "background:center / 100% 100% no-repeat url(\"" + toFileUrl(c.spinnerGif).replace(/"/g, "%22") + "\")" + pvBlend;
    } else {
      pv1.className = "zcode-skin-pv-ring";
      pv1.style.cssText = "display:inline-block;width:16px;height:16px;border-radius:9999px;border:2px solid currentColor;border-top-color:transparent";
    }
    spinPreviewWrap.appendChild(pv1);
    spinPreviewWrap.appendChild(el("span", "color:#888;font-size:11px", "(与侧栏实际效果同步)"));
    panel.appendChild(spinPreviewWrap);

    // 状态指示渲染分组
    var statusSub = el("div", "margin:10px 0 6px;color:#999;font-size:11px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px", "状态指示（红点/蓝点/对勾）");
    panel.appendChild(statusSub);
    // 四态颜色：原生取色器（点击弹出系统调色板），旁边 ↺ 恢复默认（清空自定义值）
    function colorField(label, val, defColor, onChange) {
      var r = el("div", "display:flex;align-items:center;gap:5px;margin-bottom:6px");
      var pick = document.createElement("input");
      pick.type = "color";
      pick.value = val || defColor;
      pick.title = val ? "当前自定义：" + val : "当前默认（点击修改）";
      pick.style.cssText = "width:26px;height:22px;padding:0;border:1px solid rgba(255,255,255,.2);border-radius:5px;background:transparent;cursor:pointer;flex:0 0 auto";
      pick.addEventListener("input", function () { onChange(pick.value); });
      r.appendChild(pick);
      r.appendChild(el("span", "flex:1;color:#ccc;font-size:11px", label));
      var rst = mkBtn("↺", "恢复默认色");
      rst.style.cssText += ";padding:2px 6px;font-size:11px;flex:0 0 auto";
      rst.onclick = function () { onChange(""); buildPanel(panel, c); };
      r.appendChild(rst);
      return r;
    }
    var colorGrid = el("div", "display:flex;flex-wrap:wrap;gap:0 10px");
    var colL = el("div", "flex:1;min-width:130px");
    colL.appendChild(colorField("失败", c.statusError, "#ff5f57", function (v) { c.statusError = v; refreshAll(c); }));
    colL.appendChild(colorField("未读", c.statusUnread, "#38bdf8", function (v) { c.statusUnread = v; refreshAll(c); }));
    colorGrid.appendChild(colL);
    var colR = el("div", "flex:1;min-width:130px");
    colR.appendChild(colorField("空闲", c.statusIdle, "#9ca3af", function (v) { c.statusIdle = v; refreshAll(c); }));
    colR.appendChild(colorField("完成", c.statusSuccess, "#46bf72", function (v) { c.statusSuccess = v; refreshAll(c); }));
    colorGrid.appendChild(colR);
    panel.appendChild(colorGrid);
    var pulseRow = el("div", "display:flex;align-items:center;gap:8px;margin-bottom:8px");
    var pulseCb = document.createElement("input");
    pulseCb.type = "checkbox";
    pulseCb.checked = !!c.statusFailPulse;
    pulseCb.style.cssText = "accent-color:#38bdf8";
    pulseCb.addEventListener("change", function () { c.statusFailPulse = pulseCb.checked; refreshAll(c); });
    pulseRow.appendChild(pulseCb);
    pulseRow.appendChild(el("span", "color:#ccc;font-size:12px", "失败红点呼吸光晕"));
    panel.appendChild(pulseRow);

    // 外观定制分组：字号/滚动条/主题色/光标/圆角
    var lookSub = el("div", "margin:10px 0 6px;color:#999;font-size:11px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px", "外观（字号/滚动条/主题色）");
    panel.appendChild(lookSub);
    // 字号 + 圆角一行两列
    var fontRadiusRow = el("div", "display:flex;gap:8px;margin-bottom:8px");
    function miniNumG(val, onChange, step, minV, maxV, unit, title) {
      var wrap = el("div", "flex:1;min-width:0;display:flex;align-items:center;gap:3px");
      var inp = document.createElement("input");
      inp.type = "number";
      inp.value = val;
      inp.step = step;
      inp.min = minV;
      inp.max = maxV;
      inp.title = title || "";
      inp.style.cssText = "flex:1;min-width:0;width:100%;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:5px;padding:3px 4px;color:#eee;font-size:11px";
      inp.addEventListener("change", function () {
        var v = Number(inp.value);
        if (isNaN(v)) { inp.value = val; return; }
        v = Math.max(minV, Math.min(maxV, v));
        inp.value = v;
        onChange(v);
      });
      wrap.appendChild(inp);
      wrap.appendChild(el("span", "flex:0 0 auto;color:#888;font-size:10px", unit));
      return wrap;
    }
    var cellFont = el("div", "flex:1;min-width:0");
    cellFont.appendChild(el("div", "color:#999;font-size:10px;margin-bottom:2px", "界面字号(0=默认)"));
    cellFont.appendChild(miniNumG(c.uiFontSize, function (v) { c.uiFontSize = v; refreshAll(c); }, 1, 0, 24, "px", "全局界面字号，0=用 ZCode 默认 14px"));
    fontRadiusRow.appendChild(cellFont);
    var cellRadius = el("div", "flex:1;min-width:0");
    cellRadius.appendChild(el("div", "color:#999;font-size:10px;margin-bottom:2px", "圆角缩放%"));
    cellRadius.appendChild(miniNumG(c.radiusScale, function (v) { c.radiusScale = v; refreshAll(c); }, 10, 0, 300, "%", "卡片/面板圆角统一缩放，100=默认"));
    fontRadiusRow.appendChild(cellRadius);
    panel.appendChild(fontRadiusRow);
    // 滚动条 + 光标一行两列
    var scrollCursorRow = el("div", "display:flex;gap:8px;margin-bottom:8px");
    var cellScroll = el("div", "flex:1;min-width:0");
    cellScroll.appendChild(el("div", "color:#999;font-size:10px;margin-bottom:2px", "滚动条宽(0=默认)"));
    cellScroll.appendChild(miniNumG(c.scrollbarWidth, function (v) { c.scrollbarWidth = v; refreshAll(c); }, 1, 0, 20, "px", "滚动条宽度，0=用 ZCode 默认 14px"));
    scrollCursorRow.appendChild(cellScroll);
    var cellCursor = el("div", "flex:1;min-width:0");
    cellCursor.appendChild(el("div", "color:#999;font-size:10px;margin-bottom:2px", "光标闪烁"));
    var blinkWrap = el("div", "display:flex;align-items:center;gap:6px;height:24px");
    var blinkCb = document.createElement("input");
    blinkCb.type = "checkbox";
    blinkCb.checked = !!c.cursorBlink;
    blinkCb.style.cssText = "accent-color:#38bdf8";
    blinkCb.addEventListener("change", function () { c.cursorBlink = blinkCb.checked; refreshAll(c); });
    blinkWrap.appendChild(blinkCb);
    blinkWrap.appendChild(el("span", "color:#888;font-size:10px", "终端光标闪烁"));
    cellCursor.appendChild(blinkWrap);
    scrollCursorRow.appendChild(cellCursor);
    panel.appendChild(scrollCursorRow);
    // 主题色 + 光标颜色一行两列（取色器 + ↺）
    var colorRow2 = el("div", "display:flex;gap:8px;margin-bottom:8px");
    function lookColor(label, val, defColor, onChange) {
      var cell = el("div", "flex:1;min-width:0");
      cell.appendChild(el("div", "color:#999;font-size:10px;margin-bottom:2px", label));
      var r = el("div", "display:flex;align-items:center;gap:5px");
      var pick = document.createElement("input");
      pick.type = "color";
      pick.value = val || defColor;
      pick.title = val ? "当前自定义：" + val : "当前默认（点击修改）";
      pick.style.cssText = "width:26px;height:22px;padding:0;border:1px solid rgba(255,255,255,.2);border-radius:5px;background:transparent;cursor:pointer;flex:0 0 auto";
      pick.addEventListener("input", function () { onChange(pick.value); });
      r.appendChild(pick);
      var rst = mkBtn("↺", "恢复默认");
      rst.style.cssText += ";padding:2px 6px;font-size:11px;flex:0 0 auto";
      rst.onclick = function () { onChange(""); buildPanel(panel, c); };
      r.appendChild(rst);
      cell.appendChild(r);
      return cell;
    }
    colorRow2.appendChild(lookColor("主题色", c.accentColor, "#ffffff", function (v) { c.accentColor = v; refreshAll(c); }));
    colorRow2.appendChild(lookColor("光标色", c.cursorColor, "#f8f8f8", function (v) { c.cursorColor = v; refreshAll(c); }));
    panel.appendChild(colorRow2);

    // 输入框氛围灯：主面板只留开关 + 模式名 + 配置入口，详细设置放独立二级面板
    var glowSub = el("div", "margin:10px 0 6px;color:#999;font-size:11px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px", "✨ 输入框氛围灯");
    panel.appendChild(glowSub);
    var glowRow = el("div", "display:flex;align-items:center;gap:8px;margin-bottom:8px");
    var glowCb = document.createElement("input");
    glowCb.type = "checkbox";
    glowCb.checked = !!c.inputGlow.enabled;
    glowCb.style.cssText = "accent-color:#38bdf8";
    glowCb.addEventListener("change", function () {
      c.inputGlow.enabled = glowCb.checked;
      refreshAll(c);
    });
    glowRow.appendChild(glowCb);
    var glowModeName = el("span", "flex:1;color:#ccc;font-size:12px",
      (GLOW_MODES[c.inputGlow.mode] || {}).label || "自定义");
    glowRow.appendChild(glowModeName);
    var glowCfgBtn = mkBtn("配置…", "打开氛围灯详细设置");
    glowCfgBtn.style.cssText += ";flex:0 0 auto";
    glowCfgBtn.onclick = function () { buildGlowPanel(glowCfgBtn, c); };
    glowRow.appendChild(glowCfgBtn);
    panel.appendChild(glowRow);

    // 分区透明度
    var o = c.opacities || {};
    // 标题上边距收窄（10px→4px），去掉与预览区之间的多余空行
    var sub = el("div", "margin:4px 0 2px;color:#999;font-size:11px;border-top:1px solid rgba(255,255,255,.08);padding-top:6px", "分区透明度");
    panel.appendChild(sub);
    // 提示区固定高度预留，出现/消失不改变布局（否则会挤压滑杆行，
    // 行位移触发 mouseleave→隐藏→mouseenter→显示 的循环，导致面板乱抖）
    var hintEl = el("div", "height:0;overflow:hidden;margin:0;color:#e8a13a;font-size:11px;line-height:1.5;transition:height .15s,opacity .15s;opacity:0");
    panel.appendChild(hintEl);
    function showHint(text) {
      hintEl.textContent = text;
      hintEl.style.height = "34px";
      hintEl.style.opacity = "1";
      hintEl.style.marginBottom = "4px";
    }
    function hideHint() {
      hintEl.style.height = "0";
      hintEl.style.opacity = "0";
      hintEl.style.marginBottom = "0";
    }
    for (var k in VAR_MAP) {
      (function (key) {
        var r = row(LABELS[key] || key, slider(o[key], function (v) {
          o[key] = v;
          refreshAll(c);
        }));
        bindSliderPreview(r, key);
        // 悬停时若页面上找不到对应元素，在面板里给出「窗口未打开」提示
        r.addEventListener("mouseenter", function () {
          var sels = HIGHLIGHT_CLASS[key];
          if (!sels) { return; }
          var found = false;
          try { found = !!document.querySelector(sels.join(",")); } catch (e) {}
          if (!found) {
            showHint("⚠ 当前界面上没有找到「" + (LABELS[key] || key) + "」对应的可见区域——它所在的窗口/面板可能没打开（如菜单、悬浮提示、终端）。打开后悬停本滑杆即可看到红框。");
          } else {
            hideHint();
          }
        });
        r.addEventListener("mouseleave", hideHint);
        panel.appendChild(r);
      })(k);
    }

    panel.appendChild(el("div", "height:8px"));
    panel.appendChild(row("毛玻璃", slider(c.blurPanel, function (v) {
      c.blurPanel = v;
      refreshAll(c);
    }, 0, 30, 1)));
    panel.appendChild(row("壁纸模糊", slider(c.blurWallpaper, function (v) {
      c.blurWallpaper = v;
      refreshAll(c);
    }, 0, 20, 1)));

    // 底部按钮
    var btnRow = el("div", "display:flex;gap:8px;margin-top:12px");
    var reset = mkBtn("恢复默认", "恢复默认设置");
    reset.style.cssText += ";flex:1";
    reset.onclick = function () {
      localStorage.removeItem(LS_KEY);
      var d = load();
      for (var rk in c) delete c[rk];
      for (var rk2 in d) c[rk2] = d[rk2];
      refreshAll(c);
      buildPanel(panel, c);
    };
    btnRow.appendChild(reset);

    var exp = mkBtn("导出", "复制配置 JSON 到剪贴板");
    exp.style.cssText += ";flex:1";
    exp.onclick = function () {
      var json = JSON.stringify(c, null, 2);
      try {
        navigator.clipboard.writeText(json);
        alert("已复制配置 JSON 到剪贴板");
      } catch (e) {
        prompt("复制下面的 JSON：", json);
      }
    };
    btnRow.appendChild(exp);

    var imp = mkBtn("导入", "粘贴配置 JSON");
    imp.style.cssText += ";flex:1";
    imp.onclick = function () {
      var txt = prompt("粘贴配置 JSON：");
      if (!txt) return;
      try {
        var obj = JSON.parse(txt);
        for (var ik in c) delete c[ik];
        for (var ik2 in obj) c[ik2] = obj[ik2];
        // 导入绕过了 load() 的深合并，必须规范化：旧版/部分 inputGlow 用默认值补齐，否则后续读取崩溃
        var mg = JSON.parse(JSON.stringify(DEFAULTS.inputGlow));
        if (c.inputGlow && typeof c.inputGlow === "object") mergeDeep(mg, c.inputGlow);
        c.inputGlow = mg;
        refreshAll(c);
        buildPanel(panel, c);
      } catch (e) {
        alert("JSON 解析失败：\n" + e.message);
      }
    };
    btnRow.appendChild(imp);
    panel.appendChild(btnRow);

    // 广告：AI 模型共享平台（点击打开，openExternal 兜底 window.open）
    var adWrap = el("div", "margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)");
    var adLink = el("a", "display:block;color:#8ab4f8;font-size:11px;text-decoration:none;cursor:pointer;line-height:1.5;transition:color .15s");
    adLink.textContent = "🔗 AI 模型共享，尽在 sharellm.net";
    adLink.href = "https://sharellm.net/sign-up?aff=wb5b";
    adLink.target = "_blank";
    adLink.rel = "noopener";
    adLink.onclick = function (e) {
      e.preventDefault();
      var url = "https://sharellm.net/sign-up?aff=wb5b";
      if (window.zcode && typeof window.zcode.openExternal === "function") {
        window.zcode.openExternal(url);
      } else {
        window.open(url, "_blank");
      }
    };
    adWrap.appendChild(adLink);
    panel.appendChild(adWrap);
  }

  /* ---------- 氛围灯二级设置面板 ---------- */

  function buildGlowPanel(anchorBtn, c) {
    var g = c.inputGlow;
    var panel = document.getElementById(GLOW_PANEL_ID);
    if (!panel) {
      panel = el(
        "div",
        "display:none;position:fixed;z-index:2147483000;width:360px;max-height:80vh;overflow-y:auto;background:rgba(23,23,23,.96);color:#eee;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.5);font:13px/1.5 'Segoe UI',sans-serif"
      );
      panel.id = GLOW_PANEL_ID;
      document.body.appendChild(panel);
    }
    panel.innerHTML = "";

    function persist() { save(c); applyGlow(c); }
    function rebuild() { buildGlowPanel(anchorBtn, c); }
    function syncMain() {
      var mp = document.getElementById(PANEL_ID);
      if (mp && mp.style.display === "block") buildPanel(mp, c);
    }

    // 标题 + 关闭
    var head = el("div", "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px");
    head.appendChild(el("div", "font-weight:600;font-size:14px;color:#fff", "✨ 氛围灯设置（输入框）"));
    var close = mkBtn("✕", "关闭");
    close.onclick = function () { panel.style.display = "none"; syncMain(); };
    head.appendChild(close);
    panel.appendChild(head);

    // 折叠区
    function section(title, open) {
      var wrap = el("div", "margin-bottom:6px;border:1px solid rgba(255,255,255,.08);border-radius:8px;overflow:hidden");
      var bar = el("div", "display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(255,255,255,.04);cursor:pointer;user-select:none");
      bar.appendChild(el("span", "color:#ddd;font-size:12px;font-weight:600", title));
      var arrow = el("span", "color:#888;font-size:11px", open ? "▾" : "▸");
      bar.appendChild(arrow);
      var body = el("div", open ? "padding:8px" : "display:none;padding:8px");
      bar.onclick = function () {
        var isOpen = body.style.display !== "none";
        body.style.display = isOpen ? "none" : "block";
        arrow.textContent = isOpen ? "▸" : "▾";
      };
      wrap.appendChild(bar);
      wrap.appendChild(body);
      panel.appendChild(wrap);
      return body;
    }

    function mkNum(val, onChange, step, minV, maxV, unit, title) {
      var wrap = el("div", "display:flex;align-items:center;gap:3px");
      var inp = document.createElement("input");
      inp.type = "number";
      inp.value = val;
      inp.step = step;
      inp.min = minV;
      inp.max = maxV;
      inp.title = title || "";
      inp.style.cssText = "width:52px;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:5px;padding:3px 4px;color:#eee;font-size:11px";
      inp.addEventListener("change", function () {
        var v = Number(inp.value);
        if (isNaN(v)) { inp.value = val; return; }
        v = Math.max(minV, Math.min(maxV, v));
        inp.value = v;
        onChange(v);
      });
      wrap.appendChild(inp);
      wrap.appendChild(el("span", "color:#888;font-size:10px;flex:0 0 auto", unit));
      return wrap;
    }

    function mkColor(val, onChange) {
      var pick = document.createElement("input");
      pick.type = "color";
      pick.value = val || "#22D3EE";
      pick.style.cssText = "width:26px;height:22px;padding:0;border:1px solid rgba(255,255,255,.2);border-radius:5px;background:transparent;cursor:pointer;flex:0 0 auto";
      pick.addEventListener("input", function () { onChange(pick.value); });
      return pick;
    }

    function mkCheck(on, onChange, label) {
      var wrap = el("div", "display:flex;align-items:center;gap:5px");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!on;
      cb.style.cssText = "accent-color:#38bdf8";
      cb.addEventListener("change", function () { onChange(cb.checked); });
      wrap.appendChild(cb);
      if (label) wrap.appendChild(el("span", "color:#ccc;font-size:11px", label));
      return wrap;
    }

    // ▶ 预览：focus/typing/blur 临时切属性，send/done/error 直接播放一次性动画
    function previewState(name) {
      if (!glowHost) { alert("未找到聊天输入框——请确认主界面聊天窗口已打开"); return; }
      var host = glowHost;
      if (name === "focus") {
        host.setAttribute("data-zc-focus", "1");
        host.removeAttribute("data-zc-blur");
        setTimeout(function () { host.removeAttribute("data-zc-focus"); }, 2000);
      } else if (name === "blur") {
        host.removeAttribute("data-zc-focus");
        host.setAttribute("data-zc-blur", "1");
        setTimeout(function () { host.removeAttribute("data-zc-blur"); }, 2000);
      } else if (name === "typing") {
        var tp = g.states.typing;
        host.style.setProperty("--zc-glow-t", ((Number(g.period) || 18) / (Number(tp.speedup) || 1)) + "s");
        setTimeout(function () { applyGlowInlineVars(c); }, 2500);
      } else if (name === "working") {
        // working 是持续态不是一次性动画，预览 = 临时进入 4 秒再退出
        var w = g.states.working;
        host.setAttribute("data-zc-state", "working");
        host.setAttribute("data-zc-wmode", w.mode || "flow");
        host.style.setProperty("--zc-glow-grad", glowStateGradient(w.color || "#818CF8"));
        host.style.setProperty("--zc-glow-wt", Number(w.period) || 5);
        if ((w.mode || "flow") === "flow") host.style.setProperty("--zc-glow-t", (Number(w.period) || 5) + "s");
        setTimeout(function () {
          if (!glowHost) return;
          glowHost.removeAttribute("data-zc-state");
          glowHost.removeAttribute("data-zc-wmode");
          applyGlowInlineVars(c);
        }, 4000);
      } else {
        setGlowOnce(c, name);
      }
    }

    // 状态行：开关 + 名称 + ▶ 预览 + 可选参数
    function stateRow(title, name, paramCtrls) {
      var r = el("div", "display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap");
      var s = g.states[name];
      r.appendChild(mkCheck(s.on !== false, function (v) { s.on = v; persist(); }));
      r.appendChild(el("span", "flex:0 0 auto;color:#ccc;font-size:11px;min-width:56px", title));
      if (paramCtrls) {
        var pc = el("div", "flex:1;min-width:120px;display:flex;align-items:center;gap:5px;flex-wrap:wrap");
        paramCtrls(pc);
        r.appendChild(pc);
      }
      var pv = mkBtn("▶", "在输入框上预览这个效果");
      pv.style.cssText += ";padding:2px 7px;font-size:10px;flex:0 0 auto";
      pv.onclick = function () { previewState(name); };
      r.appendChild(pv);
      return r;
    }

    /* ===== A. 环境光轨 ===== */
    var secA = section("环境光轨", true);

    secA.appendChild(selectField("模式", g.mode || "lounge", {
      "lounge": GLOW_MODES.lounge.label,
      "aurora": GLOW_MODES.aurora.label,
      "reactive": GLOW_MODES.reactive.label,
      "custom": "自定义（保留当前参数）"
    }, function (v) {
      g.mode = v;
      var m = GLOW_MODES[v];
      if (m) {
        g.colors = m.colors.slice();
        g.period = m.period;
        g.brightness = m.brightness;
        g.hueCycle = m.hueCycle;
        if (m.hueRange) g.hueRange = m.hueRange;
      }
      persist();
      rebuild();
      syncMain();
    }));

    // 预设配色色卡
    var palWrap = el("div", "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px");
    palWrap.appendChild(el("div", "width:100%;color:#999;font-size:10px;margin-bottom:2px", "预设配色"));
    GLOW_PALETTE.forEach(function (p) {
      var chip = el("div", "width:44px;height:22px;border-radius:6px;cursor:pointer;border:2px solid " +
        (JSON.stringify(p.colors) === JSON.stringify(g.colors) ? "#38bdf8" : "rgba(255,255,255,.15)") +
        ";background:linear-gradient(90deg," + p.colors.concat([p.colors[0]]).join(",") + ")");
      chip.title = p.name;
      chip.onclick = function () {
        g.colors = p.colors.slice();
        persist();
        rebuild();
      };
      palWrap.appendChild(chip);
    });
    secA.appendChild(palWrap);

    // 渐变色标编辑器（2–6 个）
    var stopsRow = el("div", "display:flex;align-items:center;gap:4px;margin-bottom:8px;flex-wrap:wrap");
    stopsRow.appendChild(el("div", "width:100%;color:#999;font-size:10px;margin-bottom:2px", "渐变色标（2–6 个，首尾自动闭合）"));
    g.colors.forEach(function (col, idx) {
      var cell = el("div", "display:flex;align-items:center;gap:2px");
      cell.appendChild(mkColor(col, function (v) {
        g.colors[idx] = v;
        persist();
        // 只换色不重建，保持面板输入焦点
        if (glowHost) glowHost.style.setProperty("--zc-glow-grad", glowGradient(c));
      }));
      if (g.colors.length > 2) {
        var del = mkBtn("✕", "删除这个色标");
        del.style.cssText += ";padding:1px 4px;font-size:9px";
        del.onclick = function () {
          g.colors.splice(idx, 1);
          persist();
          rebuild();
        };
        cell.appendChild(del);
      }
      stopsRow.appendChild(cell);
    });
    if (g.colors.length < 6) {
      var addStop = mkBtn("＋", "添加色标");
      addStop.style.cssText += ";padding:1px 6px;font-size:11px";
      addStop.onclick = function () {
        g.colors.push("#888888");
        persist();
        rebuild();
      };
      stopsRow.appendChild(addStop);
    }
    secA.appendChild(stopsRow);

    secA.appendChild(row("流向", selectField("", g.direction || "cw", {
      "cw": "环绕·顺时针",
      "ccw": "环绕·逆时针",
      "alt": "往返摆动"
    }, function (v) { g.direction = v; persist(); })));

    secA.appendChild(row("循环周期", slider(g.period, function (v) { g.period = v; persist(); }, 2, 60, 1, function (v) { return v + "s"; })));
    secA.appendChild(row("亮度", slider(g.brightness, function (v) { g.brightness = v; persist(); }, 0, 40, 1, function (v) { return v + "%"; })));
    secA.appendChild(row("光轨宽度", slider(g.trackWidth, function (v) { g.trackWidth = v; persist(); }, 1, 3, 0.5, function (v) { return v + "px"; })));
    secA.appendChild(row("光晕扩散", slider(g.glowBlur, function (v) { g.glowBlur = v; persist(); }, 0, 24, 1, function (v) { return v + "px"; })));
    secA.appendChild(row("光晕强度", slider(g.glowOpacity, function (v) { g.glowOpacity = v; persist(); }, 0, 100, 1, function (v) { return v + "%"; })));

    var hueRow = el("div", "display:flex;align-items:center;gap:8px;margin-bottom:8px");
    hueRow.appendChild(mkCheck(g.hueCycle, function (v) { g.hueCycle = v; persist(); rebuild(); }, "全谱色相循环"));
    if (g.hueCycle) {
      hueRow.appendChild(slider(g.hueRange, function (v) { g.hueRange = v; persist(); }, 15, 360, 5, function (v) { return v + "°"; }));
    }
    secA.appendChild(hueRow);

    /* ===== B. 状态反馈 ===== */
    var secB = section("状态反馈（联动 / ▶ 可预览）", false);

    secB.appendChild(stateRow("聚焦增强", "focus", function (pc) {
      pc.appendChild(mkNum(g.states.focus.boost, function (v) { g.states.focus.boost = v; persist(); }, 1, 0, 30, "%", "聚焦时额外增加的亮度"));
    }));
    secB.appendChild(stateRow("输入提速", "typing", function (pc) {
      pc.appendChild(mkNum(g.states.typing.speedup, function (v) { g.states.typing.speedup = v; persist(); }, 0.5, 1, 4, "x", "输入时流光加速倍率"));
    }));
    secB.appendChild(stateRow("失焦降亮", "blur", function (pc) {
      pc.appendChild(mkNum(g.states.blur.dim, function (v) { g.states.blur.dim = v; persist(); }, 5, 0, 80, "%", "失焦后降低的亮度比例"));
    }));
    secB.appendChild(stateRow("发送扫光", "send", function (pc) {
      pc.appendChild(mkColor(g.states.send.color, function (v) { g.states.send.color = v; persist(); }));
      pc.appendChild(mkNum(g.states.send.dur, function (v) { g.states.send.dur = v; persist(); }, 0.1, 0.3, 2, "s", "扫光时长"));
    }));
    secB.appendChild(stateRow("生成中", "working", function (pc) {
      var modeSel = document.createElement("select");
      modeSel.style.cssText = "background:rgba(30,30,30,.95);border:1px solid rgba(255,255,255,.2);border-radius:5px;padding:2px 4px;color:#eee;font-size:11px";
      [["flow", "流动"], ["breath", "呼吸"], ["static", "静态提亮"]].forEach(function (pair) {
        var opt = document.createElement("option");
        opt.value = pair[0];
        opt.textContent = pair[1];
        opt.style.cssText = "background:#1e1e1e;color:#eee";
        if (pair[0] === (g.states.working.mode || "flow")) opt.selected = true;
        modeSel.appendChild(opt);
      });
      modeSel.addEventListener("change", function () { g.states.working.mode = modeSel.value; persist(); });
      pc.appendChild(modeSel);
      pc.appendChild(mkColor(g.states.working.color, function (v) { g.states.working.color = v; persist(); }));
      pc.appendChild(mkNum(g.states.working.period, function (v) { g.states.working.period = v; persist(); }, 1, 1, 10, "s", "流动/呼吸周期"));
    }));
    secB.appendChild(stateRow("生成完成", "done", function (pc) {
      pc.appendChild(mkColor(g.states.done.color, function (v) { g.states.done.color = v; persist(); }));
      pc.appendChild(mkNum(g.states.done.dur, function (v) { g.states.done.dur = v; persist(); }, 0.1, 0.5, 3, "s", "扩散时长"));
    }));
    secB.appendChild(stateRow("失败脉冲", "error", function (pc) {
      pc.appendChild(mkColor(g.states.error.color, function (v) { g.states.error.color = v; persist(); }));
      pc.appendChild(mkNum(g.states.error.pulses, function (v) { g.states.error.pulses = v; persist(); }, 1, 1, 3, "次", "脉冲次数"));
      pc.appendChild(mkNum(g.states.error.dur, function (v) { g.states.error.dur = v; persist(); }, 0.1, 0.5, 3, "s", "总时长"));
    }));
    secB.appendChild(row("停输入回落", mkNum(g.states.idleBack, function (v) { g.states.idleBack = v; persist(); }, 1, 1, 10, "s", "停止输入多少秒后恢复环境光")));
    secB.appendChild(el("div", "color:#888;font-size:10px;line-height:1.5", "优先级：失败 > 生成中 > 输入 > 聚焦 > 环境光。生成中→结束时会自动给出完成/失败反馈。"));

    /* ===== C. 高级 ===== */
    var secC = section("高级", false);

    var nightRow = el("div", "display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap");
    nightRow.appendChild(mkCheck(g.night.on, function (v) { g.night.on = v; persist(); rebuild(); }));
    nightRow.appendChild(el("span", "color:#ccc;font-size:11px;flex:0 0 auto", "夜间降亮"));
    var fromInp = document.createElement("input");
    fromInp.type = "text";
    fromInp.value = g.night.from;
    fromInp.placeholder = "22:00";
    fromInp.style.cssText = "width:48px;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:5px;padding:3px 4px;color:#eee;font-size:11px";
    fromInp.addEventListener("change", function () { g.night.from = fromInp.value.trim(); persist(); });
    nightRow.appendChild(fromInp);
    nightRow.appendChild(el("span", "color:#888;font-size:11px", "→"));
    var toInp = document.createElement("input");
    toInp.type = "text";
    toInp.value = g.night.to;
    toInp.placeholder = "06:00";
    toInp.style.cssText = "width:48px;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:5px;padding:3px 4px;color:#eee;font-size:11px";
    toInp.addEventListener("change", function () { g.night.to = toInp.value.trim(); persist(); });
    nightRow.appendChild(toInp);
    secC.appendChild(nightRow);
    secC.appendChild(row("夜间降幅", slider(g.night.dim, function (v) { g.night.dim = v; persist(); }, 0, 80, 5, function (v) { return v + "%"; })));

    secC.appendChild(row("动画缓动", selectField("", g.easing || "ease-in-out", {
      "ease-in-out": "ease-in-out（柔和）",
      "ease": "ease",
      "linear": "linear（匀速）",
      "cubic-bezier(.4,0,.2,1)": "cubic-bezier（先缓后急）"
    }, function (v) { g.easing = v; persist(); })));

    var resetGlow = mkBtn("恢复氛围灯默认", "重置本模块全部设置");
    resetGlow.style.cssText += ";width:100%;margin-top:4px";
    resetGlow.onclick = function () {
      // 直接克隆出厂默认（不经 load()——load() 会读回已保存值导致恢复成 no-op）
      var keepPresets = g.userPresets;
      c.inputGlow = JSON.parse(JSON.stringify(DEFAULTS.inputGlow));
      if (keepPresets) c.inputGlow.userPresets = keepPresets;
      g = c.inputGlow;
      persist();
      rebuild();
      syncMain();
    };
    secC.appendChild(resetGlow);

    /* ===== D. 我的预设 ===== */
    var secD = section("我的预设（最多 5 个）", false);
    var nameRow = el("div", "display:flex;gap:5px;margin-bottom:6px");
    var nameInp = document.createElement("input");
    nameInp.type = "text";
    nameInp.placeholder = "预设名称…";
    nameInp.style.cssText = "flex:1;min-width:0;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:5px;padding:4px 6px;color:#eee;font-size:11px";
    nameRow.appendChild(nameInp);
    var saveBtn = mkBtn("存为预设", "保存当前全部氛围灯参数");
    saveBtn.style.cssText += ";flex:0 0 auto";
    saveBtn.onclick = function () {
      var name = nameInp.value.trim();
      if (!name) { alert("先输入预设名称"); return; }
      if (!g.userPresets) g.userPresets = {};
      if (!g.userPresets[name] && Object.keys(g.userPresets).length >= 5) {
        alert("最多保存 5 个预设，请先删除旧的");
        return;
      }
      var copy = JSON.parse(JSON.stringify(g));
      delete copy.userPresets;
      g.userPresets[name] = copy;
      persist();
      rebuild();
    };
    nameRow.appendChild(saveBtn);
    secD.appendChild(nameRow);
    var chips = el("div", "display:flex;flex-wrap:wrap;gap:5px");
    var presetNames = Object.keys(g.userPresets || {});
    if (!presetNames.length) {
      chips.appendChild(el("span", "color:#888;font-size:10px", "还没有保存的预设"));
    }
    presetNames.forEach(function (pn) {
      var chipWrap = el("div", "display:flex;align-items:center;gap:0;border:1px solid rgba(255,255,255,.15);border-radius:6px;overflow:hidden");
      var chipBtn = el("span", "padding:3px 8px;color:#ddd;font-size:11px;cursor:pointer;background:rgba(255,255,255,.05)", pn);
      chipBtn.title = "点击应用这个预设";
      chipBtn.onclick = function () {
        var copy = JSON.parse(JSON.stringify(g.userPresets[pn]));
        copy.userPresets = g.userPresets;
        c.inputGlow = copy;
        g = copy;
        persist();
        rebuild();
        syncMain();
      };
      var delBtn = el("span", "padding:3px 6px;color:#f66;font-size:10px;cursor:pointer;background:rgba(255,255,255,.05)", "✕");
      delBtn.title = "删除预设";
      delBtn.onclick = function () {
        delete g.userPresets[pn];
        persist();
        rebuild();
      };
      chipWrap.appendChild(chipBtn);
      chipWrap.appendChild(delBtn);
      chips.appendChild(chipWrap);
    });
    secD.appendChild(chips);

    // 定位到触发按钮附近（复用主面板定位逻辑）
    var r = anchorBtn.getBoundingClientRect();
    var pw = 360;
    var left = r.right + 8;
    if (left + pw > window.innerWidth - 8) left = r.left - pw - 8;
    if (left < 8) left = 8;
    panel.style.left = left + "px";
    panel.style.top = Math.min(r.top, Math.max(8, window.innerHeight - 80)) + "px";
    panel.style.right = "auto";
    panel.style.display = "block";
  }

  function initUI(c) {
    // 读取上次拖拽位置（默认右上角，避开窗口控制按钮）。
    // 存相对比例（0-1），窗口缩放/全屏切换后按钮仍保持在可视区内；兼容旧版绝对像素格式。
    var savedPos = null;
    try { savedPos = JSON.parse(localStorage.getItem(LS_KEY + "-btnpos")); } catch (e) {}
    var btnPos = null;
    if (savedPos) {
      if (typeof savedPos.rx === "number" && typeof savedPos.ry === "number") {
        btnPos = { rx: savedPos.rx, ry: savedPos.ry };
      } else if (typeof savedPos.x === "number" && typeof savedPos.y === "number") {
        var vw0 = window.innerWidth || 1, vh0 = window.innerHeight || 1;
        btnPos = { rx: savedPos.x / vw0, ry: savedPos.y / vh0 };
      }
    }
    var btn = el(
      "button",
      "position:fixed;right:16px;top:64px;z-index:2147483000;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(25,25,25,.72);color:#fff;font-size:16px;cursor:grab;display:flex;align-items:center;justify-content:center;line-height:1;padding:0;backdrop-filter:blur(8px);box-shadow:0 2px 10px rgba(0,0,0,.35);-webkit-app-region:no-drag;touch-action:none"
    );
    btn.id = BTN_ID;
    btn.textContent = "🎨";
    btn.title = "皮肤设置（拖动可移动位置）";
    document.body.appendChild(btn);
    // 无记录时保持 CSS 默认（右上角，天然自适应窗口）；有记录时按比例定位并 clamp 到可视区
    function placeBtn() {
      if (!btnPos) return;
      var w = window.innerWidth, h = window.innerHeight;
      var bw = btn.offsetWidth || 34, bh = btn.offsetHeight || 34;
      var left = Math.max(0, Math.min(w - bw, btnPos.rx * w));
      var top = Math.max(0, Math.min(h - bh, btnPos.ry * h));
      btn.style.right = "auto";
      btn.style.left = left + "px";
      btn.style.top = top + "px";
    }
    placeBtn();
    window.addEventListener("resize", placeBtn);

    var panel = el(
      "div",
      "display:none;position:fixed;right:16px;top:104px;z-index:2147483000;width:340px;max-height:80vh;overflow-y:auto;background:rgba(23,23,23,.96);color:#eee;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.5);font:13px/1.5 'Segoe UI',sans-serif"
    );
    panel.id = PANEL_ID;
    document.body.appendChild(panel);
    buildPanel(panel, c);

    // 拖拽逻辑
    var dragging = false, startX = 0, startY = 0, origX = 0, origY = 0;
    function onMove(e) {
      if (!dragging) return;
      var cx = e.clientX, cy = e.clientY;
      var nx = origX + (cx - startX);
      var ny = origY + (cy - startY);
      // 限制在窗口内
      nx = Math.max(0, Math.min(window.innerWidth - 40, nx));
      ny = Math.max(0, Math.min(window.innerHeight - 40, ny));
      btn.style.left = nx + "px";
      btn.style.top = ny + "px";
    }
    btn.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      var rect = btn.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      btn.style.cursor = "grabbing";
      e.preventDefault();
    });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", function (e) {
      if (!dragging) return;
      dragging = false;
      btn.style.cursor = "grab";
      var rect = btn.getBoundingClientRect();
      btn.style.right = "auto";
      btn.style.left = rect.left + "px";
      btn.style.top = rect.top + "px";
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      btnPos = { rx: rect.left / w, ry: rect.top / h };
      localStorage.setItem(LS_KEY + "-btnpos", JSON.stringify(btnPos));
    });

    btn.onclick = function (e) {
      // 拖拽后不触发点击
      if (dragging) return;
      e.stopPropagation();
      var showing = panel.style.display === "block";
      if (!showing) {
        // 面板出现在按钮附近
        var r = btn.getBoundingClientRect();
        var pw = 340;
        var left = r.right + 8;
        if (left + pw > window.innerWidth - 8) left = r.left - pw - 8;
        if (left < 8) left = 8;
        panel.style.left = left + "px";
        panel.style.top = Math.min(r.top, window.innerHeight - 80) + "px";
        panel.style.right = "auto";
        panel.style.display = "block";
      } else {
        panel.style.display = "none";
      }
    };
    document.addEventListener("click", function (e) {
      // 氛围灯二级面板上的点击不算"外部点击"，否则一点二级面板就把主面板关了
      var glowPanel = document.getElementById(GLOW_PANEL_ID);
      if (panel.style.display === "block" && !panel.contains(e.target) && e.target !== btn &&
          !(glowPanel && glowPanel.contains(e.target))) {
        panel.style.display = "none";
      }
    });
  }

  function boot() {
    applyImgs(cfg);
    applyEffect(cfg);
    applyGlow(cfg);
    initUI(cfg);
    // 定时兜底：ZCode 的 React 渲染是异步的，observer 可能因时序漏触发（例如初次渲染
    // 发生在 observer 创建之前、或 rAF 节流吞掉了关键批次）。延迟重跑 sync 确保打标到位。
    if (window.__zcodeSkinSpinSync) {
      [800, 2000, 5000].forEach(function (ms) {
        setTimeout(function () {
          if (window.__zcodeSkinSpinSync) window.__zcodeSkinSpinSync();
        }, ms);
      });
    }
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
