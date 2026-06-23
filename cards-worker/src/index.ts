// cards-worker/src/index.ts
import {
  fetchRepos,
  selectInFlightRepos,
  buildCard,
  fetchLatestCommit,
  type InFlightCard,
} from "./github"
import { renderCard, renderPlaceholder, renderStack, renderHero, renderSignOff } from "./render"
import { parseRoute } from "./router"

const USERNAME = "victorstein"
const FALLBACK_URL = "https://github.com/victorstein?tab=repositories&sort=pushed"
const SELECTION_CACHE_KEY = "https://cards.victor-stein.dev/__cache/selection-v2"
const SELECTION_TTL = 5400 // 90 min server-side edge cache (independent of client header)

export interface Env {
  GITHUB_TOKEN?: string
}

async function getSelection(env: Env): Promise<InFlightCard[]> {
  const cache = caches.default
  const cacheKey = new Request(SELECTION_CACHE_KEY)
  const hit = await cache.match(cacheKey)
  if (hit) return (await hit.json()) as InFlightCard[]

  const repos = await fetchRepos(USERNAME, env.GITHUB_TOKEN)
  const selected = selectInFlightRepos(repos)
  const cards = await Promise.all(
    selected.map(async (repo) => {
      const commit = await fetchLatestCommit(USERNAME, repo, env.GITHUB_TOKEN).catch(() => null)
      return buildCard(repo, commit)
    }),
  )
  if (cards.some((c) => c.subject !== null)) {
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(cards), {
        headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${SELECTION_TTL}` },
      }),
    )
  }
  return cards
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/stack.svg") {
      return new Response(renderStack(), {
        headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
      })
    }
    if (url.pathname === "/hero.svg") {
      return new Response(renderHero(), {
        headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
      })
    }
    if (url.pathname === "/sign-off.svg") {
      return new Response(renderSignOff(), {
        headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
      })
    }
    if (url.pathname === "/__debug") {
      const headers: Record<string, string> = {
        "User-Agent": "victorstein-cards-worker",
        Accept: "application/vnd.github+json",
      }
      if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`
      const r = await fetch(
        `https://api.github.com/users/${USERNAME}/repos?type=owner&sort=pushed&direction=desc&per_page=100`,
        { headers },
      )
      const body = await r.text()
      return Response.json({
        hasToken: Boolean(env.GITHUB_TOKEN),
        tokenLen: env.GITHUB_TOKEN?.length ?? 0,
        reposStatus: r.status,
        ratelimitRemaining: r.headers.get("x-ratelimit-remaining"),
        ratelimitLimit: r.headers.get("x-ratelimit-limit"),
        bodyPreview: body.slice(0, 200),
      })
    }

    const route = parseRoute(url.pathname)
    if (!route) return new Response("Not found", { status: 404 })

    let selection: InFlightCard[] = []
    try {
      selection = await getSelection(env)
    } catch {
      selection = [] // GitHub down + no cached snapshot → placeholder, never 5xx
    }
    const card = selection[route.slot]

    if (route.svg) {
      const svg = card ? renderCard(card) : renderPlaceholder()
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          // no-store to the client: the victor-stein.dev zone forces a 4h Browser
          // Cache TTL on `public` responses, which would freeze the cards. Freshness
          // comes from Camo refetching + the server-side cache above.
          "Cache-Control": "no-store",
        },
      })
    }
    return Response.redirect(card ? card.url : FALLBACK_URL, 302)
  },
}
