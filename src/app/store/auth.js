import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/app/config/firebase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const currentStoreId = ref(null)
  const currentStoreName = ref(null)
  const isLoading = ref(true)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const hasStore = computed(() => !!currentStoreId.value)

  // Actions
  function setUser(userData) {
    user.value = userData
  }

  function setCurrentStore(storeId, storeName) {
    currentStoreId.value = storeId
    currentStoreName.value = storeName
    // localStorage에 저장 (새로고침 시 유지)
    if (storeId) {
      localStorage.setItem('currentStoreId', storeId)
      localStorage.setItem('currentStoreName', storeName)
    } else {
      localStorage.removeItem('currentStoreId')
      localStorage.removeItem('currentStoreName')
    }
  }

  function loadStoreFromLocalStorage() {
    const storeId = localStorage.getItem('currentStoreId')
    const storeName = localStorage.getItem('currentStoreName')
    if (storeId && storeName) {
      currentStoreId.value = storeId
      currentStoreName.value = storeName
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      user.value = null
      currentStoreId.value = null
      currentStoreName.value = null
      localStorage.removeItem('currentStoreId')
      localStorage.removeItem('currentStoreName')
    } catch (error) {
      console.error('로그아웃 실패:', error)
      throw error
    }
  }

  function initAuth() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          user.value = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          }
          loadStoreFromLocalStorage()
        } else {
          user.value = null
          currentStoreId.value = null
          currentStoreName.value = null
        }
        isLoading.value = false
        resolve(firebaseUser)
      })
    })
  }

  return {
    // State
    user,
    currentStoreId,
    currentStoreName,
    isLoading,
    // Getters
    isAuthenticated,
    hasStore,
    // Actions
    setUser,
    setCurrentStore,
    logout,
    initAuth,
  }
})
