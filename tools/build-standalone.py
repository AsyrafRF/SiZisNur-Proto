#!/usr/bin/env python3
"""Build the self-contained SiZisNur V5 HTML file from local project assets."""
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'standalone' / 'SiZisNur_Prototype_V5_Standalone.html'

def data_uri(path: Path, mime: str) -> str:
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

css = (ROOT / 'css' / 'style.css').read_text(encoding='utf-8')
qr = (ROOT / 'js' / 'qrcode.js').read_text(encoding='utf-8')
app = (ROOT / 'js' / 'app.js').read_text(encoding='utf-8')
revision = (ROOT / 'js' / 'revision-v5.js').read_text(encoding='utf-8')
platform_admin = (ROOT / 'js' / 'platform-admin.js').read_text(encoding='utf-8')
public_portal = (ROOT / 'js' / 'public-portal.js').read_text(encoding='utf-8')
logo = data_uri(ROOT / 'assets' / 'sizisnur-logo-mark.png', 'image/png')
favicon = data_uri(ROOT / 'assets' / 'favicon.png', 'image/png')
app = app.replace('assets/sizisnur-logo-mark.png', logo)
revision = revision.replace('assets/sizisnur-logo-mark.png', logo)
platform_admin = platform_admin.replace('assets/sizisnur-logo-mark.png', logo)
if re.search(r'</script\s*>', qr + app + revision + platform_admin + public_portal, flags=re.I):
    raise SystemExit('Unsafe </script> sequence found in source; refusing to inline.')

html = f'''<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b7a4b">
  <meta name="description" content="SiZisNur membantu layanan mandiri Muzakki, penerimaan ZIS, verifikasi QR, rekonsiliasi dan distribusi untuk masjid dan komunitas. Prototype simulasi, bukan layanan produksi.">
  <title>SiZisNur — Platform Pengelolaan Zakat, Infak & Sedekah</title>
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
  <script>
{revision}
  </script>
  <script>
{platform_admin}
  </script>
  <script>
{public_portal}
  </script>
</body>
</html>
'''
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding='utf-8')
print(f'Built {OUT} ({OUT.stat().st_size:,} bytes)')
