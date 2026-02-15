import { createApp } from 'vue'
import './style.css'
import './app/styles/base.css'
import './app/styles/tokens.css'
import App from './App.vue'
import router from './app/router'
import pinia from './app/store'

const app = createApp(App)

app.use(router)
app.use(pinia)

app.mount('#app')
