import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Member, Role } from '../types'
import { CHARAS, CHARA_MAP, ROLE_ICON, ROLES } from '../constants'
import MasterySelector, { hasMasteries } from './MasterySelector'
import BuildTypeSelector, { getBuildOptions, getEffectiveBuildType } from './BuildTypeSelector'

const EMPTY_FORM = { name: '', level: 0, role: 'dps' as Role, chara: '', absent: false, memo: '', masterySelections: {} as Record<string, string>, buildType: undefined as string | undefined }

interface Props {
  members: Member[]
  showEta: boolean
  onToggleEta: () => void
  onAdd: (m: Member) => void
  onUpdate: (m: Member) => void
  onDelete: (id: string) => void
  onReorder: (from: number, to: number) => void
  onClose: () => void
}

interface RowProps {
  member: Member
  editId: string | null
  onStartEdit: (m: Member) => void
  onDelete: (id: string) => void
}

function SortableRow({ member, editId, onStartEdit, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`member-list-item ${editId === member.id ? 'editing' : ''}`}
    >
      <span className="drag-handle" {...listeners} {...attributes} title="ドラッグで並び替え">
        <i className="ti ti-grip-vertical" />
      </span>
      {CHARA_MAP[member.chara] && (
        <img src={`${import.meta.env.BASE_URL}icons/${CHARA_MAP[member.chara]}`} alt={member.chara} className="member-list-chara-icon" />
      )}
      <div className="info" style={{ flex: 1 }}>
        <strong>{member.name}</strong>
      </div>
      <span style={{ fontSize: 10, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>エタ{member.level}</span>
      <div style={{ width: 16, height: 16, flexShrink: 0 }}>
        {ROLE_ICON[member.role] && (
          <img src={ROLE_ICON[member.role]} alt={member.role} style={{ width: 16, height: 16 }} />
        )}
      </div>
      <button className="icon-btn" title="編集" onClick={() => onStartEdit(member)}><i className="ti ti-pencil" /></button>
      <button className="icon-btn danger" title="削除" onClick={() => onDelete(member.id)}><i className="ti ti-trash" /></button>
    </div>
  )
}

export default function MemberModal({ members, showEta, onToggleEta, onAdd, onUpdate, onDelete, onReorder, onClose }: Props) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function startEdit(m: Member) {
    setEditId(m.id)
    setForm({ name: m.name, level: m.level, role: m.role, chara: m.chara, absent: m.absent, memo: m.memo ?? '', masterySelections: m.masterySelections ?? {}, buildType: m.buildType })
  }

  function handleSave() {
    if (!form.name.trim() || !form.chara) return
    if (editId) {
      onUpdate({ id: editId, ...form, name: form.name.trim(), memo: form.memo })
      setEditId(null)
    } else {
      onAdd({ id: crypto.randomUUID(), ...form, name: form.name.trim(), memo: form.memo })
    }
    setForm(EMPTY_FORM)
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = members.findIndex(m => m.id === active.id)
    const to = members.findIndex(m => m.id === over.id)
    if (from !== -1 && to !== -1) onReorder(from, to)
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-title">
          <span>メンバー管理</span>
          <div className="absence-toggle" onClick={onToggleEta} style={{ marginLeft: 16 }}>
            <span style={{ fontSize: 12 }}>エタ</span>
            <div className={`toggle-track ${showEta ? 'on' : ''}`}>
              <div className="toggle-thumb" />
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="member-modal-body">
          {/* 左カラム: 追加 / 編集フォーム */}
          <div className="member-add-section">
            <div className="member-add-section-label">
              {editId ? '編集中' : 'メンバーを追加'}
            </div>
            <div className="form-row">
              <label>名前</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="キャラクター名" onKeyDown={e => e.key === 'Enter' && handleSave()} />
            </div>
            <div className="form-row">
              <label>エタ</label>
              <input type="number" lang="en" value={form.level} min={0} onFocus={e => e.target.select()} onWheel={e => e.currentTarget.blur()} onChange={e => setForm(f => ({ ...f, level: Math.max(0, +e.target.value || 0) }))} />
            </div>
            <div className="form-row">
              <label>ロール</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>キャラクター</label>
              <select value={form.chara} onChange={e => setForm(f => ({ ...f, chara: e.target.value, masterySelections: {}, buildType: undefined }))}>
                <option value="">-- 選択 --</option>
                {CHARAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="mode-mastery-row">
                {getBuildOptions(form.chara) && (
                  <BuildTypeSelector
                    chara={form.chara}
                    value={form.buildType}
                    onChange={buildType => setForm(f => ({ ...f, buildType }))}
                  />
                )}
                {!!getBuildOptions(form.chara) && hasMasteries(form.chara) && (
                  <div className="mode-mastery-divider" />
                )}
                <MasterySelector
                  chara={form.chara}
                  selections={form.masterySelections}
                  buildType={getEffectiveBuildType(form.chara, form.buildType)}
                  onChange={(skillId, option) => setForm(f => ({ ...f, masterySelections: { ...f.masterySelections, [skillId]: option } }))}
                />
              </div>
            </div>
            <div className="form-row">
              <label>メモ</label>
              <textarea
                className="memo-textarea"
                value={form.memo}
                onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="例: 土曜のみ参加可能、遅い時間希望"
                rows={2}
              />
            </div>
            <div className="modal-footer">
              {editId && <button className="btn-secondary" onClick={cancelEdit}>キャンセル</button>}
              <button className="btn-primary" onClick={handleSave}>{editId ? '保存' : '追加'}</button>
            </div>
          </div>

          {/* 右カラム: メンバー一覧 */}
          <div className="member-list-col">
            <div className="member-add-section-label">メンバー一覧</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={members.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <div className="member-list">
                  {members.length === 0 && (
                    <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>メンバーなし</span>
                  )}
                  {members.map(m => (
                    <SortableRow
                      key={m.id}
                      member={m}
                      editId={editId}
                      onStartEdit={startEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  )
}
