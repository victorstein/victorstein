// cards-worker/src/router.ts
import { SLOT_COUNT } from "./github"

export interface Route {
  slot: number
  svg: boolean
}

export function parseRoute(pathname: string): Route | null {
  const m = pathname.match(/^\/in-flight\/(\d+)(\.svg)?$/)
  if (!m) return null
  const slot = Number(m[1])
  if (slot < 0 || slot >= SLOT_COUNT) return null
  return { slot, svg: Boolean(m[2]) }
}
