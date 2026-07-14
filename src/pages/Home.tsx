import { useEffect, useState } from 'react';
import { ArrowRight, Award, Leaf, Globe, ChevronRight, Zap } from 'lucide-react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';
import type { Product } from '../lib/database.types';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const CATEGORY_INFO = [
  {
    id: 'turkish_coffee',
    title: 'Turkish Coffee',
    subtitle: 'Time-Honored Tradition',
    description: 'Finely ground, slow-brewed perfection in three exceptional blends.',
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600',
    blends: ['Qaf Blend', 'Colombian Blend', 'Golden Blend'],
  },
  {
    id: 'espresso',
    title: 'Espresso',
    subtitle: 'Intense & Refined',
    description: 'Bold shots crafted for baristas, perfectionists, and everyday ritualists.',
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=600',
    blends: [],
  },
  {
    id: 'flavored_coffee',
    title: 'Flavored Coffee',
    subtitle: 'Creative Indulgence',
    description: 'Natural infusions that transform your cup into a sensory experience.',
    image: 'https://images.pexels.com/photos/6802983/pexels-photo-6802983.jpeg?auto=compress&cs=tinysrgb&w=600',
    blends: [],
  },
];

export default function Home({ onNavigate }: HomeProps) {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .order('sort_order')
      .limit(4)
      .then(({ data }) => {
        if (data) setFeatured(data as Product[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-cream-50">
      <Hero onShopNow={() => onNavigate('menu')} />

      {/* Categories Section */}
      <section className="py-24 bg-white relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-block px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <p className="text-gold-600 text-xs font-bold tracking-[0.15em] uppercase">Our Collections</p>
            </div>
            <h2 className="font-display text-5xl sm:text-6xl font-bold text-charcoal-950 leading-tight">
              Three Worlds of <span className="text-gradient">Exceptional Coffee</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CATEGORY_INFO.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => onNavigate('menu')}
                className="group relative overflow-hidden rounded-2xl aspect-[3/4] text-left focus:outline-none shadow-soft hover:shadow-soft-xl transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/95 via-charcoal-950/50 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="text-gold-400 text-xs tracking-[0.15em] uppercase font-bold mb-2">{cat.subtitle}</p>
                  <h3 className="font-display text-3xl font-bold text-white mb-3">{cat.title}</h3>
                  <p className="text-cream-100 text-sm mb-4 leading-relaxed">{cat.description}</p>
                  {cat.blends.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cat.blends.map(b => (
                        <span key={b} className="px-2.5 py-1 bg-gold-500/20 backdrop-blur-sm text-gold-100 text-xs rounded-full font-semibold">{b}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-gold-400 font-semibold group-hover:gap-2 transition-all">
                    Explore <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-28 bg-gradient-to-b from-cream-50 via-white to-cream-50 relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-espresso-500/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-16">
            <div className="animate-slide-up">
              <div className="inline-block px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-3">
                <p className="text-gold-600 text-xs font-bold tracking-[0.15em] uppercase">Bestsellers</p>
              </div>
              <h2 className="font-display text-5xl font-bold text-charcoal-950">Featured Blends</h2>
            </div>
            <button
              onClick={() => onNavigate('menu')}
              className="hidden sm:flex items-center gap-2 premium-button-primary"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="premium-card overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gradient-to-br from-mocha-100 to-cream-100" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-cream-200 rounded w-3/4" />
                    <div className="h-3 bg-cream-100 rounded w-full" />
                    <div className="h-3 bg-cream-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p, i) => (
                <div key={p.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12 sm:hidden">
            <button
              onClick={() => onNavigate('menu')}
              className="premium-button-primary gap-2"
            >
              View All Products <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gradient-to-r from-charcoal-900 via-espresso-950 to-charcoal-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { Icon: Globe, title: 'Ethically Sourced', desc: 'Direct relationships with farmers in Ethiopia, Colombia, and Yemen ensure fair trade and exceptional quality.' },
              { Icon: Award, title: 'Master Roasted', desc: 'Q-certified roasters bring precision and passion to every batch, unlocking peak flavor potential.' },
              { Icon: Leaf, title: 'Sustainable', desc: 'Carbon-neutral shipping, compostable packaging, and forest restoration in every order.' },
            ].map(({ Icon, title, desc }, i) => (
              <div key={title} className="group animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-gold-400" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-3">{title}</h3>
                  <p className="text-cream-200 leading-relaxed text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Turkish Coffee Highlight */}
      <section className="py-28 bg-white relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-mocha-500/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <div className="inline-block px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
                <p className="text-gold-600 text-xs font-bold tracking-[0.15em] uppercase">Our Signature</p>
              </div>
              <h2 className="font-display text-5xl font-bold text-charcoal-950 mb-6 leading-tight">
                Turkish Coffee <span className="text-gradient">Reimagined</span>
              </h2>
              <p className="text-charcoal-600 text-lg leading-relaxed mb-10">
                Three distinct blends that honor centuries of tradition while pushing flavor boundaries. Each tells a story of origin, craft, and devotion.
              </p>

              <div className="space-y-5 mb-10">
                {[
                  { name: 'Qaf Blend', desc: 'Deep chocolate, rich body, our signature taste', icon: '◆' },
                  { name: 'Colombian Blend', desc: 'Bright acidity, caramel sweetness, vibrant origin', icon: '◆' },
                  { name: 'Golden Blend', desc: 'Honey, dried fruits, warming spice, our finest', icon: '◆' },
                ].map((blend) => (
                  <div key={blend.name} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-espresso-600 flex items-center justify-center shrink-0 mt-1 text-white text-xs font-bold">
                      {blend.icon}
                    </div>
                    <div>
                      <p className="font-bold text-charcoal-950 text-lg">{blend.name}</p>
                      <p className="text-charcoal-600 text-sm leading-relaxed">{blend.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('menu')}
                className="premium-button-primary gap-2 text-lg shadow-soft-lg"
              >
                Shop Turkish Coffee
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative animate-fade-scale">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-soft-xl">
                <img
                  src="https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Turkish Coffee"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 w-56 h-56 rounded-3xl overflow-hidden shadow-soft-xl border-8 border-white">
                <img
                  src="https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Coffee beans"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.pexels.com/photos/1187317/pexels-photo-1187317.jpeg?auto=compress&cs=tinysrgb&w=1920)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/90 to-espresso-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/40 to-transparent" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center text-white animate-slide-up">
          <h2 className="font-display text-5xl sm:text-6xl font-bold mb-6">Ready for Extraordinary?</h2>
          <p className="text-cream-100 text-xl mb-10 leading-relaxed">
            Experience the difference that small-batch roasting, ethical sourcing, and pure passion make.
          </p>
          <button
            onClick={() => onNavigate('menu')}
            className="px-12 py-5 bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-charcoal-950 font-bold text-lg rounded-xl transition-all hover:scale-105 shadow-soft-xl inline-flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Shop Now
          </button>
        </div>
      </section>
    </div>
  );
}
