import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function CustomerLayout() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shopName = settings?.shop_name || 'Roast & Reverie';
  const navLinks = [
    { to: '/menu', label: 'Menu' },
    { to: '/offers', label: 'Offers' },
    { to: '/reviews', label: 'Reviews' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF6F0] text-[#2A1B12]">
      {/* Top Bar Contract: 3 clean zones separated by gap-8 */}
      <header className="sticky top-0 z-40 border-b border-[#E5D9C8] bg-[#FAF6F0]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Wordmark */}
          <Link
            to="/"
            className="font-editorial text-xl font-semibold tracking-tight text-[#2A1B12] whitespace-nowrap shrink-0"
          >
            {shopName}
          </Link>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6E5A4F]">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 pb-0.5 transition-colors hover:text-[#2A1B12] ${
                    isActive ? 'border-b border-[#B86B2B] text-[#2A1B12]' : ''
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Primary Action Zone */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 text-sm font-medium text-[#2A1B12] transition-colors hover:text-[#B86B2B]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="tabular-nums">Cart ({itemCount})</span>
            </Link>

            {user ? (
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="whitespace-nowrap shrink-0 text-xs font-semibold text-[#9A551E] underline underline-offset-4 hover:text-[#2A1B12]"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-[#E5D9C8] bg-[#FDFBF7] px-3.5 py-2 text-xs font-medium text-[#2A1B12] transition-colors hover:border-[#2A1B12]"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[110px] truncate">{user.name.split(' ')[0]}</span>
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex whitespace-nowrap shrink-0 rounded-md bg-[#2A1B12] px-4 py-2 text-xs font-medium text-[#FAF6F0] transition-colors hover:bg-[#B86B2B]"
              >
                Sign In
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="inline-flex items-center justify-center rounded-md border border-[#E5D9C8] p-2 text-[#2A1B12] md:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-[#E5D9C8] bg-[#FAF6F0] px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm font-medium text-[#2A1B12]">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-[#6E5A4F] hover:text-[#2A1B12]"
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-[#E5D9C8] pt-3">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md border border-[#E5D9C8] px-3.5 py-2 text-xs font-medium"
                    >
                      Profile & Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md bg-[#B86B2B] px-3.5 py-2 text-xs font-medium text-white"
                      >
                        Admin Panel
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md bg-[#2A1B12] px-4 py-2 text-xs font-medium text-[#FAF6F0]"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md border border-[#E5D9C8] px-4 py-2 text-xs font-medium"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#E5D9C8] bg-[#2A1B12] text-[#FAF6F0]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-1">
            <p className="font-editorial text-xl font-semibold text-[#FAF6F0]">{shopName}</p>
            <p className="mt-2 text-xs text-[#E5D9C8]/80">
              {settings?.established_year || 'Est. 2019'}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#E5D9C8]/75">
              {settings?.footer_note ||
                'Small-batch specialty coffee roasted weekly and brewed fresh to order.'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-[#E5D9C8]/70">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#FAF6F0]/85">
              <li><Link to="/menu" className="hover:text-[#B86B2B]">Full Menu</Link></li>
              <li><Link to="/offers" className="hover:text-[#B86B2B]">Seasonal Offers</Link></li>
              <li><Link to="/reviews" className="hover:text-[#B86B2B]">Guest Reviews</Link></li>
              <li><Link to="/about" className="hover:text-[#B86B2B]">Our Roastery</Link></li>
              <li><Link to="/orders" className="hover:text-[#B86B2B]">Track Orders</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-[#E5D9C8]/70">Visit & Hours</h3>
            <p className="mt-4 text-sm text-[#FAF6F0]/85">
              {settings?.address || '14-B Zafar Ali Road, Gulberg V, Lahore'}
            </p>
            <div className="mt-3 space-y-1.5 text-xs text-[#E5D9C8]/75">
              {(settings?.opening_hours || []).map((row, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span>{row.day}</span>
                  <span className="tabular-nums">{row.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-[#E5D9C8]/70">Contact</h3>
            <p className="mt-4 text-sm text-[#FAF6F0]/85 tabular-nums">
              {settings?.contact_phone || '+92 42 3578 9042'}
            </p>
            <p className="mt-1 text-sm text-[#FAF6F0]/85">
              {settings?.contact_email || 'hello@roastandreverie.pk'}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#E5D9C8]/80">
              {settings?.social_links?.instagram && (
                <a href={settings.social_links.instagram} target="_blank" rel="noreferrer" className="hover:text-[#B86B2B]">
                  Instagram
                </a>
              )}
              {settings?.social_links?.facebook && (
                <a href={settings.social_links.facebook} target="_blank" rel="noreferrer" className="hover:text-[#B86B2B]">
                  Facebook
                </a>
              )}
              {settings?.social_links?.x && (
                <a href={settings.social_links.x} target="_blank" rel="noreferrer" className="hover:text-[#B86B2B]">
                  X / Twitter
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-[#E5D9C8]/65 sm:flex-row sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} {shopName}. All rights reserved.</span>
            <Link to="/contact" className="hover:text-[#FAF6F0]">Contact & Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
