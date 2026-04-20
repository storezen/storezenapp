import { Link, useLocation } from 'wouter';
import { Heart, Trash2, ShoppingBag, ArrowLeft, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../hooks/use-wishlist';
import { useCart } from '../hooks/use-cart';
import { useProducts } from '../hooks/use-products';
import { STORE_CONFIG } from '../config';
import { getProductMinStock, isProductSoldOut } from '../components/StockBadge';
import { useToast } from '../hooks/use-toast';
import { Navbar } from '../components/Navbar';

export default function Wishlist() {
  const products = useProducts();
  const [, setLocation] = useLocation();
  const { ids, remove, count } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const wishlisted = products.filter(p => ids.includes(p.id));

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    addToCart({ product, quantity: 1 });
    toast({ title: 'Added to Cart!', description: `${product.name} added to your bag.` });
  };

  const handleShareWhatsApp = () => {
    if (wishlisted.length === 0) return;
    const lines = wishlisted.map(
      (p, i) => `${i + 1}. *${p.name}* — Rs. ${p.price}\n   ${window.location.origin}/product/${p.id}`
    ).join('\n\n');
    const msg = encodeURIComponent(
      `Check out my SmartWear wishlist! 🛍️\n\n${lines}\n\nShop here: ${window.location.origin}`
    );
    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setLocation('/')}
            className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
            data-testid="button-back-wishlist"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Heart size={22} className="text-rose-500 fill-rose-500" />
              My Wishlist
              {count > 0 && (
                <span className="text-base font-bold text-muted-foreground">({count})</span>
              )}
            </h1>
          </div>
          {count > 0 && (
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 text-sm font-bold text-[#25D366] border border-[#25D366]/30 bg-[#25D366]/5 hover:bg-[#25D366]/10 px-4 py-2 rounded-full transition-colors"
              data-testid="button-share-wishlist"
            >
              <Share2 size={14} />
              Share via WhatsApp
            </button>
          )}
        </div>

        {/* Empty state */}
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <Heart size={36} className="text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground text-sm mb-6">Save items you love — tap the ♡ on any product!</p>
            <Link
              href="/catalog"
              className="px-7 py-3 bg-primary text-primary-foreground rounded-full font-black uppercase tracking-wide hover:bg-primary/90 transition-colors"
              data-testid="button-browse-wishlist"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {wishlisted.map(product => {
                const minStock  = getProductMinStock(product.id);
                const soldOut   = isProductSoldOut(product.id);
                const isLowStock = !soldOut && minStock <= 9 && minStock > 0;
                const hasSale   = !!product.compareAtPrice;
                const discount  = hasSale
                  ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
                  : 0;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.25 }}
                    className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm flex flex-col"
                    data-testid={`wishlist-card-${product.id}`}
                  >
                    {/* Image */}
                    <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Sale badge */}
                      {hasSale && discount > 0 && (
                        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-md z-10">
                          -{discount}%
                        </div>
                      )}

                      {/* Indicators */}
                      <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 z-10">
                        {isLowStock && (
                          <span className="self-start bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                            🔥 Low Stock!
                          </span>
                        )}
                        {hasSale && (
                          <span className="self-start bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                            💰 Price Dropped!
                          </span>
                        )}
                      </div>

                      {soldOut && (
                        <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-foreground text-background text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="p-3 flex flex-col flex-grow gap-2">
                      <Link href={`/product/${product.id}`} className="hover:underline">
                        <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.name}</h3>
                      </Link>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-primary">Rs. {product.price}</span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-muted-foreground line-through">Rs. {product.compareAtPrice}</span>
                        )}
                      </div>

                      <div className="mt-auto flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={soldOut}
                          className="flex-1 bg-foreground text-background rounded-lg py-2 text-xs font-black uppercase tracking-wide disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-1"
                          data-testid={`btn-add-to-cart-wishlist-${product.id}`}
                        >
                          <ShoppingBag size={12} />
                          {soldOut ? 'Sold Out' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={() => remove(product.id)}
                          className="w-9 h-9 flex items-center justify-center border border-border rounded-lg hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors flex-shrink-0"
                          aria-label="Remove from wishlist"
                          data-testid={`btn-remove-wishlist-${product.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
