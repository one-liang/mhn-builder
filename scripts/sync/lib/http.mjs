/**
 * Polite HTTP helpers for the official site: retries with backoff, a small
 * concurrency pool, and an optional on-disk cache for local re-runs.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const BASE_URL = 'https://monsterhunternow.com'

const USER_AGENT = 'mhn-builder-data-sync (+https://github.com/one-liang/mhn-builder)'
const MAX_ATTEMPTS = 4

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

class HttpError extends Error {
  constructor(url, status) {
    super(`GET ${url} -> HTTP ${status}`)
    this.status = status
    // 4xx (other than 429) will not get better by retrying
    this.retryable = status === 429 || status >= 500
  }
}

/**
 * @param {object} [options]
 * @param {string|null} [options.cacheDir] cache raw HTML here and reuse it on later runs
 * @param {number} [options.concurrency] max requests in flight across all callers (capped at 4)
 * @param {number} [options.delayMs] pause after each network request inside `map()`
 * @param {(msg: string) => void} [options.log]
 */
export function createHttp({ cacheDir = null, concurrency = 3, delayMs = 250, log = () => {} } = {}) {
  const stats = { requests: 0, cacheHits: 0, bytes: 0 }

  // Gate shared by every request of this instance, so concurrent callers (armor and weapons run
  // in parallel) never exceed `concurrency` requests in flight in total
  const limit = Math.max(1, Math.min(4, concurrency))
  let active = 0
  const waiting = []
  const acquire = () => (active < limit ? (active++, Promise.resolve()) : new Promise(resolve => waiting.push(resolve)))
  const release = () => {
    const next = waiting.shift()
    if (next) next() // hand the slot straight to the next waiter
    else active--
  }

  /** GET `url` and return `read(response)`; the body is read inside the gate and retried with it. */
  async function request(url, accept, read) {
    let lastError
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await acquire()
      try {
        stats.requests++
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, 'Accept': accept, 'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8' },
          redirect: 'follow',
        })
        if (!res.ok) throw new HttpError(url, res.status)
        return await read(res)
      } catch (err) {
        lastError = err
      } finally {
        release()
      }
      if (lastError instanceof HttpError && !lastError.retryable) break
      if (attempt < MAX_ATTEMPTS) {
        log(`  retry ${attempt}/${MAX_ATTEMPTS - 1} ${url}: ${lastError.message}`)
        await sleep(1000 * 2 ** (attempt - 1))
      }
    }
    throw new Error(`GET ${url} failed: ${lastError?.message ?? lastError}`)
  }

  /** Fetch an official page by path (e.g. "/zh/armor") as text. */
  async function getText(path) {
    const cacheFile = cacheDir && join(cacheDir, path.replace(/^\//, '').replace(/\//g, '__') + '.html')
    if (cacheFile && existsSync(cacheFile)) {
      stats.cacheHits++
      return readFileSync(cacheFile, 'utf8')
    }
    const text = await request(BASE_URL + path, 'text/html,application/xhtml+xml', res => res.text())
    stats.bytes += text.length
    if (cacheFile) {
      mkdirSync(cacheDir, { recursive: true })
      writeFileSync(cacheFile, text)
    }
    return text
  }

  /** Download a binary file (absolute URL) into `dest`, creating folders as needed. */
  async function download(url, dest, { expectWebp = false } = {}) {
    const { buf, type } = await request(url, 'image/webp,image/*;q=0.8', async res => ({
      buf: Buffer.from(await res.arrayBuffer()),
      type: res.headers.get('content-type'),
    }))
    if (expectWebp && !(buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP')) {
      throw new Error(`GET ${url}: response is not a WebP image (${type})`)
    }
    stats.bytes += buf.length
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, buf)
    return buf.length
  }

  /** Run `fn` over `items` with limited concurrency; preserves order. */
  async function map(items, fn) {
    const results = new Array(items.length)
    let next = 0
    async function worker() {
      while (next < items.length) {
        const i = next++
        const before = stats.requests
        results[i] = await fn(items[i], i)
        if (stats.requests > before && delayMs > 0) await sleep(delayMs)
      }
    }
    const workers = Math.max(1, Math.min(4, concurrency, items.length))
    await Promise.all(Array.from({ length: workers }, worker))
    return results
  }

  return { getText, download, map, stats }
}
