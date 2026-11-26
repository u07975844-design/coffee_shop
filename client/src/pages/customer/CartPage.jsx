import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { PublicAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import CoffeeImage from '../../components/CoffeeImage.jsx';
import { EmptyState } from '../../components/StateViews.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatPrice } from '../../utils/formatters.js';

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    total,
    appliedOffer,
    setAppliedOffer,
    updateQuantity,
    removeItem,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState(appliedOffer?.coupon_code || '');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const currency = settings?.currency_code || 'PKR';

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const data = await PublicAPI.validateOffer(couponInput.trim(), subtotal);
      setAppliedOffer(data.offer);
      showToast(`Promo code ${data.offer.coupon_code} applied.`);
    } catch (err) {
      setCouponError(extractErrorMessage(err));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleProceed = () => {
    if (!isAuthenticated) {
      showToast('Please sign in or register to place your order.', 'error');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E5D9C8] pb-6">
        <h1 className="font-editorial text-4xl font-semibold text-[#2A1B12]">Shopping Cart</h1>
        <p className="mt-1 text-sm text-[#6E5A4F] tabular-nums">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} saved in your bag
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is currently empty"
            description="Browse our espresso bar, cold brews, and morning pastries to start an order."
            action={
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-md bg-[#2A1B12] px-5 py-2.5 text-sm font-medium text-[#FAF6F0] hover:bg-[#B86B2B]"
              >
                Explore Menu
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex flex-col gap-4 border border-[#E5D9C8] bg-[#FDFBF7] p-4 sm:flex-row sm:items-center"
              >
                <Link to={`/product/${item.slug}`} className="h-24 w-28 shrink-0 overflow-hidden bg-[#F3ECE1]">
                  <CoffeeImage
                    src={item.image_url}
                    alt={item.name}
                    fallbackTitle={item.name}
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="flex-1">
                  <Link
                    to={`/product/${item.slug}`}
                    className="font-editorial text-lg font-semibold text-[#2A1B12] hover:text-[#9A551E]"
                  >
                    {item.name}
                  </Link>
                  {item.selected_options?.length > 0 && (
                    <p className="mt-1 text-xs text-[#6E5A4F]">
                      {item.selected_options.map((o) => `${o.group}: ${o.name}`).join(' · ')}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs text-[#6E5A4F] tabular-nums">
                    {formatPrice(item.unit_price, currency)} each
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="inline-flex items-center rounded-md border border-[#E5D9C8] bg-white">
                    <button
                      type="button"
                      aria-label={`Decrease quantity for ${item.name}`}
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      className="p-2 text-[#6E5A4F] hover:text-[#2A1B12]"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono text-xs font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity for ${item.name}`}
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      className="p-2 text-[#6E5A4F] hover:text-[#2A1B12]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="w-24 text-right font-mono text-sm font-semibold text-[#2A1B12] tabular-nums">
                    {formatPrice(item.unit_price * item.quantity, currency)}
                  </span>

                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.key)}
                    className="p-1.5 text-[#6E5A4F] hover:text-[#991B1B]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="border border-[#E5D9C8] bg-[#FDFBF7] p-6 lg:col-span-4 lg:self-start">
            <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Order Summary</h2>

            <form onSubmit={handleApplyCoupon} className="mt-5">
              <label htmlFor="coupon-code" className="block text-xs font-medium text-[#6E5A4F]">
                Promo Code
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="coupon-code"
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. REVERIE15"
                  className="flex-1 rounded-md border border-[#E5D9C8] bg-white px-3 py-2 font-mono text-xs uppercase text-[#2A1B12] focus:border-[#B86B2B] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="rounded-md border border-[#2A1B12] px-3.5 py-2 text-xs font-medium text-[#2A1B12] hover:bg-[#2A1B12] hover:text-white disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="mt-1.5 text-xs text-[#991B1B]">{couponError}</p>}
              {appliedOffer && (
                <div className="mt-2 flex items-center justify-between text-xs text-[#2D6A4F]">
                  <span>Applied: {appliedOffer.coupon_code}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedOffer(null);
                      setCouponInput('');
                    }}
                    className="underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </form>

            <dl className="mt-6 space-y-3 border-t border-[#E5D9C8] pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#6E5A4F]">Subtotal</dt>
                <dd className="font-mono font-medium tabular-nums">{formatPrice(subtotal, currency)}</dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#2D6A4F]">
                  <dt>Discount ({appliedOffer?.coupon_code})</dt>
                  <dd className="font-mono font-medium tabular-nums">
                    −{formatPrice(discountAmount, currency)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-[#E5D9C8] pt-3 text-base font-semibold text-[#2A1B12]">
                <dt>Total</dt>
                <dd className="font-mono tabular-nums">{formatPrice(total, currency)}</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs text-[#6E5A4F]">
              Final stock availability and pricing are verified by our server when you place your order.
            </p>

            <button
              type="button"
              onClick={handleProceed}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#B86B2B] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#9A551E]"
            >
              {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
