<template>
  <div class="settlement-template-page">
    <header class="page-header">
      <h1>정산서 형태</h1>
      <button class="save-button" @click="handleSave">저장</button>
    </header>
    <div class="page-content">
      <div class="template-editor">
        <label class="label">정산서 템플릿</label>
        <p class="hint">
          변수: {customerName}, {items}, {totalAmount}
        </p>
        <textarea
          v-model="templateText"
          class="template-textarea"
          placeholder="예:&#10;{customerName} 고객님의 정산서&#10;{items}&#10;총금액: {totalAmount}원&#10;입니다."
        ></textarea>
      </div>
      
      <div class="preview-section">
        <h2>미리보기</h2>
        <div class="preview-box">
          <pre>{{ previewText }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLiveStore } from '@/features/live/store'

const liveStore = useLiveStore()
const templateText = ref('')

const previewText = computed(() => {
  let preview = templateText.value
  preview = preview.replace('{customerName}', '홍길동')
  preview = preview.replace('{items}', '헬로키티 롱다리키링 (핑크) 2개 10,000원\n쿠로미 키링세트 (블랙) 1개 12,900원')
  preview = preview.replace('{totalAmount}', '22,900')
  return preview || '템플릿을 입력해주세요.'
})

const handleSave = () => {
  liveStore.setSettlementTemplate(templateText.value)
  alert('정산서 템플릿이 저장되었습니다.')
}

onMounted(() => {
  templateText.value = liveStore.settlementTemplate || `{customerName} 고객님의 정산서
{items}
총금액: {totalAmount}원
입니다.`
})
</script>

<style scoped>
.settlement-template-page {
  padding: var(--spacing-xl);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.save-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.save-button:hover {
  opacity: 0.9;
}

.page-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  overflow: auto;
}

.template-editor {
  display: flex;
  flex-direction: column;
}

.label {
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.template-textarea {
  flex: 1;
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-family: monospace;
  font-size: var(--font-size-base);
  resize: none;
  min-height: 400px;
}

.template-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.preview-section {
  display: flex;
  flex-direction: column;
}

.preview-section h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.preview-box {
  flex: 1;
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  overflow: auto;
}

.preview-box pre {
  margin: 0;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--text-primary);
  line-height: 1.6;
}
</style>
