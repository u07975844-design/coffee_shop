import { useEffect, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { AdminAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminSettingsPage() {
  const { settings, loading, error, refreshSettings } = useSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        shop_name: settings.shop_name || '',
        tagline: settings.tagline || '',
        logo_url: settings.logo_url || '',
        established_year: settings.established_year || '',
        about_title: settings.about_title || '',
        about_story: settings.about_story || '',
        contact_phone: settings.contact_phone || '',
        contact_email: settings.contact_email || '',
        address: settings.address || '',
        opening_hours: Array.isArray(settings.opening_hours) ? settings.opening_hours : [],
        social_links: settings.social_links || { instagram: '', facebook: '', x: '' },
        hero_title: settings.hero_title || '',
        hero_subtitle: settings.hero_subtitle || '',
        hero_image_url: settings.hero_image_url || '',
        footer_note: settings.footer_note || '',
      });
    }
  }, [settings]);

  const handleImageUpload = async (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await AdminAPI.uploadImage(file);
      setForm((prev) => ({ ...prev, [field]: res.image_url }));
      showToast('Image uploaded.');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AdminAPI.updateSettings(form);
      await refreshSettings();
      showToast('Café settings updated across storefront.');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return loading ? (
      <div className="h-64 animate-pulse border border-[#E5D9C8] bg-white" />
    ) : (
      <ErrorNotice message={error || 'Unable to load settings.'} onRetry={refreshSettings} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-[#2A1B12]">Café Settings</h1>
        <p className="mt-1 text-sm text-[#6E5A4F]">
          Changes saved here update the public homepage, About page, Contact page, and footer immediately.
        </p>
      </div>

      <section className="space-y-4 border border-[#E5D9C8] bg-white p-6">
        <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Brand &amp; Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">Coffee Shop Name *</label>
            <input
              type="text"
              required
              value={form.shop_name}
              onChange={(e) => setForm((p) => ({ ...p, shop_name: e.target.value }))}
              className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">Established Year/Date</label>
            <input
              type="text"
              value={form.established_year}
              onChange={(e) => setForm((p) => ({ ...p, established_year: e.target.value }))}
              className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6E5A4F]">Tagline</label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
            className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6E5A4F]">Logo Image URL</label>
          <div className="mt-1 flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#2A1B12] px-3 py-2 text-xs font-medium">
              <Upload className="h-3.5 w-3.5" />
              Upload
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload('logo_url', e)} className="hidden" />
            </label>
            <input
              type="text"
              value={form.logo_url}
              onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
              className="flex-1 rounded border border-[#E5D9C8] px-3 py-2 text-xs"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border border-[#E5D9C8] bg-white p-6">
        <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Homepage Hero &amp; Story</h2>
        <div>
          <label className="block text-xs font-medium text-[#6E5A4F]">Hero Headline</label>
          <input
            type="text"
            value={form.hero_title}
            onChange={(e) => setForm((p) => ({ ...p, hero_title: e.target.value }))}
            className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6E5A4F]">Hero Subtitle</label>
          <textarea
            rows={2}
            value={form.hero_subtitle}
            onChange={(e) => setForm((p) => ({ ...p, hero_subtitle: e.target.value }))}
            className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6E5A4F]">Hero Background Image</label>
          <div className="mt-1 flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#2A1B12] px-3 py-2 text-xs font-medium">
              <Upload className="h-3.5 w-3.5" />
              Upload
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload('hero_image_url', e)} className="hidden" />
            </label>
            <input
              type="text"
              value={form.hero_image_url}
              onChange={(e) => setForm((p) => ({ ...p, hero_image_url: e.target.value }))}
              className="flex-1 rounded border border-[#E5D9C8] px-3 py-2 text-xs"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6E5A4F]">About Section Heading</label>
          <input
            type="text"
            value={form.about_title}
            onChange={(e) => setForm((p) => ({ ...p, about_title: e.target.value }))}
            className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6E5A4F]">About Story</label>
          <textarea
            rows={3}
            value={form.about_story}
            onChange={(e) => setForm((p) => ({ ...p, about_story: e.target.value }))}
            className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="space-y-4 border border-[#E5D9C8] bg-white p-6">
        <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Contact, Hours &amp; Social</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">Contact Number</label>
            <input
              type="text"
              value={form.contact_phone}
              onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))}
              className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">Contact Email</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
              className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6E5A4F]">Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#6E5A4F]">Opening Hours</label>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, opening_hours: [...p.opening_hours, { day: '', hours: '' }] }))
              }
              className="inline-flex items-center gap-1 text-xs font-medium text-[#9A551E]"
            >
              <Plus className="h-3 w-3" /> Add Row
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {form.opening_hours.map((row, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Day(s)"
                  value={row.day}
                  onChange={(e) => {
                    const next = [...form.opening_hours];
                    next[idx] = { ...next[idx], day: e.target.value };
                    setForm((p) => ({ ...p, opening_hours: next }));
                  }}
                  className="flex-1 rounded border border-[#E5D9C8] px-3 py-1.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Hours"
                  value={row.hours}
                  onChange={(e) => {
                    const next = [...form.opening_hours];
                    next[idx] = { ...next[idx], hours: e.target.value };
                    setForm((p) => ({ ...p, opening_hours: next }));
                  }}
                  className="flex-1 rounded border border-[#E5D9C8] px-3 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      opening_hours: p.opening_hours.filter((_, i) => i !== idx),
                    }))
                  }
                  className="px-2 text-[#991B1B]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">Instagram URL</label>
            <input
              type="text"
              value={form.social_links.instagram || ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, social_links: { ...p.social_links, instagram: e.target.value } }))
              }
              className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">Facebook URL</label>
            <input
              type="text"
              value={form.social_links.facebook || ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, social_links: { ...p.social_links, facebook: e.target.value } }))
              }
              className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">X / Twitter URL</label>
            <input
              type="text"
              value={form.social_links.x || ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, social_links: { ...p.social_links, x: e.target.value } }))
              }
              className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6E5A4F]">Footer Note</label>
          <input
            type="text"
            value={form.footer_note}
            onChange={(e) => setForm((p) => ({ ...p, footer_note: e.target.value }))}
            className="mt-1 w-full rounded border border-[#E5D9C8] px-3 py-2 text-sm"
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[#B86B2B] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#9A551E] disabled:opacity-60"
        >
          {saving ? 'Saving Settings...' : 'Save Café Settings'}
        </button>
      </div>
    </form>
  );
}
