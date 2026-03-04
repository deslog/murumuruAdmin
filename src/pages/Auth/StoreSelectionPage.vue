<template>
  <div class="store-selection-page">
    <div class="selection-card">
      <h1 class="title">스토어 선택</h1>
      <p class="subtitle">관리할 스토어를 선택해주세요</p>

      <div v-if="loading" class="loading">
        <p>스토어 목록을 불러오는 중...</p>
      </div>

      <div v-else-if="error" class="error-box">
        <p>{{ error }}</p>
        <button class="retry-button" @click="loadStores">다시 시도</button>
      </div>

      <div v-else-if="stores.length === 0" class="empty">
        <p>등록된 스토어가 없습니다.</p>
        <button class="create-button" @click="createStore">새 스토어 만들기</button>
      </div>

      <div v-else class="store-list">
        <div
          v-for="store in stores"
          :key="store.storeId"
          class="store-item"
          @click="selectStore(store)"
        >
          <div class="store-info">
            <h3 class="store-name">{{ store.storeName }}</h3>
            <span class="store-role" :class="`role-${store.role}`">
              {{ getRoleLabel(store.role) }}
            </span>
          </div>
          <div class="arrow">→</div>
        </div>
      </div>

      <button class="logout-button" @click="handleLogout">로그아웃</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/app/config/firebase'
import { useAuthStore } from '@/app/store/auth'

const router = useRouter()
const authStore = useAuthStore()

const stores = ref([])
const loading = ref(true)
const error = ref('')

const getRoleLabel = (role) => {
  const labels = {
    owner: '소유자',
    manager: '매니저',
    staff: '스태프',
  }
  return labels[role] || role
}

const loadStores = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!authStore.user) {
      throw new Error('로그인이 필요합니다')
    }

    // users/{uid}/stores 서브컬렉션에서 스토어 목록 조회
    const storesRef = collection(db, 'users', authStore.user.uid, 'stores')
    const snapshot = await getDocs(storesRef)

    stores.value = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }))
  } catch (err) {
    console.error('스토어 목록 조회 실패:', err)
    error.value = '스토어 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

const selectStore = (store) => {
  authStore.setCurrentStore(store.storeId, store.storeName)
  // 스토어 선택 후 메인 페이지로 이동
  router.push('/')
}

const createStore = () => {
  // TODO: 스토어 생성 기능 (향후 구현)
  alert('스토어 생성 기능은 준비 중입니다.')
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (err) {
    console.error('로그아웃 실패:', err)
  }
}

onMounted(() => {
  loadStores()
})
</script>

<style scoped>
.store-selection-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg-secondary, #f5f5f5);
}

.selection-card {
  width: 100%;
  max-width: 500px;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 32px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  color: var(--text-primary, #333);
}

.subtitle {
  margin: 0 0 24px;
  font-size: 14px;
  text-align: center;
  color: var(--text-secondary, #666);
}

.loading,
.empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary, #666);
}

.error-box {
  padding: 20px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  text-align: center;
  color: #c00;
}

.retry-button,
.create-button {
  margin-top: 12px;
  padding: 8px 16px;
  border: 1px solid var(--color-primary, #3b82f6);
  border-radius: 8px;
  background: white;
  color: var(--color-primary, #3b82f6);
  cursor: pointer;
  font-size: 14px;
}

.retry-button:hover,
.create-button:hover {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.store-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.store-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 2px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.store-item:hover {
  border-color: var(--color-primary, #3b82f6);
  background: #f8f9ff;
}

.store-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.store-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.store-role {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.role-owner {
  background: #fef3c7;
  color: #92400e;
}

.role-manager {
  background: #dbeafe;
  color: #1e40af;
}

.role-staff {
  background: #e5e7eb;
  color: #374151;
}

.arrow {
  font-size: 20px;
  color: var(--color-primary, #3b82f6);
}

.logout-button {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: var(--text-secondary, #666);
  cursor: pointer;
  font-size: 14px;
}

.logout-button:hover {
  background: #f5f5f5;
}
</style>
