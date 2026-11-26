import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { PublicAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { EmptyState, ErrorNotice } from '../../components/StateViews.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatPrice } from '../../utils/formatters.js';

export default function OffersPage() {
  const { settings } = useSettings();
  const { setAppliedOffer } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PublicAPI.getOffers();
      setOffers(data.offers || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleApplyOffer = (offer) => {
    setAppliedOffer(offer);
    showToast(`Promo code ${offer.coupon_code} saved for your cart.`);
    navigate('/cart');
  };

  const currency = settings?.currency_code || 'PKR';

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E5D9C8] pb-8">
        <p className="text-xs font-medium text-[#9A551E]">Seasonal Savings</p>
        <h1 className="mt-2 font-editorial text-4xl font-semibold text-[#2A1B12]">
          Active Promotions &amp; Offers
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6E5A4F]">
          Only active offers within their valid promotional dates appear here and can be redeemed at checkout.
        </p>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse border border-[#E5D9C8] bg-[#EFE6D8]/50" />
            ))}
          </div>
        ) : error ? (
          <ErrorNotice message={error} onRetry={loadOffers} />
        ) : offers.length === 0 ? (
          <EmptyState
            title="No active promotions right now"
            description="Check back soon for new seasonal coffee pairings and roastery discount codes."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex flex-col justify-between border border-[#E5D9C8] bg-[#FDFBF7] p-6"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#9A551E]">
                    <Tag className="h-3.5 w-3.5" />
                    <span className="font-semibold">
                      {offer.discount_type === 'percentage'
                        ? `${Number(offer.discount_value)}% Discount`
                        : `${formatPrice(offer.discount_value, currency)} Discount`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Min. order {formatPrice(offer.min_order_amount, currency)}
                    </span>
                  </div>

                  <h2 className="mt-3 font-editorial text-2xl font-semibold text-[#2A1B12]">
                    {offer.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#6E5A4F]">
                    {offer.description}
                  </p>
                  <p className="mt-3 text-xs text-[#6E5A4F]">
                    Valid {formatDate(offer.starts_at)} – {formatDate(offer.expires_at)}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#E5D9C8] pt-4">
                  <div>
                    <span className="text-xs text-[#6E5A4F]">Coupon Code</span>
                    <p className="font-mono text-sm font-semibold text-[#2A1B12]">
                      {offer.coupon_code || 'NO CODE REQUIRED'}
                    </p>
                  </div>
                  {offer.coupon_code && (
                    <button
                      type="button"
                      onClick={() => handleApplyOffer(offer)}
                      className="rounded-md bg-[#2A1B12] px-4 py-2 text-xs font-medium text-[#FAF6F0] transition-colors hover:bg-[#B86B2B]"
                    >
                      Apply to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
