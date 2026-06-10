# Focus Target Manager

Staff-facing UI for adding and managing image-recognition targets in the
[Focus Image Resolver](https://github.com/BarnesFoundation/Focus-Image-Resolver)
engine. Mobile-first; designed for frontline staff capturing in-gallery
`__REF_` supplemental images on their own phones during Photo Day and
day-to-day.

Replaces the dormant 2023
[Barnes-Craftar-Capture](https://github.com/BarnesFoundation/Barnes-Craftar-Capture)
(last touched 2023-10-04, fed Vuforia, which is the dependency being
eliminated). Architecture rationale lives at
`docs/focus-target-manager-architecture.md` in the engine repo.

## Stack

- Vite + React 18 + TypeScript 5 (modern build, hot reload)
- Tailwind CSS (mobile-first responsive)
- TanStack Query (server-state cache + invalidation)
- MSAL.js (Microsoft Entra OAuth, single-tenant, PKCE/SPA flow)
- React Router 6

No Lambda, no AWS hosting layer. The build artifact is a static bundle
served by Caddy on the same on-prem box that hosts the Focus Image
Resolver engine. Same origin as `/api/manage/*`, so no CORS.

## Architecture in one paragraph

The UI signs the user in via Microsoft Entra (Barnes tenant). MSAL.js
holds an ID/access token in `sessionStorage` and the engine HTTP client
attaches it as a Bearer header on every `/api/manage/*` request. The
engine validates the token against Microsoft's JWKS (see
`src/api/auth.py` in the engine repo) and writes a per-day JSONL audit
line for every mutation. Token refresh is silent (MSAL handles
acquireTokenSilent); on expiry the user is re-prompted.

In dev (no Azure config) the engine drops to "disabled" mode and the UI
proceeds without auth — useful for `vite dev` against a local engine.

## Dev

```bash
npm install
cp .env.example .env.local
# fill in VITE_AZURE_TENANT_ID + VITE_AZURE_CLIENT_ID once the app is
# registered in the Barnes Azure tenant; leave empty for local dev
# against a no-auth engine.
npm run dev
```

The Vite dev server proxies `/api/*` to `VITE_ENGINE_BASE_URL`
(defaults to `http://localhost:8000`).

## Build + deploy

```bash
npm run build         # → dist/
```

Copy `dist/` to the engine box, e.g.:

```
/opt/focus/manage/  →  served by Caddy at engine.barnesfoc.us/manage
```

Caddy site block (sketch — Deploy Claude lands the real one):

```
engine.barnesfoc.us {
    # existing engine routes
    reverse_proxy /api/* localhost:8000
    reverse_proxy /v1/* localhost:8000
    reverse_proxy /v2/* localhost:8000

    # static UI
    handle_path /manage* {
        root * /opt/focus/manage
        try_files {path} /index.html
        file_server
    }

    # convenience redirect for the bare hostname
    redir / /manage/ permanent
}
```

`base: "/manage/"` in `vite.config.ts` and `<BrowserRouter basename="/manage">`
in `App.tsx` keep all URLs prefix-consistent.

## Azure AD app registration

See `FOCUS_ENGINE_DEPLOYMENT.md` in the engine repo, section
"Target management auth (v0.5 → v0.6+)". The same `tenant_id` +
`client_id` go into both the engine's `FOCUS_AZURE_*` env vars (for
token validation) and this app's `VITE_AZURE_*` env vars (for token
acquisition).

Redirect URI to register in Azure:
`https://engine.barnesfoc.us/manage/auth/callback`

## Roadmap

- **v0.1 (scaffold, this commit):** Browse list, Add page (file upload),
  Detail page with variant list + delete, Stats dashboard, MSAL OAuth,
  mobile-first layout. No crop UI yet.
- **v0.2:** `cropperjs` integration — staff frame the artwork before
  upload so the engine doesn't have to guess via center-50% crop.
- **v0.3:** Background-task UI polish for `/api/manage/reindex`; job
  status polling card on the Stats page.
- **v0.4:** Audit log viewer (read-only) for the last N days.

## What this UI does NOT do

- Approve/review workflow. Every add goes live immediately. Bad adds
  get fixed via delete + re-add — staff trust their own work.
- Per-user permissions or roles. Anyone in the Barnes tenant with the
  app assignment can add.
- Replace existing targets in bulk. Single-add only in v0.1; bulk paths
  are a future workstream.
- Talk to Vuforia, Catchoom, or any other recognition vendor. This UI
  is engine-native.
