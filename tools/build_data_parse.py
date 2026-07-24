#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Parser do bloco metabólico (mesma lógica de app/scripts/build_data.py, sem pandas)."""
import re
import unicodedata


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")


def parse_metabolico(raw: str) -> dict:
    text = raw.strip()
    low = strip_accents(text).lower()
    out = {"raw": text, "type": "custom", "duration_sec": None,
           "rounds": None, "interval_on": None, "interval_off": None}

    m = re.search(r"amrap\s*(\d+)\s*['’]?", low)
    if m:
        out["type"] = "amrap"
        out["duration_sec"] = int(m.group(1)) * 60
        return out

    m = re.search(r"emom\s*(\d+)\s*['’]?", low)
    if m:
        out["type"] = "emom"
        out["duration_sec"] = int(m.group(1)) * 60
        return out

    m = re.search(r"(\d+)\s*rounds?\s*\(\s*(\d+)\s*[\"”]\s*on\s*/\s*(\d+)\s*[\"”]\s*off\s*\)", low)
    if m:
        out["type"] = "interval"
        out["rounds"] = int(m.group(1))
        out["interval_on"] = int(m.group(2))
        out["interval_off"] = int(m.group(3))
        return out

    m = re.search(r"(\d+)\s*rounds?", low)
    if m:
        out["type"] = "rounds_fortime"
        out["rounds"] = int(m.group(1))
        return out

    if "chipper" in low or "death by" in low or "corrida" in low or "km" in low:
        out["type"] = "fortime"
        return out

    return out
