import { useState, useEffect, useCallback } from 'react';
import { Product } from '../data/products';
import { useStore } from './use-store';

export type CartItem = {
  product: Product;
  variant?: { size?: string; color?: string; optionName?: string; optionPrice?: number };
  quantity: number;
};

export function useCart() {
  const { storeSlug } = useStore();
  const storageKey = `${storeSlug}_cart`;
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setItems(saved ? JSON.parse(saved) : []);
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  const addToCart = useCallback((item: CartItem) => {
    setItems(prev => [...prev, item]);
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartTotal = items.reduce((total, item) => {
    const price = item.variant?.optionPrice ?? item.product.price;
    return total + price * item.quantity;
  }, 0);

  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  return { items, addToCart, removeFromCart, clearCart, cartTotal, cartCount };
}
