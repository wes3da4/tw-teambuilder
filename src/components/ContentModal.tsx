import { useState } from 'react'
import type { Content } from '../types'

interface Props {
  initial?: Content
  onSave: (c: Content) => void
  onClose: () => void
  onDelete?: () => void
}

export default function ContentModal({ initial, onSave, onClose, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [roles, setRoles] = useState(initial?.roles ?? { tank: 0, heal: 0, dps: 0, free: 0 })

  function setRole(key: keyof typeof roles, val: number) {
    setRoles(r => ({ ...r, [key]: Math.max(0, val) }))
  }

  function handleSave() {
    if (!name.trim()) return
    const total = roles.tank + roles.heal + roles.dps + roles.free
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      ptSize: total,
      roles,
    })
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          <span>{initial ? 'コンテンツを編集' : 'コンテンツを追加'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="form-row">
          <label>コンテンツ名</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例: アフェティリア"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="form-row">
          <label>ロール構成（タンク / ヒーラー / アタッカー / 指定なし）</label>
          <div className="role-inputs">
            <input type="text" className="input-numeric" value={roles.tank} inputMode="numeric" onFocus={e => e.target.select()} onWheel={e => e.currentTarget.blur()} onChange={e => { const v = e.target.value.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, ''); setRole('tank', v === '' ? 0 : Math.max(0, +v)) }} placeholder="タンク" />
            <input type="text" className="input-numeric" value={roles.heal} inputMode="numeric" onFocus={e => e.target.select()} onWheel={e => e.currentTarget.blur()} onChange={e => { const v = e.target.value.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, ''); setRole('heal', v === '' ? 0 : Math.max(0, +v)) }} placeholder="ヒーラー" />
            <input type="text" className="input-numeric" value={roles.dps}  inputMode="numeric" onFocus={e => e.target.select()} onWheel={e => e.currentTarget.blur()} onChange={e => { const v = e.target.value.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, ''); setRole('dps',  v === '' ? 0 : Math.max(0, +v)) }} placeholder="DPS" />
            <input type="text" className="input-numeric" value={roles.free} inputMode="numeric" onFocus={e => e.target.select()} onWheel={e => e.currentTarget.blur()} onChange={e => { const v = e.target.value.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, ''); setRole('free', v === '' ? 0 : Math.max(0, +v)) }} placeholder="指定なし" />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
            合計: {roles.tank + roles.heal + roles.dps + roles.free}人/PT
          </div>
        </div>

        <div className="modal-footer">
          {onDelete && (
            <button className="btn-danger" onClick={onDelete} style={{ marginRight: 'auto' }}>削除</button>
          )}
          <button className="btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}
