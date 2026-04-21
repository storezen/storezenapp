import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Check, ShieldCheck, Truck, Clock, ShoppingBag, Heart, RotateCcw, Ruler } from 'lucide-react';
import { STORE_CONFIG } from '../config';
import { useCart } from '../hooks/use-cart';
import { useWishlist } from '../hooks/use-wishlist';
import { trackViewContent, trackAddToCart, trackContact } from '../lib/tiktok-pixel';
import { useSeo } from '../hooks/useSeo';
import { useToast } from '../hooks/use-toast';
import { StockIndicator, getVariantStock, isProductSoldOut } from '../components/StockBadge';
import { ReviewsSection } from '../components/ReviewsSection';
import { YouMightAlsoLike } from '../components/Recommendations';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { useRecentlyViewed } from '../hooks/use-recently-viewed';
import { CODForm } from '../components/CODForm';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { SizeGuideModal } from '../components/SizeGuideModal';
import { getProductRating } from '../data/reviews';
import { API_URL } from '../config';
import type { Product } from '../data/products';
import { useStore } from '../hooks/use-store';

function StarRatingDisplay({ avg, count }: { avg: number; count: number }) {
  const rounded = Math.round(avg);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24"
            fill={i <= rounded ? '#1A1A1A' : 'none'}
            stroke={i <= rounded ? '#1A1A1A' : '#D5D4D2'}
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{avg.toFixed(1)} ({count} reviews)</span>
    </div>
  );
}

export default function ProductDetail() {
  const [match, params] = useRoute('/product/:slug');
  const [, setLocation] = useLocation();
  const { storeSlug } = useStore();
  const { addToCart, cartCount } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const { trackView } = useRecentlyViewed();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      if (!params?.slug) return;
      setIsLoading(true);
      try {
        const url = new URL(`${API_URL}/products/public/${encodeURIComponent(params.slug)}`);
        url.searchParams.set('store_slug', storeSlug);
        const resp = await fetch(url.toString());
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error ?? 'Failed to load product');
        const images = Array.isArray(data?.images) ? data.images.filter((x: unknown): x is string => typeof x === 'string') : [];
        const variants = (data?.variants && typeof data.variants === 'object') ? data.variants as Record<string, unknown> : {};
        const mapped: Product = {
          id: String(data.id),
          slug: String(data.slug ?? params.slug),
          name: String(data.name ?? ''),
          price: Number(data.salePrice ?? data.price ?? 0),
          compareAtPrice: data.salePrice != null ? Number(data.price ?? 0) : undefined,
          description: String(data.description ?? ''),
          category: String(data.category ?? 'General'),
          image: images[0] ?? '/placeholder.svg',
          images,
          variants: {
            sizes: Array.isArray(variants.sizes) ? variants.sizes.filter((x): x is string => typeof x === 'string') : undefined,
            colors: Array.isArray(variants.colors) ? variants.colors.filter((x): x is string => typeof x === 'string') : undefined,
            options: Array.isArray(variants.options)
              ? variants.options
                  .map((opt) =>
                    opt && typeof opt === 'object'
                      ? { name: String((opt as Record<string, unknown>).name ?? ''), price: Number((opt as Record<string, unknown>).price ?? 0) }
                      : null,
                  )
                  .filter((x): x is { name: string; price: number } => Boolean(x && x.name))
              : undefined,
          },
          stock: Number(data.stock ?? 0),
          status: data.isActive === false ? 'draft' : 'active',
        };
        setProduct(mapped);
      } catch {
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [params?.slug, storeSlug]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<{ name: string; price: number } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isCODOpen, setIsCODOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  useEffect(() => {
    if (product) {
      if (product.variants?.sizes?.length) setSelectedSize(product.variants.sizes[0]);
      if (product.variants?.colors?.length) setSelectedColor(product.variants.colors[0]);
      if (product.variants?.options?.length) setSelectedOption(product.variants.options[0]);
      trackViewContent({ id: product.id, name: product.name, price: product.price, category: product.category });
      trackView(product.id);
    }
  }, [product]);

  const productSoldOut = product ? isProductSoldOut(product.id) : false;

  useSeo({
    title: product ? `${product.name} — SmartWear` : `Product — SmartWear`,
    description: product?.description?.slice(0, 160),
    image: product?.images?.[0] ?? product?.image,
    type: product ? 'product' : 'website',
    price: product?.price,
    structuredData: product ? {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images ?? [product.image],
      brand: { '@type': 'Brand', name: 'SmartWear' },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'PKR',
        availability: productSoldOut
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'SmartWear' },
      },
    } : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!match || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <button onClick={() => setLocation('/')} className="text-primary font-semibold hover:underline">Return Home</button>
      </div>
    );
  }

  const currentPrice = selectedOption ? selectedOption.price : product.price;
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - currentPrice) / product.compareAtPrice) * 100)
    : 0;
  const variantStock = getVariantStock(
    product.id,
    selectedSize || undefined,
    selectedColor || undefined,
    selectedOption?.name
  );
  const stock = variantStock.current;
  const soldOut = stock === 0;
  const rating = getProductRating(product.id);

  const handleAddToCart = () => {
    const variant = {
      ...(selectedSize ? { size: selectedSize } : {}),
      ...(selectedColor ? { color: selectedColor } : {}),
      ...(selectedOption ? { optionName: selectedOption.name, optionPrice: selectedOption.price } : {}),
    };
    addToCart({ product, variant, quantity });
    trackAddToCart({ id: product.id, name: product.name, price: currentPrice, category: product.category }, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
    toast({ title: "Added to Cart!", description: `${quantity}x ${product.name} added to your bag.` });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setLocation('/cart');
  };

  const handleWhatsAppOrder = () => {
    const variant = [selectedSize, selectedColor, selectedOption?.name].filter(Boolean).join(', ');
    const msg = encodeURIComponent(
      `Hi! I want to order:\n*${product.name}*${variant ? ` (${variant})` : ''}\nQty: ${quantity}\nPrice: Rs. ${currentPrice * quantity}\n\nPlease confirm availability. COD payment.`
    );
    trackContact(product.id);
    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${msg}`, '_blank');
  };

  const cartItems = selectedOption
    ? [{ product, variant: { optionName: selectedOption.name, optionPrice: selectedOption.price }, quantity }]
    : [{ product, variant: { size: selectedSize, color: selectedColor }, quantity }];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-24 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center px-4">
        <button
          onClick={() => setLocation('/')}
          className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors -ml-2"
          data-testid="button-back"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold flex-1 text-center truncate px-4">{product.name}</span>
        <button
          onClick={() => product && toggleWishlist(product.id)}
          className="relative p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="Wishlist"
          data-testid="button-wishlist-detail"
        >
          <Heart
            size={22}
            className={product && isWishlisted(product.id) ? 'text-rose-500 fill-rose-500' : ''}
          />
        </button>
        <button
          className="relative p-2 hover:bg-muted rounded-full transition-colors"
          onClick={() => setLocation('/cart')}
          data-testid="button-cart-header"
        >
          <ShoppingBag size={22} />
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 bg-primary text-primary-foreground w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full md:py-8 flex flex-col md:flex-row gap-8 lg:gap-16">
        {/* Product Image Gallery */}
        <div className="w-full md:w-1/2 md:max-w-md flex-shrink-0">
          <ProductImageGallery
            images={product.images && product.images.length > 0 ? product.images : [product.image]}
            productName={product.name}
            discount={discount > 0 ? discount : undefined}
            isLowStock={stock <= 5}
          />
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 p-4 md:p-0 flex flex-col">
          <div className="mb-1.5 text-primary font-bold text-xs tracking-widest uppercase">{product.category}</div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">{product.name}</h1>

          {rating && <StarRatingDisplay avg={rating.avg} count={rating.count} />}

          <div className="flex items-end gap-3 mt-4 mb-2">
            <span className="text-4xl font-black text-primary">Rs. {currentPrice}</span>
            {product.compareAtPrice && (
              <span className="text-xl text-muted-foreground line-through mb-1">Rs. {product.compareAtPrice}</span>
            )}
            {discount > 0 && (
              <span className="mb-1 text-sm font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                You save Rs. {product.compareAtPrice! - currentPrice}
              </span>
            )}
          </div>

          <div className="mb-5">
            <StockIndicator current={variantStock.current} total={variantStock.total} />
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed mb-7">{product.description}</p>

          {/* Variants */}
          <div className="space-y-5 mb-7">
            {product.variants?.sizes && product.variants.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-bold text-sm uppercase tracking-wider">Size: <span className="font-normal normal-case text-muted-foreground">{selectedSize}</span></span>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
                    data-testid="button-size-guide"
                  >
                    <Ruler size={12} strokeWidth={1.5} /> Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] h-10 px-3 border-2 rounded-md font-bold transition-all ${selectedSize === size ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/50'}`}
                      data-testid={`size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variants?.colors && product.variants.colors.length > 0 && (
              <div>
                <span className="block font-bold text-sm uppercase tracking-wider mb-2.5">Color: <span className="font-normal normal-case text-muted-foreground capitalize">{selectedColor}</span></span>
                <div className="flex flex-wrap gap-3">
                  {product.variants.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-transparent'} ${color.toLowerCase() === 'white' ? 'bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]' : 'bg-gray-900'}`}
                      aria-label={`Select ${color}`}
                      data-testid={`color-${color}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.variants?.options && product.variants.options.length > 0 && (
              <div>
                <span className="block font-bold text-sm uppercase tracking-wider mb-2.5">Format</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.variants.options.map(opt => (
                    <button
                      key={opt.name}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3 border-2 rounded text-left transition-all ${selectedOption?.name === opt.name ? 'border-foreground bg-foreground/5 ring-1 ring-foreground' : 'border-border bg-card hover:border-foreground/40'}`}
                      data-testid={`option-${opt.name}`}
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

            <div>
              <span className="block font-bold text-sm uppercase tracking-wider mb-2.5">Quantity</span>
              <div className="flex items-center w-36 border-2 border-border rounded bg-card overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center hover:bg-muted text-xl font-medium transition-colors"
                  data-testid="button-qty-minus"
                >−</button>
                <div className="flex-1 text-center font-black text-lg" data-testid="text-quantity">{quantity}</div>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="w-12 h-12 flex items-center justify-center hover:bg-muted text-xl font-medium transition-colors"
                  data-testid="button-qty-plus"
                >+</button>
              </div>
            </div>
          </div>

          {/* Trust Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7 bg-muted/40 p-4 rounded border border-border/50">
            {[
              { icon: Truck,      title: 'Free Delivery',  sub: 'Orders > Rs.2000', href: undefined },
              { icon: ShieldCheck,title: '100% Authentic', sub: 'Quality guaranteed', href: undefined },
              { icon: Clock,      title: 'Fast Shipping',  sub: '2-4 working days',  href: undefined },
              { icon: RotateCcw,  title: 'Easy Returns',   sub: '7-day return policy', href: '/return-policy' },
            ].map(({ icon: Icon, title, sub, href }) => {
              const inner = (
                <>
                  <Icon size={18} className="text-primary" />
                  <p className="font-bold text-xs leading-none">{title}</p>
                  <p className="text-muted-foreground text-[10px] leading-tight">{sub}</p>
                </>
              );
              return href ? (
                <button
                  key={title}
                  onClick={() => setLocation(href)}
                  className="flex flex-col items-center text-center gap-1 hover:opacity-80 transition-opacity underline-offset-2 group"
                  data-testid="button-return-policy-badge"
                >
                  {inner}
                  <span className="text-[9px] text-primary font-bold group-hover:underline">Learn more →</span>
                </button>
              ) : (
                <div key={title} className="flex flex-col items-center text-center gap-1">
                  {inner}
                </div>
              );
            })}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex flex-col gap-3 mt-auto">
            {soldOut ? (
              <div className="w-full h-14 rounded border-2 border-destructive/30 bg-destructive/5 flex items-center justify-center text-destructive font-semibold uppercase tracking-widest text-sm">
                Out of Stock
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 border-2 border-foreground bg-transparent text-foreground h-14 rounded font-semibold uppercase tracking-widest transition-all text-sm ${addedAnimation ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
                    style={{ borderRadius: 6 }}
                    data-testid="button-add-to-cart"
                  >
                    {addedAnimation ? 'Added!' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-[2] bg-primary text-primary-foreground h-14 font-semibold uppercase tracking-widest transition-all hover:opacity-90 text-sm"
                    style={{ borderRadius: 6 }}
                    data-testid="button-buy-now"
                  >
                    Buy Now
                  </button>
                </div>
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full text-white h-12 font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-sm"
                  style={{ backgroundColor: '#25D366', borderRadius: 6 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#128C7E')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#25D366')}
                  data-testid="button-whatsapp-order"
                >
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Order via WhatsApp
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-full h-10 border font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    isWishlisted(product.id)
                      ? 'border-foreground/30 bg-foreground/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                  style={{ borderRadius: 6 }}
                  data-testid="button-wishlist-desktop"
                >
                  <Heart size={14} strokeWidth={1.5} className={isWishlisted(product.id) ? 'fill-foreground' : ''} />
                  {isWishlisted(product.id) ? 'Saved to Wishlist' : 'Save to Wishlist'}
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Reviews + Related + Recently Viewed — full width */}
      <div className="max-w-6xl mx-auto w-full px-4 pb-8">
        <ReviewsSection productId={product.id} productName={product.name} />
        <YouMightAlsoLike currentProductId={product.id} category={product.category} />
        <RecentlyViewed
          title="You Recently Viewed"
          excludeId={product.id}
          maxItems={6}
        />
      </div>

      {/* Fixed Mobile CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 md:hidden z-40 flex flex-col gap-2"
        style={{
          backgroundColor: 'rgba(247,246,243,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid #E8E7E5',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {soldOut ? (
          <div className="w-full h-12 border-2 border-destructive/30 bg-destructive/5 flex items-center justify-center text-destructive font-semibold uppercase tracking-widest text-sm" style={{ borderRadius: 6 }}>
            Out of Stock
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-12 h-12 border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isWishlisted(product.id) ? 'border-foreground/30 bg-foreground/5' : 'border-border bg-card'
                }`}
                style={{ borderRadius: 6 }}
                aria-label="Wishlist"
                data-testid="button-wishlist-mobile"
              >
                <Heart size={17} strokeWidth={1.5} className={isWishlisted(product.id) ? 'fill-foreground text-foreground' : 'text-muted-foreground'} />
              </button>
              <button
                onClick={handleAddToCart}
                className={`w-12 h-12 border-2 flex items-center justify-center flex-shrink-0 transition-all ${addedAnimation ? 'bg-foreground border-foreground text-background' : 'border-border bg-card'}`}
                style={{ borderRadius: 6 }}
                aria-label="Add to cart"
                data-testid="button-add-to-cart-mobile"
              >
                {addedAnimation
                  ? <Check size={18} strokeWidth={2} />
                  : <ShoppingBag size={18} strokeWidth={1.5} />
                }
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-primary text-primary-foreground h-12 font-semibold uppercase tracking-wide active:scale-[0.98] transition-transform text-sm"
                style={{ borderRadius: 6 }}
                data-testid="button-buy-now-mobile"
              >
                Buy Now — Rs. {currentPrice * quantity}
              </button>
            </div>
            <button
              onClick={handleWhatsAppOrder}
              className="w-full text-white h-10 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#25D366', borderRadius: 6 }}
              data-testid="button-whatsapp-mobile"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Order via WhatsApp
            </button>
          </>
        )}
      </div>

      <CODForm open={isCODOpen} onOpenChange={setIsCODOpen} items={cartItems} onOrderSuccess={() => setLocation('/')} />
      <SizeGuideModal open={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
}
