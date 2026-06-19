import { useState } from 'react'
import type { Member } from '../types'
import MemberCard from './MemberCard'

interface Props {
  members: Member[]
  assignedIds: Set<string>
  showEta: boolean
  poolHeight: number
  onResizeStart: (e: React.MouseEvent) => void
  onUpdateMember: (member: Member) => void
  draggingChara?: string | null
  draggingMemberId?: string | null
}

export default function MemberPool({ members, assignedIds, showEta, poolHeight, onResizeStart, onUpdateMember, draggingChara, draggingMemberId }: Props) {
  const [absenceMode, setAbsenceMode] = useState(false)

  const unassigned = members.filter(m => !assignedIds.has(m.id))

  function handleCardClick(member: Member) {
    if (!absenceMode) return
    onUpdateMember({ ...member, absent: !member.absent })
  }

  return (
    <div className="member-pool">
      <div className="pool-header" onMouseDown={onResizeStart}>
        <span className="label">メンバー一覧</span>
        <div className="spacer" />
        <div
          className="absence-toggle"
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setAbsenceMode(v => !v)}
        >
          <span>欠席者</span>
          <div className={`toggle-track ${absenceMode ? 'on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
        </div>
      </div>
      <div className="pool-cards" style={{ height: poolHeight }}>
        {unassigned.map(m => (
          <MemberCard
            key={m.id}
            member={m}
            draggableId={`pool-card:${m.id}`}
            draggableData={{ type: 'pool', memberId: m.id }}
            absenceMode={absenceMode}
            onAbsenceClick={() => handleCardClick(m)}
            showEta={showEta}
            draggingChara={draggingChara}
            draggingMemberId={draggingMemberId}
          />
        ))}
        {unassigned.length === 0 && (
          <span style={{ color: 'var(--text-dim)', fontSize: 12, padding: '4px 2px' }}>
            未配置のメンバーはいません
          </span>
        )}
      </div>
    </div>
  )
}
