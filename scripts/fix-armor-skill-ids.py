#!/usr/bin/env python3
"""
Fix skill IDs in armor JSON files.
The scraper uses official website URL-based IDs, but our skills.json uses different IDs.
This script remaps official IDs to our internal IDs.
"""

import json
from pathlib import Path

# Map: official_url_id → our_skill_id
SKILL_ID_MAP = {
    # Duplicate IDs (same skill, different name)
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
    # Also fix some minor renames seen in the scraped data
    "dragon-attack":               "dragon-attack",  # passthrough
}


def remap_skill_id(skill_id: str) -> str:
    return SKILL_ID_MAP.get(skill_id, skill_id)


def process_file(path: Path):
    items = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    for item in items:
        for skill in item.get("skills", []):
            old_id = skill["skillId"]
            new_id = remap_skill_id(old_id)
            if old_id != new_id:
                skill["skillId"] = new_id
                changed += 1
    path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  {path.name}: {changed} skill IDs remapped")


def main():
    data_dir = Path(__file__).parent.parent / "data" / "armor"

    # Verify all skills used in armor data exist in skills.json
    all_skills = json.loads((data_dir.parent.parent / "data" / "skills.json").read_text())
    valid_ids = set(s["id"] for s in all_skills)

    print("=== Fixing skill IDs in armor files ===")
    for part in ["head", "chest", "arms", "waist", "legs"]:
        process_file(data_dir / f"{part}.json")

    print("\n=== Verifying all skill IDs exist in skills.json ===")
    unknown = set()
    for part in ["head", "chest", "arms", "waist", "legs"]:
        items = json.loads((data_dir / f"{part}.json").read_text())
        for item in items:
            for skill in item.get("skills", []):
                sid = skill["skillId"]
                if sid not in valid_ids:
                    unknown.add(sid)

    if unknown:
        print(f"WARNING: {len(unknown)} unknown skill IDs:")
        for sid in sorted(unknown):
            print(f"  {sid}")
    else:
        print("All skill IDs are valid!")


if __name__ == "__main__":
    main()
