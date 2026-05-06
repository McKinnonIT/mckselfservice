<template>
  <div class="container">
    <div v-if="isAdmin" class="admin-controls">
      <button 
        type="button" 
        class="btn btn-sm" 
        :class="customMode ? 'btn-warning' : 'btn-outline-warning'"
        @click="customMode = !customMode">
        <i class="fas" :class="customMode ? 'fa-lock-open' : 'fa-lock'"></i>
        {{ customMode ? 'Custom Login Active' : 'Enable Custom Login' }}
      </button>
    </div>
    <div class="row justify-content-center">
      <div class="col-lg-10 col-md-12">
        <div class="card bg-secondary shadow border-0">
          <div class="card-header bg-transparent pb-5">
            <div class="text-center text-muted mb-4">
              <h2>Staff Wifi Generator</h2>
            </div>
          </div>
          <div class="card-body px-lg-5 py-lg-5">
            <form @submit.prevent="handleFormSubmit">
              <div class="form-group mb-3">
                <div class="input-group input-group-alternative">
                  <span class="input-group-text">
                    <i class="fas fa-envelope" style="font-size: 1.2rem; color: #5e72e4;"></i>
                  </span>
                  <input class="form-control" placeholder="Email" type="email" v-model="email" :disabled="!customMode">
                </div>
              </div>
              <div class="form-group mb-3">
                <div class="input-group input-group-alternative">
                  <span class="input-group-text">
                    <i class="fas fa-user" style="font-size: 1.2rem; color: #5e72e4;"></i>
                  </span>
                  <input class="form-control" placeholder="Username" type="text" v-model="username" :disabled="!customMode">
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
                  <input class="form-control" placeholder="Password" type="text" v-model="password" :disabled="!customMode">
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
                  type="submit" 
                  class="btn btn-primary my-4" 
                  :disabled="loading">
                  {{ loading ? 'Processing...' : (customMode ? 'Create Custom Account' : 'Generate Wifi Account') }}
                </button>
              </div>
            </form>

            <div v-if="createdUser" class="alert alert-success mt-4 text-center">
              <p class="mb-2"><strong>User {{ createdUser.username }} successfully created.</strong></p>
              <p class="mb-2">You can now login to Mckinnon SC WiFi.</p>
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
import { ref, onMounted, computed } from 'vue';
import { generateUsername } from '../api/username-generator';
import dinopassApi from '../api/dinopass';
import axios from 'axios';
import moment from 'moment';

// --- Reactive State ---
const username = ref('');
const password = ref('');
const email = ref('');
const groups = ref('');
const loading = ref(false);
const createdUser = ref(null);
const error = ref(null);
const expirationDate = ref('');
const copySuccess = ref(null);
const customMode = ref(false);
let copiedTimeout = null;

// --- Computed ---
const isAdmin = computed(() => {
  return groups.value.split(',').map(g => g.trim().toLowerCase()).includes('admin');
});

// --- Lifecycle Hooks ---
onMounted(async () => {
  try {
    const response = await axios.get('/api-internal/user-info');
    if (response.data) {
      if (response.data.email) email.value = response.data.email;
      if (response.data.groups) groups.value = response.data.groups;
    }
  } catch (err) {
    console.error('Error fetching user info:', err);
  }
});

// --- Methods ---
const handleFormSubmit = async () => {
  if (customMode.value) {
    await createUser();
  } else {
    await generateAndCreateUser();
  }
};

const createUser = async () => {
  if (!username.value || !password.value || !email.value) {
    error.value = 'Please fill in all fields.';
    return;
  }

  loading.value = true;
  error.value = null;
  createdUser.value = null;

  try {
    const response = await axios.post('/api-internal/create-user', { 
        username: username.value, 
        password: password.value,
        email: email.value
    }); 

    if (response.data && response.data.success) {
      createdUser.value = { username: username.value };
      expirationDate.value = moment().add(365, 'days').format('MMMM Do YYYY, h:mm a');
    } else {
      throw new Error(response.data?.message || 'Internal API reported failure.');
    }
  } catch (err) {
    console.error('Error calling internal API:', err);
    error.value = err.response?.data?.message || err.message || 'An unexpected error occurred.';
  } finally {
    loading.value = false;
  }
};

const generateAndCreateUser = async () => {
  loading.value = true;
  error.value = null;
  createdUser.value = null;
  copySuccess.value = null;
  username.value = '';
  password.value = '';

  try {
    // 1. Generate Username
    if (email.value) {
      const emailPrefix = email.value.split('@')[0];
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      username.value = `${emailPrefix}.${randomDigits}`;
    } else {
      username.value = generateUsername();
    }

    // 2. Generate Password
    try {
      password.value = await dinopassApi.getStrongPassword();
    } catch (dinoError) {
      console.error('DinoPass API error:', dinoError);
      throw new Error('Failed to generate password from DinoPass. Please try again.');
    }

    // 3. Create User
    const response = await axios.post('/api-internal/create-user', { 
        username: username.value, 
        password: password.value,
        email: email.value
    }); 

    if (response.data && response.data.success) {
      createdUser.value = { username: username.value };
      expirationDate.value = moment().add(365, 'days').format('MMMM Do YYYY, h:mm a');
    } else {
      throw new Error(response.data?.message || 'Internal API reported failure.');
    }
  } catch (err) {
    console.error('Error in generateAndCreateUser process:', err);
    error.value = err.response?.data?.message || err.message || 'An unexpected error occurred.';
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
  position: relative;
}

.admin-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
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

.form-control:disabled {
  background-color: #e9ecef;
  opacity: 1;
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

  .admin-controls {
    top: 10px;
    left: 10px;
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