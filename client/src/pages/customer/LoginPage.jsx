import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { isValidEmail } from '../../utils/formatters.js';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await login({ email: email.trim(), password });
      showToast(`Welcome back, ${data.user.name}.`);
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="border border-[#E5D9C8] bg-[#FDFBF7] p-8">
        <p className="text-xs font-medium text-[#9A551E]">Welcome Back</p>
        <h1 className="mt-2 font-editorial text-3xl font-semibold text-[#2A1B12]">Sign In</h1>
        <p className="mt-1 text-sm text-[#6E5A4F]">
          Sign in to place orders, track your coffee preparation, and review fulfilled items.
        </p>

        {error && (
          <div className="mt-5 border border-[#991B1B]/30 bg-[#991B1B]/5 p-3 text-xs text-[#991B1B]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-[#6E5A4F]">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2.5 text-sm text-[#2A1B12] focus:border-[#B86B2B] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-[#6E5A4F]">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-md border border-[#E5D9C8] bg-white px-3 py-2.5 text-sm text-[#2A1B12] focus:border-[#B86B2B] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#2A1B12] px-5 py-2.5 text-sm font-medium text-[#FAF6F0] transition-colors hover:bg-[#B86B2B] disabled:opacity-60"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 border-t border-[#E5D9C8] pt-5 text-center text-xs text-[#6E5A4F]">
          New to Roast &amp; Reverie?{' '}
          <Link
            to="/register"
            state={{ from: redirectTo }}
            className="font-semibold text-[#9A551E] hover:underline"
          >
            Create a customer account
          </Link>
        </p>
      </div>
    </div>
  );
}
