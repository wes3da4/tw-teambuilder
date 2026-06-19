import { useEffect, useRef } from 'react'
import { computePTBuffs, computeSynergies, type PTMemberInput } from '../skillCalc'

interface Props {
  members: PTMemberInput[]
}

function formatValue(value: number, isFlatValue: boolean) {
  if (isFlatValue) return value.toFixed(2).replace(/\.00$/, '')
  return `${(value * 100).toFixed(1).replace(/\.0$/, '')}%`
}

function HorizontalScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      if (el!.scrollWidth <= el!.clientWidth) return
      e.preventDefault()
      el!.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return <div className="pt-buffdebuff-icons" ref={ref}>{children}</div>
}

export default function PTBuffDebuffPanel({ members }: Props) {
  const results = computePTBuffs(members)
  const synergies = computeSynergies(members)

  if (results.length === 0 && synergies.length === 0) {
    return (
      <div className="pt-buffdebuff-panel">
        <div className="pt-buffdebuff-panel-inner pt-buffdebuff-empty">該当する効果がありません</div>
      </div>
    )
  }

  return (
    <div className="pt-buffdebuff-panel">
      <div className="pt-buffdebuff-panel-inner">
      {results.map(r => {
        const overCap = r.cap !== null && r.total > r.cap
        return (
          <div className="pt-buffdebuff-row" key={r.categoryId}>
            <div className="pt-buffdebuff-cat">
              <div className="pt-buffdebuff-cat-label" title={r.label}>{r.label}</div>
              <div className="pt-buffdebuff-cat-value">
                <span className={overCap ? 'pt-buffdebuff-overcap' : ''}>{formatValue(r.total, r.isFlatValue)}</span>
                {r.cap !== null && ` / ${formatValue(r.cap, r.isFlatValue)}`}
              </div>
            </div>
            <HorizontalScrollRow>
              {r.contributions.map((c, i) => (
                <img
                  key={`${c.skillId}-${i}`}
                  src={c.icon}
                  alt={c.skillName}
                  title={`${c.chara} / ${c.skillName}${c.masteryOption ? `（${c.masteryOption}）` : ''}\n${c.stat ? `${c.stat} ` : ''}${formatValue(c.value, r.isFlatValue)}`}
                />
              ))}
            </HorizontalScrollRow>
          </div>
        )
      })}
      {synergies.length > 0 && (
        <div className="pt-buffdebuff-row">
          <div className="pt-buffdebuff-cat">
            <div className="pt-buffdebuff-cat-label" title="キャラクターシナジー">キャラクターシナジー</div>
          </div>
          <HorizontalScrollRow>
            {synergies.map(s => (
              <img
                key={s.skillId}
                src={s.icon}
                alt={s.skillName}
                title={`${s.chara} / ${s.skillName}${s.description ? `\n${s.description}` : ''}`}
              />
            ))}
          </HorizontalScrollRow>
        </div>
      )}
    </div>
    </div>
  )
}
