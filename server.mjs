// LocalPlus API — containerized entrypoint
// Mounts every Vercel-style handler (module.exports = async (req,res)=>{}) onto a
// single long-running Express app. This removes the Vercel Hobby 12-function cap:
// all routes deploy in one container. Route map mirrors vercel.json `rewrites`,
// extended with the previously-undeployed handlers.
//
// SECURITY NOTE: this is a behaviour-preserving lift-and-shift. Each handler keeps
// its existing (weak) per-handler auth. The next step (see CONTAINER.md) is a single
// JWT-verification middleware + auth on writes BEFORE pointing real clients at the
// newly-exposed endpoints (bookings/businesses/restaurants/notifications/etc.).

import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const app = express();
const PORT = process.env.PORT || 8080;
const APP_VERSION = process.env.APP_VERSION || 'v1-container';

// --- Middleware -------------------------------------------------------------
// CORS: preserve current permissive behaviour by default; lock down via CORS_ORIGINS.
const origins = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim());
app.use(
  cors({
    origin: origins && origins.length ? origins : true,
    methods: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    allowedHeaders:
      'Content-Type, Authorization, x-user-token, x-supabase-token, x-original-authorization, x-source, X-Requested-With, Accept',
  })
);
// JSON body parsing only for application/json — multipart (busboy in media/ingestion)
// passes through untouched so the raw stream reaches the handler.
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// --- Handler adapter --------------------------------------------------------
// Express 5 exposes req.query via a getter, so direct assignment doesn't stick.
// We override it per-request with a plain merged object before invoking the handler.
function mount(method, path, handlerFile, injectedQuery = {}) {
  let handler;
  try {
    handler = require(handlerFile);
  } catch (err) {
    console.error(`✗ skip ${method.toUpperCase()} ${path} — failed to load ${handlerFile}: ${err.message}`);
    return false;
  }
  if (typeof handler !== 'function') {
    console.error(`✗ skip ${method.toUpperCase()} ${path} — ${handlerFile} did not export a function`);
    return false;
  }

  app[method](path, async (req, res) => {
    const merged = { ...req.query, ...req.params, ...injectedQuery };
    Object.defineProperty(req, 'query', { value: merged, writable: true, configurable: true });
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`✗ ${method.toUpperCase()} ${path} handler error:`, err);
      if (!res.headersSent) res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
  return true;
}

// `all` = accept any HTTP method (handlers branch on req.method internally, Vercel-style).
const all = (path, file, q) => mount('all', path, file, q);

// --- Route table (mirrors vercel.json rewrites + undeployed handlers) --------
const routes = [
  // Health
  ['/health', './health.js'],
  ['/api/health', './health.js'],

  // Auth
  ['/api/auth', './auth/route.js'],
  ['/api/auth/register', './auth/route.js'],

  // Events (mature domain)
  ['/api/events', './events/route.js'],
  ['/api/events/all', './events/all/route.js'],
  ['/api/events/:id/participants', './events/[id]/participants/route.js'],
  ['/api/events/:id/attendance', './events/[id]/attendance/route.js'],
  ['/api/events/:id', './events/[id]/route.js'],

  // Event metadata / organizers / calendars
  ['/api/organizers', './organizers/route.js'],
  ['/api/calendars', './calendars/route.js'],
  ['/api/locations', './metadata/route.js', { type: 'locations' }],
  ['/api/categories', './metadata/route.js', { type: 'categories' }],

  // Media
  ['/api/media/:id', './media/route.js'],
  ['/api/media', './media/route.js'],

  // News (WordPress passthrough) + Places (Google proxy)
  ['/api/news/:city', './news/[city].js'],
  ['/api/places', './places.js'],

  // Ingestion (consolidated handler, switched by ?type=)
  ['/api/data-ingest', './ingestion/unified.js', { type: 'events' }],
  ['/api/restaurants/ingest', './ingestion/unified.js', { type: 'restaurants' }],
  ['/api/ingest/businesses', './ingestion/unified.js', { type: 'businesses' }],

  // --- Previously coded-but-UNDEPLOYED (now live; harden auth before client use) ---
  ['/api/bookings/:id/cancel', './bookings/[id]/cancel/route.js'],
  ['/api/bookings/:id/confirm', './bookings/[id]/confirm/route.js'],
  ['/api/bookings/:id', './bookings/[id]/route.js'],
  ['/api/bookings', './bookings/route.js'],
  ['/api/businesses', './businesses/route.js'],
  ['/api/restaurants/search', './restaurants/search/route.js'],
  ['/api/restaurants', './restaurants/route.js'],
  ['/api/notifications', './notifications/route.js'],
  ['/api/activities', './activities/route.js'],
  ['/api/attractions', './attractions/route.js'],
];

let mounted = 0;
const failed = [];
for (const [path, file, q] of routes) {
  if (all(path, file, q)) mounted += 1;
  else failed.push(path);
}

// --- Root + fallthrough -----------------------------------------------------
app.get('/', (_req, res) =>
  res.json({ service: 'localplus-api', version: APP_VERSION, status: 'ok', routes: mounted })
);
app.use((req, res) => res.status(404).json({ success: false, error: `No route: ${req.method} ${req.path}` }));

app.listen(PORT, () => {
  console.log(`🚀 localplus-api (${APP_VERSION}) on :${PORT} — ${mounted} routes mounted` + (failed.length ? `, ${failed.length} skipped` : ''));
  if (failed.length) console.log('   skipped:', failed.join(', '));
});
