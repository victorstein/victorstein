// cards-worker/src/render.ts
import type { InFlightCard } from "./github"

const MONO = "ui-monospace,SFMono-Regular,Menlo,monospace"
const W = 394
const H = 160
const MARGIN = 8 // transparent padding baked into the canvas so adjacent cards have a gap (GitHub strips CSS margins)
const CW = W + 2 * MARGIN
const CH = H + 2 * MARGIN

const THEME = {
  bg: "#1e1e2e",
  titlebar: "#181825",
  border: "#45475a",
  divider: "#313244",
  text: "#cdd6f4",
  muted: "#6c7086",
  prompt: "#7c3aed",
  green: "#a6e3a1",
  red: "#f38ba8",
  key: "#89b4fa",
  star: "#f9e2af",
  accent: "#7c3aed",
}

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
  const langColor = card.language ? (LANG_COLORS[card.language] ?? THEME.muted) : null
  const langName = card.language ? escapeXml(card.language.toLowerCase()) : ""
  const meta = escapeXml(`${card.stars} · ${relativeTime(card.pushedAt)}`)

  let body: string
  if (card.diff.length > 0) {
    const subject = `<text x="16" y="76" font-family="${MONO}" font-size="12" fill="${THEME.text}">${code(card.subject ?? "")}</text>`
    const rows = card.diff
      .slice(0, 2)
      .map((d, i) => {
        const color = d.sign === "+" ? THEME.green : THEME.red
        return `<text x="16" y="${98 + i * 18}" font-family="${MONO}" font-size="12" fill="${color}">${d.sign} ${code(d.text)}</text>`
      })
      .join("")
    body = subject + rows
  } else {
    const desc = `<text x="16" y="80" font-family="${MONO}" font-size="12" fill="${THEME.muted}"># ${code(card.description || "no description")}</text>`
    const subj = card.subject
      ? `<text x="16" y="100" font-family="${MONO}" font-size="12" fill="${THEME.muted}">  ${code(card.subject)}</text>`
      : ""
    body = desc + subj
  }

  const lang = langColor
    ? `<circle cx="22" cy="148" r="5" fill="${langColor}"/><text x="34" y="152" font-family="${MONO}" font-size="11.5" fill="${THEME.muted}">${langName}</text>`
    : ""

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" role="img">
  <g transform="translate(${MARGIN},${MARGIN})">
  <defs><clipPath id="clip"><rect x="0" y="0" width="${W}" height="${H}" rx="9"/></clipPath></defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="9" fill="${THEME.bg}" stroke="${THEME.border}"/>
  <path d="M1 10 a9 9 0 0 1 9 -9 h${W - 20} a9 9 0 0 1 9 9 v18 h-${W - 1} z" fill="${THEME.titlebar}"/>
  <line x1="1" y1="28" x2="${W - 1}" y2="28" stroke="${THEME.border}"/>
  <g clip-path="url(#clip)"><rect x="0" y="0" width="${W}" height="5" fill="${THEME.accent}"/></g>
  <circle cx="18" cy="15" r="4" fill="${THEME.red}"/><circle cx="33" cy="15" r="4" fill="${THEME.star}"/><circle cx="48" cy="15" r="4" fill="${THEME.green}"/>
  <text x="${W / 2}" y="19" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${THEME.muted}">${title}</text>
  <text x="16" y="52" font-family="${MONO}" font-size="13" fill="${THEME.prompt}">❯ <tspan fill="${THEME.muted}">git show</tspan> <tspan fill="${THEME.green}" font-weight="700">${promptRepo}</tspan></text>
  ${body}
  <line x1="16" y1="134" x2="${W - 16}" y2="134" stroke="${THEME.divider}"/>
  ${lang}
  <text x="${W - 16}" y="152" text-anchor="end" font-family="${MONO}" font-size="11.5" fill="${THEME.muted}"><tspan fill="${THEME.star}">★</tspan> ${meta}</text>
  </g>
</svg>`
}

export function renderPlaceholder(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" role="img">
  <g transform="translate(${MARGIN},${MARGIN})">
  <defs><clipPath id="clip"><rect x="0" y="0" width="${W}" height="${H}" rx="9"/></clipPath></defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="9" fill="${THEME.bg}" stroke="${THEME.border}"/>
  <path d="M1 10 a9 9 0 0 1 9 -9 h${W - 20} a9 9 0 0 1 9 9 v18 h-${W - 1} z" fill="${THEME.titlebar}"/>
  <line x1="1" y1="28" x2="${W - 1}" y2="28" stroke="${THEME.border}"/>
  <g clip-path="url(#clip)"><rect x="0" y="0" width="${W}" height="5" fill="${THEME.accent}"/></g>
  <circle cx="18" cy="15" r="4" fill="${THEME.red}"/><circle cx="33" cy="15" r="4" fill="${THEME.star}"/><circle cx="48" cy="15" r="4" fill="${THEME.green}"/>
  <text x="${W / 2}" y="${H / 2 + 10}" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${THEME.muted}">❯</text>
  </g>
</svg>`
}

const SW = 780
const SH = 360
const NVIM_PATH =
  "M2.214 4.954v13.615L7.655 24V10.314L3.312 3.845 3.312 3.845 2.214 4.954zm4.999 17.98l-4.557-4.548V5.136l.59-.596 3.967 5.908v12.485zm14.573-4.457l-.862.937-4.24-6.376V0l5.068 5.092.034 13.385zM7.431.001l12.998 19.835-3.637 3.637L3.787 3.683 7.43 0"
const STACK_PALETTE = ["#f38ba8", "#a6e3a1", "#f9e2af", "#89b4fa", "#cba6f7", "#94e2d5", "#cdd6f4", "#6c7086"]
const STACK: { key: string; value: string; aside?: string }[] = [
  { key: "languages", value: "typescript · python · lua · hcl · shell" },
  { key: "runtime", value: "bun · node · pnpm" },
  { key: "framework", value: "nestjs", aside: "(yes, for everything — APIs, daemons, CLIs)" },
  { key: "data", value: "prisma · sqlite · redis · bullmq" },
  { key: "graphql", value: "apollo · graphql-codegen · graphql-armor" },
  { key: "tui", value: "ink · @opentui/core · solid" },
  { key: "frontend", value: "react · next · tailwind · zustand · tanstack-query" },
  { key: "mobile", value: "react-native · expo · nativewind" },
  { key: "test", value: "vitest · playwright" },
  { key: "infra", value: "opentofu · docker · github-actions · tailscale · aws s3" },
  { key: "terminal", value: "wezterm · neovim (lazyvim) · starship · lazygit · pass" },
]

export function renderStack(): string {
  const rows = STACK.map((r, i) => {
    const y = i * 22
    const aside = r.aside ? ` <tspan fill="${THEME.muted}">${escapeXml(r.aside)}</tspan>` : ""
    return (
      `<text x="0" y="${y}" font-family="${MONO}" font-size="12.5" fill="${THEME.key}" font-weight="700">${escapeXml(r.key)}</text>` +
      `<text x="96" y="${y}" font-family="${MONO}" font-size="12.5" fill="${THEME.text}">${escapeXml(r.value)}${aside}</text>`
    )
  }).join("\n  ")

  const palette = STACK_PALETTE.map((c, i) => `<rect x="${i * 17}" width="13" height="13" rx="2" fill="${c}"/>`).join("")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}" role="img" aria-label="Favorite stack">
  <defs><clipPath id="clip"><rect x="0" y="0" width="${SW}" height="${SH}" rx="10"/></clipPath></defs>
  <rect x="0.5" y="0.5" width="${SW - 1}" height="${SH - 1}" rx="10" fill="${THEME.bg}" stroke="${THEME.border}"/>
  <g clip-path="url(#clip)"><rect x="0" y="0" width="${SW}" height="5" fill="${THEME.accent}"/></g>
  <g transform="translate(46,123) scale(4.8)"><path d="${NVIM_PATH}" fill="#57A143"/></g>
  <text x="103" y="270" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${THEME.muted}">neovim</text>
  <line x1="210" y1="44" x2="210" y2="324" stroke="${THEME.divider}"/>
  <text x="234" y="54" font-family="${MONO}" font-size="13" fill="${THEME.green}" font-weight="700">stein<tspan fill="${THEME.muted}">@</tspan><tspan fill="#fab387">stein-cloud</tspan></text>
  <line x1="234" y1="62" x2="754" y2="62" stroke="${THEME.border}"/>
  <g transform="translate(234,86)">${rows}</g>
  <g transform="translate(234,338)">${palette}</g>
</svg>`
}

const HERO_W = 800
const HERO_H = 490

export function renderHero(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${HERO_W}" height="${HERO_H}" viewBox="0 0 ${HERO_W} ${HERO_H}" role="img" aria-label="victorstein — Full-stack TypeScript engineer in Nicaragua. I build NestJS + GraphQL backends, React + Next.js frontends, and the CLIs/TUIs that tie everything together. This README is itself produced by a block of OpenTofu (github_repository_file). Yes, really.">
  <defs><clipPath id="clip"><rect x="0" y="0" width="${HERO_W}" height="${HERO_H}" rx="10"/></clipPath></defs>
  <rect x="0.5" y="0.5" width="${HERO_W - 1}" height="${HERO_H - 1}" rx="10" fill="${THEME.bg}" stroke="${THEME.border}"/>
  <path d="M1 11 a10 10 0 0 1 10 -10 h${HERO_W - 22} a10 10 0 0 1 10 10 v19 h-${HERO_W - 1} z" fill="${THEME.titlebar}"/>
  <line x1="1" y1="30" x2="${HERO_W - 1}" y2="30" stroke="${THEME.border}"/>
  <g clip-path="url(#clip)"><rect x="0" y="0" width="${HERO_W}" height="5" fill="${THEME.accent}"/></g>
  <circle cx="20" cy="16" r="4.5" fill="${THEME.red}"/><circle cx="37" cy="16" r="4.5" fill="${THEME.star}"/><circle cx="54" cy="16" r="4.5" fill="${THEME.green}"/>
  <text x="${HERO_W / 2}" y="20" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${THEME.muted}">victorstein@stein-cloud — ~/profile</text>
  <g font-family="${MONO}" font-size="13.5">
    <text x="20" y="60" fill="${THEME.prompt}">❯ <tspan fill="${THEME.green}">whoami</tspan></text>
    <text x="20" y="82" fill="${THEME.green}" font-weight="700">victorstein</text>
    <text x="20" y="116" fill="${THEME.prompt}">❯ <tspan fill="${THEME.green}">cat</tspan> <tspan fill="${THEME.muted}">bio.md</tspan></text>
    <text x="20" y="138" fill="${THEME.text}">Full-stack TypeScript engineer in Nicaragua. I build NestJS + GraphQL backends,</text>
    <text x="20" y="158" fill="${THEME.text}">React + Next.js frontends, and the CLIs/TUIs that tie everything together.</text>
    <text x="20" y="194" fill="${THEME.prompt}">❯ <tspan fill="#cba6f7" font-weight="700"># the block of OpenTofu that produces this profile:</tspan></text>
    <text x="20" y="216" fill="${THEME.prompt}">❯ <tspan fill="${THEME.green}">bat</tspan> <tspan fill="${THEME.muted}">profile.tf</tspan></text>
    <text x="20" y="238" fill="${THEME.muted}"># stein-infra/tofu/repos.tf</text>
    <text x="20" y="260" fill="${THEME.text}"><tspan fill="#cba6f7">resource</tspan> <tspan fill="${THEME.green}">"github_repository_file"</tspan> <tspan fill="${THEME.green}">"this"</tspan> {</text>
    <text x="36" y="282" fill="${THEME.text}"><tspan fill="${THEME.key}">for_each</tspan> = local.repository_files</text>
    <text y="320" fill="${THEME.text}"><tspan x="36" fill="${THEME.key}">repository</tspan><tspan x="205" fill="${THEME.muted}">=</tspan><tspan x="224">each.value.repository</tspan><tspan x="410" fill="${THEME.muted}"># "victorstein"</tspan></text>
    <text y="342" fill="${THEME.text}"><tspan x="36" fill="${THEME.key}">file</tspan><tspan x="205" fill="${THEME.muted}">=</tspan><tspan x="224">each.value.file</tspan><tspan x="410" fill="${THEME.muted}"># "README.md"</tspan></text>
    <text y="364" fill="${THEME.text}"><tspan x="36" fill="${THEME.key}">content</tspan><tspan x="205" fill="${THEME.muted}">=</tspan><tspan x="224">each.value.content</tspan><tspan x="410" fill="${THEME.muted}"># file("profile-readme.md")</tspan></text>
    <text y="386" fill="${THEME.text}"><tspan x="36" fill="${THEME.key}">overwrite_on_create</tspan><tspan x="205" fill="${THEME.muted}">=</tspan><tspan x="224" fill="#fab387">true</tspan></text>
    <text x="20" y="408" fill="${THEME.text}">}</text>
    <text x="20" y="450" fill="${THEME.muted}"># Yes, really.</text>
  </g>
</svg>`
}
