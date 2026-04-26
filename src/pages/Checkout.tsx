import { useState, FormEvent } from 'react';
import { ShoppingBag, ArrowLeft, Lock, CreditCard, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

interface CheckoutProps {
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export default function Checkout({ onBack, onSuccess }: CheckoutProps) {
  const { items, totalPrice, clearCart } = useCart();
  const [form, setForm] = useState<FormData>({ name: '', email: '', phone: '', address: '', city: '', country: 'Egypt' });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const shipping = totalPrice > 50 ? 0 : 5.99;
  const grandTotal = totalPrice + shipping;

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setPayError('');

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          shipping_address: `${form.address}, ${form.city}, ${form.country}`,
          total_amount: grandTotal,
          status: 'pending',
        })
        .select()
        .maybeSingle();

      if (orderError || !order) throw new Error('Failed to create order');

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price + (item.selectedWeight?.price_modifier ?? 0),
        weight_option: item.selectedWeight?.label ?? null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error('Failed to save order items');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const paymobRes = await fetch(`${supabaseUrl}/functions/v1/paymob-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: Math.round(grandTotal * 100),
          currency: 'EGP',
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
        }),
      });

      const paymobData = await paymobRes.json();

      if (paymobData.payment_key) {
        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${paymobData.iframe_id}?payment_token=${paymobData.payment_key}`;
        clearCart();
        window.open(iframeUrl, '_blank');
        onSuccess(order.id);
      } else if (paymobData.error) {
        clearCart();
        onSuccess(order.id);
      } else {
        clearCart();
        onSuccess(order.id);
      }
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof FormData, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-semibold text-charcoal-900 mb-2">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`premium-input ${errors[key] ? 'border-red-500 focus:ring-red-500/20' : ''}`}
      />
      {errors[key] && <p className="text-red-600 text-xs mt-1 font-medium">{errors[key]}</p>}
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-cream-300 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-cream-600" />
          </div>
          <h2 className="font-display text-3xl font-bold text-charcoal-900 mb-2">Cart is empty</h2>
          <p className="text-charcoal-600 mb-8">Add some premium coffee before checking out.</p>
          <button
            onClick={onBack}
            className="premium-button-primary"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-charcoal-600 hover:text-espresso-700 mb-10 transition-colors font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Shopping
        </button>

        <h1 className="font-display text-5xl font-bold text-charcoal-950 mb-12">Secure Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
            {/* Contact */}
            <div className="premium-card p-8">
              <h2 className="font-display text-2xl font-bold text-charcoal-950 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('name', 'Full Name', 'text', 'John Doe')}
                {field('email', 'Email Address', 'email', 'john@example.com')}
                {field('phone', 'Phone Number', 'tel', '+20 100 000 0000')}
              </div>
            </div>

            {/* Shipping */}
            <div className="premium-card p-8">
              <h2 className="font-display text-2xl font-bold text-charcoal-950 mb-6">Shipping Address</h2>
              <div className="space-y-4">
                {field('address', 'Street Address', 'text', '123 Main Street')}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field('city', 'City', 'text', 'Cairo')}
                  <div>
                    <label className="block text-sm font-semibold text-charcoal-900 mb-2">Country</label>
                    <select
                      value={form.country}
                      onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                      className="premium-input"
                    >
                      <option value="Egypt">Egypt</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="UAE">UAE</option>
                      <option value="Jordan">Jordan</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment note */}
            <div className="premium-card p-6 bg-gradient-to-r from-gold-50 to-cream-100 border-2 border-gold-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h3 className="font-bold text-charcoal-900 mb-2">Secure Payment via Paymob</h3>
                  <p className="text-charcoal-700 text-sm mb-2">
                    You will be redirected to Paymob's secure gateway to complete payment.
                  </p>
                  <div className="flex items-center gap-2 text-gold-700 text-xs font-semibold">
                    <Lock className="w-4 h-4" />
                    256-bit SSL Encrypted
                  </div>
                </div>
              </div>
            </div>

            {payError && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                <p className="text-red-700 font-semibold text-sm">{payError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 font-bold text-lg rounded-xl transition-all ${
                loading
                  ? 'bg-charcoal-300 text-charcoal-500 cursor-not-allowed'
                  : 'premium-button-primary shadow-soft-lg hover:shadow-soft-xl'
              }`}
            >
              {loading ? 'Processing...' : `Complete Purchase — $${grandTotal.toFixed(2)}`}
            </button>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="premium-card sticky top-28 p-8">
              <h2 className="font-display text-2xl font-bold text-charcoal-950 mb-6">Order Summary</h2>
              <div className="space-y-4 max-h-80 overflow-y-auto mb-6 pb-6 border-b-2 border-cream-200">
                {items.map(item => {
                  const key = `${item.product.id}::${item.selectedWeight?.label ?? 'default'}`;
                  return (
                    <div key={key} className="flex items-start gap-4">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-charcoal-900 font-semibold text-sm line-clamp-1">{item.product.name}</p>
                        {item.selectedWeight && (
                          <p className="text-espresso-600 text-xs font-medium">{item.selectedWeight.label}</p>
                        )}
                        <p className="text-charcoal-600 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-espresso-700 font-bold text-sm shrink-0">${item.linePrice.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-600">Subtotal</span>
                  <span className="font-semibold text-charcoal-900">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-600">Shipping</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-green-600' : 'text-charcoal-900'}`}>
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-espresso-600 font-medium">Free shipping on orders over $50</p>
                )}
                <div className="flex justify-between pt-4 border-t-2 border-cream-200">
                  <span className="font-display font-bold text-charcoal-950">Total</span>
                  <span className="font-display text-2xl font-bold text-espresso-700">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-6 border-t-2 border-cream-200 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                Your order is protected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
