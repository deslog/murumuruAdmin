import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/app/config/firebase'

/**
 * 실시간 업데이트를 위한 구독 서비스
 */
export const realtimeService = {
  // 도매주문 실시간 구독
  subscribeToPurchaseOrders(storeId, filters = {}, callback) {
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
    
    const ordersRef = collection(db, 'stores', storeId, 'purchaseOrders')
    const q = query(ordersRef, ...constraints)
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback(orders)
    }, (error) => {
      console.error('실시간 업데이트 오류:', error)
    })
  },

  // 라이브 방송 방 목록 실시간 구독
  subscribeToLiveRooms(storeId, callback) {
    const roomsRef = collection(db, 'stores', storeId, 'liveRooms')
    const q = query(roomsRef, orderBy('createdAt', 'desc'))
    
    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback(rooms)
    }, (error) => {
      console.error('실시간 업데이트 오류:', error)
    })
  },

  // 배송 그룹 실시간 구독
  subscribeToShipments(storeId, statusFilter = null, callback) {
    const shipmentsRef = collection(db, 'stores', storeId, 'shipments')
    const constraints = []
    
    if (statusFilter) {
      constraints.push(where('status', '==', statusFilter))
    }
    
    constraints.push(orderBy('requestedAt', 'desc'))
    
    const q = query(shipmentsRef, ...constraints)
    
    return onSnapshot(q, (snapshot) => {
      const shipments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback(shipments)
    }, (error) => {
      console.error('실시간 업데이트 오류:', error)
    })
  },
}
