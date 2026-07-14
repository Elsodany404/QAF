import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X, Filter } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';
import type { Product, ProductCategory, ProductSubcategory } from '../lib/database.types';

const CATEGORIES: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Coffee' },
  { id: 'turkish_coffee', label: 'Turkish Coffee' },
  { id: 'espresso', label: 'Espresso' },
  { id: 'flavored_coffee', label: 'Flavored Coffee' },
];

const TURKISH_SUBCATEGORIES: { id: ProductSubcategory; label: string }[] = [
  { id: 'qaf_blend', label: 'Qaf Blend' },
  { id: 'colombian_blend', label: 'Colombian Blend' },
  { id: 'golden_blend', label: 'Golden Blend' },
];

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<ProductSubcategory | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          setProducts(data as Product[]);
          setFiltered(data as Product[]);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...products];
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (activeSubcategory) {
      result = result.filter(p => p.subcategory === activeSubcategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [products, activeCategory, activeSubcategory, search]);

  const handleCategoryChange = (cat: ProductCategory | 'all') => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-20">
      {/* Page header */}
      <div className="relative py-24 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/90 via-charcoal-950/85 to-charcoal-900/80" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-block px-4 py-2 rounded-full bg-gold-500/20 border border-gold-500/40 mb-4">
            <p className="text-gold-400 text-xs font-bold tracking-[0.15em] uppercase">Collection</p>
          </div>
          <h1 className="font-display text-6xl sm:text-7xl font-bold mb-5">Our Coffee</h1>
          <p className="text-cream-100 text-lg max-w-2xl mx-auto">
            Curated blends from the world's finest origins — crafted with precision, served with pride.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search & filter bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search by name or flavor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="premium-input pl-12"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 px-4 py-3 premium-card">
            <Filter className="w-5 h-5 text-espresso-600" />
            <span className="text-sm font-semibold text-charcoal-700">{filtered.length} items</span>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-espresso-600 to-mocha-600 text-white shadow-soft'
                  : 'bg-white text-charcoal-700 border-2 border-cream-300 hover:border-espresso-400 hover:text-espresso-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Turkish Coffee subcategories */}
        {activeCategory === 'turkish_coffee' && (
          <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide animate-fade-in">
            <button
              onClick={() => setActiveSubcategory(null)}
              className={`shrink-0 px-5 py-2.5 rounded-full font-semibold text-xs transition-all ${
                activeSubcategory === null
                  ? 'bg-gold-500 text-charcoal-950'
                  : 'bg-white text-charcoal-600 border-2 border-cream-300 hover:border-gold-400'
              }`}
            >
              All Blends
            </button>
            {TURKISH_SUBCATEGORIES.map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSubcategory(sub.id)}
                className={`shrink-0 px-5 py-2.5 rounded-full font-semibold text-xs transition-all ${
                  activeSubcategory === sub.id
                    ? 'bg-gold-500 text-charcoal-950'
                    : 'bg-white text-charcoal-600 border-2 border-cream-300 hover:border-gold-400'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="premium-card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gradient-to-br from-mocha-100 to-cream-100" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-cream-200 rounded w-3/4" />
                  <div className="h-3 bg-cream-100 rounded w-full" />
                  <div className="h-3 bg-cream-100 rounded w-2/3" />
                  <div className="h-10 bg-cream-200 rounded w-1/2 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32">
            <SlidersHorizontal className="w-16 h-16 text-cream-300 mx-auto mb-4" />
            <p className="text-charcoal-600 text-lg font-semibold">No coffee found</p>
            <p className="text-charcoal-500 text-sm mt-2">Try adjusting your filters or search</p>
            <button
              onClick={() => { setActiveCategory('all'); setActiveSubcategory(null); setSearch(''); }}
              className="mt-6 premium-button-primary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
