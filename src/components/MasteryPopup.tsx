import { useState, useLayoutEffect, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Option {
  name: string
  icon: string
  description: string | null
  selected: boolean
}

interface Props {
  anchorRect: DOMRect
  options: Option[]
  onSelect: (name: string) => void
  onClose: () => void
}

export default function MasteryPopup({ anchorRect, options, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width: pw, height: ph } = el.getBoundingClientRect()
    const gap = 6
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top = anchorRect.bottom + gap
    if (top + ph > vh - 8) top = Math.max(8, anchorRect.top - gap - ph)

    let left = anchorRect.left
    left = Math.max(8, Math.min(left, vw - pw - 8))

    setCoords({ top, left })
  }, [anchorRect])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      className="mastery-popup"
      style={coords ? { top: coords.top, left: coords.left } : { visibility: 'hidden', top: 0, left: 0 }}
    >
      {options.map(opt => (
        <button
          type="button"
          key={opt.name}
          className={`mastery-popup-row ${opt.selected ? 'selected' : ''}`}
          onClick={() => onSelect(opt.name)}
        >
          <img src={opt.icon} alt={opt.name} />
          <div className="mastery-popup-text">
            <div className="mastery-popup-name">{opt.name}</div>
            {opt.description && <div className="mastery-popup-desc">{opt.description}</div>}
          </div>
        </button>
      ))}
    </div>,
    document.body,
  )
}
