import { Gem, Hammer, Shield, Sword, Zap } from 'lucide-vue-next'

export const SECTIONS = [
  { key: 'build',       name: '配裝',   title: '配裝模擬器', en: 'Build',       path: '/build',       description: '組合武器防具，即時計算技能等級', icon: Hammer },
  { key: 'weapons',     name: '武器',   title: '武器圖鑑',   en: 'Weapons',     path: '/weapons',     description: '14 種武器的攻擊、屬性與技能',     icon: Sword },
  { key: 'armor',       name: '防具',   title: '防具圖鑑',   en: 'Armor',       path: '/armor',       description: '依部位瀏覽防禦力與技能',           icon: Shield },
  { key: 'skills',      name: '技能',   title: '技能辭典',   en: 'Skills',      path: '/skills',      description: '每個技能的等級效果與來源裝備',     icon: Zap },
  { key: 'driftstones', name: '漂流石', title: '漂流石',     en: 'Driftstones', path: '/driftstones', description: '各色漂流石可鍊成的技能',           icon: Gem },
] as const

export function useSections() {
  const route = useRoute()
  const isActive = (path: string) => route.path.startsWith(path)
  return { sections: SECTIONS, isActive }
}
