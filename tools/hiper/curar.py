#!/usr/bin/env python3
"""Curadoria de vídeos do app de hipertrofia. Regra dura: <=30s; canal oficial CrossFit é canônico quando existe."""
import json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent)); sys.path.insert(0, str(HERE))
from curate_videos import pick  # mesma regra (<=30s, CrossFit primeiro)
from catalogo import C
OUT = HERE / "videos.json"
data = json.loads(OUT.read_text()) if OUT.exists() else {}
only = sys.argv[1:]
for e in C:
    if only and e["name"] not in only: continue
    if not only and e["name"] in data and data[e["name"]].get("chosen"): continue
    chosen, cands, src = pick(e["en"])
    data[e["name"]] = {"search": e["en"], "source": src, "chosen": chosen, "candidates": cands}
    print(f"{e['name']}: " + (f"{chosen['seconds']}s {chosen['channel']} | {chosen['title'][:60]}" if chosen else "SEM VÍDEO"), flush=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2))
