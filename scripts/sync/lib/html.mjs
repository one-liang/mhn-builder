/**
 * Parsing helpers for monsterhunternow.com pages.
 *
 * The list pages (/zh/armor, /zh/weapons, /zh/skills ...) are server-rendered
 * and embed the full dataset as HTML-escaped JSON:
 *   <root-island component="SortableArmorList" props="{&quot;armor&quot;: ...}">
 * This is undocumented site markup, so every helper fails loudly instead of
 * returning partial data.
 */

const NAMED_ENTITIES = { quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }

/** Decode HTML entities; `&amp;` is decoded last so `&amp;quot;` stays `&quot;`. */
export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => (name.toLowerCase() === 'amp' ? m : NAMED_ENTITIES[name.toLowerCase()] ?? m))
    .replace(/&amp;/gi, '&')
}

/**
 * Return the parsed `props` JSON of `<root-island component="NAME" props="...">`.
 * Attributes are scanned individually because the props value may contain a
 * raw `>` and the attribute order is not guaranteed.
 */
export function extractIsland(html, component) {
  const tagRe = /<root-island((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*\/?>/g
  let match
  while ((match = tagRe.exec(html))) {
    const attrs = {}
    for (const a of match[1].matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? ''
    if (attrs.component !== component) continue
    if (attrs.props === undefined) throw new Error(`<root-island component="${component}"> has no props attribute`)
    try {
      return JSON.parse(decodeEntities(attrs.props))
    } catch (err) {
      throw new Error(`<root-island component="${component}"> props is not valid JSON: ${err.message}`)
    }
  }
  throw new Error(`<root-island component="${component}"> not found — the official site markup may have changed`)
}

/** Strip tags and collapse whitespace (adjacent inline tags are joined without a space). */
export function htmlToText(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
}

/**
 * Official names carry a grade suffix in guideTranslations ("皮製頭飾 1",
 * "雙匕1"); remove it to get the base name the site shows as the page title.
 */
export function stripGradeSuffix(name) {
  return name.replace(/\s*\d+$/, '').trim()
}

/** guideTranslations lookup that throws when a key is missing. */
export function translator(props, label) {
  const t = props.guideTranslations
  if (!t || typeof t !== 'object') throw new Error(`${label}: guideTranslations missing`)
  return key => {
    const value = t[key]
    if (typeof value !== 'string') throw new Error(`${label}: missing translation "${key}"`)
    return value
  }
}
