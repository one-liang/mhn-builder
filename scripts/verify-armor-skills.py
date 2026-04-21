#!/usr/bin/env python3
"""
Verify all armor skill levels against the official Monster Hunter Now website.
Compares data/armor/*.json with live website data, reports mismatches, and
optionally auto-fixes them.

Usage:
  python3 scripts/verify-armor-skills.py            # verify only
  python3 scripts/verify-armor-skills.py --fix      # verify and fix
  python3 scripts/verify-armor-skills.py --only ore # only check sets matching "ore"
"""

import urllib.request
import urllib.error
import json
import re
import time
import sys
import argparse
from pathlib import Path

BASE_URL = "https://monsterhunternow.com/zh/armor"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

# Same list as scrape-armor.py
ARMOR_SETS = [
    ("ore",                 "leather"),
    ("alloy",               "alloy"),
    ("greatjagras",         "jagras"),
    ("kuluyaku",            "kulu"),
    ("pukeipukei",          "pukei"),
    ("coral_pukeipukei",    "coral-pukei"),
    ("barroth",             "barroth"),
    ("greatgirros",         "girros"),
    ("tobikadachi",         "kadachi"),
    ("viper_tobikadachi",   "viper-kadachi"),
    ("paolumu",             "paolumu"),
    ("nightshade_paolumu",  "nightshade-paolumu"),
    ("jyuratodus",          "jyuratodus"),
    ("anjanath",            "anjanath"),
    ("fulgur_anjanath",     "fulgur-anjanath"),
    ("rathian",             "rathian"),
    ("pink_rathian",        "pink-rathian"),
    ("gold_rathian",        "gold-rathian"),
    ("legiana",             "legiana"),
    ("diablos",             "diablos"),
    ("black_diablos",       "black-diablos"),
    ("rathalos",            "rathalos"),
    ("azure_rathalos",      "azure-rathalos"),
    ("silver_rathalos",     "silver-rathalos"),
    ("zinogre",             "zinogre"),
    ("tzitziyaku",          "tzitzi"),
    ("odogaron",            "odogaron"),
    ("ebony_odogaron",      "ebony-odogaron"),
    ("deviljho",            "vangis"),
    ("basarios",            "basarios"),
    ("khezu",               "khezu"),
    ("kushaladaora",        "kushala"),
    ("mizutsune",           "mizutsune"),
    ("teostra",             "kaiser"),
    ("aknosom",             "aknosom"),
    ("magnamalo",           "sinister"),
    ("rajang",              "rajang"),
    ("nergigante",          "nergigante"),
    ("lagombi",             "lagombi"),
    ("volvidon",            "volvidon"),
    ("somnacanth",          "somnacanth"),
    ("tigrex",              "tigrex"),
    ("brute_tigrex",        "brute-tigrex"),
    ("kirin",               "kirin"),
    ("bazelgeuse",          "bazelgeuse"),
    ("chatacabra",          "chatacabra"),
    ("arzuros",             "arzuros"),
    ("glavenus",            "glavenus"),
    ("chameleos",           "chameleos"),
    ("greatwroggi",         "wroggi"),
    ("bishaten",            "bishaten"),
    ("beotodus",            "beotodus"),
    ("nargacuga",           "nargacuga"),
    ("namielle",            "namielle"),
    ("garangolm",           "garangolm"),
    ("lunagaron",           "lunagaron"),
    ("espinas",             "espinas"),
    ("malzeno",             "malzeno"),
    ("quematrice",          "quematrice"),
    ("gossharag",           "gossharag"),
    ("astalos",             "astalos"),
    ("almudron",            "almudron"),
    ("seregios",            "seregios"),
    ("radobaan",            "radobaan"),
    ("banbaro",             "banbaro"),
    ("barioth",             "barioth"),
]

PARTS = [
    ("head",  "head"),
    ("chest", "chest"),
    ("arms",  "arms"),
    ("waist", "waist"),
    ("legs",  "legs"),
]


def fetch(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def extract_max_skills(html: str) -> dict[str, int]:
    """Extract max skill levels from armor page HTML."""
    skill_links = re.findall(
        r'href="/zh/skills/([^"]+)"[^>]*>\s*<p>([^<]+?)\s+Lv(\d+)</p>',
        html
    )
    max_levels: dict[str, int] = {}
    for skill_url, _name, level in skill_links:
        sid = skill_url.replace("_", "-").rstrip("/")
        lv = int(level)
        if lv > max_levels.get(sid, 0):
            max_levels[sid] = lv
    return max_levels


def load_json_data(data_dir: Path) -> dict[str, dict]:
    """Load all armor JSON files into a dict keyed by armor id."""
    id_to_item: dict[str, dict] = {}
    for part in ["head", "chest", "arms", "waist", "legs"]:
        path = data_dir / f"{part}.json"
        with open(path, encoding="utf-8") as f:
            items = json.load(f)
        for item in items:
            id_to_item[item["id"]] = item
    return id_to_item


def save_json_data(data_dir: Path, id_to_item: dict[str, dict]):
    """Write back updated items to their respective part files."""
    by_part: dict[str, list] = {p: [] for p in ["head", "chest", "arms", "waist", "legs"]}
    for item in id_to_item.values():
        by_part[item["part"]].append(item)

    for part, items in by_part.items():
        # Sort by id for stable output
        items.sort(key=lambda x: x["id"])
        path = data_dir / f"{part}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Verify armor skill levels against official website")
    parser.add_argument("--fix", action="store_true", help="Auto-fix mismatches in JSON files")
    parser.add_argument("--only", type=str, default="", help="Only verify sets whose url_key contains this string")
    args = parser.parse_args()

    data_dir = Path(__file__).parent.parent / "data" / "armor"
    id_to_item = load_json_data(data_dir)

    mismatches: list[str] = []
    missing_skills: list[str] = []   # in website but not in our data
    fixed: list[str] = []

    total = len(ARMOR_SETS) * len(PARTS)
    count = 0
    ok_count = 0

    for url_key, id_prefix in ARMOR_SETS:
        if args.only and args.only.lower() not in url_key.lower():
            count += len(PARTS)
            continue

        for part, part_url in PARTS:
            count += 1
            armor_id = f"{id_prefix}-{part}"
            url = f"{BASE_URL}/{url_key}_{part_url}"

            sys.stdout.write(f"\r[{count}/{total}] {armor_id:<35}")
            sys.stdout.flush()

            html = fetch(url)
            if html is None:
                print(f"\n  SKIP 404: {url}")
                continue

            web_skills = extract_max_skills(html)

            if not web_skills:
                print(f"\n  WARN no skills found on page: {url}")
                continue

            our_item = id_to_item.get(armor_id)
            if our_item is None:
                print(f"\n  WARN armor not in JSON: {armor_id}")
                continue

            our_skills: dict[str, int] = {s["skillId"]: s["level"] for s in our_item.get("skills", [])}

            item_ok = True

            # Check each skill the website has
            for sid, web_lv in web_skills.items():
                our_lv = our_skills.get(sid, 0)
                if our_lv < web_lv:
                    tag = "MISSING" if our_lv == 0 else "MISMATCH"
                    msg = f"  {tag}: {armor_id}  {sid}  stored={our_lv}  website={web_lv}"
                    if our_lv == 0:
                        missing_skills.append(msg)
                    else:
                        mismatches.append(msg)
                    print(f"\n{msg}")
                    item_ok = False

                    if args.fix:
                        # Update or add the skill
                        skill_list = our_item["skills"]
                        existing = next((s for s in skill_list if s["skillId"] == sid), None)
                        if existing:
                            existing["level"] = web_lv
                        else:
                            skill_list.append({"skillId": sid, "level": web_lv})
                        fixed.append(f"{armor_id} {sid} → Lv{web_lv}")

            if item_ok:
                ok_count += 1

            time.sleep(0.15)

    print()  # newline after progress

    # Save fixes
    if args.fix and fixed:
        save_json_data(data_dir, id_to_item)
        print(f"\nFixed {len(fixed)} skills:")
        for f in fixed:
            print(f"  ✓ {f}")

    # Summary
    print("\n" + "=" * 60)
    print(f"  OK       : {ok_count}")
    print(f"  MISMATCH : {len(mismatches)}")
    print(f"  MISSING  : {len(missing_skills)}")
    if mismatches:
        print("\nMismatches:")
        for m in mismatches:
            print(m)
    if missing_skills:
        print("\nMissing skills (in website, not in our data):")
        for m in missing_skills:
            print(m)
    if not mismatches and not missing_skills:
        print("\n  All armor skill levels match the official website!")
    print("=" * 60)


if __name__ == "__main__":
    main()
