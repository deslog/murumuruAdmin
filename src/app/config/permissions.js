export const Permission = {
  WHOLESALE_ORDERS_VIEW: 'wholesale-orders:view',
  WHOLESALE_ORDERS_EDIT: 'wholesale-orders:edit',
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_EDIT: 'products:edit',
  LIVE_COMMERCE_VIEW: 'live-commerce:view',
  LIVE_COMMERCE_MANAGE: 'live-commerce:manage',
}

export const checkPermission = (permission) => {
  // TODO: 실제 권한 체크 로직 구현
  return true
}
