#!/usr/bin/env python3
"""Gera hipertrofia/data/programa.json — 3 ciclos de 5 semanas a partir de ter 10/11/2026.

v2 (14/11/2026, após avaliação postural): prioridade costas/postura/peito alto, puxar ≈ 2× empurrar,
core diário, pernas em 1 dia cheio + compostos no sábado. S001–S003 (já feitas) ficam congeladas.
Semana-tipo: seg descanso · ter Costas e postura · qua Pernas + abdome · qui Aeróbico Z2
             sex Peito alto e ombros · sáb Tronco unilateral + pernas (+ escada) · dom Intervalado
Ciclo: sem 2-4 progressão · sem 5 leve. Blocos: A força → B bi-sets → C tri-set. Aquecimento postural em todo treino.
"""
import json, datetime as dt
from pathlib import Path
from catalogo import BY
from dicas import D as DICAS, label as load_label, hint as load_hint
import json as _j

HERE = Path(__file__).resolve().parent
VIDEOS = _j.loads((HERE / "videos.json").read_text())
OUT = HERE.parent.parent / "hipertrofia" / "data" / "programa.json"
START = dt.date(2026, 11, 10)  # terça
FCMAX = 176
Z = {"z1": [88, 105], "z2": [106, 123], "z3": [124, 140], "z4": [141, 158], "z5": [159, 176]}

def ex(name, sets, reps, rir, unit="reps", uni=False):
    c = BY[name]
    v = (VIDEOS.get(name) or {}).get("chosen")
    return {"name": name, "sets": sets, "reps": reps, "unit": unit, "rir": rir,
            "equip": c["equip"], "inc": c["inc"], "main": c["main"], "grupo": c["grupo"],
            "video": {"id": v["id"], "title": v["title"], "channel": v["channel"], "seconds": v["seconds"]} if v else None,
            "uni": uni, **load_info(name)}

# roleta: passo e faixa por tipo de carga
WHEEL = {"barra": (2.5, 0, 300), "halter": (1, 0, 60), "maquina": (2.5, 0, 300), "anilhas": (5, 0, 600),
         "kb": (2, 0, 48), "corpo": (2.5, 0, 60), "tempo": (0, 0, 0)}

def load_info(name):
    d = DICAS.get(name)
    if not d:
        return {}
    step, lo, hi = WHEEL[d["carga"]]
    return {"load": d["carga"], "load_label": load_label(d["carga"]), "load_hint": load_hint(d["carga"]),
            "wheel": {"step": step, "min": lo, "max": hi}, "tips": {"ok": d["ok"], "erros": d["erros"]}}

def A(e, rest): return {"kind": "straight", "rest_sec": rest, "items": [e]}
def B(e1, e2, rest, rounds=3): return {"kind": "biset", "rounds": rounds, "rest_sec": rest, "items": [e1, e2]}
def C(e1, e2, e3, rest=30, rounds=3): return {"kind": "triset", "rounds": rounds, "rest_sec": rest, "items": [e1, e2, e3]}


# ---------- v2 (14/11/2026): prioridade costas/postura/peito alto; puxar ≈ 2× empurrar; core diário
POSTURA = [("Recolher o Queixo", "2 × 10 (segure 3 s)"), ("Deslizamento na Parede", "2 × 10"),
           ("Abertura com Elástico", "2 × 15"), ("Alongamento do Peitoral na Porta", "2 × 30 s cada lado"),
           ("Extensão Torácica no Rolo", "6–8 extensões, 2 posições")]
def drills():
    out = []
    for n, presc in POSTURA:
        v = (VIDEOS.get(n) or {}).get("chosen")
        out.append({"name": n, "presc": presc, "equip": BY[n]["equip"],
                    "video": {"id": v["id"], "title": v["title"], "channel": v["channel"], "seconds": v["seconds"]} if v else None})
    return out

def costas(c):
    a1 = ["Remada Curvada", "Remada Curvada", "Remada Cavalinho"][c]
    a2 = ex("Pulldown Polia", 3, [8, 10], "1–2") if c != 1 else ex("Barra Fixa", 3, [6, 10], "1–2")
    return "Costas e postura", "Dorsal, trapézio médio/inferior, ombro posterior, core", [
        A(ex(a1, 4, [6, 8], "1–3"), 150),
        A(a2, 120),
        B(ex("Remada Apoiada", 3, [10, 12], "1–2"), ex("Face Pull", 3, [15, 20], "1–2"), 60),
        B(ex("Crucifixo Inverso", 3, [12, 15], "1–2"), ex("Elevação em Y", 3, [10, 12], "1–2"), 45),
        C(ex("Dead Bug", 3, [8, 10], "0–1", uni=True), ex("Pallof Press", 3, [10, 12], "0–1", uni=True),
          ex("Caminhada com Carga Unilateral", 3, [30, 40], "0–1", "s", uni=True), 30),
    ]

def pernas(c):
    a1 = ["Agachamento Livre", "Agachamento Livre", "Agachamento Hack"][c]
    a2 = ["Stiff Barra", "Stiff Barra", "Levantamento Terra"][c]
    b1 = [("Agachamento Búlgaro", "Mesa Flexora"), ("Afundo Halteres", "Mesa Flexora"), ("Agachamento Búlgaro", "Cadeira Flexora")][c]
    return "Pernas + abdome", "Quadríceps, posterior, glúteo, core", [
        A(ex(a1, 4, [6, 8], "1–3"), 150),
        A(ex(a2, 3, [6, 8] if a2 != "Levantamento Terra" else [5, 7], "2–3"), 120),
        B(ex(b1[0], 3, [10, 12], "1–2", uni=True), ex(b1[1], 3, [10, 12], "1–2"), 60),
        B(ex("Cadeira Extensora", 3, [12, 15], "1–2"), ex("Panturrilha em Pé", 3, [12, 15], "1–2"), 45),
        C(ex("Prancha", 3, [30, 45], "0–1", "s"), ex("Abdominal na Polia", 3, [12, 15], "0–1"),
          ex("Elevação de Pernas na Barra", 3, [10, 15], "0–1"), 30),
    ]

def peito_ombro(c):
    a2 = ["Desenvolvimento Halteres", "Desenvolvimento Máquina", "Desenvolvimento Halteres"][c]
    lat = ["Elevação Lateral", "Elevação Lateral Polia", "Elevação Lateral"][c]
    return "Peito alto e ombros", "Peitoral superior, deltoides, tríceps, core", [
        A(ex("Supino Inclinado Barra", 4, [6, 8], "1–3"), 150),
        A(ex(a2, 3, [8, 10], "1–2"), 120),
        B(ex("Supino Inclinado Halteres", 3, [10, 12], "1–2"), ex("Crossover Baixo-Alto", 3, [12, 15], "1–2"), 60),
        B(ex(lat, 3, [12, 15], "1–2"), ex("Face Pull", 3, [15, 20], "1–2"), 45),
        C(ex("Tríceps Corda", 3, [12, 15], "0–1"), ex("Flexão", 3, [8, 12], "0–1"), ex("Tríceps Francês Halter", 3, [10, 12], "0–1"), 30),
    ]

def tronco_uni(c):
    rosca = ["Rosca Martelo", "Rosca Alternada", "Rosca Martelo"][c]
    return "Tronco unilateral + pernas", "Simetria dos ombros (esquerdo primeiro), glúteo, core", [
        A(ex("Puxada Unilateral", 3, [8, 10], "1–2", uni=True), 90),
        A(ex("Remada Unilateral", 3, [8, 10], "1–2", uni=True), 90),
        B(ex("Landmine Press Unilateral", 3, [8, 10], "1–2", uni=True), ex("Elevação em Y", 3, [10, 12], "1–2"), 60),
        B(ex("Hip Thrust", 3, [8, 10], "1–2"), ex("Goblet Squat", 3, [10, 12], "1–2"), 60),
        C(ex("Caminhada com Carga Unilateral", 3, [30, 40], "0–1", "s", uni=True), ex("Prancha Lateral", 3, [30, 40], "0–1", "s"),
          ex(rosca, 3, [10, 12], "0–1"), 30),
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
    r, e = {1: (20, 10), 2: (20, 12), 3: (22, 14), 4: (22, 14), 5: (15, 8)}[wk]
    return "Aeróbico contínuo", "Zona 2 · remo (postura) + escada", {"kind": "continuous", "segments": [
        seg(ROW, 5, "z1", "Aquecimento"), seg(ROW, r, "z2", "Contínuo (remo: puxe com as costas, peito aberto)"), seg(STAIR, e, "z2", "Contínuo"), seg(ROW, 3, "z1", "Volta à calma")]}

def cardio_int(wk):
    n, off = {1: (8, 120), 2: (9, 90), 3: (10, 90), 4: (10, 90), 5: (6, 120)}[wk]
    return "Intervalado", f"{n} tiros · escada e remo alternados", {"kind": "intervals",
        "warmup": seg(ROW, 8, "z1", "Aquecimento progressivo"),
        "rounds": n, "on_sec": 60, "off_sec": off, "on_zone": "z4", "on_bpm": [145, 160], "off_bpm_max": 120,
        "machines": [STAIR["name"], ROW["name"]], "machine_info": {STAIR["name"]: {"video": STAIR["video"], "equip": STAIR["equip"]}, ROW["name"]: {"video": ROW["video"], "equip": ROW["equip"]}},
        "cooldown": seg(ROW, 5, "z1", "Volta à calma")}

def finisher(wk):
    return seg(STAIR, 15 if wk in (1, 5) else 20, "z2", "Escada pós-treino")


# sessões já feitas na versão 1 ficam congeladas (ids, blocos e séries iguais aos registros)
FEITAS = json.loads((HERE / "sessoes_v1_feitas.json").read_text())
sessions = list(FEITAS)
seq = len(sessions)
WARM = "6 min de postura (abaixo) + 5 min de remo em zona 1 + 2 séries leves (50% e 75%) do primeiro exercício."

def add(date, w, kind, fn, cyc, wk, phase):
    global seq
    seq += 1
    s = {"seq": seq, "planned": date.isoformat(), "cycle": cyc + 1, "week": w + 1, "cycle_week": wk, "phase": phase, "kind": kind}
    if kind == "strength":
        title, focus, blocks = fn(cyc)
        if phase == "leve": blocks = deload(blocks)
        s.update(id=f"S{seq:03d}", title=title, focus=focus, blocks=blocks, warmup=WARM, drills=drills())
        if fn is tronco_uni: s["finisher"] = finisher(wk)
    else:
        title, focus, plan_c = fn(wk)
        s.update(id=f"S{seq:03d}", title=title, focus=focus, cardio=plan_c)
    sessions.append(s)

# semana 1: restam sáb 14 (pernas + abdome) e dom 15 (intervalado)
add(START + dt.timedelta(days=4), 0, "strength", pernas, 0, 1, "calibracao")
add(START + dt.timedelta(days=5), 0, "cardio", cardio_int, 0, 1, "calibracao")
for w in range(1, 15):
    cyc, wk = w // 5, w % 5 + 1
    phase = "leve" if wk == 5 else "progressao"
    tue = START + dt.timedelta(days=7 * w)
    plan = [("strength", costas), ("strength", pernas), ("cardio", cardio_z2), ("strength", peito_ombro), ("strength", tronco_uni), ("cardio", cardio_int)]
    for d, (kind, fn) in enumerate(plan):
        add(tue + dt.timedelta(days=d), w, kind, fn, cyc, wk, phase)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"version": dt.date.today().isoformat(), "start": START.isoformat(), "rest_weekday": 1,
    "fcmax": FCMAX, "zones": Z, "sessions": sessions}, ensure_ascii=False, indent=1))
print(len(sessions), "sessões ->", OUT, sessions[-1]["planned"])
