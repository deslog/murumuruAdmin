import { createApp } from 'vue'
import './style.css'
import './app/styles/base.css'
import './app/styles/tokens.css'
import App from './App.vue'
import router from './app/router'
import pinia from './app/store'
import { useAuthStore } from './app/store/auth'

const app = createApp(App)

app.use(pinia)
app.use(router)

// Auth 초기화
const authStore = useAuthStore()
authStore.initAuth()

app.mount('#app')
