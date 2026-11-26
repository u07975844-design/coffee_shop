import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { OrderAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { EmptyState, ErrorNotice } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatDateTime, formatPrice, getStatusAccent } from '../../utils/formatters.js';

export default function MyOrdersPage() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await OrderAPI.getMyOrders(page);
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, total_pages: 1 });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
  }, []);

  const currency = settings?.currency_code || 'PKR';

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E5D9C8] pb-6">
        <h1 className="font-editorial text-4xl font-semibold text-[#2A1B12]">My Orders</h1>
        <p className="mt-1 text-sm text-[#6E5A4F]">
          Track active preparations, inspect past receipts, or review delivered items.
        </p>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse border border-[#E5D9C8] bg-[#EFE6D8]/50" />
            ))}
          </div>
        ) : error ? (
          <ErrorNotice message={error} onRetry={() => loadOrders(1)} />
        ) : orders.length === 0 ? (
          <EmptyState
            title="You have not placed any orders yet"
            description="Once you place a pickup or delivery order, it will appear here with real-time status updates."
            action={
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-md bg-[#2A1B12] px-5 py-2.5 text-sm font-medium text-[#FAF6F0]"
              >
                Explore Menu <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex flex-col justify-between gap-4 border border-[#E5D9C8] bg-[#FDFBF7] p-5 transition-colors hover:border-[#B86B2B] sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[#2A1B12]">
                      {order.order_number}
                    </span>
                    <span className={`border px-2.5 py-0.5 text-xs font-medium ${getStatusAccent(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#6E5A4F] tabular-nums">
                    {formatDateTime(order.created_at)} · {order.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'} · {order.total_units} items
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-mono text-base font-semibold text-[#2A1B12] tabular-nums">
                    {formatPrice(order.total_amount, currency)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9A551E]">
                    Details <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {pagination.total_pages > 1 && (
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => loadOrders(pagination.page - 1)}
            className="rounded-md border border-[#E5D9C8] bg-[#FDFBF7] px-4 py-2 text-xs font-medium disabled:opacity-40"
          >
            Previous
          </button>
          <span className="self-center font-mono text-xs text-[#6E5A4F]">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.total_pages}
            onClick={() => loadOrders(pagination.page + 1)}
            className="rounded-md border border-[#E5D9C8] bg-[#FDFBF7] px-4 py-2 text-xs font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
