import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { AdminAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import { ErrorNotice } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatDateTime, formatPrice, getStatusAccent } from '../../utils/formatters.js';

export default function AdminOverviewPage() {
  const { settings } = useSettings();
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async (rangeDays) => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getDashboard(rangeDays);
      setData(res);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(days);
  }, [days]);

  const currency = settings?.currency_code || 'PKR';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse border border-[#E5D9C8] bg-white" />
          ))}
        </div>
        <div className="h-72 animate-pulse border border-[#E5D9C8] bg-white" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorNotice message={error || 'Unable to load dashboard.'} onRetry={() => loadDashboard(days)} />;
  }

  const m = data.metrics;
  const maxRevenue = Math.max(1, ...(data.sales_chart || []).map((d) => Number(d.revenue || 0)));

  const statCards = [
    { label: 'Fulfilled Revenue', value: formatPrice(m.fulfilled_revenue, currency) },
    { label: 'Total Orders', value: m.total_orders },
    { label: 'Pending / Active', value: m.pending_orders },
    { label: 'Completed Orders', value: m.completed_orders },
    { label: 'Cancelled Orders', value: m.cancelled_orders },
    { label: 'Registered Customers', value: m.total_customers },
    { label: 'Active Admins', value: m.total_admins },
    { label: 'Low-Stock Alerts', value: m.low_stock_count, warn: m.low_stock_count > 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#2A1B12]">Operations Overview</h1>
          <p className="mt-1 text-sm text-[#6E5A4F]">
            Live database figures across orders, inventory levels, and customer accounts.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-[#E5D9C8] bg-white p-1">
          {[7, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                days === d ? 'bg-[#2A1B12] text-white' : 'text-[#6E5A4F] hover:text-[#2A1B12]'
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="border border-[#E5D9C8] bg-white p-5">
            <p className="text-xs font-medium text-[#6E5A4F]">{card.label}</p>
            <p
              className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
                card.warn ? 'text-[#B45309]' : 'text-[#2A1B12]'
              }`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Sales & Orders Chart */}
      <section className="border border-[#E5D9C8] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">
              Sales &amp; Order Volume ({days} Days)
            </h2>
            <p className="text-xs text-[#6E5A4F]">Non-cancelled daily order revenue and order count</p>
          </div>
        </div>

        <div className="mt-6 flex h-52 items-end gap-2 overflow-x-auto pb-2">
          {(data.sales_chart || []).map((point) => {
            const pct = Math.max(4, Math.round((Number(point.revenue) / maxRevenue) * 100));
            return (
              <div
                key={point.date}
                className="flex min-w-[28px] flex-1 flex-col items-center gap-2"
                title={`${point.label}: ${formatPrice(point.revenue, currency)} (${point.orders} orders)`}
              >
                <span className="font-mono text-[10px] text-[#6E5A4F] tabular-nums">
                  {point.orders > 0 ? point.orders : ''}
                </span>
                <div className="flex h-36 w-full items-end rounded-sm bg-[#F3ECE1]">
                  <div
                    className="w-full rounded-sm bg-[#B86B2B] transition-all"
                    style={{ height: `${point.revenue > 0 ? pct : 2}%`, opacity: point.revenue > 0 ? 1 : 0.25 }}
                  />
                </div>
                <span className="whitespace-nowrap text-[10px] text-[#6E5A4F]">
                  {days === 7 ? point.label : point.label.split(' ')[1]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Orders */}
        <section className="border border-[#E5D9C8] bg-white p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Recent Orders</h2>
            <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs font-medium text-[#9A551E] hover:underline">
              Manage Orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {data.recent_orders.length === 0 ? (
            <p className="mt-4 text-sm text-[#6E5A4F]">No orders recorded yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5D9C8] text-[#6E5A4F]">
                    <th className="py-2.5 font-medium">Order</th>
                    <th className="py-2.5 font-medium">Customer</th>
                    <th className="py-2.5 font-medium">Status</th>
                    <th className="py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D9C8]">
                  {data.recent_orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FAF6F0]">
                      <td className="py-3 font-mono font-semibold text-[#2A1B12]">
                        {ord.order_number}
                        <span className="block font-sans text-[11px] font-normal text-[#6E5A4F]">
                          {formatDateTime(ord.created_at)}
                        </span>
                      </td>
                      <td className="py-3 text-[#2A1B12]">{ord.customer_name}</td>
                      <td className="py-3">
                        <span className={`inline-block border px-2 py-0.5 text-[11px] font-medium ${getStatusAccent(ord.status)}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-medium tabular-nums">
                        {formatPrice(ord.total_amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Low Stock & Bestsellers */}
        <div className="space-y-6 lg:col-span-5">
          <section className="border border-[#E5D9C8] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-editorial text-xl font-semibold text-[#2A1B12]">
                <AlertTriangle className="h-4 w-4 text-[#B45309]" />
                Low-Stock Warnings
              </h2>
              <Link to="/admin/inventory" className="text-xs font-medium text-[#9A551E] hover:underline">
                Restock
              </Link>
            </div>

            {data.low_stock_products.length === 0 && data.low_stock_variants.length === 0 ? (
              <p className="mt-3 text-xs text-[#2D6A4F]">All menu items are currently above low-stock thresholds.</p>
            ) : (
              <ul className="mt-4 divide-y divide-[#E5D9C8] text-xs">
                {data.low_stock_products.map((p) => (
                  <li key={`p-${p.id}`} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-medium text-[#2A1B12]">{p.name}</p>
                      <p className="text-[#6E5A4F]">{p.category_name}</p>
                    </div>
                    <span className={`font-mono font-semibold tabular-nums ${p.stock_quantity === 0 ? 'text-[#991B1B]' : 'text-[#B45309]'}`}>
                      {p.stock_quantity} left
                    </span>
                  </li>
                ))}
                {data.low_stock_variants.map((v) => (
                  <li key={`v-${v.option_id}`} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-medium text-[#2A1B12]">{v.product_name}</p>
                      <p className="text-[#6E5A4F]">{v.option_group}: {v.option_name}</p>
                    </div>
                    <span className="font-mono font-semibold text-[#B45309] tabular-nums">
                      {v.stock_quantity} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-[#E5D9C8] bg-white p-6">
            <h2 className="font-editorial text-xl font-semibold text-[#2A1B12]">Bestselling Products</h2>
            {data.bestsellers.length === 0 ? (
              <p className="mt-3 text-xs text-[#6E5A4F]">Bestsellers appear once orders are placed.</p>
            ) : (
              <ul className="mt-4 divide-y divide-[#E5D9C8] text-xs">
                {data.bestsellers.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-medium text-[#2A1B12]">{item.name}</p>
                      <p className="font-mono text-[#6E5A4F] tabular-nums">{item.units_sold} units sold</p>
                    </div>
                    <span className="font-mono font-semibold text-[#2A1B12] tabular-nums">
                      {formatPrice(item.revenue_generated, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
