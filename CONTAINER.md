# LocalPlus API — Containerized Deployment

The API now runs as a **single Bunny Magic Container** (Bangkok PoP), mirroring AnswerEngine. This removes the Vercel Hobby **12-function cap** — all routes deploy together in one long-running process.

## What changed
- **`server.mjs`** — one Express app that mounts every handler. Route map mirrors `vercel.json` `rewrites`, **plus** the previously coded-but-undeployed handlers (bookings, businesses, restaurants, notifications, activities, attractions). **30 routes** mount today.
- **`Dockerfile`** — multi-stage → `gcr.io/distroless/nodejs20`. ~52 MB image, port 8080, `/health` probe.
- **`bunny.yaml`** — Magic Container config (Bangkok, 512Mi/0.5vCPU, autoscale 1–3).
- **`scripts/deploy-to-bkk.sh`** — build → push to `registry.bunny.net` → redeploy → health poll.
- **`places.js`, `health.js`, `news/[city].js`** — converted `export default` → `module.exports` so all handlers load uniformly under CommonJS. (Still deploy fine on Vercel too, so the existing Vercel deploy keeps working during cutover.)

The adapter handles Express 5's read-only `req.query` (overrides it per-request) and injects the `?type=`/`?id=` params the rewrites used. Handlers that fail to load are skipped with a log line rather than crashing the server.

## Deploy (one command — build, push, redeploy)
```bash
# 1. Set deploy creds (or put in .env.prod at repo root)
export REGISTRY_IMAGE=registry.bunny.net/localplus-api/api
export BUNNY_API_KEY=...        # Bunny.net account API key

# 2. Run — builds, pushes, then triggers a rolling redeploy via the Magic Containers API
bash scripts/deploy-to-bkk.sh
```
Step 3 now calls the **Magic Containers API** (`https://api.bunny.net/mc`, `AccessKey` auth): it auto-resolves the app id by name (`localplus-api`) and `POST`s the redeploy. If the call fails (e.g. the path differs for your account) it falls back to the manual dashboard step. Overridable env vars:
- `BUNNY_APP_ID` — skip the name lookup (fastest, most reliable)
- `BUNNY_APP_NAME` — default `localplus-api`
- `MC_DEPLOY_PATH` — default `/apps/{id}/deploy`
- `MC_API_BASE` — default `https://api.bunny.net/mc`

**CI alternative (recommended once stable):** `.github/workflows/deploy.yml` builds/pushes and rolls the container via Bunny's official `BunnyWay/actions/container-update-image` action on every push to `main`. Requires repo secrets `BUNNY_REGISTRY_USER`, `BUNNY_REGISTRY_PASSWORD`, `BUNNY_API_KEY`, `BUNNY_APP_ID`.

Runtime secrets are set in **Bunny Dashboard → Container → Environment Variables** (never committed):
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_PLACES_API_KEY`, `BUNNYCDN_*`.

Local sanity check:
```bash
docker build -t localplus-api .
docker run --rm -p 8099:8080 -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... localplus-api
curl localhost:8099/health
```

## First deploy — progress tracker
**✅ Done (automated):**
- Image built and pushed to GHCR: `ghcr.io/dhsg225/localplus-api:latest` (+ commit-pinned tag).
- `REGISTRY_IMAGE` defaults to that path in `scripts/deploy-to-bkk.sh` (no Docker Hub needed; already `docker login ghcr.io` as `dhsg225`).

**⬜ Remaining (you, in dashboards — guided):**
1. **GitHub token** so Bunny can pull the private image: GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → Generate, scope **`read:packages`**. Copy it.
2. **Bunny → Magic Containers → Image Registries → Add** → GitHub → paste that token.
3. **Bunny → Add Application:** image `ghcr.io/dhsg225/localplus-api:latest`, **port 8080**, region **Bangkok (asia-se-bangkok)**, health path **/health**, env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_PLACES_API_KEY`). Deploy. Copy the **App ID** + the `mc-xxxx.bunny.run` URL.
4. **`.env.prod`** (gitignored, repo root): `BUNNY_API_KEY=...` and `BUNNY_APP_ID=...`
5. Test: `curl https://<your-mc-url>.bunny.run/health` → expect `{"status":"OK",...}`
6. From then on, every deploy = `bash scripts/deploy-to-bkk.sh`.

## ⚠️ Before pointing real clients at this — do these first
This is a **behaviour-preserving lift-and-shift**. It does **not** fix the security findings; it makes more endpoints reachable, so the hardening is now more urgent:

1. **Rotate** the previously-committed/hardcoded keys (service-role, OpenRouter, Google Places in `places.js:3`, BunnyCDN) and move them all to env. See `../localplus-architecture-audit/09-security-review.md`.
2. **Add a single JWT-verification middleware** (`server.mjs`) — verify signature + `exp` + `iss` + `aud` against the Supabase JWT secret/JWKS — and require it on all `/api/*` write routes. The handlers currently only base64-decode tokens. Set `SUPABASE_JWT_SECRET` in Bunny once this lands.
3. **Add auth checks** to the newly-exposed write handlers (bookings/businesses/restaurants/notifications) and remove any unauthenticated POSTs before clients use them.
4. **Lock CORS** via `CORS_ORIGINS` once the client origins are known.

## Next architectural step (the worker)
This container is also the natural home for the **background worker** the audit flagged as missing: a second process/entry that drains `notification_queue`/`email_queue` and **publishes business content to AnswerEngine** (`/entities/upsert`). See `../localplus-architecture-audit/02-platform-architecture.md` (two-plane model).
