import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { OrderAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import CoffeeImage from '../../components/CoffeeImage.jsx';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime, formatPrice, getStatusAccent } from '../../utils/formatters.js';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [reviewingItemId, setReviewingItemId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await OrderAPI.getMyOrderDetails(id);
      setOrder(data.order);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      await OrderAPI.cancelMyOrder(order.id, cancelReason.trim() || 'Cancelled by customer');
      showToast('Order cancelled and inventory restored.');
      setConfirmCancelOpen(false);
      await loadOrder();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingItemId) return;
    setSubmittingReview(true);
    try {
      await OrderAPI.submitReview({
        order_item_id: reviewingItemId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      showToast('Review submitted for approval. Thank you!');
      setReviewingItemId(null);
      setReviewComment('');
      setReviewRating(5);
      await loadOrder();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const currency = settings?.currency_code || 'PKR';

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse border border-[#E5D9C8] bg-[#EFE6D8]/50" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorNotice message={error || 'Order not found.'} onRetry={loadOrder} />
      </div>
    );
  }

  const canCancel = ['Pending', 'Confirmed'].includes(order.status);
  const canReview = order.status === 'Delivered';

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E5A4F] hover:text-[#2A1B12]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to My Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-[#E5D9C8] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold text-[#2A1B12] sm:text-3xl">
              {order.order_number}
            </h1>
            <span className={`border px-3 py-1 text-xs font-semibold ${getStatusAccent(order.status)}`}>
              {order.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#6E5A4F] tabular-nums">
            Placed {formatDateTime(order.created_at)} ·{' '}
            {order.fulfillment_type === 'delivery' ? 'Cash on Delivery' : 'Pay at Pickup'}
          </p>
        </div>

        {canCancel && !confirmCancelOpen && (
          <button
            type="button"
            onClick={() => setConfirmCancelOpen(true)}
            className="rounded-md border border-[#991B1B]/40 px-4 py-2 text-xs font-medium text-[#991B1B] hover:bg-[#991B1B]/5"
          >
            Cancel Order
          </button>
        )}
      </div>

      {confirmCancelOpen && (
        <div className="mt-6 border border-[#991B1B]/30 bg-[#FDFBF7] p-5">
          <p className="text-sm font-semibold text-[#2A1B12]">Confirm Order Cancellation</p>
          <p className="mt-1 text-xs text-[#6E5A4F]">
            Cancelling will immediately restore all reserved inventory back to stock.
          </p>
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation (optional)"
            className="mt-3 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-xs focus:border-[#991B1B] focus:outline-none"
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancelOrder}
              className="rounded-md bg-[#991B1B] px-4 py-2 text-xs font-medium text-white hover:bg-[#7F1D1D] disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancelOpen(false)}
              className="rounded-md border border-[#E5D9C8] px-4 py-2 text-xs font-medium text-[#6E5A4F]"
            >
              Keep Order
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Items & Verified Reviews */}
        <div className="space-y-4 lg:col-span-7">
          <h2 className="font-editorial text-2xl font-semibold text-[#2A1B12]">Ordered Items</h2>
          <div className="divide-y divide-[#E5D9C8] border border-[#E5D9C8] bg-[#FDFBF7]">
            {order.items.map((item) => {
              const effectiveUnit = Number(item.unit_price_snapshot) + Number(item.options_price_delta);
              return (
                <div key={item.id} className="p-5">
                  <div className="flex gap-4">
                    <div className="h-16 w-20 shrink-0 overflow-hidden bg-[#F3ECE1]">
                      <CoffeeImage
                        src={item.product_image_snapshot}
                        alt={item.product_name_snapshot}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#2A1B12]">{item.product_name_snapshot}</p>
                          {item.selected_options?.length > 0 && (
                            <p className="mt-0.5 text-xs text-[#6E5A4F]">
                              {item.selected_options.map((o) => `${o.group}: ${o.name}`).join(' · ')}
                            </p>
                          )}
                          <p className="mt-1 font-mono text-xs text-[#6E5A4F] tabular-nums">
                            {item.quantity} × {formatPrice(effectiveUnit, currency)}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-semibold text-[#2A1B12] tabular-nums">
                          {formatPrice(item.line_total, currency)}
                        </span>
                      </div>

                      {/* Review Eligibility Action */}
                      {canReview && (
                        <div className="mt-3 border-t border-[#E5D9C8] pt-3">
                          {item.review_id ? (
                            <p className="text-xs text-[#2D6A4F]">
                              Reviewed ({item.review_rating}/5) · Status: {item.review_status}
                            </p>
                          ) : reviewingItemId === item.id ? (
                            <form onSubmit={handleReviewSubmit} className="space-y-3 bg-[#FAF6F0] p-3 border border-[#E5D9C8]">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-[#2A1B12]">Rating:</span>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    aria-label={`Rate ${star} stars`}
                                    className="p-0.5"
                                  >
                                    <Star
                                      className={`h-4 w-4 ${
                                        star <= reviewRating
                                          ? 'fill-[#B86B2B] text-[#B86B2B]'
                                          : 'text-[#6E5A4F]/40'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                              <textarea
                                required
                                rows={2}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Share how this coffee or pastry tasted..."
                                className="w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-xs focus:border-[#B86B2B] focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={submittingReview}
                                  className="rounded-md bg-[#2A1B12] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#B86B2B]"
                                >
                                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReviewingItemId(null)}
                                  className="rounded-md border border-[#E5D9C8] px-3 py-1.5 text-xs text-[#6E5A4F]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingItemId(item.id);
                                setReviewRating(5);
                                setReviewComment('');
                              }}
                              className="text-xs font-semibold text-[#9A551E] hover:underline"
                            >
                              Write Verified Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary & Status History */}
        <div className="space-y-6 lg:col-span-5">
          <div className="border border-[#E5D9C8] bg-[#FDFBF7] p-6">
            <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Receipt &amp; Delivery</h2>
            <dl className="mt-4 space-y-2 text-xs text-[#6E5A4F]">
              <div className="flex justify-between">
                <dt>Customer</dt>
                <dd className="font-medium text-[#2A1B12]">{order.customer_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Phone</dt>
                <dd className="font-mono text-[#2A1B12] tabular-nums">{order.customer_phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Fulfillment</dt>
                <dd className="font-medium capitalize text-[#2A1B12]">{order.fulfillment_type}</dd>
              </div>
              {order.delivery_address && (
                <div>
                  <dt className="mb-0.5">Delivery Address</dt>
                  <dd className="text-[#2A1B12]">{order.delivery_address}</dd>
                </div>
              )}
              {order.order_notes && (
                <div>
                  <dt className="mb-0.5">Notes</dt>
                  <dd className="text-[#2A1B12]">{order.order_notes}</dd>
                </div>
              )}
            </dl>

            <dl className="mt-5 space-y-2 border-t border-[#E5D9C8] pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#6E5A4F]">Subtotal</dt>
                <dd className="font-mono tabular-nums">{formatPrice(order.subtotal, currency)}</dd>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-[#2D6A4F]">
                  <dt>Discount ({order.coupon_code_snapshot})</dt>
                  <dd className="font-mono tabular-nums">
                    −{formatPrice(order.discount_amount, currency)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-[#E5D9C8] pt-3 font-semibold text-[#2A1B12]">
                <dt>Total</dt>
                <dd className="font-mono tabular-nums">{formatPrice(order.total_amount, currency)}</dd>
              </div>
            </dl>
          </div>

          <div className="border border-[#E5D9C8] bg-[#FDFBF7] p-6">
            <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Status Timeline</h2>
            <ol className="mt-4 space-y-4">
              {order.status_history.map((entry) => (
                <li key={entry.id} className="border-b border-[#E5D9C8] pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#2A1B12]">{entry.to_status}</span>
                    <span className="font-mono text-[#6E5A4F] tabular-nums">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </div>
                  {entry.note && <p className="mt-1 text-xs text-[#6E5A4F]">{entry.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
