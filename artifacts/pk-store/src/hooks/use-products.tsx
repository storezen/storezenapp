import { useState, useEffect } from 'react';
import { getProducts, UPDATE_EVENT_NAME } from '../lib/products-store';
import type { Product } from '../data/products';

export function useProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(() => getProducts());

  useEffect(() => {
    const handler = () => setProducts(getProducts());
    window.addEventListener(UPDATE_EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(UPDATE_EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return products;
}
