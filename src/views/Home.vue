<template>
  <header class="app-header">
    <div class="brand">
      <AppIcon :size="36" label="WiFi generator" />
      <span class="h4">WiFi generator</span>
    </div>
    <span class="eyebrow lockup">McKinnon SC · IT</span>
  </header>

  <main class="page">
    <div class="page-title">
      <span class="eyebrow">{{ customMode ? 'Admin · custom account' : 'Staff WiFi' }}</span>
      <h1 class="h1">{{ customMode ? 'Create a WiFi account' : 'Get a WiFi account' }}</h1>
      <p>Each account works once, on one device.</p>
    </div>

    <form class="card" @submit.prevent="handleFormSubmit">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" class="input" type="email" v-model="email" :disabled="!customMode"
          :placeholder="customMode ? 'e.g. jane.citizen@example.com' : ''">
      </div>

      <div class="field">
        <label for="username">Username</label>
        <div class="input-row">
          <input id="username" class="input mono" type="text" :value="username" readonly placeholder="Generated for you">
          <button type="button" class="icon-button" @click="copyToClipboard(username)" :disabled="!username" aria-label="Copy username">
            <Copy :size="22" />
          </button>
        </div>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <div class="input-row">
          <input id="password" class="input mono" type="text" :value="password" readonly placeholder="Generated for you">
          <button type="button" class="icon-button" @click="copyToClipboard(password)" :disabled="!password" aria-label="Copy password">
            <Copy :size="22" />
          </button>
        </div>
      </div>

      <div v-if="customMode" class="field-grid">
        <div class="field">
          <label for="category">PacketFence category</label>
          <select id="category" class="input" v-model="selectedCategory">
            <option value="503">Staff BYOD</option>
            <option value="530">Guest WiFi</option>
          </select>
        </div>
        <div class="field">
          <label for="expiry">Account expiry</label>
          <select id="expiry" class="input" v-model="selectedExpiry">
            <option value="1w">1 week</option>
            <option value="2w">2 weeks</option>
            <option value="1m">1 month</option>
            <option value="6m">6 months</option>
            <option value="1y">1 year</option>
            <option value="3y">3 years</option>
          </select>
        </div>
      </div>

      <label v-if="!customMode" class="terms" for="termsCheckbox">
        <input id="termsCheckbox" type="checkbox" v-model="agreedToTerms">
        <span>I agree not to share these WiFi credentials with any other staff members, students or guests.</span>
      </label>

      <div class="actions">
        <span v-if="loading" class="status" role="status"><span class="spin"></span>Creating account…</span>
        <button type="submit" class="button primary" :disabled="loading || (!customMode && !agreedToTerms)">
          {{ createdUser ? 'Generate another account' : (customMode ? 'Create account' : 'Generate WiFi account') }}
        </button>
      </div>
    </form>

    <div v-if="createdUser" class="callout success">
      <span class="eyebrow callout-title"><Check :size="16" /> Done</span>
      <p>Account <span class="data">{{ createdUser.username }}</span> is ready. You can now sign in to McKinnon SC WiFi.</p>
      <p>It expires on {{ expirationDate }}.</p>
      <div>
        <button type="button" class="button secondary" @click="showHelpModal = true">
          <CircleHelp :size="20" /> Help me connect
        </button>
      </div>
    </div>

    <div v-if="error" class="callout danger" role="alert">
      <span class="eyebrow callout-title"><CircleAlert :size="16" /> Failed</span>
      <p>{{ error }}</p>
    </div>

    <p class="caption footer-note">
      Need a hand? See a campus IT support office or email
      <a href="mailto:help@mckinnonsc.vic.edu.au">help@mckinnonsc.vic.edu.au</a>.
    </p>
  </main>

  <div v-if="copySuccess" class="toast" role="status">{{ copySuccess }}</div>

  <!-- Help connection dialog -->
  <div v-if="showHelpModal" class="backdrop" @click.self="closeHelp">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div class="dialog-header">
        <button v-if="selectedPlatform" type="button" class="icon-button" @click="selectedPlatform = null" aria-label="Back">
          <ArrowLeft :size="20" />
        </button>
        <h2 id="help-title" class="h3">{{ selectedPlatform ? platformName : 'How to connect' }}</h2>
        <button type="button" class="icon-button close" @click="closeHelp" aria-label="Close">
          <X :size="20" />
        </button>
      </div>

      <div v-if="!selectedPlatform" class="dialog-body">
        <p>Choose your device to see how to connect.</p>
        <div class="platforms">
          <button v-for="p in platforms" :key="p.id" type="button" class="platform" @click="selectedPlatform = p.id">
            <component :is="p.icon" :size="24" />
            <span class="platform-text">
              <span class="title-sm">{{ p.name }}</span>
              <span class="caption">{{ p.hint }}</span>
            </span>
            <ChevronRight :size="20" class="chevron" />
          </button>
        </div>
      </div>

      <ol v-else class="dialog-body steps">
        <li>Connect to the <strong>McKinnon SC</strong> WiFi network.</li>
        <li>
          When asked, enter your details:
          <dl class="creds">
            <dt>Username</dt><dd class="data">{{ username }}</dd>
            <dt>Password</dt><dd class="data">{{ password }}</dd>
          </dl>
        </li>
        <li v-if="selectedPlatform === 'ios' || selectedPlatform === 'mac'">
          If asked to trust a certificate, choose <strong>Trust</strong> or <strong>Accept</strong>.
        </li>
        <li v-if="selectedPlatform === 'android'">
          Use these settings:
          <dl class="creds">
            <dt>EAP method</dt><dd>PEAP</dd>
            <dt>Phase 2 authentication</dt><dd>MSCHAPv2</dd>
            <dt>Anonymous identity</dt><dd class="data">{{ username }}</dd>
            <dt>Identity</dt><dd class="data">{{ username }}</dd>
            <dt>Password</dt><dd class="data">{{ password }}</dd>
            <dt>CA certificate</dt><dd>Android 11–14: <strong>Don't validate</strong><br>Android 15+: <strong>Trust on first use</strong></dd>
          </dl>
        </li>
        <li>Wait for your device to get an IP address and connect.</li>
      </ol>

      <div class="dialog-footer">
        <button type="button" class="button secondary" @click="closeHelp">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { ArrowLeft, Check, ChevronRight, CircleAlert, CircleHelp, Copy, Laptop, Monitor, Smartphone, TabletSmartphone, X } from 'lucide-vue-next';
import AppIcon from '../components/AppIcon.vue';

// Fallback name pool, only reached if /api-internal/user-info gives us no email.
const ANIMALS = 'koala wombat echidna platypus quokka possum dingo emu numbat bilby'.split(' ');

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
const agreedToTerms = ref(false);
const selectedCategory = ref('503');
const selectedExpiry = ref('1y');
const showHelpModal = ref(false);
const selectedPlatform = ref(null);
let copiedTimeout = null;

// --- Computed ---
const isAdmin = computed(() => {
  return groups.value.split(',').map(g => g.trim().toLowerCase()).includes('admin');
});
// Admins always get the custom login form.
const customMode = isAdmin;

const platforms = [
  { id: 'windows', name: 'Windows', hint: 'Laptops and desktops', icon: Monitor },
  { id: 'mac', name: 'Mac', hint: 'MacBook and iMac', icon: Laptop },
  { id: 'ios', name: 'iPhone / iPad', hint: 'iOS devices', icon: Smartphone },
  { id: 'android', name: 'Android', hint: 'Phones and tablets', icon: TabletSmartphone },
];

const platformName = computed(() => platforms.find(p => p.id === selectedPlatform.value)?.name || '');

// --- Lifecycle Hooks ---
onMounted(async () => {
  try {
    const response = await axios.get('/api-internal/user-info');
    if (response.data) {
      if (response.data.groups) groups.value = response.data.groups;
      // Admins create accounts for other people, so leave their email blank.
      if (response.data.email && !isAdmin.value) email.value = response.data.email;
    }
  } catch (err) {
    console.error('Error fetching user info:', err);
  }
});

// --- Methods ---
const closeHelp = () => {
  showHelpModal.value = false;
  selectedPlatform.value = null;
};

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
      username.value = `guest-${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`;
    }

    // 2. Generate Password
    try {
      password.value = (await axios.get('https://www.dinopass.com/password/simple')).data;
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
      agreedToTerms.value = false; // Reset checkbox for next generation
      // The server owns the expiry maths; just render what it actually set.
      expirationDate.value = new Date(response.data.expiresAt)
        .toLocaleString('en-AU', { dateStyle: 'long', timeStyle: 'short' });
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
      copySuccess.value = `Copied "${text}"`;
      copiedTimeout = setTimeout(() => {
        copySuccess.value = null;
      }, 3000);
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      copySuccess.value = "Couldn't copy. Try again.";
       if (copiedTimeout) clearTimeout(copiedTimeout);
       copiedTimeout = setTimeout(() => { copySuccess.value = null; }, 3000);
    });
};

</script>

<style scoped>
/* Every value comes from tokens.css (McKinnon IT design system). */

/* Type helpers */
.h1 { margin: 0; font: var(--text-display-sm); letter-spacing: -0.03em; color: var(--ink); }
.h3 { margin: 0; font: var(--text-h3); letter-spacing: -0.02em; color: var(--ink); }
.h4 { font: var(--text-h3); letter-spacing: -0.02em; color: var(--ink); }
.title-sm { font: var(--text-title-sm); color: var(--ink); }
.caption { font: var(--text-caption); color: var(--ink-muted); }
.eyebrow { font: var(--text-eyebrow); letter-spacing: 0.06em; color: var(--accent); }
.lockup { color: var(--ink-muted); }
.eyebrow-sm { font: var(--text-eyebrow-sm); letter-spacing: 0.05em; color: var(--ink-muted); }
.data, .mono { font-family: var(--font-mono); }
.data { font: var(--text-data); color: var(--ink); }
p { margin: 0; }
a { color: var(--link); }

/* Shell */
.app-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5) 0 var(--space-4);
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; gap: var(--space-3); }

.page {
  max-width: 880px;
  min-height: calc(100vh - 64px);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-5);
}
.page-title { display: flex; flex-direction: column; gap: var(--space-3); }
.page-title p { font: var(--text-lead); }

/* Card and fields */
.card {
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.field { display: flex; flex-direction: column; gap: var(--space-2); }
.field label { font: var(--text-body); font-weight: 600; color: var(--ink); }
.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }

.input {
  width: 100%;
  height: var(--control-height-touch);
  padding: 0 var(--space-4);
  font-family: var(--font-sans);
  font-size: 18px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.input.mono { font-family: var(--font-mono); font-size: 18px; }
.input::placeholder { color: var(--ink-muted); opacity: 0.8; }
.input[readonly], .input:disabled { background: var(--surface-sunken); color: var(--ink); }
.input-row { display: flex; gap: var(--space-2); }

/* Focus ring on everything */
.input:focus-visible, .button:focus-visible, .icon-button:focus-visible, .platform:focus-visible,
.terms input:focus-visible, a:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.terms {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  font: var(--text-body);
  color: var(--ink);
  cursor: pointer;
}
.terms input { width: 24px; height: 24px; margin: 2px 0 0; flex: none; accent-color: var(--brand); cursor: pointer; }

/* Buttons */
.actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-3); flex-wrap: wrap; }
.button {
  height: var(--control-height-touch);
  padding: 0 var(--space-6);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-size: 17px;
  font-weight: 500;
  line-height: 1;
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color 150ms ease-out, border-color 150ms ease-out;
}
.button:disabled { opacity: 0.5; cursor: not-allowed; }
.button.primary { background: var(--brand); border-color: var(--brand); color: var(--on-brand); }
.button.primary:hover:not(:disabled) { background: var(--brand-hover); border-color: var(--brand-hover); }
.button.secondary { background: transparent; border-color: var(--border); color: var(--ink); }
.button.secondary:hover:not(:disabled) { background: var(--surface-sunken); }

.icon-button {
  width: var(--control-height-touch);
  height: var(--control-height-touch);
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color 150ms ease-out;
}
.icon-button:hover:not(:disabled) { background: var(--surface-sunken); }
.icon-button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Loading: the compact ring from the RadiantSpinner README */
.status { display: inline-flex; align-items: center; font: var(--text-body); color: var(--ink-muted); }
.spin {
  display: inline-block; width: 18px; height: 18px; margin-right: var(--space-2); border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0, var(--ramp-3), var(--ramp-4), var(--ramp-6), var(--ramp-7), var(--ramp-8));
  -webkit-mask: radial-gradient(circle, transparent 5.5px, #000 6px);
  mask: radial-gradient(circle, transparent 5.5px, #000 6px);
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Callouts */
.callout {
  background: var(--status-tint);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font: var(--text-body);
  color: var(--ink-muted);
}
.callout > div { margin-top: var(--space-2); }
.callout-title { display: inline-flex; align-items: center; gap: var(--space-1); }
.callout.success .callout-title { color: var(--success); }
.callout.danger { border-color: var(--danger); }
.callout.danger .callout-title { color: var(--danger); }

.footer-note { text-align: center; font: var(--text-body-sm); }

/* Toast */
.toast {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  max-width: min(400px, calc(100vw - 2 * var(--space-5)));
  padding: var(--space-3) var(--space-4);
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-float);
  font: var(--text-body-sm);
  color: var(--ink);
  z-index: 20;
}

/* Dialog */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: color-mix(in srgb, var(--ramp-1) 45%, transparent);
}
.dialog {
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 2 * var(--space-4));
  overflow-y: auto;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
}
.dialog-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
}
.dialog-header .close { margin-left: auto; border-color: transparent; }
.dialog-body { padding: var(--space-5); font: var(--text-body); display: flex; flex-direction: column; gap: var(--space-4); }
.dialog-footer { display: flex; justify-content: flex-end; padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border); }

.platforms { display: flex; flex-direction: column; gap: var(--space-2); }
.platform {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--control-height-touch);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color 150ms ease-out;
}
.platform:hover { background: var(--status-tint); }
.platform-text { display: flex; flex-direction: column; }
.platform-text .title-sm { font: var(--text-body); font-weight: 600; }
.chevron { margin-left: auto; color: var(--ink-muted); }

.steps { margin: 0; padding-left: calc(var(--space-5) + var(--space-4)); color: var(--ink); }
.steps li { padding-left: var(--space-1); }
.steps strong { font-weight: 600; }
.creds {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-1) var(--space-4);
  margin: var(--space-2) 0 0;
  font: var(--text-body-sm);
  color: var(--ink-muted);
}
.creds dd { margin: 0; color: var(--ink); }

@media (max-width: 767px) {
  .page { padding-top: var(--space-6); }
  .card { padding: var(--space-4); }
  .field-grid { grid-template-columns: 1fr; }
  .actions .button { width: 100%; justify-content: center; height: var(--control-height-touch); }
  .icon-button { width: var(--control-height-touch); height: var(--control-height-touch); }
  .input { height: var(--control-height-touch); }
}

@media (prefers-reduced-motion: reduce) {
  .spin { animation-duration: 3s; }
  .button, .icon-button, .platform { transition: none; }
}
</style>
