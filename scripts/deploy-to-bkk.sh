#!/usr/bin/env bash
# LocalPlus API — One-Command Deploy to Bangkok PoP (Bunny Magic Container)
# Usage: bash scripts/deploy-to-bkk.sh
# Mirrors AnswerEngine/scripts/deploy-to-bkk.sh.
#
# Required env vars (export, or place in .env.prod at repo root):
#   REGISTRY_IMAGE    e.g. registry.bunny.net/localplus-api/api
#   BUNNY_API_KEY     Bunny.net API key
#
# Runtime secrets (set in Bunny Dashboard, NOT here — rotate the previously-committed ones first):
#   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#   OPENROUTER_API_KEY, GOOGLE_PLACES_API_KEY, BUNNYCDN_*

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Load .env.prod via Node (handles long JWT values zsh can't source) ────────
if [[ -f "$ROOT/.env.prod" ]]; then
  echo "▶ Loading .env.prod..."
  _ENV_LOADER="$ROOT/.tmp-env-loader.mjs"
  cat > "$_ENV_LOADER" <<'JSEOF'
import { readFileSync } from 'fs';
const lines = readFileSync(process.argv[2], 'utf8').split('\n');
for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx === -1) continue;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim().replace(/'/g, "'\\''");
  process.stdout.write("export " + key + "='" + val + "'\n");
}
JSEOF
  eval "$(node "$_ENV_LOADER" "$ROOT/.env.prod")"
  rm -f "$_ENV_LOADER"
fi

# ── Defaults ──────────────────────────────────────────────────────────────────
# GHCR (you are already `docker login ghcr.io` as dhsg225). Override in .env.prod if needed.
REGISTRY_IMAGE="${REGISTRY_IMAGE:-ghcr.io/dhsg225/localplus-api}"

# ── Validate ──────────────────────────────────────────────────────────────────
REQUIRED_VARS=(BUNNY_API_KEY)
MISSING=()
for var in "${REQUIRED_VARS[@]}"; do [[ -z "${!var:-}" ]] && MISSING+=("$var"); done
if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "✗ Missing required env vars:"; printf '    %s\n' "${MISSING[@]}"
  echo "  Export them or create $ROOT/.env.prod"; exit 1
fi

IMAGE_TAG="${REGISTRY_IMAGE}:$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo 'latest')"
IMAGE_LATEST="${REGISTRY_IMAGE}:latest"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LocalPlus API  ·  Deploy to Bangkok PoP"
echo "  Image : $IMAGE_TAG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Build ─────────────────────────────────────────────────────────────
echo "▶ [1/4] Building Docker image (linux/amd64)..."
docker build --platform linux/amd64 --tag "$IMAGE_TAG" --tag "$IMAGE_LATEST" "$ROOT"
SIZE=$(docker image inspect "$IMAGE_TAG" --format='{{.Size}}' | awk '{printf "%.1f MB", $1/1024/1024}')
echo "  ✓ Build complete — Image size: $SIZE"

# ── Step 2: Push ──────────────────────────────────────────────────────────────
echo "▶ [2/4] Pushing to registry..."
docker push "$IMAGE_TAG"
docker push "$IMAGE_LATEST"
echo "  ✓ Pushed $IMAGE_TAG"

# ── Step 3: Trigger rolling redeploy via the Magic Containers API ─────────────
# Official API base: https://api.bunny.net/mc   (auth header: "AccessKey: <key>")
# Overridable so you can adjust without editing logic:
#   MC_API_BASE          default https://api.bunny.net/mc
#   BUNNY_APP_NAME       default localplus-api   (used to auto-resolve the id)
#   BUNNY_APP_ID         skip name lookup if you already know the id
#   MC_DEPLOY_PATH       default /apps/{id}/deploy   ({id} is substituted)
# If the API call fails for any reason, we fall back to the manual dashboard step
# rather than aborting the deploy (image is already pushed; redeploy is idempotent).
MC_API="${MC_API_BASE:-https://api.bunny.net/mc}"
APP_NAME="${BUNNY_APP_NAME:-localplus-api}"
AUTH_HDR="AccessKey: ${BUNNY_API_KEY}"

echo "▶ [3/4] Triggering rolling redeploy via Magic Containers API..."

APP_ID="${BUNNY_APP_ID:-}"
if [[ -z "$APP_ID" ]]; then
  echo "  ▶ Resolving app id for '$APP_NAME'..."
  if APPS_JSON=$(curl -fsSL -H "$AUTH_HDR" "$MC_API/apps" 2>/dev/null); then
    APP_ID=$(printf '%s' "$APPS_JSON" | node -e '
      let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
        let j;try{j=JSON.parse(s)}catch{process.exit(0)}
        const items=Array.isArray(j)?j:(j.Items||j.items||j.data||j.Applications||[]);
        const m=items.find(x=>(x.name||x.Name)===process.argv[1]);
        if(m)process.stdout.write(String(m.id||m.Id||m.appId||m.ApplicationId||""));
      });' "$APP_NAME") || true
  fi
fi

REDEPLOYED=0
if [[ -n "$APP_ID" ]]; then
  DEPLOY_PATH="${MC_DEPLOY_PATH:-/apps/{id}/deploy}"
  DEPLOY_URL="${MC_API}${DEPLOY_PATH/\{id\}/$APP_ID}"
  echo "  ▶ POST $DEPLOY_URL"
  if curl -fsSL -X POST -H "$AUTH_HDR" -H 'Content-Type: application/json' "$DEPLOY_URL" >/dev/null 2>&1; then
    echo "  ✓ Rolling redeploy triggered (app $APP_ID, pulls $IMAGE_TAG)"
    REDEPLOYED=1
  else
    echo "  ⚠ Redeploy API call failed (endpoint/path may differ for your account)."
  fi
else
  echo "  ⚠ Could not resolve app id automatically."
fi

if [[ $REDEPLOYED -eq 0 ]]; then
  echo "  → Fallback: trigger redeploy manually, then continue:"
  echo "      1. https://dash.bunny.net → Magic Containers → $APP_NAME → Redeploy"
  echo "      (or set BUNNY_APP_ID / MC_DEPLOY_PATH in .env.prod and re-run)"
  read -r -p "  Press Enter once redeploy is running to begin health polling..."
fi

# ── Step 4: Health poll ───────────────────────────────────────────────────────
echo "▶ [4/4] Waiting for health check..."
HEALTH_URL="${CONTAINER_URL:-https://localplus-api.b-cdn.net}/health"
MAX_ATTEMPTS=12; ATTEMPT=0
until curl --silent --fail "$HEALTH_URL" > /dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  if [[ $ATTEMPT -ge $MAX_ATTEMPTS ]]; then
    echo "  ✗ Health check timed out after $((MAX_ATTEMPTS * 5))s — check Bunny logs"; exit 1
  fi
  echo "  ... waiting (${ATTEMPT}/${MAX_ATTEMPTS})"; sleep 5
done
echo "  ✓ Container is live at $HEALTH_URL"
echo ""
echo "━━ Deploy complete · Bangkok PoP is live · $IMAGE_TAG ━━"
