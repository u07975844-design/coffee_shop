import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import { PublicAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import CoffeeImage from '../../components/CoffeeImage.jsx';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatPrice } from '../../utils/formatters.js';

export default function ProductDetailPage() {
  const { idOrSlug } = useParams();
  const { settings } = useSettings();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedByGroup, setSelectedByGroup] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PublicAPI.getProductDetails(idOrSlug);
      const prod = data.product;
      setProduct(prod);

      // Pre-select first available option per option_group
      const defaults = {};
      for (const opt of prod.options || []) {
        if (!defaults[opt.option_group]) {
          const isOptAvailable = !opt.track_stock || Number(opt.stock_quantity) > 0;
          if (isOptAvailable) {
            defaults[opt.option_group] = opt.id;
          }
        }
      }
      setSelectedByGroup(defaults);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    setQuantity(1);
  }, [idOrSlug]);

  const groupedOptions = useMemo(() => {
    if (!product?.options) return [];
    const map = new Map();
    for (const opt of product.options) {
      if (!map.has(opt.option_group)) map.set(opt.option_group, []);
      map.get(opt.option_group).push(opt);
    }
    return [...map.entries()];
  }, [product]);

  const selectedOptionsList = useMemo(() => {
    if (!product?.options) return [];
    const chosenIds = new Set(Object.values(selectedByGroup));
    return product.options.filter((o) => chosenIds.has(o.id));
  }, [product, selectedByGroup]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    const delta = selectedOptionsList.reduce((sum, o) => sum + Number(o.price_delta || 0), 0);
    return Number(product.base_price) + delta;
  }, [product, selectedOptionsList]);

  const maxStockAvailable = useMemo(() => {
    if (!product || !product.is_available) return 0;
    let maxQty = Number(product.stock_quantity || 0);
    for (const opt of selectedOptionsList) {
      if (opt.track_stock) {
        maxQty = Math.min(maxQty, Number(opt.stock_quantity || 0));
      }
    }
    return maxQty;
  }, [product, selectedOptionsList]);

  const currency = settings?.currency_code || 'PKR';

  const handleAddToCart = () => {
    if (!product || maxStockAvailable <= 0) return;
    addItem(product, selectedOptionsList, quantity);
    showToast(`Added ${quantity} × ${product.name} to your cart.`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid animate-pulse gap-10 lg:grid-cols-12">
          <div className="aspect-[4/3] bg-[#EFE6D8] lg:col-span-6" />
          <div className="space-y-4 lg:col-span-6">
            <div className="h-4 w-32 rounded bg-[#EFE6D8]" />
            <div className="h-9 w-3/4 rounded bg-[#EFE6D8]" />
            <div className="h-24 w-full rounded bg-[#EFE6D8]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorNotice message={error || 'Product not found.'} onRetry={loadProduct} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        to="/menu"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E5A4F] hover:text-[#2A1B12]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Full Menu
      </Link>

      {/* Contiguous Purchase Module */}
      <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:sticky lg:top-24 lg:col-span-6">
          <div className="overflow-hidden border border-[#E5D9C8] bg-[#F3ECE1]">
            <CoffeeImage
              src={product.image_url}
              alt={product.name}
              fallbackTitle={product.name}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>

        <div className="border border-[#E5D9C8] bg-[#FDFBF7] p-6 sm:p-8 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E5A4F]">
            <Link to={`/menu?category=${product.category_slug}`} className="font-medium text-[#9A551E] hover:underline">
              {product.category_name}
            </Link>
            <span aria-hidden="true">·</span>
            <span className={maxStockAvailable <= 0 ? 'font-medium text-[#991B1B]' : ''}>
              {maxStockAvailable > 0 ? `${maxStockAvailable} in stock` : 'Out of Stock'}
            </span>
            {Number(product.review_count) > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Star className="h-3.5 w-3.5 fill-[#B86B2B] text-[#B86B2B]" />
                  {Number(product.avg_rating).toFixed(1)} ({product.review_count} reviews)
                </span>
              </>
            )}
          </div>

          <h1 className="mt-3 font-editorial text-3xl font-semibold text-[#2A1B12] sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 font-mono text-2xl font-semibold text-[#2A1B12] tabular-nums">
            {formatPrice(unitPrice, currency)}
          </p>

          <p className="mt-4 text-sm leading-relaxed text-[#6E5A4F] sm:text-base">
            {product.description}
          </p>

          {(product.tasting_notes || product.origin) && (
            <dl className="mt-6 grid grid-cols-1 gap-3 border-y border-[#E5D9C8] py-4 text-xs sm:grid-cols-2">
              {product.tasting_notes && (
                <div>
                  <dt className="font-semibold text-[#2A1B12]">Tasting Notes</dt>
                  <dd className="mt-0.5 text-[#6E5A4F]">{product.tasting_notes}</dd>
                </div>
              )}
              {product.origin && (
                <div>
                  <dt className="font-semibold text-[#2A1B12]">Origin / Batch</dt>
                  <dd className="mt-0.5 text-[#6E5A4F]">{product.origin}</dd>
                </div>
              )}
            </dl>
          )}

          {/* Product Options */}
          {groupedOptions.length > 0 && (
            <div className="mt-6 space-y-5">
              {groupedOptions.map(([groupName, options]) => (
                <div key={groupName}>
                  <label className="block text-xs font-semibold text-[#2A1B12]">{groupName}</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {options.map((opt) => {
                      const isSelected = selectedByGroup[groupName] === opt.id;
                      const isDisabled = opt.track_stock && Number(opt.stock_quantity) <= 0;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() =>
                            setSelectedByGroup((prev) => ({ ...prev, [groupName]: opt.id }))
                          }
                          className={`rounded-md border px-3.5 py-2 text-xs font-medium transition-colors ${
                            isDisabled
                              ? 'cursor-not-allowed border-[#E5D9C8] bg-[#F3ECE1] text-[#6E5A4F]/50 line-through'
                              : isSelected
                              ? 'border-[#2A1B12] bg-[#2A1B12] text-[#FAF6F0]'
                              : 'border-[#E5D9C8] bg-white text-[#2A1B12] hover:border-[#B86B2B]'
                          }`}
                        >
                          {opt.option_name}
                          {Number(opt.price_delta) > 0 && (
                            <span className="ml-1.5 font-mono opacity-80 tabular-nums">
                              (+{formatPrice(opt.price_delta, currency)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity & Add CTA */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center justify-between rounded-md border border-[#E5D9C8] bg-white px-2 py-1.5 sm:w-36">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1.5 text-[#6E5A4F] hover:text-[#2A1B12]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-mono text-sm font-semibold tabular-nums">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() =>
                  setQuantity((q) => Math.min(Math.max(1, maxStockAvailable), q + 1))
                }
                className="p-1.5 text-[#6E5A4F] hover:text-[#2A1B12]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={maxStockAvailable <= 0}
              onClick={handleAddToCart}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-colors ${
                maxStockAvailable <= 0
                  ? 'cursor-not-allowed bg-[#E5D9C8] text-[#6E5A4F]'
                  : 'bg-[#B86B2B] text-white hover:bg-[#9A551E]'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {maxStockAvailable <= 0
                ? 'Currently Out of Stock'
                : `Add to Cart · ${formatPrice(unitPrice * quantity, currency)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <section className="mt-16 border-t border-[#E5D9C8] pt-12">
        <h2 className="font-editorial text-2xl font-semibold text-[#2A1B12]">
          Customer Reviews ({product.reviews?.length || 0})
        </h2>
        {!product.reviews || product.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-[#6E5A4F]">
            No approved reviews for this item yet. Verified buyers can leave a review after delivery.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="border border-[#E5D9C8] bg-[#FDFBF7] p-5">
                <div className="flex items-center justify-between text-xs text-[#6E5A4F]">
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#B86B2B]">
                    <Star className="h-3.5 w-3.5 fill-[#B86B2B]" />
                    {rev.rating}.0 / 5
                  </span>
                  <span>{formatDate(rev.created_at)}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#2A1B12]">{rev.comment}</p>
                <p className="mt-3 text-xs text-[#6E5A4F]">
                  {rev.display_name} · {rev.is_sample ? 'Sample Review' : 'Verified Purchase'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
