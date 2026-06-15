import { useState, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  text: string
  anchorRect: DOMRect
}

export default function MemoTooltip({ text, anchorRect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number; dir: 'right' | 'left' } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width: tw, height: th } = el.getBoundingClientRect()
    const gap = 10
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top = anchorRect.top + anchorRect.height / 2 - th / 2
    top = Math.max(8, Math.min(top, vh - th - 8))

    let left: number
    let dir: 'right' | 'left' = 'right'
    if (anchorRect.right + gap + tw <= vw - 8) {
      left = anchorRect.right + gap
    } else {
      left = anchorRect.left - gap - tw
      dir = 'left'
    }

    setCoords({ top, left, dir })
  }, [anchorRect])

  return createPortal(
    <div
      ref={ref}
      className={`memo-tooltip${coords ? ` memo-tooltip--${coords.dir} memo-tooltip--visible` : ''}`}
      style={coords
        ? { top: coords.top, left: coords.left }
        : { visibility: 'hidden', top: 0, left: 0 }
      }
    >
      {text}
    </div>,
    document.body,
  )
}
