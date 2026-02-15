<template>
  <div class="products-page">
    <header class="page-header">
      <h1>상품관리</h1>
    </header>
    <div class="page-content">
      <p>상품관리 페이지입니다.</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.products-page {
  padding: var(--spacing-xl);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.page-content {
  background: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}
</style>
