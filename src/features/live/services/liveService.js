import { env } from '@/app/config/env'

export const liveService = {
  async getProducts() {
    // TODO: 실제 API 호출로 교체
    const response = await fetch(`${env.apiUrl}/products`)
    return response.json()
  },

  async getCustomers() {
    // TODO: 실제 API 호출로 교체
    const response = await fetch(`${env.apiUrl}/customers`)
    return response.json()
  },
}
