import { useEffect, useRef, useState } from 'react'
import type { Story } from '../types/database'

function computeInitialOrder(stories: Story[], ranking: Record<string, number> | null): string[] {
  const ids = stories.map((s) => s.id)
  if (!ranking || Object.keys(ranking).length === 0) return ids
  return [...ids].sort((a, b) => (ranking[a] ?? 999) - (ranking[b] ?? 999))
}

/** Keeps a local ranking order in sync as stories are added/removed, preserving relative order. */
export function useOrderState(stories: Story[], initialRanking: Record<string, number> | null) {
  const [order, setOrder] = useState<string[]>(() => computeInitialOrder(stories, initialRanking))
  const seededRef = useRef(false)

  // initialRanking loads asynchronously and may still be null/empty on first
  // render; seed the order from it once, the first time it actually arrives.
  useEffect(() => {
    if (!seededRef.current && initialRanking && Object.keys(initialRanking).length > 0) {
      setOrder(computeInitialOrder(stories, initialRanking))
      seededRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRanking])

  useEffect(() => {
    setOrder((prev) => {
      const known = new Set(stories.map((s) => s.id))
      const kept = prev.filter((id) => known.has(id))
      const missing = stories.map((s) => s.id).filter((id) => !kept.includes(id))
      return [...kept, ...missing]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories.length])

  return [order, setOrder] as const
}
