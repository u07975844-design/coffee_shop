import { useState } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { PublicAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ContactPage() {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentNotice, setSentNotice] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSentNotice(null);
    setSubmitting(true);
    try {
      const res = await PublicAPI.submitContact({ name, email, subject, message });
      setSentNotice(res.message);
      showToast('Inquiry sent.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E5D9C8] pb-8">
        <p className="text-xs font-medium text-[#9A551E]">Get in Touch</p>
        <h1 className="mt-2 font-editorial text-4xl font-semibold text-[#2A1B12]">Contact Us</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6E5A4F]">
          Wholesale coffee bean inquiries, private tasting tables, or feedback about an order—write to our bar team anytime.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="border border-[#E5D9C8] bg-[#FDFBF7] p-6 space-y-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-[#B86B2B]" />
              <div>
                <h2 className="text-sm font-semibold text-[#2A1B12]">Address</h2>
                <p className="mt-1 text-sm text-[#6E5A4F]">
                  {settings?.address || '14-B Zafar Ali Road, Gulberg V, Lahore'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-[#B86B2B]" />
              <div>
                <h2 className="text-sm font-semibold text-[#2A1B12]">Phone</h2>
                <p className="mt-1 font-mono text-sm text-[#6E5A4F] tabular-nums">
                  {settings?.contact_phone || '+92 42 3578 9042'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-[#B86B2B]" />
              <div>
                <h2 className="text-sm font-semibold text-[#2A1B12]">Email</h2>
                <p className="mt-1 text-sm text-[#6E5A4F]">
                  {settings?.contact_email || 'hello@roastandreverie.pk'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-[#B86B2B]" />
              <div className="w-full">
                <h2 className="text-sm font-semibold text-[#2A1B12]">Opening Hours</h2>
                <div className="mt-1.5 space-y-1 text-xs text-[#6E5A4F]">
                  {(settings?.opening_hours || []).map((row, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span>{row.day}</span>
                      <span className="font-mono tabular-nums">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border border-[#E5D9C8] bg-[#FDFBF7] p-6 sm:p-8 lg:col-span-7">
          <h2 className="font-editorial text-2xl font-semibold text-[#2A1B12]">Send a Message</h2>

          {sentNotice && (
            <div className="mt-4 border border-[#2D6A4F]/30 bg-[#2D6A4F]/5 p-4 text-sm text-[#2D6A4F]">
              {sentNotice}
            </div>
          )}
          {error && (
            <div className="mt-4 border border-[#991B1B]/30 bg-[#991B1B]/5 p-4 text-sm text-[#991B1B]">
              {error}
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#6E5A4F]">Your Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E5A4F]">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-[#6E5A4F]">Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-[#6E5A4F]">Message *</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 rounded-md bg-[#2A1B12] px-6 py-2.5 text-sm font-medium text-[#FAF6F0] hover:bg-[#B86B2B] disabled:opacity-60"
          >
            {submitting ? 'Sending...' : 'Send Inquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}
