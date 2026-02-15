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
          placeholder="/고객ID 또는 상품명 입력 후 Enter"
          class="search-input"
          @keyup.enter="handleCommand"
          @input="handleInputChange"
        />
        <!-- 자동완성 드롭다운 - 고객 -->
        <div v-if="showAutocomplete && filteredCustomers.length > 0" class="autocomplete-dropdown">
          <div
            v-for="customer in filteredCustomers"
            :key="customer.id"
            class="autocomplete-item"
            @click="selectCustomerFromAutocomplete(customer.id)"
          >
            <span class="customer-id">{{ customer.id }}</span>
            <span class="customer-info">{{ customer.itemCount }}개 · {{ formatPrice(customer.total) }}원</span>
          </div>
        </div>
        <!-- 자동완성 드롭다운 - 상품 -->
        <div v-if="showProductAutocomplete && filteredProductList.length > 0" class="autocomplete-dropdown">
          <div
            v-for="product in filteredProductList"
            :key="product.id"
            class="autocomplete-item"
            @click="selectProductFromAutocomplete(product)"
          >
            <span class="product-name">{{ product.name }} - {{ product.option }}</span>
            <span class="product-price">{{ formatPrice(product.price) }}원</span>
          </div>
        </div>
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
            <span class="value">{{ liveStore.selectedProduct.name }} - {{ liveStore.selectedProduct.option }}</span>
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
                <p class="item-name">{{ item.productName }} - {{ item.option }}</p>
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
import { ref, computed } from 'vue'
import { useLiveStore } from '@/features/live/store'
import { formatPrice } from '@/shared/utils/format'

const liveStore = useLiveStore()
const commandInput = ref('')
const showAutocomplete = ref(false)
const showProductAutocomplete = ref(false)

// 자동완성용 필터링된 고객 목록
const filteredCustomers = computed(() => {
  if (!commandInput.value.startsWith('/')) {
    return []
  }
  
  const searchTerm = commandInput.value.substring(1).toLowerCase()
  if (!searchTerm) {
    return liveStore.confirmedCustomers
  }
  
  return liveStore.confirmedCustomers.filter(customer => 
    customer.id.toLowerCase().includes(searchTerm)
  )
})

// 자동완성용 필터링된 상품 목록
const filteredProductList = computed(() => {
  if (commandInput.value.startsWith('/') || !commandInput.value.trim()) {
    return []
  }
  
  const keyword = commandInput.value.toLowerCase()
  return liveStore.products.filter(p => 
    p.name.toLowerCase().includes(keyword) || 
    p.option.toLowerCase().includes(keyword)
  ).slice(0, 10) // 최대 10개만 표시
})

const handleInputChange = () => {
  // /로 시작하면 고객 자동완성 표시
  if (commandInput.value.startsWith('/')) {
    showAutocomplete.value = true
    showProductAutocomplete.value = false
  } 
  // 일반 텍스트면 상품 자동완성 표시
  else if (commandInput.value.trim()) {
    showAutocomplete.value = false
    showProductAutocomplete.value = true
  } 
  else {
    showAutocomplete.value = false
    showProductAutocomplete.value = false
  }
}

const selectCustomerFromAutocomplete = (customerId) => {
  liveStore.selectCustomer(customerId)
  commandInput.value = ''
  showAutocomplete.value = false
}

const selectProductFromAutocomplete = (product) => {
  liveStore.selectProduct(product.id)
  liveStore.setProductSearchKeyword(commandInput.value)
  commandInput.value = ''
  showProductAutocomplete.value = false
}

const handleCommand = () => {
  const input = commandInput.value.trim()
  
  // /로 시작하면 고객 ID 입력
  if (input.startsWith('/')) {
    const customerId = input.substring(1).trim()
    if (customerId) {
      liveStore.selectCustomer(customerId)
      commandInput.value = ''
      showAutocomplete.value = false
    }
  }
  // 일반 텍스트면 상품 검색
  else if (input) {
    liveStore.setProductSearchKeyword(input)
    commandInput.value = ''
    showProductAutocomplete.value = false
  }
}

const handleConfirm = () => {
  if (liveStore.selectedCustomerId && liveStore.selectedProduct) {
    liveStore.addToCart()
  }
}

const handleRemoveItem = (productId) => {
  liveStore.removeFromCart(productId)
}
</script>

<style scoped>
.command-search-bar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  min-height: 0;
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
  position: relative;
}

.search-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.autocomplete-item {
  padding: var(--spacing-md);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover {
  background: var(--bg-secondary);
}

.customer-id {
  font-weight: 600;
  color: var(--text-primary);
}

.customer-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.product-name {
  font-weight: 600;
  color: var(--text-primary);
}

.product-price {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
}

.selection-section {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
}

.selection-header h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.selection-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.info-row .label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 60px;
}

.info-row .value {
  color: var(--text-primary);
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.quantity-control .label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 60px;
}

.quantity-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.quantity-buttons button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-lg);
  transition: all 0.2s;
}

.quantity-buttons button:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.quantity-value {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  font-size: var(--font-size-base);
}

.confirm-button {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.confirm-button:hover {
  opacity: 0.9;
}

.cart-section {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
}

.cart-header h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.cart-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.empty-cart {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.cart-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--border-radius);
  position: relative;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.item-detail {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.item-price {
  font-weight: 600;
  color: var(--color-primary);
  margin-right: var(--spacing-sm);
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
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--border-radius);
  border-top: 2px solid var(--border-color);
  margin-top: var(--spacing-sm);
}

.total-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.total-value {
  font-weight: 700;
  font-size: var(--font-size-lg);
  color: var(--color-primary);
}
</style>
