<template>
  <div class="command-search-bar">
    <div class="panel-header">
      <h2>명령어 입력</h2>
    </div>
    <!-- 검색창 -->
    <div class="search-section">
      <input
        ref="searchInputRef"
        v-model="commandInput"
        type="text"
        placeholder="/고객ID 또는 상품명 입력 후 Enter"
        class="search-input"
        @keydown="handleKeydown"
        @input="handleInputChange"
      />
      <!-- 자동완성 드롭다운 - 고객 -->
      <div v-if="showAutocomplete && filteredCustomers.length > 0" class="autocomplete-dropdown">
        <div
          v-for="(customer, index) in filteredCustomers"
          :key="customer.id"
          class="autocomplete-item"
          :class="{ 'selected': selectedIndex === index }"
          @click="selectCustomerFromAutocomplete(customer.id)"
        >
          <span class="customer-id">{{ customer.id }}</span>
          <span class="customer-info">{{ customer.itemCount }}개 · {{ formatPrice(customer.total) }}원</span>
        </div>
      </div>
      <!-- 자동완성 드롭다운 - 상품 -->
      <div v-if="showProductAutocomplete && filteredProductList.length > 0" class="autocomplete-dropdown">
        <div
          v-for="(product, index) in filteredProductList"
          :key="product.id"
          class="autocomplete-item"
          :class="{ 'selected': selectedIndex === index }"
          @click="selectProductFromAutocomplete(product)"
        >
          <span class="product-name">{{ product.name }} - {{ product.option }}</span>
          <span class="product-price">{{ formatPrice(product.price) }}원</span>
        </div>
      </div>
    </div>
    <div class="panel-body">
      <!-- 선택 영역 -->
      <div v-if="liveStore.selectedCustomerId || liveStore.selectedProductId" class="selection-section">
        <div class="selection-header">
          <h3>{{ liveStore.selectedCustomerId || '선택 정보' }}</h3>
        </div>
        <div class="selection-content">
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
              <div v-if="editingItemId === item.productId" class="edit-mode">
                <div class="edit-info">
                  <p class="item-name">{{ item.productName }} - {{ item.option }}</p>
                  <p class="item-detail">{{ formatPrice(item.price) }}원</p>
                </div>
                <div class="edit-controls">
                  <button class="qty-btn" @click="editQuantity = Math.max(1, editQuantity - 1)">-</button>
                  <input 
                    v-model.number="editQuantity" 
                    type="number" 
                    class="qty-input"
                    min="1"
                  />
                  <button class="qty-btn" @click="editQuantity++">+</button>
                  <button class="save-btn" @click="handleUpdateQuantity(item.productId)">✓</button>
                  <button class="cancel-btn" @click="handleCancelEdit">×</button>
                </div>
              </div>
              <template v-else>
                <div class="item-info">
                  <p class="item-name">{{ item.productName }} - {{ item.option }}</p>
                  <p class="item-detail">
                    {{ formatPrice(item.price) }}원 × {{ item.qty }}개
                  </p>
                </div>
                <div class="item-actions">
                  <div class="item-price">
                    {{ formatPrice(item.subtotal) }}원
                  </div>
                  <button 
                    class="edit-button" 
                    @click="handleEditItem(item.productId)"
                    title="수량 수정"
                  >
                    ✏️
                  </button>
                  <button class="remove-button" @click="handleRemoveItem(item.productId)">
                    ×
                  </button>
                </div>
              </template>
            </div>
            <div class="cart-summary">
              <div class="summary-row">
                <span class="summary-label">소계:</span>
                <span class="summary-value">{{ formatPrice(liveStore.currentCartSubtotal) }}원</span>
              </div>
              <div v-if="liveStore.currentCartShippingFee > 0" class="summary-row">
                <span class="summary-label">배송비:</span>
                <span class="summary-value">{{ formatPrice(liveStore.currentCartShippingFee) }}원</span>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLiveStore } from '@/features/live/store'
import { formatPrice } from '@/shared/utils/format'
import { showToast } from '@/shared/utils/toast'

const liveStore = useLiveStore()
const commandInput = ref('')
const showAutocomplete = ref(false)
const showProductAutocomplete = ref(false)
const editingItemId = ref(null)
const editQuantity = ref(1)
const searchInputRef = ref(null)
const selectedIndex = ref(-1)

// 전역 키보드 이벤트 처리
const handleGlobalKeydown = (e) => {
  // 입력 요소에 포커스가 있으면 무시
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return
  }
  
  // Ctrl, Alt, Cmd 등 조합키는 무시
  if (e.ctrlKey || e.altKey || e.metaKey) {
    return
  }
  
  // 특수 키는 무시 (화살표, ESC, Enter 등)
  const ignoredKeys = ['Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock']
  if (ignoredKeys.includes(e.key)) {
    return
  }
  
  // 일반 문자 키를 누르면 검색창에 포커스하고 해당 키를 입력
  if (e.key.length === 1) {
    e.preventDefault()
    if (searchInputRef.value) {
      searchInputRef.value.focus()
      commandInput.value = e.key
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

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
  selectedIndex.value = -1 // 입력이 변경되면 선택 인덱스 리셋
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
  selectedIndex.value = -1
}

const selectProductFromAutocomplete = (product) => {
  liveStore.selectProduct(product.id)
  liveStore.setProductSearchKeyword(commandInput.value)
  commandInput.value = ''
  showProductAutocomplete.value = false
  selectedIndex.value = -1
}

const handleKeydown = (e) => {
  // 자동완성이 표시 중일 때만 방향키 처리
  if (showAutocomplete.value && filteredCustomers.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCustomers.value.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex.value >= 0 && selectedIndex.value < filteredCustomers.value.length) {
        // 선택된 항목이 있으면 해당 고객 선택
        selectCustomerFromAutocomplete(filteredCustomers.value[selectedIndex.value].id)
      } else {
        // 선택된 항목이 없으면 기존 handleCommand 로직 실행
        handleCommand()
      }
    }
  } else if (showProductAutocomplete.value && filteredProductList.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredProductList.value.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex.value >= 0 && selectedIndex.value < filteredProductList.value.length) {
        // 선택된 항목이 있으면 해당 상품 선택
        selectProductFromAutocomplete(filteredProductList.value[selectedIndex.value])
      } else {
        // 선택된 항목이 없으면 기존 handleCommand 로직 실행
        handleCommand()
      }
    }
  } else if (e.key === 'Enter') {
    // 자동완성이 없을 때는 기존 엔터 처리
    handleCommand()
  }
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
      selectedIndex.value = -1
    }
  }
  // 일반 텍스트면 상품 검색
  else if (input) {
    liveStore.setProductSearchKeyword(input)
    commandInput.value = ''
    showProductAutocomplete.value = false
    selectedIndex.value = -1
  }
}

const handleConfirm = () => {
  if (liveStore.selectedCustomerId && liveStore.selectedProduct) {
    showToast(`${liveStore.selectedProduct.name} - ${liveStore.selectedProduct.option} 장바구니에 추가되었습니다!`)
    liveStore.addToCart()
  }
}

const handleEditItem = (productId) => {
  const item = liveStore.currentCart.find(i => i.productId === productId)
  if (item) {
    editingItemId.value = productId
    editQuantity.value = item.qty
  }
}

const handleUpdateQuantity = (productId) => {
  if (liveStore.selectedCustomerId && editQuantity.value >= 1) {
    liveStore.updateCartItemQty(liveStore.selectedCustomerId, productId, editQuantity.value)
    editingItemId.value = null
  }
}

const handleCancelEdit = () => {
  editingItemId.value = null
  editQuantity.value = 1
}

const handleRemoveItem = (productId) => {
  liveStore.removeFromCart(liveStore.selectedCustomerId, productId)
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
  min-height: 0;
}

.search-section {
  position: relative;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
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

.autocomplete-item.selected {
  background: var(--color-primary);
  color: white;
}

.autocomplete-item.selected .customer-id,
.autocomplete-item.selected .customer-info,
.autocomplete-item.selected .product-name,
.autocomplete-item.selected .product-price {
  color: white;
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
  font-size: var(--font-size-xl);
  font-weight: 700;
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
  font-size: var(--font-size-xl);
  font-weight: 700;
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

.item-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.edit-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.edit-button:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.edit-mode {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.edit-info {
  flex: 1;
}

.edit-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.qty-btn {
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.qty-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.qty-input {
  width: 60px;
  height: 32px;
  text-align: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-weight: 600;
}

.save-btn {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
  font-weight: 700;
}

.save-btn:hover {
  opacity: 0.9;
}

.cancel-btn {
  width: 32px;
  height: 32px;
  background: var(--text-secondary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 20px;
  font-weight: 700;
}

.cancel-btn:hover {
  opacity: 0.9;
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

.cart-summary {
  margin-top: var(--spacing-sm);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: white;
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-xs);
}

.summary-label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.summary-value {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.cart-total {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--border-radius);
  border-top: 2px solid var(--border-color);
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
