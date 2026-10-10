const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function formatPrice(value: number) {
  return vnd.format(value)
}

export const FREE_SHIPPING_THRESHOLD = 1000000
export const SHIPPING_FEE = 30000
