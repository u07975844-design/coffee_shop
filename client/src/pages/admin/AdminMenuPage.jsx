import { useEffect, useState } from 'react';
import { Archive, Edit3, Plus, Trash2, Upload, X } from 'lucide-react';
import { AdminAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import CoffeeImage from '../../components/CoffeeImage.jsx';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatPrice } from '../../utils/formatters.js';

const EMPTY_PRODUCT = {
  id: null,
  category_id: '',
  name: '',
  description: '',
  tasting_notes: '',
  origin: '',
  image_url: '',
  base_price: '',
  stock_quantity: 20,
  low_stock_threshold: 8,
  is_featured: false,
  is_bestseller: false,
  is_available: true,
  options: [],
};

export default function AdminMenuPage() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const currency = settings?.currency_code || 'PKR';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category Form State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ id: null, name: '', description: '', sort_order: 0, is_active: true });

  // Product Form State
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodForm, setProdForm] = useState(EMPTY_PRODUCT);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        AdminAPI.listCategories(showArchived),
        AdminAPI.listProducts({ archived: showArchived, search: search.trim() }),
      ]);
      setCategories(catRes.categories || []);
      setProducts(prodRes.products || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showArchived, search]);

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (catForm.id) {
        await AdminAPI.updateCategory(catForm.id, catForm);
        showToast('Category updated.');
      } else {
        await AdminAPI.createCategory(catForm);
        showToast('Category created.');
      }
      setCatModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    try {
      const res = await AdminAPI.deleteCategory(cat.id);
      showToast(res.message);
      await loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const openNewProduct = () => {
    setProdForm({
      ...EMPTY_PRODUCT,
      category_id: categories[0]?.id || '',
    });
    setProdModalOpen(true);
  };

  const openEditProduct = (prod) => {
    setProdForm({
      id: prod.id,
      category_id: prod.category_id,
      name: prod.name,
      description: prod.description,
      tasting_notes: prod.tasting_notes || '',
      origin: prod.origin || '',
      image_url: prod.image_url || '',
      base_price: prod.base_price,
      stock_quantity: prod.stock_quantity,
      low_stock_threshold: prod.low_stock_threshold,
      is_featured: Boolean(prod.is_featured),
      is_bestseller: Boolean(prod.is_bestseller),
      is_available: Boolean(prod.is_available),
      options: (prod.options || []).map((o) => ({
        id: o.id,
        option_group: o.option_group,
        option_name: o.option_name,
        price_delta: o.price_delta,
        track_stock: Boolean(o.track_stock),
        stock_quantity: o.stock_quantity,
        low_stock_threshold: o.low_stock_threshold,
      })),
    });
    setProdModalOpen(true);
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await AdminAPI.uploadImage(file);
      setProdForm((prev) => ({ ...prev, image_url: res.image_url }));
      showToast('Photo uploaded.');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const addOptionRow = () => {
    setProdForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          id: null,
          option_group: 'Size',
          option_name: '',
          price_delta: 0,
          track_stock: false,
          stock_quantity: 0,
          low_stock_threshold: 5,
        },
      ],
    }));
  };

  const updateOptionRow = (idx, field, value) => {
    setProdForm((prev) => {
      const next = [...prev.options];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, options: next };
    });
  };

  const removeOptionRow = (idx) => {
    setProdForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...prodForm,
        category_id: Number(prodForm.category_id),
        base_price: Number(prodForm.base_price),
        stock_quantity: Number(prodForm.stock_quantity),
        low_stock_threshold: Number(prodForm.low_stock_threshold),
      };
      if (prodForm.id) {
        await AdminAPI.updateProduct(prodForm.id, payload);
        showToast('Product updated.');
      } else {
        await AdminAPI.createProduct(payload);
        showToast('Product added to menu.');
      }
      setProdModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchiveProduct = async (prod) => {
    try {
      const res = await AdminAPI.archiveProduct(prod.id, !prod.is_archived);
      showToast(res.message);
      await loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#2A1B12]">Menu &amp; Categories</h1>
          <p className="mt-1 text-sm text-[#6E5A4F]">
            Manage categories, products, photography, prices, options, and archive flags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCatForm({ id: null, name: '', description: '', sort_order: categories.length + 1, is_active: true });
              setCatModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#2A1B12] bg-white px-4 py-2 text-xs font-medium text-[#2A1B12] hover:bg-[#F3ECE1]"
          >
            <Plus className="h-3.5 w-3.5" />
            New Category
          </button>
          <button
            type="button"
            onClick={openNewProduct}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#B86B2B] px-4 py-2 text-xs font-medium text-white hover:bg-[#9A551E]"
          >
            <Plus className="h-3.5 w-3.5" />
            New Product
          </button>
        </div>
      </div>

      {error && <ErrorNotice message={error} onRetry={loadData} />}

      {/* Categories Section */}
      <section className="border border-[#E5D9C8] bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Categories</h2>
          <label className="flex items-center gap-2 text-xs text-[#6E5A4F]">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived items
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-start justify-between gap-3 border border-[#E5D9C8] p-4">
              <div>
                <p className="font-semibold text-[#2A1B12]">
                  {cat.name}
                  {cat.is_archived ? ' (Archived)' : !cat.is_active ? ' (Hidden)' : ''}
                </p>
                <p className="mt-0.5 text-xs text-[#6E5A4F] tabular-nums">
                  Sort #{cat.sort_order} · {cat.product_count} products
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label={`Edit ${cat.name}`}
                  onClick={() => {
                    setCatForm({
                      id: cat.id,
                      name: cat.name,
                      description: cat.description || '',
                      sort_order: cat.sort_order,
                      is_active: Boolean(cat.is_active),
                    });
                    setCatModalOpen(true);
                  }}
                  className="rounded border border-[#E5D9C8] p-1.5 text-[#6E5A4F] hover:text-[#2A1B12]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete or archive ${cat.name}`}
                  onClick={() => handleDeleteCategory(cat)}
                  className="rounded border border-[#E5D9C8] p-1.5 text-[#6E5A4F] hover:text-[#991B1B]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products Table */}
      <section className="border border-[#E5D9C8] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Menu Products</h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter products..."
            className="w-full rounded-md border border-[#E5D9C8] px-3 py-2 text-xs focus:border-[#B86B2B] focus:outline-none sm:w-64"
          />
        </div>

        {loading ? (
          <div className="mt-4 h-40 animate-pulse bg-[#F3ECE1]" />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5D9C8] text-[#6E5A4F]">
                  <th className="py-3 font-medium">Product</th>
                  <th className="py-3 font-medium">Category</th>
                  <th className="py-3 text-right font-medium">Base Price</th>
                  <th className="py-3 text-right font-medium">Stock</th>
                  <th className="py-3 font-medium">Flags</th>
                  <th className="py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D9C8]">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FAF6F0]">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-12 shrink-0 overflow-hidden bg-[#F3ECE1]">
                          <CoffeeImage src={prod.image_url} alt={prod.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#2A1B12]">{prod.name}</p>
                          <p className="text-[11px] text-[#6E5A4F]">
                            {prod.options?.length || 0} options
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-[#6E5A4F]">{prod.category_name}</td>
                    <td className="py-3 text-right font-mono font-medium tabular-nums">
                      {formatPrice(prod.base_price, currency)}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums">{prod.stock_quantity}</td>
                    <td className="py-3 text-[11px] text-[#6E5A4F]">
                      {[
                        prod.is_featured ? 'Featured' : null,
                        prod.is_bestseller ? 'Bestseller' : null,
                        !prod.is_available ? 'Disabled' : null,
                        prod.is_archived ? 'Archived' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Active'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditProduct(prod)}
                          className="rounded border border-[#E5D9C8] px-2.5 py-1 text-[11px] font-medium hover:border-[#2A1B12]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleArchiveProduct(prod)}
                          className="inline-flex items-center gap-1 rounded border border-[#E5D9C8] px-2.5 py-1 text-[11px] text-[#6E5A4F] hover:text-[#2A1B12]"
                        >
                          <Archive className="h-3 w-3" />
                          {prod.is_archived ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveCategory} className="w-full max-w-md border border-[#E5D9C8] bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-xl font-semibold">
                {catForm.id ? 'Edit Category' : 'New Category'}
              </h3>
              <button type="button" onClick={() => setCatModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Description</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-28">
                  <label className="block text-xs font-medium text-[#6E5A4F]">Sort Order</label>
                  <input
                    type="number"
                    value={catForm.sort_order}
                    onChange={(e) => setCatForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                    className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                  />
                </div>
                <label className="mt-5 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={catForm.is_active}
                    onChange={(e) => setCatForm((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                  Visible on storefront
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCatModalOpen(false)} className="rounded border border-[#E5D9C8] px-4 py-2 text-xs">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded bg-[#2A1B12] px-4 py-2 text-xs font-medium text-white">
                {saving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product Modal */}
      {prodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10">
          <form onSubmit={handleSaveProduct} className="w-full max-w-2xl border border-[#E5D9C8] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#E5D9C8] pb-4">
              <h3 className="font-editorial text-2xl font-semibold">
                {prodForm.id ? 'Edit Menu Product' : 'Add New Menu Product'}
              </h3>
              <button type="button" onClick={() => setProdModalOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Category *</label>
                <select
                  required
                  value={prodForm.category_id}
                  onChange={(e) => setProdForm((p) => ({ ...p, category_id: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-[#6E5A4F]">Description *</label>
              <textarea
                rows={3}
                required
                value={prodForm.description}
                onChange={(e) => setProdForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Tasting Notes</label>
                <input
                  type="text"
                  value={prodForm.tasting_notes}
                  onChange={(e) => setProdForm((p) => ({ ...p, tasting_notes: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Origin / Batch</label>
                <input
                  type="text"
                  value={prodForm.origin}
                  onChange={(e) => setProdForm((p) => ({ ...p, origin: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Base Price ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={prodForm.base_price}
                  onChange={(e) => setProdForm((p) => ({ ...p, base_price: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 font-mono text-sm"
                />
              </div>
              {!prodForm.id && (
                <div>
                  <label className="block text-xs font-medium text-[#6E5A4F]">Initial Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.stock_quantity}
                    onChange={(e) => setProdForm((p) => ({ ...p, stock_quantity: e.target.value }))}
                    className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 font-mono text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-[#6E5A4F]">Low-Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={prodForm.low_stock_threshold}
                  onChange={(e) => setProdForm((p) => ({ ...p, low_stock_threshold: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 font-mono text-sm"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="mt-4 border border-[#E5D9C8] bg-[#FAF6F0] p-4">
              <label className="block text-xs font-medium text-[#6E5A4F]">Product Photograph</label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#2A1B12] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#F3ECE1]">
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingImage ? 'Uploading...' : 'Upload File'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageFile} className="hidden" />
                </label>
                <input
                  type="text"
                  value={prodForm.image_url}
                  onChange={(e) => setProdForm((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="/uploads/... or /src/assets/images/..."
                  className="flex-1 rounded border border-[#E5D9C8] bg-white px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="mt-4 flex flex-wrap gap-6 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prodForm.is_available}
                  onChange={(e) => setProdForm((p) => ({ ...p, is_available: e.target.checked }))}
                />
                Available for ordering
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prodForm.is_featured}
                  onChange={(e) => setProdForm((p) => ({ ...p, is_featured: e.target.checked }))}
                />
                Featured on Homepage
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prodForm.is_bestseller}
                  onChange={(e) => setProdForm((p) => ({ ...p, is_bestseller: e.target.checked }))}
                />
                Bestseller
              </label>
            </div>

            {/* Product Options */}
            <div className="mt-6 border-t border-[#E5D9C8] pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#2A1B12]">Product Options (Size, Milk, Extra Shots)</h4>
                <button
                  type="button"
                  onClick={addOptionRow}
                  className="inline-flex items-center gap-1 rounded border border-[#E5D9C8] px-2.5 py-1 text-xs font-medium hover:border-[#2A1B12]"
                >
                  <Plus className="h-3 w-3" /> Add Option
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {prodForm.options.map((opt, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-2 border border-[#E5D9C8] p-2 text-xs">
                    <input
                      type="text"
                      placeholder="Group (e.g. Size)"
                      value={opt.option_group}
                      onChange={(e) => updateOptionRow(idx, 'option_group', e.target.value)}
                      className="col-span-3 rounded border border-[#E5D9C8] px-2 py-1"
                    />
                    <input
                      type="text"
                      placeholder="Option Name"
                      value={opt.option_name}
                      onChange={(e) => updateOptionRow(idx, 'option_name', e.target.value)}
                      className="col-span-4 rounded border border-[#E5D9C8] px-2 py-1"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="+Price"
                      value={opt.price_delta}
                      onChange={(e) => updateOptionRow(idx, 'price_delta', e.target.value)}
                      className="col-span-2 rounded border border-[#E5D9C8] px-2 py-1 font-mono"
                    />
                    <label className="col-span-2 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={opt.track_stock}
                        onChange={(e) => updateOptionRow(idx, 'track_stock', e.target.checked)}
                      />
                      Stocked
                    </label>
                    <button
                      type="button"
                      onClick={() => removeOptionRow(idx)}
                      className="col-span-1 text-[#991B1B]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {opt.track_stock && (
                      <div className="col-span-12 flex items-center gap-3 pt-1 text-[11px] text-[#6E5A4F]">
                        <span>Variant Stock:</span>
                        <input
                          type="number"
                          min="0"
                          value={opt.stock_quantity}
                          onChange={(e) => updateOptionRow(idx, 'stock_quantity', Number(e.target.value))}
                          className="w-20 rounded border border-[#E5D9C8] px-2 py-0.5 font-mono"
                        />
                        <span>Threshold:</span>
                        <input
                          type="number"
                          min="0"
                          value={opt.low_stock_threshold}
                          onChange={(e) => updateOptionRow(idx, 'low_stock_threshold', Number(e.target.value))}
                          className="w-20 rounded border border-[#E5D9C8] px-2 py-0.5 font-mono"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-[#E5D9C8] pt-4">
              <button type="button" onClick={() => setProdModalOpen(false)} className="rounded border border-[#E5D9C8] px-4 py-2 text-xs">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded bg-[#B86B2B] px-5 py-2 text-xs font-medium text-white">
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
