<template>
  <div class="app-table">
    <table>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in data" :key="index">
          <td v-for="column in columns" :key="column.key">
            <slot :name="`cell-${column.key}`" :row="row">
              {{ row[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    required: true,
  },
  data: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.app-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-primary);
}

thead {
  background: var(--bg-secondary);
}

th {
  padding: var(--spacing-md);
  text-align: left;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
}

td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

tr:hover {
  background-color: var(--bg-secondary);
}
</style>
