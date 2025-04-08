const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const moment = require('moment');
const https = require('https');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080; // Use environment variable or default

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// Serve static files from the Vue build output directory
app.use(express.static(path.join(__dirname, 'dist')));

// --- API Endpoint for User Creation ---
app.post('/api-internal/create-user', async (req, res) => {
  const { username, password } = req.body;
  console.log('[Server API] Received request to create user:', username);

  if (!username || !password) {
    console.error('[Server API] Missing username or password.');
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }

  // Read PacketFence credentials from environment variables
  const pfApiUsername = process.env.VUE_APP_PACKETFENCE_USERNAME;
  const pfApiPassword = process.env.VUE_APP_PACKETFENCE_PASSWORD;
  const pfApiBaseUrl = process.env.VUE_APP_PACKETFENCE_API_URL;

  if (!pfApiUsername || !pfApiPassword) {
    console.error('[Server API] FATAL: PacketFence credentials not found in environment variables.');
    return res.status(500).json({ success: false, message: 'Server configuration error: Missing PacketFence API credentials.' });
  }
  
  if (!pfApiBaseUrl) {
    console.error('[Server API] FATAL: PacketFence API URL (VUE_APP_PACKETFENCE_API_URL) not found in environment variables.');
    return res.status(500).json({ success: false, message: 'Server configuration error: Missing PacketFence API URL.' });
  }
  
  // Agent to ignore self-signed certs (if needed, controlled by env var)
  const ignoreSsl = process.env.PACKETFENCE_IGNORE_SSL === 'true';
  const agent = new https.Agent({ rejectUnauthorized: !ignoreSsl });
  console.log(`[Server API] PacketFence Ignore SSL: ${ignoreSsl}`);

  // Axios config for PacketFence API calls
  const pfAxiosConfig = { 
      httpsAgent: agent,
      timeout: 30000 // Keep 30 second timeout
  };

  try {
    // --- Step 0: Login to get Token --- 
    console.log('[Server API] Step 0: Logging in to get token...');
    let token;
    try {
      const loginPayload = { username: pfApiUsername, password: pfApiPassword };
      const loginUrl = `${pfApiBaseUrl}/login`;
      console.log(`[Server API] Attempting POST to: ${loginUrl}`);
      const loginResponse = await axios.post(loginUrl, loginPayload, pfAxiosConfig);
      
      if (loginResponse.data && loginResponse.data.token) {
        token = loginResponse.data.token;
        console.log('[Server API] Step 0: Login successful, token obtained.');
      } else {
        throw new Error('Login response did not contain a token.');
      }
    } catch (loginError) {
      console.error('[Server API] Step 0: PacketFence login failed:', loginError.message);
      let status = loginError.response?.status || 500;
      let msg = loginError.response?.data?.message || 'Failed to authenticate with PacketFence API';
      return res.status(status).json({ success: false, message: `PF Login Error (${status}): ${msg}` });
    }

    // 2. Prepare Token Auth Headers
    const pfHeaders = {
      'Authorization': token, 
      'Content-Type': 'application/json'
    };
    const axiosPfApiCallsConfig = { ...pfAxiosConfig, headers: pfHeaders }; 
    console.log('[Server API] Using raw token for subsequent requests.');

    // --- Step 1: Create User --- 
    console.log('[Server API] Step 1: Creating user object...');
    const userPid = username;
    const createUserData = {
      "email": `${userPid}@example.com`,
      "notes": "Created via McK Self-Service (Docker)",
      "pid": userPid,
      "sponsor": pfApiUsername 
    };
    await axios.post(`${pfApiBaseUrl}/users`, createUserData, axiosPfApiCallsConfig);
    console.log('[Server API] Step 1: User object created successfully.');

    // --- Step 2: Set Password & Attributes --- 
    console.log('[Server API] Step 2: Setting password and attributes...');
    const unregDate = moment().add(5, 'days').format('YYYY-MM-DD HH:mm:ss');
    const passwordData = {
      "category": "2",
      "unregdate": unregDate,
      "login_remaining": 0,
      "password": password, 
      "pid": userPid
    };
    await axios.post(`${pfApiBaseUrl}/user/${userPid}/password`, passwordData, axiosPfApiCallsConfig);
    console.log('[Server API] Step 2: Password and attributes set successfully.');

    // --- Success Response to Frontend --- 
    console.log('[Server API] User creation process successful for:', username);
    res.json({ success: true, message: 'User created successfully' });

  } catch (error) {
    // Handle errors from Step 1 or Step 2
    console.error('[Server API] Error during PF User Create/Update:', error.message);
    let statusCode = 500;
    let errorMessage = 'Internal server error during user creation/update.';
    if (error.response) {
      console.error('[Server API] PF API Error Status:', error.response.status);
      console.error('[Server API] PF API Error Details:', error.response.data);
      statusCode = error.response.status; 
      errorMessage = `PacketFence API error (${statusCode}): ${error.response.data?.message || 'Unknown PF API Error'}`;
    } else {
      errorMessage = error.message;
    }
    res.status(statusCode).json({ success: false, message: errorMessage });
  }
});

// --- Catch-all / SPA Fallback Middleware ---
// This needs to be after API routes and static file middleware
app.use((req, res, next) => {
  // If the request doesn't start with /api-internal and doesn't appear to have a file extension
  if (!req.path.startsWith('/api-internal') && !path.extname(req.path)) {
    // Serve the index.html for SPA routing
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
        if (err) {
            // Handle potential errors sending the file
            console.error("Error sending index.html:", err);
            res.status(500).end();
        }
    });
  } else {
    // Let other middleware (like static) or subsequent routes handle it
    next();
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Serving static files from ${path.join(__dirname, 'dist')}`);
}); 