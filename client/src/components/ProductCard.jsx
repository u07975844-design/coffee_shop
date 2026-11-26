import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import CoffeeImage from './CoffeeImage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/formatters.js';

export default function ProductCard({ product, currency = 'PKR' }) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const outOfStock = !product.is_available || Number(product.stock_quantity) <= 0;
  const lowStock =
    !outOfStock && Number(product.stock_quantity) <= Number(product.low_stock_threshold || 5);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product, [], 1);
    showToast(`${product.name} added to your cart.`);
  };

  const availabilityText = outOfStock
    ? 'Out of Stock'
    : lowStock
    ? `Only ${product.stock_quantity} left`
    : 'In Stock';

  return (
    <article className="group flex flex-col border border-[#E5D9C8] bg-[#FDFBF7] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/product/${product.slug}`} className="block overflow-hidden bg-[#F3ECE1]">
        <CoffeeImage
          src={product.image_url}
          alt={product.name}
          fallbackTitle={product.name}
          className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {/* Unboxed zero-pill metadata line */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6E5A4F]">
          <span className="font-medium text-[#9A551E]">{product.category_name}</span>
          <span aria-hidden="true">·</span>
          <span className={outOfStock ? 'font-medium text-[#991B1B]' : ''}>{availabilityText}</span>
          {Number(product.review_count) > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Star className="h-3 w-3 fill-[#B86B2B] text-[#B86B2B]" />
                {Number(product.avg_rating).toFixed(1)}
              </span>
            </>
          )}
        </div>

        <Link
          to={`/product/${product.slug}`}
          className="mt-2 font-editorial text-lg font-semibold leading-snug text-[#2A1B12] transition-colors group-hover:text-[#9A551E]"
        >
          {product.name}
        </Link>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[#6E5A4F]">
          {product.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E5D9C8] pt-4">
          <span className="font-mono text-sm font-semibold text-[#2A1B12] tabular-nums">
            {formatPrice(product.base_price, currency)}
          </span>

          <div className="flex items-center gap-2">
            <Link
              to={`/product/${product.slug}`}
              className="whitespace-nowrap px-3 py-2 text-xs font-medium text-[#6E5A4F] transition-colors hover:text-[#2A1B12]"
            >
              Options
            </Link>
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={outOfStock}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-medium transition-colors ${
                outOfStock
                  ? 'cursor-not-allowed bg-[#E5D9C8] text-[#6E5A4F]'
                  : 'bg-[#2A1B12] text-[#FAF6F0] hover:bg-[#B86B2B]'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              {outOfStock ? 'Unavailable' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
