<template>
  <div class="wholesale-orders-page">
    <header class="page-header">
      <h1>도매주문현황</h1>
    </header>
    <div class="page-content">
      <p>도매주문현황 페이지입니다.</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.wholesale-orders-page {
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
