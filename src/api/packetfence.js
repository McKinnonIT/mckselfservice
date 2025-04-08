import axios from 'axios';
import moment from 'moment';

// Use local proxy to avoid CORS issues
const BASE_URL = '/api';

// Create base axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  response => {
    console.log('PacketFence API response:', response);
    return response;
  },
  error => {
    console.error('PacketFence API error:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    return Promise.reject(error);
  }
);

// Store the auth token
let authToken = null;
let tokenExpiration = null;

export default {
  /**
   * Login to PacketFence API and get authentication token
   * @returns {Promise<string>} A promise that resolves to the auth token
   */
  async login() {
    // Check if we already have a valid token
    if (authToken && tokenExpiration && moment().isBefore(tokenExpiration)) {
      console.log('Using existing token');
      return authToken;
    }

    try {
      const username = process.env.VUE_APP_PACKETFENCE_USERNAME || 'admin';
      const password = process.env.VUE_APP_PACKETFENCE_PASSWORD || 'H2#B##@YuCb11y';
      
      console.log('Getting new auth token');
      console.log(`Using credentials: ${username}`);
      
      const loginData = {
        username: username,
        password: password
      };

      console.log('Login endpoint: /login');
      console.log('Login data:', { username: username, password: '********' });
      
      try {
        const response = await apiClient.post('/login', loginData);
        console.log('Login response:', response.status, response.statusText);
        
        if (response.data && response.data.token) {
          authToken = response.data.token;
          // Set token expiration (default to 1 hour if not provided by API)
          const expiresIn = response.data.expires_in || 3600;
          tokenExpiration = moment().add(expiresIn, 'seconds');
          
          console.log('Auth token received, expires:', tokenExpiration.format());
          return authToken;
        } else {
          console.error('Invalid login response - no token received:', response.data);
          throw new Error('Invalid login response - no token received');
        }
      } catch (apiError) {
        console.error('API error during login:', apiError);
        
        // Try using direct basic auth as fallback
        console.log('Trying fallback authentication method...');
        try {
          // Create a user with Basic Auth directly
          const authString = `${username}:${password}`;
          const encodedAuth = btoa(authString);
          const directHeaders = {
            'Authorization': `Basic ${encodedAuth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          };
          
          // Just getting a simple endpoint to validate credentials
          const testResponse = await axios.get(`${BASE_URL}/user`, { 
            headers: directHeaders,
            validateStatus: status => status < 500 // Accept any non-server error
          });
          
          if (testResponse.status < 400) {
            console.log('Basic Auth successful as fallback');
            // Return a fake token that will force reauth on next call
            authToken = 'basic-auth-fallback';
            tokenExpiration = moment().add(10, 'minutes');
            return authToken;
          } else {
            console.error('Basic Auth also failed:', testResponse.status);
            throw new Error(`Authentication failed with status ${testResponse.status}`);
          }
        } catch (fallbackError) {
          console.error('Fallback authentication also failed:', fallbackError);
          throw new Error('All authentication methods failed. Please check your credentials and server configuration.');
        }
      }
    } catch (error) {
      console.error('Login process failed:', error);
      throw error;
    }
  },

  /**
   * Create a new user in PacketFence
   * @param {string} username - The username for the new user
   * @param {string} password - The password for the new user
   * @returns {Promise<Object>} A promise that resolves to the created user
   */
  async createUser(username, password) {
    try {
      // Get credentials from environment variables
      const pfUsername = process.env.VUE_APP_PACKETFENCE_USERNAME || 'admin';
      const pfPassword = process.env.VUE_APP_PACKETFENCE_PASSWORD || 'H2#B##@YuCb11y';
      
      // Create Basic Auth string
      const authString = `${pfUsername}:${pfPassword}`;
      const encodedAuth = btoa(authString);
      
      // Step 1: Create user with Basic Auth
      console.log('Step 1: Create user with POST /users using Basic Auth');
      
      // Headers with Basic Auth
      const headers = {
        'Authorization': `Basic ${encodedAuth}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      };
      
      // Create basic user first
      const userPid = username;
      const createUserData = {
        "pid": userPid,
        "notes": "Created by McK Self-Service",
        "sponsor": pfUsername
      };
      
      console.log('User creation payload:', createUserData);
      
      let createResponse;
      try {
        createResponse = await apiClient.post('/users', createUserData, { headers });
        console.log('User created successfully:', createResponse.status);
      } catch (createError) {
        console.error('User creation failed:', createError.message);
        if (createError.response) {
          console.error('Status:', createError.response.status);
          console.error('Details:', createError.response.data);
        }
        throw new Error(`User creation failed: ${createError.message}`);
      }
      
      // Step 2: Set password and properties - USING PUT (changed from POST!)
      console.log('Step 2: Set password with PUT /user/{pid}/password using Basic Auth');
      
      // Use EXACT headers from the working curl command
      const passwordHeaders = {
        'Authorization': `Basic ${encodedAuth}`,
        'Content-Type': 'application/json',
        'Accept': '/'  // Exactly as in curl: 'Accept: /'
      };
      
      // Exactly match the format from the new curl command - much simpler!
      const passwordData = {
        "access_duration": "8h",
        "access_level": "NONE",
        "category": "2",
        "login_remaining": 0,
        "password": password
      };
      
      console.log('Password setting payload:', { ...passwordData, password: '********' });
      console.log('Password setting headers:', passwordHeaders);
      
      try {
        // Using PUT (changed from POST!) with the simpler payload
        const passwordResponse = await apiClient.put(
          `/user/${userPid}/password`, 
          passwordData, 
          { headers: passwordHeaders }
        );
        console.log('Password and properties set successfully:', passwordResponse.status);
        
        // Return combined result
        return {
          ...createResponse,
          passwordSet: true
        };
      } catch (passwordError) {
        console.error('Setting password failed:', passwordError.message);
        if (passwordError.response) {
          console.error('Status:', passwordError.response.status);
          console.error('Details:', passwordError.response.data);
          console.error('Headers sent:', passwordHeaders);
          console.error('Payload sent:', { ...passwordData, password: '********' });
          // Log raw payload to debug stringification issues
          console.error('Raw payload string:', JSON.stringify(passwordData));
        }
        
        // User exists but password not set
        throw new Error(`User created but password setting failed: ${passwordError.message}`);
      }
    } catch (error) {
      console.error('User creation process failed:', error);
      throw error;
    }
  }
}; 