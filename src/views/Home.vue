<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-lg-10 col-md-12">
        <div class="card bg-secondary shadow border-0">
          <div class="card-header bg-transparent pb-5">
            <div class="text-center text-muted mb-4">
              <h2>Self-Service User Generator</h2>
            </div>
          </div>
          <div class="card-body px-lg-5 py-lg-5">
            <form>
              <div class="form-group mb-3">
                <div class="input-group input-group-alternative">
                  <span class="input-group-text">
                    <i class="fas fa-user" style="font-size: 1.2rem; color: #5e72e4;"></i>
                  </span>
                  <input class="form-control" placeholder="Username" type="text" v-model="username" disabled>
                  <button 
                    type="button" 
                    class="btn btn-outline-primary copy-btn" 
                    @click="copyToClipboard(username)"
                    :disabled="!username"
                    title="Copy to clipboard">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              <div class="form-group mb-3">
                <div class="input-group input-group-alternative">
                  <span class="input-group-text">
                    <i class="fas fa-key" style="font-size: 1.2rem; color: #5e72e4;"></i>
                  </span>
                  <input class="form-control" placeholder="Password" type="text" v-model="password" disabled>
                  <button 
                    type="button" 
                    class="btn btn-outline-primary copy-btn" 
                    @click="copyToClipboard(password)"
                    :disabled="!password"
                    title="Copy to clipboard">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              <div class="text-center">
                <button 
                  type="button" 
                  class="btn btn-primary my-4" 
                  @click="generateAndCreateUser"
                  :disabled="loading">
                  {{ loading ? 'Generating...' : 'Generate New User' }}
                </button>
              </div>
            </form>
            
            <div v-if="createdUser" class="alert alert-success mt-4 text-center">
              <p class="mb-2"><strong>User {{ username }} successfully created.</strong></p>
              <p class="mb-2">You can now login to McKinnonSC_Guest WiFi.</p>
              <p class="mb-0 text-muted">This user will expire on {{ expirationDate }}</p>
            </div>
            
            <div v-if="error" class="alert alert-danger mt-4">
              <p class="mb-0"><strong>Error:</strong> {{ error }}</p>
            </div>

            <div v-if="copySuccess" class="alert alert-info mt-4 copy-alert">
              <p class="mb-0">{{ copySuccess }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { generateUsername } from '../api/username-generator';
import dinopassApi from '../api/dinopass';
// import packetfenceApi from '../api/packetfence'; // REMOVE Service import
import axios from 'axios'; // ADD Axios import
import moment from 'moment';

// --- Reactive State ---
const username = ref('');
const password = ref('');
const loading = ref(false);
const createdUser = ref(null);
const error = ref(null);
const expirationDate = ref('');
const copySuccess = ref(null);
let copiedTimeout = null;

// --- Methods ---
const generateAndCreateUser = async () => {
  loading.value = true;
  error.value = null;
  createdUser.value = null;
  copySuccess.value = null;
  username.value = '';
  password.value = '';

  try {
    // 1. Generate Username
    username.value = generateUsername();
    console.log('Generated username:', username.value);

    // 2. Generate Password
    console.time('DinoPass API Call');
    try {
      password.value = await dinopassApi.getStrongPassword();
      console.timeEnd('DinoPass API Call');
      console.log('Got password from DinoPass');
    } catch (dinoError) {
      console.timeEnd('DinoPass API Call');
      console.error('DinoPass API error:', dinoError);
      throw new Error('Failed to generate password from DinoPass. Please try again.');
    }

    // 3. Create User via Internal API directly using axios
    console.log('Calling internal API /api-internal/create-user directly...');
    try {
      // Use axios directly, like the test page
      const response = await axios.post('/api-internal/create-user', { 
          username: username.value, 
          password: password.value 
      }); 
      console.log('Internal API response received by Home.vue:', response.data);

      if (response.data && response.data.success) {
        createdUser.value = { username: username.value };
        expirationDate.value = moment().add(5, 'days').format('MMMM Do YYYY, h:mm a');
        error.value = null;
      } else {
        // Error message might be in response.data.message
        throw new Error(response.data?.message || 'Internal API reported failure.');
      }
    } catch (axiosError) {
      // Handle errors from the direct axios call to the internal API
      console.error('Error calling internal API:', axiosError);
      let message = axiosError.message;
      if (axiosError.response && axiosError.response.data && axiosError.response.data.message) {
          message = axiosError.response.data.message; // Use error message from internal API if available
      }
      throw new Error(message); // Re-throw error to be caught below
    }

  } catch (err) {
    console.error('Error in generateAndCreateUser process:', err);
    error.value = err.message || 'An unexpected error occurred.';
    createdUser.value = null;
  } finally {
    loading.value = false;
  }
};

const copyToClipboard = (text) => {
  if (!text) return;

  navigator.clipboard.writeText(text)
    .then(() => {
      if (copiedTimeout) {
        clearTimeout(copiedTimeout);
      }
      copySuccess.value = `Copied "${text}" to clipboard!`;
      copiedTimeout = setTimeout(() => {
        copySuccess.value = null;
      }, 3000);
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      copySuccess.value = 'Failed to copy. Please try again.';
       if (copiedTimeout) clearTimeout(copiedTimeout);
       copiedTimeout = setTimeout(() => { copySuccess.value = null; }, 3000);
    });
};

</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.row {
  width: 100%;
}

.card {
  border-radius: 0.5rem;
  width: 100%;
  max-width: 2000px;
  margin: 0 auto;
}

.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.btn-primary {
  background-color: #5e72e4;
  border-color: #5e72e4;
  font-size: clamp(1rem, 3vw, 1.5rem);
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 4vw, 1.5rem);
}

.btn-primary:hover {
  background-color: #324cdd;
  border-color: #324cdd;
}

.input-group-text {
  background-color: #fff;
  width: 50px;
  display: flex;
  justify-content: center;
}

.form-control {
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.5rem, 2vw, 1rem);
}

.card-body {
  padding: clamp(1.5rem, 5vw, 5rem) clamp(1.5rem, 8vw, 8rem);
}

h2 {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
}

.alert {
  font-size: clamp(0.9rem, 2vw, 1.2rem);
}

/* Media query for mobile devices */
@media (max-width: 768px) {
  .card-body {
    padding: 2rem 1.5rem;
  }
  
  .input-group-text, .form-control {
    font-size: 1rem;
  }
  
  h2 {
    font-size: 1.75rem;
  }
}

.copy-btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.copy-alert {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1050;
  min-width: 200px;
  max-width: 400px;
  animation: fadeIn 0.3s, fadeOut 0.5s 2.5s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style> 