import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { AdminAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, getStatusAccent } from '../../utils/formatters.js';

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.listReviews(statusFilter);
      setReviews(res.reviews || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleStatus = async (id, status) => {
    try {
      const res = await AdminAPI.updateReviewStatus(id, status);
      showToast(res.message);
      await loadReviews();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await AdminAPI.deleteReview(id);
      showToast(res.message);
      await loadReviews();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#2A1B12]">Reviews Moderation</h1>
          <p className="mt-1 text-sm text-[#6E5A4F]">
            Approve verified customer reviews for public display, hide entries, or remove inappropriate submissions.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-[#E5D9C8] bg-white p-1">
          {['all', 'pending', 'approved', 'hidden'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded px-3 py-1.5 text-xs font-medium capitalize ${
                statusFilter === tab ? 'bg-[#2A1B12] text-white' : 'text-[#6E5A4F]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorNotice message={error} onRetry={loadReviews} />}

      {loading ? (
        <div className="h-44 animate-pulse border border-[#E5D9C8] bg-white" />
      ) : reviews.length === 0 ? (
        <div className="border border-[#E5D9C8] bg-white p-8 text-center text-sm text-[#6E5A4F]">
          No reviews match this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="border border-[#E5D9C8] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-[#2A1B12]">{rev.product_name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#B86B2B]">
                      <Star className="h-3.5 w-3.5 fill-[#B86B2B]" />
                      {rev.rating}/5
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={`border px-2 py-0.5 text-[11px] font-medium capitalize ${getStatusAccent(rev.status)}`}>
                      {rev.status}
                    </span>
                    {rev.is_sample ? <span className="text-[#9A551E]">· Sample Seed Data</span> : null}
                  </div>

                  <p className="mt-2 text-sm text-[#2A1B12]">{rev.comment}</p>
                  <p className="mt-2 text-xs text-[#6E5A4F]">
                    By {rev.display_name} ({rev.reviewer_email}) · {formatDate(rev.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {rev.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleStatus(rev.id, 'approved')}
                      className="rounded border border-[#2D6A4F]/40 px-3 py-1.5 text-xs font-medium text-[#2D6A4F] hover:bg-[#2D6A4F]/10"
                    >
                      Approve
                    </button>
                  )}
                  {rev.status !== 'hidden' && (
                    <button
                      type="button"
                      onClick={() => handleStatus(rev.id, 'hidden')}
                      className="rounded border border-[#E5D9C8] px-3 py-1.5 text-xs font-medium text-[#6E5A4F] hover:text-[#2A1B12]"
                    >
                      Hide
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Delete review"
                    onClick={() => handleDelete(rev.id)}
                    className="rounded border border-[#E5D9C8] p-1.5 text-[#991B1B] hover:bg-[#991B1B]/5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
