import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Search, Menu, X, Heart } from 'lucide-react';
import { useCart } from '../hooks/use-cart';
import { useWishlist } from '../hooks/use-wishlist';
import { StoreLogo } from './StoreLogo';

const ANNOUNCE_TEXT =
  'Use code FIRST10 for 10% off your first order — Free Delivery on orders over Rs. 2,000 — COD Available nationwide — Use code SAVE200 for Rs. 200 off — ';

interface NavbarProps {
  onSearchChange?: (q: string) => void;
  searchValue?: string;
  showSearch?: boolean;
}

export function Navbar({ onSearchChange, searchValue = '', showSearch = false }: NavbarProps) {
  const [location] = useLocation();
  const { cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [, setLocation] = useLocation();

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
    <header className="sticky top-0 z-50">
      {/* Announcement bar — continuous CSS marquee */}
      <div
        className="overflow-hidden"
        style={{
          backgroundColor: '#1A1A1A',
          height: 32,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          className="animate-marquee"
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          <span
            className="text-white font-medium uppercase"
            style={{ fontSize: 10, letterSpacing: '0.12em' }}
          >
            {ANNOUNCE_TEXT}{ANNOUNCE_TEXT}
          </span>
        </div>
      </div>

      {/* Main nav bar */}
      <div
        style={{
          backgroundColor: 'rgba(247,246,243,0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8E7E5',
        }}
      >
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <StoreLogo />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-[13px] font-medium transition-colors rounded-md ${
                  isActive(link.href)
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/4'
                }`}
                style={isActive(link.href) ? { color: '#1A1A1A' } : undefined}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span
                    className="absolute bottom-0 left-4 right-4 h-px"
                    style={{ backgroundColor: '#1A1A1A' }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setSearchOpen(s => !s)}
              className="p-2 rounded-md transition-colors hover:bg-black/5 text-muted-foreground hover:text-foreground"
              aria-label="Search"
              data-testid="button-search-open"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            <button
              className="relative p-2 rounded-md transition-colors hover:bg-black/5 text-muted-foreground hover:text-foreground"
              onClick={() => setLocation('/wishlist')}
              aria-label="Wishlist"
              data-testid="button-wishlist-nav"
            >
              <Heart size={20} strokeWidth={1.5} className={wishlistCount > 0 ? 'fill-[#1A1A1A] text-[#1A1A1A]' : ''} />
              {wishlistCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#C4362A' }}
                />
              )}
            </button>

            <button
              className="relative p-2 rounded-md transition-colors hover:bg-black/5 text-muted-foreground hover:text-foreground"
              onClick={() => setLocation('/cart')}
              data-testid="button-cart-nav"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#C4362A' }}
                />
              )}
            </button>

            <button
              className="md:hidden p-2 rounded-md transition-colors hover:bg-black/5 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div style={{ borderTop: '1px solid #E8E7E5' }} className="bg-background px-4 py-3">
            <div className="relative max-w-2xl mx-auto">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={15}
                strokeWidth={1.5}
              />
              <input
                autoFocus
                type="search"
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 rounded"
                style={{
                  backgroundColor: '#EEEDEB',
                  border: '1px solid #E8E7E5',
                  borderRadius: 6,
                }}
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
          <nav
            className="md:hidden px-4 py-3 flex flex-col gap-1"
            style={{ borderTop: '1px solid #E8E7E5' }}
          >
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.href)
                    ? 'bg-foreground/6 text-foreground'
                    : 'text-muted-foreground hover:bg-black/4 hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
