#!/usr/bin/env python3
"""
Scrape all armor data from the official Monster Hunter Now website.
Outputs corrected JSON files for data/armor/*.json
"""

import urllib.request
import urllib.error
import json
import re
import time
import sys
from pathlib import Path

# Official website URL-based skill IDs → our internal skill IDs.
# The scraper extracts skill IDs from URL segments (e.g. /zh/skills/powerhouse),
# but our skills.json and the UI use a different internal naming convention.
# Keeping this map here ensures every future scrape produces correctly-named IDs
# without needing to run fix-armor-skill-ids.py as a separate manual step.
SKILL_ID_REMAP = {
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

BASE_URL = "https://monsterhunternow.com/zh/armor"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

# All armor sets: (url_key, set_id_prefix)
# url_key = used in official URL (e.g. "ore" → /zh/armor/ore_head)
# set_id_prefix = used in our JSON id field
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

PART_NAMES_ZH = {
    "head": "頭部",
    "chest": "胸部",
    "arms": "腕部",
    "waist": "腰部",
    "legs": "腿部",
}


def fetch(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def extract_title(html: str) -> str:
    m = re.search(r"<title>([^<]+?) – Monster Hunter Now</title>", html)
    return m.group(1).strip() if m else ""


def extract_set_name(html: str) -> str:
    """Extract set name from the '成套防具' section header or breadcrumb."""
    # Try to get from 相關魔物 (monster name = set name for most)
    m = re.search(r'相關魔物[^<]*</[^>]+>[^<]*<[^>]+>[^<]*<[^>]+>([^<]+)<', html)
    if m:
        return m.group(1).strip()
    return ""


def extract_armor_data(html, url_key, id_prefix, part):
    """Extract skills, driftstone slots, defense, and name from armor page HTML."""
    title = extract_title(html)
    if not title:
        return None

    # Extract defense (highest non-Lv5 value = rank 10 base)
    # Get all defense values from the table
    defense_values = re.findall(
        r'<td rowspan="\d+">\s*(\d+)\s*</td>', html
    )
    # Also try lastRow pattern
    defense_values += re.findall(
        r'<td rowspan="\d+" class="lastRow">\s*(\d+)\s*</td>', html
    )
    defense = 0
    if defense_values:
        # The last value is "10 Lv5" max, second-to-last is rank 10 base
        vals = [int(v) for v in defense_values if int(v) > 10]
        if vals:
            defense = vals[-2] if len(vals) >= 2 else vals[-1]

    # Extract skills: find all skill links in the table
    # The page shows each skill across multiple upgrade tiers — keep the MAX level per skill
    skill_links = re.findall(
        r'href="/zh/skills/([^"]+)"[^>]*>\s*<p>([^<]+?)\s+Lv(\d+)</p>',
        html
    )
    max_skill_levels: dict[str, int] = {}
    for skill_url, _skill_name, level in skill_links:
        raw_id = skill_url.replace("_", "-").rstrip("/")
        # Remap official URL-based IDs to our internal skill IDs
        skill_id = SKILL_ID_REMAP.get(raw_id, raw_id)
        lv = int(level)
        if lv > max_skill_levels.get(skill_id, 0):
            max_skill_levels[skill_id] = lv
    skills = [{"skillId": sid, "level": lv} for sid, lv in max_skill_levels.items()]

    # Extract max driftstone slots
    # Look for <p>数字</p> in the driftstone column (not "無")
    # The table structure has driftstone slots as standalone <p>N</p>
    slot_matches = re.findall(r'<p class="_fadeText_[^"]*">(\d+|無)</p>', html)
    # Also find plain <p>N</p> patterns
    slot_matches2 = re.findall(r'<p>(\d+)</p>', html)

    max_slots = 0
    for v in slot_matches + slot_matches2:
        try:
            n = int(v)
            if n > max_slots and n <= 5:  # sanity check: max 5 slots
                max_slots = n
        except ValueError:
            pass

    # Try simpler extraction for driftstone slots
    # Look for the pattern: <p>N</p> where N is 1-5 in the table rows
    if max_slots == 0:
        # Search for non-fadeText <p> with small numbers in the armor stats table
        table_section = html
        idx_start = html.find("漂移鑲嵌槽")
        idx_end = html.find("</table>", idx_start)
        if idx_start > 0 and idx_end > 0:
            table_section = html[idx_start:idx_end]
            slot_candidates = re.findall(r'<p>(\d+)</p>', table_section)
            for v in slot_candidates:
                n = int(v)
                if 1 <= n <= 5 and n > max_slots:
                    max_slots = n

    # Determine set name from the page
    # Extract from the header breadcrumb or 相關魔物 field
    set_name = ""
    m = re.search(r'相關魔物[^<]*</\w+>\s*<[^>]+>\s*<[^>]+>([^<]+)<', html)
    if m:
        set_name = m.group(1).strip()

    # For setName, try different patterns
    if not set_name:
        m = re.search(r'"monster"[^>]*>([^<]+)<', html)
        if m:
            set_name = m.group(1).strip()

    return {
        "id": f"{id_prefix}-{part}",
        "name": title,
        "nameEn": "",
        "setName": set_name,
        "setNameEn": "",
        "part": part,
        "defense": defense,
        "skills": skills,
        "driftstoneSlots": max_slots,
        "image": "",
    }


def scrape_all():
    results: dict[str, list] = {
        "head": [], "chest": [], "arms": [], "waist": [], "legs": []
    }

    total = len(ARMOR_SETS) * len(PARTS)
    count = 0

    for url_key, id_prefix in ARMOR_SETS:
        for part, part_url in PARTS:
            count += 1
            url = f"{BASE_URL}/{url_key}_{part_url}"
            sys.stdout.write(f"\r[{count}/{total}] {url_key}_{part_url}  ")
            sys.stdout.flush()

            html = fetch(url)
            if html is None:
                print(f"\n  SKIP 404: {url}")
                continue

            data = extract_armor_data(html, url_key, id_prefix, part)
            if data:
                results[part].append(data)
            else:
                print(f"\n  WARN no data: {url}")

            time.sleep(0.15)  # polite delay

    print("\nDone scraping!")
    return results


def main():
    out_dir = Path(__file__).parent.parent / "data" / "armor"
    print(f"Output dir: {out_dir}")

    results = scrape_all()

    for part, items in results.items():
        out_path = out_dir / f"{part}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"Wrote {len(items)} items to {out_path}")

    # Print skills collected for reference
    all_skills = {}
    for items in results.values():
        for item in items:
            for s in item.get("skills", []):
                sid = s["skillId"]
                if sid not in all_skills:
                    all_skills[sid] = s["level"]

    print("\n--- Skills found ---")
    for sid in sorted(all_skills):
        print(f"  {sid}")

    # Also save raw skill list
    skills_path = Path(__file__).parent / "scraped-skills.json"
    with open(skills_path, "w", encoding="utf-8") as f:
        json.dump(sorted(all_skills.keys()), f, ensure_ascii=False, indent=2)
    print(f"\nSaved skill IDs to {skills_path}")


if __name__ == "__main__":
    main()
