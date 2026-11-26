import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AdminAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime, formatPrice, getStatusAccent } from '../../utils/formatters.js';

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export default function AdminOrdersPage() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const currency = settings?.currency_code || 'PKR';

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.listOrders({ status: statusFilter, search: search.trim(), limit: 30 });
      setOrders(res.orders || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const openOrder = async (orderId) => {
    try {
      const res = await AdminAPI.getOrderDetails(orderId);
      setSelectedOrder(res.order);
      setNextStatus(res.order.status);
      setStatusNote('');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const res = await AdminAPI.updateOrderStatus(selectedOrder.id, nextStatus, statusNote.trim() || null);
      showToast(res.message);
      await openOrder(selectedOrder.id);
      await loadOrders();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#2A1B12]">Order Management</h1>
          <p className="mt-1 text-sm text-[#6E5A4F]">
            Inspect customer orders, update fulfillment progress, and manage cancellations safely.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, name, phone..."
            className="rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-xs focus:border-[#B86B2B] focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-xs"
          >
            <option value="all">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorNotice message={error} onRetry={loadOrders} />}

      <div className="border border-[#E5D9C8] bg-white p-6">
        {loading ? (
          <div className="h-44 animate-pulse bg-[#F3ECE1]" />
        ) : orders.length === 0 ? (
          <p className="text-sm text-[#6E5A4F]">No matching orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5D9C8] text-[#6E5A4F]">
                  <th className="py-2.5 font-medium">Order #</th>
                  <th className="py-2.5 font-medium">Customer</th>
                  <th className="py-2.5 font-medium">Type</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 text-right font-medium">Total</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D9C8]">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FAF6F0]">
                    <td className="py-3 font-mono font-semibold text-[#2A1B12]">
                      {ord.order_number}
                      <span className="block font-sans text-[11px] font-normal text-[#6E5A4F]">
                        {formatDateTime(ord.created_at)}
                      </span>
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-[#2A1B12]">{ord.customer_name}</p>
                      <p className="font-mono text-[11px] text-[#6E5A4F]">{ord.customer_phone}</p>
                    </td>
                    <td className="py-3 capitalize text-[#6E5A4F]">{ord.fulfillment_type}</td>
                    <td className="py-3">
                      <span className={`inline-block border px-2 py-0.5 text-[11px] font-medium ${getStatusAccent(ord.status)}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-semibold tabular-nums">
                      {formatPrice(ord.total_amount, currency)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openOrder(ord.id)}
                        className="rounded border border-[#2A1B12] px-3 py-1 text-[11px] font-medium hover:bg-[#2A1B12] hover:text-white"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer/Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8">
          <div className="w-full max-w-2xl border border-[#E5D9C8] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#E5D9C8] pb-4">
              <div>
                <h2 className="font-mono text-xl font-semibold text-[#2A1B12]">
                  {selectedOrder.order_number}
                </h2>
                <p className="text-xs text-[#6E5A4F]">
                  {selectedOrder.customer_name} · {selectedOrder.customer_email} · {selectedOrder.customer_phone}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
              <div className="border border-[#E5D9C8] p-3">
                <p className="font-semibold text-[#2A1B12]">Fulfillment</p>
                <p className="mt-1 capitalize text-[#6E5A4F]">
                  {selectedOrder.fulfillment_type} ({selectedOrder.payment_method.replace(/_/g, ' ')})
                </p>
                {selectedOrder.delivery_address && (
                  <p className="mt-1 text-[#2A1B12]">{selectedOrder.delivery_address}</p>
                )}
                {selectedOrder.order_notes && (
                  <p className="mt-1 text-[#6E5A4F]">Note: {selectedOrder.order_notes}</p>
                )}
              </div>
              <div className="border border-[#E5D9C8] p-3">
                <p className="font-semibold text-[#2A1B12]">Totals</p>
                <p className="mt-1 font-mono tabular-nums">Subtotal: {formatPrice(selectedOrder.subtotal, currency)}</p>
                <p className="font-mono tabular-nums">Discount: {formatPrice(selectedOrder.discount_amount, currency)}</p>
                <p className="mt-1 font-mono font-semibold text-[#2A1B12] tabular-nums">
                  Total: {formatPrice(selectedOrder.total_amount, currency)}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-semibold text-[#2A1B12]">Ordered Items</h3>
              <ul className="mt-2 divide-y divide-[#E5D9C8] border border-[#E5D9C8] text-xs">
                {selectedOrder.items.map((item) => (
                  <li key={item.id} className="flex justify-between p-3">
                    <div>
                      <p className="font-medium text-[#2A1B12]">
                        {item.quantity} × {item.product_name_snapshot}
                      </p>
                      {item.selected_options?.length > 0 && (
                        <p className="text-[#6E5A4F]">
                          {item.selected_options.map((o) => `${o.group}: ${o.name}`).join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatPrice(item.line_total, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedOrder.status !== 'Cancelled' && (
              <form onSubmit={handleUpdateStatus} className="mt-5 border border-[#E5D9C8] bg-[#FAF6F0] p-4">
                <h3 className="text-xs font-semibold text-[#2A1B12]">Update Order Status</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="rounded border border-[#E5D9C8] bg-white px-3 py-2 text-xs"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional status note..."
                    className="rounded border border-[#E5D9C8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="mt-3 rounded bg-[#B86B2B] px-4 py-2 text-xs font-medium text-white hover:bg-[#9A551E]"
                >
                  {updating ? 'Updating...' : 'Save Status Update'}
                </button>
              </form>
            )}

            <div className="mt-5">
              <h3 className="text-xs font-semibold text-[#2A1B12]">Status History</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-[#6E5A4F]">
                {selectedOrder.status_history.map((h) => (
                  <li key={h.id} className="flex justify-between gap-3">
                    <span>
                      <strong className="text-[#2A1B12]">{h.to_status}</strong>
                      {h.note ? ` — ${h.note}` : ''}
                      {h.changed_by_name ? ` (${h.changed_by_name})` : ''}
                    </span>
                    <span className="font-mono tabular-nums">{formatDateTime(h.created_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
