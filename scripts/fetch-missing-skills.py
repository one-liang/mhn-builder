#!/usr/bin/env python3
"""Fetch names for missing skills from the official website."""

import urllib.request
import urllib.error
import re
import json
import time
import sys
from pathlib import Path

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
BASE = "https://monsterhunternow.com/zh/skills"

MISSING_SKILLS = [
    "abnormal-status-enhancement",
    "airborne",
    "armor-up",
    "attack-boost-secret",
    "attack-up-critical-down",
    "auto-just-dodge",
    "ballistic",
    "blast-resistance",
    "bloodblight-cloak",
    "bravery",
    "break-attack-boost",
    "brutal-strike",
    "buildup-boost",
    "burst-dodger",
    "burst-secret",
    "chameleos-poison",
    "charge-up",
    "concentration",
    "deathgaron",
    "disable-perfect-evade",
    "ending-shot",
    "enhancement-normal-ammo",
    "evasive-reload",
    "feat-of-agility",
    "guarding-reload",
    "hellfire-cloak",
    "high-performance-dragon",
    "high-performance-fire",
    "high-performance-ice",
    "high-performance-thunder",
    "ice-attack-boost-secret",
    "kirin-robe",
    "kushala-bless",
    "last-stand",
    "malzeno-blood",
    "move-forward-strengthen",
    "multi-attack-boost",
    "multiplayer-boost",
    "namielle-wave",
    "nergigante-greed",
    "part-break-special-boost",
    "perfect-evade-attack-boost",
    "perfect-evade-sp-charge",
    "power-burst",
    "powerhouse",
    "powerhouse-critical",
    "pursuit-paralysis",
    "pursuit-poison",
    "rising-tide",
    "sleep-enhancement",
    "sp-insurance",
    "spare-shot",
    "teostra-bless",
    "thunder-attack-boost-secret",
    "water-attack-boost-secret",
]


def fetch_skill_name(skill_id: str) -> dict:
    url_id = skill_id.replace("-", "_")
    url = f"{BASE}/{url_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return {"id": skill_id, "name": skill_id, "error": str(e.code)}
    except Exception as e:
        return {"id": skill_id, "name": skill_id, "error": str(e)}

    title_m = re.search(r"<title>([^<]+?) – Monster Hunter Now</title>", html)
    name = title_m.group(1).strip() if title_m else skill_id

    # Try to get max level and description
    # Skill levels appear as <td class="...level...">N</td> or similar
    level_matches = re.findall(r'Lv\s*(\d+)', html)
    max_level = max((int(x) for x in level_matches), default=3)
    max_level = min(max_level, 5)

    # Determine category (default utility)
    category = "utility"

    return {
        "id": skill_id,
        "name": name,
        "nameEn": skill_id.replace("-", " ").title(),
        "description": "",
        "maxLevel": max_level,
        "category": category,
        "levels": [{"level": i + 1, "effect": ""} for i in range(max_level)],
    }


def main():
    results = []
    total = len(MISSING_SKILLS)
    for i, skill_id in enumerate(MISSING_SKILLS, 1):
        sys.stdout.write(f"\r[{i}/{total}] {skill_id}  ")
        sys.stdout.flush()
        result = fetch_skill_name(skill_id)
        results.append(result)
        time.sleep(0.1)

    print("\nDone!")

    out_path = Path(__file__).parent / "new-skills.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Saved to {out_path}")

    for r in results:
        err = r.pop("error", None)
        status = f"ERROR {err}" if err else r["name"]
        print(f"  {r['id']}: {status}")


if __name__ == "__main__":
    main()
