#!/usr/bin/env python3
"""把 ui_skin.js 注入到解包后的 index.html（在 </body> 前插入 <script>）。"""
import sys
from pathlib import Path

def main() -> None:
    if len(sys.argv) != 3:
        print("[ERROR] 用法: python inject.py <index.html路径> <ui_skin.js路径>")
        sys.exit(1)
    html_path = Path(sys.argv[1])
    js_path = Path(sys.argv[2])
    if not html_path.exists():
        print(f"[ERROR] index.html 不存在: {html_path}")
        sys.exit(1)
    if not js_path.exists():
        print(f"[ERROR] ui_skin.js 不存在: {js_path}")
        sys.exit(1)

    html = html_path.read_text(encoding="utf-8")
    js = js_path.read_text(encoding="utf-8")

    marker = '<script id="zcode-skin-ui">'
    if marker in html:
        print("[!] 检测到已有注入，跳过（先 unpatch 再 patch）")
        sys.exit(2)

    if "</body>" not in html:
        print("[ERROR] index.html 未找到 </body>，放弃")
        sys.exit(1)

    tag = marker + "\n" + js + "\n</script>"
    html = html.replace("</body>", tag + "\n</body>", 1)
    html_path.write_text(html, encoding="utf-8")
    print("[✓] 注入完成")

if __name__ == "__main__":
    main()
