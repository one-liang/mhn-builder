#!/usr/bin/env python3
"""
從 Monster Hunter Now 官網下載武器圖示，並更新 data/weapons/*.json 的 image 欄位。

策略：
  每個怪物有 14 種武器（ore_greatsword, ore_longsword...）。
  抓代表武器頁，從 512px hero 圖取得當前武器圖示，
  從旁邊的 80px 縮圖取得同怪物其他類型武器的圖示。
  預估 ~47 次請求即可取得全部 659 張圖片。

Usage:
  python3 scripts/download-weapon-images.py
  python3 scripts/download-weapon-images.py --force    # 強制覆蓋已存在的圖片
  python3 scripts/download-weapon-images.py --dry-run  # 僅模擬，不實際寫入
  python3 scripts/download-weapon-images.py --fallback # 強制使用逐一抓取模式（659次）
"""

import urllib.request
import urllib.error
import json
import re
import time
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple

BASE_WEAPON_URL = "https://monsterhunternow.com/zh/weapons"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
IMG_SUFFIX = "=s128-rw"  # Google CDN 128px WebP

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "public" / "images" / "weapons"
DATA_DIR = ROOT / "data" / "weapons"

# 武器類型後綴 → 對應的 JSON 檔名（slug）
# 按長度降序排列，確保最長匹配優先
TYPE_SUFFIXES: List[Tuple[str, str]] = sorted([
    ("greatsword",   "great-sword"),
    ("longsword",    "long-sword"),
    ("swordshield",  "sword-and-shield"),
    ("dualblades",   "dual-blades"),
    ("hammer",       "hammer"),
    ("huntinghorn",  "hunting-horn"),
    ("lance",        "lance"),
    ("gunlance",     "gunlance"),
    ("switchaxe",    "switch-axe"),
    ("chargeblade",  "charge-blade"),
    ("insectglaive", "insect-glaive"),
    ("lightbowgun",  "light-bowgun"),
    ("heavybowgun",  "heavy-bowgun"),
    ("bow",          "bow"),
], key=lambda x: len(x[0]), reverse=True)

TYPE_SUFFIX_SET = {s for s, _ in TYPE_SUFFIXES}
SUFFIX_TO_SLUG = {s: slug for s, slug in TYPE_SUFFIXES}


def get_monster_prefix(weapon_id: str) -> Optional[str]:
    """從武器 ID 提取怪物前綴。
    e.g. "ore_greatsword" → "ore"
         "coral_pukeipukei_greatsword" → "coral_pukeipukei"
    """
    for suffix, _ in TYPE_SUFFIXES:
        if weapon_id == suffix:
            return None  # 無前綴（不應存在）
        if weapon_id.endswith("_" + suffix):
            prefix = weapon_id[: -(len(suffix) + 1)]
            return prefix
    return None


def load_all_weapons() -> Dict[str, List[dict]]:
    """從 data/weapons/*.json 讀取所有武器，回傳 {type_slug: [weapon...]}"""
    all_weapons: Dict[str, List[dict]] = {}
    for suffix, slug in TYPE_SUFFIXES:
        path = DATA_DIR / f"{slug}.json"
        if path.exists():
            all_weapons[slug] = json.loads(path.read_text(encoding="utf-8"))
    return all_weapons


def group_by_monster(all_weapons: Dict[str, List[dict]]) -> Dict[str, List[str]]:
    """按怪物前綴分組，回傳 {monster_prefix: [weapon_id...]}"""
    groups: Dict[str, List[str]] = {}
    for slug, weapons in all_weapons.items():
        for w in weapons:
            prefix = get_monster_prefix(w["id"])
            if prefix:
                if prefix not in groups:
                    groups[prefix] = []
                groups[prefix].append(w["id"])
    return groups


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


def extract_weapon_images(html: str, representative_id: str) -> Dict[str, str]:
    """
    從武器頁面提取所有可見武器的圖片 base URL。
    回傳 {weapon_id: base_url}
    """
    images: Dict[str, str] = {}

    # 1. 提取 512px hero 圖 → 當前武器（representative_id）
    m512 = re.search(
        r'<img\s[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"[^>]*width="512"[^>]*height="512"',
        html
    )
    if not m512:
        m512 = re.search(
            r'<img\s[^>]*width="512"[^>]*height="512"[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"',
            html
        )
    if m512:
        base_url = re.sub(r'=[^=]*$', '', m512.group(1))
        images[representative_id] = base_url

    # 2. 從 512px 圖片之後的 HTML 提取同怪物其他武器（80px 縮圖）
    start = m512.end() if m512 else 0
    suffix_html = html[start:]

    link_pattern = re.compile(r'href="/zh/weapons/([a-z][a-z0-9_]+)"')
    img_pattern = re.compile(
        r'<img\s[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"[^>]*width="80"[^>]*height="80"'
        r'|<img\s[^>]*width="80"[^>]*height="80"[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+)"'
    )

    events = []
    for m in link_pattern.finditer(suffix_html):
        wid = m.group(1)
        # 只收集有效武器 ID（有已知後綴）
        if get_monster_prefix(wid) is not None or wid in TYPE_SUFFIX_SET:
            events.append((m.start(), "link", wid))
    for m in img_pattern.finditer(suffix_html):
        src = m.group(1) or m.group(2)
        events.append((m.start(), "img", src))

    events.sort(key=lambda e: e[0])

    pending_weapon: Optional[str] = None
    for _, etype, value in events:
        if etype == "link":
            pending_weapon = value
        elif etype == "img" and pending_weapon:
            if pending_weapon not in images:
                base_url = re.sub(r'=[^=]*$', '', value)
                images[pending_weapon] = base_url
            pending_weapon = None

    return images


def download_image(base_url: str, dest: Path, force: bool, dry_run: bool) -> bool:
    if dest.exists() and not force:
        return True
    url = base_url + IMG_SUFFIX
    if dry_run:
        return True
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                data = r.read()
            if len(data) < 4 or data[:4] in (b'<htm', b'<!DO'):
                return False
            dest.write_bytes(data)
            return True
        except Exception:
            if attempt == 2:
                return False
            time.sleep(0.5)
    return False


def update_json(type_slug: str, image_map: Dict[str, str], dry_run: bool) -> int:
    path = DATA_DIR / f"{type_slug}.json"
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
    parser = argparse.ArgumentParser(description="下載 MHN 武器圖示並更新 JSON")
    parser.add_argument("--force", action="store_true", help="強制覆蓋已存在的圖片")
    parser.add_argument("--dry-run", action="store_true", help="僅模擬，不實際寫入")
    parser.add_argument("--fallback", action="store_true", help="強制使用逐一抓取模式（659次請求）")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=== 武器圖示下載器 ===")
    print(f"目標目錄：{OUT_DIR}")
    if args.dry_run:
        print("[dry-run 模式：不會實際寫入任何檔案]")
    print()

    # ── 載入所有武器資料 ────────────────────────────────────────────────────
    all_weapons = load_all_weapons()
    total_weapons = sum(len(v) for v in all_weapons.values())
    print(f"讀取武器資料：{total_weapons} 件（{len(all_weapons)} 種類型）")

    # ── 整理所有武器 ID 與按怪物分組 ────────────────────────────────────────
    all_weapon_ids: List[str] = []
    for slug in all_weapons:
        for w in all_weapons[slug]:
            all_weapon_ids.append(w["id"])

    groups = group_by_monster(all_weapons)
    print(f"怪物前綴分組：{len(groups)} 組\n")

    # ── Phase 1：抓取頁面，提取圖片 URL ────────────────────────────────────
    weapon_images: Dict[str, str] = {}  # {weapon_id: base_url}

    if args.fallback:
        # 備用：逐一抓取每個武器頁面
        print(f"Phase 1（逐一模式）：抓取 {total_weapons} 個武器頁面...")
        for i, weapon_id in enumerate(all_weapon_ids, 1):
            print(f"\r  [{i:3d}/{total_weapons}] {weapon_id}...", end="", flush=True)
            html = fetch_html(f"{BASE_WEAPON_URL}/{weapon_id}")
            if html is None:
                print(f"\n  SKIP 404: {weapon_id}")
                continue
            imgs = extract_weapon_images(html, weapon_id)
            if weapon_id in imgs:
                weapon_images[weapon_id] = imgs[weapon_id]
            time.sleep(0.15)
        print()
    else:
        # 主策略：按怪物分組，每組只抓代表頁
        print(f"Phase 1（分組模式）：抓取 {len(groups)} 個代表武器頁面...")
        fallback_ids: List[str] = []

        for i, (prefix, weapon_ids) in enumerate(groups.items(), 1):
            rep_id = weapon_ids[0]
            print(f"  [{i:2d}/{len(groups)}] {rep_id} ... ", end="", flush=True)
            html = fetch_html(f"{BASE_WEAPON_URL}/{rep_id}")
            if html is None:
                print(f"404 SKIP")
                fallback_ids.extend(weapon_ids)
                continue

            imgs = extract_weapon_images(html, rep_id)
            found = 0
            for wid in weapon_ids:
                if wid in imgs:
                    weapon_images[wid] = imgs[wid]
                    found += 1
                else:
                    fallback_ids.append(wid)

            print(f"找到 {found}/{len(weapon_ids)} 件")
            time.sleep(0.15)

        # 對未找到的武器逐一補抓
        if fallback_ids:
            print(f"\n  補抓 {len(fallback_ids)} 件未取得的武器...")
            for i, weapon_id in enumerate(fallback_ids, 1):
                if weapon_id in weapon_images:
                    continue  # 已有了
                print(f"  [{i:3d}/{len(fallback_ids)}] {weapon_id}...", end="", flush=True)
                html = fetch_html(f"{BASE_WEAPON_URL}/{weapon_id}")
                if html is None:
                    print(" 404 SKIP")
                    continue
                imgs = extract_weapon_images(html, weapon_id)
                if weapon_id in imgs:
                    weapon_images[weapon_id] = imgs[weapon_id]
                    print(" ✓")
                else:
                    print(" 無圖")
                time.sleep(0.15)

    print(f"\n  取得圖片 URL：{len(weapon_images)}/{total_weapons} 件")

    # ── Phase 2：下載圖片 ──────────────────────────────────────────────────
    print(f"\nPhase 2：下載 {len(weapon_images)} 張圖片...")
    downloaded = 0
    already_exist = 0
    failed: List[str] = []

    for weapon_id, base_url in weapon_images.items():
        dest = OUT_DIR / f"{weapon_id}.webp"
        existed = dest.exists() and not args.force
        ok = download_image(base_url, dest, args.force, args.dry_run)
        if ok:
            if existed:
                already_exist += 1
            else:
                downloaded += 1
                print(f"  ✓ {weapon_id}.webp")
        else:
            failed.append(weapon_id)
            print(f"  ✗ {weapon_id} 下載失敗")
        time.sleep(0.05)

    print(f"\n  新下載：{downloaded} 張")
    print(f"  已存在跳過：{already_exist} 張")
    print(f"  失敗：{len(failed)} 張")
    if failed:
        print(f"  失敗列表：{', '.join(failed)}")

    # ── Phase 3：更新 JSON ─────────────────────────────────────────────────
    print(f"\nPhase 3：更新 data/weapons/*.json ...")

    image_path_map: Dict[str, str] = {}
    for weapon_id in weapon_images:
        dest = OUT_DIR / f"{weapon_id}.webp"
        if dest.exists() or args.dry_run:
            image_path_map[weapon_id] = f"/images/weapons/{weapon_id}.webp"

    total_json_updated = 0
    for _, slug in TYPE_SUFFIXES:
        count = update_json(slug, image_path_map, args.dry_run)
        print(f"  {slug}.json：更新 {count} 筆")
        total_json_updated += count

    # ── Phase 4：總結 ──────────────────────────────────────────────────────
    print(f"\n=== 完成 ===")
    print(f"  圖片下載：{downloaded + already_exist}/{total_weapons} 張成功")
    print(f"  JSON 更新：{total_json_updated}/{total_weapons} 筆")
    if failed:
        print(f"  注意：{len(failed)} 張圖片下載失敗")
    if args.dry_run:
        print("  [dry-run 模式：以上均為模擬結果，未實際寫入]")


if __name__ == "__main__":
    main()
