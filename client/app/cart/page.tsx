'use client';

import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CartPage() {
  const { items, totalItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Fetch product images for items that don't have images or have failed images
  useEffect(() => {
    const fetchMissingImages = async () => {
      const itemsToFetch = items.filter(
        item => (!item.image || imageErrors[item.id]) && !productImages[item.id]
      );

      for (const item of itemsToFetch) {
        try {
          const response = await api.get(`/products/${item.id}`);
          const product = response.data;
          if (product.images && product.images.length > 0) {
            setProductImages(prev => ({ ...prev, [item.id]: product.images[0] }));
            // Clear error state when we get a new image
            if (imageErrors[item.id]) {
              setImageErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[item.id];
                return newErrors;
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch image for product ${item.id}:`, error);
          // Mark as error so we don't keep trying
          setImageErrors(prev => ({ ...prev, [item.id]: true }));
        }
      }
    };

    if (items.length > 0) {
      fetchMissingImages();
    }
  }, [items, imageErrors, productImages]);

  const getProductImage = (item: { id: string; image?: string }) => {
    // Try stored image first
    if (item.image && !imageErrors[item.id]) {
      return item.image;
    }
    // Try fetched product image
    if (productImages[item.id]) {
      return productImages[item.id];
    }
    // Return null to show placeholder
    return null;
  };

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to proceed to checkout');
      router.push('/login');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    router.push('/checkout');
  };

  const subtotal = getTotalPrice();
  const deliveryCharge = subtotal >= 500 ? 0 : 50;
  const total = subtotal + deliveryCharge;

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', backgroundColor: '#f5f5f5' }}>
        <div style={{ fontSize: '120px', marginBottom: '24px', opacity: 0.3 }}>🛒</div>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>
          Your cart is empty
        </h2>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', textAlign: 'center' }}>
          Looks like you haven't added any items to your cart yet
        </p>
        <Link
          href="/products"
          style={{
            backgroundColor: '#2874f0',
            color: 'white',
            padding: '14px 32px',
            borderRadius: '8px',
            fontWeight: '600',
            textDecoration: 'none',
            fontSize: '16px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(40,116,240,0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(40,116,240,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(40,116,240,0.3)';
          }}
        >
          Continue Shopping →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '32px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Shopping Cart
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 400px', 
          gap: '24px' 
        }}
        className="cart-layout"
        >
          {/* Cart Items */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Cart Items</h2>
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  style={{
                    color: '#dc2626',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Clear Cart
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr auto',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    transition: 'box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Product Image */}
                  <Link href={`/products/${item.id}`}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      {getProductImage(item) && !imageErrors[item.id] ? (
                        <img
                          src={getProductImage(item)!}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={() => handleImageError(item.id)}
                          onLoad={() => {
                            // Clear error state if image loads successfully
                            setImageErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[item.id];
                              return newErrors;
                            });
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '8px'
                        }}>
                          <span style={{ fontSize: '48px', opacity: 0.4 }}>📦</span>
                          <span style={{
                            fontSize: '10px',
                            color: '#9ca3af',
                            textAlign: 'center',
                            lineHeight: '1.2',
                            wordBreak: 'break-word'
                          }}>
                            {item.name.substring(0, 20)}
                            {item.name.length > 20 ? '...' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link href={`/products/${item.id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#2874f0'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                      >
                        {item.name}
                      </h3>
                    </Link>
                    {item.seller && (
                      <p style={{ fontSize: '14px', color: '#6b7280' }}>
                        Seller: <span style={{ color: '#2874f0', fontWeight: '500' }}>{item.seller}</span>
                      </p>
                    )}
                    {item.allowBargaining && (
                      <span style={{
                        fontSize: '12px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        width: 'fit-content',
                        fontWeight: '600'
                      }}>
                        💬 Bargaining Available
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <>
                          <span style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'line-through' }}>
                            ₹{item.originalPrice.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                            Save ₹{((item.originalPrice - item.price) * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Remove */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px' }}>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: 'none',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      >
                        −
                      </button>
                      <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: '600', fontSize: '16px' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: 'none',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      >
                        +
                      </button>
                    </div>

                    {/* Item Total */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                      {item.quantity > 1 && (
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                          ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                        </p>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        color: '#dc2626',
                        fontSize: '14px',
                        fontWeight: '600',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#374151' }}>
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span style={{ fontWeight: '600' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#374151' }}>
                  <span>Delivery Charges</span>
                  <span style={{ fontWeight: '600', color: deliveryCharge === 0 ? '#16a34a' : '#374151' }}>
                    {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                  </span>
                </div>
                {subtotal < 500 && (
                  <div style={{
                    fontSize: '12px',
                    color: '#dc2626',
                    padding: '8px 12px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '6px',
                    border: '1px solid #fecaca'
                  }}>
                    Add ₹{(500 - subtotal).toLocaleString('en-IN')} more for FREE delivery
                  </div>
                )}
                <div style={{
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                  margin: '8px 0'
                }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                style={{
                  width: '100%',
                  backgroundColor: '#fb641b',
                  color: 'white',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(251,100,27,0.3)',
                  marginBottom: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ea580c';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(251,100,27,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fb641b';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(251,100,27,0.3)';
                }}
              >
                Proceed to Checkout
              </button>

              <Link
                href="/products"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  color: '#2874f0',
                  fontSize: '14px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Continue Shopping
              </Link>

              {/* Guarantee Badge */}
              <div style={{
                marginTop: '20px',
                padding: '12px',
                backgroundColor: '#ecfdf5',
                borderRadius: '8px',
                border: '1px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>✓</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', marginBottom: '2px' }}>
                    10% Cheaper Guarantee
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    vs Amazon & Flipkart
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

