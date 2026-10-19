/**
 * Sync report: a Markdown document (used as the data-sync PR body) and a short
 * console summary. Pure functions; index.mjs passes everything in.
 */

/** GitHub caps PR bodies at 65,536 characters; stay well below. */
export const REPORT_LIMIT = 60000

const DATASET_LABEL = { skills: '技能／漂流石', armor: '防具', weapons: '武器' }
const NEEDS_DESCRIPTION = /: needs a hand-written description$/
const IMAGE_MODE = { downloaded: '已下載', pending: '待下載（dry-run）', skipped: '已略過（--skip-images）' }

/** Successively smaller limits, tried until the report fits. */
const LEVELS = [
  { examples: 5, items: 150, value: 160 },
  { examples: 3, items: 60, value: 120 },
  { examples: 2, items: 25, value: 80 },
  { examples: 1, items: 10, value: 60 },
]

/** Escape text for Markdown/HTML outside code spans. */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Inline code span with a length cap ("…" marks a cut). */
function code(value, max) {
  let s = value === undefined ? '（無）' : typeof value === 'string' ? value : JSON.stringify(value)
  s = s.replace(/\s+/g, ' ').replace(/`/g, "'")
  if (s.length > max) s = `${s.slice(0, max - 1)}…`
  return `\`${s}\``
}

/** Before/after of one field; arrays show only the elements that left or arrived. */
function change(from, to, max) {
  if (Array.isArray(from) && Array.isArray(to)) {
    const a = from.map(x => JSON.stringify(x))
    const b = to.map(x => JSON.stringify(x))
    const removed = a.filter(x => !b.includes(x))
    const added = b.filter(x => !a.includes(x))
    if (!removed.length && !added.length) return `僅順序改變 ${code(to, max)}`
    const parts = []
    if (removed.length) parts.push(`移除 ${code(removed.join(', '), max)}`)
    if (added.length) parts.push(`新增 ${code(added.join(', '), max)}`)
    return parts.join('；')
  }
  return `${code(from, max)} → ${code(to, max)}`
}

/** "<id> <name>" -> "`id` name" */
const idLine = line => {
  const [, id, rest] = /^(\S+)\s*(.*)$/s.exec(String(line)) ?? [null, String(line), '']
  return `\`${id.replace(/`/g, "'")}\`${rest ? ` ${esc(rest)}` : ''}`
}

/** Bullet list capped at `max` items. */
function bullets(items, max, fmt = esc) {
  if (!items.length) return ['- 無']
  const out = items.slice(0, max).map(i => `- ${fmt(i)}`)
  if (items.length > max) out.push(`- ……另有 ${items.length - max} 項未列出`)
  return out
}

function groupBy(list, keyFn) {
  const map = new Map()
  for (const item of list) {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return map
}

/** Skills whose (merged) record still has an empty description. */
function skillsNeedingDescription(results) {
  const file = results.find(r => r.name === 'skills')?.files.find(f => f.path === 'data/skills.json')
  return Array.isArray(file?.data) ? file.data.filter(s => !s.description).map(s => `${s.id} ${s.name}`) : []
}

function datasetStats(r) {
  return {
    official: r.counts?.official ?? 0,
    current: r.counts?.current ?? 0,
    added: r.report.added.length,
    changedRecords: new Set(r.report.changed.map(c => c.id)).size,
    changedFields: r.report.changed.length,
    kept: r.report.keptMissingUpstream.length,
  }
}

function render(input, lim) {
  const { startedAt, durationMs, dryRun, results, validation, written, images, http } = input
  const needsDescription = skillsNeedingDescription(results)
  const tagged = (key, transform = x => x) => results.flatMap(r => r.report[key].map(x => `[${r.name}] ${transform(x)}`))
  const warnings = results.flatMap(r => r.report.warnings.filter(w => !NEEDS_DESCRIPTION.test(w)).map(w => `[${r.name}] ${w}`))
  const L = []

  // ---- header ----
  L.push('# 官方資料同步報告', '')
  L.push(`- 執行時間：${startedAt}${durationMs != null ? `（耗時 ${(durationMs / 1000).toFixed(1)} 秒）` : ''}`)
  L.push('- 資料來源：https://monsterhunternow.com（/zh、/en 列表頁與武器詳細頁）')
  if (dryRun) L.push('- 模式：**dry-run**（未寫入任何檔案、未下載圖片）')
  const fileCount = written.files.length + (written.idMaps ? 1 : 0)
  L.push(`- ${dryRun ? '將變更' : '已變更'}的檔案：${fileCount ? `${fileCount} 個` : '無（官方資料與 data/ 一致）'}`)
  if (images.list.length) {
    const note = images.mode === 'skipped' ? '，`npm run validate:data` 會回報缺圖' : ''
    L.push(`- 新圖片：${images.list.length} 張，${IMAGE_MODE[images.mode]}${note}`)
  }
  if (http) L.push(`- 網路請求：${http.requests} 次${http.cacheHits ? `，快取命中 ${http.cacheHits} 次` : ''}`)
  L.push('')

  // ---- summary table ----
  L.push('## 摘要', '')
  L.push('| 資料集 | 官方筆數 | 目前筆數 | 新增 | 變更紀錄 | 欄位變更 | 官方已無（保留） |')
  L.push('|---|---:|---:|---:|---:|---:|---:|')
  for (const r of results) {
    const s = datasetStats(r)
    L.push(`| ${DATASET_LABEL[r.name] ?? r.name} | ${s.official} | ${s.current} | ${s.added} | ${s.changedRecords} | ${s.changedFields} | ${s.kept} |`)
  }
  L.push('', '筆數以主要紀錄計算（技能、防具件數、武器）；技能列的新增／變更也包含漂流石（`driftstone:` 開頭）。', '')

  // ---- human review ----
  L.push('## 需要人工確認', '')
  L.push('### 新 ID（依預設規則產生，發佈後即寫入分享網址，請確認命名）', '')
  L.push(...bullets(tagged('newIds'), lim.items), '')
  L.push('### 需要補寫說明的技能（skills.json `description` 為空）', '')
  L.push(...bullets(needsDescription, lim.items, idLine), '')
  if (needsDescription.length) {
    L.push('補寫方式：合併後在 `main` 的 `data/skills.json` 填入 `description`（同步會保留），或在 `main` 的 `scripts/sync/config/overrides.json` 寫入 `skills.<id>.description`。**不要提交到 `chore/data-sync` 分支**：每次自動同步都會從 `main` 重建該分支。', '')
  }
  L.push('### 官方已不再列出的紀錄（依規則保留、未刪除）', '')
  L.push(...bullets(tagged('keptMissingUpstream'), lim.items), '')
  L.push('### 已套用的手動覆寫（config/overrides.json）', '')
  L.push(...bullets(tagged('overridesApplied'), lim.items), '')
  L.push('### 警告', '')
  L.push(...bullets(warnings, lim.items), '')

  // ---- validation ----
  L.push('## 資料驗證', '')
  const vWarn = (validation.findings ?? []).filter(f => f.level === 'warning')
  L.push(`- 錯誤 ${validation.errors.length}、警告 ${validation.warnings.length}${validation.stats?.images?.pending ? `；${validation.stats.images.pending} 張圖片待下載` : ''}`)
  if (vWarn.length) {
    L.push('', '| 警告代碼 | 數量 | 範例 |', '|---|---:|---|')
    for (const [codeName, list] of groupBy(vWarn, f => f.code)) {
      const sample = list.slice(0, Math.min(lim.examples, 2)).map(f => esc(`${f.file}${f.id ? ` ${f.id}` : ''}: ${f.message}`).replace(/\|/g, '\\|'))
      L.push(`| \`${codeName}\` | ${list.length} | ${sample.join('<br>')} |`)
    }
  }
  L.push('')

  // ---- per-dataset details ----
  L.push('## 各資料集明細', '')
  for (const r of results) {
    const s = datasetStats(r)
    L.push('<details>')
    L.push(`<summary><b>${DATASET_LABEL[r.name] ?? r.name}</b>（${r.name}）：新增 ${s.added}、變更 ${s.changedRecords} 筆紀錄／${s.changedFields} 個欄位、官方已無 ${s.kept}</summary>`, '')
    L.push(...r.report.summary.map(line => `- ${esc(line)}`), '')

    const files = written.files.filter(f => r.files.some(rf => rf.path === f))
    if (files.length) L.push(`${dryRun ? '將變更' : '已變更'}：${files.map(f => `\`${f}\``).join('、')}`, '')

    if (r.report.added.length) {
      L.push(`**新增紀錄（${r.report.added.length}）**`, '')
      L.push(...bullets(r.report.added, lim.items, idLine), '')
    }

    if (r.report.changed.length) {
      L.push('**欄位變更**', '')
      const byField = [...groupBy(r.report.changed, c => c.field)].sort((a, b) => b[1].length - a[1].length)
      for (const [field, list] of byField) {
        L.push(`- \`${field}\`：${list.length} 筆`)
        for (const c of list.slice(0, lim.examples)) {
          L.push(`  - \`${String(c.id).replace(/`/g, "'")}\`：${change(c.from, c.to, lim.value)}`)
        }
        if (list.length > lim.examples) L.push(`  - ……另有 ${list.length - lim.examples} 筆`)
      }
      L.push('')
    }

    const imgs = images.list.filter(i => i.dataset === r.name)
    if (imgs.length) {
      const names = imgs.slice(0, lim.items).map(i => `\`${i.dest.replace(/^public\//, '')}\``)
      if (imgs.length > lim.items) names.push(`……另有 ${imgs.length - lim.items} 張`)
      L.push(`**新圖片（${imgs.length}）**：${names.join(' ')}`, '')
    }
    L.push('</details>', '')
  }

  return L.join('\n')
}

/** Cut at a line boundary and close any <details> left open. */
function hardTruncate(md, limit) {
  const note = '\n\n**報告過長，以下內容已截斷**；完整差異請直接查看 PR 的 Files changed。\n'
  let cut = md.slice(0, limit - note.length - 200)
  cut = cut.slice(0, cut.lastIndexOf('\n'))
  const open = (cut.match(/<details>/g) ?? []).length - (cut.match(/<\/details>/g) ?? []).length
  return cut + note + '\n</details>\n'.repeat(Math.max(0, open))
}

/**
 * @param {object} input
 * @param {string} input.startedAt ISO timestamp of the run
 * @param {number} [input.durationMs]
 * @param {boolean} input.dryRun
 * @param {object[]} input.results DatasetResult[] in execution order
 * @param {{errors: string[], warnings: string[], findings?: object[], stats?: object}} input.validation validateData() result
 * @param {{files: string[], idMaps: boolean}} input.written repo-relative data files whose content changes
 * @param {{list: {dest: string, label?: string, dataset: string}[], mode: 'downloaded'|'pending'|'skipped'}} input.images
 * @param {{requests: number, cacheHits: number}} [input.http]
 * @returns {string} Markdown, at most REPORT_LIMIT characters
 */
export function buildReport(input) {
  let md = ''
  for (const lim of LEVELS) {
    md = render(input, lim)
    if (md.length <= REPORT_LIMIT) return md
  }
  return hardTruncate(md, REPORT_LIMIT)
}

/** A few plain lines for the terminal / Actions log. */
export function consoleSummary({ dryRun, results, validation, written, images, reportFile }) {
  const lines = []
  const sample = (title, list, max = 5) => {
    if (!list.length) return
    lines.push(`    ${title} ${list.length}：`)
    for (const item of list.slice(0, max)) lines.push(`      ${item}`)
    if (list.length > max) lines.push(`      ……另有 ${list.length - max} 項（見報告）`)
  }
  for (const r of results) {
    lines.push(`  ${DATASET_LABEL[r.name] ?? r.name}（${r.name}）`)
    for (const s of r.report.summary) lines.push(`    ${s}`)
    sample('新 ID', r.report.newIds)
    sample('官方已無（保留）', r.report.keptMissingUpstream)
    sample('覆寫', r.report.overridesApplied)
    sample('警告', r.report.warnings, 3)
  }
  lines.push(`  驗證：錯誤 ${validation.errors.length}、警告 ${validation.warnings.length}`)
  if (images.list.length) lines.push(`  圖片：${images.list.length} 張${IMAGE_MODE[images.mode]}`)
  const files = [...written.files, ...(written.idMaps ? ['scripts/sync/config/id-maps.json'] : [])]
  lines.push(files.length ? `  ${dryRun ? '將變更' : '已寫入'} ${files.length} 個檔案：${files.join(', ')}` : '  檔案：無變更（官方資料與 data/ 一致）')
  if (reportFile) lines.push(`  報告：${reportFile}`)
  return lines
}
