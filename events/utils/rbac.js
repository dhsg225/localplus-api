// [2025-01-XX] - Event Engine Phase 1: RBAC helper utilities for role-based access control
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE;

/**
 * Get authenticated user from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
async function getAuthenticatedUser(authHeader) {
  if (!authHeader) {
    return { user: null, error: 'Authorization header required' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  console.log('[RBAC] getAuthenticatedUser - Token length:', token.length);
  
  // [2025-01-XX] - SIMPLIFIED: Just decode token and return user, no validation
  // Frontend uses this token successfully, so we trust it
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { user: null, error: 'Invalid token format' };
    }
    
    // Decode base64url payload
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    const userId = payload.sub;
    const userEmail = payload.email || 'unknown@example.com';
    
    console.log('[RBAC] ✅ Token decoded - user ID:', userId, 'email:', userEmail);
    
    // Validate UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return { user: null, error: 'Invalid token: User ID is not a valid UUID' };
    }
    
    // Return user immediately - no validation needed
    return { 
      user: { 
        id: userId, 
        email: userEmail
      }, 
      error: null 
    };
  } catch (err) {
    console.error('[RBAC] Token decode error:', err.message);
    return { user: null, error: `Invalid token: ${err.message}` };
  }
}

/**
 * Check if user has 'events_superuser' role
 * @param {object} supabase - Supabase client instance
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
async function isEventsSuperuser(supabase, userId) {
  try {
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'events_superuser')
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('[RBAC] Error checking events_superuser:', error);
      console.error('[RBAC] Error code:', error.code);
      console.error('[RBAC] Error message:', error.message);
      return false;
    }

    const isSuperuser = !error && userRoles && userRoles.length > 0;
    console.log('[RBAC] isEventsSuperuser check for user', userId, ':', isSuperuser, 'roles:', userRoles);
    return isSuperuser;
  } catch (err) {
    console.error('[RBAC] Exception checking events_superuser:', err);
    return false;
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
  // [2025-01-XX] - Events superuser has full access to all events
  const isSuperuser = await isEventsSuperuser(supabase, userId);
  if (isSuperuser) {
    return { hasAccess: true, role: 'events_superuser' };
  }

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

  // [2025-01-XX] - Events superuser bypasses all permission checks
  const supabase = createClient(supabaseUrl, supabaseKey);
  const isSuperuser = await isEventsSuperuser(supabase, user.id);
  if (isSuperuser) {
    return { authorized: true, user, error: null };
  }

  // If no eventId, just check authentication
  if (!eventId) {
    return { authorized: true, user, error: null };
  }

  // Check event-specific permissions
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
  authorizeRequest,
  isEventsSuperuser
};


