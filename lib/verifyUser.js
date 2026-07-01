// Shared auth helper: verify a Supabase access token and return the real user.
//
// Unlike the legacy decode-only checks scattered across the events handlers, this
// actually validates the token — supabase.auth.getUser(token) asks Supabase to
// verify the signature + expiry server-side and returns the user (or an error).
// No JWT library and no SUPABASE_JWT_SECRET needed.
//
// Usage:
//   const user = await verifyUser(req, supabase);   // -> user object or null
//   if (!user) return res.status(401).json({ success:false, error:'Authentication required' });
//
// For endpoints where auth is OPTIONAL (e.g. guest bookings) just use the null
// result to decide whether to attach user_id.

function extractToken(req) {
  const raw =
    req.headers['authorization'] ||
    req.headers['x-user-token'] ||
    req.headers['x-supabase-token'] ||
    '';
  if (!raw) return null;
  return raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim();
}

async function verifyUser(req, supabase) {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) return null;
    return data.user;
  } catch (_e) {
    return null;
  }
}

module.exports = { verifyUser, extractToken };
