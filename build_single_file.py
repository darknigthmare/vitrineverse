#!/usr/bin/env python3
"""Construit VITRINEVERSE_PLAY.html sans dépendance externe."""
from __future__ import annotations

import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")
data_js = (ROOT / "js" / "game-data.js").read_text(encoding="utf-8")
app_js = (ROOT / "js" / "app.js").read_text(encoding="utf-8")

for image_path in sorted((ROOT / "assets" / "items").glob("*.svg")):
    encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
    data_uri = f"data:image/svg+xml;base64,{encoded}"
    data_js = data_js.replace(f"assets/items/{image_path.name}", data_uri)

html = html.replace('<link rel="stylesheet" href="styles.css" />', f"<style>\n{css}\n</style>")
html = html.replace('<script src="js/game-data.js"></script>', f"<script>\n{data_js}\n</script>")
html = html.replace('<script src="js/app.js"></script>', f"<script>\n{app_js}\n</script>")

output = ROOT / "VITRINEVERSE_PLAY.html"
output.write_text(html, encoding="utf-8")
print(f"Construit : {output} ({output.stat().st_size:,} octets)")
