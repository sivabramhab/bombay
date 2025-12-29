'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { getProductImageUrl } from '@/lib/imageUtils';

interface Product {
  _id: string;
  name: string;
  sellingPrice: number;
  basePrice: number;
  images: string[];
  sellerId: {
    businessName: string;
  };
  priceDiscount: number;
  allowBargaining: boolean;
  category: string;
  rating: {
    average: number;
  };
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchBestSellers();
    fetchTrendingProducts();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await api.get('/products?limit=8');
      setFeaturedProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBestSellers = async () => {
    try {
      const response = await api.get('/products?sortBy=sellingPrice&sortOrder=desc&limit=6');
      setBestSellers(response.data.products || []);
    } catch (error) {
      console.error('Error fetching best sellers:', error);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      const response = await api.get('/products?sortBy=rating&sortOrder=desc&limit=6');
      setTrendingProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching trending products:', error);
    }
  };

  const categories = [
    { name: 'Electronics', icon: '📱', href: '/products?category=electronics' },
    { name: 'Fashion', icon: '👕', href: '/products?category=clothing' },
    { name: 'Home & Living', icon: '🏠', href: '/products?category=home' },
    { name: 'Books', icon: '📚', href: '/products?category=books' },
    { name: 'Sports', icon: '⚽', href: '/products?category=sports' },
    { name: 'Beauty', icon: '💄', href: '/products?category=beauty' },
    { name: 'Toys', icon: '🎲', href: '/products?category=toys' },
    { name: 'Grocery', icon: '🛒', href: '/products?category=grocery' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
      {/* Hero Banner Carousel - Flipkart Style */}
      <section style={{ backgroundColor: '#ffffff', padding: '20px 0', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div className="hero-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
            gap: '12px' 
          }}>
            {/* Carousel Banner - Flipkart Blue */}
            <div className="hero-banner" style={{ 
              gridColumn: 'span 2',
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '280px',
              boxShadow: '0 4px 6px rgba(40,116,240,0.3)'
            }}>
              {[
                { 
                  bg: 'linear-gradient(135deg, #2874f0 0%, #1e62d9 100%)',
                  title: 'Save Up To 10% More!',
                  desc: 'Products 10% cheaper than Amazon & Flipkart',
                  color: '#ffd700'
                },
                { 
                  bg: 'linear-gradient(135deg, #fb641b 0%, #ff8c00 100%)',
                  title: 'Flash Sale On Now!',
                  desc: 'Up to 50% OFF on selected items',
                  color: '#ffffff'
                },
                { 
                  bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  title: 'Free Delivery Above ₹500',
                  desc: 'Multiple delivery options available',
                  color: '#ffffff'
                }
              ].map((slide, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: slide.bg,
                    padding: '40px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    opacity: carouselIndex === idx ? 1 : 0,
                    transition: 'opacity 0.8s ease-in-out',
                    zIndex: carouselIndex === idx ? 1 : 0
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ fontSize: '14px', color: slide.color, marginBottom: '8px', fontWeight: '600', letterSpacing: '1px' }}>
                      {idx === 0 ? 'SPECIAL OFFER' : idx === 1 ? 'LIMITED TIME' : 'EXCLUSIVE'}
                    </div>
                    <h1 style={{ fontSize: '34px', fontWeight: 'bold', marginBottom: '12px', color: '#ffffff', lineHeight: '1.2' }}>
                      {slide.title} 🎉
                    </h1>
                    <p style={{ fontSize: '17px', marginBottom: '24px', color: '#ffffff', lineHeight: '1.6' }}>
                      {slide.desc}
                    </p>
                    <Link
                      href="/products"
                      style={{
                        backgroundColor: '#ffffff',
                        color: idx === 0 ? '#2874f0' : idx === 1 ? '#fb641b' : '#10b981',
                        padding: '14px 32px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-block',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        letterSpacing: '0.3px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      Shop Now →
                    </Link>
                  </div>
                  <div style={{
                    position: 'absolute',
                    right: '-30px',
                    bottom: '-30px',
                    width: '180px',
                    height: '180px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '50%',
                    zIndex: 1
                  }}></div>
                </div>
              ))}
              {/* Carousel Indicators */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                zIndex: 10
              }}>
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    style={{
                      width: carouselIndex === idx ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: carouselIndex === idx ? '#ffffff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Side Offers - Flipkart Orange Style */}
            <div style={{ 
              backgroundColor: '#fff5f0', 
              borderRadius: '8px', 
              padding: '24px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              border: '2px solid #fb641b',
              boxShadow: '0 2px 8px rgba(251,100,27,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: '42px', marginBottom: '12px', textAlign: 'center', position: 'relative', zIndex: 1 }}>⚡</div>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#c2410c', fontSize: '18px', textAlign: 'center', position: 'relative', zIndex: 1 }}>Flash Sale</div>
              <div style={{ fontSize: '12px', color: '#9a3412', textAlign: 'center', marginBottom: '10px', position: 'relative', zIndex: 1 }}>Limited Time Offer</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fb641b', textAlign: 'center', position: 'relative', zIndex: 1 }}>Upto 50% OFF</div>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                background: 'rgba(251,100,27,0.1)',
                borderRadius: '50%',
                zIndex: 0
              }}></div>
            </div>
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              borderRadius: '8px', 
              padding: '24px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              border: '2px solid #2874f0',
              boxShadow: '0 2px 8px rgba(40,116,240,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: '42px', marginBottom: '12px', textAlign: 'center', position: 'relative', zIndex: 1 }}>🚚</div>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#1e3a8a', fontSize: '18px', textAlign: 'center', position: 'relative', zIndex: 1 }}>Free Delivery</div>
              <div style={{ fontSize: '12px', color: '#1e40af', textAlign: 'center', marginBottom: '10px', position: 'relative', zIndex: 1 }}>On all orders</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#2874f0', textAlign: 'center', position: 'relative', zIndex: 1 }}>Above ₹500</div>
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                left: '-20px',
                width: '80px',
                height: '80px',
                background: 'rgba(40,116,240,0.1)',
                borderRadius: '50%',
                zIndex: 0
              }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Flipkart/JioMart Exact Style */}
      <section style={{ backgroundColor: '#ffffff', padding: '32px 0', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1f2937', letterSpacing: '-0.5px' }}>Shop by Category</h2>
            <Link href="/products" style={{ color: '#2874f0', fontWeight: '600', textDecoration: 'none', fontSize: '15px' }}>
              View All →
            </Link>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
            gap: '12px'
          }}>
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#374151',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid #f3f4f6',
                  backgroundColor: '#ffffff',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#2874f0';
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(40,116,240,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  width: '72px', 
                  height: '72px', 
                  background: 'linear-gradient(135deg, #2874f0 0%, #1e62d9 100%)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '14px',
                  boxShadow: '0 4px 12px rgba(40,116,240,0.3)',
                  transition: 'all 0.3s'
                }}>
                  <span style={{ fontSize: '32px' }}>{category.icon}</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', textAlign: 'center', color: '#1f2937', lineHeight: '1.4' }}>
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deal of the Day - Flipkart Orange Style */}
      <section style={{ 
        background: 'linear-gradient(135deg, #fb641b 0%, #ff8c00 100%)', 
        color: 'white', 
        padding: '36px 0',
        marginTop: '32px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                fontSize: '32px',
                width: '56px',
                height: '56px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>⚡</div>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>Deal of the Day</h2>
                <p style={{ fontSize: '14px', opacity: 0.95 }}>Limited time offers - Ends in: <span style={{ fontWeight: 'bold' }}>23:59:45</span></p>
              </div>
            </div>
            <Link 
              href="/products" 
              style={{
                backgroundColor: 'white',
                color: '#f5576c',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
              }}
            >
              View All Deals →
            </Link>
          </div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {[
              { icon: '🔥', title: 'Flash Sale', desc: 'Up to 50% OFF on selected items', color: '#fbbf24' },
              { icon: '💬', title: 'Bargain Deals', desc: 'Negotiate & save more with sellers', color: '#10b981' },
              { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹500', color: '#3b82f6' }
            ].map((deal, idx) => (
              <div 
                key={idx}
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)', 
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px', 
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ 
                  fontSize: '40px',
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>{deal.icon}</div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{deal.title}</h3>
                  <p style={{ fontSize: '13px', opacity: 0.95 }}>{deal.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers Section - Flipkart Style */}
      {bestSellers.length > 0 && (
        <section style={{ backgroundColor: '#ffffff', padding: '48px 0', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                  Best Sellers 🔥
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Most popular products this week</p>
              </div>
              <Link href="/products?sortBy=sellingPrice&sortOrder=desc" style={{ color: '#2874f0', fontWeight: '600', textDecoration: 'none', fontSize: '15px' }}>
                View All →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {bestSellers.slice(0, 6).map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.sellingPrice}
                  originalPrice={product.basePrice}
                  discount={product.priceDiscount}
                  image={product.images?.[0] ? getProductImageUrl(product.images[0]) || product.images[0] : undefined}
                  seller={product.sellerId?.businessName}
                  allowBargaining={product.allowBargaining}
                  rating={product.rating?.average || 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Now Section - Myntra Style */}
      {trendingProducts.length > 0 && (
        <section style={{ backgroundColor: '#f8f9fa', padding: '48px 0', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                  Trending Now ⚡
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Highest rated products</p>
              </div>
              <Link href="/products?sortBy=rating&sortOrder=desc" style={{ color: '#2874f0', fontWeight: '600', textDecoration: 'none', fontSize: '15px' }}>
                View All →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {trendingProducts.slice(0, 6).map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.sellingPrice}
                  originalPrice={product.basePrice}
                  discount={product.priceDiscount}
                  image={product.images?.[0] ? getProductImageUrl(product.images[0]) || product.images[0] : undefined}
                  seller={product.sellerId?.businessName}
                  allowBargaining={product.allowBargaining}
                  rating={product.rating?.average || 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products - Amazon/Flipkart Grid */}
      <section style={{ backgroundColor: '#ffffff', padding: '48px 0', flex: 1 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px', letterSpacing: '-0.5px' }}>Featured Products</h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Handpicked deals for you</p>
            </div>
            <Link href="/products" style={{ color: '#2874f0', fontWeight: '600', textDecoration: 'none', fontSize: '15px' }}>
              View All →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '8px', height: '420px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.sellingPrice}
                  originalPrice={product.basePrice}
                  discount={product.priceDiscount}
                  image={product.images?.[0] ? getProductImageUrl(product.images[0]) || product.images[0] : undefined}
                  seller={product.sellerId?.businessName}
                  allowBargaining={product.allowBargaining}
                  rating={product.rating?.average || 0}
                />
              ))}
            </div>
          )}

          {!loading && featuredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'white', borderRadius: '8px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
              <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '8px' }}>No products available yet</p>
              <Link
                href="/seller/register"
                style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}
              >
                Be the first seller →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us - JioMart Style */}
      <section style={{ backgroundColor: 'white', padding: '56px 0', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px', color: '#1f2937', letterSpacing: '-0.5px' }}>
            Why Choose MarketPlace?
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '40px', fontSize: '15px' }}>
            Experience shopping like never before
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            {[
              { 
                icon: '💰', 
                title: 'Competitive Pricing', 
                desc: 'Guaranteed 10% cheaper than Amazon and Flipkart',
                color: '#10b981',
                bg: '#f0fdf4'
              },
              { 
                icon: '🤝', 
                title: 'Bargaining', 
                desc: 'Negotiate prices on select products for better deals',
                color: '#f59e0b',
                bg: '#fffbeb'
              },
              { 
                icon: '🚚', 
                title: 'Flexible Delivery', 
                desc: 'Multiple delivery options: Metro, Dabbawala, Pickup',
                color: '#3b82f6',
                bg: '#eff6ff'
              },
              { 
                icon: '🎯', 
                title: 'Price Challenges', 
                desc: 'Challenge sellers to beat competitor prices',
                color: '#8b5cf6',
                bg: '#f5f3ff'
              }
            ].map((feature, idx) => (
              <div 
                key={idx}
                style={{ 
                  textAlign: 'center', 
                  padding: '32px 24px', 
                  backgroundColor: feature.bg,
                  borderRadius: '12px',
                  border: `2px solid ${feature.color}20`,
                  transition: 'all 0.3s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 12px 24px ${feature.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  fontSize: '56px', 
                  marginBottom: '20px',
                  display: 'inline-block',
                  transform: 'scale(1)',
                  transition: 'transform 0.3s'
                }}>{feature.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: '#1f2937', letterSpacing: '-0.3px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
        
        /* Large Desktop (1400px+) */
        @media (min-width: 1400px) {
          .hero-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .hero-banner {
            grid-column: span 2 !important;
            height: 300px !important;
          }
        }
        
        /* Desktop (1024px - 1399px) */
        @media (min-width: 1024px) and (max-width: 1399px) {
          .hero-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .hero-banner {
            grid-column: span 2 !important;
            height: 280px !important;
          }
        }
        
        /* Tablet (768px - 1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .hero-banner {
            grid-column: span 2 !important;
            height: 240px !important;
          }
        }
        
        /* Mobile Large (481px - 767px) */
        @media (min-width: 481px) and (max-width: 767px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
          .hero-banner {
            grid-column: span 1 !important;
            height: 220px !important;
          }
        }
        
        /* Mobile Small (320px - 480px) */
        @media (max-width: 480px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .hero-banner {
            grid-column: span 1 !important;
            height: 180px !important;
          }
        }
        
        /* Landscape Mobile */
        @media (max-width: 896px) and (orientation: landscape) {
          .hero-banner {
            height: 160px !important;
          }
        }
      `}</style>
    </div>
  );
}
