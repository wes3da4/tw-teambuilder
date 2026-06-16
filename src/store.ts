import { useState, useCallback } from 'react'
import type { AppState, Member, Content } from './types'

const STORAGE_KEY = 'tw-team-builder'

const defaultState: AppState = {
  contents: [],
  members: [],
  assignments: {},
  ptCounts: {},
  ptNames: {},
  activeContentId: null,
  showEta: true,
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultState, ...JSON.parse(raw) }
  } catch {}
  return defaultState
}

function save(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(load)

  const update = useCallback((updater: (s: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev)
      save(next)
      return next
    })
  }, [])

  const setActiveContent = useCallback((id: string | null) => {
    update(s => ({ ...s, activeContentId: id }))
  }, [update])

  const addContent = useCallback((content: Content) => {
    update(s => ({
      ...s,
      contents: [...s.contents, content],
      ptCounts: { ...s.ptCounts, [content.id]: 1 },
      ptNames: { ...s.ptNames, [content.id]: { 0: 'PT1' } },
      assignments: { ...s.assignments, [content.id]: { 0: {} } },
      activeContentId: content.id,
    }))
  }, [update])

  const updateContent = useCallback((content: Content) => {
    update(s => ({
      ...s,
      contents: s.contents.map(c => c.id === content.id ? content : c),
    }))
  }, [update])

  const deleteContent = useCallback((id: string) => {
    update(s => {
      const contents = s.contents.filter(c => c.id !== id)
      const assignments = { ...s.assignments }
      const ptCounts = { ...s.ptCounts }
      const ptNames = { ...s.ptNames }
      delete assignments[id]
      delete ptCounts[id]
      delete ptNames[id]
      return {
        ...s,
        contents,
        assignments,
        ptCounts,
        ptNames,
        activeContentId: s.activeContentId === id ? (contents[0]?.id ?? null) : s.activeContentId,
      }
    })
  }, [update])

  const addMember = useCallback((member: Member) => {
    update(s => ({ ...s, members: [...s.members, member] }))
  }, [update])

  const updateMember = useCallback((member: Member) => {
    update(s => ({ ...s, members: s.members.map(m => m.id === member.id ? member : m) }))
  }, [update])

  const deleteMember = useCallback((id: string) => {
    update(s => {
      const assignments = JSON.parse(JSON.stringify(s.assignments)) as AppState['assignments']
      for (const cid of Object.keys(assignments)) {
        for (const ptIdx of Object.keys(assignments[cid])) {
          for (const slotIdx of Object.keys(assignments[cid][+ptIdx])) {
            if (assignments[cid][+ptIdx][+slotIdx] === id) {
              assignments[cid][+ptIdx][+slotIdx] = null
            }
          }
        }
      }
      return { ...s, members: s.members.filter(m => m.id !== id), assignments }
    })
  }, [update])

  const addPT = useCallback((contentId: string) => {
    update(s => {
      const count = (s.ptCounts[contentId] ?? 0) + 1
      const ptIdx = count - 1
      return {
        ...s,
        ptCounts: { ...s.ptCounts, [contentId]: count },
        ptNames: {
          ...s.ptNames,
          [contentId]: { ...(s.ptNames[contentId] ?? {}), [ptIdx]: `PT${count}` },
        },
        assignments: {
          ...s.assignments,
          [contentId]: { ...(s.assignments[contentId] ?? {}), [ptIdx]: {} },
        },
      }
    })
  }, [update])

  const removePT = useCallback((contentId: string, ptIdx: number) => {
    update(s => {
      const count = (s.ptCounts[contentId] ?? 1) - 1
      if (count < 1) return s
      const ptNames = { ...(s.ptNames[contentId] ?? {}) }
      const assignments = { ...(s.assignments[contentId] ?? {}) }
      delete ptNames[ptIdx]
      delete assignments[ptIdx]
      // re-index
      const newPtNames: Record<number, string> = {}
      const newAssignments: Record<number, Record<number, string | null>> = {}
      let newIdx = 0
      for (let i = 0; i <= count; i++) {
        if (i === ptIdx) continue
        newPtNames[newIdx] = ptNames[i] ?? `PT${newIdx + 1}`
        newAssignments[newIdx] = assignments[i] ?? {}
        newIdx++
      }
      return {
        ...s,
        ptCounts: { ...s.ptCounts, [contentId]: count },
        ptNames: { ...s.ptNames, [contentId]: newPtNames },
        assignments: { ...s.assignments, [contentId]: newAssignments },
      }
    })
  }, [update])

  const setPTName = useCallback((contentId: string, ptIdx: number, name: string) => {
    update(s => ({
      ...s,
      ptNames: {
        ...s.ptNames,
        [contentId]: { ...(s.ptNames[contentId] ?? {}), [ptIdx]: name },
      },
    }))
  }, [update])

  const assign = useCallback((contentId: string, ptIdx: number, slotIdx: number, memberId: string | null) => {
    update(s => ({
      ...s,
      assignments: {
        ...s.assignments,
        [contentId]: {
          ...(s.assignments[contentId] ?? {}),
          [ptIdx]: {
            ...(s.assignments[contentId]?.[ptIdx] ?? {}),
            [slotIdx]: memberId,
          },
        },
      },
    }))
  }, [update])

  const swapAssign = useCallback((
    contentId: string,
    fromPt: number, fromSlot: number,
    toPt: number, toSlot: number,
  ) => {
    update(s => {
      const next = JSON.parse(JSON.stringify(s.assignments)) as AppState['assignments']
      if (!next[contentId]) next[contentId] = {}
      if (!next[contentId][fromPt]) next[contentId][fromPt] = {}
      if (!next[contentId][toPt]) next[contentId][toPt] = {}
      const a = next[contentId][fromPt][fromSlot] ?? null
      const b = next[contentId][toPt][toSlot] ?? null
      next[contentId][fromPt][fromSlot] = b
      next[contentId][toPt][toSlot] = a
      return { ...s, assignments: next }
    })
  }, [update])

  const moveFromPool = useCallback((
    contentId: string, memberId: string, toPt: number, toSlot: number,
  ) => {
    update(s => {
      const next = JSON.parse(JSON.stringify(s.assignments)) as AppState['assignments']
      if (!next[contentId]) next[contentId] = {}
      if (!next[contentId][toPt]) next[contentId][toPt] = {}
      const displaced = next[contentId][toPt][toSlot] ?? null
      // remove memberId from any existing slot
      for (const ptIdx of Object.keys(next[contentId])) {
        for (const slotIdx of Object.keys(next[contentId][+ptIdx])) {
          if (next[contentId][+ptIdx][+slotIdx] === memberId) {
            next[contentId][+ptIdx][+slotIdx] = displaced
          }
        }
      }
      next[contentId][toPt][toSlot] = memberId
      // if displaced was not in any slot above we're fine
      return { ...s, assignments: next }
    })
  }, [update])

  const toggleShowEta = useCallback(() => {
    update(s => ({ ...s, showEta: !s.showEta }))
  }, [update])

  const applyLayout = useCallback((contentId: string, layout: { ptName: string; memberIds: string[] }[]) => {
    update(s => {
      const newPtNames: Record<number, string> = {}
      const newAssignments: Record<number, Record<number, string | null>> = {}
      layout.forEach(({ ptName, memberIds }, idx) => {
        newPtNames[idx] = ptName
        newAssignments[idx] = {}
        memberIds.forEach((id, slotIdx) => {
          newAssignments[idx][slotIdx] = id
        })
      })
      return {
        ...s,
        ptCounts: { ...s.ptCounts, [contentId]: layout.length },
        ptNames: { ...s.ptNames, [contentId]: newPtNames },
        assignments: { ...s.assignments, [contentId]: newAssignments },
      }
    })
  }, [update])

  const reorderMembers = useCallback((from: number, to: number) => {
    update(s => {
      const members = [...s.members]
      const [moved] = members.splice(from, 1)
      members.splice(to, 0, moved)
      return { ...s, members }
    })
  }, [update])

  const reorderPTs = useCallback((contentId: string, from: number, to: number) => {
    update(s => {
      const count = s.ptCounts[contentId] ?? 1
      const indices = Array.from({ length: count }, (_, i) => i)
      const [moved] = indices.splice(from, 1)
      indices.splice(to, 0, moved)
      const oldNames = s.ptNames[contentId] ?? {}
      const oldAssignments = s.assignments[contentId] ?? {}
      const newNames: Record<number, string> = {}
      const newAssignments: Record<number, Record<number, string | null>> = {}
      indices.forEach((oldIdx, newIdx) => {
        newNames[newIdx] = oldNames[oldIdx] ?? `PT${newIdx + 1}`
        newAssignments[newIdx] = oldAssignments[oldIdx] ?? {}
      })
      return {
        ...s,
        ptNames: { ...s.ptNames, [contentId]: newNames },
        assignments: { ...s.assignments, [contentId]: newAssignments },
      }
    })
  }, [update])

  const removeFromSlot = useCallback((contentId: string, ptIdx: number, slotIdx: number) => {
    update(s => {
      const next = JSON.parse(JSON.stringify(s.assignments)) as AppState['assignments']
      if (next[contentId]?.[ptIdx]) {
        next[contentId][ptIdx][slotIdx] = null
      }
      return { ...s, assignments: next }
    })
  }, [update])

  return {
    state,
    setActiveContent,
    addContent,
    updateContent,
    deleteContent,
    addMember,
    updateMember,
    deleteMember,
    addPT,
    removePT,
    setPTName,
    assign,
    swapAssign,
    moveFromPool,
    removeFromSlot,
    reorderMembers,
    reorderPTs,
    toggleShowEta,
    applyLayout,
  }
}
