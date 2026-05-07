#!/usr/bin/env python3
"""Convert Markdown files to styled HTML."""

import markdown
import os
import sys
from pathlib import Path

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    :root {{
      --bg: #0f1117;
      --surface: #1a1d26;
      --border: #2a2d3a;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --accent: #7dd3fc;
      --accent2: #86efac;
      --heading: #f8fafc;
      --code-bg: #12141c;
      --tag-bg: #1e3a5f;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.75;
      padding: 0 1rem 4rem;
    }}
    .page-header {{
      background: linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%);
      border-bottom: 1px solid var(--border);
      padding: 2.5rem 2rem 2rem;
      margin: 0 -1rem 2.5rem;
      text-align: center;
    }}
    .page-header .project-tag {{
      display: inline-block;
      background: var(--tag-bg);
      color: var(--accent);
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      border: 1px solid rgba(125,211,252,0.25);
      margin-bottom: 0.9rem;
    }}
    .page-header h1 {{
      font-size: 2rem;
      font-weight: 700;
      color: var(--heading);
      text-shadow: 0 0 40px rgba(125,211,252,0.2);
    }}
    .container {{
      max-width: 860px;
      margin: 0 auto;
    }}
    h1, h2, h3, h4, h5, h6 {{
      color: var(--heading);
      margin-top: 2rem;
      margin-bottom: 0.6rem;
      font-weight: 600;
      line-height: 1.35;
    }}
    h1 {{ font-size: 1.75rem; border-bottom: 2px solid var(--border); padding-bottom: 0.4rem; }}
    h2 {{ font-size: 1.35rem; border-left: 3px solid var(--accent); padding-left: 0.75rem; }}
    h3 {{ font-size: 1.1rem; color: var(--accent2); }}
    h4 {{ font-size: 1rem; color: var(--muted); }}
    p {{ margin: 0.6rem 0 0.9rem; }}
    a {{ color: var(--accent); text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
    strong {{ color: var(--heading); font-weight: 600; }}
    em {{ color: var(--accent2); font-style: normal; }}
    blockquote {{
      border-left: 3px solid var(--accent);
      padding: 0.5rem 1rem;
      background: var(--surface);
      border-radius: 0 6px 6px 0;
      margin: 1rem 0;
      color: var(--muted);
    }}
    code {{
      font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
      font-size: 0.87em;
      background: var(--code-bg);
      color: var(--accent2);
      padding: 0.15em 0.4em;
      border-radius: 4px;
      border: 1px solid var(--border);
    }}
    pre {{
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.2rem 1.4rem;
      overflow-x: auto;
      margin: 1rem 0 1.4rem;
    }}
    pre code {{
      background: none;
      border: none;
      padding: 0;
      font-size: 0.85rem;
      color: var(--text);
    }}
    ul, ol {{
      padding-left: 1.6rem;
      margin: 0.5rem 0 1rem;
    }}
    li {{ margin: 0.3rem 0; }}
    li > ul, li > ol {{ margin: 0.2rem 0; }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 1.2rem 0;
      font-size: 0.9rem;
    }}
    th {{
      background: var(--surface);
      color: var(--accent);
      font-weight: 600;
      padding: 0.6rem 0.9rem;
      text-align: left;
      border: 1px solid var(--border);
    }}
    td {{
      padding: 0.55rem 0.9rem;
      border: 1px solid var(--border);
      vertical-align: top;
    }}
    tr:nth-child(even) td {{ background: rgba(255,255,255,0.02); }}
    tr:hover td {{ background: rgba(125,211,252,0.04); }}
    hr {{
      border: none;
      border-top: 1px solid var(--border);
      margin: 2rem 0;
    }}
    .footer {{
      text-align: center;
      color: var(--muted);
      font-size: 0.78rem;
      margin-top: 4rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }}
  </style>
</head>
<body>
  <div class="page-header">
    <div class="project-tag">Glow Island · 发光岛</div>
    <h1>{title}</h1>
  </div>
  <div class="container">
{body}
    <div class="footer">Glow Island — Generated Documentation · {date}</div>
  </div>
</body>
</html>
"""

def convert_file(md_path: Path, out_path: Path):
    text = md_path.read_text(encoding="utf-8")

    # Extract title from first H1
    title = md_path.stem.replace("-", " ").replace("_", " ").title()
    for line in text.splitlines():
        if line.startswith("# "):
            title = line[2:].strip()
            break

    md = markdown.Markdown(extensions=["tables", "fenced_code", "toc", "nl2br"])
    body = md.convert(text)

    from datetime import date
    html = HTML_TEMPLATE.format(
        title=title,
        body=body,
        date=date.today().isoformat(),
    )
    out_path.write_text(html, encoding="utf-8")
    print(f"  ✓  {md_path.name}  →  {out_path.name}")


def main():
    base = Path(__file__).parent.parent / ".allforai" / "game-design"
    md_files = sorted(base.glob("*.md"))
    if not md_files:
        print("No .md files found in", base)
        sys.exit(1)

    print(f"Converting {len(md_files)} files in {base}\n")
    for md_path in md_files:
        out_path = md_path.with_suffix(".html")
        convert_file(md_path, out_path)

    print(f"\nDone. HTML files written to:\n  {base}")


if __name__ == "__main__":
    main()
