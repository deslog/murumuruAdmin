export const formatPrice = (price) => {
  if (price == null) return '0'
  return new Intl.NumberFormat('ko-KR').format(price)
}

export const formatDate = (date) => {
  if (!date) return '-'
  
  // Firestore Timestamp 처리
  if (date && typeof date.toDate === 'function') {
    return new Intl.DateTimeFormat('ko-KR').format(date.toDate())
  }
  
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return '-'
  
  return new Intl.DateTimeFormat('ko-KR').format(parsed)
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  
  // Firestore Timestamp 처리
  let parsed
  if (date && typeof date.toDate === 'function') {
    parsed = date.toDate()
  } else {
    parsed = new Date(date)
  }
  
  if (isNaN(parsed.getTime())) return '-'
  
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}
