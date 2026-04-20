import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft, Trash2, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../hooks/use-cart';
import { STORE_CONFIG } from '../config';
import { CODForm } from '../components/CODForm';

export default function Cart() {
  const [, setLocation] = useLocation();
  const { items, removeFromCart, clearCart, cartTotal } = useCart();
  const [isCODOpen, setIsCODOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const grandTotal = cartTotal + (items.length > 0 ? STORE_CONFIG.deliveryCharge : 0);

  const handleOrderSuccess = () => {
    setIsSuccess(true);
    clearCart();
    setTimeout(() => {
      setLocation('/');
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1 className="text-3xl font-black mb-2">Order Placed!</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Thank you for shopping with {STORE_CONFIG.storeName}. We've opened WhatsApp to confirm your order details.
        </p>
        <button 
          onClick={() => setLocation('/')}
          className="bg-foreground text-background px-8 py-3 rounded-full font-bold"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-24 md:pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center px-4">
        <button 
          onClick={() => setLocation('/')}
          className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors -ml-2"
          data-testid="button-back-cart"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold flex-1 text-center pr-8">Your Cart ({items.length})</span>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:py-8 flex flex-col md:flex-row gap-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 w-full text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-6">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
            <button 
              onClick={() => setLocation('/')}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold transition-all hover:bg-primary/90"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const price = item.variant?.optionPrice ?? item.product.price;
                  return (
                    <div key={idx} className="flex gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
                      <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <Link href={`/product/${item.product.id}`} className="font-bold hover:underline line-clamp-1">
                            {item.product.name}
                          </Link>
                          <button 
                            onClick={() => removeFromCart(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            aria-label="Remove item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-auto">
                          {item.variant?.size && <span className="mr-2">Size: {item.variant.size}</span>}
                          {item.variant?.color && <span className="mr-2">Color: {item.variant.color}</span>}
                          {item.variant?.optionName && <span>{item.variant.optionName}</span>}
                        </div>
                        
                        <div className="flex justify-between items-end mt-2">
                          <span className="text-sm font-medium">Qty: {item.quantity}</span>
                          <span className="font-black text-primary">Rs. {price * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
              <div className="bg-muted/30 border border-border rounded-xl p-6 sticky top-20">
                <h3 className="font-bold text-lg mb-4 uppercase tracking-wider">Order Summary</h3>
                
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">Rs. {cartTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Charge</span>
                    <span className="font-medium">Rs. {STORE_CONFIG.deliveryCharge}</span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="font-black text-2xl text-primary">Rs. {grandTotal}</span>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-3 mb-6 flex gap-3 text-sm">
                  <div className="text-primary mt-0.5"><ShieldCheck size={18} /></div>
                  <div>
                    <span className="font-bold block mb-0.5">Secure Checkout</span>
                    <span className="text-muted-foreground text-xs leading-tight block">Pay comfortably with Cash on Delivery when your order arrives.</span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsCODOpen(true)}
                  className="w-full bg-foreground text-background h-14 rounded-full font-black text-lg uppercase tracking-wider transition-transform active:scale-[0.98] hover-elevate shadow-lg flex items-center justify-center gap-2"
                  data-testid="button-checkout"
                >
                  Checkout Now
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <CODForm 
        open={isCODOpen} 
        onOpenChange={setIsCODOpen} 
        items={items} 
        onOrderSuccess={handleOrderSuccess} 
      />
    </div>
  );
}
