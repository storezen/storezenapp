import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Check, ShieldCheck, Truck, Clock } from 'lucide-react';
import { products } from '../data/products';
import { STORE_CONFIG } from '../config';
import { useCart } from '../hooks/use-cart';
import { trackViewContent } from '../lib/tiktok-pixel';
import { useToast } from '../hooks/use-toast';

export default function ProductDetail() {
  const [match, params] = useRoute('/product/:id');
  const [, setLocation] = useLocation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const product = products.find(p => p.id === params?.id);
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<{name: string, price: number} | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Initialize selections
  useEffect(() => {
    if (product) {
      if (product.variants?.sizes && product.variants.sizes.length > 0) {
        setSelectedSize(product.variants.sizes[0]);
      }
      if (product.variants?.colors && product.variants.colors.length > 0) {
        setSelectedColor(product.variants.colors[0]);
      }
      if (product.variants?.options && product.variants.options.length > 0) {
        setSelectedOption(product.variants.options[0]);
      }
      
      trackViewContent({
        id: product.id,
        name: product.name,
        price: product.price
      });
    }
  }, [product]);

  if (!match || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <button 
          onClick={() => setLocation('/')}
          className="text-primary font-semibold hover:underline"
        >
          Return Home
        </button>
      </div>
    );
  }

  const currentPrice = selectedOption ? selectedOption.price : product.price;
  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - currentPrice) / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    const variant = {
      ...(selectedSize ? { size: selectedSize } : {}),
      ...(selectedColor ? { color: selectedColor } : {}),
      ...(selectedOption ? { optionName: selectedOption.name, optionPrice: selectedOption.price } : {})
    };
    
    addToCart({
      product,
      variant,
      quantity
    });

    toast({
      title: "Added to Cart!",
      description: `${quantity}x ${product.name} added to your bag.`,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setLocation('/cart');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center px-4">
        <button 
          onClick={() => setLocation('/')}
          className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors -ml-2"
          data-testid="button-back"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold flex-1 text-center truncate pr-8">{product.name}</span>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full md:py-8 flex flex-col md:flex-row gap-8 lg:gap-16">
        {/* Product Image */}
        <div className="w-full md:w-1/2 md:max-w-md">
          <div className="aspect-square bg-muted relative md:rounded-2xl overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <div className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg font-black text-sm tracking-wider uppercase shadow-lg transform -rotate-2">
                Sale {discount}% Off
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 p-4 md:p-0 flex flex-col">
          <div className="mb-2 text-primary font-bold text-sm tracking-widest uppercase">
            {product.category}
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight mb-4">{product.name}</h1>
          
          <div className="flex items-end gap-3 mb-6">
            <span className="text-4xl font-black text-primary">Rs. {currentPrice}</span>
            {product.compareAtPrice && (
              <span className="text-xl text-muted-foreground line-through mb-1">Rs. {product.compareAtPrice}</span>
            )}
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert mb-8 text-muted-foreground">
            <p>{product.description}</p>
          </div>

          {/* Variants Selection */}
          <div className="space-y-6 mb-8">
            {/* Sizes */}
            {product.variants?.sizes && product.variants.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm uppercase tracking-wider">Size</span>
                  <span className="text-muted-foreground text-xs underline cursor-pointer">Size Guide</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] h-10 px-3 border rounded-md font-bold transition-all ${
                        selectedSize === size 
                          ? 'border-primary bg-primary text-primary-foreground' 
                          : 'border-border bg-card text-foreground hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.variants?.colors && product.variants.colors.length > 0 && (
              <div>
                <span className="block font-bold text-sm uppercase tracking-wider mb-3">Color: <span className="text-muted-foreground font-normal capitalize">{selectedColor}</span></span>
                <div className="flex flex-wrap gap-3">
                  {product.variants.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-primary scale-110' : 'border-transparent'
                      } ${color.toLowerCase() === 'white' ? 'bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]' : 'bg-black'}`}
                      aria-label={`Select ${color}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Options (Digital goods etc) */}
            {product.variants?.options && product.variants.options.length > 0 && (
              <div>
                <span className="block font-bold text-sm uppercase tracking-wider mb-3">Format</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.variants.options.map(opt => (
                    <button
                      key={opt.name}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        selectedOption?.name === opt.name 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="font-bold flex justify-between items-center">
                        {opt.name}
                        {selectedOption?.name === opt.name && <Check size={16} className="text-primary" />}
                      </div>
                      <div className="text-muted-foreground text-sm mt-1">Rs. {opt.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <span className="block font-bold text-sm uppercase tracking-wider mb-3">Quantity</span>
              <div className="flex items-center w-32 border border-border rounded-lg bg-card">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted text-lg font-medium transition-colors rounded-l-lg"
                >-</button>
                <div className="flex-1 text-center font-bold">{quantity}</div>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted text-lg font-medium transition-colors rounded-r-lg"
                >+</button>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-muted/50 p-4 rounded-xl border border-border border-dashed">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary shadow-sm">
                <Truck size={20} />
              </div>
              <div className="text-sm">
                <p className="font-bold leading-none">Free Delivery</p>
                <p className="text-muted-foreground text-xs mt-1">On orders &gt; Rs.3000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div className="text-sm">
                <p className="font-bold leading-none">100% Authentic</p>
                <p className="text-muted-foreground text-xs mt-1">Quality guaranteed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary shadow-sm">
                <Clock size={20} />
              </div>
              <div className="text-sm">
                <p className="font-bold leading-none">Fast Shipping</p>
                <p className="text-muted-foreground text-xs mt-1">2-4 working days</p>
              </div>
            </div>
          </div>

          {/* Action Buttons Desktop (hidden on mobile, shown in fixed bar) */}
          <div className="hidden md:flex gap-4 mt-auto">
            <button 
              onClick={handleAddToCart}
              className="flex-1 border-2 border-foreground bg-transparent text-foreground h-14 rounded-full font-black uppercase tracking-widest transition-colors hover:bg-muted"
            >
              Add to Cart
            </button>
            <button 
              onClick={handleBuyNow}
              className="flex-[2] bg-primary text-primary-foreground h-14 rounded-full font-black uppercase tracking-widest transition-all hover:bg-primary/90 hover-elevate shadow-lg shadow-primary/20"
            >
              Buy It Now
            </button>
          </div>
        </div>
      </main>

      {/* Fixed Mobile Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border md:hidden z-40 flex gap-3 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button 
          onClick={handleAddToCart}
          className="w-14 h-14 border border-border rounded-xl flex items-center justify-center flex-shrink-0 bg-card"
          aria-label="Add to cart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/><path d="M12 8v6"/><path d="M9 11h6"/></svg>
        </button>
        <button 
          onClick={handleBuyNow}
          className="flex-1 bg-primary text-primary-foreground h-14 rounded-xl font-black text-lg uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
          data-testid="button-buy-now-mobile"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
