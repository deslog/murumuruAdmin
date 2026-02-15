<template>
  <div class="product-list-panel">
    <div class="panel-header">
      <h2>상품 리스트</h2>
      <button 
        v-if="liveStore.productSearchKeyword" 
        class="clear-search-btn"
        @click="liveStore.clearProductSearch()"
      >
        전체보기
      </button>
    </div>
    <div class="panel-body">
      <div v-if="liveStore.productSearchKeyword" class="search-info">
        "{{ liveStore.productSearchKeyword }}" 검색 결과 ({{ liveStore.filteredProducts.length }}개)
      </div>
      <div
        v-for="product in liveStore.filteredProducts"
        :key="product.id"
        class="product-item"
        :class="{ selected: product.id === liveStore.selectedProductId }"
        @click="handleSelectProduct(product.id)"
      >
        <div class="product-info">
          <h3>{{ product.name }} - {{ product.option }}</h3>
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
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  min-height: 0;
}

.panel-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.clear-search-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.search-info {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.product-item {
  padding: var(--spacing-md);
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.product-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-item.selected {
  border-color: var(--color-primary);
  background: rgba(79, 70, 229, 0.05);
}

.product-info h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.product-price {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.product-stock {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
