import { createRouter, createWebHistory } from 'vue-router'
import { adminRoutes } from './routes.admin'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/Auth/LoginPage.vue'),
    },
    ...adminRoutes,
  ],
})

export default router
