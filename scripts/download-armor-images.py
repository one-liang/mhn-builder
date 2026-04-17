#!/usr/bin/env python3
"""
從 Monster Hunter Now 官網下載防具圖示，並更新 data/armor/*.json 的 image 欄位。

Usage:
  python3 scripts/download-armor-images.py
  python3 scripts/download-armor-images.py --force    # 強制覆蓋已存在的圖片
  python3 scripts/download-armor-images.py --dry-run  # 僅模擬，不實際寫入
"""

import urllib.request
import urllib.error
import json
import re
import time
import sys
import argparse
from pathlib import Path
from typing import Dict, Optional

BASE_URL = "https://monsterhunternow.com/zh/armor"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
IMG_SUFFIX = "=s128-rw"  # Google CDN 128px WebP

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "public" / "images" / "armor"
DATA_DIR = ROOT / "data" / "armor"

# 防具套裝列表：(url_key, set_id_prefix)
# url_key = 官方 URL 使用的 key（如 "ore" → /zh/armor/ore_head）
# set_id_prefix = 專案 JSON 的 id 前綴（如 "leather" → id: "leather-head"）
ARMOR_SETS = [
    ("ore",                "leather"),
    ("alloy",              "alloy"),
    ("greatjagras",        "jagras"),
    ("kuluyaku",           "kulu"),
    ("pukeipukei",         "pukei"),
    ("coral_pukeipukei",   "coral-pukei"),
    ("barroth",            "barroth"),
    ("greatgirros",        "girros"),
    ("tobikadachi",        "kadachi"),
    ("viper_tobikadachi",  "viper-kadachi"),
    ("paolumu",            "paolumu"),
    ("nightshade_paolumu", "nightshade-paolumu"),
    ("jyuratodus",         "jyuratodus"),
    ("anjanath",           "anjanath"),
    ("fulgur_anjanath",    "fulgur-anjanath"),
    ("rathian",            "rathian"),
    ("pink_rathian",       "pink-rathian"),
    ("gold_rathian",       "gold-rathian"),
    ("legiana",            "legiana"),
    ("diablos",            "diablos"),
    ("black_diablos",      "black-diablos"),
    ("rathalos",           "rathalos"),
    ("azure_rathalos",     "azure-rathalos"),
    ("silver_rathalos",    "silver-rathalos"),
    ("zinogre",            "zinogre"),
    ("tzitziyaku",         "tzitzi"),
    ("odogaron",           "odogaron"),
    ("ebony_odogaron",     "ebony-odogaron"),
    ("deviljho",           "vangis"),
    ("basarios",           "basarios"),
    ("khezu",              "khezu"),
    ("kushaladaora",       "kushala"),
    ("mizutsune",          "mizutsune"),
    ("teostra",            "kaiser"),
    ("aknosom",            "aknosom"),
    ("magnamalo",          "sinister"),
    ("rajang",             "rajang"),
    ("nergigante",         "nergigante"),
    ("lagombi",            "lagombi"),
    ("volvidon",           "volvidon"),
    ("somnacanth",         "somnacanth"),
    ("tigrex",             "tigrex"),
    ("brute_tigrex",       "brute-tigrex"),
    ("kirin",              "kirin"),
    ("bazelgeuse",         "bazelgeuse"),
    ("chatacabra",         "chatacabra"),
    ("arzuros",            "arzuros"),
    ("glavenus",           "glavenus"),
    ("chameleos",          "chameleos"),
    ("greatwroggi",        "wroggi"),
    ("bishaten",           "bishaten"),
    ("beotodus",           "beotodus"),
    ("nargacuga",          "nargacuga"),
    ("namielle",           "namielle"),
    ("garangolm",          "garangolm"),
    ("lunagaron",          "lunagaron"),
    ("espinas",            "espinas"),
    ("malzeno",            "malzeno"),
    ("quematrice",         "quematrice"),
    ("gossharag",          "gossharag"),
    ("astalos",            "astalos"),
    ("almudron",           "almudron"),
    ("seregios",           "seregios"),
    ("radobaan",           "radobaan"),
    ("banbaro",            "banbaro"),
    ("barioth",            "barioth"),
]

PARTS = ["head", "chest", "arms", "waist", "legs"]


def fetch_html(url: str) -> Optional[str]:
    """抓取頁面 HTML，404 回傳 None，其他錯誤重試 2 次。"""
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if attempt == 2:
                raise
            time.sleep(1)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1)
    return None


def extract_set_images(html: str, url_key: str) -> Dict[str, str]:
    """
    從 _head 頁面提取整套 5 件防具的圖片 base URL。
    回傳 {part: base_url}，最多 5 個 part。
    """
    images: Dict[str, str] = {}

    # 1. 提取主要 512×512 圖片 → head 部位
    m512 = re.search(
        r'<img\s[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"[^>]*width="512"[^>]*height="512"',
        html
    )
    if not m512:
        # 嘗試反過來的屬性順序
        m512 = re.search(
            r'<img\s[^>]*width="512"[^>]*height="512"[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"',
            html
        )
    if m512:
        base_url = re.sub(r'=[^=]*$', '', m512.group(1))  # 移除現有的 size 參數
        images["head"] = base_url

    # 2. 從 512px 圖片之後的 HTML 提取其餘 4 個部位（80×80）
    start = m512.end() if m512 else 0
    suffix = html[start:]

    # 掃描 part 連結和 80×80 圖片，按位置配對
    link_pattern = re.compile(
        r'href="/zh/armor/' + re.escape(url_key) + r'_([a-z]+)"'
    )
    img_pattern = re.compile(
        r'<img\s[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"[^>]*width="80"[^>]*height="80"'
        r'|<img\s[^>]*width="80"[^>]*height="80"[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"'
    )

    events = []  # (pos, type, value)
    for m in link_pattern.finditer(suffix):
        events.append((m.start(), "link", m.group(1)))
    for m in img_pattern.finditer(suffix):
        src = m.group(1) or m.group(2)
        events.append((m.start(), "img", src))

    events.sort(key=lambda e: e[0])

    # 連結緊接圖片 → 配對
    pending_part: Optional[str] = None
    for _, etype, value in events:
        if etype == "link":
            pending_part = value
        elif etype == "img" and pending_part:
            if pending_part not in images:
                base_url = re.sub(r'=[^=]*$', '', value)
                images[pending_part] = base_url
            pending_part = None

    return images


def download_image(base_url: str, dest: Path, force: bool, dry_run: bool) -> bool:
    """下載 WebP 圖片並驗證格式。回傳是否成功。"""
    if dest.exists() and not force:
        return True  # 已存在，跳過

    url = base_url + IMG_SUFFIX
    if dry_run:
        print(f"      [dry-run] 會下載 {dest.name}")
        return True

    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                data = r.read()
            # 驗證：WebP 開頭為 RIFF....WEBP 或直接 image bytes
            if len(data) < 4:
                return False
            # WebP: RIFF (52 49 46 46) 或 Google CDN 可能回傳 JPEG/PNG
            # 只要有內容且不為 HTML 錯誤頁（<html）即可接受
            if data[:4] == b'<htm' or data[:4] == b'<!DO':
                return False
            dest.write_bytes(data)
            return True
        except Exception:
            if attempt == 2:
                return False
            time.sleep(0.5)
    return False


def update_json(part_name: str, image_map: dict[str, str], dry_run: bool) -> int:
    """
    更新 data/armor/{part_name}.json 的 image 欄位。
    image_map: {armor_id: "/images/armor/{id}.webp"}
    回傳更新筆數。
    """
    path = DATA_DIR / f"{part_name}.json"
    items = json.loads(path.read_text(encoding="utf-8"))
    updated = 0
    for item in items:
        if item["id"] in image_map:
            item["image"] = image_map[item["id"]]
            updated += 1
    if not dry_run:
        path.write_text(
            json.dumps(items, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8"
        )
    return updated


def main():
    parser = argparse.ArgumentParser(description="下載 MHN 防具圖示並更新 JSON")
    parser.add_argument("--force", action="store_true", help="強制覆蓋已存在的圖片")
    parser.add_argument("--dry-run", action="store_true", help="僅模擬，不實際寫入")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"=== 防具圖示下載器 ===")
    print(f"目標目錄：{OUT_DIR}")
    if args.dry_run:
        print("[dry-run 模式：不會實際寫入任何檔案]")
    print()

    # ── Phase 1：抓取頁面，提取圖片 URL ────────────────────────────────────
    print(f"Phase 1：抓取 {len(ARMOR_SETS)} 個套裝頁面...")
    set_images: Dict[str, Dict[str, str]] = {}  # {prefix: {part: base_url}}
    skipped: list[str] = []

    for i, (url_key, prefix) in enumerate(ARMOR_SETS, 1):
        url = f"{BASE_URL}/{url_key}_head"
        print(f"  [{i:2d}/{len(ARMOR_SETS)}] {url_key}_head ... ", end="", flush=True)

        html = fetch_html(url)
        if html is None:
            print("404 SKIP")
            skipped.append(url_key)
            continue

        images = extract_set_images(html, url_key)
        found_parts = list(images.keys())
        print(f"找到 {len(images)}/5 件：{', '.join(found_parts)}")

        if images:
            set_images[prefix] = images

        time.sleep(0.15)

    print(f"\n  完成：{len(set_images)} 套裝有圖片，{len(skipped)} 套裝跳過")
    if skipped:
        print(f"  跳過：{', '.join(skipped)}")

    # ── Phase 2：下載圖片 ──────────────────────────────────────────────────
    total_expected = sum(len(v) for v in set_images.values())
    print(f"\nPhase 2：下載 {total_expected} 張圖片...")

    downloaded = 0
    already_exist = 0
    failed: list[str] = []

    for prefix, parts in set_images.items():
        for part, base_url in parts.items():
            armor_id = f"{prefix}-{part}"
            dest = OUT_DIR / f"{armor_id}.webp"

            existed = dest.exists() and not args.force
            ok = download_image(base_url, dest, args.force, args.dry_run)

            if ok:
                if existed:
                    already_exist += 1
                else:
                    downloaded += 1
                    print(f"  ✓ {armor_id}.webp")
            else:
                failed.append(armor_id)
                print(f"  ✗ {armor_id} 下載失敗")

            time.sleep(0.05)

    print(f"\n  新下載：{downloaded} 張")
    print(f"  已存在跳過：{already_exist} 張")
    print(f"  失敗：{len(failed)} 張")
    if failed:
        print(f"  失敗列表：{', '.join(failed)}")

    # ── Phase 3：更新 JSON ─────────────────────────────────────────────────
    print(f"\nPhase 3：更新 data/armor/*.json ...")

    # 建立 image_map：只有成功下載（或已存在）的才填入
    image_map: Dict[str, str] = {}
    for prefix, parts in set_images.items():
        for part in parts:
            armor_id = f"{prefix}-{part}"
            dest = OUT_DIR / f"{armor_id}.webp"
            if dest.exists() or args.dry_run:
                image_map[armor_id] = f"/images/armor/{armor_id}.webp"

    total_json_updated = 0
    for part_name in PARTS:
        count = update_json(part_name, image_map, args.dry_run)
        print(f"  {part_name}.json：更新 {count} 筆")
        total_json_updated += count

    # ── Phase 4：總結 ──────────────────────────────────────────────────────
    print(f"\n=== 完成 ===")
    print(f"  圖片下載：{downloaded + already_exist}/{total_expected} 張成功")
    print(f"  JSON 更新：{total_json_updated}/330 筆")
    if failed:
        print(f"  注意：{len(failed)} 張圖片下載失敗，對應防具將維持無圖片狀態")
    if args.dry_run:
        print("  [dry-run 模式：以上均為模擬結果，未實際寫入]")


if __name__ == "__main__":
    main()
