<template>
  <div class="wholesale-orders-page">
    <header class="page-header">
      <h1>도매주문현황</h1>
      <div class="header-actions">
        <button v-if="newOrders.length > 0" class="save-all-btn" @click="handleSaveAll">저장 ({{ newOrders.length }})</button>
        <button v-if="newOrders.length > 0" class="cancel-all-btn" @click="handleCancelAll">취소</button>
        <button class="add-button" @click="handleAddNewRow">+ 신규 주문</button>
      </div>
    </header>

    <div class="filters">
      <select v-model="filters.status" class="filter-select">
        <option value="">전체 상태</option>
        <option value="pending">배송대기</option>
        <option value="shipping">배송중</option>        <option value="completed">배송완료</option>        <option value="completed">배송완료</option>
      </select>
      <select v-model="filters.vendorId" class="filter-select">
        <option value="">전체 에이전시</option>
        <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
          {{ vendor.name }}
        </option>
      </select>
      <select v-model="filters.makerId" class="filter-select">
        <option value="">전체 메이커</option>
        <option v-for="maker in makers" :key="maker.id" :value="maker.id">
          {{ maker.name }}
        </option>
      </select>
    </div>

    <div class="actions-bar" v-if="selectedOrders.length > 0">
      <span class="selected-count">{{ selectedOrders.length }}개 선택됨</span>
      <button class="ship-button" @click="showShipmentModal = true" v-if="canShip">배송요청</button>
      <button class="ship-button" @click="completeDelivery" v-if="canComplete">배송완료</button>
      <button class="products-button" @click="goToProducts">상품관리 보기</button>
    </div>

    <div class="page-content">
      <div v-if="loading" class="loading">주문 목록을 불러오는 중...</div>
      
      <table v-if="!loading || newOrders.length > 0" class="orders-table">
        <thead>
          <tr>
            <th style="width: 40px;"><input type="checkbox" @change="toggleAll" :checked="allSelected" /></th>
            <th style="width: 120px;">에이전시</th>
            <th style="width: 120px;">메이커</th>
            <th style="width: 150px;">제품명</th>
            <th style="width: 120px;">옵션</th>
            <th style="width: 80px;">수량</th>
            <th style="width: 100px;">개당단가</th>
            <th style="width: 100px;">최종원가</th>
            <th style="width: 100px;">수익</th>
            <th style="width: 90px;">상태</th>
            <th style="width: 100px;">등록일</th>
            <th style="width: 100px;">작업</th>
          </tr>
        </thead>
        <tbody>
          <!-- 신규 주문 입력 행 -->
          <tr v-for="(order, index) in newOrders" :key="'new-' + index" class="new-order-row">
            <td>
              <button class="remove-row-btn" @click="removeNewOrder(index)">×</button>
            </td>
            <td>
              <input 
                v-model="order.vendorName" 
                list="vendors-list" 
                class="inline-input" 
                placeholder="에이전시 입력 또는 선택"
                required 
              />
              <datalist id="vendors-list">
                <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.name" />
              </datalist>
            </td>
            <td>
              <input 
                v-model="order.makerName" 
                list="makers-list" 
                class="inline-input" 
                placeholder="메이커 입력 또는 선택"
                required 
              />
              <datalist id="makers-list">
                <option v-for="maker in makers" :key="maker.id" :value="maker.name" />
              </datalist>
            </td>
            <td>
              <input 
                v-model="order.productName" 
                list="products-list" 
                class="inline-input" 
                placeholder="제품명 입력 또는 선택"
                required 
              />
              <datalist id="products-list">
                <option v-for="product in products" :key="product.id" :value="product.name" />
              </datalist>
            </td>
            <td>
              <input 
                v-model="order.variantOption" 
                class="inline-input" 
                placeholder="옵션 입력 (선택사항)"
              />
            </td>
            <td>
              <input v-model.number="order.quantity" type="number" min="1" class="inline-input" required />
            </td>
            <td>
              <input v-model.number="order.unitCostPrice" type="number" min="0" class="inline-input" required />
            </td>
            <td>-</td>
            <td>-</td>
            <td><span class="status-badge status-pending">배송대기</span></td>
            <td>-</td>
            <td></td>
          </tr>

          <!-- 기존 주문 목록 -->
          <tr v-for="order in filteredOrders" :key="order.id">
            <td>
              <input 
                type="checkbox" 
                :value="order.id" 
                v-model="selectedOrders"
                :disabled="order.status === 'completed'"
              />
            </td>
            <td>{{ order.vendorName }}</td>
            <td>{{ order.makerName }}</td>
            <td>{{ order.productName }}</td>
            <td>{{ order.variantOption }}</td>
            <td>{{ order.quantity }}</td>
            <td>{{ formatPrice(order.unitCostPrice) }}원</td>
            <td>{{ formatPrice(order.finalUnitCost) }}원</td>
            <td>-</td>
            <td><span class="status-badge" :class="`status-${order.status}`">{{ getStatusLabel(order.status) }}</span></td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td>
              <button 
                @click="editOrder(order)" 
                class="edit-btn"
                :disabled="order.status === 'completed'"
              >
                수정
              </button>
              <button 
                @click="deleteOrder(order.id)" 
                class="delete-btn"
                :disabled="order.status === 'shipping' || order.status === 'completed'"
              >
                삭제
              </button>
            </td>
          </tr>
          
          <!-- 빈 상태 표시 -->
          <tr v-if="newOrders.length === 0 && filteredOrders.length === 0">
            <td colspan="12" class="empty-row">
              등록된 주문이 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 배송요청 모달 -->
    <div v-if="showShipmentModal" class="modal-overlay" @click.self="showShipmentModal = false">
      <div class="modal">
        <h2>배송요청</h2>
        <form @submit.prevent="handleShipmentRequest">
          <label class="form-label">
            관부과세 (18%)
            <input v-model.number="shipmentForm.customsTax" type="number" class="form-input" required />
          </label>
          <label class="form-label">
            관세사비
            <input v-model.number="shipmentForm.customsBrokerFee" type="number" class="form-input" required />
          </label>
          <label class="form-label">
            일본→한국 배송비
            <input v-model.number="shipmentForm.shippingFee" type="number" class="form-input" required />
          </label>
          <div class="form-summary">
            <p>총 상품 개수: {{ totalQuantity }}개</p>
            <p>배송비 합계: {{ formatPrice(totalShippingCost) }}원</p>
            <p>개당 배송비: {{ formatPrice(costPerUnit) }}원</p>
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-button" @click="showShipmentModal = false">취소</button>
            <button type="submit" class="submit-button">배송요청</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 주문 수정 모달 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <h2>주문 수정</h2>
        <form @submit.prevent="updateOrder">
          <label class="form-label">
            에이전시
            <input v-model="editForm.vendorName" list="vendors-list" class="form-input" required />
          </label>
          <label class="form-label">
            메이커
            <input v-model="editForm.makerName" list="makers-list" class="form-input" required />
          </label>
          <label class="form-label">
            제품명
            <input v-model="editForm.productName" list="products-list" class="form-input" required />
          </label>
          <label class="form-label">
            옵션
            <input v-model="editForm.variantOption" class="form-input" />
          </label>
          <label class="form-label">
            수량
            <input v-model.number="editForm.quantity" type="number" min="1" class="form-input" required />
          </label>
          <label class="form-label">
            개당 단가
            <input v-model.number="editForm.unitCostPrice" type="number" min="0" class="form-input" required />
          </label>
          <div class="modal-actions">
            <button type="button" class="cancel-button" @click="showEditModal = false">취소</button>
            <button type="submit" class="submit-button">수정 완료</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/app/store/auth'
import { useRouter } from 'vue-router'
import { purchaseOrderService, vendorService, makerService, productService } from '@/shared/services/purchase.service'
import { realtimeService } from '@/shared/services/realtime.service'
import { formatPrice } from '@/shared/utils/format'
import { showToast } from '@/shared/utils/toast'
import { db } from '@/app/config/firebase'
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'

const authStore = useAuthStore()
const router = useRouter()

const orders = ref([])
const vendors = ref([])
const makers = ref([])
const products = ref([])
const productVariants = ref([])
const loading = ref(true)
const selectedOrders = ref([])
const newOrders = ref([])
const showShipmentModal = ref(false)
const showEditModal = ref(false)
const editingOrderId = ref(null)

const editForm = ref({
  vendorName: '',
  makerName: '',
  productName: '',
  variantOption: '',
  quantity: 1,
  unitCostPrice: 0
})

// 실시간 구독 해제 함수
let unsubscribeOrders = null

const filters = ref({
  status: '',
  vendorId: '',
  makerId: '',
})

const shipmentForm = ref({
  customsTax: 0,
  customsBrokerFee: 0,
  shippingFee: 0,
})

const filteredOrders = computed(() => {
  let result = orders.value

  if (filters.value.status) {
    result = result.filter(o => o.status === filters.value.status)
  }
  if (filters.value.vendorId) {
    result = result.filter(o => o.vendorId === filters.value.vendorId)
  }
  if (filters.value.makerId) {
    result = result.filter(o => o.makerId === filters.value.makerId)
  }

  return result
})

const availableProducts = computed(() => {
  if (!newOrder.value.makerId) return []
  return products.value.filter(p => p.makerId === newOrder.value.makerId)
})

const allSelected = computed(() => {
  const selectableOrders = filteredOrders.value.filter(o => o.status === 'pending')
  return selectableOrders.length > 0 && selectedOrders.value.length === selectableOrders.length
})

const totalQuantity = computed(() => {
  return selectedOrders.value.reduce((sum, orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    return sum + (order?.quantity || 0)
  }, 0)
})

const totalShippingCost = computed(() => {
  return shipmentForm.value.customsTax + shipmentForm.value.customsBrokerFee + shipmentForm.value.shippingFee
})

const costPerUnit = computed(() => {
  return totalQuantity.value > 0 ? Math.round(totalShippingCost.value / totalQuantity.value) : 0
})

const getStatusLabel = (status) => {
  const labels = {
    pending: '배송대기',
    shipping: '배송중',
    completed: '배송완료',
  }
  return labels[status] || status
}

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('ko-KR')
}

const toggleAll = (e) => {
  if (e.target.checked) {
    // 배송대기 또는 배송중 상태의 주문들만 선택 가능
    const selectableOrders = filteredOrders.value.filter(o => o.status === 'pending' || o.status === 'shipping')
    selectedOrders.value = selectableOrders.map(o => o.id)
  } else {
    selectedOrders.value = []
  }
}

// 배송처리와 배송완료 가능 여부 체크
const canShip = computed(() => {
  return selectedOrders.value.some(orderId => {
    const order = orders.value.find(o => o.id === orderId)
    return order && order.status === 'pending'
  })
})

const canComplete = computed(() => {
  return selectedOrders.value.some(orderId => {
    const order = orders.value.find(o => o.id === orderId)
    return order && order.status === 'shipping'
  })
})

// 배송완료 처리 및 상품관리에 등록
const completeDelivery = async () => {
  if (!confirm('선택한 주문들을 배송완료로 변경하고 상품관리로 등록하시겠습니까?')) return
  
  try {
    const storeId = authStore.currentStoreId
    const batch = writeBatch(db)
    
    // 배송중인 주문들만 필터링
    const shippingOrders = selectedOrders.value
      .map(orderId => orders.value.find(o => o.id === orderId))
      .filter(order => order && order.status === 'shipping')
    
    for (const order of shippingOrders) {
      // 도매주문 상태 업데이트
      const orderRef = doc(db, 'stores', storeId, 'purchaseOrders', order.id)
      batch.update(orderRef, { 
        status: 'completed',
        completedAt: serverTimestamp()
      })
      
      // 상품관리에 등록 (판매가 40% 마진으로 계산)
      const sellingPrice = Math.round(order.finalUnitCost * 1.4 / 100) * 100  // 40% 마진, 100원 단위
      const productRef = doc(collection(db, 'stores', storeId, 'products'))
      batch.set(productRef, {
        makerName: order.makerName,
        productName: order.productName,
        variantOption: order.variantOption || '',
        quantity: order.quantity,
        finalUnitCost: order.finalUnitCost,
        sellingPrice: sellingPrice,
        source: 'wholesale', // 도매에서 유입됨을 표시
        wholesaleOrderId: order.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }
    
    await batch.commit()
    showToast(`${shippingOrders.length}개 주문이 배송완료되었으며 상품관리에 등록되었습니다.`, 'success')
    selectedOrders.value = []
    
  } catch (error) {
    console.error('배송완료 처리 중 오류:', error)
    showToast('배송완료 처리에 실패했습니다.', 'error')
  }
}

// 상품관리 페이지로 이동
const goToProducts = () => {
  const storeId = authStore.currentStoreId
  router.push(`/${storeId}/products`)
}

// 주문 수정
const editOrder = (order) => {
  editingOrderId.value = order.id
  editForm.value = {
    vendorName: order.vendorName,
    makerName: order.makerName,
    productName: order.productName,
    variantOption: order.variantOption || '',
    quantity: order.quantity,
    unitCostPrice: order.unitCostPrice
  }
  showEditModal.value = true
}

// 주문 수정 저장
const updateOrder = async () => {
  try {
    const storeId = authStore.currentStoreId
    const order = orders.value.find(o => o.id === editingOrderId.value)
    
    // 배송비가 이미 적용된 경우 최종원가 재계산
    let finalUnitCost = editForm.value.unitCostPrice
    if (order && order.shipmentId) {
      // 배송비가 적용된 경우 기존 배송비 유지
      const shippingCostPerUnit = order.finalUnitCost - order.unitCostPrice
      finalUnitCost = editForm.value.unitCostPrice + shippingCostPerUnit
    }
    
    await purchaseOrderService.updatePurchaseOrder(storeId, editingOrderId.value, {
      vendorName: editForm.value.vendorName,
      makerName: editForm.value.makerName,
      productName: editForm.value.productName,
      variantOption: editForm.value.variantOption,
      quantity: editForm.value.quantity,
      unitCostPrice: editForm.value.unitCostPrice,
      finalUnitCost: finalUnitCost,
      updatedAt: serverTimestamp()
    })
    
    showToast('주문이 수정되었습니다.', 'success')
    showEditModal.value = false
    editingOrderId.value = null
    
  } catch (error) {
    console.error('주문 수정 실패:', error)
    showToast('주문 수정에 실패했습니다.', 'error')
  }
}

// 주문 삭제
const deleteOrder = async (orderId) => {
  if (!confirm('이 주문을 삭제하시겠습니까?')) return
  
  try {
    const storeId = authStore.currentStoreId
    await purchaseOrderService.deletePurchaseOrder(storeId, orderId)
    showToast('주문이 삭제되었습니다.', 'success')
    
  } catch (error) {
    console.error('주문 삭제 실패:', error)
    showToast('주문 삭제에 실패했습니다.', 'error')
  }
}

const loadData = async () => {
  console.log('[WholesaleOrders] loadData 시작, storeId:', authStore.currentStoreId)
  loading.value = true
  try {
    const storeId = authStore.currentStoreId
    
    if (!storeId) {
      console.warn('[WholesaleOrders] storeId가 없습니다')
      loading.value = false
      return
    }
    
    console.log('[WholesaleOrders] 데이터 로딩 중...')
    // Vendors, Makers, Products는 일반 조회 - 빈 배열로 초기화
    try {
      [vendors.value, makers.value, products.value] = await Promise.all([
        vendorService.getVendors(storeId),
        makerService.getMakers(storeId),
        productService.getProducts(storeId),
      ])
    } catch (e) {
      console.warn('[WholesaleOrders] 마스터 데이터 로드 실패, 빈 배열로 초기화:', e.message)
      vendors.value = []
      makers.value = []
      products.value = []
    }

    console.log('[WholesaleOrders] 데이터 로드 완료:', {
      vendors: vendors.value.length,
      makers: makers.value.length,
      products: products.value.length
    })

    // Orders는 실시간 구독
    setupRealtimeOrders()
  } catch (error) {
    console.error('[WholesaleOrders] 데이터 로드 실패:', error)
    // 에러가 나도 페이지는 보여줌 (알림 제거)
  } finally {
    loading.value = false
  }
}

const setupRealtimeOrders = () => {
  const storeId = authStore.currentStoreId
  console.log('[WholesaleOrders] setupRealtimeOrders, storeId:', storeId)
  if (!storeId) return

  // 기존 구독 해제
  if (unsubscribeOrders) {
    console.log('[WholesaleOrders] 기존 구독 해제')
    unsubscribeOrders()
  }

  // 실시간 구독 시작
  console.log('[WholesaleOrders] 실시간 구독 시작')
  unsubscribeOrders = realtimeService.subscribeToPurchaseOrders(storeId, {}, (fetchedOrders) => {
    console.log('[WholesaleOrders] 주문 데이터 수신:', fetchedOrders.length, '건')
    orders.value = fetchedOrders
  })
}

const handleProductChange = async () => {
  if (!newOrder.value.productId) {
    productVariants.value = []
    return
  }
  
  try {
    const storeId = authStore.currentStoreId
    productVariants.value = await productService.getProductVariants(storeId, newOrder.value.productId)
  } catch (error) {
    console.error('옵션 로드 실패:', error)
    productVariants.value = []
  }
}

const handleAddNewRow = () => {
  newOrders.value.push({
    vendorName: '',
    makerName: '',
    productName: '',
    variantOption: '',
    quantity: 1,
    unitCostPrice: 0,
  })
}

const removeNewOrder = (index) => {
  newOrders.value.splice(index, 1)
}

const handleCancelAll = () => {
  newOrders.value = []
}

const handleSaveAll = async () => {
  try {
    const storeId = authStore.currentStoreId
    
    if (!storeId) {
      alert('스토어 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    
    // 모든 주문 유효성 검사
    for (let i = 0; i < newOrders.value.length; i++) {
      const order = newOrders.value[i]
      if (!order.vendorName || !order.makerName || !order.productName || 
          !order.quantity || !order.unitCostPrice) {
        alert(`${i + 1}번째 주문: 모든 필드를 입력해주세요. (옵션은 선택사항)`)
        return
      }
    }
    
    // 모든 주문 저장
    for (const order of newOrders.value) {
      // 에이전시 찾기 또는 생성
      let vendor = vendors.value.find(v => v.name === order.vendorName)
      let vendorId = vendor?.id || `vendor_${Date.now()}`
      
      // 메이커 찾기 또는 생성
      let maker = makers.value.find(m => m.name === order.makerName)
      let makerId = maker?.id || `maker_${Date.now()}`
      
      // 제품 찾기 또는 생성
      let product = products.value.find(p => p.name === order.productName)
      let productId = product?.id || `product_${Date.now()}`
      
      const orderData = {
        orderNumber: `PO-${Date.now()}`,
        vendorId: vendorId,
        vendorName: order.vendorName,
        makerId: makerId,
        makerName: order.makerName,
        productId: productId,
        productName: order.productName,
        variantId: order.variantOption ? `variant_${Date.now()}` : null,
        variantOption: order.variantOption || null,
        quantity: order.quantity,
        unitCostPrice: order.unitCostPrice,
        sellingPrice: 0,
      }
      
      await purchaseOrderService.createPurchaseOrder(storeId, orderData, authStore.user.uid)
      
      // 약간의 딩레이 (고유 ID 보장)
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    alert(`${newOrders.value.length}건의 주문이 등록되었습니다!`)
    newOrders.value = []
  } catch (error) {
    console.error('주문 등록 실패:', error)
    alert('주문 등록에 실패했습니다.')
  }
}

const handleShipmentRequest = async () => {
  try {
    const storeId = authStore.currentStoreId
    
    // 1. Shipment 생성
    const selectedOrdersData = orders.value.filter(o => selectedOrders.value.includes(o.id))
    const shipmentData = {
      shipmentNumber: `SHIP-${Date.now()}`,
      vendorId: selectedOrdersData[0].vendorId,
      vendorName: selectedOrdersData[0].vendorName,
      purchaseOrderIds: selectedOrders.value,
      totalQuantity: totalQuantity.value,
      customsTax: shipmentForm.value.customsTax,
      customsBrokerFee: shipmentForm.value.customsBrokerFee,
      shippingFee: shipmentForm.value.shippingFee,
      totalShippingCost: totalShippingCost.value,
      costPerUnit: costPerUnit.value,
      notes: '',
    }
    
    const shipmentId = await purchaseOrderService.createShipment(storeId, shipmentData, authStore.user.uid)
    
    // 2. 선택된 주문들 업데이트
    await purchaseOrderService.updateOrdersWithShipping(storeId, selectedOrders.value, shipmentId, costPerUnit.value)
    
    showToast('배송 요청이 완료되었습니다!')
    showShipmentModal.value = false
    selectedOrders.value = []
    shipmentForm.value = { customsTax: 0, customsBrokerFee: 0, shippingFee: 0 }
    
    // 데이터 리로드
    await loadData()
  } catch (error) {
    console.error('배송 요청 실패:', error)
    showToast('배송 요청에 실패했습니다.')
  }
}

watch(() => authStore.currentStoreId, (newStoreId, oldStoreId) => {
  console.log('[WholesaleOrders] watch - currentStoreId 변경:', oldStoreId, '->', newStoreId)
  // storeId가 있고 실제로 변경되었을 때만 리로드
  if (newStoreId) {
    loadData()
  }
})

onMounted(() => {
  console.log('[WholesaleOrders] onMounted, currentStoreId:', authStore.currentStoreId)
  if (authStore.currentStoreId) {
    loadData()
  }
})
onUnmounted(() => {
  // 컴포넌트 언마운트 시 구독 해제
  if (unsubscribeOrders) {
    unsubscribeOrders()
  }
})</script>

<style scoped>
.wholesale-orders-page {
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.save-all-btn,
.cancel-all-btn,
.add-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.save-all-btn {
  background: #10b981;
  color: white;
}

.save-all-btn:hover {
  background: #059669;
}

.cancel-all-btn {
  background: #ef4444;
  color: white;
}

.cancel-all-btn:hover {
  background: #dc2626;
}

.add-button {
  background: #3b82f6;
  color: white;
}

.add-button:hover {
  opacity: 0.9;
}

.filters {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: #f0f9ff;
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-md);
}

.selected-count {
  font-weight: 600;
  color: var(--color-primary);
}

.ship-button {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
}

.ship-button:hover {
  opacity: 0.9;
}

.page-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}

.loading,
.empty {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-secondary);
}

.empty-row {
  padding: var(--spacing-xl) !important;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.orders-table th,
.orders-table td {
  padding: var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  overflow: hidden;
  text-overflow: ellipsis;
}

.orders-table th {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 14px;
}

.orders-table td {
  font-size: 14px;
  color: var(--text-primary);
}

.new-order-row {
  background: #fffbeb;
}

.remove-row-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-row-btn:hover {
  background: #dc2626;
}

.inline-select,
.inline-input {
  width: 100%;
  padding: 6px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
}

.inline-select:focus,
.inline-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.save-btn,
.cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
}

.save-btn {
  background: var(--color-primary);
  color: white;
}

.save-btn:hover {
  opacity: 0.9;
}

.cancel-btn {
  background: #e5e7eb;
  color: #374151;
}

.cancel-btn:hover {
  background: #d1d5db;
}

.profit {
  color: #16a34a;
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-shipping {
  background: #dbeafe;
  color: #1e40af;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: var(--spacing-xl);
  border-radius: var(--border-radius);
  max-width: 500px;
  width: 90%;
}

.modal h2 {
  margin: 0 0 var(--spacing-lg);
  font-size: var(--font-size-xl);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-md);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  margin-top: 4px;
  font-size: 14px;
}

.form-summary {
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  margin: var(--spacing-md) 0;
}

.form-summary p {
  margin: 4px 0;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
}

.cancel-button,
.submit-button {
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
}

.cancel-button {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.submit-button {
  background: var(--color-primary);
  color: white;
}

.cancel-button:hover,
.submit-button:hover {
  opacity: 0.9;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  margin-right: 4px;
}

.edit-btn {
  background: #f59e0b;
  color: white;
}

.edit-btn:hover {
  background: #d97706;
}

.edit-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

.delete-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}
</style>
