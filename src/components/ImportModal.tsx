import { useState, useMemo } from 'react'
import type { Content, Member } from '../types'

interface ParsedPT {
  ptName: string
  memberNames: string[]
}

interface ParseResult {
  pts: ParsedPT[]
  errors: string[]
}

function parseMemberNames(rest: string): string[] {
  if (rest === '' || rest === '(空)') return []
  return rest.split('/').map(s => s.trim()).filter(s => s && s !== '(空)')
}

function parseText(text: string, members: Member[], ptSize: number): ParseResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const pts: ParsedPT[] = []
  const errors: string[] = []
  let pendingPtName: string | null = null

  for (const line of lines) {
    if (/^【.*】$/.test(line)) continue

    // 1行形式: "PT名: メンバー / メンバー" → コロン+スペースを区切りとして検出
    // 時刻の "22:00" はコロンの直後が数字なのでマッチしない
    const sepIdx = line.indexOf(': ')
    if (sepIdx !== -1) {
      const ptName = line.slice(0, sepIdx).trim()
      const rest = line.slice(sepIdx + 2).trim()
      if (ptName) {
        pts.push({ ptName, memberNames: parseMemberNames(rest) })
        pendingPtName = null
        continue
      }
    }

    // 複数行形式: PT名の次の行をメンバー行として扱う
    if (pendingPtName !== null) {
      pts.push({ ptName: pendingPtName, memberNames: parseMemberNames(line) })
      pendingPtName = null
      continue
    }

    // PT名として保持（次の行がメンバー行の想定）
    pendingPtName = line
  }

  for (const { ptName, memberNames } of pts) {
    if (memberNames.length > ptSize) {
      errors.push(`「${ptName}」のメンバー数（${memberNames.length}人）がPT定員（${ptSize}人）を超えています`)
    }
    for (const name of memberNames) {
      if (!members.find(m => m.name === name)) {
        errors.push(`「${ptName}」に未登録メンバー「${name}」が含まれています`)
      }
    }
  }

  return { pts, errors }
}

interface Props {
  content: Content
  members: Member[]
  onApply: (layout: { ptName: string; memberIds: string[] }[]) => void
  onClose: () => void
}

export default function ImportModal({ content, members, onApply, onClose }: Props) {
  const [text, setText] = useState('')

  const { pts, errors } = useMemo(
    () => parseText(text, members, content.ptSize),
    [text, members, content.ptSize],
  )

  function handleApply() {
    if (errors.length > 0 || pts.length === 0) return
    if (!window.confirm('現在の配置を全てクリアして、テキストの内容で上書きします。よろしいですか？')) return

    const layout = pts.map(({ ptName, memberNames }) => ({
      ptName,
      memberIds: memberNames
        .map(name => members.find(m => m.name === name)?.id ?? '')
        .filter(Boolean),
    }))
    onApply(layout)
    onClose()
  }

  const hasContent = pts.length > 0

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal import-modal">
        <div className="modal-title">
          <span>テキストから配置</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="form-row">
          <label>共有されたテキストまたはAIによる編成テキストを貼り付け</label>
          <textarea
            className="memo-textarea import-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`【${content.name}】\nPT1: メンバー名 / メンバー名 / ...`}
            rows={8}
            autoFocus
          />
        </div>

        {hasContent && errors.length === 0 && (
          <div className="import-preview">
            <div className="import-preview-label">プレビュー</div>
            {pts.map((pt, i) => (
              <div key={i} className="import-preview-row">
                <span className="import-pt-name">{pt.ptName}</span>
                <span className="import-members">
                  {pt.memberNames.length > 0 ? pt.memberNames.join(' / ') : '(空)'}
                </span>
              </div>
            ))}
          </div>
        )}

        {errors.length > 0 && (
          <div className="import-errors">
            {errors.map((err, i) => (
              <div key={i} className="import-error-row">⚠ {err}</div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>キャンセル</button>
          <button
            className="btn-primary"
            onClick={handleApply}
            disabled={!hasContent || errors.length > 0}
          >
            配置を適用
          </button>
        </div>
      </div>
    </div>
  )
}
