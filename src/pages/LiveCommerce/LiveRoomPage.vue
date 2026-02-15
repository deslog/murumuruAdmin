<template>
  <div class="live-room-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">← 목록으로</button>
      <h1>{{ roomTitle }}</h1>
    </header>
    <div class="page-content">
      <div class="live-panels">
        <!-- 왼쪽: 상품 리스트 -->
        <ProductListPanel />
        
        <!-- 가운데: 명령어 검색 + 장바구니 -->
        <CommandSearchBar />
        
        <!-- 오른쪽: 확정 고객 -->
        <ConfirmedCustomersPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLiveStore } from '@/features/live/store'
import ProductListPanel from '@/features/live/components/ProductListPanel/ProductListPanel.vue'
import CommandSearchBar from '@/features/live/components/CommandSearchBar/CommandSearchBar.vue'
import ConfirmedCustomersPanel from '@/features/live/components/ConfirmedCustomersPanel/ConfirmedCustomersPanel.vue'

const route = useRoute()
const router = useRouter()
const liveStore = useLiveStore()

const roomId = computed(() => route.params.roomId)
const roomTitle = computed(() => liveStore.currentRoom?.title || '라이브 방송')

const goBack = () => {
  router.push({ name: 'LiveCommerce' })
}

onMounted(() => {
  liveStore.loadRoom(roomId.value)
  // Mock 상품 데이터 로드
  import('./LiveCommerce.mock').then(module => {
    liveStore.setProducts(module.mockProducts)
  })
})
</script>

<style scoped>
.live-room-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.page-header {
  background: var(--bg-primary);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.back-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: var(--bg-primary);
  border-color: var(--color-primary);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.page-content {
  flex: 1;
  overflow: hidden;
  padding: var(--spacing-xl);
}

.live-panels {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: var(--spacing-lg);
  height: 100%;
}
</style>
