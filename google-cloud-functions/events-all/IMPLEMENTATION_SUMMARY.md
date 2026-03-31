# Option 3 Implementation: Manual JWT Verification with HS256

## ✅ Implementation Complete

### What Was Changed

1. **Installed `jsonwebtoken` package**
   - Added to `package.json` dependencies
   - Used for proper JWT signature verification

2. **Updated `utils/rbac.js`**
   - Replaced `decodeJWT()` (no verification) with `verifyJWT()` (proper verification)
   - Added HS256 signature verification
   - Added expiration checking (`exp` claim)
   - Added issuer verification (`iss` claim)
   - Added audience verification (`aud` claim)
   - Kept OAuth email lookup logic for numeric `sub` claims

3. **Updated `deploy.sh`**
   - Added `SUPABASE_JWT_SECRET` environment variable requirement
   - Added error handling if JWT secret is missing
   - Updated deployment instructions

4. **Created Documentation**
   - `GET_JWT_SECRET.md` - Instructions for getting JWT secret from Supabase
   - `IMPLEMENTATION_SUMMARY.md` - This file

### Security Improvements

**Before (Manual Decode):**
- ❌ No signature verification (security risk)
- ❌ No expiration checking
- ❌ No issuer/audience verification
- ⚠️ Vulnerable to token tampering

**After (JWT Verification):**
- ✅ **Signature verification** (prevents tampering)
- ✅ **Automatic expiration checking** (rejects expired tokens)
- ✅ **Issuer verification** (ensures token from our Supabase)
- ✅ **Audience verification** (ensures correct token type)
- ✅ **Proper error handling** (expired, invalid, etc.)

### How It Works

1. **Token Verification**:
   ```javascript
   const decoded = jwt.verify(token, supabaseJwtSecret, {
     algorithms: ['HS256'],
     issuer: supabaseUrl,
     audience: 'authenticated'
   });
   ```
   - Verifies signature with HS256 (Supabase's algorithm)
   - Checks expiration automatically
   - Verifies issuer matches our Supabase URL
   - Verifies audience is 'authenticated'

2. **User Lookup**:
   - If `sub` is UUID → use directly with `admin.getUserById()`
   - If `sub` is numeric (OAuth) → query `users` table by email → get UUID → use `admin.getUserById()`

3. **Error Handling**:
   - Token expired → "Token expired"
   - Invalid signature → "Invalid token: [error]"
   - Wrong issuer → "Invalid token: jwt issuer invalid"
   - Wrong audience → "Invalid token: jwt audience invalid"

### Next Steps

1. **Get JWT Secret from Supabase**:
   - Follow instructions in `GET_JWT_SECRET.md`
   - Set environment variable: `export SUPABASE_JWT_SECRET="your-secret"`

2. **Deploy the Function**:
   ```bash
   cd /Users/admin/Dropbox/Development/localplus-api/google-cloud-functions/events-all
   export SUPABASE_JWT_SECRET="your-jwt-secret-here"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ./deploy.sh
   ```

3. **Test the Implementation**:
   - Try logging in through the partner app
   - Check GCF logs for JWT verification messages
   - Verify tokens are being validated correctly

### Testing Checklist

- [ ] JWT secret is set in environment
- [ ] Function deploys successfully
- [ ] Login works (token verification passes)
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected
- [ ] OAuth tokens (numeric sub) work correctly
- [ ] Native Supabase tokens (UUID sub) work correctly

### Logs to Watch For

**Success:**
```
[RBAC] ✅ JWT verified successfully. Claims: { sub: '...', email: '...', exp: '...', iss: '...', aud: '...' }
[RBAC] ✅ User validated: [user-id]
```

**Errors:**
```
[RBAC] Token expired: [timestamp]
[RBAC] Invalid token: [error message]
[RBAC] ⚠️ SUPABASE_JWT_SECRET not set - cannot verify token signature
```

### Migration to Other Functions

This same pattern should be applied to:
- `events/utils/rbac.js`
- `events-id/utils/rbac.js`
- `events-participants/utils/rbac.js`
- Any other functions using `getAuthenticatedUser()`

### Benefits

1. **Security**: Proper token signature verification prevents tampering
2. **Reliability**: No more RS256 bugs (we control the algorithm)
3. **Performance**: Fast (no extra HTTP calls)
4. **Standards**: Industry-standard JWT verification approach
5. **Compatibility**: Works with both native Supabase auth and OAuth

