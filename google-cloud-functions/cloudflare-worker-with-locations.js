// [2025-12-01] - Cloudflare Worker to route api.localplus.city to GCF endpoints
// This worker routes requests to either API Gateway or direct GCF URLs

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
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

