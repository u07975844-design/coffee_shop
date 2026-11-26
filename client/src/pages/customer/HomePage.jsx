import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Phone, Star, Tag } from 'lucide-react';
import { PublicAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import CoffeeImage from '../../components/CoffeeImage.jsx';
import ProductCard from '../../components/ProductCard.jsx';
import { ErrorNotice, LoadingGrid } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatDate, formatPrice } from '../../utils/formatters.js';

export default function HomePage() {
  const { settings, error: settingsError, refreshSettings } = useSettings();
  const [featured, setFeatured] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [featRes, bestRes, catRes, offerRes, revRes] = await Promise.all([
        PublicAPI.getProducts({ featured: true, limit: 3 }),
        PublicAPI.getProducts({ bestseller: true, limit: 3 }),
        PublicAPI.getCategories(),
        PublicAPI.getOffers(),
        PublicAPI.getReviews(6),
      ]);
      setFeatured(featRes.products || []);
      setBestsellers(bestRes.products || []);
      setCategories(catRes.categories || []);
      setOffers(offerRes.offers || []);
      setReviews(revRes.reviews || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const currency = settings?.currency_code || 'PKR';

  return (
    <div>
      {/* 1. Editorial Hero */}
      <section className="relative overflow-hidden bg-[#2A1B12] text-[#FAF6F0]">
        <div className="absolute inset-0">
          <CoffeeImage
            src={settings?.hero_image_url || '/src/assets/images/hero_coffee_roastery_1795667817953.jpg'}
            alt={settings?.shop_name || 'Roast & Reverie Roastery'}
            className="h-full w-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0F0A]/90 via-[#1A0F0A]/65 to-[#1A0F0A]/30" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-widest text-[#E5D9C8]">
              {settings?.shop_name || 'Roast & Reverie'} · {settings?.established_year || 'Est. 2019'}
            </p>
            <h1 className="mt-4 font-editorial text-4xl font-semibold leading-tight tracking-tight text-[#FAF6F0] sm:text-5xl lg:text-6xl">
              {settings?.hero_title || 'Small-Batch Coffee Roasted for Unhurried Mornings'}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#E5D9C8]/90 sm:text-lg">
              {settings?.hero_subtitle ||
                'Single-origin pour-overs, velvet espresso drinks, slow-steeped cold brews, and warm morning pastries crafted daily.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-md bg-[#B86B2B] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#9A551E]"
              >
                Order Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center rounded-md border border-[#E5D9C8]/50 px-6 py-3 text-sm font-medium text-[#FAF6F0] transition-colors hover:border-[#FAF6F0] hover:bg-white/10"
              >
                Explore Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {(settingsError || error) && (
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <ErrorNotice
            message={settingsError || error}
            onRetry={() => {
              refreshSettings();
              loadHomeData();
            }}
          />
        </div>
      )}

      {/* 2. Categories & Roastery Intro */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 border-b border-[#E5D9C8] pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p className="text-xs font-medium tracking-wider text-[#9A551E]">
              {settings?.established_year || 'Est. 2019'} · {settings?.tagline || 'Craft Roastery'}
            </p>
            <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#2A1B12] sm:text-4xl">
              {settings?.about_title || 'Slow Roasting. Honest Sourcing. Quiet Craft.'}
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-sm leading-relaxed text-[#6E5A4F] sm:text-base">
              {settings?.about_story ||
                'We roast high-elevation Arabica micro-lots in small weekly batches, paired with organic dairy and fresh morning pastries.'}
            </p>
            <Link
              to="/about"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#9A551E] hover:text-[#2A1B12]"
            >
              Read our roastery story <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-xl font-semibold text-[#2A1B12]">Menu Categories</h3>
              <Link to="/menu" className="text-xs font-medium text-[#9A551E] hover:text-[#2A1B12]">
                View complete menu
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/menu?category=${cat.slug}`}
                  className="group border border-[#E5D9C8] bg-[#FDFBF7] p-4 transition-colors hover:border-[#B86B2B]"
                >
                  <p className="font-editorial text-base font-semibold text-[#2A1B12] group-hover:text-[#9A551E]">
                    {cat.name}
                  </p>
                  <p className="mt-1 text-xs text-[#6E5A4F] tabular-nums">
                    {cat.product_count} {Number(cat.product_count) === 1 ? 'item' : 'items'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Featured Drinks & Bestsellers */}
      <section className="border-y border-[#E5D9C8] bg-[#F3ECE1]/65 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#9A551E]">Curated Selection</p>
              <h2 className="mt-1 font-editorial text-3xl font-semibold text-[#2A1B12]">
                Featured Pourings
              </h2>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2A1B12] hover:text-[#B86B2B]"
            >
              Browse all drinks <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8">
            {loading ? (
              <LoadingGrid count={3} />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((prod) => (
                  <ProductCard key={prod.id} product={prod} currency={currency} />
                ))}
              </div>
            )}
          </div>

          {!loading && bestsellers.length > 0 && (
            <div className="mt-16 border-t border-[#E5D9C8] pt-14">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#9A551E]">Guest Favorites</p>
                  <h2 className="mt-1 font-editorial text-3xl font-semibold text-[#2A1B12]">
                    Bestselling Classics
                  </h2>
                </div>
                <Link
                  to="/menu?sort=rating"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2A1B12] hover:text-[#B86B2B]"
                >
                  See top rated <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bestsellers.map((prod) => (
                  <ProductCard key={`best-${prod.id}`} product={prod} currency={currency} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Active Offers & Guest Reviews */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {offers.length > 0 && (
          <div className="mb-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#9A551E]">Seasonal Promotions</p>
                <h2 className="mt-1 font-editorial text-3xl font-semibold text-[#2A1B12]">
                  Current Offers
                </h2>
              </div>
              <Link to="/offers" className="text-sm font-medium text-[#9A551E] hover:text-[#2A1B12]">
                All active offers
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {offers.slice(0, 2).map((offer) => (
                <div
                  key={offer.id}
                  className="flex flex-col justify-between border border-[#E5D9C8] bg-[#FDFBF7] p-6"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#9A551E]">
                      <Tag className="h-3.5 w-3.5" />
                      <span>
                        {offer.discount_type === 'percentage'
                          ? `${Number(offer.discount_value)}% Off`
                          : `${formatPrice(offer.discount_value, currency)} Off`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Valid through {formatDate(offer.expires_at)}</span>
                    </div>
                    <h3 className="mt-2 font-editorial text-xl font-semibold text-[#2A1B12]">
                      {offer.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#6E5A4F]">{offer.description}</p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#E5D9C8] pt-4">
                    <span className="font-mono text-xs font-semibold text-[#2A1B12]">
                      Code: {offer.coupon_code || 'Automatic'}
                    </span>
                    <Link
                      to="/offers"
                      className="text-xs font-medium text-[#9A551E] hover:text-[#2A1B12]"
                    >
                      Claim Offer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length > 0 && (
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#9A551E]">Community Notes</p>
                <h2 className="mt-1 font-editorial text-3xl font-semibold text-[#2A1B12]">
                  What Guests Say
                </h2>
              </div>
              <Link to="/reviews" className="text-sm font-medium text-[#9A551E] hover:text-[#2A1B12]">
                Read all reviews
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((rev) => (
                <div key={rev.id} className="border border-[#E5D9C8] bg-[#FDFBF7] p-6">
                  <div className="flex items-center justify-between text-xs text-[#6E5A4F]">
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#B86B2B] tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-[#B86B2B]" />
                      {rev.rating}.0 / 5
                    </span>
                    <span>{formatDate(rev.created_at)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#2A1B12]">“{rev.comment}”</p>
                  <div className="mt-4 border-t border-[#E5D9C8] pt-3 text-xs text-[#6E5A4F]">
                    <p className="font-semibold text-[#2A1B12]">{rev.display_name}</p>
                    <p className="mt-0.5">
                      {rev.product_name}
                      {rev.is_sample ? ' · Sample Data' : ' · Verified Purchase'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visit Info Strip */}
        <div className="mt-16 grid grid-cols-1 gap-6 border border-[#E5D9C8] bg-[#FDFBF7] p-6 md:grid-cols-3 md:p-8">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#B86B2B]" />
            <div>
              <h3 className="text-sm font-semibold text-[#2A1B12]">Roastery &amp; Bar</h3>
              <p className="mt-1 text-sm text-[#6E5A4F]">
                {settings?.address || '14-B Zafar Ali Road, Gulberg V, Lahore'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#B86B2B]" />
            <div>
              <h3 className="text-sm font-semibold text-[#2A1B12]">Opening Hours</h3>
              <div className="mt-1 space-y-1 text-sm text-[#6E5A4F]">
                {(settings?.opening_hours || []).map((row, i) => (
                  <p key={i} className="tabular-nums">
                    {row.day}: {row.hours}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#B86B2B]" />
            <div>
              <h3 className="text-sm font-semibold text-[#2A1B12]">Direct Line</h3>
              <p className="mt-1 text-sm text-[#6E5A4F] tabular-nums">
                {settings?.contact_phone || '+92 42 3578 9042'}
              </p>
              <p className="text-sm text-[#6E5A4F]">
                {settings?.contact_email || 'hello@roastandreverie.pk'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
