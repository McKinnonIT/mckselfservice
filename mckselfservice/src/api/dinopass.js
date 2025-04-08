import axios from 'axios';

const API_URL = 'https://www.dinopass.com/password';

export default {
  /**
   * Get a simple password from DinoPass API
   * @returns {Promise<string>} A promise that resolves to a simple password
   */
  getSimplePassword() {
    return axios.get(`${API_URL}/simple`)
      .then(response => response.data);
  },

  /**
   * Get a strong password from DinoPass API
   * @returns {Promise<string>} A promise that resolves to a strong password
   */
  getStrongPassword() {
    return axios.get(`${API_URL}/strong`)
      .then(response => response.data);
  }
}; 