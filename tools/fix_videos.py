#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Segunda passada da curadoria: termos melhores para casos problemáticos."""
import json
from pathlib import Path

from curate_videos import pick, OUT

RETRY = {
    "Supino Reto Barra": "barbell bench press",
    "Clean & Jerk": "power clean and jerk demo",
    "Terra Unilateral Halter": "dumbbell single leg rdl",
    "Elevação Pélvica": "glute bridge",
    "Remada Cavalinho": "t bar row demo",
    "Rosca Martelo": "dumbbell hammer curl demo",
    "Mesa Flexora": "lying leg curl",
    "Cal Bike": "echo bike",
    "Sprawl": "sprawl demo",
}

data = json.loads(OUT.read_text())
for name, term in RETRY.items():
    chosen, cands, source = pick(term)
    print(f"== {name} ({term!r}):")
    for c in cands:
        mark = "->" if chosen and c["id"] == chosen["id"] else "  "
        print(f"  {mark} {c['seconds']:>3}s  {c['channel']:<30} {c['title'][:60]}  [{c['id']}]")
    if chosen:
        data[name] = {"search": term, "source": source, "chosen": chosen, "candidates": cands}
    else:
        print("   (nada admissível — mantém como está)")

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2))
print("\nsalvo em", OUT)
