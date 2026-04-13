#!/usr/bin/env python3
"""
Scrape skill level effects from the official Monster Hunter Now website.
Updates data/skills.json with correct effects for all skills.

Official URL pattern: https://monsterhunternow.com/zh/skills/{url_id}
where url_id uses underscores (e.g. attack_boost).
"""

import urllib.request
import urllib.error
import json
import re
import time
import sys
from pathlib import Path

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
BASE = "https://monsterhunternow.com/zh/skills"

# Reverse map: internal_id → official_url_id (hyphens, before underscore conversion)
# Source: fix-armor-skill-ids.py SKILL_ID_MAP is official_url_id → internal_id
# So invert it to get internal_id → official_url_id
SKILL_ID_MAP_OFFICIAL_TO_INTERNAL = {
    "abnormal-status-enhancement": "status-sneak-attack",
    "airborne":                    "skyward-striker",
    "armor-up":                    "defense-ready",
    "attack-boost-secret":         "attack-boost-peak",
    "attack-up-critical-down":     "brute-force",
    "auto-just-dodge":             "absolute-evasion-sp",
    "ballistic":                   "ballistics",
    "blast-resistance":            "blastblight-resistance",
    "bloodblight-cloak":           "bloody-shroud",
    "bravery":                     "valor",
    "break-attack-boost":          "follow-up",
    "brutal-strike":               "maximum-might",
    "buildup-boost":               "status-hit-boost",
    "burst-dodger":                "offensive-dodger",
    "burst-secret":                "burst-peak",
    "chameleos-poison":            "chameleos-miasma",
    "charge-up":                   "charge-shockwave-boost",
    "concentration":               "sp-meter-boost",
    "deathgaron":                  "steadfast",
    "disable-perfect-evade":       "resolute",
    "ending-shot":                 "final-shot",
    "enhancement-normal-ammo":     "normal-shots-boost",
    "evasive-reload":              "dodge-load",
    "feat-of-agility":             "quick-work",
    "guarding-reload":             "load-guard",
    "hellfire-cloak":              "foxfire-veil",
    "high-performance-dragon":     "hi-dragon",
    "high-performance-fire":       "hi-fire",
    "high-performance-ice":        "hi-ice",
    "high-performance-thunder":    "hi-thunder",
    "ice-attack-boost-secret":     "ice-attack-peak",
    "kirin-robe":                  "rajang-thunderclap",
    "kushala-bless":               "kushala-frostwind",
    "last-stand":                  "last-stand-guard",
    "malzeno-blood":               "valstrax-bloodspray",
    "move-forward-strengthen":     "evasive-concentration",
    "multi-attack-boost":          "group-hunt-attack",
    "multiplayer-boost":           "group-hunt-defense",
    "namielle-wave":               "namielle-thunderwave",
    "nergigante-greed":            "nergigante-hunger",
    "part-break-special-boost":    "special-partbreaker",
    "perfect-evade-attack-boost":  "aggressive-dodger",
    "perfect-evade-sp-charge":     "sp-meter-boost-dodge",
    "power-burst":                 "true-ability",
    "powerhouse":                  "attack-activation",
    "powerhouse-critical":         "attack-crit",
    "pursuit-paralysis":           "follow-up-paralysis",
    "pursuit-poison":              "follow-up-poison",
    "rising-tide":                 "battle-temper",
    "sleep-enhancement":           "awakening-strike",
    "sp-insurance":                "special-insurance",
    "spare-shot":                  "ammo-saver",
    "teostra-bless":               "teostra-blastpowder",
    "thunder-attack-boost-secret": "thunder-attack-peak",
    "water-attack-boost-secret":   "water-attack-peak",
}

# Build internal → official map
INTERNAL_TO_OFFICIAL = {v: k for k, v in SKILL_ID_MAP_OFFICIAL_TO_INTERNAL.items()}


def get_official_url_id(internal_id: str) -> str:
    """Convert internal skill ID to official website URL ID (with underscores)."""
    official = INTERNAL_TO_OFFICIAL.get(internal_id, internal_id)
    return official.replace("-", "_")


def fetch(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return None
    except Exception as e:
        print(f"\n  ERROR fetching {url}: {e}", file=sys.stderr)
        return None


def clean_html(text: str) -> str:
    """Remove HTML tags and normalize whitespace."""
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_skill_page(html: str):
    """
    Parse skill name and level effects from skill detail page HTML.

    Returns (name, description, levels) where levels is a list of
    {"level": int, "effect": str}
    """
    # Extract page title (skill name)
    title_m = re.search(r"<title>([^<]+?) – Monster Hunter Now</title>", html)
    name = title_m.group(1).strip() if title_m else None

    # Find the skill table
    table_m = re.search(r"<table[^>]*>(.*?)</table>", html, re.DOTALL)
    if not table_m:
        return name, None, []

    table_html = table_m.group(1)

    # Extract rows: <td class="firstColumn"><b>N</b></td><td ...>EFFECT</td>
    row_pattern = re.compile(
        r'<td[^>]*class="[^"]*firstColumn[^"]*"[^>]*><b>(\d+)</b></td>\s*'
        r'<td[^>]*class="[^"]*lastColumn[^"]*"[^>]*>(.*?)</td>',
        re.DOTALL,
    )

    levels = []
    for m in row_pattern.finditer(table_html):
        level = int(m.group(1))
        effect_html = m.group(2)
        effect = clean_html(effect_html)
        if effect:
            levels.append({"level": level, "effect": effect})

    return name, None, levels


def main():
    data_path = Path(__file__).parent.parent / "data" / "skills.json"
    skills = json.loads(data_path.read_text(encoding="utf-8"))

    updated = 0
    failed = []
    unchanged = 0

    total = len(skills)
    for i, skill in enumerate(skills, 1):
        internal_id = skill["id"]
        url_id = get_official_url_id(internal_id)
        url = f"{BASE}/{url_id}"

        sys.stdout.write(f"\r[{i:3d}/{total}] {internal_id:<40}")
        sys.stdout.flush()

        html = fetch(url)
        if not html:
            # Try with the internal ID directly (some may use same ID)
            alt_url_id = internal_id.replace("-", "_")
            if alt_url_id != url_id:
                html = fetch(f"{BASE}/{alt_url_id}")
                if html:
                    url_id = alt_url_id

        if not html:
            print(f"\n  ✗ FAILED: {url}", file=sys.stderr)
            failed.append(internal_id)
            time.sleep(0.15)
            continue

        _name, _desc, levels = parse_skill_page(html)

        if not levels:
            print(f"\n  ✗ NO LEVELS PARSED: {url}", file=sys.stderr)
            failed.append(internal_id)
            time.sleep(0.15)
            continue

        # Update levels
        old_levels = skill.get("levels", [])
        if levels != old_levels:
            skill["levels"] = levels
            skill["maxLevel"] = len(levels)
            updated += 1
        else:
            unchanged += 1

        time.sleep(0.15)

    print(f"\n\nDone! Updated: {updated}, Unchanged: {unchanged}, Failed: {len(failed)}")

    if failed:
        print(f"\nFailed skill IDs ({len(failed)}):")
        for sid in failed:
            print(f"  {sid}")

    # Save updated skills.json
    data_path.write_text(json.dumps(skills, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved to {data_path}")


if __name__ == "__main__":
    main()
