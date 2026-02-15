import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLiveStore = defineStore('live', () => {
  // ===== 라방 목록 관련 =====
  const rooms = ref([])
  const currentRoom = ref(null)

  // ===== 개별 라방 내 상태 =====
  const products = ref([])
  const selectedProductId = ref(null)
  const selectedCustomerId = ref(null)
  const quantityDraft = ref(1)
  const cartsByCustomer = ref({})
  const productSearchKeyword = ref('') // 상품 검색어
  const settlementTemplate = ref('') // 정산서 템플릿

  // ===== Getters =====
  const selectedProduct = computed(() => {
    return products.value.find(p => p.id === selectedProductId.value) || null
  })

  // 필터링된 상품 목록
  const filteredProducts = computed(() => {
    if (!productSearchKeyword.value) {
      return products.value
    }
    const keyword = productSearchKeyword.value.toLowerCase()
    return products.value.filter(p => 
      p.name.toLowerCase().includes(keyword) || 
      p.option.toLowerCase().includes(keyword)
    )
  })

  const confirmedCustomers = computed(() => {
    return Object.entries(cartsByCustomer.value)
      .filter(([_, cart]) => cart.length > 0)
      .map(([customerId, cart]) => ({
        id: customerId,
        total: cart.reduce((sum, item) => sum + item.subtotal, 0),
        itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
      }))
  })

  const currentCart = computed(() => {
    if (!selectedCustomerId.value) return []
    return cartsByCustomer.value[selectedCustomerId.value] || []
  })

  const currentCartTotal = computed(() => {
    return currentCart.value.reduce((sum, item) => sum + item.subtotal, 0)
  })

  // ===== 라방 목록 액션 =====
  const setRooms = (newRooms) => {
    rooms.value = newRooms
  }

  const createRoom = (title) => {
    const newRoom = {
      id: `room-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      status: 'active',
      orderCount: 0,
      totalAmount: 0,
    }
    rooms.value.unshift(newRoom)
    return newRoom.id
  }

  const updateRoomStatus = (roomId, status) => {
    const room = rooms.value.find(r => r.id === roomId)
    if (room) {
      room.status = status
    }
    if (currentRoom.value && currentRoom.value.id === roomId) {
      currentRoom.value.status = status
    }
  }

  const loadRoom = (roomId) => {
    const room = rooms.value.find(r => r.id === roomId)
    if (room) {
      currentRoom.value = room
      // 라방별 데이터 초기화 (실제로는 서버에서 불러오기)
      selectedProductId.value = null
      selectedCustomerId.value = null
      quantityDraft.value = 1
      cartsByCustomer.value = {}
    }
  }

  // ===== 상품 관련 액션 =====
  const setProducts = (newProducts) => {
    products.value = newProducts
  }

  const selectProduct = (productId) => {
    selectedProductId.value = productId
  }

  const setProductSearchKeyword = (keyword) => {
    productSearchKeyword.value = keyword
  }

  const clearProductSearch = () => {
    productSearchKeyword.value = ''
  }

  // ===== 고객 관련 액션 =====
  const selectCustomer = (customerId) => {
    selectedCustomerId.value = customerId
    // 고객이 장바구니에 없으면 생성
    if (!cartsByCustomer.value[customerId]) {
      cartsByCustomer.value[customerId] = []
    }
  }

  // ===== 수량 관련 액션 =====
  const setQuantity = (qty) => {
    if (qty >= 1) {
      quantityDraft.value = qty
    }
  }

  const increaseQuantity = () => {
    quantityDraft.value++
  }

  const decreaseQuantity = () => {
    if (quantityDraft.value > 1) {
      quantityDraft.value--
    }
  }

  // ===== 장바구니 관련 액션 =====
  const addToCart = () => {
    if (!selectedCustomerId.value || !selectedProductId.value) {
      return false
    }

    const product = selectedProduct.value
    if (!product) return false

    const customerId = selectedCustomerId.value
    if (!cartsByCustomer.value[customerId]) {
      cartsByCustomer.value[customerId] = []
    }

    const cart = cartsByCustomer.value[customerId]
    const existingItem = cart.find(item => item.productId === product.id)

    if (existingItem) {
      // 이미 있으면 수량 추가
      existingItem.qty += quantityDraft.value
      existingItem.subtotal = existingItem.qty * existingItem.price
    } else {
      // 새로 추가
      cart.push({
        productId: product.id,
        productName: product.name,
        option: product.option,
        price: product.price,
        qty: quantityDraft.value,
        subtotal: product.price * quantityDraft.value,
      })
    }

    // 수량 초기화
    quantityDraft.value = 1
    
    return true
  }

  const removeFromCart = (customerId, productId) => {
    if (cartsByCustomer.value[customerId]) {
      cartsByCustomer.value[customerId] = cartsByCustomer.value[customerId]
        .filter(item => item.productId !== productId)
    }
  }

  const updateCartItemQty = (customerId, productId, qty) => {
    if (cartsByCustomer.value[customerId]) {
      const item = cartsByCustomer.value[customerId]
        .find(item => item.productId === productId)
      if (item && qty >= 1) {
        item.qty = qty
        item.subtotal = item.price * qty
      }
    }
  }

  const getCustomerTotal = (customerId) => {
    const cart = cartsByCustomer.value[customerId] || []
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }

  // ===== 정산서 관련 액션 =====
  const setSettlementTemplate = (template) => {
    settlementTemplate.value = template
  }

  const generateSettlement = (customerId) => {
    const cart = cartsByCustomer.value[customerId] || []
    if (cart.length === 0) {
      return '장바구니가 비어있습니다.'
    }

    const template = settlementTemplate.value || `{customerName} 고객님의 정산서
{items}
총금액: {totalAmount}원
입니다.`

    // 상품 목록 생성
    const itemsText = cart.map(item => 
      `${item.productName} (${item.option}) ${item.qty}개 ${item.price.toLocaleString()}원`
    ).join('\n')

    // 총액 계산
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0)

    // 템플릿 변수 치환
    let settlement = template
      .replace('{customerName}', customerId)
      .replace('{items}', itemsText)
      .replace('{totalAmount}', total.toLocaleString())

    return settlement
  }

  return {
    // State
    rooms,
    currentRoom,
    products,
    selectedProductId,
    selectedCustomerId,
    quantityDraft,
    cartsByCustomer,
    productSearchKeyword,
    settlementTemplate,
    
    // Getters
    selectedProduct,
    filteredProducts,
    confirmedCustomers,
    currentCart,
    currentCartTotal,
    
    // Actions
    setRooms,
    createRoom,
    loadRoom,
    updateRoomStatus,
    setProducts,
    selectProduct,
    setProductSearchKeyword,
    clearProductSearch,
    selectCustomer,
    setQuantity,
    increaseQuantity,
    decreaseQuantity,
    addToCart,
    removeFromCart,
    updateCartItemQty,
    getCustomerTotal,
    setSettlementTemplate,
    generateSettlement,
  }
})
