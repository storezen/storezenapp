import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Search, Menu, X, Heart } from 'lucide-react';
import { useCart } from '../hooks/use-cart';
import { useWishlist } from '../hooks/use-wishlist';
import { STORE_CONFIG } from '../config';
import { StoreLogo } from './StoreLogo';

const ANNOUNCEMENTS = [
  '🎉 Use code FIRST10 for 10% off your first order!',
  `Free Delivery on orders over Rs. 2,000 — COD Available`,
  '💸 Use code SAVE200 for Rs. 200 off orders over Rs. 2,000!',
];

interface NavbarProps {
  onSearchChange?: (q: string) => void;
  searchValue?: string;
  showSearch?: boolean;
}

export function Navbar({ onSearchChange, searchValue = '', showSearch = false }: NavbarProps) {
  const [location] = useLocation();
  const { cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [announceIdx,   setAnnounceIdx]   = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setAnnounceIdx(i => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { label: 'Home',        href: '/'            },
    { label: 'Catalog',     href: '/catalog'     },
    { label: 'Wishlist',    href: '/wishlist'    },
    { label: 'Track Order', href: '/track-order' },
    { label: 'Contact',     href: '/contact'     },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/98 backdrop-blur-md border-b border-border shadow-sm">
      {/* Announcement bar — rotating promo messages */}
      <div className="bg-foreground text-background py-1.5 text-center text-[11px] font-bold uppercase tracking-widest overflow-hidden relative min-h-[28px] flex items-center justify-center">
        <span
          key={announceIdx}
          className="animate-fade-in"
        >
          {ANNOUNCEMENTS[announceIdx]}
        </span>
      </div>

      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <StoreLogo />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-wide rounded-lg transition-colors ${
                isActive(link.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid={`nav-${link.label.toLowerCase()}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Icons */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(s => !s)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Search"
            data-testid="button-search-open"
          >
            <Search size={20} />
          </button>

          {/* Wishlist */}
          <button
            className="relative p-2 hover:bg-muted rounded-full transition-colors"
            onClick={() => setLocation('/wishlist')}
            aria-label="Wishlist"
            data-testid="button-wishlist-nav"
          >
            <Heart size={20} className={wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            className="relative p-2 hover:bg-muted rounded-full transition-colors"
            onClick={() => setLocation('/cart')}
            data-testid="button-cart-nav"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-border bg-background px-4 py-3">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              autoFocus
              type="search"
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 bg-muted border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={searchValue}
              onChange={e => {
                onSearchChange?.(e.target.value);
                if (!location.startsWith('/catalog')) {
                  setLocation('/catalog');
                }
              }}
              data-testid="input-search-navbar"
            />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wide rounded-lg transition-colors ${
                isActive(link.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
