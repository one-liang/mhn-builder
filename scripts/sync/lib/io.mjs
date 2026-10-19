import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repository root (scripts/sync/lib -> ../../..). */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

export const ARMOR_PARTS = ['head', 'chest', 'arms', 'waist', 'legs']

export const WEAPON_TYPES = [
  'great-sword', 'long-sword', 'sword-and-shield', 'dual-blades', 'hammer', 'hunting-horn', 'lance',
  'gunlance', 'switch-axe', 'charge-blade', 'insect-glaive', 'light-bowgun', 'heavy-bowgun', 'bow',
]

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Format JSON the way the repo stores it: 2-space indent, raw UTF-8, trailing newline. */
export function formatJson(data) {
  return JSON.stringify(data, null, 2) + '\n'
}

export function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, formatJson(data))
}

/** Load every data file the sync manages from `dataDir` (defaults to <root>/data). */
export function loadData(dataDir = join(ROOT, 'data')) {
  return {
    armor: Object.fromEntries(ARMOR_PARTS.map(p => [p, readJson(join(dataDir, 'armor', `${p}.json`))])),
    weapons: Object.fromEntries(WEAPON_TYPES.map(t => [t, readJson(join(dataDir, 'weapons', `${t}.json`))])),
    skills: readJson(join(dataDir, 'skills.json')),
    driftstones: readJson(join(dataDir, 'driftstone-skills.json')),
    armorMonsters: readJson(join(dataDir, 'armor-monsters.json')),
  }
}

/** Deep equality for JSON values (key order matters, like the files on disk). */
export function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}
