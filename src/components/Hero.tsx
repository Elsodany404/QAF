interface HeroProps {
  onShopNow: () => void;
}

export default function Hero({ onShopNow }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/85 via-charcoal-950/75 to-charcoal-900/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="h-px w-12 bg-gradient-to-r from-gold-400 to-transparent" />
            <span className="text-gold-400 text-sm tracking-[0.15em] uppercase font-semibold">Premium Artisan Coffee</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold leading-tight mb-6 animate-slide-up">
            <span className="block text-white">Elevate Your</span>
            <span className="text-gradient">Coffee Ritual</span>
          </h1>

          {/* Subheading */}
          <p className="text-cream-100/90 text-lg sm:text-xl leading-relaxed mb-12 max-w-2xl animate-slide-up" style={{ animationDelay: '100ms' }}>
            Discover exceptional, hand-roasted blends sourced from Ethiopia, Colombia, and Yemen. Each cup tells a story of craft, tradition, and uncompromising quality.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <button
              onClick={onShopNow}
              className="premium-button-primary text-lg shadow-soft-lg hover:shadow-soft-xl"
            >
              <span className="flex items-center justify-center gap-2">
                Explore Collection
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <button
              onClick={onShopNow}
              className="premium-button-secondary text-lg"
            >
              Learn Our Story
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row gap-12 mt-16 pt-8 border-t border-white/10 animate-slide-up" style={{ animationDelay: '300ms' }}>
            {[
              { label: 'Coffee Origins', value: '3 Continents' },
              { label: 'Roast Masters', value: 'Q-Certified' },
              { label: 'Flavor Profiles', value: '10+ Blends' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-gold-400 font-semibold text-sm tracking-wider uppercase">{stat.label}</p>
                <p className="text-white font-display text-2xl mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
        <p className="text-gold-400 text-xs uppercase tracking-wider font-semibold">Scroll to explore</p>
        <div className="w-6 h-10 rounded-full border-2 border-gold-400/50 flex items-center justify-center">
          <div className="w-1.5 h-2 bg-gold-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
