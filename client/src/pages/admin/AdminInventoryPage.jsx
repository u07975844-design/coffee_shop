import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AdminAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime } from '../../utils/formatters.js';

export default function AdminInventoryPage() {
  const { showToast } = useToast();

  const [filter, setFilter] = useState('all');
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [adjustTarget, setAdjustTarget] = useState(null);
  const [action, setAction] = useState('add');
  const [quantity, setQuantity] = useState(10);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, movRes] = await Promise.all([
        AdminAPI.listInventory(filter),
        AdminAPI.listInventoryMovements({ limit: 50 }),
      ]);
      setProducts(invRes.products || []);
      setVariants(invRes.variants || []);
      setMovements(movRes.movements || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [filter]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setSubmitting(true);
    try {
      await AdminAPI.adjustInventory({
        product_id: adjustTarget.product_id,
        option_id: adjustTarget.option_id || null,
        action,
        quantity: Number(quantity),
        reason: reason.trim(),
      });
      showToast('Stock updated and movement recorded.');
      setAdjustTarget(null);
      setReason('');
      await loadInventory();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#2A1B12]">Inventory Management</h1>
          <p className="mt-1 text-sm text-[#6E5A4F]">
            Track stock quantities, low-stock thresholds, adjustments, and automated order/cancellation movements.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-[#E5D9C8] bg-white p-1">
          {[
            { id: 'all', label: 'All Stock' },
            { id: 'low', label: 'Low Stock' },
            { id: 'out', label: 'Out of Stock' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                filter === tab.id ? 'bg-[#2A1B12] text-white' : 'text-[#6E5A4F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorNotice message={error} onRetry={loadInventory} />}

      {/* Product Stock */}
      <section className="border border-[#E5D9C8] bg-white p-6">
        <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Product Stock Levels</h2>
        {loading ? (
          <div className="mt-4 h-32 animate-pulse bg-[#F3ECE1]" />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5D9C8] text-[#6E5A4F]">
                  <th className="py-2.5 font-medium">Product</th>
                  <th className="py-2.5 font-medium">Category</th>
                  <th className="py-2.5 text-right font-medium">Current Stock</th>
                  <th className="py-2.5 text-right font-medium">Threshold</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D9C8]">
                {products.map((p) => {
                  const statusLabel =
                    p.stock_quantity === 0
                      ? 'Out of Stock'
                      : p.stock_quantity <= p.low_stock_threshold
                      ? 'Low Stock'
                      : 'Healthy';
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF6F0]">
                      <td className="py-3 font-semibold text-[#2A1B12]">{p.name}</td>
                      <td className="py-3 text-[#6E5A4F]">{p.category_name}</td>
                      <td className="py-3 text-right font-mono font-semibold tabular-nums">{p.stock_quantity}</td>
                      <td className="py-3 text-right font-mono text-[#6E5A4F] tabular-nums">
                        {p.low_stock_threshold}
                      </td>
                      <td className="py-3">
                        <span
                          className={`font-medium ${
                            p.stock_quantity === 0
                              ? 'text-[#991B1B]'
                              : p.stock_quantity <= p.low_stock_threshold
                              ? 'text-[#B45309]'
                              : 'text-[#2D6A4F]'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustTarget({
                              product_id: p.id,
                              option_id: null,
                              label: p.name,
                              current: p.stock_quantity,
                            });
                            setAction('add');
                            setQuantity(10);
                          }}
                          className="rounded border border-[#2A1B12] px-3 py-1 text-[11px] font-medium text-[#2A1B12] hover:bg-[#2A1B12] hover:text-white"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Separately Stocked Variants */}
      {variants.length > 0 && (
        <section className="border border-[#E5D9C8] bg-white p-6">
          <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Separately Stocked Variants</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5D9C8] text-[#6E5A4F]">
                  <th className="py-2.5 font-medium">Product</th>
                  <th className="py-2.5 font-medium">Option</th>
                  <th className="py-2.5 text-right font-medium">Stock</th>
                  <th className="py-2.5 text-right font-medium">Threshold</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D9C8]">
                {variants.map((v) => (
                  <tr key={v.option_id}>
                    <td className="py-3 font-semibold">{v.product_name}</td>
                    <td className="py-3 text-[#6E5A4F]">
                      {v.option_group}: {v.option_name}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold tabular-nums">{v.stock_quantity}</td>
                    <td className="py-3 text-right font-mono text-[#6E5A4F] tabular-nums">{v.low_stock_threshold}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustTarget({
                            product_id: v.product_id,
                            option_id: v.option_id,
                            label: `${v.product_name} — ${v.option_name}`,
                            current: v.stock_quantity,
                          });
                          setAction('add');
                          setQuantity(5);
                        }}
                        className="rounded border border-[#2A1B12] px-3 py-1 text-[11px] font-medium"
                      >
                        Adjust Variant
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Stock Movement History */}
      <section className="border border-[#E5D9C8] bg-white p-6">
        <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Stock Movement History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5D9C8] text-[#6E5A4F]">
                <th className="py-2.5 font-medium">Date</th>
                <th className="py-2.5 font-medium">Item</th>
                <th className="py-2.5 font-medium">Movement</th>
                <th className="py-2.5 text-right font-medium">Change</th>
                <th className="py-2.5 text-right font-medium">Balance</th>
                <th className="py-2.5 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D9C8]">
              {movements.map((mov) => (
                <tr key={mov.id}>
                  <td className="py-2.5 font-mono text-[11px] text-[#6E5A4F] tabular-nums">
                    {formatDateTime(mov.created_at)}
                  </td>
                  <td className="py-2.5 font-medium text-[#2A1B12]">
                    {mov.product_name}
                    {mov.option_name ? ` (${mov.option_name})` : ''}
                  </td>
                  <td className="py-2.5 text-[#6E5A4F]">{mov.movement_type}</td>
                  <td
                    className={`py-2.5 text-right font-mono font-semibold tabular-nums ${
                      mov.quantity_change >= 0 ? 'text-[#2D6A4F]' : 'text-[#991B1B]'
                    }`}
                  >
                    {mov.quantity_change > 0 ? `+${mov.quantity_change}` : mov.quantity_change}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[#6E5A4F] tabular-nums">
                    {mov.previous_stock} → {mov.new_stock}
                  </td>
                  <td className="py-2.5 text-[#6E5A4F]">
                    {mov.reason}
                    {mov.actor_name ? ` (${mov.actor_name})` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Adjust Stock Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleAdjust} className="w-full max-w-md border border-[#E5D9C8] bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-xl font-semibold">Adjust Inventory</h3>
              <button type="button" onClick={() => setAdjustTarget(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-[#6E5A4F]">
              {adjustTarget.label} · Current stock: <strong className="font-mono">{adjustTarget.current}</strong>
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Adjustment Type</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                >
                  <option value="add">Add Stock (+)</option>
                  <option value="reduce">Reduce Stock (−)</option>
                  <option value="set">Manual Count Override (=)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Quantity *</label>
                <input
                  type="number"
                  min={action === 'set' ? 0 : 1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Reason *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Morning batch baked, Damaged bag, Restock delivery"
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setAdjustTarget(null)} className="rounded border border-[#E5D9C8] px-4 py-2 text-xs">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="rounded bg-[#B86B2B] px-4 py-2 text-xs font-medium text-white">
                {submitting ? 'Saving...' : 'Save Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
