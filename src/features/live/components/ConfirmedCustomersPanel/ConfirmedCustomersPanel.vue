<template>
  <div class="confirmed-customers-panel">
    <div class="panel-header">
      <h2>확정 고객</h2>
    </div>
    <div class="panel-body">
      <div v-if="liveStore.confirmedCustomers.length === 0" class="empty-state">
        확정된 고객이 없습니다
      </div>
      <div v-else class="customer-list">
        <div
          v-for="customer in liveStore.confirmedCustomers"
          :key="customer.id"
          class="customer-item"
          :class="{ selected: customer.id === liveStore.selectedCustomerId }"
          @click="handleSelectCustomer(customer.id)"
        >
          <div class="customer-info">
            <h3>{{ customer.id }}</h3>
            <p class="customer-stats">
              {{ customer.itemCount }}개 상품
            </p>
          </div>
          <div class="customer-total">
            {{ formatPrice(customer.total) }}원
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useLiveStore } from '@/features/live/store'
import { formatPrice } from '@/shared/utils/format'

const liveStore = useLiveStore()

const handleSelectCustomer = (customerId) => {
  liveStore.selectCustomer(customerId)
}
</script>

<style scoped>
.confirmed-customers-panel {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.panel-header h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.panel-body {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.customer-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.customer-item {
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.customer-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.customer-item.selected {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.05);
}

.customer-info h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.customer-stats {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.customer-total {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-primary);
}
</style>
