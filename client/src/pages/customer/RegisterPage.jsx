import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { isValidEmail, validatePassword } from '../../utils/formatters.js';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from || '/profile';

  const passwordRules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One numeric digit', ok: /[0-9]/.test(password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const pwdIssue = validatePassword(password);
    if (pwdIssue) {
      setError(pwdIssue);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        default_address: defaultAddress.trim() || null,
        password,
      });
      showToast('Account created! Welcome to Roast & Reverie.');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <div className="border border-[#E5D9C8] bg-[#FDFBF7] p-8">
        <p className="text-xs font-medium text-[#9A551E]">Join the Roastery</p>
        <h1 className="mt-2 font-editorial text-3xl font-semibold text-[#2A1B12]">
          Create Customer Account
        </h1>
        <p className="mt-1 text-sm text-[#6E5A4F]">
          Instant registration with no email verification required.
        </p>

        {error && (
          <div className="mt-5 border border-[#991B1B]/30 bg-[#991B1B]/5 p-3 text-xs text-[#991B1B]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amina Tariq"
              className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#6E5A4F]">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E5A4F]">Phone (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6E5A4F]">
              Default Delivery Address (Optional)
            </label>
            <input
              type="text"
              value={defaultAddress}
              onChange={(e) => setDefaultAddress(e.target.value)}
              placeholder="Street, block, city"
              className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#6E5A4F]">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E5A4F]">Confirm Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2 text-sm focus:border-[#B86B2B] focus:outline-none"
              />
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-1.5 text-xs">
            {passwordRules.map((rule) => (
              <li
                key={rule.label}
                className={rule.ok ? 'font-medium text-[#2D6A4F]' : 'text-[#6E5A4F]'}
              >
                {rule.ok ? '✓' : '·'} {rule.label}
              </li>
            ))}
          </ul>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#B86B2B] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#9A551E] disabled:opacity-60"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 border-t border-[#E5D9C8] pt-5 text-center text-xs text-[#6E5A4F]">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[#9A551E] hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
