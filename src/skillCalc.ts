import skillsData from './data/skills.json'
import categoriesData from './data/categories.json'
import buildTypesData from './data/buildTypes.json'

interface ConditionCharaType {
  chara: string
  types?: string[]
}

interface Condition {
  chara_in_pt?: string
  chara_in_pt_any?: string[]
  // いずれかのチームメンバーが該当キャラかつ(指定があれば)その「育成型」を満たせば成立
  chara_in_pt_with_type_any?: ConditionCharaType[]
}

interface Effect {
  category_id: string
  value: number | null
  target: 'self' | 'pt'
  mastery_group: string | null
  mastery_option: string | null
  condition: Condition | null
  stat?: string | null
}

interface MasteryInfo {
  icon: string
  description: string | null
}

interface SkillEntry {
  chara: string
  skill_name: string
  description?: string
  icon: string
  masteries?: Record<string, MasteryInfo>
  effects: Effect[]
}

interface CategoryDef {
  wiki_label: string
  label: string
  cap: number | null
  skill_ids: string[]
}

interface BuildOption {
  name: string
  skill_ids: string[]
}

const SKILLS = skillsData as Record<string, SkillEntry>
const CATEGORIES = categoriesData as Record<string, CategoryDef>
const BUILD_TYPES = buildTypesData as Record<string, BuildOption[]>

// スキルIDごとに「そのスキルを使用可能にする育成型名」を引けるようにする
const SKILL_BUILD_GATE: Record<string, string> = {}
for (const options of Object.values(BUILD_TYPES)) {
  for (const opt of options) {
    for (const skillId of opt.skill_ids) {
      SKILL_BUILD_GATE[skillId] = opt.name
    }
  }
}

// 比率(%)ではなく素の数値として表示するカテゴリ
const FLAT_VALUE_CATEGORIES = new Set([
  'stat_fixed_increase',
  'final_damage_fixed',
  'attack_damage_base_fixed',
  'damage_received_reduction_fixed',
  'stat_final_fixed',
])

export interface PTMemberInput {
  chara: string
  masterySelections: Record<string, string>
  buildType?: string
}

export interface CategoryContribution {
  skillId: string
  chara: string
  skillName: string
  masteryOption: string | null
  icon: string
  value: number
  stat: string | null
}

export interface CategoryResult {
  categoryId: string
  label: string
  wikiLabel: string
  cap: number | null
  isFlatValue: boolean
  total: number
  contributions: CategoryContribution[]
}

export interface SynergyContribution {
  skillId: string
  chara: string
  skillName: string
  icon: string
  description: string | null
}

function iconUrl(path: string) {
  return `${import.meta.env.BASE_URL}icons/${path}`
}

// キャラクター間の「チームメンバーに〇〇がいると」系シナジーを双方向で引けるようにする
const SYNERGY_MAP: Record<string, Set<string>> = {}
function addSynergy(a: string, b: string) {
  if (a === b) return
  if (!SYNERGY_MAP[a]) SYNERGY_MAP[a] = new Set()
  if (!SYNERGY_MAP[b]) SYNERGY_MAP[b] = new Set()
  SYNERGY_MAP[a].add(b)
  SYNERGY_MAP[b].add(a)
}
for (const sk of Object.values(SKILLS)) {
  for (const eff of sk.effects) {
    if (!eff.condition) continue
    if (eff.condition.chara_in_pt) addSynergy(sk.chara, eff.condition.chara_in_pt)
    if (eff.condition.chara_in_pt_any) {
      for (const c of eff.condition.chara_in_pt_any) addSynergy(sk.chara, c)
    }
    if (eff.condition.chara_in_pt_with_type_any) {
      for (const entry of eff.condition.chara_in_pt_with_type_any) addSynergy(sk.chara, entry.chara)
    }
  }
}

export function getSynergyCharas(chara: string): Set<string> {
  return SYNERGY_MAP[chara] ?? new Set()
}

function buildBuildTypeMap(members: PTMemberInput[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const m of members) {
    const opts = BUILD_TYPES[m.chara]
    const eff = opts ? (m.buildType ?? opts[0]?.name) : m.buildType
    if (eff) map[m.chara] = eff
  }
  return map
}

function isConditionMet(condition: Condition, charaSet: Set<string>, buildTypeByChara: Record<string, string>): boolean {
  if (condition.chara_in_pt && !charaSet.has(condition.chara_in_pt)) return false
  if (condition.chara_in_pt_any && !condition.chara_in_pt_any.some(c => charaSet.has(c))) return false
  if (condition.chara_in_pt_with_type_any) {
    const matched = condition.chara_in_pt_with_type_any.some(entry => {
      if (!charaSet.has(entry.chara)) return false
      if (!entry.types || entry.types.length === 0) return true
      return entry.types.includes(buildTypeByChara[entry.chara])
    })
    if (!matched) return false
  }
  return true
}

export function computePTBuffs(members: PTMemberInput[]): CategoryResult[] {
  const charaSet = new Set(members.map(m => m.chara))
  const buildTypeByChara = buildBuildTypeMap(members)
  const results: Record<string, CategoryResult> = {}

  for (const member of members) {
    const buildOptions = BUILD_TYPES[member.chara]
    const effectiveBuildType = buildOptions ? (member.buildType ?? buildOptions[0]?.name) : member.buildType

    for (const [skillId, sk] of Object.entries(SKILLS)) {
      if (sk.chara !== member.chara) continue

      const requiredBuild = SKILL_BUILD_GATE[skillId]
      if (requiredBuild && effectiveBuildType !== requiredBuild) continue

      for (const eff of sk.effects) {
        if (eff.target !== 'pt') continue
        if (eff.value === null) continue

        if (eff.mastery_option !== null) {
          const defaultOpt = sk.masteries ? Object.keys(sk.masteries)[0] : undefined
          const selected = member.masterySelections[skillId] ?? defaultOpt
          if (selected !== eff.mastery_option) continue
        }

        if (eff.condition && !isConditionMet(eff.condition, charaSet, buildTypeByChara)) continue

        const catDef = CATEGORIES[eff.category_id]
        if (!catDef) continue

        if (!results[eff.category_id]) {
          results[eff.category_id] = {
            categoryId: eff.category_id,
            label: catDef.label,
            wikiLabel: catDef.wiki_label,
            cap: catDef.cap,
            isFlatValue: FLAT_VALUE_CATEGORIES.has(eff.category_id),
            total: 0,
            contributions: [],
          }
        }
        const r = results[eff.category_id]
        r.total += eff.value

        const iconPath = eff.mastery_option && sk.masteries?.[eff.mastery_option]
          ? sk.masteries[eff.mastery_option].icon
          : sk.icon

        r.contributions.push({
          skillId,
          chara: member.chara,
          skillName: sk.skill_name,
          masteryOption: eff.mastery_option,
          icon: iconUrl(iconPath),
          value: eff.value,
          stat: eff.stat ?? null,
        })
      }
    }
  }

  return Object.keys(CATEGORIES)
    .filter(id => results[id])
    .map(id => results[id])
}

// 「チームメンバーに〇〇がいると」系の条件付きシナジーで、現在発動しているものを一覧化する
export function computeSynergies(members: PTMemberInput[]): SynergyContribution[] {
  const charaSet = new Set(members.map(m => m.chara))
  const buildTypeByChara = buildBuildTypeMap(members)
  const results: SynergyContribution[] = []
  const seen = new Set<string>()

  for (const member of members) {
    const buildOptions = BUILD_TYPES[member.chara]
    const effectiveBuildType = buildOptions ? (member.buildType ?? buildOptions[0]?.name) : member.buildType

    for (const [skillId, sk] of Object.entries(SKILLS)) {
      if (sk.chara !== member.chara) continue

      const requiredBuild = SKILL_BUILD_GATE[skillId]
      if (requiredBuild && effectiveBuildType !== requiredBuild) continue

      for (const eff of sk.effects) {
        if (!eff.condition) continue
        if (!isConditionMet(eff.condition, charaSet, buildTypeByChara)) continue

        if (eff.mastery_option !== null) {
          const defaultOpt = sk.masteries ? Object.keys(sk.masteries)[0] : undefined
          const selected = member.masterySelections[skillId] ?? defaultOpt
          if (selected !== eff.mastery_option) continue
        }

        const key = `${member.chara}:${skillId}`
        if (seen.has(key)) continue
        seen.add(key)

        const iconPath = eff.mastery_option && sk.masteries?.[eff.mastery_option]
          ? sk.masteries[eff.mastery_option].icon
          : sk.icon

        results.push({
          skillId,
          chara: member.chara,
          skillName: sk.skill_name,
          icon: iconUrl(iconPath),
          description: sk.description ?? null,
        })
        break
      }
    }
  }

  return results
}
