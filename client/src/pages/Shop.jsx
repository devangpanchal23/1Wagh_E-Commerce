import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ChevronRight, X, RotateCcw } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PriceRangeFilter } from '../components/PriceRangeFilter';
import { fetchApi } from '../api';

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter States
  const searchQueryParam = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedSort = searchParams.get('sort') || 'newest';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const inStockParam = searchParams.get('inStock') === 'true';
  const pageParam = parseInt(searchParams.get('page')) || 1;

  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [inStockOnly, setInStockOnly] = useState(inStockParam);
  const [maxLimit, setMaxLimit] = useState(2000);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetchApi('/categories');
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Categories load error', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: pageParam.toString(),
          limit: '12',
          sort: selectedSort,
        });

        if (searchQueryParam) queryParams.append('search', searchQueryParam);
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (minPriceParam) queryParams.append('minPrice', minPriceParam);
        if (maxPriceParam) queryParams.append('maxPrice', maxPriceParam);
        if (inStockParam) queryParams.append('inStock', 'true');

        const res = await fetchApi(`/products?${queryParams.toString()}`);
        if (res.success && res.data) {
          setProducts(res.data.products || []);
          setTotalCount(res.data.total || 0);
          setTotalPages(res.data.pages || 1);
          if (res.data.maxProductPrice) {
            setMaxLimit(res.data.maxProductPrice);
          }
        }
      } catch (err) {
        console.error('Products load error', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [searchParams]);

  const updateFilters = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const updated = { ...current, ...newParams };

    // Changing a filter sends you back to page 1, but paging is itself a filter
    // change here — so only reset when the caller isn't setting the page.
    if (!('page' in newParams)) updated.page = '1';
    
    // Remove empty parameters
    Object.keys(updated).forEach((key) => {
      if (!updated[key]) delete updated[key];
    });

    setSearchParams(updated);
  };

  const handleCategoryToggle = (cat) => {
    const matchSlugOrId = cat.slug || cat._id;
    if (selectedCategory === cat.slug || selectedCategory === cat._id) {
      updateFilters({ category: '' });
    } else {
      updateFilters({ category: matchSlugOrId });
    }
  };

  const handleApplyPrice = (e) => {
    e.preventDefault();
    updateFilters({ minPrice, maxPrice });
  };

  const handleClearAll = () => {
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-mono-tag text-wagh-muted">
        <Link to="/" className="hover:text-wagh-teal">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-wagh-teal font-bold">Shop All Products</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-wagh-border pb-6">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-wagh-dark">
            All Mobile Accessories
          </h1>
          <p className="text-wagh-muted text-sm mt-1">
            Browse our complete catalog of Super Fast chargers, heavy-duty braided cables, power banks, and audio gear.
          </p>
        </div>

        {/* Mobile Filter Toggle & Sort Dropdown */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-4 py-2.5 rounded-xl border border-wagh-border bg-white text-wagh-dark text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <Filter className="w-4 h-4 text-wagh-teal" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono-tag">
            <span className="hidden sm:inline text-wagh-muted">Sort by:</span>
            <select
              value={selectedSort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="px-3 py-2 rounded-xl border border-wagh-border bg-white text-wagh-dark text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-wagh-teal"
            >
              <option value="newest">Newest First</option>
              <option value="popularity">Popularity & Rating</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* DESKTOP SIDEBAR FILTERS */}
        <aside className="hidden lg:block lg:col-span-3 bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-6 sticky top-24">
          <div className="flex items-center justify-between border-b border-wagh-border pb-4">
            <div className="flex items-center gap-2 font-bold text-wagh-dark">
              <SlidersHorizontal className="w-4 h-4 text-wagh-teal" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleClearAll}
              className="text-xs font-mono-tag text-wagh-teal hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>

          {/* Availability Filter */}
          <div className="space-y-3">
            <h4 className="font-mono-tag text-xs font-bold uppercase tracking-wider text-wagh-muted">Availability</h4>
            <label className="flex items-center gap-2.5 text-sm text-wagh-dark cursor-pointer">
              <input
                type="checkbox"
                checked={inStockParam}
                onChange={(e) => updateFilters({ inStock: e.target.checked ? 'true' : '' })}
                className="w-4 h-4 rounded text-wagh-teal focus:ring-wagh-teal border-gray-300"
              />
              <span>In Stock Only</span>
            </label>
          </div>

          <hr className="border-wagh-border" />

          {/* Categories Filter */}
          <div className="space-y-3">
            <h4 className="font-mono-tag text-xs font-bold uppercase tracking-wider text-wagh-muted">Category</h4>
            <div className="space-y-2">
              {categories.map((cat) => {
                const isSelected =
                  selectedCategory === cat.slug ||
                  selectedCategory === cat._id ||
                  selectedCategory.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat._id}
                    onClick={() => handleCategoryToggle(cat)}
                    className={`w-full text-left text-sm py-1.5 px-3 rounded-xl transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-wagh-teal text-white font-bold shadow-xs'
                        : 'text-wagh-dark/80 hover:bg-wagh-teal/10 hover:text-wagh-teal font-medium'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-wagh-border" />

          {/* Price Range Filter */}
          <PriceRangeFilter
            minPrice={minPrice}
            maxPrice={maxPrice}
            minLimit={0}
            maxLimit={maxLimit}
            currencySymbol="₹"
            onApply={({ minPrice: newMin, maxPrice: newMax }) => {
              setMinPrice(newMin);
              setMaxPrice(newMax);
              updateFilters({ minPrice: newMin, maxPrice: newMax });
            }}
          />
        </aside>

        {/* PRODUCT GRID SECTION */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tag text-wagh-muted">
            <span>Showing {products.length} of {totalCount} products</span>

            {/* Active Filter Badges */}
            {(searchQueryParam || selectedCategory || minPriceParam || maxPriceParam || inStockParam) && (
              <div className="flex flex-wrap items-center gap-2">
                {searchQueryParam && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-wagh-teal font-bold border border-teal-200">
                    Search: "{searchQueryParam}"
                    <button onClick={() => updateFilters({ search: '' })} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-wagh-teal font-bold border border-teal-200">
                    Category: {categories.find(c => c.slug === selectedCategory || c._id === selectedCategory)?.name || selectedCategory}
                    <button onClick={() => updateFilters({ category: '' })} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(minPriceParam || maxPriceParam) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-wagh-teal font-bold border border-teal-200">
                    Price: ₹{minPriceParam || 0} - ₹{maxPriceParam || maxLimit}
                    <button onClick={() => updateFilters({ minPrice: '', maxPrice: '' })} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearAll}
                  className="text-xs text-wagh-teal underline font-bold hover:text-wagh-teal-dark ml-1"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <LoadingSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-wagh-border p-12 text-center space-y-4 shadow-sm">
              <h3 className="font-editorial text-2xl font-bold text-wagh-dark">No products found matching filters</h3>
              <p className="text-sm text-wagh-muted">Try clearing search keywords or active filters to view all products.</p>
              <button
                onClick={handleClearAll}
                className="px-6 py-2.5 rounded-full bg-wagh-teal text-white text-xs font-bold hover:bg-wagh-teal-dark transition-colors cursor-pointer shadow-sm"
              >
                Clear All Filters & View All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="pt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === pageParam;
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateFilters({ page: pageNum.toString() })}
                    className={`w-10 h-10 rounded-xl font-mono-tag text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-wagh-teal text-white shadow-md'
                        : 'bg-white text-wagh-dark border border-wagh-border hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div onClick={() => setMobileFilterOpen(false)} className="fixed inset-0 bg-wagh-dark/60 backdrop-blur-sm" />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-wagh-bg shadow-2xl p-6 overflow-y-auto space-y-6 z-50">
            <div className="flex items-center justify-between border-b border-wagh-border pb-4">
              <h3 className="font-editorial text-xl font-bold text-wagh-dark">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded-full text-wagh-dark">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Filter Options */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-mono-tag text-xs font-bold uppercase text-wagh-muted">Category</h4>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => {
                      handleCategoryToggle(cat.slug);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left py-2 px-3 rounded-xl text-sm ${
                      selectedCategory === cat.slug ? 'bg-wagh-teal text-white font-bold' : 'text-wagh-dark'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <PriceRangeFilter
                minPrice={minPrice}
                maxPrice={maxPrice}
                minLimit={0}
                maxLimit={maxLimit}
                currencySymbol="₹"
                onApply={({ minPrice: newMin, maxPrice: newMax }) => {
                  setMinPrice(newMin);
                  setMaxPrice(newMax);
                  updateFilters({ minPrice: newMin, maxPrice: newMax });
                }}
              />

              <button
                onClick={() => {
                  handleClearAll();
                  setMobileFilterOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-wagh-dark text-white font-mono-tag text-xs font-bold"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
