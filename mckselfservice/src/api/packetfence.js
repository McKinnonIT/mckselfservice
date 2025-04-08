import axios from 'axios';
// Removed moment as it's no longer needed here

// No global token caching needed anymore

// Use local proxy setup defined in vue.config.js, but we'll call our internal API
// const BASE_URL = '/api'; // Keep for reference, but not used directly for PF

// Create base axios instance - can be used to call our internal API
const apiClient = axios.create({
  // No baseURL needed if calling relative paths like /api-internal/create-user
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json' 
  }
});

class PacketFenceService {

  // login() method might not be needed anymore by the frontend
  // async login() { ... }

  /**
   * Creates a PacketFence user by calling the internal backend endpoint.
   * @param {string} username - The username for the new user
   * @param {string} password - The password for the new user
   * @returns {Promise<Object>} A promise that resolves to the success/error response from the internal API
   */
  async createUser(username, password) {
    console.log('Calling internal API to create user:', username);
    try {
      const response = await apiClient.post('/api-internal/create-user', {
        username: username,
        password: password
      });

      // The internal API returns { success: true, message: ... } on success
      console.log('Internal API response:', response.data);
      if (response.data && response.data.success) {
        return response.data; // Forward success response
      } else {
        // Handle cases where the internal API might return 200 OK but indicate failure
        throw new Error(response.data.message || 'Internal API reported failure without specific message.');
      }

    } catch (error) {
      console.error('Error calling internal API /api-internal/create-user:', error.message);
      let errorMessage = error.message;
      if (error.response) {
        // Error response *from* our internal API endpoint
        console.error('Internal API Error Status:', error.response.status);
        console.error('Internal API Error Data:', error.response.data);
        errorMessage = error.response.data?.message || `Internal API failed with status ${error.response.status}`;
      }
      // Re-throw a user-friendly error
      throw new Error(`User creation failed: ${errorMessage}`);
    }
  }
}

// Export an instance of the service
export default new PacketFenceService(); 