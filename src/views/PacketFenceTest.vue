<template>
  <div class="container mt-5 d-flex justify-content-center">
    <div class="card bg-secondary shadow border-0" style="max-width: 500px; width: 100%;">
      <div class="card-body px-lg-5 py-lg-5">
        <div class="text-center text-muted mb-4">
          <h2>PacketFence API Test</h2>
          <small>Test Internal User Creation Endpoint</small>
        </div>
        <form role="form" @submit.prevent="handleCreateUser">
          <div class="form-group mb-3">
            <div class="input-group input-group-alternative">
              <div class="input-group-prepend">
                <span class="input-group-text"><i class="ni ni-circle-08"></i></span>
              </div>
              <input 
                class="form-control" 
                placeholder="Username (PID)" 
                type="text" 
                v-model="username"
                required
              >
            </div>
          </div>
          <div class="form-group">
            <div class="input-group input-group-alternative">
              <div class="input-group-prepend">
                <span class="input-group-text"><i class="ni ni-lock-circle-open"></i></span>
              </div>
              <input 
                class="form-control" 
                placeholder="Password" 
                type="password" 
                v-model="password"
                required
              >
            </div>
          </div>
          
          <div class="text-center mt-4">
            <button type="submit" class="btn btn-primary my-4" :disabled="loading">
              {{ loading ? 'Creating...' : 'Create User' }}
            </button>
            <button type="button" class="btn btn-secondary ml-2" @click="clearMessages">Clear</button>
          </div>

          <div v-if="resultMessage" class="alert mt-4 text-center" :class="isSuccess ? 'alert-success' : 'alert-danger'">
            <strong>Result:</strong> {{ resultMessage }}
            <pre v-if="resultDetails" class="text-left bg-light p-2 mt-2"><code>{{ JSON.stringify(resultDetails, null, 2) }}</code></pre>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios'; // Use axios directly

// Re-add username/password refs 
const username = ref('');
const password = ref('');
const loading = ref(false);
const resultMessage = ref(null);
const isSuccess = ref(false);
const resultDetails = ref(null); 

const clearMessages = () => {
  resultMessage.value = null;
  isSuccess.value = false;
  resultDetails.value = null;
};

// Rename handler back to handleCreateUser
const handleCreateUser = async () => {
  // Basic validation (covered by required attribute mostly)
  if (!username.value || !password.value) {
      resultMessage.value = 'Username and Password are required.';
      isSuccess.value = false;
      resultDetails.value = null;
      return; 
  }
  
  loading.value = true;
  resultMessage.value = null;
  isSuccess.value = false;
  resultDetails.value = null;

  console.log('Attempting to create PacketFence user via internal API...');

  try {
    // Call the internal user creation endpoint
    const response = await axios.post('/api-internal/create-user', { 
        username: username.value, 
        password: password.value 
    }); 
    
    console.log('Internal /create-user API response:', response.data);
    
    // Expect { success: true, message: ... }
    if (response.data && response.data.success) {
        resultMessage.value = response.data.message || 'User created successfully!';
        isSuccess.value = true;
        resultDetails.value = null; // No details needed on success
    } else {
        throw new Error(response.data?.message || 'Internal API reported failure without specific message.');
    }

  } catch (error) {
    console.error('Error calling /api-internal/create-user:', error);
    resultMessage.value = error.response?.data?.message || error.message || 'An unknown error occurred during user creation.';
    isSuccess.value = false;
    resultDetails.value = error.response?.data?.details || null; 
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.card {
  margin-top: 50px;
}
pre {
  white-space: pre-wrap;      
  word-wrap: break-word;    
  text-align: left;
  font-size: 0.8em;
}
</style> 