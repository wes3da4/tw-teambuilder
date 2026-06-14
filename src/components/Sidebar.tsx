import type { Content } from '../types'

interface Props {
  contents: Content[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
}

export default function Sidebar({ contents, activeId, onSelect, onAdd }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>コンテンツ</span>
        <button className="add-btn" onClick={onAdd} title="コンテンツを追加">＋</button>
      </div>
      <div className="content-list">
        {contents.length === 0 && (
          <div style={{ padding: '16px 10px', color: 'var(--text-dim)', fontSize: 12, textAlign: 'center' }}>
            コンテンツがありません
          </div>
        )}
        {contents.map(c => (
          <div
            key={c.id}
            className={`content-item ${c.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            <div className="name">{c.name}</div>
            <div className="meta">max{c.ptSize}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
