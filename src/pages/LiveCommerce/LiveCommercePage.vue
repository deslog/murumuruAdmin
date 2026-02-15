<template>
  <div class="live-commerce-page">
    <header class="page-header">
      <h1>무르무르라방</h1>
    </header>
    <div class="page-content">
      <div class="create-section">
        <button class="create-button" @click="showCreateModal = true">
          <span class="plus-icon">+</span>
          <span>새 라방 생성</span>
        </button>
      </div>

      <div class="list-section">
        <h2 class="section-title">라방 목록</h2>
        <LiveRoomList :rooms="liveStore.rooms" @select="goToRoom" />
      </div>
    </div>

    <!-- 라방 생성 모달 -->
    <AppModal v-model="showCreateModal" title="새 라방 생성">
      <div class="modal-content">
        <AppInput
          v-model="newRoomTitle"
          label="라방 제목"
          placeholder="예: 2월 15일 저녁 특가방"
        />
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">
          취소
        </AppButton>
        <AppButton @click="handleCreateRoom">
          생성
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLiveStore } from '@/features/live/store'
import LiveRoomList from '@/features/live/components/LiveRoomList/LiveRoomList.vue'
import AppModal from '@/shared/components/AppModal/AppModal.vue'
import AppInput from '@/shared/components/AppInput/AppInput.vue'
import AppButton from '@/shared/components/AppButton/AppButton.vue'
import { mockRooms } from './LiveCommerce.mock'

const router = useRouter()
const liveStore = useLiveStore()

const showCreateModal = ref(false)
const newRoomTitle = ref('')

const goToRoom = (roomId) => {
  router.push({ name: 'LiveRoom', params: { roomId } })
}

const handleCreateRoom = () => {
  if (!newRoomTitle.value.trim()) {
    alert('라방 제목을 입력해주세요.')
    return
  }
  
  const roomId = liveStore.createRoom(newRoomTitle.value)
  newRoomTitle.value = ''
  showCreateModal.value = false
  
  // 생성 후 바로 이동
  goToRoom(roomId)
}

onMounted(() => {
  // Mock 데이터 로드
  liveStore.setRooms(mockRooms)
})
</script>

<style scoped>
.live-commerce-page {
  padding: var(--spacing-xl);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.page-content {
  flex: 1;
  overflow: auto;
}

.create-section {
  margin-bottom: var(--spacing-xl);
}

.create-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-xl);
  background: var(--bg-primary);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.create-button:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}

.plus-icon {
  font-size: var(--font-size-2xl);
  color: var(--color-primary);
}

.list-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}

.modal-content {
  min-width: 400px;
}
</style>
