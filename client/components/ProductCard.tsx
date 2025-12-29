'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useEffect, useState } from 'react';

// Helper function to get window width safely
const getWindowWidth = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth;
  }
  return 1024; // Default desktop width
};

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  seller?: string;
  allowBargaining?: boolean;
  rating?: number;
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  discount,
  image,
  seller,
  allowBargaining,
  rating = 0,
}: ProductCardProps) {
  const { addToCart } = useCartStore();
  const [windowWidth, setWindowWidth] = useState(getWindowWidth());
  const discountPercentage = discount || (originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id,
      name,
      price,
      originalPrice,
      image,
      seller,
      allowBargaining,
    });
  };

  return (
    <Link href={`/products/${id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
      >
        {/* Image Container - Flipkart/Amazon Style with Zoom */}
        <div 
          style={{
            position: 'relative',
            backgroundColor: '#ffffff',
            padding: windowWidth < 640 ? '12px' : '20px',
            height: windowWidth < 640 ? '200px' : windowWidth < 1024 ? '240px' : '260px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderBottom: '1px solid #f3f4f6'
          }}
          className="product-image-container"
        >
          {image ? (
            <img
              src={image}
              alt={name}
              className="product-image"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U3RvcmU8L3RleHQ+PC9zdmc+';
              }}
              loading="lazy"
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6'
            }}>
              <span style={{ fontSize: '64px', opacity: 0.2 }}>📦</span>
            </div>
          )}
          
          {/* Badges - Flipkart Style */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 2
          }}>
            {discountPercentage > 0 && (
              <span style={{
                background: '#e53e3e',
                color: 'white',
                fontSize: '11px',
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(229,62,62,0.4)',
                letterSpacing: '0.5px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                {discountPercentage}% OFF
              </span>
            )}
            {allowBargaining && (
              <span style={{
                background: '#fb641b',
                color: 'white',
                fontSize: '11px',
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(251,100,27,0.4)',
                letterSpacing: '0.5px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                💬 Bargain
              </span>
            )}
          </div>

          {/* Wishlist Icon */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '32px',
              height: '32px',
              backgroundColor: 'white',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              opacity: 0,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0';
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <span style={{ fontSize: '18px' }}>♡</span>
          </button>
        </div>

        {/* Product Info */}
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Product Name */}
          <h3 style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#1f2937',
            marginBottom: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '40px'
          }}>
            {name}
          </h3>

          {/* Rating - Flipkart/Amazon Style */}
          {rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#2874f0',
                color: 'white',
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '4px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(40,116,240,0.3)'
              }}>
                <span>{rating.toFixed(1)}</span>
                <span style={{ marginLeft: '4px', fontSize: '11px' }}>★</span>
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>(123 reviews)</span>
              <div style={{ 
                fontSize: '12px', 
                color: '#16a34a', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <span>✓</span>
                <span>Verified</span>
              </div>
            </div>
          )}

          {/* Price Section */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                ₹{price.toLocaleString('en-IN')}
              </span>
              {originalPrice && originalPrice > price && (
                <>
                  <span style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'line-through' }}>
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                    Save ₹{(originalPrice - price).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </div>
            {originalPrice && originalPrice > price && (
              <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500', marginTop: '4px' }}>
                You save {discountPercentage}%
              </div>
            )}
          </div>

          {/* Guarantee Badge - Flipkart Style */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginBottom: '10px',
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            borderRadius: '4px',
            border: '1px solid #86efac'
          }}>
            <span style={{ fontSize: '16px', color: '#16a34a', fontWeight: 'bold' }}>✓</span>
            <span style={{ fontSize: '13px', color: '#15803d', fontWeight: '700' }}>10% Cheaper Guarantee</span>
            <span style={{ fontSize: '10px', color: '#6b7280', marginLeft: 'auto', fontWeight: '500' }}>vs Amazon/Flipkart</span>
          </div>

          {/* Delivery Info - Flipkart Style */}
          <div style={{ 
            fontSize: '13px', 
            color: '#16a34a', 
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '16px' }}>🚚</span>
            <div>
              <div style={{ fontWeight: '600', color: '#15803d', marginBottom: '2px' }}>
                Free delivery
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                Estimated delivery: <span style={{ fontWeight: '600', color: '#15803d' }}>2-3 days</span>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          {seller && (
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '12px',
              borderTop: '1px solid #f3f4f6',
              paddingTop: '8px'
            }}>
              <span style={{ color: '#9ca3af' }}>Sold by: </span>
              <span style={{ color: '#2563eb' }}>{seller}</span>
            </div>
          )}

          {/* Action Buttons - Flipkart/Amazon Style */}
          <div style={{ 
            display: 'flex', 
            flexDirection: windowWidth < 480 ? 'column' : 'row',
            gap: '10px', 
            marginTop: 'auto', 
            paddingTop: '12px', 
            borderTop: '1px solid #f3f4f6' 
          }}>
            <button
              onClick={handleAddToCart}
              style={{
                flex: 1,
                background: 'linear-gradient(90deg, #fb641b 0%, #ff8c00 100%)',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(251,100,27,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(251,100,27,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #fb641b 0%, #ff8c00 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(251,100,27,0.3)';
              }}
            >
              Add to Cart
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Add to cart first, then redirect to checkout
                addToCart({
                  id,
                  name,
                  price,
                  originalPrice,
                  image,
                  seller,
                  allowBargaining,
                });
                window.location.href = `/checkout`;
              }}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#1f2937',
                padding: '10px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(251,191,36,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(251,191,36,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(251,191,36,0.3)';
              }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
