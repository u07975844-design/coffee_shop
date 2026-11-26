export function formatPrice(amount, currency = 'PKR') {
  const numeric = Number(amount || 0);
  return `${currency} ${numeric.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
}

export function validatePassword(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Include at least one number.';
  return null;
}

export function getStatusAccent(status) {
  switch (status) {
    case 'Delivered':
    case 'approved':
      return 'text-[#2D6A4F] border-[#2D6A4F]/30 bg-[#2D6A4F]/8';
    case 'Cancelled':
    case 'hidden':
      return 'text-[#991B1B] border-[#991B1B]/30 bg-[#991B1B]/8';
    case 'Pending':
    case 'pending':
    case 'Confirmed':
      return 'text-[#9A551E] border-[#B86B2B]/35 bg-[#B86B2B]/10';
    default:
      return 'text-[#2A1B12] border-[#E5D9C8] bg-[#F3ECE1]';
  }
}
