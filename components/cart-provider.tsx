'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type CartItem = {
  variantId: string
  productSlug: string
  name: string
  imageUrl: string
  colorName: string
  sizeName: string
  unitPrice: number
  quantity: number
  maxQuantity: number
}

type CartContextValue = {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: CartItem) => void
  updateQuantity: (variantId: string, quantity: number) => void
  removeItem: (variantId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const MAX_PER_ITEM = 20

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const limit = Math.min(item.maxQuantity, MAX_PER_ITEM)
      const existing = prev.find((i) => i.variantId === item.variantId)
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: Math.min(i.quantity + item.quantity, limit) } : i,
        )
      }
      return [...prev, { ...item, quantity: Math.min(item.quantity, limit) }]
    })
  }, [])

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.variantId === variantId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity, MAX_PER_ITEM)) }
          : i,
      ),
    )
  }, [])

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
      addItem,
      updateQuantity,
      removeItem,
      clear,
    }),
    [items, addItem, updateQuantity, removeItem, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
