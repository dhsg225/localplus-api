# LocalPlus API - RESTART Guide

**Recent Activity Log:**
- [Bangkok Time: 2025-12-12 12:35:00] - Rolled back events/all select to minimal columns to restore listing (remove image fields causing 500).
- [Bangkok Time: 2025-12-12 12:25:00] - Trimmed events/all select to hero_image_url/image_url (removed metadata) to stop 500s while keeping covers.
- [Bangkok Time: 2025-12-11 18:27:00] - Added hero_image_url/image_url/metadata to events/all select so original covers return.
- [Bangkok Time: 2025-12-11 18:17:00] - Added x-original-authorization to events/all CORS headers and redeployed.
- [Bangkok Time: 2025-12-11 17:44:00] - Allowed x-user-token in events/all CORS headers and redeployed.
- [Bangkok Time: 2025-12-11 16:55:00] - Switched package.json to commonjs to stop Vercel function invocation failures and redeployed.

**[Dec 06, 2025 - 17:59 +07]** 🔧 **REGISTRATION ENDPOINT FIX & DEPLOYMENT**: Fixed critical registration endpoint (`auth/register/route.js`) by converting from CommonJS (`require`/`module.exports`) to ES modules (`import`/`export default`) to resolve `FUNCTION_INVOCATION_FAILED` error. Root cause: `package.json` has `"type": "module"` but route file was using CommonJS syntax. Reduced `vercel.json` from 20 functions to 2 (auth routes only) to fit Vercel Hobby plan 12-function limit. Deployed successfully to Vercel. Updated Cloudflare Worker (`cloudflare-worker-complete.js`) with new deployment URL. Improved error handling - registration now returns warnings if partner record creation fails. Registration endpoint working at `https://api.localplus.city/api/auth/register`. Remaining issue: Partner record creation may be failing due to RLS policies - needs investigation.

