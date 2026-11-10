#!/usr/bin/env python3
"""Gera hipertrofia/data/programa.json — 3 ciclos de 5 semanas a partir de ter 10/11/2026.

Semana-tipo (segunda = descanso):
  ter Inferiores A · qua Superiores A · qui Aeróbico Z2 · sex Inferiores B
  sáb Superiores B + escada Z2 · dom Intervalado
Ciclo: sem 1 (no ciclo 1 = calibração) · sem 2-4 progressão · sem 5 leve.
Estrutura de cada sessão de musculação: Bloco A força (séries normais) → Bloco B bi-sets → Bloco C tri-set.
"""
import json, datetime as dt
from pathlib import Path
from catalogo import BY
import json as _j

HERE = Path(__file__).resolve().parent
VIDEOS = _j.loads((HERE / "videos.json").read_text())
OUT = HERE.parent.parent / "hipertrofia" / "data" / "programa.json"
START = dt.date(2026, 11, 10)  # terça
FCMAX = 176
Z = {"z1": [88, 105], "z2": [106, 123], "z3": [124, 140], "z4": [141, 158], "z5": [159, 176]}

def ex(name, sets, reps, rir, unit="reps"):
    c = BY[name]
    v = (VIDEOS.get(name) or {}).get("chosen")
    return {"name": name, "sets": sets, "reps": reps, "unit": unit, "rir": rir,
            "equip": c["equip"], "inc": c["inc"], "main": c["main"], "grupo": c["grupo"],
            "video": {"id": v["id"], "title": v["title"], "channel": v["channel"], "seconds": v["seconds"]} if v else None}

def A(e, rest): return {"kind": "straight", "rest_sec": rest, "items": [e]}
def B(e1, e2, rest, rounds=3): return {"kind": "biset", "rounds": rounds, "rest_sec": rest, "items": [e1, e2]}
def C(e1, e2, e3, rest=30, rounds=3): return {"kind": "triset", "rounds": rounds, "rest_sec": rest, "items": [e1, e2, e3]}

# ---------- variações por ciclo (o bloco A muda pouco para a progressão ter continuidade)
def inf_a(c):
    a1 = ["Agachamento Livre", "Agachamento Livre", "Agachamento Hack"][c]
    a2 = ["Leg Press 45", "Leg Press 45", "Leg Press 45"][c]
    b1 = [("Agachamento Búlgaro", "Cadeira Extensora"), ("Afundo Halteres", "Cadeira Extensora"), ("Step Up Halteres", "Cadeira Extensora")][c]
    b2 = [("Stiff Halteres", "Panturrilha em Pé"), ("Cadeira Flexora", "Panturrilha em Pé"), ("Stiff Halteres", "Panturrilha em Pé")][c]
    t = [("Goblet Squat", "Abdominal na Polia", "Prancha"), ("Goblet Squat", "Pallof Press", "Prancha"), ("Goblet Squat", "Abdominal na Polia", "Prancha Lateral")][c]
    return "Inferiores A", "Quadríceps", [
        A(ex(a1, 4, [6, 8], "1–3"), 150),
        A(ex(a2, 3, [8, 10], "1–2"), 120),
        B(ex(b1[0], 3, [10, 12], "1–2"), ex(b1[1], 3, [12, 15], "1–2"), 60),
        B(ex(b2[0], 3, [10, 12], "1–2"), ex(b2[1], 3, [12, 15], "1–2"), 45),
        C(ex(t[0], 3, [12, 15], "0–1"), ex(t[1], 3, [12, 15], "0–1"),
          ex(t[2], 3, [30, 45], "0–1", "s"), 30),
    ]

def sup_a(c):
    a1 = ["Supino Reto Barra", "Supino Reto Barra", "Supino Inclinado Barra"][c]
    a2 = ["Desenvolvimento Halteres", "Desenvolvimento Máquina", "Desenvolvimento Halteres"][c]
    b1 = [("Supino Inclinado Halteres", "Crossover Polia"), ("Supino Inclinado Halteres", "Crucifixo Máquina"), ("Supino Halteres", "Crossover Polia")][c]
    b2 = [("Elevação Lateral", "Tríceps Corda"), ("Elevação Lateral Polia", "Tríceps Testa"), ("Elevação Lateral", "Tríceps Corda")][c]
    t = [("Paralelas", "Face Pull", "Elevação de Pernas na Barra"), ("Flexão", "Face Pull", "Abdominal na Polia"), ("Paralelas", "Crucifixo Inverso", "Elevação de Pernas na Barra")][c]
    return "Superiores A", "Peito, ombro e tríceps", [
        A(ex(a1, 4, [6, 8], "1–3"), 150),
        A(ex(a2, 3, [8, 10], "1–2"), 120),
        B(ex(b1[0], 3, [10, 12], "1–2"), ex(b1[1], 3, [12, 15], "1–2"), 60),
        B(ex(b2[0], 3, [12, 15], "1–2"), ex(b2[1], 3, [12, 15], "1–2"), 45),
        C(ex(t[0], 3, [8, 12], "0–1"), ex(t[1], 3, [15, 20], "0–1"), ex(t[2], 3, [10, 15], "0–1"), 30),
    ]

def inf_b(c):
    a1 = ["Levantamento Terra", "Stiff Barra", "Levantamento Terra"][c]
    a2 = ["Hip Thrust", "Hip Thrust", "Hip Thrust"][c]
    b1 = [("Mesa Flexora", "Afundo Halteres"), ("Mesa Flexora", "Agachamento Búlgaro"), ("Cadeira Flexora", "Afundo Halteres")][c]
    b2 = [("Cadeira Abdutora", "Panturrilha Sentado")] * 3
    t = [("Kettlebell Swing", "Extensão Lombar", "Prancha Lateral"), ("Kettlebell Swing", "Extensão Lombar", "Prancha"), ("Kettlebell Swing", "Extensão Lombar", "Pallof Press")][c]
    return "Inferiores B", "Posterior de coxa e glúteo", [
        A(ex(a1, 4, [5, 7] if a1 == "Levantamento Terra" else [6, 8], "2–3"), 150),
        A(ex(a2, 3, [8, 10], "1–2"), 120),
        B(ex(b1[0], 3, [10, 12], "1–2"), ex(b1[1], 3, [10, 12], "1–2"), 60),
        B(ex(b2[0][0], 3, [15, 20], "1–2"), ex(b2[c][1], 3, [12, 15], "1–2"), 45),
        C(ex(t[0], 3, [15, 20], "0–1"), ex(t[1], 3, [12, 15], "0–1"),
          ex(t[2], 3, [30, 40] if t[2] != "Pallof Press" else [10, 12], "0–1", "s" if t[2] != "Pallof Press" else "reps"), 30),
    ]

def sup_b(c):
    a1 = ["Remada Curvada", "Remada Cavalinho", "Remada Curvada"][c]
    a2 = ["Pulldown Polia", "Barra Fixa", "Pulldown Polia"][c]
    b1 = [("Remada Baixa", "Pullover Polia"), ("Remada Unilateral", "Pullover Polia"), ("Remada Baixa", "Pullover Polia")][c]
    b2 = [("Rosca Direta", "Crucifixo Inverso"), ("Rosca Alternada", "Face Pull"), ("Rosca Polia", "Crucifixo Inverso")][c]
    t = [("Rosca Martelo", "Tríceps Francês Halter", "Face Pull"), ("Rosca Martelo", "Tríceps Francês Halter", "Elevação de Pernas na Barra"), ("Rosca Martelo", "Tríceps Francês Halter", "Face Pull")][c]
    return "Superiores B", "Costas e bíceps", [
        A(ex(a1, 4, [6, 8], "1–3"), 150),
        A(ex(a2, 3, [6, 10] if a2 == "Barra Fixa" else [8, 10], "1–2"), 120),
        B(ex(b1[0], 3, [10, 12], "1–2"), ex(b1[1], 3, [12, 15], "1–2"), 60),
        B(ex(b2[0], 3, [10, 12], "1–2"), ex(b2[1], 3, [12, 15], "1–2"), 45),
        C(ex(t[0], 3, [10, 12], "0–1"), ex(t[1], 3, [12, 15], "0–1"), ex(t[2], 3, [12, 20], "0–1"), 30),
    ]

def deload(blocks):
    out = []
    for b in blocks:
        b = json.loads(json.dumps(b))
        if b["kind"] == "straight":
            for e in b["items"]: e["sets"] = max(2, e["sets"] - 2); e["rir"] = "3–4"
        else:
            b["rounds"] = 2
            for e in b["items"]: e["sets"] = 2; e["rir"] = "3–4"
        out.append(b)
    return out

ROW, STAIR = ex("Remo Ergômetro", 1, [0, 0], "-", "min"), ex("Escada (Stair Climber)", 1, [0, 0], "-", "min")
def seg(machine, minutes, zone, label): return {"machine": machine["name"], "video": machine["video"], "equip": machine["equip"], "min": minutes, "zone": zone, "bpm": Z[zone], "label": label}

def cardio_z2(wk):
    m = {1: 15, 2: 16, 3: 18, 4: 18, 5: 12}[wk]
    return "Aeróbico contínuo", "Zona 2 · remo + escada", {"kind": "continuous", "segments": [
        seg(ROW, 5, "z1", "Aquecimento"), seg(ROW, m, "z2", "Contínuo"), seg(STAIR, m, "z2", "Contínuo"), seg(ROW, 3, "z1", "Volta à calma")]}

def cardio_int(wk):
    n, off = {1: (8, 120), 2: (9, 90), 3: (10, 90), 4: (10, 90), 5: (6, 120)}[wk]
    return "Intervalado", f"{n} tiros · escada e remo alternados", {"kind": "intervals",
        "warmup": seg(ROW, 8, "z1", "Aquecimento progressivo"),
        "rounds": n, "on_sec": 60, "off_sec": off, "on_zone": "z4", "on_bpm": [145, 160], "off_bpm_max": 120,
        "machines": [STAIR["name"], ROW["name"]], "machine_info": {STAIR["name"]: {"video": STAIR["video"], "equip": STAIR["equip"]}, ROW["name"]: {"video": ROW["video"], "equip": ROW["equip"]}},
        "cooldown": seg(ROW, 5, "z1", "Volta à calma")}

def finisher(wk):
    return seg(STAIR, 15 if wk in (1, 5) else 20, "z2", "Escada pós-treino")

sessions = []
seq = 0
for w in range(15):
    cyc, wk = w // 5, w % 5 + 1
    phase = "calibracao" if (cyc == 0 and wk == 1) else ("leve" if wk == 5 else "progressao")
    tue = START + dt.timedelta(days=7 * w)
    plan = [("strength", inf_a), ("strength", sup_a), ("cardio", cardio_z2), ("strength", inf_b), ("strength", sup_b), ("cardio", cardio_int)]
    for d, (kind, fn) in enumerate(plan):
        seq += 1
        date = tue + dt.timedelta(days=d)
        s = {"seq": seq, "planned": date.isoformat(), "cycle": cyc + 1, "week": w + 1, "cycle_week": wk, "phase": phase, "kind": kind}
        if kind == "strength":
            title, focus, blocks = fn(cyc)
            if phase == "leve": blocks = deload(blocks)
            s.update(id=f"S{seq:03d}", title=title, focus=focus, blocks=blocks,
                     warmup="5 min de remo em zona 1 + 2 séries leves (50% e 75%) do primeiro exercício.")
            if fn is sup_b: s["finisher"] = finisher(wk)
        else:
            title, focus, plan_c = fn(wk)
            s.update(id=f"S{seq:03d}", title=title, focus=focus, cardio=plan_c)
        sessions.append(s)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"version": dt.date.today().isoformat(), "start": START.isoformat(), "rest_weekday": 1,
    "fcmax": FCMAX, "zones": Z, "sessions": sessions}, ensure_ascii=False, indent=1))
print(len(sessions), "sessões ->", OUT, sessions[-1]["planned"])
