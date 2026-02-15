<template>
  <div class="customer-cart-panel">
    <div class="panel-header">
      <h2>고객 카트</h2>
    </div>
    <div class="panel-body">
      <div v-if="!selectedCustomer" class="empty-state">
        고객을 선택해주세요
      </div>
      <div v-else class="cart-content">
        <div class="customer-info">
          <h3>{{ selectedCustomer.name }}</h3>
          <p>{{ selectedCustomer.phoneNumber }}</p>
        </div>
        <div class="cart-items">
          <!-- 카트 아이템 목록 -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const selectedCustomer = ref(null)
</script>

<style scoped>
.customer-cart-panel {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  flex: 1;
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

.customer-info h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.customer-info p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
