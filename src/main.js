import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Import Bootstrap and BootstrapVue
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
import { BootstrapVue3 } from 'bootstrap-vue-3'

// Import Argon CSS (we'll use a simplified version with Bootstrap)
import './assets/css/argon.css'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(BootstrapVue3)

app.mount('#app') 