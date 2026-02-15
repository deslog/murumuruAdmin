export const showToast = (message, duration = 3000) => {
  // 기존 토스트 제거
  const existingToast = document.querySelector('.toast-message')
  if (existingToast) {
    existingToast.remove()
  }

  // 토스트 생성
  const toast = document.createElement('div')
  toast.className = 'toast-message'
  toast.textContent = message
  document.body.appendChild(toast)

  // 애니메이션을 위해 약간의 지연 후 show 클래스 추가
  setTimeout(() => {
    toast.classList.add('show')
  }, 10)

  // 지정된 시간 후 제거
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => {
      toast.remove()
    }, 300) // 페이드아웃 애니메이션 시간
  }, duration)
}
