#!/usr/bin/env python3
"""
從 Monster Hunter Now 官網下載魔物 icon（防具套裝對應魔物的縮圖）。
輸出至 public/images/monsters/{url_key}.webp

皮製（ore）和合金（alloy）使用 gamewith.jp 的備用 URL。
其他套裝從 /zh/armor/{url_key}_head 頁面的 lh3.googleusercontent.com 圖片提取。

Usage:
  python3 scripts/download-monster-icons.py
  python3 scripts/download-monster-icons.py --force    # 強制覆蓋已存在的圖片
  python3 scripts/download-monster-icons.py --dry-run  # 僅模擬，不實際寫入
"""

import urllib.request
import urllib.error
import json
import re
import time
import argparse
from pathlib import Path
from typing import Optional

BASE_ARMOR_URL = "https://monsterhunternow.com/zh/armor"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
IMG_SUFFIX = "=s128-rw"  # Google CDN 128px WebP

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "public" / "images" / "monsters"

# url_key → 備用 URL（特殊套裝）
SPECIAL_URLS: dict[str, str] = {
    "ore":   "https://img.gamewith.jp/img/2cd7364cb02731c84e91468986196d1f.png",
    "alloy": "https://img.gamewith.jp/img/8b6c1047bca1d6e1e9cc66f24f0274e5.png",
}

# 所有防具套裝的 url_key（與 scrape-armor.py 一致）
ARMOR_SETS = [
    "ore",
    "alloy",
    "greatjagras",
    "kuluyaku",
    "pukeipukei",
    "coral_pukeipukei",
    "barroth",
    "greatgirros",
    "tobikadachi",
    "viper_tobikadachi",
    "paolumu",
    "nightshade_paolumu",
    "jyuratodus",
    "anjanath",
    "fulgur_anjanath",
    "rathian",
    "pink_rathian",
    "gold_rathian",
    "legiana",
    "diablos",
    "black_diablos",
    "rathalos",
    "azure_rathalos",
    "silver_rathalos",
    "zinogre",
    "tzitziyaku",
    "odogaron",
    "ebony_odogaron",
    "deviljho",
    "basarios",
    "khezu",
    "kushaladaora",
    "mizutsune",
    "teostra",
    "aknosom",
    "magnamalo",
    "rajang",
    "nergigante",
    "lagombi",
    "volvidon",
    "somnacanth",
    "tigrex",
    "brute_tigrex",
    "kirin",
    "bazelgeuse",
    "chatacabra",
    "arzuros",
    "glavenus",
    "chameleos",
    "greatwroggi",
    "bishaten",
    "beotodus",
    "nargacuga",
    "namielle",
    "garangolm",
    "lunagaron",
    "espinas",
    "malzeno",
    "quematrice",
    "gossharag",
    "astalos",
    "almudron",
    "seregios",
    "radobaan",
    "banbaro",
    "barioth",
]


def fetch_html(url: str) -> Optional[str]:
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


def extract_monster_icon_url(html: str) -> Optional[str]:
    """
    從防具頁面提取魔物 icon URL（在「相關魔物」區塊附近的圖片）。
    魔物圖示通常是頁面上方的一個 64~256px 的 lh3.googleusercontent.com 圖片。
    """
    # 搜尋頁面中所有 Google CDN 圖片，取第一個小尺寸圖（通常是魔物 icon）
    # 魔物 icon 的 width 通常是 64 或 80
    patterns = [
        # width="64" height="64"
        r'<img\s[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"[^>]*width="64"[^>]*height="64"',
        r'<img\s[^>]*width="64"[^>]*height="64"[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"',
        # width="80" height="80"
        r'<img\s[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"[^>]*width="80"[^>]*height="80"',
        r'<img\s[^>]*width="80"[^>]*height="80"[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"',
        # 任何 lh3 圖（最後手段）
        r'src="(https://lh3\.googleusercontent\.com/[^"=]+=[^"]*)"',
    ]

    for pattern in patterns:
        m = re.search(pattern, html)
        if m:
            url = m.group(1)
            base = re.sub(r'=[^=]*$', '', url)
            return base

    return None


def download_image(url: str, dest: Path, force: bool, dry_run: bool) -> bool:
    if dest.exists() and not force:
        return True
    if dry_run:
        return True
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                data = r.read()
            if len(data) < 100 or data[:4] in (b'<htm', b'<!DO'):
                return False
            dest.write_bytes(data)
            return True
        except Exception:
            if attempt == 2:
                return False
            time.sleep(0.5)
    return False


def main():
    parser = argparse.ArgumentParser(description="下載 MHN 魔物 icon 並儲存至 public/images/monsters/")
    parser.add_argument("--force", action="store_true", help="強制覆蓋已存在的圖片")
    parser.add_argument("--dry-run", action="store_true", help="僅模擬，不實際寫入")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=== 魔物 icon 下載器 ===")
    print(f"目標目錄：{OUT_DIR}")
    if args.dry_run:
        print("[dry-run 模式：不會實際寫入任何檔案]")
    print()

    downloaded = 0
    already_exist = 0
    failed: list[str] = []

    total = len(ARMOR_SETS)
    for i, url_key in enumerate(ARMOR_SETS, 1):
        dest = OUT_DIR / f"{url_key}.webp"
        existed = dest.exists() and not args.force

        print(f"[{i:2d}/{total}] {url_key} ... ", end="", flush=True)

        # 特殊套裝：使用備用 URL
        if url_key in SPECIAL_URLS:
            special_url = SPECIAL_URLS[url_key]
            if existed:
                print("已存在，跳過")
                already_exist += 1
                continue
            ok = download_image(special_url, dest, args.force, args.dry_run)
            if ok:
                downloaded += 1
                print("✓ (gamewith)")
            else:
                failed.append(url_key)
                print("✗ 下載失敗")
            time.sleep(0.1)
            continue

        # 一般套裝：從防具頁面提取 Google CDN URL
        if existed:
            print("已存在，跳過")
            already_exist += 1
            continue

        page_url = f"{BASE_ARMOR_URL}/{url_key}_head"
        html = fetch_html(page_url)
        if html is None:
            print("404 SKIP")
            failed.append(url_key)
            continue

        icon_base = extract_monster_icon_url(html)
        if not icon_base:
            print("無法提取圖片 URL")
            failed.append(url_key)
            time.sleep(0.15)
            continue

        icon_url = icon_base + IMG_SUFFIX
        ok = download_image(icon_url, dest, args.force, args.dry_run)
        if ok:
            downloaded += 1
            print("✓")
        else:
            failed.append(url_key)
            print("✗ 下載失敗")

        time.sleep(0.15)

    print(f"\n=== 完成 ===")
    print(f"  新下載：{downloaded} 張")
    print(f"  已存在跳過：{already_exist} 張")
    print(f"  失敗：{len(failed)} 張")
    if failed:
        print(f"  失敗列表：{', '.join(failed)}")
    if args.dry_run:
        print("  [dry-run 模式：以上均為模擬結果，未實際寫入]")


if __name__ == "__main__":
    main()
