import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { PublicAPI } from '../../api/services.js';
import { extractErrorMessage } from '../../api/axiosClient.js';
import ProductCard from '../../components/ProductCard.jsx';
import { EmptyState, ErrorNotice, LoadingGrid } from '../../components/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function MenuPage() {
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialCategory = searchParams.get('category') || 'all';
  const initialSort = searchParams.get('sort') || 'featured';
  const initialSearch = searchParams.get('search') || '';
  const initialPage = Number(searchParams.get('page') || 1);

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    PublicAPI.getCategories()
      .then((res) => setCategories(res.categories || []))
      .catch(() => {});
  }, []);

  const loadProducts = async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await PublicAPI.getProducts({
        category: params.category,
        sort: params.sort,
        search: params.search,
        page: params.page,
        limit: 9,
      });
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, total_pages: 1, total: 0 });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextParams = {};
      if (category !== 'all') nextParams.category = category;
      if (sort !== 'featured') nextParams.sort = sort;
      if (searchInput.trim()) nextParams.search = searchInput.trim();
      if (page > 1) nextParams.page = String(page);
      setSearchParams(nextParams, { replace: true });
      loadProducts({ category, sort, search: searchInput.trim(), page });
    }, 200);

    return () => clearTimeout(timer);
  }, [category, sort, searchInput, page]);

  const handleCategoryChange = (slug) => {
    setCategory(slug);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E5D9C8] pb-8">
        <p className="text-xs font-medium text-[#9A551E]">Freshly Roasted &amp; Brewed</p>
        <h1 className="mt-2 font-editorial text-4xl font-semibold text-[#2A1B12]">Complete Menu</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6E5A4F]">
          Explore espresso craft, slow-steeped cold brews, single-origin filter pourings, pastries, and whole-bean bags.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#F3ECE1] p-1">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-medium transition-colors ${
              category === 'all'
                ? 'bg-[#FDFBF7] text-[#2A1B12] shadow-sm'
                : 'text-[#6E5A4F] hover:text-[#2A1B12]'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-medium transition-colors ${
                category === cat.slug
                  ? 'bg-[#FDFBF7] text-[#2A1B12] shadow-sm'
                  : 'text-[#6E5A4F] hover:text-[#2A1B12]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search & Price Sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E5A4F]" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search drinks, notes, beans..."
              className="w-full rounded-md border border-[#E5D9C8] bg-[#FDFBF7] py-2 pl-9 pr-3 text-sm text-[#2A1B12] placeholder:text-[#6E5A4F]/70 focus:border-[#B86B2B] focus:outline-none sm:w-64"
            />
          </div>

          <select
            aria-label="Sort menu products"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-[#E5D9C8] bg-[#FDFBF7] px-3 py-2 text-sm text-[#2A1B12] focus:border-[#B86B2B] focus:outline-none"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      {!loading && !error && (
        <p className="mt-5 text-xs text-[#6E5A4F] tabular-nums">
          Showing {products.length} of {pagination.total} menu items
        </p>
      )}

      {/* Grid */}
      <div className="mt-5">
        {loading ? (
          <LoadingGrid count={6} />
        ) : error ? (
          <ErrorNotice
            message={error}
            onRetry={() => loadProducts({ category, sort, search: searchInput.trim(), page })}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No matching drinks or pastries found"
            description="Try clearing your search query or switching to another category."
            action={
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setCategory('all');
                  setSort('featured');
                  setPage(1);
                }}
                className="rounded-md bg-[#2A1B12] px-4 py-2 text-xs font-medium text-[#FAF6F0] hover:bg-[#B86B2B]"
              >
                Reset Filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                currency={settings?.currency_code || 'PKR'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-md border border-[#E5D9C8] bg-[#FDFBF7] px-3.5 py-2 text-xs font-medium text-[#2A1B12] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="font-mono text-xs text-[#6E5A4F] tabular-nums">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.total_pages}
            onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
            className="inline-flex items-center gap-1 rounded-md border border-[#E5D9C8] bg-[#FDFBF7] px-3.5 py-2 text-xs font-medium text-[#2A1B12] disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
