<template>
  <button :class="['app-button', `app-button--${variant}`, { 'app-button--disabled': disabled }]" :disabled="disabled" @click="handleClick">
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'success'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.app-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.app-button--primary {
  background-color: var(--color-primary);
  color: white;
}

.app-button--primary:hover:not(.app-button--disabled) {
  background-color: var(--color-primary-dark);
}

.app-button--secondary {
  background-color: var(--color-secondary);
  color: white;
}

.app-button--danger {
  background-color: var(--color-danger);
  color: white;
}

.app-button--success {
  background-color: var(--color-success);
  color: white;
}

.app-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
