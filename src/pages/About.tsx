import { Leaf, Globe, Award, Heart, ArrowRight } from 'lucide-react';

interface AboutProps {
  onShop: () => void;
}

export default function About({ onShop }: AboutProps) {
  return (
    <div className="min-h-screen bg-cream-50 pt-20">
      {/* Hero */}
      <div className="relative py-32 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/95 to-espresso-950/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/40 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <div className="inline-block px-4 py-2 rounded-full bg-gold-500/20 border border-gold-500/40 mb-6">
            <p className="text-gold-400 text-xs font-bold tracking-[0.15em] uppercase">Our Journey</p>
          </div>
          <h1 className="font-display text-6xl sm:text-7xl font-bold mb-6 leading-tight">
            Passion for <span className="text-gradient">Perfect Coffee</span>
          </h1>
          <p className="text-cream-100 text-xl max-w-2xl mx-auto leading-relaxed">
            From single-origin sourcing to precision roasting — we obsess over every detail to bring you extraordinary coffee.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="py-28 bg-white relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <h2 className="font-display text-5xl font-bold text-charcoal-950 mb-7 leading-tight">
                Rooted in <span className="text-gradient">Tradition</span>
              </h2>
              <p className="text-charcoal-600 leading-relaxed mb-5 text-lg">
                Founded in Cairo, Qaf Coffee is the culmination of generations of coffee culture and modern roasting science. We source from the world's premier growing regions — Ethiopia, Colombia, Yemen — and bring those stories to your cup.
              </p>
              <p className="text-charcoal-600 leading-relaxed mb-6 text-lg">
                Our Turkish coffee blends pay homage to centuries of tradition while pushing the boundaries of what ground coffee can be. Each of our three blends — Qaf, Colombian, and Golden — represents a distinct flavor philosophy.
              </p>
              <p className="text-charcoal-600 leading-relaxed text-lg">
                We believe that exceptional coffee should be accessible to everyone who cares about quality. That is why we roast in small batches, ship within 24 hours of roasting, and obsess over every detail of the process.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 animate-fade-scale">
              <img src="https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Coffee" className="rounded-2xl w-full aspect-square object-cover shadow-soft-lg" />
              <img src="https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Beans" className="rounded-2xl w-full aspect-square object-cover shadow-soft-lg mt-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-28 bg-gradient-to-b from-cream-50 to-white relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-espresso-500/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-block px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <p className="text-gold-600 text-xs font-bold tracking-[0.15em] uppercase">Values</p>
            </div>
            <h2 className="font-display text-5xl font-bold text-charcoal-950">What Drives Us</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                Icon: Globe,
                title: 'Global Sourcing',
                desc: 'We partner directly with farmers in Colombia, Ethiopia, and Yemen for traceable, premium beans.',
                color: 'from-blue-500 to-blue-600',
              },
              {
                Icon: Award,
                title: 'Expert Roasting',
                desc: 'Our Q-certified roasters bring precision and passion to every small-batch roast.',
                color: 'from-amber-500 to-amber-600',
              },
              {
                Icon: Leaf,
                title: 'Sustainability',
                desc: 'Carbon-neutral shipping, compostable packaging, and forest restoration with every order.',
                color: 'from-green-500 to-green-600',
              },
              {
                Icon: Heart,
                title: 'Community First',
                desc: 'We reinvest in farming communities through fair pricing and long-term partnerships.',
                color: 'from-red-500 to-red-600',
              },
            ].map(({ Icon, title, desc, color }, i) => (
              <div
                key={title}
                className="group animate-slide-up premium-card p-8 hover:shadow-soft-xl transition-all"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display font-bold text-charcoal-950 mb-3 text-lg">{title}</h3>
                <p className="text-charcoal-600 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-28 bg-white relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-mocha-500/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-block px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <p className="text-gold-600 text-xs font-bold tracking-[0.15em] uppercase">Our Process</p>
            </div>
            <h2 className="font-display text-5xl font-bold text-charcoal-950">From Farm to Cup</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Source', desc: 'Direct relationships with micro-farms' },
              { step: '02', title: 'Import', desc: 'Fresh beans to our roastery' },
              { step: '03', title: 'Roast', desc: 'Small-batch precision roasting' },
              { step: '04', title: 'Deliver', desc: 'Fresh to your door in 24-48 hours' },
            ].map((item, i) => (
              <div key={item.step} className="relative group animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="premium-card p-8 h-full hover:shadow-soft-xl transition-all">
                  <div className="text-5xl font-display font-bold text-gold-500/30 mb-3">{item.step}</div>
                  <h3 className="font-bold text-charcoal-950 mb-2 text-lg">{item.title}</h3>
                  <p className="text-charcoal-600 text-sm">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-gold-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 bg-gradient-to-r from-charcoal-900 via-espresso-950 to-charcoal-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,200,87,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(166,109,74,0.1),transparent_50%)]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center animate-slide-up">
          <h2 className="font-display text-5xl sm:text-6xl font-bold mb-6">Experience the Difference</h2>
          <p className="text-cream-100 text-xl mb-10 leading-relaxed">
            Taste coffee that's been crafted with passion, sourced ethically, and roasted to perfection.
          </p>
          <button
            onClick={onShop}
            className="px-12 py-5 bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-charcoal-950 font-bold text-lg rounded-xl transition-all hover:scale-105 shadow-soft-xl inline-flex items-center gap-2"
          >
            Shop Our Blends
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
