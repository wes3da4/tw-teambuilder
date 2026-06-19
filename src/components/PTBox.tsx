import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { Content, Member, Role } from '../types'
import MemberCard from './MemberCard'
import PTBuffDebuffPanel from './PTBuffDebuffPanel'
import { ROLE_ICON, SLOT_ROLE_CLASS } from '../constants'

function buildSlots(roles: Content['roles']): Role[] {
  const slots: Role[] = []
  for (let i = 0; i < roles.tank; i++) slots.push('tank')
  for (let i = 0; i < roles.heal; i++) slots.push('heal')
  for (let i = 0; i < roles.dps; i++) slots.push('dps')
  for (let i = 0; i < roles.free; i++) slots.push('free')
  return slots
}

interface SlotProps {
  contentId: string
  ptIdx: number
  slotIdx: number
  slotRole: Role
  member?: Member
  showEta: boolean
  draggingChara?: string | null
  draggingMemberId?: string | null
}

function Slot({ contentId, ptIdx, slotIdx, slotRole, member, showEta, draggingChara, draggingMemberId }: SlotProps) {
  const dropId = `slot:${contentId}:${ptIdx}:${slotIdx}`
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { contentId, ptIdx, slotIdx } })

  if (member) {
    return (
      <div ref={setNodeRef}>
        <MemberCard
          member={member}
          slotRole={slotRole}
          draggableId={`slot-card:${contentId}:${ptIdx}:${slotIdx}`}
          draggableData={{ type: 'slot', contentId, ptIdx, slotIdx }}
          showEta={showEta}
          draggingChara={draggingChara}
          draggingMemberId={draggingMemberId}
        />
      </div>
    )
  }

  return (
    <div ref={setNodeRef} className={`slot-empty ${isOver ? 'over' : ''}`}>
      <div className={`slot-role-icon ${SLOT_ROLE_CLASS[slotRole]}`}>
        {slotRole !== 'free' && ROLE_ICON[slotRole] && (
          <img src={ROLE_ICON[slotRole]} alt={slotRole} />
        )}
      </div>
      <span className="slot-label">空きスロット</span>
    </div>
  )
}

interface Props {
  content: Content
  ptIdx: number
  ptName: string
  slotAssignments: Record<number, string | null>
  members: Member[]
  showEta: boolean
  onNameChange: (name: string) => void
  onRemove: () => void
  canRemove: boolean
  dragHandleListeners?: Record<string, unknown>
  dragHandleAttributes?: Record<string, unknown>
  draggingChara?: string | null
  draggingMemberId?: string | null
}

export default function PTBox({ content, ptIdx, ptName, slotAssignments, members, showEta, onNameChange, onRemove, canRemove, dragHandleListeners, dragHandleAttributes, draggingChara, draggingMemberId }: Props) {
  const slots = buildSlots(content.roles)
  const filled = slots.filter((_, i) => slotAssignments[i]).length
  const [showBuffDebuff, setShowBuffDebuff] = useState(false)

  const assignedMembers = Object.values(slotAssignments)
    .map(mid => mid ? members.find(m => m.id === mid) : undefined)
    .filter((m): m is Member => !!m)
  const uniqueAssignedMembers = Array.from(new Map(assignedMembers.map(m => [m.chara, m])).values())

  return (
    <div className={`pt-box${showBuffDebuff ? ' pt-box--buffdebuff-open' : ''}`}>
      <div className="pt-box-header">
        <span
          className="pt-drag-handle"
          {...dragHandleListeners}
          {...dragHandleAttributes}
          title="ドラッグで並び替え"
        >
          <i className="ti ti-grip-vertical" />
        </span>
        <input
          className="pt-name-input"
          value={ptName}
          onChange={e => onNameChange(e.target.value)}
        />
        <span className="pt-count">{filled}/{slots.length}</span>
        {canRemove && (
          <button className="pt-remove-btn" onClick={onRemove} title="PTを削除">×</button>
        )}
      </div>
      <div className="pt-slots">
        {slots.map((role, i) => {
          const mid = slotAssignments[i] ?? null
          const member = mid ? members.find(m => m.id === mid) : undefined
          return (
            <Slot
              key={i}
              contentId={content.id}
              ptIdx={ptIdx}
              slotIdx={i}
              slotRole={role}
              member={member}
              showEta={showEta}
              draggingChara={draggingChara}
              draggingMemberId={draggingMemberId}
            />
          )
        })}
      </div>
      <button
        type="button"
        className="pt-buffdebuff-toggle"
        data-html2canvas-ignore
        onClick={() => setShowBuffDebuff(v => !v)}
        title="バフ/デバフ確認"
      >
        <i className={`ti ti-chevron-${showBuffDebuff ? 'up' : 'down'}`} />
      </button>
      {showBuffDebuff && (
        <PTBuffDebuffPanel members={uniqueAssignedMembers.map(m => ({ chara: m.chara, masterySelections: m.masterySelections ?? {}, buildType: m.buildType }))} />
      )}
    </div>
  )
}
