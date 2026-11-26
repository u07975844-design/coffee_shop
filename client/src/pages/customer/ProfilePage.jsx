import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Package } from 'lucide-react';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, validatePassword } from '../../utils/formatters.js';

export default function ProfilePage() {
  const { user, updateProfile, logout, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [defaultAddress, setDefaultAddress] = useState(user?.default_address || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword) {
      const issue = validatePassword(newPassword);
      if (issue) {
        setError(issue);
        return;
      }
      if (!currentPassword) {
        setError('Enter your current password to change passwords.');
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        default_address: defaultAddress.trim() || null,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });
      setCurrentPassword('');
      setNewPassword('');
      showToast('Profile details updated.');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Signed out.');
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5D9C8] pb-6">
        <div>
          <p className="text-xs font-medium text-[#9A551E]">
            Account · Member since {formatDate(user?.created_at)}
          </p>
          <h1 className="mt-1 font-editorial text-4xl font-semibold text-[#2A1B12]">{user?.name}</h1>
          <p className="mt-1 text-sm text-[#6E5A4F]">{user?.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 rounded-md border border-[#E5D9C8] bg-[#FDFBF7] px-4 py-2 text-xs font-medium text-[#2A1B12] hover:border-[#2A1B12]"
          >
            <Package className="h-3.5 w-3.5" />
            My Orders
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-md bg-[#B86B2B] px-4 py-2 text-xs font-medium text-white hover:bg-[#9A551E]"
            >
              Open Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E5D9C8] px-4 py-2 text-xs font-medium text-[#991B1B] hover:bg-[#991B1B]/5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-8 border border-[#E5D9C8] bg-[#FDFBF7] p-6 sm:p-8">
        <h2 className="font-editorial text-2xl font-semibold text-[#2A1B12]">Profile Settings</h2>

        {error && (
          <div className="mt-4 border border-[#991B1B]/30 bg-[#991B1B]/5 p-3 text-xs text-[#991B1B]">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-xs font-medium text-[#6E5A4F]">Default Delivery Address</label>
          <input
            type="text"
            value={defaultAddress}
            onChange={(e) => setDefaultAddress(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
          />
        </div>

        <div className="mt-8 border-t border-[#E5D9C8] pt-6">
          <h3 className="text-sm font-semibold text-[#2A1B12]">Change Password (Optional)</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#6E5A4F]">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E5A4F]">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#2A1B12] px-6 py-2.5 text-sm font-medium text-[#FAF6F0] hover:bg-[#B86B2B] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
