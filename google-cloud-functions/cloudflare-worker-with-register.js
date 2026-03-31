// [2025-12-03] - Cloudflare Worker to route api.localplus.city to GCF endpoints
// Updated to route /api/auth/register to Vercel
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // [2025-12-03] - Route /api/auth/register to Vercel (not in API Gateway yet)
    if (path === '/api/auth/register' || path.startsWith('/api/auth/register')) {
      // Route to Vercel deployment - UPDATE THIS URL with your actual Vercel deployment
      // You can find this by running: cd localplus-api && vercel ls
      // Or check Vercel dashboard for the deployment URL
      url.hostname = 'localplus-api.vercel.app'; // UPDATE THIS
      url.pathname = path;
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // [2025-12-01] - Route /api/locations and /api/organizers directly to GCF
    // These are not yet in the API Gateway config
    if (path.startsWith('/api/locations')) {
      url.hostname = 'localplus-api-locations-jdyddatgcq-uc.a.run.app';
      url.pathname = path.replace('/api/locations', '');
      if (url.pathname === '') url.pathname = '/';
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    if (path.startsWith('/api/organizers')) {
      url.hostname = 'localplus-api-organizers-jdyddatgcq-uc.a.run.app';
      url.pathname = path.replace('/api/organizers', '');
      if (url.pathname === '') url.pathname = '/';
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // All other requests go to API Gateway
    url.hostname = 'localplus-api-gateway-101wrq78.uc.gateway.dev';
    
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'localplus-api-gateway-101wrq78.uc.gateway.dev');
    
    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: 'follow'
    });
    
    return fetch(newRequest);
  }
}

