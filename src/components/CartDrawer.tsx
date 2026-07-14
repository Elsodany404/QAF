import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onCheckout: () => void;
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeCart}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-b from-cream-50 to-cream-100 z-50 flex flex-col shadow-soft-xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-200 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-espresso-600 to-mocha-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-cream-50" />
            </div>
            <h2 className="font-display text-lg font-bold text-charcoal-900">
              Cart
              {totalItems > 0 && (
                <span className="ml-2 text-sm font-normal text-espresso-600">({totalItems})</span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-charcoal-600 hover:bg-cream-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 rounded-full bg-cream-300 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-cream-600" />
              </div>
              <p className="text-charcoal-700 font-semibold text-base">Cart is empty</p>
              <p className="text-charcoal-500 text-sm mt-1">Start adding some premium coffee!</p>
              <button
                onClick={closeCart}
                className="premium-button-primary text-sm mt-6"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => {
              const key = `${item.product.id}::${item.selectedWeight?.label ?? 'default'}`;
              return (
                <div key={key} className="premium-card p-4 animate-fade-in">
                  <div className="flex gap-4">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-charcoal-900 font-semibold text-sm leading-snug line-clamp-2">
                        {item.product.name}
                      </p>
                      {item.selectedWeight && (
                        <p className="text-espresso-600 text-xs mt-0.5 font-medium">{item.selectedWeight.label}</p>
                      )}
                      <p className="text-espresso-700 font-bold text-sm mt-1">
                        ${item.linePrice.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.selectedWeight?.label ?? null)}
                      className="p-1.5 text-charcoal-400 hover:text-red-500 transition-colors self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream-200">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.selectedWeight?.label ?? null, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-cream-200 hover:bg-espresso-600 hover:text-white flex items-center justify-center transition-all text-charcoal-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-charcoal-800 text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.selectedWeight?.label ?? null, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-cream-200 hover:bg-espresso-600 hover:text-white flex items-center justify-center transition-all text-charcoal-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-cream-200 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-charcoal-700 font-semibold">Subtotal</span>
              <span className="text-espresso-700 font-display text-xl">${totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-charcoal-500 text-xs mb-4 text-center">Shipping & taxes at checkout</p>
            <button
              onClick={() => { closeCart(); onCheckout(); }}
              className="w-full premium-button-primary gap-2 justify-center"
            >
              Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
