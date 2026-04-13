#!/usr/bin/env python3
"""Post-process scraped armor JSON to fix setName/setNameEn fields."""

import json
from pathlib import Path

# url_key → (setNameZh, setNameEn)
SET_NAMES = {
    "ore":                ("皮製",   "Leather"),
    "alloy":              ("合金",   "Alloy"),
    "greatjagras":        ("凶豺龍", "Great Jagras"),
    "kuluyaku":           ("搔鳥",   "Kulu-Ya-Ku"),
    "pukeipukei":         ("毒妖鳥", "Pukei-Pukei"),
    "coral_pukeipukei":   ("妖水",   "Coral Pukei-Pukei"),
    "barroth":            ("土砂龍", "Barroth"),
    "greatgirros":        ("凶顎龍", "Great Girros"),
    "tobikadachi":        ("飛雷龍", "Tobi-Kadachi"),
    "viper_tobikadachi":  ("朱毒",   "Viper Tobi-Kadachi"),
    "paolumu":            ("浮空龍", "Paolumu"),
    "nightshade_paolumu": ("浮夢",   "Nightshade Paolumu"),
    "jyuratodus":         ("泥魚龍", "Jyuratodus"),
    "anjanath":           ("蠻顎龍", "Anjanath"),
    "fulgur_anjanath":    ("雷顎",   "Fulgur Anjanath"),
    "rathian":            ("雌火龍", "Rathian"),
    "pink_rathian":       ("火龍心", "Pink Rathian"),
    "gold_rathian":       ("金黃澄月","Gold Rathian"),
    "legiana":            ("風漂龍", "Legiana"),
    "diablos":            ("角龍",   "Diablos"),
    "black_diablos":      ("暴君角龍","Black Diablos"),
    "rathalos":           ("火龍",   "Rathalos"),
    "azure_rathalos":     ("火龍魂", "Azure Rathalos"),
    "silver_rathalos":    ("銀白耀日","Silver Rathalos"),
    "zinogre":            ("雷狼龍", "Zinogre"),
    "tzitziyaku":         ("眩鳥",   "Tzitzi-Ya-Ku"),
    "odogaron":           ("慘爪龍", "Odogaron"),
    "ebony_odogaron":     ("亡爪",   "Ebony Odogaron"),
    "deviljho":           ("恐暴龍", "Deviljho"),
    "basarios":           ("岩龍",   "Basarios"),
    "khezu":              ("奇怪龍", "Khezu"),
    "kushaladaora":       ("鋼龍",   "Kushala Daora"),
    "mizutsune":          ("泡狐龍", "Mizutsune"),
    "teostra":            ("帝王",   "Teostra"),
    "aknosom":            ("傘鳥",   "Aknosom"),
    "magnamalo":          ("禍鎧",   "Magnamalo"),
    "rajang":             ("金色",   "Rajang"),
    "nergigante":         ("戰紋",   "Nergigante"),
    "lagombi":            ("白兔獸", "Lagombi"),
    "volvidon":           ("赤甲獸", "Volvidon"),
    "somnacanth":         ("人魚龍", "Somnacanth"),
    "tigrex":             ("轟龍",   "Tigrex"),
    "brute_tigrex":       ("轟吼",   "Brute Tigrex"),
    "kirin":              ("麒麟",   "Kirin"),
    "bazelgeuse":         ("爆鱗龍", "Bazelgeuse"),
    "chatacabra":         ("纏蛙",   "Chatacabra"),
    "arzuros":            ("青熊獸", "Arzuros"),
    "glavenus":           ("斬龍",   "Glavenus"),
    "chameleos":          ("霞龍",   "Chameleos"),
    "greatwroggi":        ("毒狗龍", "Great Wroggi"),
    "bishaten":           ("天狗獸", "Bishaten"),
    "beotodus":           ("冰魚龍", "Beotodus"),
    "nargacuga":          ("迅龍",   "Nargacuga"),
    "namielle":           ("觸角",   "Namielle"),
    "garangolm":          ("剛纏獸", "Garangolm"),
    "lunagaron":          ("冰狼龍", "Lunagaron"),
    "espinas":            ("棘龍",   "Espinas"),
    "malzeno":            ("爵銀龍", "Malzeno"),
    "quematrice":         ("炎尾龍", "Quematrice"),
    "gossharag":          ("雪鬼獸", "Gossharag"),
    "astalos":            ("電龍",   "Astalos"),
    "almudron":           ("泥翁龍", "Almudron"),
    "seregios":           ("千刃龍", "Seregios"),
    "radobaan":           ("骨鎚龍", "Radobaan"),
    "banbaro":            ("猛牛龍", "Banbaro"),
    "barioth":            ("冰牙龍", "Barioth"),
}

# id_prefix → url_key (reverse map from scrape-armor.py)
PREFIX_TO_KEY = {
    "leather":              "ore",
    "alloy":                "alloy",
    "jagras":               "greatjagras",
    "kulu":                 "kuluyaku",
    "pukei":                "pukeipukei",
    "coral-pukei":          "coral_pukeipukei",
    "barroth":              "barroth",
    "girros":               "greatgirros",
    "kadachi":              "tobikadachi",
    "viper-kadachi":        "viper_tobikadachi",
    "paolumu":              "paolumu",
    "nightshade-paolumu":   "nightshade_paolumu",
    "jyuratodus":           "jyuratodus",
    "anjanath":             "anjanath",
    "fulgur-anjanath":      "fulgur_anjanath",
    "rathian":              "rathian",
    "pink-rathian":         "pink_rathian",
    "gold-rathian":         "gold_rathian",
    "legiana":              "legiana",
    "diablos":              "diablos",
    "black-diablos":        "black_diablos",
    "rathalos":             "rathalos",
    "azure-rathalos":       "azure_rathalos",
    "silver-rathalos":      "silver_rathalos",
    "zinogre":              "zinogre",
    "tzitzi":               "tzitziyaku",
    "odogaron":             "odogaron",
    "ebony-odogaron":       "ebony_odogaron",
    "vangis":               "deviljho",
    "basarios":             "basarios",
    "khezu":                "khezu",
    "kushala":              "kushaladaora",
    "mizutsune":            "mizutsune",
    "kaiser":               "teostra",
    "aknosom":              "aknosom",
    "sinister":             "magnamalo",
    "rajang":               "rajang",
    "nergigante":           "nergigante",
    "lagombi":              "lagombi",
    "volvidon":             "volvidon",
    "somnacanth":           "somnacanth",
    "tigrex":               "tigrex",
    "brute-tigrex":         "brute_tigrex",
    "kirin":                "kirin",
    "bazelgeuse":           "bazelgeuse",
    "chatacabra":           "chatacabra",
    "arzuros":              "arzuros",
    "glavenus":             "glavenus",
    "chameleos":            "chameleos",
    "wroggi":               "greatwroggi",
    "bishaten":             "bishaten",
    "beotodus":             "beotodus",
    "nargacuga":            "nargacuga",
    "namielle":             "namielle",
    "garangolm":            "garangolm",
    "lunagaron":            "lunagaron",
    "espinas":              "espinas",
    "malzeno":              "malzeno",
    "quematrice":           "quematrice",
    "gossharag":            "gossharag",
    "astalos":              "astalos",
    "almudron":             "almudron",
    "seregios":             "seregios",
    "radobaan":             "radobaan",
    "banbaro":              "banbaro",
    "barioth":              "barioth",
}


def get_id_prefix(item_id: str) -> str:
    """Extract prefix from id like 'leather-head' → 'leather'"""
    for prefix in PREFIX_TO_KEY:
        suffix = "-" + item_id[len(prefix):].lstrip("-").split("-")[0]
        if item_id.startswith(prefix + "-"):
            return prefix
    # fallback: everything before the last hyphen-part
    parts = item_id.rsplit("-", 1)
    return parts[0]


def process_file(path: Path):
    items = json.loads(path.read_text(encoding="utf-8"))
    for item in items:
        item_id = item["id"]
        # Extract prefix: id is like "leather-head", "sinister-waist", etc.
        # prefix = everything except the last part (head/chest/arms/waist/legs)
        prefix = "-".join(item_id.split("-")[:-1])
        url_key = PREFIX_TO_KEY.get(prefix)
        if url_key and url_key in SET_NAMES:
            zh, en = SET_NAMES[url_key]
            item["setName"] = zh
            item["setNameEn"] = en
        else:
            print(f"  WARNING: no mapping for id={item_id!r}, prefix={prefix!r}")

    path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Fixed {len(items)} items in {path.name}")


def main():
    data_dir = Path(__file__).parent.parent / "data" / "armor"
    for part in ["head", "chest", "arms", "waist", "legs"]:
        process_file(data_dir / f"{part}.json")


if __name__ == "__main__":
    main()
