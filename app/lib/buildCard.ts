/**
 * Build card image: draws a build onto a 1080px-wide portrait canvas for sharing
 * (chat apps, social posts). Plain Canvas 2D, so the result is the same on every
 * device and needs no DOM snapshot library.
 *
 * Layout: header → weapon + five armor rows (with driftstones) → skill levels →
 * footer with the site mark and a QR code of the share link.
 */
import { encode } from 'uqr'

export interface BuildCardPiece {
  label: string          // 太刀 / 頭部 …
  name: string | null    // null = empty slot
  image: string | null   // URL, already resolved against the app base
  badge: string | null   // monster crest (or set icon) URL for the plate's corner
  skills: string[]       // "攻擊 Lv3"
  driftstones: string[]  // skill names; empty string = empty slot
}

export interface BuildCardSkill {
  name: string
  total: number
  max: number
  color: string
}

export interface BuildCardData {
  title: string
  subtitle: string
  pieces: BuildCardPiece[]
  skills: BuildCardSkill[]
  shareUrl: string
  siteName: string
  siteHost: string
}

const W = 1080
const PAD = 64
const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif'
const NUM_FONT = '"Inter", "Noto Sans TC", sans-serif'
const INK = '#000000'
const INK_2 = '#5E5E5E'
const RULE = '#E8E8E8'
const PLATE = '#F3F3F3'
const EMPTY_CELL = '#E2E2E2'

const ROW_H = 180
const SKILL_ROW_H = 68
const QR_SIZE = 260

function font(weight: number, size: number, family = FONT) {
  return `${weight} ${size}px ${family}`
}

/** Every string the card prints, so the web font can fetch the glyph subsets first. */
export function cardText(data: BuildCardData): string {
  return [
    data.title, data.subtitle, data.siteName, data.siteHost, '技能掃描開啟這組配裝漂流石未裝備Lv0123456789/',
    ...data.pieces.flatMap(p => [p.label, p.name ?? '', ...p.skills, ...p.driftstones]),
    ...data.skills.map(s => s.name),
  ].join('')
}

/** Cut text with an ellipsis so it fits `max` pixels at the context's current font. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text
  let s = text
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1)
  return `${s}…`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Draw an image contained (aspect kept) and centred in a box. */
function drawContained(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number) {
  const ratio = Math.min(size / img.naturalWidth, size / img.naturalHeight)
  const w = img.naturalWidth * ratio
  const h = img.naturalHeight * ratio
  ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h)
}

export function cardHeight(data: BuildCardData): number {
  const skillRows = Math.ceil(data.skills.length / 2)
  return PAD + 150 + data.pieces.length * ROW_H + 96 + skillRows * SKILL_ROW_H + 72 + QR_SIZE + 48 + PAD
}

/** Corner badge on a plate: a round crest cut out of the card by a white ring. */
function drawBadge(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number) {
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = PLATE
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.clip()
  const inner = r * 2 - 6
  drawContained(ctx, img, cx - inner / 2, cy - inner / 2, inner)
  ctx.restore()
}

/**
 * Render the card. `images` maps image URLs (pieces and badges) to loaded images;
 * a missing or failed image leaves its plate or badge out.
 */
export function drawBuildCard(data: BuildCardData, images: Map<string, HTMLImageElement>): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = cardHeight(data)
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, canvas.height)

  // ── Header ──
  let y = PAD
  ctx.fillStyle = INK_2
  ctx.font = font(500, 28)
  ctx.fillText(fit(ctx, data.subtitle, W - PAD * 2), PAD, y + 28)
  ctx.fillStyle = INK
  ctx.font = font(900, 60)
  ctx.fillText(fit(ctx, data.title, W - PAD * 2), PAD, y + 100)
  y += 150

  // ── Gear ──
  const plate = 112
  const textX = PAD + plate + 32
  for (const piece of data.pieces) {
    ctx.fillStyle = RULE
    ctx.fillRect(PAD, y, W - PAD * 2, 2)
    const top = y + (ROW_H - plate) / 2
    ctx.fillStyle = PLATE
    roundRect(ctx, PAD, top, plate, plate, 24)
    ctx.fill()
    const img = piece.image ? images.get(piece.image) : undefined
    if (img) drawContained(ctx, img, PAD + 6, top + 6, plate - 12)
    const badge = piece.badge ? images.get(piece.badge) : undefined
    if (badge) drawBadge(ctx, badge, PAD + plate - 10, top + plate - 10, 26)

    // Text block: label, name, skills, driftstones — centred as a block in the row
    const textW = W - PAD - textX
    const stones = piece.driftstones.map(s => s || '空')
    const blockH = stones.length ? 138 : 106
    let ty = y + (ROW_H - blockH) / 2
    ctx.fillStyle = INK_2
    ctx.font = font(500, 24)
    ctx.fillText(piece.label, textX, ty + 22)
    ctx.fillStyle = piece.name ? INK : INK_2
    ctx.font = font(700, 36)
    ctx.fillText(fit(ctx, piece.name ?? '未裝備', textW), textX, ty + 66)
    ctx.fillStyle = INK_2
    ctx.font = font(400, 24)
    ty += 100
    if (piece.skills.length) ctx.fillText(fit(ctx, piece.skills.join('　'), textW), textX, ty)
    if (stones.length) ctx.fillText(fit(ctx, `漂流石　${stones.join('、')}`, textW), textX, ty + 34)
    y += ROW_H
  }
  ctx.fillStyle = RULE
  ctx.fillRect(PAD, y, W - PAD * 2, 2)

  // ── Skills ──
  y += 72
  ctx.fillStyle = INK
  ctx.font = font(900, 40)
  ctx.fillText('技能', PAD, y)
  y += 24
  const colGap = 48
  const colW = (W - PAD * 2 - colGap) / 2
  data.skills.forEach((s, i) => {
    const x = PAD + (i % 2) * (colW + colGap)
    const rowY = y + Math.floor(i / 2) * SKILL_ROW_H
    ctx.fillStyle = INK
    ctx.font = font(500, 26)
    const levelText = `${s.total}/${s.max}`
    ctx.font = font(700, 26, NUM_FONT)
    const levelW = ctx.measureText(levelText).width
    ctx.textAlign = 'right'
    ctx.fillText(levelText, x + colW, rowY + 34)
    ctx.textAlign = 'left'
    ctx.font = font(500, 26)
    ctx.fillText(fit(ctx, s.name, colW - levelW - 16), x, rowY + 34)
    // One cell per level, the skill's colour up to its total
    const cells = Math.max(1, s.max)
    const gap = 4
    const cellW = (colW - gap * (cells - 1)) / cells
    for (let c = 0; c < cells; c++) {
      ctx.fillStyle = c < s.total ? s.color : EMPTY_CELL
      roundRect(ctx, x + c * (cellW + gap), rowY + 46, cellW, 8, 4)
      ctx.fill()
    }
  })
  y += Math.ceil(data.skills.length / 2) * SKILL_ROW_H

  // ── Footer: site mark and QR code of the share link ──
  y += 48
  ctx.fillStyle = RULE
  ctx.fillRect(PAD, y, W - PAD * 2, 2)
  y += 48
  const qr = encode(data.shareUrl, { ecc: 'L', border: 0 })
  const cell = Math.floor(QR_SIZE / qr.size)
  const qrPx = cell * qr.size
  const qrX = W - PAD - qrPx
  ctx.fillStyle = INK
  qr.data.forEach((row, r) => row.forEach((dark, c) => {
    if (dark) ctx.fillRect(qrX + c * cell, y + r * cell, cell, cell)
  }))
  ctx.fillStyle = INK
  ctx.font = font(900, 44)
  ctx.fillText(data.siteName, PAD, y + 56)
  ctx.fillStyle = INK_2
  ctx.font = font(500, 28)
  ctx.fillText(data.siteHost, PAD, y + 104)
  ctx.font = font(400, 24)
  ctx.fillText('掃描 QR 碼開啟這組配裝', PAD, y + qrPx - 8)

  return canvas
}
