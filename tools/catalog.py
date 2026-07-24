#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Catálogo canônico de exercícios — fonte única para:
  - curadoria de vídeos (curate_videos.py)
  - geração de treinos (gen_workouts.py) dos dois apps

Campos:
  name  : nome canônico em pt-BR (é a chave da memória de cargas no app)
  en    : termo de busca em inglês para o YouTube
  equip : equipamentos necessários
          {barbell, dumbbell, kettlebell, machine, cable, pullup_bar,
           dip_bar, bench, box, band, bodyweight, bike, run}
  grupo : empurre | tracao | inferiores | core | lombar | oly | metcon | mobilidade
  pimpa : True se admissível no FitPimpa (pouco equipamento)
"""

CATALOG = [
    # ---------- Mobilidade ----------
    {"name": "Mobilidade", "en": None, "equip": ["bodyweight"], "grupo": "mobilidade", "pimpa": True},

    # ---------- Empurre ----------
    {"name": "Push Press",              "en": "push press",                    "equip": ["barbell"],            "grupo": "empurre", "pimpa": False},
    {"name": "Push Press Halteres",     "en": "dumbbell push press",           "equip": ["dumbbell"],           "grupo": "empurre", "pimpa": True},
    {"name": "Power Jerk",              "en": "push jerk",                     "equip": ["barbell"],            "grupo": "empurre", "pimpa": False},
    {"name": "Shoulder Press Barra",    "en": "shoulder press barbell strict", "equip": ["barbell"],            "grupo": "empurre", "pimpa": False},
    {"name": "Desenvolvimento Halteres","en": "seated dumbbell shoulder press","equip": ["dumbbell", "bench"],  "grupo": "empurre", "pimpa": True},
    {"name": "Desenvolvimento Arnold",  "en": "arnold press",                  "equip": ["dumbbell", "bench"],  "grupo": "empurre", "pimpa": True},
    {"name": "Supino Reto Barra",       "en": "bench press",                   "equip": ["barbell", "bench"],   "grupo": "empurre", "pimpa": False},
    {"name": "Supino Halteres",         "en": "dumbbell bench press",          "equip": ["dumbbell", "bench"],  "grupo": "empurre", "pimpa": True},
    {"name": "Supino Inclinado Halteres","en": "incline dumbbell bench press", "equip": ["dumbbell", "bench"],  "grupo": "empurre", "pimpa": True},
    {"name": "Floor Press DB",          "en": "dumbbell floor press",          "equip": ["dumbbell"],           "grupo": "empurre", "pimpa": True},
    {"name": "Floor Press DB Unilateral","en": "single arm dumbbell floor press","equip": ["dumbbell"],         "grupo": "empurre", "pimpa": True},
    {"name": "Paralelas",               "en": "dips",                          "equip": ["dip_bar"],            "grupo": "empurre", "pimpa": False},
    {"name": "Paralelas com Peso",      "en": "weighted dips",                 "equip": ["dip_bar"],            "grupo": "empurre", "pimpa": False},
    {"name": "Flexão",                  "en": "push up",                       "equip": ["bodyweight"],         "grupo": "empurre", "pimpa": True},
    {"name": "Flexão Diamante",         "en": "diamond push up",               "equip": ["bodyweight"],         "grupo": "empurre", "pimpa": True},
    {"name": "Flexão Inclinada",        "en": "incline push up",               "equip": ["bodyweight", "bench"],"grupo": "empurre", "pimpa": True},
    {"name": "Pike Push-up",            "en": "pike push up",                  "equip": ["bodyweight"],         "grupo": "empurre", "pimpa": True},
    {"name": "Tríceps Testa",           "en": "skull crusher lying triceps extension", "equip": ["barbell", "bench"], "grupo": "empurre", "pimpa": False},
    {"name": "Tríceps Testa + Flexão",  "en": "skull crusher",                 "equip": ["barbell", "bench"],   "grupo": "empurre", "pimpa": False},
    {"name": "Tríceps Corda",           "en": "triceps rope pushdown",         "equip": ["cable"],              "grupo": "empurre", "pimpa": False},
    {"name": "Tríceps Francês Halter",  "en": "overhead dumbbell triceps extension", "equip": ["dumbbell"],     "grupo": "empurre", "pimpa": True},
    {"name": "Tríceps Banco",           "en": "bench dips",                    "equip": ["bench", "bodyweight"],"grupo": "empurre", "pimpa": True},
    {"name": "Elevação Lateral",        "en": "dumbbell lateral raise",        "equip": ["dumbbell"],           "grupo": "empurre", "pimpa": True},
    {"name": "Elevação Frontal",        "en": "dumbbell front raise",          "equip": ["dumbbell"],           "grupo": "empurre", "pimpa": True},
    {"name": "Elevação Lateral + Rosca","en": "dumbbell lateral raise",        "equip": ["dumbbell"],           "grupo": "empurre", "pimpa": True},

    # ---------- Tração ----------
    {"name": "Barra Fixa",              "en": "pull up",                       "equip": ["pullup_bar"],         "grupo": "tracao", "pimpa": False},
    {"name": "Barra Fixa com Peso",     "en": "weighted pull up",              "equip": ["pullup_bar"],         "grupo": "tracao", "pimpa": False},
    {"name": "Pulldown Polia",          "en": "lat pulldown",                  "equip": ["machine"],            "grupo": "tracao", "pimpa": False},
    {"name": "Remada Curvada",          "en": "bent over barbell row",         "equip": ["barbell"],            "grupo": "tracao", "pimpa": False},
    {"name": "Remada Unilateral",       "en": "single arm dumbbell row",       "equip": ["dumbbell", "bench"],  "grupo": "tracao", "pimpa": True},
    {"name": "Remada Unilateral Prancha","en": "renegade row",                 "equip": ["dumbbell"],           "grupo": "tracao", "pimpa": True},
    {"name": "Remada Baixa",            "en": "seated cable row",              "equip": ["cable"],              "grupo": "tracao", "pimpa": False},
    {"name": "Remada Cavalinho",        "en": "t-bar row",                     "equip": ["barbell"],            "grupo": "tracao", "pimpa": False},
    {"name": "Remada Invertida",        "en": "inverted row",                  "equip": ["barbell", "bodyweight"], "grupo": "tracao", "pimpa": True},
    {"name": "Remada com Elástico",     "en": "resistance band row",           "equip": ["band"],               "grupo": "tracao", "pimpa": True},
    {"name": "High Pull",               "en": "dumbbell high pull",            "equip": ["dumbbell"],           "grupo": "tracao", "pimpa": True},
    {"name": "Face Pull",               "en": "face pull",                     "equip": ["cable", "band"],      "grupo": "tracao", "pimpa": True},
    {"name": "Crucifixo Inverso",       "en": "reverse fly dumbbell",          "equip": ["dumbbell"],           "grupo": "tracao", "pimpa": True},
    {"name": "Rosca Direta",            "en": "barbell curl",                  "equip": ["barbell"],            "grupo": "tracao", "pimpa": False},
    {"name": "Rosca Martelo",           "en": "hammer curl",                   "equip": ["dumbbell"],           "grupo": "tracao", "pimpa": True},
    {"name": "Rosca Alternada",         "en": "alternating dumbbell curl",     "equip": ["dumbbell"],           "grupo": "tracao", "pimpa": True},

    # ---------- Olímpicos / explosivos ----------
    {"name": "Hang Clean",              "en": "hang power clean",              "equip": ["barbell"],            "grupo": "oly", "pimpa": False},
    {"name": "Muscle Clean",            "en": "muscle clean",                  "equip": ["barbell"],            "grupo": "oly", "pimpa": False},
    {"name": "Clean Pull",              "en": "clean pull",                    "equip": ["barbell"],            "grupo": "oly", "pimpa": False},
    {"name": "Hang Snatch",             "en": "hang power snatch",             "equip": ["barbell"],            "grupo": "oly", "pimpa": False},
    {"name": "Clean & Jerk",            "en": "clean and jerk",                "equip": ["barbell"],            "grupo": "oly", "pimpa": False},
    {"name": "Snatch Halteres",         "en": "dumbbell snatch",               "equip": ["dumbbell"],           "grupo": "oly", "pimpa": True},
    {"name": "Clean Halteres",          "en": "dumbbell power clean",          "equip": ["dumbbell"],           "grupo": "oly", "pimpa": True},
    {"name": "Thruster",                "en": "thruster",                      "equip": ["barbell"],            "grupo": "oly", "pimpa": False},
    {"name": "Thruster Halteres",       "en": "dumbbell thruster",             "equip": ["dumbbell"],           "grupo": "oly", "pimpa": True},

    # ---------- Inferiores ----------
    {"name": "Agachamento Livre",       "en": "back squat",                    "equip": ["barbell"],            "grupo": "inferiores", "pimpa": False},
    {"name": "Front Squat",             "en": "front squat",                   "equip": ["barbell"],            "grupo": "inferiores", "pimpa": False},
    {"name": "Front Squat + Salto Caixa","en": "front squat",                  "equip": ["barbell", "box"],     "grupo": "inferiores", "pimpa": False},
    {"name": "Goblet Squat",            "en": "goblet squat",                  "equip": ["kettlebell"],         "grupo": "inferiores", "pimpa": True},
    {"name": "Goblet Squat + Elevação Lateral", "en": "goblet squat",          "equip": ["kettlebell", "dumbbell"], "grupo": "inferiores", "pimpa": True},
    {"name": "Agachamento Sumô Halter", "en": "dumbbell sumo squat",           "equip": ["dumbbell"],           "grupo": "inferiores", "pimpa": True},
    {"name": "Levantamento Terra",      "en": "deadlift",                      "equip": ["barbell"],            "grupo": "inferiores", "pimpa": False},
    {"name": "Stiff Barra",             "en": "romanian deadlift",             "equip": ["barbell"],            "grupo": "inferiores", "pimpa": False},
    {"name": "Stiff Halteres",          "en": "dumbbell romanian deadlift",    "equip": ["dumbbell"],           "grupo": "inferiores", "pimpa": True},
    {"name": "Terra Unilateral Halter", "en": "single leg romanian deadlift",  "equip": ["dumbbell"],           "grupo": "inferiores", "pimpa": True},
    {"name": "Leg Press 45",            "en": "leg press",                     "equip": ["machine"],            "grupo": "inferiores", "pimpa": False},
    {"name": "Cadeira Extensora",       "en": "leg extension machine",         "equip": ["machine"],            "grupo": "inferiores", "pimpa": False},
    {"name": "Mesa Flexora",            "en": "lying leg curl machine",        "equip": ["machine"],            "grupo": "inferiores", "pimpa": False},
    {"name": "Hip Thrust",              "en": "barbell hip thrust",            "equip": ["barbell", "bench"],   "grupo": "inferiores", "pimpa": False},
    {"name": "Hip Thrust Halteres",     "en": "dumbbell hip thrust",           "equip": ["dumbbell", "bench"],  "grupo": "inferiores", "pimpa": True},
    {"name": "Hip Thrust Isometria",    "en": "hip thrust",                    "equip": ["barbell", "bench"],   "grupo": "inferiores", "pimpa": False},
    {"name": "Elevação Pélvica",        "en": "glute bridge",                  "equip": ["bodyweight"],         "grupo": "inferiores", "pimpa": True},
    {"name": "Elevação Pélvica Unilateral", "en": "single leg glute bridge",   "equip": ["bodyweight"],         "grupo": "inferiores", "pimpa": True},
    {"name": "Passada",                 "en": "walking lunge",                 "equip": ["bodyweight", "dumbbell"], "grupo": "inferiores", "pimpa": True},
    {"name": "Afundo Halteres",         "en": "dumbbell lunge",                "equip": ["dumbbell"],           "grupo": "inferiores", "pimpa": True},
    {"name": "Agachamento Búlgaro",     "en": "bulgarian split squat",         "equip": ["dumbbell", "bench"],  "grupo": "inferiores", "pimpa": True},
    {"name": "Step Up",                 "en": "box step up",                   "equip": ["box", "dumbbell"],    "grupo": "inferiores", "pimpa": True},
    {"name": "Panturrilha",             "en": "standing calf raise",           "equip": ["bodyweight", "dumbbell"], "grupo": "inferiores", "pimpa": True},
    {"name": "Cadeira Isométrica",      "en": "wall sit",                      "equip": ["bodyweight"],         "grupo": "inferiores", "pimpa": True},
    {"name": "Abdução com Elástico",    "en": "banded lateral walk",           "equip": ["band"],               "grupo": "inferiores", "pimpa": True},
    {"name": "Salto na Caixa",          "en": "box jump",                      "equip": ["box"],                "grupo": "inferiores", "pimpa": True},

    # ---------- Core ----------
    {"name": "Prancha",                 "en": "plank",                         "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "Prancha + Twist",         "en": "plank hip twist",               "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "Prancha Lateral",         "en": "side plank",                    "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "Abdominal",               "en": "sit up",                        "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "Abdominal Infra",         "en": "lying leg raise",               "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "Russian Twist",           "en": "russian twist",                 "equip": ["bodyweight", "dumbbell"], "grupo": "core", "pimpa": True},
    {"name": "Dead Bug",                "en": "dead bug exercise",             "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "Bird Dog",                "en": "bird dog exercise",             "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "Hollow Hold",             "en": "hollow hold",                   "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "V-Up",                    "en": "v up exercise",                 "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "Mountain Climber",        "en": "mountain climbers",             "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},
    {"name": "Core",                    "en": "plank",                         "equip": ["bodyweight"],         "grupo": "core", "pimpa": True},

    # ---------- Lombar ----------
    {"name": "Superman",                "en": "superman exercise",             "equip": ["bodyweight"],         "grupo": "lombar", "pimpa": True},
    {"name": "Extensão Lombar",         "en": "back extension",                "equip": ["machine", "bodyweight"], "grupo": "lombar", "pimpa": False},
    {"name": "Good Morning Halteres",   "en": "dumbbell good morning",         "equip": ["dumbbell"],           "grupo": "lombar", "pimpa": True},
    {"name": "Good Morning",            "en": "good morning exercise barbell", "equip": ["barbell"],            "grupo": "lombar", "pimpa": False},
    {"name": "Bom Dia com Elástico",    "en": "banded good morning",           "equip": ["band"],               "grupo": "lombar", "pimpa": True},

    # ---------- Metcon (blocos metabólicos) ----------
    {"name": "Burpee",                  "en": "burpee",                        "equip": ["bodyweight"],         "grupo": "metcon", "pimpa": True},
    {"name": "Burpee Tuck Jump",        "en": "burpee tuck jump",              "equip": ["bodyweight"],         "grupo": "metcon", "pimpa": True},
    {"name": "KBS Russo",               "en": "russian kettlebell swing",      "equip": ["kettlebell"],         "grupo": "metcon", "pimpa": True},
    {"name": "Cal Bike",                "en": "assault bike",                  "equip": ["bike"],               "grupo": "metcon", "pimpa": True},
    {"name": "Corrida",                 "en": "running",                       "equip": ["run"],                "grupo": "metcon", "pimpa": True},
    {"name": "Polichinelo",             "en": "jumping jacks",                 "equip": ["bodyweight"],         "grupo": "metcon", "pimpa": True},
    {"name": "Pular Corda",             "en": "single unders jump rope",       "equip": ["bodyweight"],         "grupo": "metcon", "pimpa": True},
    {"name": "Wall Ball",               "en": "wall ball shot",                "equip": ["box"],                "grupo": "metcon", "pimpa": False},
    {"name": "Sprawl",                  "en": "sprawl exercise",               "equip": ["bodyweight"],         "grupo": "metcon", "pimpa": True},
    {"name": "Agachamento com Salto",   "en": "jump squat",                    "equip": ["bodyweight"],         "grupo": "metcon", "pimpa": True},
]

# Nomes usados nos 20 treinos originais -> nome canônico do catálogo
ALIASES = {
    "Terra": "Levantamento Terra",
    "Desenv. Arnold": "Desenvolvimento Arnold",
    "Paralelas Peso": "Paralelas com Peso",
    "Extensora": "Cadeira Extensora",
    "Front Squat + Salto": "Front Squat + Salto Caixa",
    "Supino Inc. Halteres": "Supino Inclinado Halteres",
    "Barra Fixa Peso": "Barra Fixa com Peso",
    "Paralelas": "Paralelas",
    "Passada": "Passada",
}

BY_NAME = {e["name"]: e for e in CATALOG}


def canonical(name: str) -> str:
    return ALIASES.get(name.strip(), name.strip())


if __name__ == "__main__":
    from collections import Counter
    print(f"{len(CATALOG)} exercícios no catálogo")
    print(Counter(e["grupo"] for e in CATALOG))
    print(f"pimpa-friendly: {sum(1 for e in CATALOG if e['pimpa'])}")
