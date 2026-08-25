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
    spinnerColor: "",
    spinnerGif: "",
    spinnerGifScale: 100,
    spinnerGifRatio: 1,
    spinnerGifRatio: 1,
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

    // 会话/任务「处理中」旋转图标：ZCode 用 .animate-spin + currentColor（lucide 圆弧 SVG）。
    // 换色：直接改 color；换 GIF：隐藏 svg 旋转圈，用 background-image 盖一个同尺寸 GIF。
    // GIF 尺寸策略：元素盒按「宽 spinnerGifScale% × 高 宽/ratio」显式撑开，
    // 图片用 100%/100% 填满盒子 → 非正方形（如长条）原图也能完整显示不裁剪。
    var spinCss = [];
    if (c.spinnerColor) {
      spinCss.push(".animate-spin{color:" + c.spinnerColor + " !important}");
    }
    if (c.spinnerGif) {
      var scale = Math.max(50, Math.min(300, Number(c.spinnerGifScale) || 100)) / 100;
      var ratio = Number(c.spinnerGifRatio) || 1;
      if (ratio < 0.2) ratio = 0.2;
      if (ratio > 5) ratio = 5;
      spinCss.push(
        ".animate-spin{animation:none !important;border-radius:0 !important;border:0 !important;" +
        "width:" + Math.round(scale * 16) + "px !important;height:" + Math.round(scale * 16 / ratio) + "px !important;" +
        "background:center / 100% 100% no-repeat url(\"" + toFileUrl(c.spinnerGif).replace(/"/g, "%22") + "\") !important;" +
        "transform:none !important}" +
        ".animate-spin>*,.animate-spin svg{display:none !important}"
      );
    }
    if (spinCss.length) css += spinCss.join("");
    st.textContent = css;
  }

  function applyImgs(c) {
    var g = document.getElementById(IMG_ID);
    if (g) g.remove();
    var v = document.getElementById(SIDE_IMG_ID);
    if (v) v.remove();
    wallpaperVideo = null;
    if (!c.enabled) return;
    if (c.wallpaper) {
      var media = mkMedia(IMG_ID, c.wallpaper, "100vw", "100vh", c);
      if (c.blurWallpaper > 0) media.style.filter = "blur(" + c.blurWallpaper + "px)";
      document.body.appendChild(media);
      if (media.tagName === "VIDEO") {
        wallpaperVideo = media;
        applyVideoControl(c);
      }
    }
    if (c.sidebar) {
      document.body.appendChild(mkMedia(SIDE_IMG_ID, c.sidebar, c.sidebarWidth + "px", "100vh", c));
    }
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

  function applyEffect(c) {
    var old = document.getElementById(FX_ID);
    if (old) old.remove();
    if (fxTimer) { clearInterval(fxTimer); fxTimer = null; }
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

  function textField(label, val, onChange, placeholder, browse) {
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
      b.title = "选择文件";
      b.onclick = function () {
        if (window.zcode && typeof window.zcode.selectFile === "function") {
          Promise.resolve(window.zcode.selectFile()).then(function (path) {
            if (path) {
              input.value = path;
              onChange(path);
            }
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

    // 视频控制（仅视频壁纸时显示）
    if (isVideoSrc(c.wallpaper)) {
      panel.appendChild(row("视频速度", slider(c.videoSpeed, function (v) {
        c.videoSpeed = v;
        save(c);
        applyVideoControl(c);
      }, 0.25, 2, 0.25, function (v) { return v + "x"; })));
      var pauseRow = row("暂停视频", (function () {
        var btn = mkBtn(c.videoPaused ? "▶ 播放" : "⏸ 暂停");
        btn.onclick = function () {
          c.videoPaused = !c.videoPaused;
          btn.textContent = c.videoPaused ? "▶ 播放" : "⏸ 暂停";
          save(c);
          applyVideoControl(c);
        };
        return btn;
      })());
      panel.appendChild(pauseRow);
    }

    // 处理中图标（旋转齿轮/圆圈）定制
    var spinSub = el("div", "margin:10px 0 6px;color:#999;font-size:11px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px", "处理中图标（加载圈）");
    panel.appendChild(spinSub);
    panel.appendChild(textField("图标颜色（如 #ff5c5c，留空=默认）", c.spinnerColor, function (v) {
      c.spinnerColor = v;
      refreshAll(c);
    }, "#38bdf8 / red / rgba(56,189,248,.9)", false));
    panel.appendChild(textField("替换为 GIF（留空=用原生圆圈）", c.spinnerGif, function (v) {
      var changed = v !== c.spinnerGif;
      c.spinnerGif = v;
      refreshAll(c);
      if (changed) buildPanel(panel, c);
    }, "点击右侧「浏览」选择 GIF 图片", true));
    if (c.spinnerGif) {
      // 读取图片真实宽高比，让非正方形（长条等）GIF 能按原比例完整显示
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
      panel.appendChild(row("宽度", slider(c.spinnerGifScale, function (v) {
        c.spinnerGifScale = v;
        save(c);
        applyCss(c);
      }, 50, 300, 5, function (v) { return v + "%"; })));
      panel.appendChild(row("高度", slider(c.spinnerGifRatio ? Math.round(100 / c.spinnerGifRatio) : 100, function (v) {
        // 高度滑杆存的是相对宽度的百分比（50-300），换算成宽高比
        c.spinnerGifRatio = 100 / Math.max(20, v);
        save(c);
        applyCss(c);
      }, 25, 300, 5, function (v) { return v + "%"; })));
    }
    // 预览当前效果（用独立类名，不挂 .animate-spin：
    // 否则全局 GIF 替换样式会把预览元素本身也替换，出现「两个 GIF」）
    var spinPreviewWrap = el("div", "display:flex;align-items:center;gap:12px;margin:2px 0 8px");
    spinPreviewWrap.appendChild(el("span", "color:#bbb;font-size:11px;flex:0 0 auto", "预览："));
    var pv1 = document.createElement("span");
    pv1.className = "zcode-skin-pv-ring";
    pv1.style.cssText = "display:inline-block;width:16px;height:16px;border-radius:9999px;border:2px solid currentColor;border-top-color:transparent";
    var pv2 = document.createElement("span");
    pv2.className = "zcode-skin-pv-dot";
    pv2.style.cssText = "display:inline-block;width:14px;height:14px;color:#ccc";
    spinPreviewWrap.appendChild(pv1);
    spinPreviewWrap.appendChild(pv2);
    spinPreviewWrap.appendChild(el("span", "color:#888;font-size:11px", "(与侧栏实际效果同步)"));
    panel.appendChild(spinPreviewWrap);

    // 分区透明度
    var o = c.opacities || {};
    var sub = el("div", "margin:10px 0 6px;color:#999;font-size:11px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px", "分区透明度");
    panel.appendChild(sub);
    var hintEl = el("div", "display:none;margin:-2px 0 8px;color:#e8a13a;font-size:11px;line-height:1.5");
    panel.appendChild(hintEl);
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
            hintEl.textContent = "⚠ 当前界面上没有找到「" + (LABELS[key] || key) + "」对应的可见区域——它所在的窗口/面板可能没打开（如菜单、悬浮提示、终端）。打开后悬停本滑杆即可看到红框。";
            hintEl.style.display = "block";
          } else {
            hintEl.style.display = "none";
          }
        });
        r.addEventListener("mouseleave", function () { hintEl.style.display = "none"; });
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
