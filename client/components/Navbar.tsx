'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout, loadUser } = useAuthStore();
  const { totalItems } = useCartStore();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navLinks = [
    { href: '/products', label: 'Products', icon: '📦' },
    { href: '/challenges', label: 'Challenges', icon: '🎯' },
  ];

  if (isAuthenticated && user?.isSeller) {
    navLinks.push({ href: '/seller/dashboard', label: 'Seller', icon: '🏪' });
  }

  if (isAuthenticated && (user?.role === 'admin' || user?.role === 'verifier')) {
    navLinks.push({ href: '/admin', label: 'Admin', icon: '⚙️' });
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Bar - Flipkart/Amazon Style */}
      <div style={{ 
        background: 'linear-gradient(90deg, #2874f0 0%, #1e62d9 100%)', 
        color: 'white', 
        padding: '6px 0',
        fontSize: '12px'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span style={{ fontWeight: '500' }}>📱 Save Upto 10% More Than Amazon & Flipkart</span>
            <span className="hidden md:inline" style={{ opacity: 0.7 }}>|</span>
            <span className="hidden md:inline" style={{ fontWeight: '500' }}>🚚 Free Delivery on Orders Above ₹500</span>
            <span className="hidden lg:inline" style={{ opacity: 0.7 }}>|</span>
            <span className="hidden lg:inline" style={{ fontWeight: '500' }}>💳 Easy Returns & Refunds</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/orders" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }} className="hover:underline">My Orders</Link>
                <Link href="/profile" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }} className="hover:underline">{user?.name?.split(' ')[0]}</Link>
              </>
            ) : (
              <>
                <Link href="/login" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }} className="hover:underline">Login</Link>
                <Link href="/register" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }} className="hover:underline">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar - Flipkart/Amazon Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Flipkart Exact Style */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div style={{ 
              fontSize: '26px', 
              fontWeight: 'bold', 
              color: '#2874f0',
              letterSpacing: '-0.5px'
            }}>
              MarketPlace
            </div>
            <div className="hidden md:flex flex-col items-start" style={{ marginLeft: '4px' }}>
              <span style={{ fontSize: '11px', color: '#fb641b', fontWeight: 'bold', lineHeight: '1.2', fontStyle: 'normal' }}>10% Cheaper</span>
              <span style={{ fontSize: '10px', color: '#2874f0', fontStyle: 'italic', lineHeight: '1.2', marginTop: '-2px' }}>Than Amazon & Flipkart</span>
            </div>
          </Link>

          {/* Search Bar - Amazon/Flipkart Style */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden md:flex">
            <div className="relative w-full flex" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more..."
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '2px solid #2874f0',
                  borderRight: 'none',
                  borderTopLeftRadius: '4px',
                  borderBottomLeftRadius: '4px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 36px',
                  background: '#fb641b',
                  color: 'white',
                  border: 'none',
                  borderTopRightRadius: '4px',
                  borderBottomRightRadius: '4px',
                  fontWeight: '500',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(251,100,27,0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ea580c';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(251,100,27,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fb641b';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(251,100,27,0.3)';
                }}
              >
                🔍 Search
              </button>
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search */}
            <button className="md:hidden text-gray-700">
              🔍
            </button>

            {/* Cart Icon */}
            <Link href="/cart" className="relative text-gray-700 hover:text-blue-600 transition">
              <span className="text-2xl">🛒</span>
              {totalItems > 0 && (
                <span 
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold"
                  style={{
                    animation: totalItems > 0 ? 'bounce 0.5s' : 'none'
                  }}
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                  <span className="text-xl">👤</span>
                  <span className="hidden md:inline">{user?.name?.split(' ')[0]}</span>
                  <span className="hidden md:inline">▼</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Profile</Link>
                  <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Orders</Link>
                  <Link href="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Wishlist</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center space-x-6 py-2 border-t border-gray-200">
          <Link
            href="/"
            className={`px-3 py-2 text-sm font-medium ${
              pathname === '/' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
            }`}
          >
            Home
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm font-medium flex items-center gap-1 ${
                pathname === link.href
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
