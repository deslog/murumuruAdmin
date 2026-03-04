<template>
  <div class="products-page">
    <header class="page-header">
      <h1>상품관리</h1>
      <div class="header-actions">
        <button @click="showAddModal = true" class="add-button">신규 상품 등록</button>
      </div>
    </header>

    <!-- 메이커별 카테고리 필터 -->
    <div class="filters">
      <div class="filter-group">
        <label>메이커별 필터:</label>
        <select v-model="selectedMaker" class="filter-select">
          <option value="">전체 메이커</option>
          <option v-for="maker in makers" :key="maker" :value="maker">
            {{ maker }}
          </option>
        </select>
      </div>
    </div>

    <!-- 상품 목록 테이블 -->
    <div class="page-content">
      <div v-if="loading" class="loading">상품 목록을 불러오는 중...</div>
      
      <table v-if="!loading" class="products-table">
        <thead>
          <tr>
            <th>메이커</th>
            <th>제품명</th>
            <th>옵션</th>
            <th>수량</th>
            <th>최종원가</th>
            <th>판매가</th>
            <th>출처</th>
            <th>등록일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id">
            <td>{{ product.makerName }}</td>
            <td>{{ product.productName }}</td>
            <td>{{ product.variantOption || '-' }}</td>
            <td>{{ product.quantity }}</td>
            <td>{{ formatPrice(product.finalUnitCost) }}원</td>
            <td class="selling-price">{{ formatPrice(product.sellingPrice) }}원</td>
            <td>
              <span class="source-badge" :class="product.source">
                {{ product.source === 'wholesale' ? '도매유입' : '직접등록' }}
              </span>
            </td>
            <td>{{ formatDate(product.createdAt) }}</td>
            <td>
              <button @click="editProduct(product)" class="edit-btn">수정</button>
              <button @click="deleteProduct(product.id)" class="delete-btn">삭제</button>
            </td>
          </tr>
          
          <!-- 빈 상태 표시 -->
          <tr v-if="filteredProducts.length === 0">
            <td colspan="9" class="empty-row">
              등록된 상품이 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 상품 추가/수정 모달 -->
    <div v-if="showAddModal || editingProduct" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editingProduct ? '상품 수정' : '신규 상품 등록' }}</h2>
        <form @submit.prevent="saveProduct">
          <div class="form-group">
            <label>메이커</label>
            <input v-model="productForm.makerName" type="text" required />
          </div>
          <div class="form-group">
            <label>제품명</label>
            <input v-model="productForm.productName" type="text" required />
          </div>
          <div class="form-group">
            <label>옵션 (선택사항)</label>
            <div class="options-input">
              <div v-for="(option, index) in productForm.variantOptions" :key="index" class="option-row">
                <input v-model="productForm.variantOptions[index]" type="text" placeholder="예: 블랙, 핑크, 노랑" />
                <button type="button" @click="removeOption(index)" class="remove-option-btn" v-if="productForm.variantOptions.length > 1">×</button>
              </div>
              <button type="button" @click="addOption" class="add-option-btn">+ 옵션 추가</button>
            </div>
          </div>
          <div class="form-group">
            <label>수량</label>
            <input v-model.number="productForm.quantity" type="number" min="1" required />
          </div>
          <div class="form-group">
            <label>최종원가</label>
            <input v-model.number="productForm.finalUnitCost" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label>판매가</label>
            <input v-model.number="productForm.sellingPrice" type="number" min="0" required />
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">취소</button>
            <button type="submit" class="save-btn">저장</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/app/store/auth'
import { db } from '@/app/config/firebase'
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { formatPrice, formatDate } from '@/shared/utils/format'
import { showToast } from '@/shared/utils/toast'

const authStore = useAuthStore()

const products = ref([])
const loading = ref(true)
const selectedMaker = ref('')
const showAddModal = ref(false)
const editingProduct = ref(null)

const productForm = ref({
  makerName: '',
  productName: '',
  variantOptions: [''],
  quantity: 1,
  finalUnitCost: 0,
  sellingPrice: 0
})

// 메이커 목록 (중복 제거)
const makers = computed(() => {
  const makerSet = new Set(products.value.map(p => p.makerName))
  return Array.from(makerSet).sort()
})

// 필터링된 상품 목록
const filteredProducts = computed(() => {
  if (!selectedMaker.value) return products.value
  return products.value.filter(p => p.makerName === selectedMaker.value)
})

// 실시간 상품 목록 로드
let unsubscribeProducts = null

const loadProducts = async () => {
  if (unsubscribeProducts) {
    unsubscribeProducts()
  }
  
  const storeId = authStore.currentStoreId
  if (!storeId) {
    loading.value = false
    return
  }

  try {
    const productsRef = collection(db, 'stores', storeId, 'products')
    const q = query(productsRef, orderBy('createdAt', 'desc'))
    
    unsubscribeProducts = onSnapshot(q, (snapshot) => {
      products.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      loading.value = false
    })
    
  } catch (error) {
    console.error('상품 목록 로드 실패:', error)
    loading.value = false
  }
}

// 옵션 추가/제거 함수
const addOption = () => {
  productForm.value.variantOptions.push('')
}

const removeOption = (index) => {
  productForm.value.variantOptions.splice(index, 1)
}

// 상품 저장 (다중 옵션 처리)
const saveProduct = async () => {
  try {
    const storeId = authStore.currentStoreId
    
    if (editingProduct.value) {
      // 수정 모드 - 기존 로직 유지
      const productData = {
        makerName: productForm.value.makerName,
        productName: productForm.value.productName,
        variantOption: productForm.value.variantOptions[0] || '',
        quantity: productForm.value.quantity,
        finalUnitCost: productForm.value.finalUnitCost,
        sellingPrice: productForm.value.sellingPrice,
        source: 'manual',
        updatedAt: serverTimestamp()
      }
      
      const productRef = doc(db, 'stores', storeId, 'products', editingProduct.value.id)
      await updateDoc(productRef, productData)
      showToast('상품이 수정되었습니다.', 'success')
    } else {
      // 신규 등록 - 다중 옵션 처리
      const validOptions = productForm.value.variantOptions.filter(option => option.trim() !== '')
      
      if (validOptions.length === 0) {
        // 옵션이 없는 경우 한 개의 상품만 등록
        const productData = {
          makerName: productForm.value.makerName,
          productName: productForm.value.productName,
          variantOption: '',
          quantity: productForm.value.quantity,
          finalUnitCost: productForm.value.finalUnitCost,
          sellingPrice: productForm.value.sellingPrice,
          source: 'manual',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        
        await addDoc(collection(db, 'stores', storeId, 'products'), productData)
      } else {
        // 각 옵션별로 별도 상품 등록
        const promises = validOptions.map(option => {
          const productData = {
            makerName: productForm.value.makerName,
            productName: productForm.value.productName,
            variantOption: option.trim(),
            quantity: productForm.value.quantity,
            finalUnitCost: productForm.value.finalUnitCost,
            sellingPrice: productForm.value.sellingPrice,
            source: 'manual',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
          
          return addDoc(collection(db, 'stores', storeId, 'products'), productData)
        })
        
        await Promise.all(promises)
      }
      
      showToast(`상품이 등록되었습니다. (총 ${validOptions.length || 1}개)`, 'success')
    }
    
    closeModal()
    
  } catch (error) {
    console.error('상품 저장 실패:', error)
    showToast('상품 저장에 실패했습니다.', 'error')
  }
}

// 상품 수정
const editProduct = (product) => {
  editingProduct.value = product
  productForm.value = {
    makerName: product.makerName,
    productName: product.productName,
    variantOptions: product.variantOption ? [product.variantOption] : [''],
    quantity: product.quantity,
    finalUnitCost: product.finalUnitCost,
    sellingPrice: product.sellingPrice
  }
}

// 상품 삭제
const deleteProduct = async (productId) => {
  if (!confirm('이 상품을 삭제하시겠습니까?')) return
  
  try {
    const storeId = authStore.currentStoreId
    await deleteDoc(doc(db, 'stores', storeId, 'products', productId))
    showToast('상품이 삭제되었습니다.', 'success')
  } catch (error) {
    console.error('상품 삭제 실패:', error)
    showToast('상품 삭제에 실패했습니다.', 'error')
  }
}

// 모달 닫기
const closeModal = () => {
  showAddModal.value = false
  editingProduct.value = null
  productForm.value = {
    makerName: '',
    productName: '',
    variantOptions: [''],
    quantity: 1,
    finalUnitCost: 0,
    sellingPrice: 0
  }
}

watch(() => authStore.currentStoreId, (newStoreId) => {
  if (newStoreId) {
    loadProducts()
  }
})

onMounted(() => {
  if (authStore.currentStoreId) {
    loadProducts()
  }
})
</script>

<style scoped>
.products-page {
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

.add-button {
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.add-button:hover {
  opacity: 0.9;
}

.filters {
  margin-bottom: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-md);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: white;
}

.page-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th,
.products-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.products-table th {
  background: #f9fafb;
  font-weight: 600;
  color: var(--text-secondary);
}

.selling-price {
  font-weight: 600;
  color: var(--color-primary);
}

.source-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.source-badge.wholesale {
  background: #dbeafe;
  color: #1e40af;
}

.source-badge.manual {
  background: #f3e8ff;
  color: #7c3aed;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 4px;
}

.edit-btn {
  background: #f59e0b;
  color: white;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.empty-row {
  text-align: center;
  padding: 40px;
  color: var(--text-light);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
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
  max-height: 80vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 var(--spacing-lg);
  font-size: var(--font-size-xl);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
}

.options-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-row input {
  flex: 1;
}

.remove-option-btn {
  width: 32px;
  height: 32px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-option-btn {
  padding: 8px 12px;
  background: #f3f4f6;
  color: #374151;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.add-option-btn:hover {
  background: #e5e7eb;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn {
  background: #e5e7eb;
  color: #374151;
}

.save-btn {
  background: var(--color-primary);
  color: white;
}
</style>
