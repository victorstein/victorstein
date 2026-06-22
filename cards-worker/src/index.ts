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
import { chooseSelection, isCacheable } from "./selection"

const USERNAME = "victorstein"
const FALLBACK_URL = "https://github.com/victorstein?tab=repositories&sort=pushed"
const SELECTION_CACHE_KEY = "https://cards.victor-stein.dev/__cache/selection-v2"
const SELECTION_FALLBACK_KEY = "https://cards.victor-stein.dev/__cache/selection-fallback-v2"
const SELECTION_TTL = 5400 // 90 min freshness cache (independent of client header)
const FALLBACK_TTL = 604800 // 7 day last-known-good cache, served only when a live fetch fails

export interface Env {
  GITHUB_TOKEN?: string
}

async function readCache(cache: Cache, key: string): Promise<InFlightCard[] | null> {
  const hit = await cache.match(new Request(key))
  return hit ? ((await hit.json()) as InFlightCard[]) : null
}

async function buildSelection(env: Env): Promise<InFlightCard[]> {
  const repos = await fetchRepos(USERNAME, env.GITHUB_TOKEN)
  const selected = selectInFlightRepos(repos)
  return Promise.all(
    selected.map(async (repo) => {
      const commit = await fetchLatestCommit(USERNAME, repo, env.GITHUB_TOKEN).catch(() => null)
      return buildCard(repo, commit)
    }),
  )
}

async function getSelection(env: Env): Promise<InFlightCard[]> {
  const cache = caches.default

  const fresh = await readCache(cache, SELECTION_CACHE_KEY)
  if (fresh && fresh.length) return fresh

  let fetched: InFlightCard[] | null = null
  try {
    fetched = await buildSelection(env)
  } catch {
    fetched = null // GitHub down / rate-limited → fall back below, never blank tiles
  }

  if (fetched && isCacheable(fetched)) {
    const body = JSON.stringify(fetched)
    const put = (key: string, ttl: number) =>
      cache.put(
        new Request(key),
        new Response(body, {
          headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${ttl}` },
        }),
      )
    await Promise.all([put(SELECTION_CACHE_KEY, SELECTION_TTL), put(SELECTION_FALLBACK_KEY, FALLBACK_TTL)])
  }

  const fallback = fetched && fetched.length ? null : await readCache(cache, SELECTION_FALLBACK_KEY)
  return chooseSelection({ fresh: null, fetched, fallback })
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
