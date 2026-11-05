#!/usr/bin/env python3
"""Build the self-contained SiZisNur V3 HTML file from local project assets."""
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'standalone' / 'SiZisNur_Prototype_v3_Standalone.html'

def data_uri(path: Path, mime: str) -> str:
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

css = (ROOT / 'css' / 'style.css').read_text(encoding='utf-8')
qr = (ROOT / 'js' / 'qrcode.js').read_text(encoding='utf-8')
app = (ROOT / 'js' / 'app.js').read_text(encoding='utf-8')
logo = data_uri(ROOT / 'assets' / 'sizisnur-logo-mark.png', 'image/png')
favicon = data_uri(ROOT / 'assets' / 'favicon.png', 'image/png')
app = app.replace('assets/sizisnur-logo-mark.png', logo)
if re.search(r'</script\s*>', qr + app, flags=re.I):
    raise SystemExit('Unsafe </script> sequence found in source; refusing to inline.')

html = f'''<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b7a4b">
  <meta name="description" content="SiZisNur V3 adalah prototype pengelolaan zakat, infak, dan sedekah berbasis workbook 1447H/2026M. Simulasi, bukan layanan produksi.">
  <title>SiZisNur V3 — Platform Pengelolaan Zakat, Infak &amp; Sedekah</title>
  <link rel="icon" href="{favicon}" type="image/png">
  <style>
{css}
  </style>
</head>
<body>
  <div id="app"></div>
  <div id="toast-host" aria-live="polite"></div>
  <script>
{qr}
  </script>
  <script>
{app}
  </script>
</body>
</html>
'''
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding='utf-8')
print(f'Built {OUT} ({OUT.stat().st_size:,} bytes)')
