import type { Armor, Weapon } from '~/stores/equipment'
import { getPartName, getWeaponTypeName } from '~/stores/equipment'
import { useBuildStore, type ArmorSlot, type SkillSummaryEntry } from '~/stores/build'
import { useSkillStore } from '~/stores/skill'
import type { BuildResult } from '~/lib/autoBuildAlgorithm'
import { cardText, drawBuildCard, type BuildCardData, type BuildCardPiece } from '~/lib/buildCard'
import { skillColor } from '~/lib/skillColors'

const ARMOR_SLOTS: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']
const ARMOR_PARAM: Record<ArmorSlot, [string, string]> = {
  head: ['h', 'dh'], chest: ['c', 'dc'], arms: ['a', 'da'], waist: ['wa', 'dw'], legs: ['l', 'dl'],
}

interface CardSource {
  title: string
  subtitle: string
  weapon: Weapon | null
  armor: Record<ArmorSlot, Armor | null>
  driftstones: Record<ArmorSlot, (string | null)[]>
  skills: SkillSummaryEntry[]
}

/**
 * Turn a build (the current one, or an auto-build plan) into a shareable PNG:
 * copied to the clipboard in one tap, with share sheet / download as fallbacks.
 */
export function useBuildShot() {
  const buildStore = useBuildStore()
  const skillStore = useSkillStore()
  const config = useRuntimeConfig()
  const { imageUrl } = useImageUrl()
  const { show, showAction } = useToast()
  const busy = ref(false)

  const skillName = (id: string) => skillStore.getById(id)?.name ?? id

  function shareUrl(params: Record<string, string>) {
    const base = config.app.baseURL.replace(/\/$/, '')
    const search = new URLSearchParams(params).toString()
    return `${window.location.origin}${base}/build${search ? `?${search}` : ''}`
  }

  function paramsOf(src: CardSource): Record<string, string> {
    const params: Record<string, string> = {}
    if (src.weapon) params.w = src.weapon.id
    for (const slot of ARMOR_SLOTS) {
      const piece = src.armor[slot]
      if (!piece) continue
      const [gear, drift] = ARMOR_PARAM[slot]
      params[gear] = piece.id
      const stones = src.driftstones[slot].slice(0, piece.driftstoneSlots)
      if (stones.some(Boolean)) params[drift] = stones.map(s => s ?? '').join(',')
    }
    return params
  }

  function cardData(src: CardSource): BuildCardData {
    const pieces: BuildCardPiece[] = [{
      label: src.weapon ? getWeaponTypeName(src.weapon.type) : '武器',
      name: src.weapon?.name ?? null,
      image: src.weapon ? imageUrl(src.weapon.image) : null,
      skills: (src.weapon?.skills ?? []).map(s => `${skillName(s.skillId)} Lv${s.level}`),
      driftstones: [],
    }]
    for (const slot of ARMOR_SLOTS) {
      const piece = src.armor[slot]
      pieces.push({
        label: getPartName(slot),
        name: piece?.name ?? null,
        image: piece ? imageUrl(piece.image) : null,
        skills: (piece?.skills ?? []).map(s => `${skillName(s.skillId)} Lv${s.level}`),
        driftstones: piece
          ? Array.from({ length: piece.driftstoneSlots }, (_, i) => {
              const id = src.driftstones[slot][i]
              return id ? skillName(id) : ''
            })
          : [],
      })
    }
    return {
      title: src.title,
      subtitle: src.subtitle,
      pieces,
      skills: src.skills.map(e => ({
        name: e.name,
        total: e.total,
        max: e.max,
        color: skillColor(skillStore.getById(e.id)),
      })),
      shareUrl: shareUrl(paramsOf(src)),
      siteName: '最強獵人 MHN 配裝模擬器',
      siteHost: window.location.host,
    }
  }

  function loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = url
    })
  }

  async function render(data: BuildCardData): Promise<Blob> {
    const text = cardText(data)
    await Promise.all([
      document.fonts.load('400 24px "Noto Sans TC"', text),
      document.fonts.load('700 36px "Noto Sans TC"', text),
      document.fonts.load('900 60px "Noto Sans TC"', text),
    ]).catch(() => {})
    const urls = data.pieces.map(p => p.image).filter((u): u is string => !!u)
    const loaded = await Promise.all(urls.map(loadImage))
    const images = new Map<string, HTMLImageElement>()
    urls.forEach((u, i) => { if (loaded[i]) images.set(u, loaded[i]!) })
    const canvas = drawBuildCard(data, images)
    return new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('無法產生圖片'))), 'image/png'),
    )
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function shoot(src: CardSource) {
    if (busy.value) return
    busy.value = true
    const filename = `mhn-build-${new Date().toISOString().slice(0, 10)}.png`
    // Start the clipboard write inside the tap itself (Safari needs the promise there)
    const blobPromise = render(cardData(src))
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined' && window.isSecureContext) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })])
          const blob = await blobPromise
          showAction('已複製配裝圖片，可直接貼上', { label: '下載', icon: 'download', run: () => download(blob, filename) })
          return
        } catch {
          // fall through to share / download
        }
      }
      const blob = await blobPromise
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
      }
      download(blob, filename)
      show('已下載配裝圖片')
    } catch {
      show('無法產生配裝圖片')
    } finally {
      busy.value = false
    }
  }

  /** The build on the build page, as the player sees it. */
  function shootCurrent() {
    return shoot({
      title: buildStore.weapon?.name ?? '我的配裝',
      subtitle: '最強獵人・配裝',
      weapon: buildStore.weapon,
      armor: { head: buildStore.head, chest: buildStore.chest, arms: buildStore.arms, waist: buildStore.waist, legs: buildStore.legs },
      driftstones: buildStore.driftstoneSkills,
      skills: buildStore.skillSummary,
    })
  }

  /** An auto-build plan as the search produced it. */
  function shootResult(result: BuildResult) {
    const assigned = result.driftstoneAssignments
    return shoot({
      title: result.weapon?.name ?? `自動配裝 方案 ${result.rank}`,
      subtitle: `最強獵人・自動配裝 方案 ${result.rank}`,
      weapon: result.weapon,
      armor: result.armor,
      driftstones: {
        head: assigned?.head ?? [], chest: assigned?.chest ?? [], arms: assigned?.arms ?? [],
        waist: assigned?.waist ?? [], legs: assigned?.legs ?? [],
      },
      skills: result.skillSummary,
    })
  }

  return { busy, shootCurrent, shootResult }
}
