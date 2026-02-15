<template>
  <div class="live-room-list">
    <div v-if="rooms.length === 0" class="empty-state">
      <p>생성된 라방이 없습니다.</p>
      <p class="hint">새 라방을 생성해보세요!</p>
    </div>
    <div v-else class="room-grid">
      <div
        v-for="room in rooms"
        :key="room.id"
        class="room-card"
        @click="$emit('select', room.id)"
      >
        <div class="room-header">
          <h3 class="room-title">{{ room.title }}</h3>
          <span class="room-status" :class="room.status">
            {{ room.status === 'active' ? '진행중' : '종료' }}
          </span>
        </div>
        <div class="room-info">
          <p class="room-date">{{ formatDate(room.createdAt) }}</p>
          <p class="room-stats">
            <span>주문: {{ room.orderCount }}건</span>
            <span>총액: {{ formatPrice(room.totalAmount) }}원</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatPrice, formatDate } from '@/shared/utils/format'

defineProps({
  rooms: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['select'])
</script>

<style scoped>
.live-room-list {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
}

.empty-state .hint {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--text-light);
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.room-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all 0.2s;
}

.room-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: var(--spacing-md);
}

.room-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.room-status {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.room-status.active {
  background: var(--color-success);
  color: white;
}

.room-status.ended {
  background: var(--color-secondary);
  color: white;
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.room-date {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.room-stats {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  margin: 0;
}

.room-stats span {
  font-weight: 500;
}
</style>
