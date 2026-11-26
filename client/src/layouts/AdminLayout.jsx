import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  Coffee,
  ExternalLink,
  LogOut,
  Menu,
  MessageSquareQuote,
  Settings,
  ShoppingBag,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
  { to: '/admin/menu', label: 'Menu & Categories', icon: Coffee },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users & Admins', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote },
  { to: '/admin/offers', label: 'Offers', icon: Tag },
  { to: '/admin/settings', label: 'Café Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#F6F3EE] text-[#2A1B12]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#E5D9C8] bg-[#2A1B12] text-[#FAF6F0] lg:flex">
        <div className="border-b border-white/10 px-6 py-5">
          <Link to="/admin" className="font-editorial text-lg font-semibold text-[#FAF6F0]">
            Roast &amp; Reverie
          </Link>
          <p className="mt-1 text-xs text-[#E5D9C8]/70">Operations Console</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#B86B2B] text-white'
                      : 'text-[#E5D9C8]/80 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="truncate text-xs font-medium text-[#FAF6F0]">{user?.name}</p>
          <p className="truncate text-xs text-[#E5D9C8]/65">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs font-medium text-[#FAF6F0] transition-colors hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex w-64 flex-col bg-[#2A1B12] text-[#FAF6F0]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="font-editorial text-lg font-semibold">Operations</span>
              <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                        isActive ? 'bg-[#B86B2B] text-white' : 'text-[#E5D9C8]/80'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-[#E5D9C8] bg-[#FDFBF7] px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin menu"
              className="rounded-md border border-[#E5D9C8] p-2 text-[#2A1B12] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-[#6E5A4F]">
              Roast &amp; Reverie / Admin Workspace
            </span>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[#E5D9C8] bg-white px-3.5 py-2 text-xs font-medium text-[#2A1B12] transition-colors hover:border-[#2A1B12]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Storefront
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
