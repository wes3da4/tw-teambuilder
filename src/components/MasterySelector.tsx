import { useState } from 'react'
import skillsData from '../data/skills.json'
import buildTypesData from '../data/buildTypes.json'
import MasteryPopup from './MasteryPopup'

interface MasteryInfo {
  icon: string
  description: string | null
}

interface SkillEntry {
  chara: string
  skill_name: string
  icon: string
  masteries?: Record<string, MasteryInfo>
  effects: unknown[]
}

interface BuildOption {
  name: string
  skill_ids: string[]
}

const SKILLS = skillsData as Record<string, SkillEntry>
const BUILD_TYPES = buildTypesData as Record<string, BuildOption[]>

const SKILL_BUILD_GATE: Record<string, string> = {}
for (const options of Object.values(BUILD_TYPES)) {
  for (const opt of options) {
    for (const skillId of opt.skill_ids) {
      SKILL_BUILD_GATE[skillId] = opt.name
    }
  }
}

interface Props {
  chara: string
  selections: Record<string, string>
  buildType?: string
  onChange: (skillId: string, masteryOption: string) => void
}

export function hasMasteries(chara: string): boolean {
  return Object.values(SKILLS).some(sk => sk.chara === chara && sk.masteries && Object.keys(sk.masteries).length > 0)
}

function iconUrl(path: string) {
  return `${import.meta.env.BASE_URL}icons/${path}`
}

export default function MasterySelector({ chara, selections, buildType, onChange }: Props) {
  const [openSkillId, setOpenSkillId] = useState<string | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const masterySkills = chara
    ? Object.entries(SKILLS).filter(([skillId, sk]) => {
        if (sk.chara !== chara || !sk.masteries || Object.keys(sk.masteries).length === 0) return false
        const requiredBuild = SKILL_BUILD_GATE[skillId]
        return !requiredBuild || requiredBuild === buildType
      })
    : []

  if (masterySkills.length === 0) return null

  const openSkill = openSkillId ? SKILLS[openSkillId] : null

  return (
    <div className="mastery-selector-wrap">
      <label>マスタリー</label>
      <div className="mastery-selector">
      {masterySkills.map(([skillId, sk]) => {
        const optionNames = Object.keys(sk.masteries!)
        const selected = selections[skillId] ?? optionNames[0]

        return (
          <button
            type="button"
            key={skillId}
            className="mastery-icon-btn selected"
            title={sk.masteries![selected]?.description ? `${selected}\n${sk.masteries![selected].description}` : selected}
            onClick={e => { setOpenSkillId(skillId); setAnchorRect(e.currentTarget.getBoundingClientRect()) }}
          >
            <img src={iconUrl(sk.masteries![selected].icon)} alt={selected} />
          </button>
        )
      })}
      </div>

      {openSkillId && openSkill && anchorRect && (
        <MasteryPopup
          anchorRect={anchorRect}
          options={Object.keys(openSkill.masteries!).map(name => ({
            name,
            icon: iconUrl(openSkill.masteries![name].icon),
            description: openSkill.masteries![name].description,
            selected: (selections[openSkillId] ?? Object.keys(openSkill.masteries!)[0]) === name,
          }))}
          onSelect={name => { onChange(openSkillId, name); setOpenSkillId(null) }}
          onClose={() => setOpenSkillId(null)}
        />
      )}
    </div>
  )
}
