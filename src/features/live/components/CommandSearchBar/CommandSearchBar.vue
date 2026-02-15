<template>
  <div class="command-search-bar">
    <div class="panel-header">
      <h2>명령어 입력</h2>
    </div>
    <div class="panel-body">
      <!-- 검색창 -->
      <div class="search-section">
        <input
          v-model="commandInput"
          type="text"
          placeholder="/고객ID 입력 후 Enter"
          class="search-input"
          @keyup.enter="handleCommand"
        />
      </div>

      <!-- 선택 영역 -->
      <div v-if="liveStore.selectedCustomerId || liveStore.selectedProductId" class="selection-section">
        <div class="selection-header">
          <h3>선택 정보</h3>
        </div>
        <div class="selection-content">
          <div v-if="liveStore.selectedCustomerId" class="info-row">
            <span class="label">고객ID:</span>
            <span class="value">{{ liveStore.selectedCustomerId }}</span>
          </div>
          <div v-if="liveStore.selectedProduct" class="info-row">
            <span class="label">상품:</span>
            <span class="value">{{ liveStore.selectedProduct.name }}</span>
          </div>
          <div v-if="liveStore.selectedProduct" class="info-row">
            <span class="label">가격:</span>
            <span class="value">{{ formatPrice(liveStore.selectedProduct.price) }}원</span>
          </div>
          <div v-if="liveStore.selectedProduct" class="quantity-control">
            <span class="label">수량:</span>
            <div class="quantity-buttons">
              <button @click="liveStore.decreaseQuantity()">-</button>
              <span class="quantity-value">{{ liveStore.quantityDraft }}</span>
              <button @click="liveStore.increaseQuantity()">+</button>
            </div>
          </div>
          <button 
            v-if="liveStore.selectedCustomerId && liveStore.selectedProduct"
            class="confirm-button"
            @click="handleConfirm"
          >
            확정
          </button>
        </div>
      </div>

      <!-- 장바구니 영역 -->
      <div v-if="liveStore.selectedCustomerId" class="cart-section">
        <div class="cart-header">
          <h3>{{ liveStore.selectedCustomerId }}님의 장바구니</h3>
        </div>
        <div class="cart-body">
          <div v-if="liveStore.currentCart.length === 0" class="empty-cart">
            장바구니가 비어있습니다
          </div>
          <div v-else class="cart-items">
            <div
              v-for="item in liveStore.currentCart"
              :key="item.productId"
              class="cart-item"
            >
              <div class="item-info">
                <p class="item-name">{{ item.productName }}</p>
                <p class="item-detail">
                  {{ formatPrice(item.price) }}원 × {{ item.qty }}개
                </p>
              </div>
              <div class="item-price">
                {{ formatPrice(item.subtotal) }}원
              </div>
              <button class="remove-button" @click="handleRemoveItem(item.productId)">
                ×
              </button>
            </div>
            <div class="cart-total">
              <span class="total-label">합계:</span>
              <span class="total-value">{{ formatPrice(liveStore.currentCartTotal) }}원</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLiveStore } from '@/features/live/store'
import { formatPrice } from '@/shared/utils/format'

const liveStore = useLiveStore()
const commandInput = ref('')

const handleCommand = () => {
  const input = commandInput.value.trim()
  
  // /로 시작하면 고객 ID 입력
  if (input.startsWith('/')) {
    const customerId = input.substring(1).trim()
    if (customerId) {
      liveStore.selectCustomer(customerId)
      commandInput.value = ''
    }
  }
}

const handleConfirm = () => {
  const success = liveStore.addToCart()
  if (success) {
    // 확정 성공 시 입력창 초기화
    commandInput.value = ''
  } else {
    alert('고객과 상품을 먼저 선택해주세요.')
  }
}

const handleRemoveItem = (productId) => {
  if (confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
    liveStore.removeFromCart(liveStore.selectedCustomerId, productId)
  }
}
</script>

<style scoped>
.command-search-bar {
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
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.search-section {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--color-primary);
}

.selection-section {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
}

.selection-header h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.selection-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-row {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 60px;
}

.value {
  color: var(--text-primary);
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.quantity-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-xs);
}

.quantity-buttons button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.quantity-buttons button:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.quantity-value {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
}

.confirm-button {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-button:hover {
  background: var(--color-primary-dark);
}

.cart-section {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.cart-header h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.cart-body {
  flex: 1;
  overflow-y: auto;
}

.empty-cart {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--spacing-xl);
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.cart-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  position: relative;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

.item-detail {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.item-price {
  font-weight: 600;
  color: var(--color-primary);
}

.remove-button {
  width: 24px;
  height: 24px;
  border: none;
  background: var(--color-danger);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: var(--font-size-lg);
  line-height: 1;
  transition: opacity 0.2s;
}

.remove-button:hover {
  opacity: 0.8;
}

.cart-total {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.total-value {
  color: var(--color-primary);
}
</style>
