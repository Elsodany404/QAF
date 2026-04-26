import { useState } from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import type { Product, WeightOption } from '../lib/database.types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [selectedWeight, setSelectedWeight] = useState<WeightOption | null>(
    product.weight_options.length > 0 ? product.weight_options[0] : null
  );
  const [added, setAdded] = useState(false);

  const displayPrice = product.price + (selectedWeight?.price_modifier ?? 0);

  const handleAdd = () => {
    addItem(product, selectedWeight);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const categoryLabel: Record<string, string> = {
    turkish_coffee: 'Turkish Coffee',
    espresso: 'Espresso',
    flavored_coffee: 'Flavored',
  };

  const subcategoryLabel: Record<string, string> = {
    qaf_blend: 'Qaf Blend',
    colombian_blend: 'Colombian Blend',
    golden_blend: 'Golden Blend',
  };

  return (
    <div className="group h-full premium-card overflow-hidden flex flex-col">
      {/* Image container */}
      <div className="relative overflow-hidden aspect-[4/3] bg-gradient-to-br from-mocha-100 to-cream-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-gradient-to-r from-espresso-600 to-mocha-600 text-white text-xs font-bold rounded-full shadow-soft">
            {categoryLabel[product.category]}
          </span>
          {product.subcategory && (
            <span className="px-3 py-1 bg-gold-500/90 text-charcoal-900 text-xs font-semibold rounded-full backdrop-blur-sm shadow-soft">
              {subcategoryLabel[product.subcategory]}
            </span>
          )}
        </div>

        {/* Featured badge */}
        {product.featured && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400 text-charcoal-900 text-xs font-bold rounded-full shadow-soft animate-glow">
              <Star className="w-3.5 h-3.5 fill-current" />
              Featured
            </div>
          </div>
        )}

        {/* Out of stock overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <p className="text-white font-display text-lg font-bold">Coming Soon</p>
              <p className="text-cream-200 text-xs mt-1">Currently restocking</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-5 sm:p-6">
        {/* Name */}
        <h3 className="font-display font-bold text-charcoal-950 text-lg leading-snug mb-2 group-hover:text-espresso-700 transition-colors line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-charcoal-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
          {product.description}
        </p>

        {/* Weight selector */}
        {product.weight_options.length > 0 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {product.weight_options.map(opt => (
              <button
                key={opt.label}
                onClick={() => setSelectedWeight(opt)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all ${
                  selectedWeight?.label === opt.label
                    ? 'border-espresso-600 bg-espresso-50 text-espresso-700'
                    : 'border-cream-300 text-charcoal-600 hover:border-espresso-400 hover:text-espresso-600'
                }`}
              >
                {opt.label}
                {opt.price_modifier > 0 && (
                  <span className="ml-1 text-espresso-500 font-bold">+${opt.price_modifier}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Price & Add to cart */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-cream-200">
          <div className="flex flex-col">
            <span className="text-3xl font-display font-bold text-espresso-700">${displayPrice.toFixed(2)}</span>
            <span className="text-charcoal-500 text-xs">Per unit</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.in_stock}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
              added
                ? 'bg-green-500 text-white scale-95'
                : product.in_stock
                ? 'premium-button-primary'
                : 'bg-charcoal-200 text-charcoal-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{added ? 'Added!' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
