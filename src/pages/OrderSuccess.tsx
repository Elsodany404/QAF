import styles from './OrderSuccess.module.css';
import { CheckCircle, ArrowRight, Package, Truck, Mail } from 'lucide-react';

interface OrderSuccessProps {
  orderId: string;
  onContinue: () => void;
}

export default function OrderSuccess({ orderId, onContinue }: OrderSuccessProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white pt-20 flex items-center justify-center px-4">
      <div className="max-w-lg w-full animate-slide-up">
        <div className="text-center mb-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-soft-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="font-display text-5xl font-bold text-charcoal-950 mb-3">Order Confirmed!</h1>
          <p className="text-charcoal-600 text-lg mb-2">
            Thank you for your purchase. We're roasting your coffee now.
          </p>
          <p className="text-charcoal-500 text-sm">
            Order ID: <span className="font-mono font-bold text-espresso-700">{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        {/* Next steps */}
        <div className="space-y-4 mb-8">
          {[
            { Icon: Mail, title: 'Confirmation Email', desc: 'Check your inbox for order details' },
            { Icon: Package, title: 'Roasting & Packaging', desc: 'Freshly roasted within 24 hours' },
            { Icon: Truck, title: 'Fast Delivery', desc: 'Ships within 2-5 business days' },
          ].map(({ Icon, title, desc }, i) => (
            <div key={title} className="premium-card p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-6 h-6 text-charcoal-950" />
              </div>
              <div>
                <p className="font-bold text-charcoal-950">{title}</p>
                <p className="text-charcoal-600 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bonus message */}
        <div className="bg-gradient-to-r from-gold-50 to-cream-100 border-2 border-gold-200 rounded-xl p-5 text-center mb-8">
          <p className="text-charcoal-900 font-semibold mb-1">Brewing tip from our roasters:</p>
          <p className="text-sm text-charcoal-700">
            Let your coffee rest for 7 days after roasting to reach peak flavor. Quality takes time!
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full premium-button-primary gap-2 justify-center text-lg shadow-soft-lg"
        >
          Continue Shopping
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
