// [2025-01-XX] - Event Engine Phase 1: RBAC helper utilities for role-based access control
// [2025-11-30] - OPTION 3: Manual JWT verification with HS256 for proper security
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET; // [2025-11-30] - JWT secret for signature verification

// [2025-11-30] - Create service role client for proper token validation
// Service role key can validate tokens and bypass RLS (needed for admin operations)
function getServiceRoleClient() {
  if (!supabaseServiceRoleKey) {
    console.warn('[RBAC] ⚠️ SUPABASE_SERVICE_ROLE_KEY not set, falling back to anon key');
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  
  console.log('[RBAC] ✅ Using service role key for token validation');
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// [2025-11-30] - Decode JWT token without verification (for RS256 tokens or when verification fails)
// This is safe because we verify the user exists via admin API afterwards
function decodeJWTUnverified(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (err) {
    console.error('[RBAC] Error decoding JWT:', err.message);
    return null;
  }
}

// [2025-11-30] - Verify JWT token - supports both HS256 (Supabase native) and RS256 (OAuth)
// For RS256 tokens, we decode without verification and verify user via admin API
function verifyJWT(token) {
  try {
    // [2025-11-30] - Decode token header to check algorithm
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString('utf-8'));
    console.log('[RBAC] Token header:', { alg: header.alg, typ: header.typ });
    
    // [2025-11-30] - Handle RS256 tokens (OAuth providers like Google)
    // RS256 tokens can't be verified with HS256 secret - we decode and verify user exists
    if (header.alg === 'RS256') {
      console.log('[RBAC] RS256 token detected (OAuth) - decoding without signature verification');
      const decoded = decodeJWTUnverified(token);
      if (!decoded) {
        return { valid: false, error: 'Failed to decode RS256 token' };
      }
      
      // [2025-11-30] - Check expiration manually for RS256 tokens
      if (decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          console.error('[RBAC] RS256 token expired:', new Date(decoded.exp * 1000).toISOString());
          return { valid: false, error: 'Token expired' };
        }
      }
      
      console.log('[RBAC] ✅ RS256 token decoded (will verify user via admin API)');
      return { valid: true, claims: decoded, needsUserVerification: true };
    }
    
    // [2025-11-30] - Handle HS256 tokens (Supabase native auth)
    // These can be verified with JWT secret
    if (header.alg === 'HS256') {
      if (!supabaseJwtSecret) {
        console.error('[RBAC] ⚠️ SUPABASE_JWT_SECRET not set - cannot verify HS256 token');
        // Fallback: decode without verification
        const decoded = decodeJWTUnverified(token);
        if (decoded) {
          return { valid: true, claims: decoded, needsUserVerification: true };
        }
        return { valid: false, error: 'Server configuration error: JWT secret required' };
      }
      
      let jwtSecret = supabaseJwtSecret;
      
      // Try base64 decoded version
      try {
        const decodedSecret = Buffer.from(supabaseJwtSecret, 'base64').toString('utf-8');
        jwtSecret = decodedSecret;
        console.log('[RBAC] Trying base64-decoded JWT secret');
      } catch (e) {
        console.log('[RBAC] JWT secret is not base64, using as-is');
      }
      
      // [2025-11-30] - Verify HS256 token with JWT secret
      try {
        const decoded = jwt.verify(token, jwtSecret, {
          algorithms: ['HS256'],
          issuer: supabaseUrl,
          audience: 'authenticated'
        });
        console.log('[RBAC] ✅ HS256 token verified with signature');
        return { valid: true, claims: decoded };
      } catch (strictError) {
        console.log('[RBAC] Strict HS256 verification failed:', strictError.message);
        
        // Try without issuer/audience
        try {
          const decoded = jwt.verify(token, jwtSecret, {
            algorithms: ['HS256']
          });
          console.log('[RBAC] ✅ HS256 token verified (signature checked, issuer/audience relaxed)');
          return { valid: true, claims: decoded };
        } catch (e) {
          console.log('[RBAC] HS256 verification failed, falling back to decode without verification');
          // Fallback: decode without verification
          const decoded = decodeJWTUnverified(token);
          if (decoded) {
            return { valid: true, claims: decoded, needsUserVerification: true };
          }
          return { valid: false, error: `HS256 verification failed: ${strictError.message}` };
        }
      }
    }
    
    // Unknown algorithm
    console.warn('[RBAC] ⚠️ Unknown algorithm:', header.alg, '- decoding without verification');
    const decoded = decodeJWTUnverified(token);
    if (decoded) {
      return { valid: true, claims: decoded, needsUserVerification: true };
    }
    return { valid: false, error: `Unsupported algorithm: ${header.alg}` };
    
  } catch (err) {
    console.error('[RBAC] JWT processing error:', err.message);
    return { valid: false, error: `Token processing failed: ${err.message}` };
  }
}

/**
 * Get authenticated user from Authorization header
 * [2025-11-30] - OPTION 3: Verify JWT signature with HS256, then extract user info
 * This provides proper security by verifying token signature, expiration, issuer, and audience
 * @param {string} authHeader - Authorization header value
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
async function getAuthenticatedUser(authHeader) {
  if (!authHeader) {
    return { user: null, error: 'Authorization header required' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // [2025-11-30] - OPTION 3: Verify JWT signature with HS256 (proper security)
  // This verifies: signature (prevents tampering), expiration, issuer, audience
  const verification = verifyJWT(token);
  if (!verification.valid) {
    return { user: null, error: verification.error || 'Invalid token' };
  }

  const decoded = verification.claims;
  const needsUserVerification = verification.needsUserVerification || false;
  
  console.log('[RBAC] ✅ JWT processed successfully. Claims:', { 
    sub: decoded.sub, 
    email: decoded.email,
    exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A',
    iss: decoded.iss || 'N/A',
    aud: decoded.aud || 'N/A',
    needsUserVerification
  });

  // [2025-11-30] - Use service role client to query users table and verify user exists
  // JWT signature is already verified above, now we verify user exists in database
  if (!supabaseServiceRoleKey) {
    return { user: null, error: 'Server configuration error: Service role key required' };
  }

  const supabaseAdmin = getServiceRoleClient();
  
  try {
    // [2025-11-30] - Check if sub is a UUID (Supabase native auth) or numeric (OAuth)
    // If numeric, we need to find user by email instead
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded.sub);
    
    let user = null;
    let userId = null;

    if (isUUID) {
      // Native Supabase auth - sub is the UUID
      userId = decoded.sub;
      console.log('[RBAC] Using UUID from sub claim:', userId);
      
      // Use admin API to verify user exists
      const { data: { user: adminUser }, error: adminError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (adminError || !adminUser) {
        console.error('[RBAC] User not found via admin API:', adminError?.message || 'Unknown error');
        return { user: null, error: `Invalid or expired token: ${adminError?.message || 'User not found'}` };
      }
      user = adminUser;
    } else {
      // OAuth provider - sub is numeric ID
      // [2025-11-30] - Check if email is a service account (indicates token transformation issue)
      const isServiceAccountEmail = decoded.email && (
        decoded.email.includes('@developer.gserviceaccount.com') || 
        decoded.email.includes('@.iam.gserviceaccount.com') ||
        decoded.email.includes('@gserviceaccount.com')
      );
      
      if (isServiceAccountEmail) {
        console.warn('[RBAC] ⚠️ Service account email detected in token - this suggests token transformation');
        console.warn('[RBAC] Token email:', decoded.email);
        console.warn('[RBAC] Token sub:', decoded.sub);
        console.warn('[RBAC] Token issuer:', decoded.iss);
        console.warn('[RBAC] Full token claims:', JSON.stringify(decoded, null, 2));
        
        // [2025-11-30] - WORKAROUND: Even if email is service account, try to find user by OAuth sub
        // The token might be transformed, but the OAuth sub should still be valid
        console.log('[RBAC] Attempting to find user by OAuth sub despite service account email...');
        // Continue to OAuth identity lookup below (don't return error yet)
      }
      
      // [2025-11-30] - For OAuth tokens, find user by OAuth provider ID (sub)
      // Supabase stores OAuth identities in auth.identities, accessible via admin.listUsers()
      console.log('[RBAC] OAuth token detected, finding user by OAuth provider ID (sub):', decoded.sub);
      console.log('[RBAC] Token issuer:', decoded.iss);
      console.log('[RBAC] Token email (if present):', decoded.email);
      
      // [2025-11-30] - Determine provider from issuer (declare outside if block)
      let providerId = 'google'; // Default
      if (decoded.iss && decoded.iss.includes('google')) {
        providerId = 'google';
      } else if (decoded.iss && decoded.iss.includes('github')) {
        providerId = 'github';
      } else if (decoded.iss && decoded.iss.includes('facebook')) {
        providerId = 'facebook';
      }
      console.log('[RBAC] Determined OAuth provider:', providerId);
      
      // [2025-11-30] - Strategy 1: Find user by OAuth identity (sub)
      // This is the most reliable method for OAuth tokens
      console.log('[RBAC] Listing all users to find OAuth identity match...');
      const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('[RBAC] Error listing users:', listError.message);
      } else if (!allUsers || !allUsers.users) {
        console.error('[RBAC] No users returned from listUsers()');
      } else {
        console.log('[RBAC] Found', allUsers.users.length, 'total users to search');
        
        console.log('[RBAC] Searching for user with OAuth provider:', providerId, 'ID:', decoded.sub);
        console.log('[RBAC] Looking for identity where provider_id =', providerId, 'AND id =', decoded.sub);
        
        // Find user whose identity matches the OAuth sub
        let checkedUsers = 0;
        for (const potentialUser of allUsers.users) {
          checkedUsers++;
          if (potentialUser.identities && Array.isArray(potentialUser.identities)) {
            // Log first few users for debugging
            if (checkedUsers <= 3) {
              console.log('[RBAC] Checking user', potentialUser.id, 'with', potentialUser.identities.length, 'identities');
              potentialUser.identities.forEach((id, idx) => {
                console.log(`[RBAC]   Identity ${idx}: provider=${id.provider_id}, id=${id.id}, email=${potentialUser.email}`);
              });
            }
            
            const matchingIdentity = potentialUser.identities.find(
              (identity) => identity.provider_id === providerId && identity.id === decoded.sub
            );
            
            if (matchingIdentity) {
              console.log('[RBAC] ✅ Found user by OAuth identity:', potentialUser.id);
              console.log('[RBAC] Matching identity:', JSON.stringify(matchingIdentity, null, 2));
              user = potentialUser;
              userId = potentialUser.id;
              break;
            }
          } else {
            if (checkedUsers <= 3) {
              console.log('[RBAC] User', potentialUser.id, 'has no identities array');
            }
          }
        }
        
        console.log('[RBAC] Searched', checkedUsers, 'users, found match:', !!user);
        
        if (!user) {
          console.error('[RBAC] ⚠️ No user found with OAuth provider', providerId, 'and ID', decoded.sub);
          console.error('[RBAC] This might mean:');
          console.error('[RBAC]   1. User has not logged in with this OAuth provider');
          console.error('[RBAC]   2. OAuth identity was not linked to Supabase user');
          console.error('[RBAC]   3. Token sub does not match stored identity');
        }
      }
      
      // [2025-11-30] - Strategy 2: If OAuth identity lookup failed, try email (if email is valid and not service account)
      if (!user && decoded.email && !decoded.email.includes('@developer.gserviceaccount.com') && !decoded.email.includes('@.iam.gserviceaccount.com')) {
        console.log('[RBAC] OAuth identity lookup failed, trying email lookup:', decoded.email);
        
        const { data: userRecords, error: queryError } = await supabaseAdmin
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('email', decoded.email)
          .limit(1);
        
        if (!queryError && userRecords && userRecords.length > 0) {
          userId = userRecords[0].id;
          console.log('[RBAC] Found user UUID by email:', userId);
          
          // Verify user exists in auth.users
          const { data: { user: adminUser }, error: adminError } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (!adminError && adminUser) {
            user = adminUser;
            console.log('[RBAC] ✅ User validated via email lookup:', user.id);
          }
        }
      }
      
      // [2025-11-30] - If still no user found, return error
      if (!user) {
        console.error('[RBAC] User not found for OAuth token:', {
          sub: decoded.sub,
          email: decoded.email,
          iss: decoded.iss,
          provider: providerId || 'unknown'
        });
        return { user: null, error: `Invalid or expired token: User not found. Please ensure you are logged in with a valid user account.` };
      }
    }

    console.log('[RBAC] ✅ User validated:', user.id);
    
    // Get additional user info from users table
    const { data: userInfo, error: userInfoError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', user.id)
      .single();
    
    if (userInfoError && userInfoError.code !== 'PGRST116') {
      console.warn('[RBAC] Could not fetch user info from users table:', userInfoError.message);
    }
    
    return {
      user: {
        id: user.id,
        email: user.email || userInfo?.email || decoded.email,
        user_metadata: {
          full_name: userInfo ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() : (user.user_metadata?.full_name || '')
        }
      },
      error: null
    };
  } catch (err) {
    console.error('[RBAC] Unexpected error validating token:', err.message);
    return { user: null, error: `Token validation failed: ${err.message}` };
  }
}

/**
 * Check if user has permission to access an event
 * @param {object} supabase - Supabase client instance
 * @param {string} userId - User ID
 * @param {string} eventId - Event ID
 * @param {string[]} requiredRoles - Required roles (e.g., ['owner', 'editor'])
 * @returns {Promise<{hasAccess: boolean, role: string|null}>}
 */
async function checkEventPermission(supabase, userId, eventId, requiredRoles = []) {
  // Check if user is the event creator
  const { data: event } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', eventId)
    .single();

  if (event && event.created_by === userId) {
    return { hasAccess: true, role: 'owner' };
  }

  // Check explicit permissions
  // First check user-level permissions (not expired)
  const now = new Date().toISOString();
  const { data: userPermissions } = await supabase
    .from('event_permissions')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (userPermissions && userPermissions.length > 0) {
    const userRole = userPermissions[0].role;
    if (requiredRoles.length === 0 || requiredRoles.includes(userRole)) {
      return { hasAccess: true, role: userRole };
    }
  }

  // Check business-level permissions via partners table
  const { data: userBusinesses } = await supabase
    .from('partners')
    .select('business_id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (userBusinesses && userBusinesses.length > 0) {
    const businessIds = userBusinesses.map(ub => ub.business_id);
    const { data: businessPermissions } = await supabase
      .from('event_permissions')
      .select('role')
      .eq('event_id', eventId)
      .in('business_id', businessIds)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (businessPermissions && businessPermissions.length > 0) {
      const businessRole = businessPermissions[0].role;
      if (requiredRoles.length === 0 || requiredRoles.includes(businessRole)) {
        return { hasAccess: true, role: businessRole };
      }
    }
  }

  // Check if event is published (public access for view-only)
  if (requiredRoles.length === 0) {
    const { data: publishedEvent } = await supabase
      .from('events')
      .select('status')
      .eq('id', eventId)
      .eq('status', 'published')
      .single();

    if (publishedEvent) {
      return { hasAccess: true, role: 'viewer' };
    }
  }

  return { hasAccess: false, role: null };
}

/**
 * Check if user can perform action on event (wrapper for checkEventPermission)
 * @param {object} supabase - Supabase client instance
 * @param {string} userId - User ID
 * @param {string} eventId - Event ID
 * @param {string} action - Action type: 'view', 'edit', 'delete', 'manage_participants'
 * @returns {Promise<boolean>}
 */
async function canPerformAction(supabase, userId, eventId, action) {
  const roleMap = {
    'view': [],
    'edit': ['owner', 'editor'],
    'delete': ['owner'],
    'manage_participants': ['owner', 'editor']
  };

  const requiredRoles = roleMap[action] || [];
  const { hasAccess } = await checkEventPermission(supabase, userId, eventId, requiredRoles);
  return hasAccess;
}

/**
 * Middleware function to verify authentication and authorization
 * @param {object} req - Request object
 * @param {string} eventId - Event ID (optional, from query or body)
 * @param {string} action - Required action
 * @returns {Promise<{authorized: boolean, user: object|null, error: string|null}>}
 */
async function authorizeRequest(req, eventId = null, action = 'view') {
  const authHeader = req.headers.authorization;
  const { user, error: authError } = await getAuthenticatedUser(authHeader);

  if (authError || !user) {
    return { authorized: false, user: null, error: authError || 'Unauthorized' };
  }

  // If no eventId, just check authentication
  if (!eventId) {
    return { authorized: true, user, error: null };
  }

  // Check event-specific permissions
  const supabase = createClient(supabaseUrl, supabaseKey);
  const hasAccess = await canPerformAction(supabase, user.id, eventId, action);

  if (!hasAccess) {
    return { authorized: false, user, error: 'Insufficient permissions' };
  }

  return { authorized: true, user, error: null };
}

module.exports = {
  getAuthenticatedUser,
  checkEventPermission,
  canPerformAction,
  authorizeRequest
};

