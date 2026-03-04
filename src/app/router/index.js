import { createRouter, createWebHistory } from 'vue-router'
import { adminRoutes } from './routes.admin'
import { useAuthStore } from '@/app/store/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/Auth/LoginPage.vue'),
      meta: { requiresGuest: true },
    },
    ...adminRoutes,
  ],
})

// 네비게이션 가드
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Auth 초기화 대기
  if (authStore.isLoading) {
    await authStore.initAuth()
  }

  console.log('[Router] beforeEach ->', to.path, 'authenticated:', authStore.isAuthenticated, 'storeId:', authStore.currentStoreId)

  const requiresGuest = to.matched.some(record => record.meta.requiresGuest === true)
  const isLoginPage = to.path === '/login'

  // 게스트 전용 페이지 (로그인 페이지) - 이미 로그인되어 있으면 메인으로
  if (requiresGuest && authStore.isAuthenticated) {
    const storeId = authStore.currentStoreId || 'default'
    return next(`/${storeId}/wholesale-orders`)
  }

  // 로그인 페이지가 아닌 경우, 인증 체크
  if (!isLoginPage && !authStore.isAuthenticated) {
    return next('/login')
  }

  // 로그인은 되었는데 스토어가 없으면 기본 스토어 설정
  if (authStore.isAuthenticated && !authStore.currentStoreId && !isLoginPage) {
    console.warn('[Router] 스토어 정보가 없습니다. 기본 스토어를 설정합니다.')
    const defaultStoreId = 'store_' + authStore.user.uid
    authStore.setCurrentStore(defaultStoreId, 'mystore')
    console.log('[Router] 기본 스토어 설정 완료:', defaultStoreId)
  }

  // 루트 경로("/")로 접근하면 스토어 URL로 리다이렉트
  if (to.path === '/' && authStore.isAuthenticated) {
    const storeId = authStore.currentStoreId || 'default'
    return next(`/${storeId}/wholesale-orders`)
  }

  next()
})

export default router
