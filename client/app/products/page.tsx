'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

interface Product {
  _id: string;
  name: string;
  description: string;
  sellingPrice: number;
  basePrice: number;
  images: string[];
  category: string;
  allowBargaining: boolean;
  sellerId: {
    businessName: string;
  };
  priceDiscount: number;
  rating: {
    average: number;
  };
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    allowBargaining: searchParams.get('allowBargaining') || '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Fashion & Clothing' },
    { value: 'home', label: 'Home & Living' },
    { value: 'books', label: 'Books' },
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'grocery', label: 'Grocery' },
  ];

  useEffect(() => {
    fetchProducts();
  }, [filters, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.allowBargaining) params.append('allowBargaining', filters.allowBargaining);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.products || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Flipkart/Amazon Style */}
        <div style={{ 
          marginBottom: '24px',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            {filters.search ? `Search Results for "${filters.search}"` : 'All Products'}
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.95 }}>
            {total} {total === 1 ? 'product' : 'products'} found {filters.category && `in ${categories.find(c => c.value === filters.category)?.label}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters - Amazon/Flipkart Style */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 sticky top-20" style={{ borderRadius: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px' }}>Filters</h2>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Category</h3>
                <select
                  style={{
                    width: '100%',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: '#ffffff'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2874f0';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  value={filters.category}
                  onChange={(e) => {
                    setFilters({ ...filters, category: e.target.value });
                    setPage(1);
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Price Range</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.minPrice}
                    onChange={(e) => {
                      setFilters({ ...filters, minPrice: e.target.value });
                      setPage(1);
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.maxPrice}
                    onChange={(e) => {
                      setFilters({ ...filters, maxPrice: e.target.value });
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              {/* Bargaining Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Deals</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.allowBargaining === 'true'}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          allowBargaining: e.target.checked ? 'true' : '',
                        });
                        setPage(1);
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Bargaining Available</span>
                  </label>
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Sort By</h3>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters({ ...filters, sortBy, sortOrder });
                    setPage(1);
                  }}
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="sellingPrice-asc">Price: Low to High</option>
                  <option value="sellingPrice-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    category: '',
                    allowBargaining: '',
                    minPrice: '',
                    maxPrice: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                  });
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  color: '#374151',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '2px solid #d1d5db',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-md shadow-sm h-96 animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      id={product._id}
                      name={product.name}
                      price={product.sellingPrice}
                      originalPrice={product.basePrice}
                      discount={product.priceDiscount}
                      image={product.images?.[0]}
                      seller={product.sellerId?.businessName}
                      allowBargaining={product.allowBargaining}
                      rating={product.rating?.average || 0}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {Math.ceil(total / 20) > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(5, Math.ceil(total / 20)))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 border rounded-md ${
                            page === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(Math.min(Math.ceil(total / 20), page + 1))}
                      disabled={page >= Math.ceil(total / 20)}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-md shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={() => {
                    setFilters({
                      search: '',
                      category: '',
                      allowBargaining: '',
                      minPrice: '',
                      maxPrice: '',
                      sortBy: 'createdAt',
                      sortOrder: 'desc',
                    });
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
