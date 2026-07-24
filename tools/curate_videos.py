#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Curadoria de vídeos canônicos de exercício.

Regras (definidas pelo Julio):
  - Vídeos do canal oficial "CrossFit" são sempre canônicos (prioridade máxima).
  - Vídeos com MAIS de 30 segundos NUNCA são admissíveis.

Para cada exercício do catálogo:
  1) busca dentro do canal oficial @CrossFit;
  2) fallback: busca global no YouTube ("<termo> exercise demo");
  3) filtra duração <= 30s, ranqueia por (canal oficial, aderência do título, duração);
  4) grava candidatos + escolhido em tools/videos.json para revisão.

Uso:
    python3 tools/curate_videos.py            # roda tudo
    python3 tools/curate_videos.py "Push Press"  # um exercício só (debug)
"""
import json
import re
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from catalog import CATALOG  # noqa: E402

OUT = HERE / "videos.json"
MAX_SECONDS = 30
OFFICIAL = "CrossFit"

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


def fetch(url: str) -> str:
    r = subprocess.run(
        ["curl", "-s", "--max-time", "25", "-H", f"User-Agent: {UA}",
         "-H", "Accept-Language: en-US,en;q=0.9", url],
        capture_output=True, text=True)
    return r.stdout or ""


def extract_yt_initial_data(html: str):
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html, re.DOTALL)
    if not m:
        m = re.search(r'window\["ytInitialData"\] = (\{.*?\});', html, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def walk_video_renderers(node, out):
    """Percorre a árvore atrás de videoRenderer / reelItemRenderer."""
    if isinstance(node, dict):
        if "videoRenderer" in node:
            out.append(node["videoRenderer"])
        for v in node.values():
            walk_video_renderers(v, out)
    elif isinstance(node, list):
        for v in node:
            walk_video_renderers(v, out)


def parse_length(length_text: str):
    """'0:25' -> 25 ; '1:02' -> 62 ; None se não parseável."""
    if not length_text:
        return None
    parts = length_text.strip().split(":")
    try:
        parts = [int(p) for p in parts]
    except ValueError:
        return None
    sec = 0
    for p in parts:
        sec = sec * 60 + p
    return sec


def renderer_to_item(r):
    try:
        vid = r.get("videoId")
        title = "".join(run.get("text", "") for run in r.get("title", {}).get("runs", []))
        length = r.get("lengthText", {}).get("simpleText")
        owner = ""
        ot = r.get("ownerText", {}).get("runs") or r.get("longBylineText", {}).get("runs")
        if ot:
            owner = ot[0].get("text", "")
        secs = parse_length(length)
        if not vid or not title:
            return None
        return {"id": vid, "title": title, "channel": owner, "seconds": secs}
    except Exception:
        return None


def search_channel_official(term: str):
    q = urllib.parse.quote(term)
    html = fetch(f"https://www.youtube.com/@CrossFit/search?query={q}")
    data = extract_yt_initial_data(html)
    if not data:
        return []
    renderers = []
    walk_video_renderers(data, renderers)
    items = [renderer_to_item(r) for r in renderers]
    items = [i for i in items if i]
    for i in items:
        i["channel"] = i["channel"] or OFFICIAL
    return items


def search_global(term: str):
    q = urllib.parse.quote(f"{term} exercise demo")
    html = fetch(f"https://www.youtube.com/results?search_query={q}")
    data = extract_yt_initial_data(html)
    if not data:
        return []
    renderers = []
    walk_video_renderers(data, renderers)
    items = [renderer_to_item(r) for r in renderers]
    return [i for i in items if i]


def title_score(title: str, term: str) -> float:
    t = set(re.findall(r"[a-z]+", title.lower()))
    q = set(re.findall(r"[a-z]+", term.lower()))
    if not q:
        return 0.0
    return len(t & q) / len(q)


def pick(term: str):
    """Retorna (escolhido, candidatos_admissiveis, vistos)."""
    official = search_channel_official(term)
    time.sleep(0.8)
    admissible = [i for i in official
                  if i["seconds"] is not None and i["seconds"] <= MAX_SECONDS
                  and title_score(i["title"], term) >= 0.5]
    source = "official"
    if not admissible:
        glob = search_global(term)
        time.sleep(0.8)
        # canal oficial pode aparecer na busca global também
        glob_official = [i for i in glob if i["channel"].strip().lower() == OFFICIAL.lower()]
        pool = glob_official + [i for i in glob if i not in glob_official]
        admissible = [i for i in pool
                      if i["seconds"] is not None and i["seconds"] <= MAX_SECONDS
                      and title_score(i["title"], term) >= 0.6]
        source = "global"
    if not admissible:
        return None, [], source

    def rank(i):
        is_official = i["channel"].strip().lower() == OFFICIAL.lower()
        return (not is_official, -title_score(i["title"], term), i["seconds"] or 999)

    admissible.sort(key=rank)
    return admissible[0], admissible[:5], source


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    result = {}
    todo = [e for e in CATALOG if e["en"] and (only is None or e["name"] == only)]
    print(f"Curando {len(todo)} exercícios (limite {MAX_SECONDS}s)...")
    for n, e in enumerate(todo, 1):
        chosen, cands, source = pick(e["en"])
        result[e["name"]] = {
            "search": e["en"],
            "source": source,
            "chosen": chosen,
            "candidates": cands,
        }
        status = (f"{chosen['seconds']}s @ {chosen['channel']}" if chosen else "SEM VÍDEO ADMISSÍVEL")
        print(f"[{n}/{len(todo)}] {e['name']}: {status}")
        OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    ok = sum(1 for v in result.values() if v["chosen"])
    official_n = sum(1 for v in result.values()
                     if v["chosen"] and v["chosen"]["channel"].strip().lower() == OFFICIAL.lower())
    print(f"\nOK: {ok}/{len(result)} com vídeo (oficiais: {official_n}) -> {OUT}")


if __name__ == "__main__":
    main()
