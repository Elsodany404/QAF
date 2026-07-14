import { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Coffee } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Shop' },
    { id: 'about', label: 'Our Story' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'glass-effect shadow-soft-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group"
          >
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-br from-espresso-600 to-mocha-600 rounded-full group-hover:shadow-soft-lg transition-shadow" />
              <div className="absolute inset-0 rounded-full flex items-center justify-center">
                <Coffee className="w-6 h-6 text-cream-50" />
              </div>
            </div>
            <div className="text-left">
              <p className="font-display text-xl font-bold text-charcoal-900 leading-tight tracking-wide">Qaf</p>
              <p className="text-espresso-600 text-xs tracking-[0.15em] uppercase leading-tight font-semibold">Coffee Co.</p>
            </div>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`text-sm font-semibold tracking-wide transition-all relative group ${
                  currentPage === link.id
                    ? 'text-espresso-700'
                    : 'text-charcoal-700 hover:text-espresso-600'
                }`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-300 ${currentPage === link.id ? 'w-full' : 'group-hover:w-full'}`} />
              </button>
            ))}
          </div>

          {/* Cart & Mobile toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-lg text-charcoal-700 hover:bg-cream-100 transition-all"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-charcoal-900 text-xs font-bold flex items-center justify-center animate-bounce">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-2.5 rounded-lg text-charcoal-700 hover:bg-cream-100 transition-all"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-cream-200 animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => { onNavigate(link.id); setMobileOpen(false); }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  currentPage === link.id
                    ? 'bg-gradient-to-r from-espresso-600 to-mocha-600 text-white'
                    : 'text-charcoal-700 hover:bg-cream-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
