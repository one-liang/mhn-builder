/**
 * Split a skill name where a line may break gracefully: before a 【qualifier】 and
 * after the dot of a ．境界 suffix. Rendered with <wbr> between the parts inside a
 * `.wrap-phrase` element, 「SP計量表加速【完美迴避】」 wraps as 「SP計量表加速」「【完美迴避】」
 * instead of breaking mid-word.
 */
export function namePhrases(name: string): string[] {
  return name.split(/(?=【)|(?<=[．・‧.])/).filter(Boolean)
}
