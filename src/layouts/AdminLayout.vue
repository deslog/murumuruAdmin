<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">
        <h1>Murumuru Admin</h1>
      </div>
      <nav class="nav-menu">
        <router-link to="/wholesale-orders" class="nav-item">
          도매주문현황
        </router-link>
        <router-link to="/products" class="nav-item">
          상품관리
        </router-link>
        <router-link to="/live-commerce" class="nav-item">
          라이브커머스
        </router-link>
        <router-link to="/settlement-template" class="nav-item sub-item">
          ∟ 정산서형태
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 240px;
  background: var(--bg-dark);
  color: white;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: var(--spacing-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h1 {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.nav-menu {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-item {
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  transition: background-color 0.2s;
  text-decoration: none;
  color: white;
  display: block;
  cursor: pointer;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-active {
  background-color: var(--color-primary);
}

.nav-item.sub-item {
  padding-left: calc(var(--spacing-md) + var(--spacing-lg));
  font-size: var(--font-size-sm);
}

.main-content {
  flex: 1;
  overflow: auto;
  background: var(--bg-secondary);
}
</style>
