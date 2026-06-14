import React, { useRef, useEffect, useState } from 'react'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Content, Member } from '../types'
import PTBox from './PTBox'

interface Props {
  content: Content
  ptCount: number
  ptNames: Record<number, string>
  assignments: Record<number, Record<number, string | null>>
  members: Member[]
  showEta: boolean
  ptAreaRef: React.RefObject<HTMLDivElement | null>
  onAddPT: () => void
  onRemovePT: (ptIdx: number) => void
  onPTNameChange: (ptIdx: number, name: string) => void
  onReorderPTs?: (from: number, to: number) => void
}

interface SortablePTBoxProps {
  id: string
  ptIdx: number
  content: Content
  ptName: string
  slotAssignments: Record<number, string | null>
  members: Member[]
  showEta: boolean
  onNameChange: (name: string) => void
  onRemove: () => void
  canRemove: boolean
  measureRef?: React.RefObject<HTMLDivElement | null>
}

function SortablePTBox({ id, ptIdx, content, ptName, slotAssignments, members, showEta, onNameChange, onRemove, canRemove, measureRef }: SortablePTBoxProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'pt-sort' },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={node => { setNodeRef(node); if (measureRef) (measureRef as React.MutableRefObject<HTMLDivElement | null>).current = node }} style={style}>
      <PTBox
        content={content}
        ptIdx={ptIdx}
        ptName={ptName}
        slotAssignments={slotAssignments}
        members={members}
        showEta={showEta}
        onNameChange={onNameChange}
        onRemove={onRemove}
        canRemove={canRemove}
        dragHandleListeners={listeners as Record<string, unknown> | undefined}
        dragHandleAttributes={attributes as unknown as Record<string, unknown>}
      />
    </div>
  )
}

export default function PTArea({ content, ptCount, ptNames, assignments, members, showEta, ptAreaRef, onAddPT, onRemovePT, onPTNameChange }: Props) {
  const ptIds = Array.from({ length: ptCount }, (_, i) => `pt-${i}`)
  const firstBoxRef = useRef<HTMLDivElement>(null)
  const [ptBoxHeight, setPtBoxHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!firstBoxRef.current) return
    const observer = new ResizeObserver(entries => {
      setPtBoxHeight(entries[0].contentRect.height)
    })
    observer.observe(firstBoxRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="pt-area">
      <SortableContext items={ptIds} strategy={horizontalListSortingStrategy}>
        <div className="pt-boxes" ref={ptAreaRef}>
          {Array.from({ length: ptCount }, (_, i) => (
            <SortablePTBox
              key={`pt-${i}`}
              id={`pt-${i}`}
              ptIdx={i}
              content={content}
              ptName={ptNames[i] ?? `PT${i + 1}`}
              slotAssignments={assignments[i] ?? {}}
              members={members}
              showEta={showEta}
              onNameChange={name => onPTNameChange(i, name)}
              onRemove={() => onRemovePT(i)}
              canRemove={ptCount > 1}
              measureRef={i === 0 ? firstBoxRef : undefined}
            />
          ))}
          <div className="pt-add-wrap" data-html2canvas-ignore style={ptBoxHeight !== undefined ? { height: ptBoxHeight } : undefined}>
            <button className="pt-add-btn" onClick={onAddPT}><i className="ti ti-plus" /></button>
          </div>
        </div>
      </SortableContext>
    </div>
  )
}
