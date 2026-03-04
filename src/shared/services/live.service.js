import { firestoreService, where, orderBy } from './firestore.service'
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, setDoc } from 'firebase/firestore'
import { db } from '@/app/config/firebase'

/**
 * 라이브 방송 관련 Firestore 서비스
 */
export const liveService = {
  // 라이브 방송 방 목록 조회
  async getLiveRooms(storeId) {
    return await firestoreService.getCollection(storeId, 'liveRooms', [
      orderBy('createdAt', 'desc')
    ])
  },

  // 라이브 방송 방 단일 조회
  async getLiveRoom(storeId, roomId) {
    return await firestoreService.getDoc(storeId, 'liveRooms', roomId)
  },

  // 라이브 방송 방 생성
  async createLiveRoom(storeId, roomData, userId) {
    const data = {
      ...roomData,
      status: 'active',
      startedAt: firestoreService.timestamp(),
      endedAt: null,
      createdBy: userId,
    }
    return await firestoreService.addDoc(storeId, 'liveRooms', data)
  },

  // 라이브 방송 상태 업데이트
  async updateRoomStatus(storeId, roomId, status) {
    const updates = { status }
    if (status === 'ended') {
      updates.endedAt = firestoreService.timestamp()
    }
    
    const roomRef = doc(db, 'stores', storeId, 'liveRooms', roomId)
    await setDoc(roomRef, {
      ...updates,
      updatedAt: firestoreService.timestamp(),
    }, { merge: true })
  },

  // 주문/장바구니 조회 (특정 방)
  async getOrders(storeId, roomId, statusFilter = null) {
    const constraints = [where('roomId', '==', roomId)]
    if (statusFilter) {
      constraints.push(where('status', '==', statusFilter))
    }
    constraints.push(orderBy('createdAt', 'desc'))
    
    return await firestoreService.getCollection(storeId, 'orders', constraints)
  },

  // 주문 아이템 조회
  async getOrderItems(storeId, orderId) {
    return await firestoreService.getSubCollection(storeId, 'orders', orderId, 'items')
  },

  // 고객 선택 (주문 생성 또는 조회)
  async getOrCreateOrder(storeId, roomId, customerId, userId) {
    const orderId = `${roomId}_${customerId}`
    
    // 기존 주문 확인
    let order = await firestoreService.getDoc(storeId, 'orders', orderId)
    
    if (!order) {
      // 새 주문 생성 - setDoc 사용하여 안전하게 생성
      const orderRef = doc(db, 'stores', storeId, 'orders', orderId)
      await setDoc(orderRef, {
        id: orderId,
        roomId,
        customerId,
        status: 'cart',
        subtotal: 0,
        shippingFee: 0,
        total: 0,
        itemCount: 0,
        createdBy: userId,
        createdAt: firestoreService.timestamp(),
      })
      
      order = { id: orderId, roomId, customerId, status: 'cart', subtotal: 0, shippingFee: 0, total: 0, itemCount: 0 }
    }
    
    return order
  },

  // 장바구니에 상품 추가
  async addItemToOrder(storeId, orderId, itemData) {
    // undefined 값 검증
    if (!itemData.productId || !itemData.variantId) {
      console.error('addItemToOrder: productId 또는 variantId가 누락됨:', itemData)
      throw new Error('상품 ID가 누락되었습니다.')
    }
    
    const itemId = `${itemData.productId}_${itemData.variantId}`
    const itemRef = doc(db, 'stores', storeId, 'orders', orderId, 'items', itemId)
    
    // 기존 아이템 확인
    const existingItems = await firestoreService.getSubCollection(storeId, 'orders', orderId, 'items')
    const existingItem = existingItems.find(item => item.id === itemId)
    
    const safeItemData = {
      productId: itemData.productId,
      variantId: itemData.variantId,
      productName: itemData.productName || '',
      productOption: itemData.productOption || '',
      price: itemData.price || 0,
      quantity: itemData.quantity || 1
    }
    
    if (existingItem) {
      // 수량 증가 - setDoc을 merge 옵션과 함께 사용하여 안전하게 업데이트
      const newQty = existingItem.qty + (safeItemData.quantity || 1)
      const itemPrice = existingItem.price || safeItemData.price || 0
      console.log('[addItemToOrder] 기존 아이템 수량 증가:', { 기존수량: existingItem.qty, 추가수량: safeItemData.quantity, 새수량: newQty })
      await setDoc(itemRef, {
        qty: newQty,
        subtotal: newQty * itemPrice,
        updatedAt: firestoreService.timestamp(),
      }, { merge: true })
    } else {
      // 새 아이템 추가 - setDoc 사용 (문서가 없어도 생성됨)
      console.log('[addItemToOrder] 새 아이템 추가:', safeItemData)
      await setDoc(itemRef, {
        id: itemId,
        ...safeItemData,
        qty: safeItemData.quantity,
        subtotal: safeItemData.price * safeItemData.quantity,
        createdAt: firestoreService.timestamp(),
      })
    }
    
    // 주문 총액 재계산
    await this.recalculateOrderTotal(storeId, orderId)
  },

  // 장바구니 아이템 수량 업데이트
  async updateItemQuantity(storeId, orderId, itemId, qty) {
    const items = await firestoreService.getSubCollection(storeId, 'orders', orderId, 'items')
    const item = items.find(i => i.id === itemId)
    
    if (item) {
      const itemRef = doc(db, 'stores', storeId, 'orders', orderId, 'items', itemId)
      await setDoc(itemRef, {
        qty,
        subtotal: qty * item.price,
        updatedAt: firestoreService.timestamp(),
      }, { merge: true })
      
      await this.recalculateOrderTotal(storeId, orderId)
    }
  },

  // 장바구니 아이템 삭제
  async removeItemFromOrder(storeId, orderId, itemId) {
    const itemRef = doc(db, 'stores', storeId, 'orders', orderId, 'items', itemId)
    await deleteDoc(itemRef)
    
    await this.recalculateOrderTotal(storeId, orderId)
  },

  // 주문 총액 재계산
  async recalculateOrderTotal(storeId, orderId) {
    const items = await firestoreService.getSubCollection(storeId, 'orders', orderId, 'items')
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const itemCount = items.length
    
    // 배송비 계산 (10만원 미만 시 3500원)
    const shippingFee = subtotal < 100000 ? 3500 : 0
    const total = subtotal + shippingFee
    
    // setDoc with merge를 사용하여 주문 문서가 없어도 안전하게 처리
    const orderRef = doc(db, 'stores', storeId, 'orders', orderId)
    await setDoc(orderRef, {
      subtotal,
      shippingFee,
      total,
      itemCount,
      updatedAt: firestoreService.timestamp(),
    }, { merge: true })
  },

  // 주문 확정
  async confirmOrder(storeId, orderId) {
    const orderRef = doc(db, 'stores', storeId, 'orders', orderId)
    await setDoc(orderRef, {
      status: 'confirmed',
      confirmedAt: firestoreService.timestamp(),
    }, { merge: true })
  },

  // 정산서 생성
  async createSettlement(storeId, settlementData, userId) {
    return await firestoreService.addDoc(storeId, 'settlements', {
      ...settlementData,
      createdBy: userId,
    })
  },

  // 실시간 주문 목록 구독
  subscribeToOrders(storeId, roomId, callback) {
    const ordersRef = collection(db, 'stores', storeId, 'orders')
    // 인덱스 에러 해결: orderBy 제거
    const q = roomId 
      ? query(ordersRef, where('roomId', '==', roomId))
      : ordersRef
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // 클라이언트에서 정렬
      orders.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0)
        const bDate = b.createdAt?.toDate?.() || new Date(0)
        return bDate - aDate
      })
      callback(orders)
    })
  },

  // 실시간 주문 아이템 구독
  subscribeToOrderItems(storeId, orderId, callback) {
    const itemsRef = collection(db, 'stores', storeId, 'orders', orderId, 'items')
    
    return onSnapshot(itemsRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback(items)
    })
  },
}
