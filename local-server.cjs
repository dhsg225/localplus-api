// [2025-11-29] - Simple Express server for local API testing
// Alternative to Vercel dev when you don't want to login
// Using .cjs extension to work with CommonJS route handlers
const express = require('express');
const cors = require('cors');
const { createRequire } = require('module');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create a require function that can load .js files as CommonJS
// by temporarily removing the "type": "module" constraint
const requireFromPackage = (filePath) => {
  const fullPath = path.resolve(filePath);
  // Use require with full path - Node will handle it
  delete require.cache[fullPath];
  return require(fullPath);
};

// Import route handlers using dynamic require
// Note: These files use CommonJS but package.json has "type": "module"
// So we need to load them carefully
let eventsRoute, eventsAllRoute, eventsIdRoute, eventsParticipantsRoute;

try {
  // Try loading as CommonJS modules
  eventsRoute = require('./events/route.js');
  eventsAllRoute = require('./events/superuser-route.js');
  eventsIdRoute = require('./events/[id]/route.js');
  eventsParticipantsRoute = require('./events/[id]/participants/route.js');
} catch (err) {
  console.error('Error loading route handlers:', err.message);
  console.log('\n💡 Tip: Test against production API instead:');
  console.log('   Visit http://localhost:9003/events');
  console.log('   (Uses https://api.localplus.city by default)\n');
  process.exit(1);
}

// Routes - Handle events endpoints
app.all('/api/events/all', async (req, res) => {
  // Superuser endpoint
  return eventsAllRoute(req, res);
});

app.all('/api/events/:id/participants', async (req, res) => {
  // Participants endpoint
  req.query.id = req.params.id;
  return eventsParticipantsRoute(req, res);
});

app.all('/api/events/:id', async (req, res) => {
  // Individual event endpoint
  req.query.id = req.params.id;
  return eventsIdRoute(req, res);
});

app.all('/api/events', async (req, res) => {
  // Main events endpoint
  return eventsRoute(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📡 Superuser endpoint: http://localhost:${PORT}/api/events/all`);
  console.log(`📡 Events endpoint: http://localhost:${PORT}/api/events`);
  console.log(`\n✅ Ready to test! Visit http://localhost:9003/events in partner app`);
});

