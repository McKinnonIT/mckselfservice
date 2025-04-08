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
                  @click="generateCredentials"
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

<script>
import { mapState, mapGetters } from 'vuex';
import { generateUsername } from '../api/username-generator';
import dinopassApi from '../api/dinopass';
import packetfenceApi from '../api/packetfence';
import moment from 'moment';

export default {
  name: 'Home',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      createdUser: null,
      error: null,
      expirationDate: '',
      copySuccess: null,
      copiedTimeout: null
    };
  },
  computed: {
    ...mapState(['generatedUsername', 'generatedPassword']),
    ...mapGetters(['isLoading', 'hasError', 'errorMessage'])
  },
  methods: {
    async generateCredentials() {
      this.loading = true;
      this.error = null;
      this.createdUser = null;
      
      try {
        // Generate username
        this.username = generateUsername();
        console.log('Generated username:', this.username);
        
        // Get password from DinoPass API
        try {
          this.password = await dinopassApi.getStrongPassword();
          console.log('Got password from DinoPass');
        } catch (dinoError) {
          console.error('DinoPass API error:', dinoError);
          throw new Error('Failed to generate password');
        }
        
        // Create user in PacketFence
        console.log('Attempting to create user in PacketFence...');
        try {
          const response = await packetfenceApi.createUser(this.username, this.password);
          console.log('PacketFence response:', response);
          this.createdUser = response.data;
          this.expirationDate = moment().add(5, 'days').format('MMMM Do YYYY, h:mm a');
        } catch (pfError) {
          console.error('PacketFence API error details:', pfError);
          // For 404 errors, provide more specific information
          if (pfError.response && pfError.response.status === 404) {
            throw new Error('PacketFence API endpoint not found (404). Please check the API URL configuration.');
          }
          throw pfError;
        }
      } catch (error) {
        console.error('Error generating credentials:', error);
        if (error.response) {
          this.error = `Error ${error.response.status}: ${error.response.data?.message || error.message || 'Unknown error'}`;
        } else if (error.request) {
          this.error = `Network error: No response received. Check server availability.`;
        } else {
          this.error = error.message || 'Failed to create user. Please try again.';
        }
      } finally {
        this.loading = false;
      }
    },
    
    copyToClipboard(text) {
      if (!text) return;
      
      navigator.clipboard.writeText(text)
        .then(() => {
          // Clear previous timeout if it exists
          if (this.copiedTimeout) {
            clearTimeout(this.copiedTimeout);
          }
          
          this.copySuccess = `Copied "${text}" to clipboard!`;
          
          // Auto-hide the success message after 3 seconds
          this.copiedTimeout = setTimeout(() => {
            this.copySuccess = null;
          }, 3000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          this.copySuccess = 'Failed to copy. Please try again.';
        });
    }
  }
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