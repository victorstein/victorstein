// cards-worker/src/selection.ts
import type { InFlightCard } from "./github"

export interface SelectionInputs {
  fresh: InFlightCard[] | null // hit on the short-lived freshness cache
  fetched: InFlightCard[] | null // live GitHub result, or null if the fetch failed
  fallback: InFlightCard[] | null // hit on the long-lived last-known-good cache
}

// Pick what to serve, in priority order. The key property: a failed live fetch
// (fetched === null) must never collapse to an empty array when a last-known-good
// snapshot exists — an empty selection renders placeholder tiles that GitHub's
// Camo proxy then freezes into the README for hours.
export function chooseSelection({ fresh, fetched, fallback }: SelectionInputs): InFlightCard[] {
  if (fresh && fresh.length) return fresh
  if (fetched && fetched.length) return fetched
  return fallback ?? []
}

// Only persist a selection worth falling back to: non-empty and carrying at least
// one real commit subject. Guards both caches from freezing a blank/degraded state.
export function isCacheable(cards: InFlightCard[]): boolean {
  return cards.length > 0 && cards.some((c) => c.subject !== null)
}
