#!/usr/bin/env python3
"""
Gera data/workouts.json a partir da planilha de treinos Blacksheep.

Uso:
    python3 scripts/build_data.py
    python3 scripts/build_data.py "/caminho/para/planilha.xlsx"

A planilha deve conter as colunas: Treino, Foco, Estrutura, Exercicios, Metabolico
(pode estar com acentuacao: Exercicios/Metabolico).
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
APP_DIR = HERE.parent
DEFAULT_XLSX = APP_DIR.parent / "20 Treinos - Método BlackSheep Crossfit Gym Training.xlsx"
OUT_JSON = APP_DIR / "data" / "workouts.json"


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def norm_col(name: str) -> str:
    return strip_accents(str(name)).strip().lower()


def split_top_level(text: str, sep: str = ";") -> list:
    """Split mantendo parenteses aninhados intactos."""
    out, buf, depth = [], [], 0
    for ch in text:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == sep and depth == 0:
            if buf:
                out.append("".join(buf).strip())
                buf = []
        else:
            buf.append(ch)
    if buf and "".join(buf).strip():
        out.append("".join(buf).strip())
    return [p for p in out if p]


def parse_exercise(raw: str) -> dict:
    """
    Parseia "Push Press (1x6, 2x5, 2x4)" em {name, sets_raw, sets}.
    Para "Mobilidade" sem parenteses, sets fica vazio.
    """
    raw = raw.strip()
    m = re.match(r"^(.*?)\s*\(([^()]*)\)\s*$", raw)
    if not m:
        return {"name": raw, "sets_raw": "", "sets": []}
    name = m.group(1).strip()
    sets_raw = m.group(2).strip()
    sets = []
    for part in [p.strip() for p in sets_raw.split(",") if p.strip()]:
        sets.append(part)
    return {"name": name, "sets_raw": sets_raw, "sets": sets}


def parse_metabolico(raw: str) -> dict:
    """
    Classifica o bloco metabolico e extrai um timer sugerido.
    Retorna {type, duration_sec, rounds, interval_on, interval_off, raw}.
    """
    text = raw.strip()
    low = strip_accents(text).lower()

    out = {
        "raw": text,
        "type": "custom",
        "duration_sec": None,
        "rounds": None,
        "interval_on": None,
        "interval_off": None,
    }

    # AMRAP 10' | AMRAP 12'
    m = re.search(r"amrap\s*(\d+)\s*['’]?", low)
    if m:
        out["type"] = "amrap"
        out["duration_sec"] = int(m.group(1)) * 60
        return out

    # EMOM 10'
    m = re.search(r"emom\s*(\d+)\s*['’]?", low)
    if m:
        out["type"] = "emom"
        out["duration_sec"] = int(m.group(1)) * 60
        return out

    # 6 Rounds (10" ON / 30" OFF)
    m = re.search(r"(\d+)\s*rounds?\s*\(\s*(\d+)\s*[\"”]\s*on\s*/\s*(\d+)\s*[\"”]\s*off\s*\)", low)
    if m:
        out["type"] = "interval"
        out["rounds"] = int(m.group(1))
        out["interval_on"] = int(m.group(2))
        out["interval_off"] = int(m.group(3))
        return out

    # 5 Rounds (sem intervalo)
    m = re.search(r"(\d+)\s*rounds?", low)
    if m:
        out["type"] = "rounds_fortime"
        out["rounds"] = int(m.group(1))
        return out

    # Chipper | Death by | Corrida
    if "chipper" in low or "death by" in low or "corrida" in low or "km" in low:
        out["type"] = "fortime"
        return out

    return out


def parse_row(idx, row) -> dict:
    treino = int(row["treino"])
    foco = str(row["foco"]).strip()
    estrutura = str(row["estrutura"]).strip()
    exercicios_raw = str(row["exercicios"]).strip()
    metabolico_raw = str(row["metabolico"]).strip()

    exercises = [parse_exercise(p) for p in split_top_level(exercicios_raw, ";")]
    metabolico = parse_metabolico(metabolico_raw)

    return {
        "id": treino,
        "foco": foco,
        "estrutura": estrutura,
        "exercises": exercises,
        "metabolico": metabolico,
    }


def main():
    xlsx_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    if not xlsx_path.exists():
        print(f"ERRO: planilha nao encontrada: {xlsx_path}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_excel(xlsx_path)
    df.columns = [norm_col(c) for c in df.columns]

    required = {"treino", "foco", "estrutura", "exercicios", "metabolico"}
    missing = required - set(df.columns)
    if missing:
        print(f"ERRO: colunas ausentes: {missing}. Colunas encontradas: {list(df.columns)}", file=sys.stderr)
        sys.exit(1)

    workouts = [parse_row(i, row) for i, row in df.iterrows()]
    # grupamentos unicos
    focos = sorted({w["foco"] for w in workouts})

    payload = {
        "version": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "focos": focos,
        "workouts": workouts,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"OK: {len(workouts)} treinos -> {OUT_JSON}")
    print(f"Focos: {focos}")


if __name__ == "__main__":
    main()
