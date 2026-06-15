import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useAppStore } from './store'
import Sidebar from './components/Sidebar'
import PTArea from './components/PTArea'
import MemberPool from './components/MemberPool'
import ContentModal from './components/ContentModal'
import MemberModal from './components/MemberModal'
import MemberCard from './components/MemberCard'
import type { Content, Member } from './types'

export default function App() {
  const store = useAppStore()
  const { state } = store
  const [showContentModal, setShowContentModal] = useState(false)
  const [editContent, setEditContent] = useState<Content | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [activeCard, setActiveCard] = useState<Member | null>(null)
  const [poolHeight, setPoolHeight] = useState(160)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const ptAreaRef = useRef<HTMLDivElement>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showCopied(key: string) {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    setCopiedKey(key)
    copiedTimerRef.current = setTimeout(() => setCopiedKey(null), 2000)
  }

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    const startY = e.clientY
    const startH = poolHeight
    function onMove(ev: MouseEvent) {
      setPoolHeight(Math.max(80, Math.min(500, startH - (ev.clientY - startY))))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  async function copyScreenshot() {
    if (!ptAreaRef.current) return
    const canvas = await html2canvas(ptAreaRef.current, {
      backgroundColor: null,
      scale: 1,
      useCORS: true,
    })
    canvas.toBlob(blob => {
      if (!blob) return
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      showCopied('screenshot')
    })
  }

  function copyText() {
    if (!activeContent) return
    const ptCount = state.ptCounts[activeContent.id] ?? 1
    const assignments = state.assignments[activeContent.id] ?? {}
    const ptNames = state.ptNames[activeContent.id] ?? {}

    const lines: string[] = [`【${activeContent.name}】`]
    for (let pi = 0; pi < ptCount; pi++) {
      const name = ptNames[pi] ?? `PT${pi + 1}`
      const slots = assignments[pi] ?? {}
      const members = Object.values(slots)
        .map(id => id ? state.members.find(m => m.id === id) : null)
        .filter(Boolean) as typeof state.members
      const memberText = members.length ? members.map(m => m.name).join(' / ') : '(空)'
      lines.push(`${name}: ${memberText}`)
    }
    navigator.clipboard.writeText(lines.join('\n'))
    showCopied('text')
  }

  function copyAIPrompt() {
    if (!activeContent) return

    const roleLabels: Record<string, string> = { tank: 'タンク', heal: 'ヒーラー', dps: 'アタッカー', free: '指定なし' }
    const roleParts = (['tank', 'heal', 'dps', 'free'] as const)
      .filter(r => activeContent.roles[r] > 0)
      .map(r => `${roleLabels[r]}×${activeContent.roles[r]}`)
      .join(' ')

    const ptCount = state.ptCounts[activeContent.id] ?? 1

    const availableMembers = state.members.filter(m => !m.absent)

    const memberRows = availableMembers.map(m => {
      const roleLabel = roleLabels[m.role] ?? m.role
      const memo = m.memo?.trim() ? `（${m.memo.trim()}）` : ''
      return `- ${m.name}：${m.chara} / ${roleLabel} / エタ${m.level}${memo}`
    })

    const ptNameList = Array.from({ length: ptCount }, (_, i) => {
      const name = (state.ptNames[activeContent.id] ?? {})[i] ?? `PT${i + 1}`
      return `  - PT${i + 1}: ${name}`
    })

    const lines: string[] = [
      'あなたはTalesWeaverオンラインゲームのチームコンテンツパーティ編成アドバイザーです。',
      '以下の情報をもとに、最適なPT編成を提案してください。',
      '',
      '## コンテンツ情報',
      `- コンテンツ名: ${activeContent.name}`,
      `- PT構成: ${roleParts}（1PTあたり合計${activeContent.ptSize}人）`,
      `- PT一覧（${ptCount}PT）:`,
      ...ptNameList,
    ]

    if (activeContent.memo?.trim()) {
      lines.push(`- 今回のメモ: ${activeContent.memo.trim()}`)
    }

    lines.push('')
    lines.push('## 参加メンバー（欠席者を除く）')
    if (memberRows.length > 0) {
      lines.push(...memberRows)
    } else {
      lines.push('（メンバーなし）')
    }

    lines.push('')
    lines.push('## 依頼')
    lines.push(`上記の情報とメモを考慮して、${ptCount}PT分の最適なチーム編成を提案してください。`)
    lines.push('各メンバーのロール・エタレベル・メモを踏まえ、バランスの取れた配置を複数案示してください。')

    const ptNameList2 = Array.from({ length: ptCount }, (_, i) => {
      const name = (state.ptNames[activeContent.id] ?? {})[i] ?? `PT${i + 1}`
      return `${name}: メンバー名 / メンバー名 / ...`
    })
    lines.push('')
    lines.push('## 出力フォーマット')
    lines.push(`【${activeContent.name}】`)
    lines.push(...ptNameList2)

    navigator.clipboard.writeText(lines.join('\n'))
    showCopied('ai')
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const collisionDetection: CollisionDetection = (args) => {
    if (args.active.data.current?.type === 'pt-sort') return closestCenter(args)
    const hits = pointerWithin(args)
    return hits.length > 0 ? hits : rectIntersection(args)
  }

  const activeContent = state.contents.find(c => c.id === state.activeContentId) ?? null
  const contentAssignments = activeContent ? (state.assignments[activeContent.id] ?? {}) : {}
  const ptCount = activeContent ? (state.ptCounts[activeContent.id] ?? 1) : 1
  const ptNames = activeContent ? (state.ptNames[activeContent.id] ?? {}) : {}

  const assignedIds = new Set<string>()
  if (activeContent) {
    for (const ptSlots of Object.values(contentAssignments)) {
      for (const mid of Object.values(ptSlots)) {
        if (mid) assignedIds.add(mid)
      }
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as Record<string, unknown>
    if (data.type === 'pool') {
      const m = state.members.find(m => m.id === data.memberId)
      setActiveCard(m ?? null)
    } else if (data.type === 'slot') {
      const { contentId, ptIdx, slotIdx } = data as { contentId: string; ptIdx: number; slotIdx: number }
      const mid = state.assignments[contentId]?.[ptIdx]?.[slotIdx] ?? null
      const m = mid ? state.members.find(m => m.id === mid) : null
      setActiveCard(m ?? null)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = event
    const src = active.data.current as Record<string, unknown>

    // PT ボックス並び替え
    if (src.type === 'pt-sort' && activeContent) {
      if (!over || active.id === over.id) return
      const ptIds = Array.from({ length: state.ptCounts[activeContent.id] ?? 1 }, (_, i) => `pt-${i}`)
      const from = ptIds.indexOf(active.id as string)
      const to = ptIds.indexOf(over.id as string)
      if (from !== -1 && to !== -1) store.reorderPTs(activeContent.id, from, to)
      return
    }

    // スロット外へのドロップ → プールに戻す
    if (!over) {
      if (src.type === 'slot' && activeContent) {
        const { contentId, ptIdx: fromPt, slotIdx: fromSlot } = src as { contentId: string; ptIdx: number; slotIdx: number }
        store.removeFromSlot(contentId, fromPt, fromSlot)
      }
      return
    }

    const dst = over.data.current as Record<string, unknown>
    if (!dst || !activeContent) return

    const { contentId, ptIdx: toPt, slotIdx: toSlot } = dst as { contentId: string; ptIdx: number; slotIdx: number }
    if (contentId !== activeContent.id) return

    if (src.type === 'pool') {
      const memberId = src.memberId as string
      store.moveFromPool(contentId, memberId, toPt, toSlot)
    } else if (src.type === 'slot') {
      const { ptIdx: fromPt, slotIdx: fromSlot } = src as { contentId: string; ptIdx: number; slotIdx: number }
      if (fromPt === toPt && fromSlot === toSlot) return
      store.swapAssign(contentId, fromPt, fromSlot, toPt, toSlot)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="app-shell">
        <header className="app-header">
          <div className="logo-group">
            <div className="logo">TW Team Builder</div>
            <span className="copyright">Copyright © 2009 NEXON Korea Corporation and NEXON Co., Ltd. All Rights Reserved.</span>
          </div>
          <button className="nav-btn" onClick={() => setShowMemberModal(true)}>
            メンバー管理
          </button>
        </header>
        <div className="app-body">
          <Sidebar
            contents={state.contents}
            activeId={state.activeContentId}
            onSelect={store.setActiveContent}
            onAdd={() => { setEditContent(null); setShowContentModal(true) }}
          />
          <div className="right-col">
            {activeContent ? (
              <>
                <div className="content-header">
                  <div className="content-header-main">
                    <div className="title">{activeContent.name}</div>
                    <div className="meta">
                      最大{activeContent.ptSize}人 /
                      {activeContent.roles.tank > 0 && ` タンク×${activeContent.roles.tank}`}
                      {activeContent.roles.heal > 0 && ` ヒーラー×${activeContent.roles.heal}`}
                      {activeContent.roles.dps > 0 && ` アタッカー×${activeContent.roles.dps}`}
                      {activeContent.roles.free > 0 && ` 指定なし×${activeContent.roles.free}`}
                    </div>
                    <div className="spacer" />
                    {copiedKey && (
                      <span className="copy-feedback">✓ コピーしました</span>
                    )}
                    <button className="setting-btn" onClick={copyText} title="PT編成をテキストでコピー">
                      <i className="ti ti-clipboard-text" />
                    </button>
                    <button className="setting-btn" onClick={copyScreenshot} title="スクリーンショットをコピー">
                      <i className="ti ti-camera" />
                    </button>
                    <button className="setting-btn ai-prompt-btn" onClick={copyAIPrompt} title="AI編成プロンプトをコピー">
                      <i className="ti ti-robot" /> AI
                    </button>
                    <button className="setting-btn" onClick={() => { setEditContent(activeContent); setShowContentModal(true) }}>
                      ⚙ 設定
                    </button>
                  </div>
                  <div className="content-memo-bar">
                    <span className="content-memo-label">メモ</span>
                    <input
                      className="content-memo-input"
                      value={activeContent.memo ?? ''}
                      onChange={e => store.updateContent({ ...activeContent, memo: e.target.value })}
                      placeholder=""
                    />
                  </div>
                </div>
                <PTArea
                  ptAreaRef={ptAreaRef}
                  content={activeContent}
                  ptCount={ptCount}
                  ptNames={ptNames}
                  assignments={contentAssignments}
                  members={state.members}
                  showEta={state.showEta}
                  onAddPT={() => store.addPT(activeContent.id)}
                  onRemovePT={i => store.removePT(activeContent.id, i)}
                  onPTNameChange={(i, name) => store.setPTName(activeContent.id, i, name)}
                  onReorderPTs={(from, to) => store.reorderPTs(activeContent.id, from, to)}
                />
                <MemberPool members={state.members} assignedIds={assignedIds} showEta={state.showEta} poolHeight={poolHeight} onResizeStart={handleResizeStart} onUpdateMember={store.updateMember} />
              </>
            ) : (
              <div className="no-content">
                コンテンツを選択または追加してください
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="drag-overlay">
            <MemberCard
              member={activeCard}
              draggableId="overlay"
              draggableData={{}}
            />
          </div>
        )}
      </DragOverlay>

      {showContentModal && (
        <ContentModal
          key={editContent?.id ?? 'new'}
          initial={editContent ?? undefined}
          onSave={c => {
            if (editContent) store.updateContent(c)
            else store.addContent(c)
            setShowContentModal(false)
          }}
          onClose={() => setShowContentModal(false)}
          onDelete={editContent ? () => { store.deleteContent(editContent.id); setShowContentModal(false) } : undefined}
        />
      )}

      {showMemberModal && (
        <MemberModal
          members={state.members}
          showEta={state.showEta}
          onToggleEta={store.toggleShowEta}
          onAdd={store.addMember}
          onUpdate={store.updateMember}
          onDelete={store.deleteMember}
          onReorder={store.reorderMembers}
          onClose={() => setShowMemberModal(false)}
        />
      )}
    </DndContext>
  )
}
