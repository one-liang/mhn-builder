/**
 * Shared text matching for the site search and every list filter — pure TS.
 *
 * A query is split on whitespace; every token must appear (as a substring,
 * case-insensitive, full/half-width folded) in at least one of a record's terms.
 * Terms are the record's own names plus its monster's names and aliases, so
 * 「銀火」 finds 銀火龍 gear even when the gear's own name does not say so.
 */

export interface MonsterTerms {
  name: string
  nameEn: string
  aliases: string[]
}

/** Fold width and case and drop whitespace so 「ＲＡＴＨ」 matches "rath". */
export function normalizeText(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, '')
}

export function tokenize(query: string): string[] {
  return query.normalize('NFKC').toLowerCase().split(/\s+/).filter(Boolean)
}

export function monsterTerms(m: MonsterTerms | null | undefined): string[] {
  return m ? [m.name, m.nameEn, ...m.aliases] : []
}

/**
 * 0 = no match. Higher is better: the record's primary name equal to the query (4),
 * starting with it (3), containing it (2); otherwise matched only through other terms (1).
 */
export function matchScore(query: string | string[], primary: string, otherTerms: (string | null | undefined)[] = []): number {
  const tokens = Array.isArray(query) ? query : tokenize(query)
  if (!tokens.length) return 0
  const name = normalizeText(primary)
  const others = otherTerms.filter((t): t is string => !!t).map(normalizeText)
  for (const t of tokens) {
    if (!name.includes(t) && !others.some(o => o.includes(t))) return 0
  }
  const whole = tokens.join('')
  if (name === whole) return 4
  if (name.startsWith(whole)) return 3
  if (name.includes(whole)) return 2
  return 1
}

/** Filter a list by query, best matches first (stable within a score). An empty query keeps the list. */
export function searchList<T>(
  list: T[],
  query: string,
  terms: (item: T) => { primary: string; others?: (string | null | undefined)[] },
): T[] {
  const tokens = tokenize(query)
  if (!tokens.length) return list
  return list
    .map((item, i) => {
      const { primary, others } = terms(item)
      return { item, i, score: matchScore(tokens, primary, others) }
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(x => x.item)
}
