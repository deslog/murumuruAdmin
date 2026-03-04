import { firestoreService, where, orderBy } from './firestore.service'

/**
 * 도매주문 관련 Firestore 서비스
 */
export const purchaseOrderService = {
  // 도매주문 목록 조회
  async getPurchaseOrders(storeId, filters = {}) {
    const constraints = []
    
    if (filters.status) {
      constraints.push(where('status', '==', filters.status))
    }
    if (filters.vendorId) {
      constraints.push(where('vendorId', '==', filters.vendorId))
    }
    if (filters.makerId) {
      constraints.push(where('makerId', '==', filters.makerId))
    }
    
    constraints.push(orderBy('createdAt', 'desc'))
    
    return await firestoreService.getCollection(storeId, 'purchaseOrders', constraints)
  },

  // 도매주문 단일 조회
  async getPurchaseOrder(storeId, orderId) {
    return await firestoreService.getDoc(storeId, 'purchaseOrders', orderId)
  },

  // 도매주문 생성
  async createPurchaseOrder(storeId, orderData, userId) {
    const data = {
      ...orderData,
      status: 'pending',
      finalUnitCost: orderData.unitCostPrice,
      profit: 0,
      shipmentId: null,
      createdBy: userId,
    }
    return await firestoreService.addDoc(storeId, 'purchaseOrders', data)
  },

  // 도매주문 업데이트
  async updatePurchaseOrder(storeId, orderId, updates) {
    return await firestoreService.updateDoc(storeId, 'purchaseOrders', orderId, updates)
  },

  // 도매주문 삭제
  async deletePurchaseOrder(storeId, orderId) {
    return await firestoreService.deleteDoc(storeId, 'purchaseOrders', orderId)
  },

  // 배송 그룹 생성
  async createShipment(storeId, shipmentData, userId) {
    const data = {
      ...shipmentData,
      status: 'shipping',
      requestedBy: userId,
      requestedAt: firestoreService.timestamp(),
      completedAt: null,
    }
    return await firestoreService.addDoc(storeId, 'shipments', data)
  },

  // 배송 완료 처리
  async completeShipment(storeId, shipmentId) {
    return await firestoreService.updateDoc(storeId, 'shipments', shipmentId, {
      status: 'completed',
      completedAt: firestoreService.timestamp(),
    })
  },

  // 배송비 계산 및 주문 업데이트
  async updateOrdersWithShipping(storeId, orderIds, shipmentId, costPerUnit) {
    const promises = orderIds.map(async (orderId) => {
      const order = await this.getPurchaseOrder(storeId, orderId)
      const finalUnitCost = order.unitCostPrice + costPerUnit
      const profit = (order.sellingPrice - finalUnitCost) * order.quantity
      
      return this.updatePurchaseOrder(storeId, orderId, {
        finalUnitCost,
        profit,
        status: 'shipping',
        shipmentId,
      })
    })
    
    return await Promise.all(promises)
  },
}

/**
 * 상품 관련 Firestore 서비스
 */
export const productService = {
  // 상품 목록 조회
  async getProducts(storeId, filters = {}) {
    const constraints = []
    
    if (filters.makerId) {
      constraints.push(where('makerId', '==', filters.makerId))
    }
    // 인덱스 에러 방지: isActive 필터와 orderBy 동시 사용 금지
    if (filters.isActive !== undefined && !filters.makerId) {
      constraints.push(where('isActive', '==', filters.isActive))
    } else if (constraints.length === 0) {
      // 필터가 없으면 orderBy만 사용
      constraints.push(orderBy('createdAt', 'desc'))
    }
    
    const products = await firestoreService.getCollection(storeId, 'products', constraints)
    
    // 클라이언트에서 isActive 필터링 (필요한 경우)
    if (filters.isActive !== undefined && filters.makerId) {
      return products.filter(p => p.isActive === filters.isActive)
    }
    
    return products
  },

  // 상품 variants 조회
  async getProductVariants(storeId, productId) {
    return await firestoreService.getSubCollection(storeId, 'products', productId, 'variants')
  },

  // 상품 생성
  async createProduct(storeId, productData) {
    return await firestoreService.addDoc(storeId, 'products', productData)
  },

  // variant 추가
  async addVariant(storeId, productId, variantData) {
    return await firestoreService.addSubDoc(storeId, 'products', productId, 'variants', variantData)
  },
}

/**
 * Vendor/Maker 관련 서비스
 */
export const vendorService = {
  async getVendors(storeId) {
    return await firestoreService.getCollection(storeId, 'vendors', [
      where('isActive', '==', true),
      orderBy('name', 'asc'),
    ])
  },

  async createVendor(storeId, vendorData) {
    return await firestoreService.addDoc(storeId, 'vendors', {
      ...vendorData,
      isActive: true,
    })
  },
}

export const makerService = {
  async getMakers(storeId) {
    return await firestoreService.getCollection(storeId, 'makers', [
      where('isActive', '==', true),
      orderBy('name', 'asc'),
    ])
  },

  async createMaker(storeId, makerData) {
    return await firestoreService.addDoc(storeId, 'makers', {
      ...makerData,
      isActive: true,
    })
  },
}
