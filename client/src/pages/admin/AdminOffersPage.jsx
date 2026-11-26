import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { AdminAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatPrice } from '../../utils/formatters.js';

const EMPTY_OFFER = {
  id: null,
  title: '',
  description: '',
  coupon_code: '',
  discount_type: 'percentage',
  discount_value: 10,
  min_order_amount: 0,
  starts_at: new Date().toISOString().slice(0, 16),
  expires_at: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
  is_active: true,
};

export default function AdminOffersPage() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const currency = settings?.currency_code || 'PKR';

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_OFFER);
  const [saving, setSaving] = useState(false);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.listOffers();
      setOffers(res.offers || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const openEdit = (offer) => {
    setForm({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      coupon_code: offer.coupon_code || '',
      discount_type: offer.discount_type,
      discount_value: offer.discount_value,
      min_order_amount: offer.min_order_amount,
      starts_at: new Date(offer.starts_at).toISOString().slice(0, 16),
      expires_at: new Date(offer.expires_at).toISOString().slice(0, 16),
      is_active: Boolean(offer.is_active),
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await AdminAPI.updateOffer(form.id, form);
        showToast('Offer updated.');
      } else {
        await AdminAPI.createOffer(form);
        showToast('Offer created.');
      }
      setModalOpen(false);
      await loadOffers();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await AdminAPI.deleteOffer(id);
      showToast('Offer deleted.');
      await loadOffers();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#2A1B12]">Offers &amp; Promo Codes</h1>
          <p className="mt-1 text-sm text-[#6E5A4F]">
            Only active offers within their start and expiration window appear on the customer website.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_OFFER);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#B86B2B] px-4 py-2 text-xs font-medium text-white hover:bg-[#9A551E]"
        >
          <Plus className="h-3.5 w-3.5" />
          New Offer
        </button>
      </div>

      {error && <ErrorNotice message={error} onRetry={loadOffers} />}

      {loading ? (
        <div className="h-40 animate-pulse border border-[#E5D9C8] bg-white" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map((offer) => (
            <div key={offer.id} className="flex flex-col justify-between border border-[#E5D9C8] bg-white p-5">
              <div>
                <div className="flex items-center justify-between text-xs text-[#6E5A4F]">
                  <span className="font-mono font-semibold text-[#9A551E]">
                    {offer.coupon_code || 'NO CODE'}
                  </span>
                  <span className={offer.is_active ? 'text-[#2D6A4F]' : 'text-[#991B1B]'}>
                    {offer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h2 className="mt-2 font-editorial text-xl font-semibold text-[#2A1B12]">{offer.title}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6E5A4F]">{offer.description}</p>
                <p className="mt-3 font-mono text-xs text-[#2A1B12] tabular-nums">
                  {offer.discount_type === 'percentage'
                    ? `${offer.discount_value}% off`
                    : `${formatPrice(offer.discount_value, currency)} off`}{' '}
                  · Min {formatPrice(offer.min_order_amount, currency)}
                </p>
                <p className="mt-1 text-[11px] text-[#6E5A4F]">
                  {formatDate(offer.starts_at)} – {formatDate(offer.expires_at)}
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-[#E5D9C8] pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(offer)}
                  className="rounded border border-[#E5D9C8] px-3 py-1 text-xs font-medium hover:border-[#2A1B12]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-label="Delete offer"
                  onClick={() => handleDelete(offer.id)}
                  className="rounded border border-[#E5D9C8] p-1.5 text-[#991B1B]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg border border-[#E5D9C8] bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-xl font-semibold">
                {form.id ? 'Edit Promotional Offer' : 'Create Promotional Offer'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#6E5A4F]">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block font-medium text-[#6E5A4F]">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#6E5A4F]">Coupon Code</label>
                  <input
                    type="text"
                    value={form.coupon_code}
                    onChange={(e) => setForm((p) => ({ ...p, coupon_code: e.target.value.toUpperCase() }))}
                    placeholder="REVERIE20"
                    className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 font-mono text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#6E5A4F]">Discount Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}
                    className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ({currency})</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#6E5A4F]">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.discount_value}
                    onChange={(e) => setForm((p) => ({ ...p, discount_value: Number(e.target.value) }))}
                    className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#6E5A4F]">Min. Order ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.min_order_amount}
                    onChange={(e) => setForm((p) => ({ ...p, min_order_amount: Number(e.target.value) }))}
                    className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#6E5A4F]">Starts At *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.starts_at}
                    onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                    className="mt-1 w-full rounded border border-[#E5D9C8] px-2 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#6E5A4F]">Expires At *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.expires_at}
                    onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                    className="mt-1 w-full rounded border border-[#E5D9C8] px-2 py-2 text-xs"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                Offer is active
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded border border-[#E5D9C8] px-4 py-2 text-xs">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded bg-[#B86B2B] px-4 py-2 text-xs font-medium text-white">
                {saving ? 'Saving...' : 'Save Offer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
