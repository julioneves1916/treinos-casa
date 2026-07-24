#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera os treinos dos dois apps a partir do catálogo canônico:

  app/data/workouts.json       — Julio Neves - Treinos (300; 1-20 são os originais)
  fitpimpa/data/workouts.json  — FitPimpa (300; menos aparelhos, mais inferiores/core/lombar)

Metodologia (extraída dos 20 originais BlackSheep):
  sessão = Mobilidade -> 4-5 exercícios de força/acessórios -> bloco metabólico
  ondas de progressão de 4 semanas no exercício principal:
      volume -> intensificação -> pico -> densidade/deload

Uso:
    python3 tools/gen_workouts.py
"""
import json
import random
import sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from catalog import CATALOG, BY_NAME, canonical  # noqa: E402

VIDEOS_PATH = HERE / "videos.json"
ORIGINAL_JSON = ROOT / "app" / "data" / "workouts.json"

# ---------------------------------------------------------------- helpers

def by_group(grupo, pimpa_only=False):
    return [e["name"] for e in CATALOG
            if e["grupo"] == grupo and (not pimpa_only or e["pimpa"])]


def load_videos():
    if not VIDEOS_PATH.exists():
        return {}
    data = json.loads(VIDEOS_PATH.read_text())
    return {name: v["chosen"] for name, v in data.items() if v.get("chosen")}


VIDEOS = load_videos()


def make_exercise(name, sets_raw):
    e = BY_NAME.get(name)
    sets = [p.strip() for p in sets_raw.split(",") if p.strip()] if sets_raw else []
    return {
        "name": name,
        "sets_raw": sets_raw,
        "sets": sets,
        "video": VIDEOS.get(name),
        "weight": bool(e) and e["grupo"] != "mobilidade",
    }


# Ondas de progressão (índice dentro da categoria % 4)
WAVE_MAIN = [
    ["4x8", "5x5", "4x6"],                 # semana 1: volume
    ["1x6, 2x5, 2x4", "4x5", "5x4"],       # semana 2: intensificação
    ["5x3", "6x2", "4x3"],                 # semana 3: pico
    ["3x10 leve", "4x10", "3x8 leve"],     # semana 4: densidade / deload
]
WAVE_EXPLOSIVE = [
    ["5x3", "4x4"],
    ["5x3", "6x2"],
    ["6x2", "5x2"],
    ["4x3 leve", "3x3 leve"],
]
ACCESSORY = ["4x10", "3x12", "4x12", "3x15", "4x8"]
MAXOUT = ["4xMax", "3xMax"]
CORE_SETS = ['3x30"', '3x40"', "3x15", '4x20"', "3x12"]
LOMBAR_SETS = ["3x12", "3x15", '3x30"', "4x10"]


# Equipamento "de academia" (aparelhos/barra) — no FitPimpa entra em minoria
APARELHO_EQUIP = {"machine", "cable", "barbell", "bike"}


def is_aparelho(name):
    e = BY_NAME.get(name)
    return bool(e) and bool(set(e["equip"]) & APARELHO_EQUIP)


class Gen:
    def __init__(self, seed, pimpa=False):
        self.rng = random.Random(seed)
        self.pimpa = pimpa
        self.recent = {}   # slot -> últimos nomes usados (anti-repetição)
        self.ap_count = 0  # aparelhos usados na sessão corrente
        self.ap_cap = 2    # máximo de aparelhos por treino (FitPimpa)

    def begin_session(self):
        self.ap_count = 0

    def pick_mixed(self, slot, functional, aparelho, exclude=(), p_ap=0.40):
        """FitPimpa: sorteia entre pool funcional e pool de aparelhos,
        respeitando o teto por sessão — funcional sempre prevalece."""
        use_ap = (self.pimpa and aparelho and self.ap_count < self.ap_cap
                  and self.rng.random() < p_ap)
        pool = aparelho if use_ap else functional
        choice = self.pick(pool, slot + ("_ap" if use_ap else ""), exclude)
        if choice is None:
            choice = self.pick(functional, slot, exclude)
        if choice and is_aparelho(choice):
            self.ap_count += 1
        return choice

    def pick(self, pool, slot, exclude=()):
        pool = [p for p in pool if p not in exclude]
        if not pool:
            return None
        recent = self.recent.setdefault(slot, [])
        fresh = [p for p in pool if p not in recent]
        choice = self.rng.choice(fresh if fresh else pool)
        recent.append(choice)
        if len(recent) > max(1, min(len(pool) - 1, 3)):
            recent.pop(0)
        return choice

    def grp(self, grupo):
        return by_group(grupo, pimpa_only=self.pimpa)


# ---------------------------------------------------------------- metabólico

METCON_JN = ["Burpee", "Burpee Tuck Jump", "KBS Russo", "Cal Bike", "Corrida",
             "Salto na Caixa", "Wall Ball", "Abdominal", "Thruster",
             "Clean Halteres", "Snatch Halteres", "Pular Corda", "Sprawl"]
METCON_PIMPA = ["Burpee", "KBS Russo", "Corrida", "Cal Bike", "Polichinelo",
                "Pular Corda", "Mountain Climber", "Agachamento com Salto",
                "Abdominal", "Sprawl", "Step Up", "Thruster Halteres",
                "Snatch Halteres"]

REPS_BY_MOVE = {
    "Burpee": [8, 10, 12], "Burpee Tuck Jump": [6, 8, 10],
    "KBS Russo": [12, 15, 20], "Cal Bike": [10, 12, 15],
    "Corrida": ["200m", "300m", "400m"], "Salto na Caixa": [8, 10, 12],
    "Wall Ball": [10, 12, 15], "Abdominal": [12, 15, 20],
    "Thruster": [6, 8, 10], "Thruster Halteres": [8, 10, 12],
    "Clean Halteres": [8, 10, 12], "Snatch Halteres": [6, 8, 10],
    "Pular Corda": [30, 40, 50], "Sprawl": [8, 10, 12],
    "Polichinelo": [20, 30, 40], "Mountain Climber": [20, 30, 40],
    "Agachamento com Salto": [10, 12, 15], "Step Up": [12, 16, 20],
}

PLURAL = {
    "Burpee": "Burpees", "Burpee Tuck Jump": "Burpee Tuck Jumps",
    "KBS Russo": "KBS Russo", "Cal Bike": "Cal Bike", "Corrida": "Corrida",
    "Salto na Caixa": "Box Jumps", "Wall Ball": "Wall Balls",
    "Abdominal": "Abdominais", "Thruster": "Thrusters",
    "Thruster Halteres": "Thrusters DB", "Clean Halteres": "Cleans DB",
    "Snatch Halteres": "Snatches DB", "Pular Corda": "Saltos de Corda",
    "Sprawl": "Sprawls", "Polichinelo": "Polichinelos",
    "Mountain Climber": "Mountain Climbers",
    "Agachamento com Salto": "Jump Squats", "Step Up": "Step Ups",
}


def metcon_item(g, move):
    reps = g.rng.choice(REPS_BY_MOVE[move])
    label = PLURAL[move]
    if move == "Corrida":
        return f"{reps} Corrida"
    return f"{reps} {label}"


def gen_metabolico(g):
    pool = METCON_PIMPA if g.pimpa else METCON_JN
    kind = g.rng.choices(
        ["amrap", "emom", "interval", "rounds", "chipper", "deathby", "run_combo"],
        weights=[24, 16, 20, 22, 8, 5, 5])[0]
    moves = g.rng.sample(pool, k=3)

    if kind == "amrap":
        dur = g.rng.choice([8, 10, 12])
        items = ", ".join(metcon_item(g, m) for m in moves)
        return f"AMRAP {dur}': {items}"
    if kind == "emom":
        dur = g.rng.choice([10, 12])
        return (f"EMOM {dur}': Min 1: {metcon_item(g, moves[0])}, "
                f"Min 2: {metcon_item(g, moves[1])}")
    if kind == "interval":
        rounds = g.rng.choice([6, 8])
        on, off = g.rng.choice([(10, 30), (15, 45), (20, 40)])
        picked = moves[:g.rng.choice([1, 2])]
        names = ", ".join(PLURAL[m] for m in picked)
        return f"{rounds} Rounds ({on}\" ON / {off}\" OFF): {names}"
    if kind == "rounds":
        rounds = g.rng.choice([4, 5, 6])
        items = ", ".join(metcon_item(g, m) for m in moves[:g.rng.choice([2, 3])])
        return f"{rounds} Rounds: {items}"
    if kind == "chipper":
        n = g.rng.choice([30, 40])
        items = ", ".join(f"{n} {PLURAL[m]}" for m in moves)
        return f"Chipper: {items}"
    if kind == "deathby":
        m = g.rng.choice([m for m in pool if m not in ("Corrida", "Pular Corda")])
        return f"Death by {PLURAL[m]}"
    # run_combo
    dist = "800m" if g.pimpa else "1km"
    m = g.rng.choice([m for m in pool if m != "Corrida"])
    n = g.rng.choice([20, 30])
    return f"{dist} Corrida + {n} {PLURAL[m]} leves"


# ---------------------------------------------------------------- sessões

TITLES = {
    "empurre": ["Explosão e Estabilidade", "Potência Vertical", "Ombro e Peito",
                "Estabilidade Vertical", "Pressão Horizontal", "Força de Bloqueio",
                "Empurre Pesado", "Ombros de Aço", "Peito e Tríceps", "Overhead Forte"],
    "tracao": ["Tração Dinâmica", "Puxada Vertical", "Tração e Bíceps",
               "Puxada e Posterior", "Costas Largas", "Remada Pesada",
               "Puxada Explosiva", "Dorsal Completo", "Tração Horizontal", "Pegada Forte"],
    "inferiores": ["Agachamento", "Cadeira Posterior", "Arranco", "Posterior e Glúteo",
                   "Base Forte", "Pernas Completas", "Quadríceps Dominante",
                   "Glúteo e Posterior", "Potência de Quadril", "Unilateral Inferior"],
    "hibrido": ["Performance", "Volume Empurre", "Unilateral", "Finalizador",
                "Equilíbrio Força", "Explosão e Core", "Flagship", "Corpo Inteiro",
                "Motor Híbrido", "Força e Fôlego"],
    "corelombar": ["Centro de Força", "Core Blindado", "Lombar Saudável",
                   "Postura e Core", "Abdômen Completo", "Cadeia Posterior Leve",
                   "Estabilidade Central", "Core e Respiração"],
}


def session_empurre(g, wave):
    ex = [make_exercise("Mobilidade", "")]
    expl = g.pick(["Push Press", "Power Jerk", "Thruster"] if not g.pimpa
                  else ["Push Press Halteres", "Thruster Halteres"], "empurre_expl")
    ex.append(make_exercise(expl, g.rng.choice(WAVE_EXPLOSIVE[wave])))
    if not g.pimpa:
        press = g.pick(["Supino Reto Barra", "Supino Halteres", "Shoulder Press Barra",
                        "Supino Inclinado Halteres", "Floor Press DB"], "empurre_press")
    else:
        press = g.pick_mixed("empurre_press",
                             ["Supino Halteres", "Supino Inclinado Halteres",
                              "Floor Press DB", "Desenvolvimento Halteres"],
                             ["Supino Reto Barra", "Shoulder Press Barra"], p_ap=0.7)
    ex.append(make_exercise(press, g.rng.choice(WAVE_MAIN[wave])))
    acc_func = (["Desenvolvimento Arnold", "Elevação Lateral", "Tríceps Corda",
                 "Tríceps Testa", "Paralelas com Peso", "Elevação Frontal",
                 "Tríceps Francês Halter"] if not g.pimpa else
                ["Desenvolvimento Arnold", "Elevação Lateral", "Elevação Frontal",
                 "Tríceps Francês Halter", "Tríceps Banco", "Pike Push-up"])
    for slot in ("empurre_acc1", "empurre_acc2"):
        used = {e["name"] for e in ex}
        acc = (g.pick(acc_func, slot, exclude=used) if not g.pimpa else
               g.pick_mixed(slot, acc_func, ["Tríceps Corda"], exclude=used, p_ap=0.45))
        ex.append(make_exercise(acc, g.rng.choice(ACCESSORY)))
    finisher = g.pick(["Flexão Diamante", "Flexão", "Paralelas"] if not g.pimpa
                      else ["Flexão", "Flexão Inclinada", "Flexão Diamante"],
                      "empurre_fin", exclude={e["name"] for e in ex})
    ex.append(make_exercise(finisher, g.rng.choice(MAXOUT)))
    return ex


def session_tracao(g, wave):
    ex = [make_exercise("Mobilidade", "")]
    expl_pool = (["High Pull", "Hang Clean", "Muscle Clean", "Clean Pull"]
                 if not g.pimpa else ["High Pull", "Snatch Halteres", "Clean Halteres"])
    ex.append(make_exercise(g.pick(expl_pool, "tracao_expl"),
                            g.rng.choice(WAVE_EXPLOSIVE[wave])))
    if not g.pimpa:
        main = g.pick(["Barra Fixa com Peso", "Barra Fixa", "Pulldown Polia",
                       "Remada Curvada", "Remada Cavalinho"], "tracao_main")
    else:
        main = g.pick_mixed("tracao_main",
                            ["Remada Unilateral", "Remada com Elástico", "Remada Invertida"],
                            ["Pulldown Polia", "Remada Baixa"], p_ap=0.7)
    ex.append(make_exercise(main, g.rng.choice(WAVE_MAIN[wave])))
    acc_func = (["Remada Unilateral", "Remada Unilateral Prancha", "Remada Baixa",
                 "Crucifixo Inverso", "Face Pull", "Rosca Direta", "Rosca Martelo",
                 "Rosca Alternada"] if not g.pimpa else
                ["Remada Unilateral Prancha", "Crucifixo Inverso", "Face Pull",
                 "Rosca Martelo", "Rosca Alternada"])
    for slot in ("tracao_acc1", "tracao_acc2"):
        used = {e["name"] for e in ex}
        acc = (g.pick(acc_func, slot, exclude=used) if not g.pimpa else
               g.pick_mixed(slot, acc_func, ["Remada Baixa", "Pulldown Polia"],
                            exclude=used, p_ap=0.45))
        ex.append(make_exercise(acc, g.rng.choice(ACCESSORY)))
    core = g.pick(["Prancha", "Hollow Hold", "Abdominal Infra"], "tracao_core")
    ex.append(make_exercise(core, g.rng.choice(CORE_SETS)))
    return ex


def session_inferiores(g, wave):
    ex = [make_exercise("Mobilidade", "")]
    if not g.pimpa:
        first = g.pick(["Hang Clean", "Hang Snatch", "Clean Pull",
                        "Agachamento Livre", "Front Squat"], "inf_first")
        scheme = WAVE_EXPLOSIVE[wave] if BY_NAME[first]["grupo"] == "oly" else WAVE_MAIN[wave]
        ex.append(make_exercise(first, g.rng.choice(scheme)))
        squat_pool = ["Agachamento Livre", "Front Squat", "Leg Press 45", "Goblet Squat"]
    else:
        first = g.pick(["Snatch Halteres", "Clean Halteres", "Goblet Squat"], "inf_first")
        scheme = WAVE_EXPLOSIVE[wave] if BY_NAME[first]["grupo"] == "oly" else WAVE_MAIN[wave]
        ex.append(make_exercise(first, g.rng.choice(scheme)))
        squat_pool = None  # pimpa usa pick_mixed abaixo
    used = {e["name"] for e in ex}
    if not g.pimpa:
        squat = g.pick(squat_pool, "inf_squat", exclude=used)
    else:
        squat = g.pick_mixed("inf_squat",
                             ["Goblet Squat", "Agachamento Sumô Halter", "Agachamento Búlgaro"],
                             ["Leg Press 45", "Agachamento Livre"], exclude=used, p_ap=0.7)
    ex.append(make_exercise(squat, g.rng.choice(WAVE_MAIN[wave])))
    used = {e["name"] for e in ex}
    if not g.pimpa:
        hinge = g.pick(["Levantamento Terra", "Stiff Barra", "Stiff Halteres", "Hip Thrust"],
                       "inf_hinge", exclude=used)
    else:
        hinge = g.pick_mixed("inf_hinge",
                             ["Stiff Halteres", "Terra Unilateral Halter",
                              "Hip Thrust Halteres", "Elevação Pélvica"],
                             ["Stiff Barra", "Hip Thrust"], exclude=used, p_ap=0.5)
    ex.append(make_exercise(hinge, g.rng.choice(WAVE_MAIN[wave][:2] + ACCESSORY[:2])))
    used = {e["name"] for e in ex}
    if not g.pimpa:
        uni = g.pick(["Cadeira Extensora", "Mesa Flexora", "Passada", "Afundo Halteres",
                      "Agachamento Búlgaro", "Step Up"], "inf_uni", exclude=used)
    else:
        uni = g.pick_mixed("inf_uni",
                           ["Passada", "Afundo Halteres", "Step Up", "Cadeira Isométrica",
                            "Abdução com Elástico", "Elevação Pélvica Unilateral"],
                           ["Cadeira Extensora", "Mesa Flexora"], exclude=used, p_ap=0.55)
    ex.append(make_exercise(uni, g.rng.choice(ACCESSORY)))
    ex.append(make_exercise("Panturrilha", g.rng.choice(["4x15", "3x20", "4x12"])))
    return ex


def session_hibrido(g, wave):
    ex = [make_exercise("Mobilidade", "")]
    oly_pool = (["Hang Clean", "Hang Snatch", "Clean & Jerk", "Thruster", "High Pull"]
                if not g.pimpa else
                ["Snatch Halteres", "Clean Halteres", "Thruster Halteres", "High Pull"])
    ex.append(make_exercise(g.pick(oly_pool, "hib_oly"),
                            g.rng.choice(WAVE_EXPLOSIVE[wave])))
    used = {e["name"] for e in ex}
    if not g.pimpa:
        push = g.pick(["Supino Halteres", "Push Press", "Floor Press DB", "Paralelas"],
                      "hib_push", exclude=used)
    else:
        push = g.pick_mixed("hib_push",
                            ["Supino Halteres", "Push Press Halteres", "Floor Press DB", "Flexão"],
                            ["Supino Reto Barra"], exclude=used, p_ap=0.45)
    ex.append(make_exercise(push, g.rng.choice(WAVE_MAIN[wave])))
    used = {e["name"] for e in ex}
    if not g.pimpa:
        pull = g.pick(["Remada Curvada", "Barra Fixa", "Remada Unilateral", "High Pull"],
                      "hib_pull", exclude=used)
    else:
        pull = g.pick_mixed("hib_pull",
                            ["Remada Unilateral", "Remada com Elástico", "Remada Unilateral Prancha"],
                            ["Pulldown Polia", "Remada Baixa"], exclude=used, p_ap=0.45)
    ex.append(make_exercise(pull, g.rng.choice(ACCESSORY)))
    lower_pool = (["Goblet Squat", "Afundo Halteres", "Stiff Halteres", "Step Up"]
                  if not g.pimpa else
                  ["Goblet Squat", "Afundo Halteres", "Agachamento Búlgaro",
                   "Elevação Pélvica"])
    used = {e["name"] for e in ex}
    ex.append(make_exercise(g.pick(lower_pool, "hib_lower", exclude=used),
                            g.rng.choice(ACCESSORY)))
    core = g.pick(["Prancha + Twist", "Russian Twist", "V-Up", "Mountain Climber",
                   "Hollow Hold"], "hib_core")
    ex.append(make_exercise(core, g.rng.choice(CORE_SETS)))
    return ex


def session_corelombar(g, wave):
    """Exclusiva do FitPimpa."""
    ex = [make_exercise("Mobilidade", "")]
    hinge = g.pick(["Good Morning Halteres", "Bom Dia com Elástico",
                    "Stiff Halteres", "Terra Unilateral Halter"], "cl_hinge")
    ex.append(make_exercise(hinge, g.rng.choice(["3x12", "4x10", "3x10"])))
    glute = g.pick_mixed("cl_glute",
                         ["Hip Thrust Halteres", "Elevação Pélvica",
                          "Elevação Pélvica Unilateral", "Abdução com Elástico"],
                         ["Hip Thrust", "Extensão Lombar"], p_ap=0.45)
    ex.append(make_exercise(glute, g.rng.choice(ACCESSORY)))
    for slot in ("cl_core1", "cl_core2"):
        used = {e["name"] for e in ex}
        core = g.pick(["Prancha", "Prancha Lateral", "Dead Bug", "Bird Dog",
                       "Hollow Hold", "Abdominal Infra", "Russian Twist", "V-Up"],
                      slot, exclude=used)
        ex.append(make_exercise(core, g.rng.choice(CORE_SETS)))
    lombar = g.pick_mixed("cl_lombar",
                          ["Superman", "Bird Dog", "Good Morning Halteres"],
                          ["Extensão Lombar"], exclude={e["name"] for e in ex}, p_ap=0.55)
    ex.append(make_exercise(lombar, g.rng.choice(LOMBAR_SETS)))
    return ex


SESSIONS = {
    "Superiores (Empurre)": ("empurre", session_empurre),
    "Superiores (Tração)": ("tracao", session_tracao),
    "Inferiores": ("inferiores", session_inferiores),
    "Híbrido": ("hibrido", session_hibrido),
    "Core & Lombar": ("corelombar", session_corelombar),
}


def build_workout(g, wid, foco, idx_in_cat):
    title_key, builder = SESSIONS[foco]
    g.begin_session()
    wave = idx_in_cat % 4
    titles = TITLES[title_key]
    estrutura = titles[(idx_in_cat // 4 + idx_in_cat) % len(titles)]
    exercises = builder(g, wave)
    raw = gen_metabolico(g)
    from build_data_parse import parse_metabolico
    return {
        "id": wid,
        "foco": foco,
        "estrutura": estrutura,
        "exercises": exercises,
        "metabolico": parse_metabolico(raw),
    }


# ---------------------------------------------------------------- montagem

def upgrade_original(w):
    """Normaliza nomes dos treinos 1-20 e anexa vídeo/peso."""
    out = dict(w)
    out["exercises"] = []
    for e in w["exercises"]:
        name = canonical(e["name"])
        ne = make_exercise(name, e.get("sets_raw", ""))
        out["exercises"].append(ne)
    return out


def interleave(counts, rng):
    """Sequência de focos embaralhada em blocos de 5 p/ variedade semanal."""
    seq = []
    for foco, n in counts.items():
        seq += [foco] * n
    rng.shuffle(seq)
    return seq


def build_app_jn():
    original = json.loads(ORIGINAL_JSON.read_text())
    workouts = [upgrade_original(w) for w in original["workouts"][:20]]
    g = Gen(seed=2026, pimpa=False)
    counts = {"Superiores (Empurre)": 56, "Superiores (Tração)": 56,
              "Inferiores": 56, "Híbrido": 112}   # 280, proporção dos originais
    seq = interleave(counts, g.rng)
    idx_in_cat = {"Superiores (Empurre)": 4, "Superiores (Tração)": 4,
                  "Inferiores": 4, "Híbrido": 8}  # continua a contagem dos originais
    for i, foco in enumerate(seq):
        wid = 21 + i
        workouts.append(build_workout(g, wid, foco, idx_in_cat[foco]))
        idx_in_cat[foco] += 1
    focos = sorted({w["foco"] for w in workouts})
    return {"version": date.today().strftime("%Y-%m-%d"),
            "focos": focos, "workouts": workouts}


def build_app_pimpa():
    g = Gen(seed=1313, pimpa=True)
    counts = {"Inferiores": 90, "Core & Lombar": 60, "Híbrido": 60,
              "Superiores (Empurre)": 45, "Superiores (Tração)": 45}  # 300
    seq = interleave(counts, g.rng)
    idx_in_cat = {k: 0 for k in counts}
    workouts = []
    for i, foco in enumerate(seq):
        workouts.append(build_workout(g, i + 1, foco, idx_in_cat[foco]))
        idx_in_cat[foco] += 1
    focos = ["Inferiores", "Core & Lombar", "Híbrido",
             "Superiores (Empurre)", "Superiores (Tração)"]
    return {"version": date.today().strftime("%Y-%m-%d"),
            "focos": focos, "workouts": workouts}


def main():
    jn = build_app_jn()
    out_jn = ROOT / "app" / "data" / "workouts.json"
    out_jn.write_text(json.dumps(jn, ensure_ascii=False, indent=1))
    print(f"JN: {len(jn['workouts'])} treinos -> {out_jn}")

    pimpa = build_app_pimpa()
    out_p = ROOT / "fitpimpa" / "data" / "workouts.json"
    out_p.parent.mkdir(parents=True, exist_ok=True)
    out_p.write_text(json.dumps(pimpa, ensure_ascii=False, indent=1))
    print(f"FitPimpa: {len(pimpa['workouts'])} treinos -> {out_p}")

    with_video = sum(1 for w in jn["workouts"] for e in w["exercises"] if e.get("video"))
    total_ex = sum(len(w["exercises"]) for w in jn["workouts"])
    print(f"JN exercícios com vídeo: {with_video}/{total_ex}")


if __name__ == "__main__":
    main()
