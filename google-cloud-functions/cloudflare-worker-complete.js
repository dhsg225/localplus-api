// [2025-12-03] - Cloudflare Worker to route api.localplus.city to various backends
// Routes /api/auth/register to Vercel, other specific routes to GCF, everything else to API Gateway
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // [2025-12-03] - Route /api/auth/register to Vercel (registration endpoint)
    // UPDATE THIS: Replace 'localplus-api.vercel.app' with your actual Vercel deployment URL
    // To find it: Go to Vercel Dashboard → localplus-api project → Settings → Domains
    // Or check the latest deployment URL in the Deployments tab
    if (path === '/api/auth/register' || path.startsWith('/api/auth/register')) {
      url.hostname = 'localplus-mapdfzd33-shannons-projects-3f909922.vercel.app';
      url.pathname = path;
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // Route /api/locations directly to GCF (not in API Gateway config)
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
    
    // Route /api/organizers directly to GCF (not in API Gateway config)
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
    
    // Route /api/venues directly to GCF (not in API Gateway config)
    if (path.startsWith('/api/venues')) {
      url.hostname = 'localplus-api-venues-jdyddatgcq-uc.a.run.app';
      url.pathname = path.replace('/api/venues', '');
      if (url.pathname === '') url.pathname = '/';
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // Route /api/activities directly to GCF (not in API Gateway config)
    if (path.startsWith('/api/activities')) {
      url.hostname = 'localplus-api-activities-jdyddatgcq-uc.a.run.app';
      url.pathname = path.replace('/api/activities', '');
      if (url.pathname === '') url.pathname = '/';
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // Route /api/attractions directly to GCF (not in API Gateway config)
    if (path.startsWith('/api/attractions')) {
      url.hostname = 'localplus-api-attractions-jdyddatgcq-uc.a.run.app';
      url.pathname = path.replace('/api/attractions', '');
      if (url.pathname === '') url.pathname = '/';
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // [2025-12-02] - Route /api/news to Google Cloud Function
    if (path.startsWith('/api/news')) {
      url.hostname = 'localplus-api-news-jdyddatgcq-uc.a.run.app';
      // Keep the full path including /api/news
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // All other requests go to Google Cloud API Gateway
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
