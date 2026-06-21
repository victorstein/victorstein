// cards-worker/src/render.ts
import type { InFlightCard } from "./github"

const MONO = "ui-monospace,SFMono-Regular,Menlo,monospace"
const W = 410
const H = 160

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Lua: "#000080",
  HCL: "#844FBA",
  Shell: "#89e051",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return "—"
  const diffMs = Math.max(0, now - t)
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

function code(s: string): string {
  return escapeXml(truncate(s, 38))
}

export function renderCard(card: InFlightCard): string {
  const title = escapeXml(truncate(`victorstein/${card.name}`, 40))
  const promptRepo = escapeXml(truncate(card.name, 18))
  const langColor = card.language ? (LANG_COLORS[card.language] ?? "#8b949e") : null
  const langName = card.language ? escapeXml(card.language.toLowerCase()) : ""
  const meta = escapeXml(`${card.stars} · ${relativeTime(card.pushedAt)}`)

  let body: string
  if (card.diff.length > 0) {
    const subject = `<text x="16" y="76" font-family="${MONO}" font-size="12" fill="#c9d1d9">${code(card.subject ?? "")}</text>`
    const rows = card.diff
      .slice(0, 2)
      .map((d, i) => {
        const color = d.sign === "+" ? "#3fb950" : "#f85149"
        return `<text x="16" y="${98 + i * 18}" font-family="${MONO}" font-size="12" fill="${color}">${d.sign} ${code(d.text)}</text>`
      })
      .join("")
    body = subject + rows
  } else {
    const desc = `<text x="16" y="80" font-family="${MONO}" font-size="12" fill="#6e7681"># ${code(card.description || "no description")}</text>`
    const subj = card.subject
      ? `<text x="16" y="100" font-family="${MONO}" font-size="12" fill="#8b949e">  ${code(card.subject)}</text>`
      : ""
    body = desc + subj
  }

  const lang = langColor
    ? `<circle cx="22" cy="148" r="5" fill="${langColor}"/><text x="34" y="152" font-family="${MONO}" font-size="11.5" fill="#8b949e">${langName}</text>`
    : ""

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="9" fill="#0d1117" stroke="#30363d"/>
  <path d="M1 10 a9 9 0 0 1 9 -9 h${W - 20} a9 9 0 0 1 9 9 v18 h-${W - 1} z" fill="#161b22"/>
  <line x1="1" y1="28" x2="${W - 1}" y2="28" stroke="#30363d"/>
  <circle cx="18" cy="15" r="4" fill="#ff5f56"/><circle cx="33" cy="15" r="4" fill="#ffbd2e"/><circle cx="48" cy="15" r="4" fill="#27c93f"/>
  <text x="${W / 2}" y="19" text-anchor="middle" font-family="${MONO}" font-size="11" fill="#6e7681">${title}</text>
  <text x="16" y="52" font-family="${MONO}" font-size="13" fill="#58a6ff">❯ <tspan fill="#8b949e">git show</tspan> <tspan fill="#7ee787" font-weight="700">${promptRepo}</tspan></text>
  ${body}
  <line x1="16" y1="134" x2="${W - 16}" y2="134" stroke="#21262d"/>
  ${lang}
  <text x="${W - 16}" y="152" text-anchor="end" font-family="${MONO}" font-size="11.5" fill="#8b949e"><tspan fill="#e3b341">★</tspan> ${meta}</text>
</svg>`
}

export function renderPlaceholder(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="9" fill="#0d1117" stroke="#30363d"/>
  <path d="M1 10 a9 9 0 0 1 9 -9 h${W - 20} a9 9 0 0 1 9 9 v18 h-${W - 1} z" fill="#161b22"/>
  <line x1="1" y1="28" x2="${W - 1}" y2="28" stroke="#30363d"/>
  <circle cx="18" cy="15" r="4" fill="#ff5f56"/><circle cx="33" cy="15" r="4" fill="#ffbd2e"/><circle cx="48" cy="15" r="4" fill="#27c93f"/>
  <text x="${W / 2}" y="${H / 2 + 10}" text-anchor="middle" font-family="${MONO}" font-size="13" fill="#6e7681">❯</text>
</svg>`
}
