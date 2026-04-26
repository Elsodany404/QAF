import { Coffee, Instagram, Facebook, Twitter, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gradient-to-b from-charcoal-900 to-charcoal-950 text-cream-100">
      {/* Newsletter section */}
      <div className="border-b border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-2xl">
            <h3 className="font-display text-3xl font-bold text-white mb-3">Join Our Coffee Community</h3>
            <p className="text-cream-300 mb-6">Get exclusive blends, brewing tips, and roasting stories delivered to your inbox.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-charcoal-800 border border-charcoal-700 text-white placeholder-charcoal-400 focus:outline-none focus:border-gold-500"
              />
              <button className="premium-button-primary">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-espresso-600 to-mocha-600 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-cream-50" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-white leading-tight">Qaf Coffee</p>
                <p className="text-gold-400 text-xs tracking-widest uppercase font-semibold">Artisan Roasters</p>
              </div>
            </div>
            <p className="text-cream-300 text-sm leading-relaxed mb-5">
              Small-batch roasted coffee from the world's finest origins. Crafted with passion, served with purpose.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: '#' },
                { Icon: Facebook, href: '#' },
                { Icon: Twitter, href: '#' },
              ].map(({ Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  className="w-10 h-10 rounded-lg bg-charcoal-800 hover:bg-gradient-to-br hover:from-espresso-600 hover:to-mocha-600 flex items-center justify-center text-cream-300 hover:text-white transition-all"
                  aria-label="Social link"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm tracking-widest uppercase text-gold-400 mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {['Turkish Coffee', 'Espresso Blends', 'Flavored Coffee', 'All Products'].map(item => (
                <li key={item}>
                  <button
                    onClick={() => onNavigate('menu')}
                    className="text-cream-300 hover:text-gold-400 text-sm transition-colors group"
                  >
                    <span className="flex items-center gap-1 group-hover:gap-2">
                      {item}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm tracking-widest uppercase text-gold-400 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {['Our Story', 'Sourcing', 'Sustainability', 'Contact'].map(item => (
                <li key={item}>
                  <button
                    onClick={() => onNavigate('about')}
                    className="text-cream-300 hover:text-gold-400 text-sm transition-colors group"
                  >
                    <span className="flex items-center gap-1 group-hover:gap-2">
                      {item}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm tracking-widest uppercase text-gold-400 mb-4">Contact</h4>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                <span className="text-cream-300 text-sm">Cairo, Egypt</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-400 shrink-0" />
                <span className="text-cream-300 text-sm">+20 100 000 0000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold-400 shrink-0" />
                <span className="text-cream-300 text-sm">hello@qafcoffee.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-charcoal-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-charcoal-400 text-xs">
            &copy; {new Date().getFullYear()} Qaf Coffee Co. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-charcoal-400 hover:text-gold-400 text-xs transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-charcoal-400 hover:text-gold-400 text-xs transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
