module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://172.22.10.176:9999', // Try this server first, it might be more reliable
        changeOrigin: true,
        secure: false, // Ignore SSL certificate errors
        pathRewrite: {
          '^/api': '/api/v1'
        },
        onProxyReq: (proxyReq, req) => {
          console.log(`Proxying request to: ${req.method} ${proxyReq.path}`);
          
          // Add debug headers to see what's being passed
          const pfUsername = process.env.VUE_APP_PACKETFENCE_USERNAME || 'admin';
          const pfPassword = process.env.VUE_APP_PACKETFENCE_PASSWORD || 'H2#B##@YuCb11y';
          
          // Always add basic auth for proxy requests
          const authString = `${pfUsername}:${pfPassword}`;
          const encodedAuth = btoa(authString);
          proxyReq.setHeader('Authorization', `Basic ${encodedAuth}`);
          
          // Ensure correct content type
          if (req.method === 'POST' || req.method === 'PUT') {
            proxyReq.setHeader('Content-Type', 'application/json');
          }
          proxyReq.setHeader('Accept', 'application/json');
        },
        onProxyRes: (proxyRes, req) => {
          console.log(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
          if (proxyRes.statusCode >= 400) {
            console.error('Proxy error response headers:', proxyRes.headers);
          }
        }
      }
    }
  }
}; 