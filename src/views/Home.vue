<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-lg-10 col-md-12">
        <div v-if="isAdmin" class="text-center mb-3">
          <button 
            type="button" 
            class="btn btn-sm" 
            :class="customMode ? 'btn-warning' : 'btn-outline-warning'"
            @click="customMode = !customMode">
            <i class="fas" :class="customMode ? 'fa-lock-open' : 'fa-lock'"></i>
            {{ customMode ? 'Custom Login Active' : 'Enable Custom Login' }}
          </button>
        </div>
        <div class="card bg-secondary shadow border-0">
          <div class="card-header bg-transparent pb-5">
            <div class="text-center text-muted mb-4">
              <h2>McKinnon SC WiFi Generator</h2>
            </div>
            <div class="alert alert-info border-0 mb-0 d-flex align-items-center justify-content-center mx-lg-5">
              <i class="fas fa-info-circle me-3" style="font-size: 1.2rem;"></i>
              <p class="mb-0 text-sm">
                Accounts are one time use for one device. Do not generate WiFi accounts for other staff members, students or guests.
              </p>
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
              <div v-if="customMode" class="row">
                <div class="col-md-6">
                  <div class="form-group mb-3">
                    <label class="form-control-label text-muted small">PacketFence Category</label>
                    <select class="form-control form-control-alternative" v-model="selectedCategory">
                      <option value="503">Staff BYOD</option>
                      <option value="530">Guest WiFi</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group mb-3">
                    <label class="form-control-label text-muted small">Account Expiry</label>
                    <select class="form-control form-control-alternative" v-model="selectedExpiry">
                      <option value="1w">1 Week</option>
                      <option value="2w">2 Weeks</option>
                      <option value="1m">1 Month</option>
                      <option value="6m">6 Months</option>
                      <option value="1y">1 Year</option>
                      <option value="3y">3 Years</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="text-center">
                <button 
                  type="submit" 
                  class="btn btn-primary my-4" 
                  :disabled="loading">
                  {{ loading ? 'Processing...' : (createdUser ? 'Generate Another WiFi Account' : (customMode ? 'Create Custom Account' : 'Generate WiFi Account')) }}
                </button>
              </div>
            </form>

            <div v-if="createdUser" class="text-center mt-2">
              <button 
                type="button" 
                class="btn btn-outline-info" 
                @click="showHelpModal = true">
                <i class="fas fa-question-circle"></i> Help Me Connect
              </button>
            </div>

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

  <!-- Help Connection Modal -->
  <div v-if="showHelpModal" class="modal-backdrop fade show"></div>
  <div v-if="showHelpModal" class="modal fade show" style="display: block;" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content shadow">
        <div class="modal-header d-flex justify-content-between align-items-center">
          <h5 class="modal-title">How to Connect</h5>
          <button type="button" class="btn-close" @click="showHelpModal = false; selectedPlatform = null" aria-label="Close"></button>
        </div>
        <div class="modal-body p-0">
          <div v-if="!selectedPlatform">
            <p class="px-3 pt-3 text-muted small">Select your device to see connection instructions:</p>
            <div class="list-group list-group-flush">
              <button type="button" class="list-group-item list-group-item-action d-flex align-items-center py-3 border-0" @click="selectedPlatform = 'windows'">
                <i class="fab fa-windows fa-2x me-3 text-primary" style="width: 40px; text-align: center;"></i>
                <div>
                  <h6 class="mb-0">Windows</h6>
                  <small class="text-muted">Laptops and Desktops</small>
                </div>
                <i class="fas fa-chevron-right ms-auto text-muted"></i>
              </button>
              <button type="button" class="list-group-item list-group-item-action d-flex align-items-center py-3 border-0" @click="selectedPlatform = 'mac'">
                <i class="fab fa-apple fa-2x me-3 text-dark" style="width: 40px; text-align: center;"></i>
                <div>
                  <h6 class="mb-0">Mac</h6>
                  <small class="text-muted">MacBook and iMac</small>
                </div>
                <i class="fas fa-chevron-right ms-auto text-muted"></i>
              </button>
              <button type="button" class="list-group-item list-group-item-action d-flex align-items-center py-3 border-0" @click="selectedPlatform = 'ios'">
                <i class="fas fa-mobile-alt fa-2x me-3 text-info" style="width: 40px; text-align: center;"></i>
                <div>
                  <h6 class="mb-0">iPhone / iPad</h6>
                  <small class="text-muted">iOS Devices</small>
                </div>
                <i class="fas fa-chevron-right ms-auto text-muted"></i>
              </button>
              <button type="button" class="list-group-item list-group-item-action d-flex align-items-center py-3 border-0" @click="selectedPlatform = 'android'">
                <i class="fab fa-android fa-2x me-3 text-success" style="width: 40px; text-align: center;"></i>
                <div>
                  <h6 class="mb-0">Android</h6>
                  <small class="text-muted">Phones and Tablets</small>
                </div>
                <i class="fas fa-chevron-right ms-auto text-muted"></i>
              </button>
            </div>
          </div>

          <!-- Platform Specific Content -->
          <div v-else class="p-4 bg-white rounded">
            <div class="d-flex align-items-center mb-4">
              <button class="btn btn-sm btn-link p-0 me-3 text-decoration-none" @click="selectedPlatform = null">
                <i class="fas fa-arrow-left"></i> Back
              </button>
              <h5 class="mb-0">Instructions for {{ platformName }}</h5>
            </div>
            <div class="instruction-steps">
              <div class="d-flex mb-3">
                <div class="step-number me-3">1</div>
                <p class="mb-0">Connect to the <strong>McKinnon SC</strong> WiFi network.</p>
              </div>
              <div class="d-flex mb-3">
                <div class="step-number me-3">2</div>
                <div>
                   <p class="mb-1">When prompted, enter your credentials:</p>
                   <ul class="small ps-3 mb-0">
                     <li>Username: <strong>{{ username }}</strong></li>
                     <li>Password: <strong>{{ password }}</strong></li>
                   </ul>
                </div>
              </div>
              <div v-if="selectedPlatform === 'ios' || selectedPlatform === 'mac'" class="d-flex mb-3">
                <div class="step-number me-3">3</div>
                <p class="mb-0">If prompted to trust a certificate, click <strong>Trust</strong> or <strong>Accept</strong>.</p>
              </div>
              <div v-if="selectedPlatform === 'android'" class="d-flex mb-3">
                <div class="step-number me-3">3</div>
                <div>
                   <p class="mb-1">Configure the following settings:</p>
                   <ul class="small ps-3 mb-2">
                     <li>EAP method: <strong>PEAP</strong></li>
                     <li>Phase 2 authentication: <strong>MSCHAPv2</strong></li>
                     <li>Anonymous Identity: <strong>{{ username }}</strong></li>
                     <li>Identity: <strong>{{ username }}</strong></li>
                     <li>Password: <strong>{{ password }}</strong></li>
                   </ul>
                   <p class="mb-1 small text-dark font-weight-bold">CA Certificate:</p>
                   <ul class="small ps-3 mb-0">
                     <li>Android 11-14: <strong>Don't validate</strong></li>
                     <li>Android 15+: <strong>Trust on First Use</strong></li>
                   </ul>
                </div>
              </div>
              <div class="d-flex">
                <div class="step-number me-3">{{ (selectedPlatform === 'ios' || selectedPlatform === 'mac' || selectedPlatform === 'android') ? 4 : 3 }}</div>
                <p class="mb-0">Wait for your device to obtain an IP address and connect.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary" @click="showHelpModal = false; selectedPlatform = null">Close</button>
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
const selectedCategory = ref('503');
const selectedExpiry = ref('1y');
const showHelpModal = ref(false);
const selectedPlatform = ref(null);
let copiedTimeout = null;

// --- Computed ---
const isAdmin = computed(() => {
  return groups.value.split(',').map(g => g.trim().toLowerCase()).includes('admin');
});

const platformName = computed(() => {
  const names = {
    windows: 'Windows',
    mac: 'Mac',
    ios: 'iPhone / iPad',
    android: 'Android'
  };
  return names[selectedPlatform.value] || '';
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
  await generateAndCreateUser();
};

const generateAndCreateUser = async () => {
  if (customMode.value && !email.value) {
    error.value = 'Please enter an email address.';
    return;
  }

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
      username.value = `${emailPrefix}${randomDigits}`;
    } else {
      username.value = generateUsername();
    }

    // 2. Generate Password
    try {
      password.value = await dinopassApi.getSimplePassword();
    } catch (dinoError) {
      console.error('DinoPass API error:', dinoError);
      throw new Error('Failed to generate password from DinoPass. Please try again.');
    }

    // 3. Create User
    const response = await axios.post('/api-internal/create-user', { 
        username: username.value, 
        password: password.value,
        email: email.value,
        category: customMode.value ? selectedCategory.value : '503',
        expiry: customMode.value ? selectedExpiry.value : '1y'
    }); 

    if (response.data && response.data.success) {
      createdUser.value = { username: username.value };
      
      // Calculate display expiration date based on selection
      let duration = 365;
      let unit = 'days';
      if (customMode.value) {
        if (selectedExpiry.value === '1w') { duration = 7; unit = 'days'; }
        else if (selectedExpiry.value === '2w') { duration = 14; unit = 'days'; }
        else if (selectedExpiry.value === '1m') { duration = 1; unit = 'months'; }
        else if (selectedExpiry.value === '6m') { duration = 6; unit = 'months'; }
        else if (selectedExpiry.value === '1y') { duration = 1; unit = 'years'; }
        else if (selectedExpiry.value === '3y') { duration = 3; unit = 'years'; }
      }
      expirationDate.value = moment().add(duration, unit).format('MMMM Do YYYY, h:mm a');
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

.modal-backdrop {
  z-index: 1040;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal {
  z-index: 1050;
}

.modal-content {
  border-radius: 1rem;
  border: none;
}

.btn-close:hover {
  opacity: 0.75;
}

.list-group-item {
  transition: background-color 0.2s;
  cursor: pointer;
}

.list-group-item:hover {
  background-color: #f8f9fe !important;
}

.step-number {
  width: 24px;
  height: 24px;
  background-color: #5e72e4;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  flex-shrink: 0;
}

.instruction-steps p {
  line-height: 1.5;
}
</style> 