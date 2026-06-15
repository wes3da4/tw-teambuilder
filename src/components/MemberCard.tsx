import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Member, Role } from '../types'
import { CHARA_MAP, ROLE_ICON, SLOT_ROLE_CLASS } from '../constants'
import MemoTooltip from './MemoTooltip'

interface Props {
  member: Member
  slotRole?: Role
  draggableId: string
  draggableData?: Record<string, unknown>
  absenceMode?: boolean
  onAbsenceClick?: () => void
  showEta?: boolean
}

export default function MemberCard({ member, slotRole, draggableId, draggableData, absenceMode, onAbsenceClick, showEta = true }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    data: draggableData ?? {},
    disabled: member.absent || absenceMode,
  })
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const charaFile = CHARA_MAP[member.chara]
  const roleIcon = ROLE_ICON[member.role]
  const slotRoleClass = slotRole ? SLOT_ROLE_CLASS[slotRole] : ''
  const mismatch = slotRole && slotRole !== 'free' && slotRole !== member.role

  const classes = [
    'member-card',
    isDragging ? 'dragging' : '',
    member.absent ? 'absent' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={setNodeRef}
      {...(!absenceMode ? listeners : {})}
      {...(!absenceMode ? attributes : {})}
      className={classes}
      onClick={absenceMode ? onAbsenceClick : undefined}
      style={absenceMode ? { cursor: 'pointer' } : undefined}
      onMouseEnter={member.memo ? e => setAnchorRect(e.currentTarget.getBoundingClientRect()) : undefined}
      onMouseLeave={member.memo ? () => setAnchorRect(null) : undefined}
    >
      {slotRole && (
        <div className={`card-slot-icon ${slotRoleClass} ${mismatch ? 'mismatch' : ''}`}>
          {slotRole !== 'free' && ROLE_ICON[slotRole] && (
            <img src={ROLE_ICON[slotRole]} alt={slotRole} />
          )}
        </div>
      )}
      <div className="card-chara-icon">
        {charaFile && <img src={`${import.meta.env.BASE_URL}icons/${charaFile}`} alt={member.chara} />}
      </div>
      <div className="card-info">
        <div className="card-name">{member.name}</div>
      </div>
      {showEta && <div className="card-eta">エタ{member.level}</div>}
      <div className="card-role-icon">
        {roleIcon && <img src={roleIcon} alt={member.role} />}
      </div>
      {anchorRect && member.memo && (
        <MemoTooltip text={member.memo} anchorRect={anchorRect} />
      )}
    </div>
  )
}
