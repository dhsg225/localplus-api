# Supabase Auth Evaluation for LocalPlus API

## Current Situation

**We ARE already using Supabase Auth** - the issue is **server-side token validation** in Google Cloud Functions.

### Current Problems:
1. **RS256 vs HS256 Mismatch**: Supabase uses HS256 for JWT signing, but `@supabase/auth-js` client library tries to validate with RS256
2. **OAuth User IDs**: OAuth providers (Google) return numeric IDs in `sub` claim, not UUIDs
3. **Inconsistent Validation**: Different functions use different validation approaches
4. **Complex Workarounds**: Manual JWT decoding + email lookup + admin API calls

---

## Evaluation: Options for Server-Side Token Validation

### Option 1: **Current Approach (Manual JWT Decode + Admin API)** ✅ CURRENT

**How it works:**
- Decode JWT without signature verification
- Extract `sub` (user ID) or `email` from claims
- If `sub` is UUID → use `admin.getUserById()`
- If `sub` is numeric (OAuth) → query `users` table by email → get UUID → use `admin.getUserById()`

**Pros:**
- ✅ Bypasses RS256 bug completely
- ✅ Works with both native Supabase auth and OAuth
- ✅ No signature validation needed (we trust the token came from Supabase)
- ✅ Already implemented and working

**Cons:**
- ❌ Doesn't verify token signature (security risk if token is intercepted)
- ❌ Doesn't check token expiration (must verify `exp` claim manually)
- ❌ Complex logic for OAuth vs native auth
- ❌ Not using official Supabase patterns

**Security Concerns:**
- ⚠️ **CRITICAL**: We're not verifying JWT signatures - if a token is stolen, it could be used until expiration
- ⚠️ We should at least verify `exp` claim to check expiration
- ⚠️ Should verify `iss` (issuer) claim matches Supabase URL

---

### Option 2: **Use Supabase REST API Directly** 🔄 ALTERNATIVE

**How it works:**
- Call `/auth/v1/user` endpoint with token in Authorization header
- Use service role key as `apikey` header
- Supabase server validates the token (handles HS256 correctly)

**Pros:**
- ✅ Uses official Supabase API
- ✅ Server-side validation (handles HS256 correctly)
- ✅ Simpler than manual decoding
- ✅ Automatic expiration checking

**Cons:**
- ❌ Still had RS256 errors when we tried this (Supabase server also has issues?)
- ❌ Extra HTTP call (latency)
- ❌ Requires service role key

**Code Example:**
```javascript
const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': supabaseServiceRoleKey
  }
});
```

---

### Option 3: **Manual JWT Verification with HS256** 🔧 RECOMMENDED FIX

**How it works:**
- Use `jsonwebtoken` library to verify JWT signature with HS256
- Use JWT secret from Supabase (derived from service role key or JWT secret)
- Verify `exp`, `iss`, `aud` claims
- Extract user ID from verified token

**Pros:**
- ✅ **Proper security**: Verifies token signature
- ✅ Checks expiration automatically
- ✅ No RS256 issues (we control the algorithm)
- ✅ Works with both native and OAuth tokens
- ✅ Industry standard approach

**Cons:**
- ❌ Need to get JWT secret from Supabase
- ❌ Requires `jsonwebtoken` library
- ❌ More code to maintain

**Implementation:**
```javascript
const jwt = require('jsonwebtoken');

// Get JWT secret from Supabase (or derive from service role key)
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

// Verify token
const decoded = jwt.verify(token, jwtSecret, {
  algorithms: ['HS256'],
  issuer: supabaseUrl,
  audience: 'authenticated'
});

// Extract user ID
const userId = decoded.sub; // or lookup by email if OAuth
```

**How to get JWT Secret:**
- Supabase Dashboard → Settings → API → JWT Secret
- Or derive from service role key (it's in the JWT payload)

---

### Option 4: **Use Supabase Edge Functions** 🆕 FUTURE OPTION

**How it works:**
- Deploy functions to Supabase Edge Functions (Deno runtime)
- Use `@supabase/supabase-js` with built-in auth helpers
- Edge Functions have better Supabase integration

**Pros:**
- ✅ Native Supabase integration
- ✅ Built-in auth helpers work correctly
- ✅ No RS256 issues (Supabase handles it)
- ✅ Automatic RLS support

**Cons:**
- ❌ Requires migrating from GCF to Supabase Edge Functions
- ❌ Different runtime (Deno vs Node.js)
- ❌ Vendor lock-in to Supabase
- ❌ May have different pricing/limits

---

### Option 5: **Use Supabase Auth Helpers (Server-Side)** 📚 OFFICIAL PATTERN

**How it works:**
- Use `@supabase/auth-helpers` or `@supabase/ssr` packages
- Designed for server-side token validation
- Handles HS256 correctly

**Pros:**
- ✅ Official Supabase pattern
- ✅ Designed for serverless functions
- ✅ Handles edge cases (OAuth, expiration, etc.)

**Cons:**
- ❌ May still have RS256 issues (depends on implementation)
- ❌ Need to check if it works with GCF
- ❌ Additional dependency

**Code Example:**
```javascript
const { createServerClient } = require('@supabase/ssr');

const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    // Serverless functions don't use cookies, but we can pass token
  }
});
```

---

## Recommendation: **Option 3 (Manual JWT Verification with HS256)** ✅ IMPLEMENTED

### Why This Is Best:

1. **Security**: Properly verifies token signatures (prevents token tampering)
2. **Reliability**: No RS256 bugs (we control the algorithm)
3. **Control**: We handle expiration, issuer, audience validation
4. **Compatibility**: Works with both native Supabase auth and OAuth
5. **Performance**: No extra HTTP calls (faster than REST API)

### Implementation Plan:

1. **Get JWT Secret from Supabase:**
   - Dashboard → Settings → API → JWT Secret
   - Or extract from service role key JWT payload

2. **Install `jsonwebtoken` library:**
   ```bash
   npm install jsonwebtoken
   ```

3. **Update `rbac.js` to verify tokens:**
   ```javascript
   const jwt = require('jsonwebtoken');
   
   function verifyToken(token) {
     const jwtSecret = process.env.SUPABASE_JWT_SECRET;
     
     try {
       const decoded = jwt.verify(token, jwtSecret, {
         algorithms: ['HS256'],
         issuer: supabaseUrl,
         audience: 'authenticated'
       });
       
       // Check expiration (jwt.verify does this automatically)
       // Extract user info
       return { valid: true, claims: decoded };
     } catch (err) {
       return { valid: false, error: err.message };
     }
   }
   ```

4. **Handle OAuth vs Native Auth:**
   - If `sub` is UUID → use directly
   - If `sub` is numeric → query `users` table by `email` claim

### Security Improvements:

- ✅ Verify JWT signature (prevents tampering)
- ✅ Check expiration (`exp` claim)
- ✅ Verify issuer (`iss` claim)
- ✅ Verify audience (`aud` claim)
- ✅ Still use admin API to get full user object

---

## Migration Path

### Phase 1: Add JWT Verification (Keep Current Logic)
- Add `jsonwebtoken` verification
- Keep current OAuth email lookup logic
- Add proper error handling

### Phase 2: Standardize Across All Functions
- Update all `rbac.js` files in all GCF functions
- Update Vercel functions too
- Create shared auth utility

### Phase 3: Remove Workarounds
- Remove manual JWT decoding
- Remove REST API fallbacks
- Clean up code

---

## Cost/Benefit Analysis

| Option | Security | Reliability | Complexity | Performance | Cost |
|--------|----------|-------------|------------|-------------|------|
| Current (Manual Decode) | ⚠️ Low | ✅ High | ⚠️ Medium | ✅ Fast | ✅ Free |
| REST API | ✅ Medium | ⚠️ Medium | ✅ Low | ⚠️ Slower | ✅ Free |
| **JWT Verification** | ✅ **High** | ✅ **High** | ⚠️ Medium | ✅ **Fast** | ✅ **Free** |
| Edge Functions | ✅ High | ✅ High | ✅ Low | ✅ Fast | ⚠️ Paid |

---

## Conclusion

**Recommendation: Implement Option 3 (Manual JWT Verification with HS256)**

This gives us:
- ✅ Proper security (signature verification)
- ✅ No RS256 bugs
- ✅ Works with OAuth and native auth
- ✅ Fast performance
- ✅ Industry standard approach

**Next Steps:**
1. ✅ Get JWT secret from Supabase dashboard - **DONE** (Legacy JWT secret configured)
2. ✅ Install `jsonwebtoken` package - **DONE**
3. ✅ Update `rbac.js` to verify tokens properly - **DONE**
4. ⏳ Test with both native and OAuth tokens - **READY FOR TESTING**
5. ✅ Deploy and monitor - **DEPLOYED** (revision: localplus-api-events-all-00014-reb)

**Deployment Status:**
- ✅ Function deployed with `SUPABASE_JWT_SECRET` environment variable
- ✅ Function deployed with `SUPABASE_SERVICE_ROLE_KEY` environment variable
- ✅ JWT verification with HS256 is now active
- ⏳ Ready for testing in partner app

