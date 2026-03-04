import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/app/store/auth'
import { liveService } from '@/shared/services/live.service'
import { productService } from '@/shared/services/purchase.service'
import { db } from '@/app/config/firebase'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'

export const useLiveStore = defineStore('live', () => {
  // Auth Store
  const authStore = useAuthStore()

  // ===== 라방 목록 관련 =====
  const rooms = ref([])
  const currentRoom = ref(null)

  // ===== 개별 라방 내 상태 =====
  const products = ref([])
  const selectedProductId = ref(null)
  const selectedCustomerId = ref(null)
  const quantityDraft = ref(1)
  const orders = ref([]) // Firestore orders
  const currentOrderItems = ref([]) // 현재 선택된 고객의 아이템
  const productSearchKeyword = ref('') // 상품 검색어
  const settlementTemplate = ref('정산서\n{customerName}님\n\n{items}\n\n합계: {totalAmount}원') // 정산서 템플릿
  const manualConfirmedCustomers = ref(new Set()) // 수동으로 확정된 고객들
  
  // products 변경 추적을 위한 watch 추가
  watch(products, (newVal, oldVal) => {
    console.log('[products watch] 상품 배열 변경됨:', {
      이전개수: oldVal?.length || 0,
      현재개수: newVal?.length || 0,
      스택추적: new Error().stack
    })
  }, { deep: true })

  // 실시간 구독 해제 함수들
  let unsubscribeOrders = null
  let unsubscribeOrderItems = null

  // ===== Getters =====
  const selectedProduct = computed(() => {
    return products.value.find(p => p.id === selectedProductId.value) || null
  })

  // 필터링된 상품 목록
  const filteredProducts = computed(() => {
    const allProducts = products.value
    console.log('[filteredProducts] 계산 시작 - 전체 상품 수:', allProducts.length)
    console.log('[filteredProducts] 검색어:', productSearchKeyword.value)
    
    if (!productSearchKeyword.value) {
      console.log('[filteredProducts] 검색어 없음, 전체 상품 반환:', allProducts.length)
      return allProducts
    }
    const keyword = productSearchKeyword.value.toLowerCase()
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(keyword)
    )
    console.log('[filteredProducts] 필터링 결과:', filtered.length, '개')
    return filtered
  })

  // 확정된 고객 목록 (장바구니에 아이템이 있는 고객 + 수동 확정된 고객)
  const confirmedCustomers = computed(() => {
    console.log('[confirmedCustomers] 계산 시작')
    console.log('[confirmedCustomers] 전체 주문:', orders.value)
    console.log('[confirmedCustomers] 수동 확정 고객:', Array.from(manualConfirmedCustomers.value))
    
    // 장바구니 상태(cart)이고 총액이 0보다 큰 주문들에서 고객 추출
    const customersWithItems = new Map()
    
    orders.value.forEach(order => {
      console.log('[confirmedCustomers] 주문 확인:', {
        customerId: order.customerId,
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        itemCount: order.itemCount
      })
      
      // 조건 완화: 고객 ID가 있고, 아이템 개수가 0보다 크거나 총액이 0보다 크면 확정고객으로 표시
      if (order.customerId && (order.itemCount > 0 || order.total > 0 || order.subtotal > 0)) {
        console.log('[confirmedCustomers] 조건 만족하는 고객:', order.customerId)
        if (!customersWithItems.has(order.customerId)) {
          customersWithItems.set(order.customerId, {
            id: order.customerId,
            total: order.total || order.subtotal || 0,
            itemCount: order.itemCount || 1 
          })
        } else {
          // 기존 고객의 총액 업데이트
          const existing = customersWithItems.get(order.customerId)
          existing.total = Math.max(existing.total, order.total || order.subtotal || 0)
          existing.itemCount = Math.max(existing.itemCount, order.itemCount || 0)
        }
      }
    })
    
    // 수동으로 확정된 고객들도 추가
    manualConfirmedCustomers.value.forEach(customerId => {
      console.log('[confirmedCustomers] 수동 확정 고객 처리:', customerId)
      if (!customersWithItems.has(customerId)) {
        // orders에서 해당 고객의 총액을 찾아서 설정
        const customerOrder = orders.value.find(o => o.customerId === customerId)
        console.log('[confirmedCustomers] 수동 확정 고객의 주문:', customerOrder)
        customersWithItems.set(customerId, {
          id: customerId,
          total: customerOrder?.total || customerOrder?.subtotal || 0,
          itemCount: customerOrder?.itemCount || 0
        })
      }
    })
    
    const result = Array.from(customersWithItems.values())
    console.log('[confirmedCustomers] 최종 결과:', result)
    return result
  })

  // 현재 선택된 고객의 장바구니
  const currentCart = computed(() => {
    return currentOrderItems.value
  })

  const currentCartSubtotal = computed(() => {
    return currentOrderItems.value.reduce((sum, item) => sum + item.subtotal, 0)
  })

  const currentCartShippingFee = computed(() => {
    const subtotal = currentCartSubtotal.value
    return subtotal > 0 && subtotal < 100000 ? 3500 : 0
  })

  const currentCartTotal = computed(() => {
    return currentCartSubtotal.value + currentCartShippingFee.value
  })

  // ===== 라방 목록 액션 =====
  const loadRooms = async () => {
    try {
      const storeId = authStore.currentStoreId
      if (!storeId) return

      const fetchedRooms = await liveService.getLiveRooms(storeId)
      rooms.value = fetchedRooms
    } catch (error) {
      console.error('라방 목록 로드 실패:', error)
    }
  }

  const createRoom = async (title) => {
    try {
      const storeId = authStore.currentStoreId
      const userId = authStore.user.uid

      const roomId = await liveService.createLiveRoom(storeId, { title }, userId)
      await loadRooms()
      return roomId
    } catch (error) {
      console.error('라방 생성 실패:', error)
      return null
    }
  }

  const updateRoomStatus = async (roomId, status) => {
    try {
      const storeId = authStore.currentStoreId
      await liveService.updateRoomStatus(storeId, roomId, status)
      
      // 로컬 상태 업데이트
      const room = rooms.value.find(r => r.id === roomId)
      if (room) {
        room.status = status
      }
      if (currentRoom.value && currentRoom.value.id === roomId) {
        currentRoom.value.status = status
      }
    } catch (error) {
      console.error('라방 상태 업데이트 실패:', error)
    }
  }

  const loadRoom = async (roomId) => {
    try {
      const storeId = authStore.currentStoreId
      if (!storeId) return

      // 라방 정보 로드
      const room = await liveService.getLiveRoom(storeId, roomId)
      currentRoom.value = room

      // 상품 목록 로드 (실제 상품관리 데이터 사용)
      loadProductsFromStore()

      // 주문 목록 실시간 구독
      subscribeToOrders(roomId)

      // 초기화
      selectedProductId.value = null
      selectedCustomerId.value = null
      quantityDraft.value = 1
      currentOrderItems.value = []
      manualConfirmedCustomers.value = new Set() // 확정고객 목록도 초기화
    } catch (error) {
      console.error('라방 로드 실패:', error)
    }
  }

  // ===== 상품 관련 액션 =====
  // 상품관리에서 실제 상품 데이터 로드
  const loadProductsFromStore = async () => {
    try {
      const storeId = authStore.currentStoreId
      if (!storeId) {
        console.warn('[loadProductsFromStore] storeId가 없습니다')
        return
      }

      console.log('[loadProductsFromStore] 상품 로드 시작, storeId:', storeId)
      const productsRef = collection(db, 'stores', storeId, 'products')
      // 인덱스 에러 해결: orderBy 제거하고 단순 쿼리 사용
      const q = query(productsRef)
      
      onSnapshot(q, (snapshot) => {
        console.log('[loadProductsFromStore] snapshot 수신, docs 수:', snapshot.docs.length)
        
        const productList = snapshot.docs.map(doc => {
          const data = doc.data()
          console.log('[loadProductsFromStore] 상품 데이터:', data)
          return {
            id: doc.id,
            productId: doc.id, // addToCart에서 사용할 productId 추가
            variantId: doc.id, // addToCart에서 사용할 variantId 추가
            name: `${data.productName}${data.variantOption ? ` (${data.variantOption})` : ''}`,
            makerName: data.makerName,
            price: data.sellingPrice,
            stock: data.quantity,
            option: data.variantOption || '',
            createdAt: data.createdAt // 정렬을 위해 추가
          }
        })
        
        // 생성일 기준으로 클라이언트에서 정렬
        productList.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0)
          const bDate = b.createdAt?.toDate?.() || new Date(0)
          return bDate - aDate
        })
        
        products.value = productList
        console.log('[loadProductsFromStore] 상품 로드 완료, 총 개수:', productList.length)
        console.log('[loadProductsFromStore] 첫 번째 상품 예시:', productList[0])
        console.log('[loadProductsFromStore] products.value 할당됨:', products.value.length)
      }, (error) => {
        console.error('[loadProductsFromStore] 실시간 구독 에러:', error)
      })
      
    } catch (error) {
      console.error('상품관리 데이터 로드 실패:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const storeId = authStore.currentStoreId
      if (!storeId) return

      // 인덱스 에러 해결: isActive 필터 제거
      const fetchedProducts = await productService.getProducts(storeId, {})
      
      // 각 상품의 variants 로드
      const productsWithVariants = await Promise.all(
        fetchedProducts.map(async (product) => {
          const variants = await productService.getProductVariants(storeId, product.id)
          return variants.map(variant => ({
            id: `${product.id}_${variant.id}`,
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            option: variant.optionName,
            price: variant.sellingPrice,
            stock: variant.stock,
            makerId: product.makerId,
            makerName: product.makerName,
          }))
        })
      )
      
      products.value = productsWithVariants.flat()
    } catch (error) {
      console.error('상품 로드 실패:', error)
    }
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
  const selectCustomer = async (customerId) => {
    try {
      console.log('[selectCustomer] 고객 선택 시작:', customerId)
      
      const storeId = authStore.currentStoreId
      const roomId = currentRoom.value?.id
      const userId = authStore.user.uid

      if (!storeId || !roomId) {
        console.warn('[selectCustomer] storeId 또는 roomId가 없음:', { storeId, roomId })
        return
      }

      selectedCustomerId.value = customerId
      console.log('[selectCustomer] selectedCustomerId 설정됨:', selectedCustomerId.value)

      // 주문 생성 또는 조회
      const order = await liveService.getOrCreateOrder(storeId, roomId, customerId, userId)
      console.log('[selectCustomer] 주문 생성/조회 완료:', order)

      // 주문 아이템 실시간 구독
      subscribeToOrderItems(order.id)
    } catch (error) {
      console.error('고객 선택 실패:', error)
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
  const addToCart = async () => {
    try {
      console.log('[addToCart] 시작 - selectedCustomerId:', selectedCustomerId.value)
      console.log('[addToCart] 시작 - selectedProductId:', selectedProductId.value)
      
      if (!selectedCustomerId.value || !selectedProductId.value) {
        console.warn('고객 ID 또는 상품 ID가 없습니다:', { selectedCustomerId: selectedCustomerId.value, selectedProductId: selectedProductId.value })
        return false
      }

      const storeId = authStore.currentStoreId
      const roomId = currentRoom.value?.id
      const product = selectedProduct.value

      if (!product || !storeId || !roomId) {
        console.warn('필수 데이터가 없습니다:', { product, storeId, roomId })
        return false
      }

      const orderId = `${roomId}_${selectedCustomerId.value}`
      console.log('[addToCart] orderId 생성:', orderId)

      const itemData = {
        productId: product.productId || product.id,
        variantId: product.variantId || product.id,
        productName: product.name,
        productOption: product.option || '',
        price: product.price || 0,
        quantity: quantityDraft.value
      }

      console.log('장바구니 추가 데이터:', itemData)
      await liveService.addItemToOrder(storeId, orderId, itemData)

      // 수량 초기화
      quantityDraft.value = 1
      
      return true
    } catch (error) {
      console.error('장바구니 추가 실패:', error)
      return false
    }
  }

  const removeFromCart = async (customerId, productId) => {
    try {
      const storeId = authStore.currentStoreId
      const roomId = currentRoom.value?.id
      const orderId = `${roomId}_${customerId}`

      await liveService.removeItemFromOrder(storeId, orderId, productId)
    } catch (error) {
      console.error('장바구니 삭제 실패:', error)
    }
  }

  const updateCartItemQty = async (customerId, productId, qty) => {
    try {
      const storeId = authStore.currentStoreId
      const roomId = currentRoom.value?.id
      const orderId = `${roomId}_${customerId}`

      await liveService.updateItemQuantity(storeId, orderId, productId, qty)
    } catch (error) {
      console.error('수량 업데이트 실패:', error)
    }
  }

  const getCustomerTotal = (customerId) => {
    const order = orders.value.find(o => o.customerId === customerId)
    return order?.total || 0
  }

  // 확정고객 수동 추가 (확정 버튼을 위한 함수)
  const addConfirmedCustomer = (customerId) => {
    if (customerId && !manualConfirmedCustomers.value.has(customerId)) {
      manualConfirmedCustomers.value.add(customerId)
      console.log('[addConfirmedCustomer] 확정고객 추가:', customerId)
    }
  }

  // ===== 정산서 관련 액션 =====
  const setSettlementTemplate = (template) => {
    settlementTemplate.value = template
  }

  const generateSettlement = async (customerId) => {
    try {
      console.log('[generateSettlement] 정산서 생성 시작:', customerId)
      
      const storeId = authStore.currentStoreId
      const roomId = currentRoom.value?.id
      const orderId = `${roomId}_${customerId}`

      console.log('[generateSettlement] orderId:', orderId)
      
      const items = await liveService.getOrderItems(storeId, orderId)
      console.log('[generateSettlement] 조회된 아이템:', items)
      
      if (!items || items.length === 0) {
        return '장바구니가 비어있습니다.'
      }

      // 상품 목록 생성
      const itemsList = items.map(item => 
        `${item.productName || item.productName} ${item.productOption ? `(${item.productOption})` : ''} ${item.qty}개 ${(item.price || 0).toLocaleString()}원`
      )

      // 소계 계산
      const subtotal = items.reduce((sum, item) => sum + (item.subtotal || item.price * item.qty || 0), 0)
      
      // 배송비 계산
      const shippingFee = subtotal > 0 && subtotal < 100000 ? 3500 : 0
      
      // 배송비가 있으면 항목에 추가
      if (shippingFee > 0) {
        itemsList.push(`배송비 ${shippingFee.toLocaleString()}원`)
      }

      const itemsText = itemsList.join('\n')

      // 총액 계산 (소계 + 배송비)
      const total = subtotal + shippingFee

      // 정산서 생성
      const settlement = `정산서
${customerId}님

${itemsText}

합계: ${total.toLocaleString()}원`

      console.log('[generateSettlement] 생성된 정산서:', settlement)

      // Firestore에 정산서 저장
      await liveService.createSettlement(storeId, {
        orderId,
        roomId,
        customerId,
        content: settlement,
        total,
      }, authStore.user.uid)

      return settlement
    } catch (error) {
      console.error('정산서 생성 실패:', error)
      return '정산서 생성 중 오류가 발생했습니다.'
    }
  }

  // ===== 실시간 구독 =====
  const subscribeToOrders = (roomId) => {
    const storeId = authStore.currentStoreId
    if (!storeId) return

    // 기존 구독 해제
    if (unsubscribeOrders) {
      unsubscribeOrders()
    }

    unsubscribeOrders = liveService.subscribeToOrders(storeId, roomId, (fetchedOrders) => {
      orders.value = fetchedOrders
    })
  }

  const subscribeToOrderItems = (orderId) => {
    const storeId = authStore.currentStoreId
    if (!storeId) return

    // 기존 구독 해제
    if (unsubscribeOrderItems) {
      unsubscribeOrderItems()
    }

    unsubscribeOrderItems = liveService.subscribeToOrderItems(storeId, orderId, (items) => {
      currentOrderItems.value = items
    })
  }

  const unsubscribeAll = () => {
    if (unsubscribeOrders) {
      unsubscribeOrders()
      unsubscribeOrders = null
    }
    if (unsubscribeOrderItems) {
      unsubscribeOrderItems()
      unsubscribeOrderItems = null
    }
  }

  return {
    // State
    rooms,
    currentRoom,
    products,
    selectedProductId,
    selectedCustomerId,
    quantityDraft,
    orders,
    currentOrderItems,
    productSearchKeyword,
    settlementTemplate,
    
    // Getters
    selectedProduct,
    filteredProducts,
    confirmedCustomers,
    currentCart,
    currentCartSubtotal,
    currentCartShippingFee,
    currentCartTotal,
    
    // Actions
    loadRooms,
    createRoom,
    loadRoom,
    updateRoomStatus,
    loadProducts,
    loadProductsFromStore,
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
    addConfirmedCustomer,
    setSettlementTemplate,
    setSettlementTemplate,
    generateSettlement,
    unsubscribeAll,
  }
})
