import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/app/config/firebase'

/**
 * Firestore 기본 CRUD 유틸리티
 */
export const firestoreService = {
  // 스토어별 컬렉션 참조 생성
  getStoreCollection(storeId, collectionName) {
    return collection(db, 'stores', storeId, collectionName)
  },

  // 문서 조회
  async getDoc(storeId, collectionName, docId) {
    const docRef = doc(db, 'stores', storeId, collectionName, docId)
    const snapshot = await getDoc(docRef)
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  },

  // 컬렉션 전체 조회
  async getCollection(storeId, collectionName, constraints = []) {
    const collectionRef = this.getStoreCollection(storeId, collectionName)
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  // 문서 추가
  async addDoc(storeId, collectionName, data) {
    const collectionRef = this.getStoreCollection(storeId, collectionName)
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  },

  // 문서 업데이트
  async updateDoc(storeId, collectionName, docId, data) {
    const docRef = doc(db, 'stores', storeId, collectionName, docId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  },

  // 문서 삭제
  async deleteDoc(storeId, collectionName, docId) {
    const docRef = doc(db, 'stores', storeId, collectionName, docId)
    await deleteDoc(docRef)
  },

  // 서브컬렉션 조회
  async getSubCollection(storeId, parentCollection, parentId, subCollection) {
    const collectionRef = collection(db, 'stores', storeId, parentCollection, parentId, subCollection)
    const snapshot = await getDocs(collectionRef)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  // 서브컬렉션에 문서 추가
  async addSubDoc(storeId, parentCollection, parentId, subCollection, data) {
    const collectionRef = collection(db, 'stores', storeId, parentCollection, parentId, subCollection)
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  },

  // 타임스탬프 생성
  timestamp() {
    return serverTimestamp()
  },
}

// Query 제약 조건 헬퍼
export { where, orderBy }
