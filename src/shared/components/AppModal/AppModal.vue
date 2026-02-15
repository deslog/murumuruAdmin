<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="app-modal-overlay" @click="handleOverlayClick">
        <div class="app-modal" @click.stop>
          <div class="app-modal__header">
            <h3 class="app-modal__title">{{ title }}</h3>
            <button class="app-modal__close" @click="handleClose">×</button>
          </div>
          <div class="app-modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="app-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  closeOnOverlay: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'close'])

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleClose()
  }
}
</script>

<style scoped>
.app-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.app-modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  min-width: 400px;
}

.app-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.app-modal__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.app-modal__close {
  font-size: var(--font-size-2xl);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
  background: none;
  border: none;
  padding: 0;
  width: 32px;
  height: 32px;
}

.app-modal__close:hover {
  color: var(--text-primary);
}

.app-modal__body {
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.app-modal__footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
