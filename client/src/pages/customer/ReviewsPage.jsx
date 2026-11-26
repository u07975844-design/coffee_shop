import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { PublicAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { EmptyState, ErrorNotice } from '../../components/StateViews.jsx';
import { formatDate } from '../../utils/formatters.js';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PublicAPI.getReviews(40);
      setReviews(data.reviews || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E5D9C8] pb-8">
        <div>
          <p className="text-xs font-medium text-[#9A551E]">Verified &amp; Sample Guest Feedback</p>
          <h1 className="mt-2 font-editorial text-4xl font-semibold text-[#2A1B12]">Customer Reviews</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6E5A4F]">
            Customers can submit one verified review per purchased item once their order status reaches Delivered.
          </p>
        </div>

        <Link
          to="/orders"
          className="rounded-md border border-[#2A1B12] px-4 py-2 text-xs font-medium text-[#2A1B12] hover:bg-[#2A1B12] hover:text-white"
        >
          Review a Delivered Order
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse border border-[#E5D9C8] bg-[#EFE6D8]/50" />
            ))}
          </div>
        ) : error ? (
          <ErrorNotice message={error} onRetry={loadReviews} />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No approved reviews yet"
            description="Reviews appear here once fulfilled customers share their feedback and an administrator approves them."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((rev) => (
              <article key={rev.id} className="flex flex-col justify-between border border-[#E5D9C8] bg-[#FDFBF7] p-6">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6E5A4F]">
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#B86B2B]">
                      <Star className="h-3.5 w-3.5 fill-[#B86B2B]" />
                      {rev.rating}.0 / 5
                    </span>
                    <span>{formatDate(rev.created_at)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#2A1B12]">“{rev.comment}”</p>
                </div>

                <div className="mt-5 border-t border-[#E5D9C8] pt-3 text-xs text-[#6E5A4F]">
                  <p className="font-semibold text-[#2A1B12]">{rev.display_name}</p>
                  <p className="mt-0.5">
                    <Link to={`/product/${rev.product_slug}`} className="text-[#9A551E] hover:underline">
                      {rev.product_name}
                    </Link>
                    {' · '}
                    <span>{rev.is_sample ? 'Sample Review' : 'Verified Purchase'}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
