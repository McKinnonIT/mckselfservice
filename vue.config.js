const axios = require('axios'); // Need axios for backend calls
const https = require('https'); // Import Node.js https module
const moment = require('moment'); // Re-add moment
// const https = require('https'); // Uncomment if using httpsAgent for self-signed certs

module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://172.22.10.176:1443', // CHANGED PORT TO 1443
        changeOrigin: true,
        secure: false, // Ignore SSL certificate errors
        pathRewrite: {
          '^/api': '/api/v1' // Correctly rewrites /api -> /api/v1
        },
        onProxyRes: (proxyRes, req) => {
          console.log(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
          if (proxyRes.statusCode >= 400) {
            console.error('Proxy error response headers:', proxyRes.headers);
          }
        }
      }
    },
    // Setup custom middleware for internal API endpoint
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Middleware to parse JSON request bodies
      devServer.app.use(require('body-parser').json());

      // Restore the original endpoint name and full logic
      devServer.app.post('/api-internal/create-user', async (req, res) => {
        const { username, password } = req.body; // Get desired new user creds from frontend
        console.log('[Internal API] Received request to create user:', username);
        if (!username || !password) {
          return res.status(400).json({ success: false, message: 'Missing username or password' });
        }

        // --- PacketFence Logic - Token Auth Flow --- 
        try {
          // 1. Get Credentials from .env
          const pfApiUsername = process.env.VUE_APP_PACKETFENCE_USERNAME;
          const pfApiPassword = process.env.VUE_APP_PACKETFENCE_PASSWORD;
          if (!pfApiUsername || !pfApiPassword) {
            console.error('[Internal API] FATAL: PacketFence credentials not found in .env');
            throw new Error("Server configuration error: Missing API credentials.");
          }
          const pfBaseUrl = 'https://172.22.10.176:1443/api/v1'; 
          const agent = new https.Agent({ rejectUnauthorized: false }); // Keep ignoring cert errors

          // --- Step 0: Login to get Token --- 
          console.log('[Internal API] Step 0: Logging in to get token...');
          let token;
          try {
            const loginPayload = { username: pfApiUsername, password: pfApiPassword };
            const loginUrl = `${pfBaseUrl}/login`;
            const loginConfig = { httpsAgent: agent }; // Apply agent
            console.log(`[Internal API] Attempting POST to: ${loginUrl}`);
            const loginResponse = await axios.post(loginUrl, loginPayload, loginConfig);
            
            if (loginResponse.data && loginResponse.data.token) {
              token = loginResponse.data.token;
              console.log('[Internal API] Step 0: Login successful, token obtained.');
            } else {
              throw new Error('Login response did not contain a token.');
            }
          } catch (loginError) {
            // Handle Login Specific Error
            console.error('[Internal API] Step 0: PacketFence login failed:', loginError.message);
            let status = loginError.response?.status || 500;
            let msg = loginError.response?.data?.message || 'Failed to authenticate with PacketFence API';
            return res.status(status).json({ success: false, message: `PF Login Error (${status}): ${msg}` });
          }

          // 2. Prepare Token Auth Headers (Raw token, like Python)
          const pfHeaders = {
            'Authorization': token, // Raw token
            'Content-Type': 'application/json'
          };
          const axiosPfConfig = { headers: pfHeaders, httpsAgent: agent }; // Config for subsequent calls
          console.log('[Internal API] Using raw token for subsequent requests.');

          // --- Step 1: Create User --- 
          console.log('[Internal API] Step 1: Creating user object...');
          const userPid = username;
          const createUserData = {
            "email": `${userPid}@example.com`,
            "notes": "Created via McK Self-Service (Internal API)",
            "pid": userPid,
            "sponsor": pfApiUsername
          };
          
          // Add timeout to axios config
          const axiosPfConfigWithTimeout = { 
              ...axiosPfConfig, // Spread existing headers and agent
              timeout: 30000 // 30 seconds timeout
          };

          await axios.post(`${pfBaseUrl}/users`, createUserData, axiosPfConfigWithTimeout);
          console.log('[Internal API] Step 1: User object created successfully.');

          // --- Step 2: Set Password & Attributes --- 
          console.log('[Internal API] Step 2: Setting password and attributes...');
          const unregDate = moment().add(5, 'days').format('YYYY-MM-DD HH:mm:ss');
          const passwordData = {
            "category": "2",
            "unregdate": unregDate,
            "login_remaining": 0,
            "password": password,
            "pid": userPid
          };
          
          // Use the config with timeout for the second call too
          await axios.post(`${pfBaseUrl}/user/${userPid}/password`, passwordData, axiosPfConfigWithTimeout);
          console.log('[Internal API] Step 2: Password and attributes set successfully.');

          // --- Success Response to Frontend --- 
          console.log('[Internal API] User creation process successful for:', username);
          res.json({ success: true, message: 'User created successfully' });

        } catch (error) {
          // Handle errors from Step 1 (Create User) or Step 2 (Set Password)
          console.error('[Internal API] Error during PF User Create/Update:', error.message);
          let statusCode = 500;
          let errorMessage = 'Internal server error during user creation/update.';
          if (error.response) {
            console.error('[Internal API] PF API Error Status:', error.response.status);
            console.error('[Internal API] PF API Error Details:', error.response.data);
            statusCode = error.response.status; 
            errorMessage = `PacketFence API error (${statusCode}): ${error.response.data?.message || 'Unknown PF API Error'}`;
          } else {
             errorMessage = error.message;
          }
          res.status(statusCode).json({ success: false, message: errorMessage });
        }
      });

      return middlewares;
    }
  }
}; 