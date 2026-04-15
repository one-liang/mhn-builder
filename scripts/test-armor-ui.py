#!/usr/bin/env python3
"""Test armor UI changes: names, driftstone slots, removed fields."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("=== Test 1: Armor List ===")
    page.goto("http://localhost:3001/armor")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/armor-list.png", full_page=False)

    text = page.inner_text("body")
    # Check new names exist
    assert "皮製頭飾" in text, "FAIL: 皮製頭飾 not found"
    print("  ✓ 皮製頭飾 found")
    assert "毒狗龍" in text, "FAIL: 毒狗龍 not found"
    print("  ✓ 毒狗龍 found")
    # Check old names don't exist
    assert "皮革頭盔" not in text, "FAIL: 皮革頭盔 still in list"
    print("  ✓ 皮革頭盔 removed")
    assert "大凶豺龍" not in text, "FAIL: 大凶豺龍 still in list"
    print("  ✓ 大凶豺龍 removed")
    # No rarity indicator text
    assert "稀有度" not in text, "FAIL: 稀有度 still shown"
    print("  ✓ 稀有度 removed from list")

    print("\n=== Test 2: Armor Detail (禍鎧【腰具】/ Magnamalo Waist) ===")
    page.goto("http://localhost:3001/armor/sinister-waist")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/armor-detail-magnamalo.png", full_page=True)

    text = page.inner_text("body")
    print(f"  Page title area: {text[:200]!r}")
    # Check name
    assert "禍鎧【腰具】" in text, "FAIL: 禍鎧【腰具】 not found"
    print("  ✓ 禍鎧【腰具】 correct name")
    # Check set name
    assert "禍鎧" in text, "FAIL: 禍鎧 set name not found"
    print("  ✓ 禍鎧 set name found")
    # Check driftstone slots
    assert "漂移鑲嵌槽" in text, "FAIL: 漂移鑲嵌槽 not found"
    print("  ✓ 漂移鑲嵌槽 label found")
    assert "2 個插槽" in text, "FAIL: 2 個插槽 not shown for Magnamalo"
    print("  ✓ 2 個插槽 shown correctly")
    # Check removed fields
    assert "屬性耐性" not in text, "FAIL: 屬性耐性 still shown"
    print("  ✓ 屬性耐性 removed")
    assert "所需素材" not in text, "FAIL: 所需素材 still shown"
    print("  ✓ 所需素材 removed")
    assert "稀有度" not in text, "FAIL: 稀有度 still shown"
    print("  ✓ 稀有度 removed")
    # Check skills (foxfire-veil is 鬼火纏身, blastblight-resistance is 爆破異常耐性)
    assert "鬼火纏身" in text or "foxfire" in text.lower() or "blastblight" in text.lower() or "爆破異常耐性" in text, \
        "FAIL: Expected Magnamalo skills not shown"
    print("  ✓ Skills displayed")

    print("\n=== Test 3: Armor Detail (皮製頭飾 / Leather Head) ===")
    page.goto("http://localhost:3001/armor/leather-head")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/armor-detail-leather.png", full_page=True)

    text = page.inner_text("body")
    assert "皮製頭飾" in text, "FAIL: 皮製頭飾 not found"
    print("  ✓ 皮製頭飾 correct name")
    assert "皮製" in text, "FAIL: 皮製 set name not found"
    print("  ✓ 皮製 set name found")
    assert "漂移鑲嵌槽" in text, "FAIL: 漂移鑲嵌槽 not found"
    print("  ✓ 漂移鑲嵌槽 shown")

    print("\n=== Test 4: Great Wroggi (毒狗龍) ===")
    page.goto("http://localhost:3001/armor/wroggi-head")
    page.wait_for_load_state("networkidle")

    text = page.inner_text("body")
    assert "毒狗龍頭盔" in text, "FAIL: 毒狗龍頭盔 not found"
    print("  ✓ 毒狗龍頭盔 found (previously missing armor set)")

    print("\n=== All tests PASSED ===")
    print(f"  Screenshots saved to /tmp/armor-*.png")

    browser.close()
