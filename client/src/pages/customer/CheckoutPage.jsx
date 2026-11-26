import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrderAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { EmptyState } from '../../components/StateViews.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatPrice } from '../../utils/formatters.js';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, discountAmount, total, appliedOffer, clearCart } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [fulfillmentType, setFulfillmentType] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.default_address || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currency = settings?.currency_code || 'PKR';
  const paymentMethod = fulfillmentType === 'delivery' ? 'cash_on_delivery' : 'pay_at_pickup';

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="Your cart is empty"
          description="Add coffee or pastries to your cart before checking out."
          action={
            <Link
              to="/menu"
              className="rounded-md bg-[#2A1B12] px-5 py-2.5 text-sm font-medium text-[#FAF6F0]"
            >
              Browse Menu
            </Link>
          }
        />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (customerName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (customerPhone.trim().length < 7) {
      setError('Please enter a valid contact phone number.');
      return;
    }
    if (fulfillmentType === 'delivery' && deliveryAddress.trim().length < 8) {
      setError('Please enter your complete delivery street address.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        fulfillment_type: fulfillmentType,
        delivery_address: fulfillmentType === 'delivery' ? deliveryAddress.trim() : null,
        order_notes: orderNotes.trim() || null,
        payment_method: paymentMethod,
        coupon_code: appliedOffer?.coupon_code || null,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          option_ids: i.option_ids || [],
        })),
      };

      const res = await OrderAPI.placeOrder(payload);
      clearCart();
      showToast(`Order ${res.order.order_number} confirmed!`);
      navigate(`/orders/${res.order.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E5D9C8] pb-6">
        <h1 className="font-editorial text-4xl font-semibold text-[#2A1B12]">Checkout</h1>
        <p className="mt-1 text-sm text-[#6E5A4F]">
          Confirm your pickup or delivery details. Payment is settled upon delivery or pickup.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {error && (
            <div className="border border-[#991B1B]/30 bg-[#991B1B]/5 p-4 text-sm text-[#991B1B]">
              {error}
            </div>
          )}

          <div className="border border-[#E5D9C8] bg-[#FDFBF7] p-6">
            <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Customer Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm text-[#2A1B12] focus:border-[#B86B2B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm text-[#2A1B12] focus:border-[#B86B2B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border border-[#E5D9C8] bg-[#FDFBF7] p-6">
            <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Fulfillment &amp; Payment</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`border p-4 text-left transition-colors ${
                  fulfillmentType === 'pickup'
                    ? 'border-[#2A1B12] bg-[#F3ECE1]'
                    : 'border-[#E5D9C8] bg-white hover:border-[#B86B2B]'
                }`}
              >
                <p className="text-sm font-semibold text-[#2A1B12]">Café Pickup</p>
                <p className="mt-1 text-xs text-[#6E5A4F]">Collect fresh at our Gulberg bar · Pay at Pickup</p>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`border p-4 text-left transition-colors ${
                  fulfillmentType === 'delivery'
                    ? 'border-[#2A1B12] bg-[#F3ECE1]'
                    : 'border-[#E5D9C8] bg-white hover:border-[#B86B2B]'
                }`}
              >
                <p className="text-sm font-semibold text-[#2A1B12]">Local Delivery</p>
                <p className="mt-1 text-xs text-[#6E5A4F]">Courier to your door · Cash on Delivery</p>
              </button>
            </div>

            {fulfillmentType === 'delivery' && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-[#6E5A4F]">Delivery Address *</label>
                <textarea
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House/Apartment number, street, sector/block, landmark"
                  className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm text-[#2A1B12] focus:border-[#B86B2B] focus:outline-none"
                />
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-medium text-[#6E5A4F]">Order Notes (Optional)</label>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Any preparation preferences, gate instructions, or cup notes..."
                className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm text-[#2A1B12] focus:border-[#B86B2B] focus:outline-none"
              />
            </div>

            <div className="mt-4 border-t border-[#E5D9C8] pt-4 text-xs text-[#6E5A4F]">
              Payment Method:{' '}
              <span className="font-semibold text-[#2A1B12]">
                {paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Pay at Pickup'}
              </span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <aside className="border border-[#E5D9C8] bg-[#FDFBF7] p-6 lg:col-span-5 lg:self-start">
          <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Order Summary</h2>
          <ul className="mt-4 divide-y divide-[#E5D9C8]">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-[#2A1B12]">
                    {item.quantity} × {item.name}
                  </p>
                  {item.selected_options?.length > 0 && (
                    <p className="text-xs text-[#6E5A4F]">
                      {item.selected_options.map((o) => o.name).join(', ')}
                    </p>
                  )}
                </div>
                <span className="font-mono text-sm font-medium tabular-nums">
                  {formatPrice(item.unit_price * item.quantity, currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-[#E5D9C8] pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#6E5A4F]">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatPrice(subtotal, currency)}</dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#2D6A4F]">
                <dt>Promo ({appliedOffer?.coupon_code})</dt>
                <dd className="font-mono tabular-nums">−{formatPrice(discountAmount, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-[#E5D9C8] pt-3 text-base font-semibold text-[#2A1B12]">
              <dt>Total Payable</dt>
              <dd className="font-mono tabular-nums">{formatPrice(total, currency)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-md bg-[#B86B2B] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#9A551E] disabled:opacity-60"
          >
            {submitting ? 'Confirming Order...' : 'Place Order'}
          </button>
        </aside>
      </form>
    </div>
  );
}
