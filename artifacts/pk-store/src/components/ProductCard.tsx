import React from 'react';
import { Link } from 'wouter';
import { Product } from '../data/products';
import { STORE_CONFIG } from '../config';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col bg-card border border-card-border rounded-xl overflow-hidden shadow-sm hover:shadow-md"
      data-testid={`card-product-${product.id}`}
    >
      <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-muted">
        {discount > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md">
            Save {discount}%
          </div>
        )}
        <div className="absolute bottom-2 left-2 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {product.category}
        </div>
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </Link>
      
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/product/${product.id}`} className="hover:underline">
          <h3 className="font-bold text-lg leading-tight text-foreground line-clamp-2">{product.name}</h3>
        </Link>
        
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-black text-primary">Rs. {product.price}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">Rs. {product.compareAtPrice}</span>
          )}
        </div>
        
        <Link 
          href={`/product/${product.id}`}
          className="mt-4 w-full bg-foreground text-background font-semibold py-3 rounded-lg text-center transition-colors hover:bg-primary hover:text-primary-foreground"
          data-testid={`button-order-${product.id}`}
        >
          Order Now
        </Link>
      </div>
    </motion.div>
  );
}
