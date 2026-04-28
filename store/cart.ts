'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, CartState, Product } from '@/types'
import { getEffectivePrice } from '@/lib/utils'

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1) => {
        const { items } = get()
        const existing = items.find(item => item.product.id === product.id)
        const effectivePrice = getEffectivePrice(product)

        if (existing) {
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          })
        } else {
          set({ items: [...items, { product, quantity, effectivePrice }] })
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter(item => item.product.id !== productId) })
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
      },

      getDiscount: () => {
        return get().items.reduce((sum, item) => {
          const discount = item.product.price - item.effectivePrice
          return sum + discount * item.quantity
        }, 0)
      },

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.effectivePrice * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'prohygiene-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
