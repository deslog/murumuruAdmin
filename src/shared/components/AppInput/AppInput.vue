<template>
  <div class="app-input">
    <label v-if="label" :for="inputId" class="app-input__label">
      {{ label }}
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="app-input__field"
      @input="handleInput"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.app-input__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.app-input__field {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  outline: none;
  transition: border-color 0.2s;
}

.app-input__field:focus {
  border-color: var(--color-primary);
}

.app-input__field:disabled {
  background-color: var(--bg-secondary);
  cursor: not-allowed;
}
</style>
