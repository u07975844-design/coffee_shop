import { useEffect, useState } from 'react';
import { AdminAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatPrice } from '../../utils/formatters.js';

export default function AdminUsersPage() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const currency = settings?.currency_code || 'PKR';

  const [data, setData] = useState({ summary: {}, customers: [], admins: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.listUsers();
      setData(res);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateAccess = async (userId, payload) => {
    try {
      const res = await AdminAPI.updateUserAccess(userId, payload);
      showToast(res.message);
      await loadUsers();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  if (loading) {
    return <div className="h-48 animate-pulse border border-[#E5D9C8] bg-white" />;
  }
  if (error) {
    return <ErrorNotice message={error} onRetry={loadUsers} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-[#2A1B12]">User &amp; Admin Management</h1>
        <p className="mt-1 text-sm text-[#6E5A4F]">
          View registered customers, administrator accounts, and role protections. The last active admin cannot be demoted or disabled.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-[#E5D9C8] bg-white p-5">
          <p className="text-xs text-[#6E5A4F]">Registered Customers</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
            {data.summary.total_customers || 0}
          </p>
        </div>
        <div className="border border-[#E5D9C8] bg-white p-5">
          <p className="text-xs text-[#6E5A4F]">Total Admin Accounts</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
            {data.summary.total_admins || 0}
          </p>
        </div>
        <div className="border border-[#E5D9C8] bg-white p-5">
          <p className="text-xs text-[#6E5A4F]">Active Administrators</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
            {data.summary.active_admins || 0}
          </p>
        </div>
      </div>

      {/* Admins List */}
      <section className="border border-[#E5D9C8] bg-white p-6">
        <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Administrator Accounts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5D9C8] text-[#6E5A4F]">
                <th className="py-2.5 font-medium">Name</th>
                <th className="py-2.5 font-medium">Email</th>
                <th className="py-2.5 font-medium">Role</th>
                <th className="py-2.5 font-medium">Registered</th>
                <th className="py-2.5 text-right font-medium">Protection / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D9C8]">
              {data.admins.map((adm) => {
                const isLastActiveAdmin = adm.is_active && Number(data.summary.active_admins) <= 1;
                return (
                  <tr key={adm.id}>
                    <td className="py-3 font-semibold text-[#2A1B12]">{adm.name}</td>
                    <td className="py-3 text-[#6E5A4F]">{adm.email}</td>
                    <td className="py-3 font-medium text-[#9A551E]">
                      Admin {adm.is_active ? '(Active)' : '(Disabled)'}
                    </td>
                    <td className="py-3 font-mono text-[#6E5A4F] tabular-nums">{formatDate(adm.created_at)}</td>
                    <td className="py-3 text-right">
                      {isLastActiveAdmin ? (
                        <span className="text-[11px] text-[#6E5A4F]">Last Active Admin Protected</span>
                      ) : (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateAccess(adm.id, { role: 'customer' })}
                            className="rounded border border-[#E5D9C8] px-2.5 py-1 text-[11px] hover:border-[#2A1B12]"
                          >
                            Demote to Customer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateAccess(adm.id, { is_active: !adm.is_active })}
                            className="rounded border border-[#E5D9C8] px-2.5 py-1 text-[11px]"
                          >
                            {adm.is_active ? 'Disable' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Customers List */}
      <section className="border border-[#E5D9C8] bg-white p-6">
        <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Registered Customers</h2>
        {data.customers.length === 0 ? (
          <p className="mt-3 text-sm text-[#6E5A4F]">No customer accounts registered yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5D9C8] text-[#6E5A4F]">
                  <th className="py-2.5 font-medium">Customer</th>
                  <th className="py-2.5 font-medium">Email</th>
                  <th className="py-2.5 font-medium">Registered</th>
                  <th className="py-2.5 text-right font-medium">Orders</th>
                  <th className="py-2.5 text-right font-medium">Fulfilled Spend</th>
                  <th className="py-2.5 text-right font-medium">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D9C8]">
                {data.customers.map((cust) => (
                  <tr key={cust.id}>
                    <td className="py-3 font-semibold text-[#2A1B12]">{cust.name}</td>
                    <td className="py-3 text-[#6E5A4F]">{cust.email}</td>
                    <td className="py-3 font-mono text-[#6E5A4F] tabular-nums">{formatDate(cust.created_at)}</td>
                    <td className="py-3 text-right font-mono tabular-nums">{cust.order_count}</td>
                    <td className="py-3 text-right font-mono tabular-nums">
                      {formatPrice(cust.total_spent, currency)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateAccess(cust.id, { role: 'admin', is_active: true })}
                          className="rounded border border-[#E5D9C8] px-2.5 py-1 text-[11px] hover:border-[#2A1B12]"
                        >
                          Promote Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateAccess(cust.id, { is_active: !cust.is_active })}
                          className="rounded border border-[#E5D9C8] px-2.5 py-1 text-[11px]"
                        >
                          {cust.is_active ? 'Suspend' : 'Reactivate'}
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
    </div>
  );
}
