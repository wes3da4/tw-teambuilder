import { useState } from 'react'
import buildTypesData from '../data/buildTypes.json'
import MasteryPopup from './MasteryPopup'

interface BuildOption {
  name: string
  icon: string
  skill_ids: string[]
}

const BUILD_TYPES = buildTypesData as Record<string, BuildOption[]>

interface Props {
  chara: string
  value: string | undefined
  onChange: (buildType: string) => void
}

export function getBuildOptions(chara: string): BuildOption[] | undefined {
  return BUILD_TYPES[chara]
}

export function getEffectiveBuildType(chara: string, value: string | undefined): string | undefined {
  const options = BUILD_TYPES[chara]
  if (!options) return value
  return value ?? options[0]?.name
}

function iconUrl(path: string) {
  return `${import.meta.env.BASE_URL}icons/${path}`
}

export default function BuildTypeSelector({ chara, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const options = BUILD_TYPES[chara]
  if (!options) return null

  const selected = value ?? options[0].name
  const selectedOption = options.find(o => o.name === selected) ?? options[0]

  return (
    <div className="build-type-selector-wrap">
      <label>育成型</label>
      <div className="build-type-selector">
        <button
          type="button"
          className="mastery-icon-btn selected"
          title={selectedOption.name}
          onClick={e => { setOpen(true); setAnchorRect(e.currentTarget.getBoundingClientRect()) }}
        >
          <img src={iconUrl(selectedOption.icon)} alt={selectedOption.name} />
        </button>
      </div>

      {open && anchorRect && (
        <MasteryPopup
          anchorRect={anchorRect}
          options={options.map(opt => ({
            name: opt.name,
            icon: iconUrl(opt.icon),
            description: null,
            selected: opt.name === selected,
          }))}
          onSelect={name => { onChange(name); setOpen(false) }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
