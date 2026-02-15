import { createRouter, createWebHistory } from 'vue-router'
import { adminRoutes } from './routes.admin'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...adminRoutes,
  ],
})

export default router
