import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  anchorRect: DOMRect
  value: string
  onChange: (value: string) => void
  errors: string[]
  count: number
  onApply: () => void
  onClose: () => void
}

export default function PasscodeImportPopover({ anchorRect, value, onChange, errors, count, onApply, onClose }: Props) {
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

    let left = anchorRect.right - pw
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
      className="passcode-import-popover"
      style={coords ? { top: coords.top, left: coords.left } : { visibility: 'hidden', top: 0, left: 0 }}
    >
      <textarea
        className="memo-textarea"
        rows={3}
        placeholder="ゼリピッピを貼り付け（複数人分が連結されたものもそのまま貼り付け可）"
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus
      />
      {errors.length > 0 && (
        <div className="import-errors">
          {errors.map((err, i) => <div key={i} className="import-error-row">⚠ {err}</div>)}
        </div>
      )}
      <div className="passcode-import-actions">
        <span className="passcode-import-count">{count > 0 ? `${count}人分を読み取りました` : ''}</span>
        <button type="button" className="btn-secondary" onClick={onClose}>キャンセル</button>
        <button type="button" className="btn-primary" disabled={count === 0} onClick={onApply}>復元</button>
      </div>
    </div>,
    document.body,
  )
}
