export const adminRoutes = [
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/wholesale-orders',
      },
      {
        path: 'wholesale-orders',
        name: 'WholesaleOrders',
        component: () => import('@/pages/WholesaleOrders/WholesaleOrdersPage.vue'),
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/pages/Products/ProductsPage.vue'),
      },
      {
        path: 'live-commerce',
        name: 'LiveCommerce',
        component: () => import('@/pages/LiveCommerce/LiveCommercePage.vue'),
      },
      {
        path: 'live-commerce/:roomId',
        name: 'LiveRoom',
        component: () => import('@/pages/LiveCommerce/LiveRoomPage.vue'),
      },
    ],
  },
]
