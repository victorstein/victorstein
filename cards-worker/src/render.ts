// cards-worker/src/render.ts
import type { InFlightCard } from "./github"

const WIDTH = 440
const HEIGHT = 120
const FONT = "'Segoe UI',Helvetica,Arial,sans-serif"

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Lua: "#000080",
  HCL: "#844FBA",
  Shell: "#89e051",
  Go: "#00ADD8",
  Rust: "#dea584",
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const diffMs = Math.max(0, now - Date.parse(iso))
  const m = Math.floor(diffMs / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function truncate(s: string, max: number): string {
  const cp = [...s]
  return cp.length > max ? cp.slice(0, max - 1).join("").trimEnd() + "…" : s
}

function frame(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img">
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="10" fill="#0d1117" stroke="#30363d"/>
  ${inner}
</svg>`
}

export function renderCard(card: InFlightCard): string {
  const name = escapeXml(card.name)
  const desc = escapeXml(truncate(card.description, 60))
  const langColor = card.language ? (LANG_COLORS[card.language] ?? "#8b949e") : null
  const langText = card.language ? escapeXml(card.language) : ""
  const langGroup = langColor
    ? `<circle cx="24" cy="90" r="6" fill="${langColor}"/><text x="36" y="95" font-family="${FONT}" font-size="12" fill="#8b949e">${langText}</text>`
    : ""
  return frame(
    `<text x="20" y="34" font-family="${FONT}" font-size="18" font-weight="600" fill="#58a6ff">${name}</text>
  <text x="20" y="60" font-family="${FONT}" font-size="13" fill="#8b949e">${desc}</text>
  ${langGroup}
  <text x="${WIDTH - 20}" y="95" text-anchor="end" font-family="${FONT}" font-size="12" fill="#8b949e">★ ${card.stars}</text>`,
  )
}

export function renderPlaceholder(): string {
  return frame(
    `<text x="${WIDTH / 2}" y="${HEIGHT / 2 + 6}" text-anchor="middle" font-family="${FONT}" font-size="16" fill="#8b949e">—</text>`,
  )
}
