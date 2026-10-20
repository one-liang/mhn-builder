#!/usr/bin/env node
/**
 * Official data sync: re-fetch https://monsterhunternow.com and rewrite data/ to match it.
 *
 *   node scripts/sync/index.mjs [--dry-run] [--report FILE] [--cache-dir DIR] [--concurrency N]
 *                               [--allow-shrink] [--skip-images]
 *
 * Flow: skills (assigns ids for new skill kinds) -> armor + weapons in parallel -> monsters
 * (from the armor/weapon islands) -> cross-checks
 * -> download new images -> validate the result in a temp copy of data/ -> write data/ and
 * config/id-maps.json -> Markdown report. Any failure before the write step leaves data/ untouched.
 */
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { validateData } from '../validate-data.mjs'
import { syncArmor } from './armor.mjs'
import { syncMonsters } from './monsters.mjs'
import { createHttp } from './lib/http.mjs'
import { ROOT, formatJson, jsonEqual, loadData, readJson } from './lib/io.mjs'
import { buildReport, consoleSummary } from './lib/report.mjs'
import { createSkillIdResolver } from './lib/skill-ids.mjs'
import { syncSkills } from './skills.mjs'
import { syncWeapons } from './weapons.mjs'

const ID_MAPS_FILE = join(ROOT, 'scripts/sync/config/id-maps.json')
const OVERRIDES_FILE = join(ROOT, 'scripts/sync/config/overrides.json')
const SHRINK_RATIO = 0.9
const MAX_CONCURRENCY = 3
const MAX_PRINTED_ERRORS = 40

const USAGE = `用法：node scripts/sync/index.mjs [選項]（或 npm run sync:data -- [選項]）

從 https://monsterhunternow.com 重新抓取官方資料並改寫 data/。

  --dry-run          只抓取、比對與驗證，不寫入 data/、不下載圖片
  --report FILE      將 Markdown 報告寫到 FILE（排程 Action 用它當 PR 內容）
  --cache-dir DIR    快取抓到的 HTML 到 DIR，之後的執行直接重用（本機開發用）
  --concurrency N    同時請求數 1-${MAX_CONCURRENCY}（預設 ${MAX_CONCURRENCY}）
  --allow-shrink     允許官方筆數少於目前筆數的 ${SHRINK_RATIO * 100}%（預設會中止）
  --skip-images      不下載新圖片；JSON 照樣寫入，之後 npm run validate:data 會回報缺圖
  -h, --help         顯示說明

設定環境變數 DEBUG=1 可在錯誤時印出 stack trace。`

function parseArgs(argv) {
  const opts = { dryRun: false, allowShrink: false, skipImages: false, help: false, concurrency: MAX_CONCURRENCY, report: null, cacheDir: null }
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split(/=(.*)/s)
    const value = () => {
      const v = inline ?? argv[++i]
      if (v === undefined || v === '' || (inline === undefined && v.startsWith('--'))) throw new Error(`${flag} 需要一個值`)
      return v
    }
    if (flag === '--dry-run') opts.dryRun = true
    else if (flag === '--allow-shrink') opts.allowShrink = true
    else if (flag === '--skip-images') opts.skipImages = true
    else if (flag === '-h' || flag === '--help') opts.help = true
    else if (flag === '--report') opts.report = resolve(value())
    else if (flag === '--cache-dir') opts.cacheDir = resolve(value())
    else if (flag === '--concurrency') {
      const n = Number(value())
      if (!Number.isInteger(n) || n < 1 || n > MAX_CONCURRENCY) throw new Error(`--concurrency 必須是 1 到 ${MAX_CONCURRENCY} 的整數`)
      opts.concurrency = n
    }
    else throw new Error(`未知的參數：${argv[i]}`)
  }
  return opts
}

/** JSON with object keys sorted, so key order alone never counts as a difference. */
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]))
  }
  return value
}

/** Repo-relative path under `prefix` without traversal; returns it normalised. */
function safePath(path, prefix, label) {
  const abs = resolve(ROOT, path)
  const rel = relative(ROOT, abs).split('\\').join('/')
  if (!rel.startsWith(prefix) || rel.includes('..')) throw new Error(`${label}: 路徑 "${path}" 不在 ${prefix} 底下`)
  return rel
}

function readIfExists(abs) {
  try {
    return readFileSync(abs, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

/** Write via a sibling temp file + rename so a crash never leaves a half-written JSON file. */
function writeAtomic(abs, content) {
  mkdirSync(dirname(abs), { recursive: true })
  const tmp = `${abs}.sync-tmp`
  writeFileSync(tmp, content)
  renameSync(tmp, abs)
}

/** Cross-checks that need every dataset (each module also guards its own input). */
function crossCheck(results, { allowShrink }) {
  const [first, ...rest] = results.filter(r => r.officialSkills)
  const ref = JSON.stringify(canonical(first.officialSkills))
  for (const r of rest) {
    if (JSON.stringify(canonical(r.officialSkills)) !== ref) {
      throw new Error(`${first.name} 與 ${r.name} 頁面的官方技能資料不一致：官方網站可能在執行途中更新，請稍後重新執行`)
    }
  }
  for (const r of results) {
    const { official, current } = r.counts
    if (!allowShrink && official < current * SHRINK_RATIO) {
      throw new Error(`${r.name}: 官方只有 ${official} 筆，少於目前 ${current} 筆的 ${SHRINK_RATIO * 100}%（官方網站改版或抓取不完整？）；確定無誤時加上 --allow-shrink 重新執行`)
    }
  }
  const owner = new Map()
  for (const r of results) {
    for (const f of r.files) {
      const path = safePath(f.path, 'data/', r.name)
      if (owner.has(path)) throw new Error(`${path} 同時由 ${owner.get(path)} 與 ${r.name} 產生`)
      owner.set(path, r.name)
    }
  }
}

/** Unique images (by destination) across datasets, tagged with their dataset. */
function collectImages(results) {
  const byDest = new Map()
  for (const r of results) {
    for (const img of r.images) {
      const dest = safePath(img.dest, 'public/images/', r.name)
      if (!/^https:\/\//.test(img.url ?? '')) throw new Error(`${r.name}: 圖片 ${dest} 的來源網址無效：${img.url}`)
      if (!byDest.has(dest)) byDest.set(dest, { url: img.url, dest, label: img.label ?? dest, dataset: r.name })
    }
  }
  return [...byDest.values()]
}

async function downloadImages(http, images, log) {
  const failures = []
  let done = 0
  await http.map(images, async img => {
    try {
      await http.download(img.url, join(ROOT, img.dest), { expectWebp: true })
      done++
      log(`  [${done}/${images.length}] ${img.dest}`)
    } catch (err) {
      failures.push(`${img.dest}（${img.label}）：${err.message}`)
    }
  })
  if (failures.length) {
    throw new Error(`${failures.length} 張圖片下載失敗（已下載的 ${done} 張是新檔案，可保留）：\n  ${failures.join('\n  ')}`)
  }
}

/** Write every file into a temp copy of data/ and validate it there. */
function validateInTemp(files, pendingImages) {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'mhn-sync-'))
  try {
    const tmpData = join(tmpRoot, 'data')
    cpSync(join(ROOT, 'data'), tmpData, { recursive: true })
    for (const f of files) {
      const abs = join(tmpData, f.path.replace(/^data\//, ''))
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, formatJson(f.data))
    }
    return validateData({ dataDir: tmpData, publicDir: join(ROOT, 'public'), pendingImages })
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true })
  }
}

async function run(opts, state) {
  const startedAt = new Date()
  const log = msg => console.log(msg)

  const http = createHttp({ cacheDir: opts.cacheDir, concurrency: opts.concurrency, log })
  const current = loadData()
  const maps = readJson(ID_MAPS_FILE)
  const mapsBefore = JSON.stringify(maps)
  const overrides = readJson(OVERRIDES_FILE)
  const ctx = {
    http,
    current,
    maps,
    skillIds: createSkillIdResolver(maps),
    overrides,
    log,
    options: { allowShrink: opts.allowShrink },
  }

  log(`同步官方資料${opts.dryRun ? '（dry-run）' : ''}${opts.cacheDir ? `，快取：${opts.cacheDir}` : ''}`)
  const skills = await syncSkills(ctx)
  const [armor, weapons] = await Promise.all([syncArmor(ctx), syncWeapons(ctx)])
  const monsters = syncMonsters({ current, armor: armor.monsterInput, weapons: weapons.monsterInput, log })
  const results = [skills, armor, weapons, monsters]
  crossCheck(results, opts)

  const files = results.flatMap(r => r.files.map(f => ({ ...f, path: safePath(f.path, 'data/', r.name) })))
  const changedFiles = files.filter(f => readIfExists(join(ROOT, f.path)) !== formatJson(f.data))
  const idMapsChanged = JSON.stringify(maps) !== mapsBefore
  const images = collectImages(results)
  const imageMode = opts.dryRun ? 'pending' : opts.skipImages ? 'skipped' : 'downloaded'

  // Validate before downloading too, so broken data fails fast without fetching images
  const pending = images.map(i => i.dest)
  let validation = validateInTemp(files, pending)
  if (!validation.errors.length && images.length && imageMode === 'downloaded') {
    log(`下載 ${images.length} 張新圖片`)
    state.imagesStarted = true
    await downloadImages(http, images, log)
    validation = validateInTemp(files, [])
  }
  if (validation.errors.length) {
    console.error(`\n資料驗證失敗：${validation.errors.length} 個錯誤`)
    for (const e of validation.errors.slice(0, MAX_PRINTED_ERRORS)) console.error(`  ${e}`)
    if (validation.errors.length > MAX_PRINTED_ERRORS) console.error(`  ……另有 ${validation.errors.length - MAX_PRINTED_ERRORS} 個錯誤`)
    throw new Error(`同步結果未通過 validate-data（${validation.errors.length} 個錯誤，見上方）`)
  }

  if (!opts.dryRun) {
    state.writeStarted = true
    for (const f of changedFiles) writeAtomic(join(ROOT, f.path), formatJson(f.data))
    if (idMapsChanged) writeAtomic(ID_MAPS_FILE, formatJson(maps))
    state.writeDone = true
  }

  const reportInput = {
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    dryRun: opts.dryRun,
    results,
    validation,
    written: { files: changedFiles.map(f => f.path), idMaps: idMapsChanged },
    images: { list: images, mode: imageMode },
    http: http.stats,
  }
  if (opts.report) {
    mkdirSync(dirname(opts.report), { recursive: true })
    writeFileSync(opts.report, buildReport(reportInput))
  }

  log(`\n同步完成${opts.dryRun ? '（dry-run，未寫入任何檔案）' : ''}：`)
  for (const line of consoleSummary({ ...reportInput, reportFile: opts.report })) log(line)
  if (imageMode === 'skipped' && images.length) {
    log(`  注意：略過了 ${images.length} 張新圖片，npm run validate:data 會回報 IMAGE_MISSING，直到不加 --skip-images 重新執行`)
  }
}

async function main() {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (err) {
    console.error(`${err.message}（執行 --help 查看用法）`)
    process.exit(2)
  }
  if (opts.help) {
    console.log(USAGE)
    return
  }

  const state = { imagesStarted: false, writeStarted: false, writeDone: false }
  try {
    await run(opts, state)
  } catch (err) {
    console.error(`\n同步中止：${err.message}`)
    if (process.env.DEBUG) console.error(err.stack)
    if (state.writeDone) console.error('data/ 已更新完成，是之後的步驟（報告）失敗')
    else if (state.writeStarted) {
      console.error('寫入 data/ 時發生錯誤，部分檔案可能已更新：請用 git status / git diff 檢查，必要時 git checkout -- data scripts/sync/config 還原')
    }
    else {
      console.error('data/ 未被修改')
      if (state.imagesStarted) console.error('（已下載的新圖片留在 public/images/，是新檔案，可保留或刪除）')
    }
    process.exit(1)
  }
}

main()
