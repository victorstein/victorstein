// cards-worker/src/index.ts
import { fetchRepos, selectInFlightRepos, type InFlightCard } from "./github"
import { renderCard, renderPlaceholder } from "./render"
import { parseRoute } from "./router"

const USERNAME = "victorstein"
const FALLBACK_URL = "https://github.com/victorstein?tab=repositories&sort=pushed"
const SELECTION_CACHE_KEY = "https://cards.victor-stein.dev/__cache/selection-v1"
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
  const selection = selectInFlightRepos(repos)
  await cache.put(
    cacheKey,
    new Response(JSON.stringify(selection), {
      headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${SELECTION_TTL}` },
    }),
  )
  return selection
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
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
