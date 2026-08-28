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

  var PRESETS = {
    "默认": null,
    "暗夜玻璃": {
      tint: "20,20,26",
      blurPanel: 20,
      opacities: { backgroundWinAlt: 0.3, background: 0.4, backgroundAlt: 0.4, surface: 0.4, surfaceHover: 0.45, sidebar: 0.45, header: 0.45, panel: 0.5, card: 0.55, input: 0.6, tooltip: 0.9, menu: 0.9, terminal: 0.88, border: 0.1 }
    },
    "极简透明": {
      tint: "10,10,10",
      blurPanel: 8,
      opacities: { backgroundWinAlt: 0.22, background: 0.3, backgroundAlt: 0.3, surface: 0.3, surfaceHover: 0.35, sidebar: 0.35, header: 0.35, panel: 0.4, card: 0.45, input: 0.5, tooltip: 0.85, menu: 0.85, terminal: 0.85, border: 0.08 }
    },
    "暖色护眼": {
      tint: "40,32,24",
      blurPanel: 4,
      opacities: { backgroundWinAlt: 0.5, background: 0.55, backgroundAlt: 0.55, surface: 0.55, surfaceHover: 0.6, sidebar: 0.6, header: 0.55, panel: 0.6, card: 0.65, input: 0.7, tooltip: 0.9, menu: 0.9, terminal: 0.9, border: 0.15 }
    },
    "高对比": {
      tint: "0,0,0",
      blurPanel: 0,
      opacities: { backgroundWinAlt: 0.4, background: 0.5, backgroundAlt: 0.5, surface: 0.5, surfaceHover: 0.55, sidebar: 0.6, header: 0.55, panel: 0.65, card: 0.7, input: 0.75, tooltip: 0.98, menu: 0.98, terminal: 0.95, border: 0.2 }
    }
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
      statusCss.push(
        "@keyframes zc-fail-pulse{0%{box-shadow:0 0 0 0 rgba(255,80,80,.9)}100%{box-shadow:0 0 0 7px rgba(255,80,80,0)}}" +
        "[data-error-indicator]{animation:zc-fail-pulse 1.4s ease-out infinite !important}"
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
    // v1.8.5 从「黑名单排除」改为「白名单精确匹配」——ZCode 3.10.1 共 149 处 animate-spin，
    // 其中 97+ 处是按钮/表单 loading（发送/刷新/保存等临时操作反馈），黑名单方案会把这些
    // 全部误替换成 GIF（"覆盖过头"）。真正该替换的「任务运行态」只有两类：
    //   ① AI 生成回答时的运行指示（data-zcode-chat-loading-animate，hQe 组件）
    //   ② 任务/会话条目的「正在处理」状态图标（.transition-opacity 图标槽位，t/sgt 组件）
    window.__zcodeSkinSpinSync = function () {
      var enabled = !!c.enabled && !!c.spinnerGif;
      var spins = document.querySelectorAll("svg.animate-spin");
      for (var i = 0; i < spins.length; i++) {
        var svg = spins[i];
        // 白名单：只替换这两类任务运行态，其余（按钮/表单 loading）一律保持原生转圈
        var included = svg.closest('[data-zcode-chat-loading-animate], .transition-opacity');
        if (!enabled || !included) {
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
  }

  function buildPanel(panel, c) {
    panel.innerHTML = "";

    var head = el("div", "display:flex;justify-content:space-between;align-items:center;margin-bottom:12px");
    head.appendChild(el("div", "font-weight:600;font-size:14px;color:#fff", "🎨 皮肤设置"));
    var close = mkBtn("✕", "关闭");
    close.onclick = function () { panel.style.display = "none"; };
    head.appendChild(close);
    panel.appendChild(head);

    // 预设主题
    panel.appendChild(selectField("预设主题", "默认", PRESETS, function (v) {
      if (v === "默认") {
        var d = load();
        for (var kk in c) delete c[kk];
        for (var k2 in d) c[k2] = d[k2];
      } else {
        var pre = PRESETS[v];
        c.tint = pre.tint;
        c.blurPanel = pre.blurPanel;
        for (var pk in pre.opacities) c.opacities[pk] = pre.opacities[pk];
      }
      refreshAll(c);
      buildPanel(panel, c);
    }));

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
    adLink.href = "https://sharellm.net/dashboard/shared";
    adLink.target = "_blank";
    adLink.rel = "noopener";
    adLink.onclick = function (e) {
      e.preventDefault();
      var url = "https://sharellm.net/dashboard/shared";
      if (window.zcode && typeof window.zcode.openExternal === "function") {
        window.zcode.openExternal(url);
      } else {
        window.open(url, "_blank");
      }
    };
    adWrap.appendChild(adLink);
    panel.appendChild(adWrap);
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
      if (panel.style.display === "block" && !panel.contains(e.target) && e.target !== btn) {
        panel.style.display = "none";
      }
    });
  }

  function boot() {
    applyImgs(cfg);
    applyEffect(cfg);
    initUI(cfg);
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
