<template>
  <div class="product-list-panel">
    <div class="panel-header">
      <h2>상품 리스트</h2>
    </div>
    <div class="panel-body">
      <div
        v-for="product in liveStore.products"
        :key="product.id"
        class="product-item"
        :class="{ selected: product.id === liveStore.selectedProductId }"
        @click="handleSelectProduct(product.id)"
      >
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="product-price">{{ formatPrice(product.price) }}원</p>
          <p class="product-stock">재고: {{ product.stock }}개</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useLiveStore } from '@/features/live/store'
import { formatPrice } from '@/shared/utils/format'

const liveStore = useLiveStore()

const handleSelectProduct = (productId) => {
  liveStore.selectProduct(productId)
}
</script>

<style scoped>
.product-list-panel {
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
  overflow-y: auto;
  padding: var(--spacing-md);
}

.product-item {
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.product-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.product-item.selected {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.05);
}

.product-info h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.product-price {
  color: var(--color-primary);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.product-stock {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
