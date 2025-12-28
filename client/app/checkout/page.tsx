'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Address {
  _id?: string;
  type?: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [deliveryOption, setDeliveryOption] = useState<'dabbawala' | 'metro' | 'seller_pickup' | 'rapido' | 'uber'>('seller_pickup');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Address>({
    type: 'home',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false,
  });
  const [metroStation, setMetroStation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      router.push('/login');
      return;
    }

    // Check if it's a Buy Now (single product) or cart checkout
    const productId = searchParams.get('product');
    const quantity = searchParams.get('quantity');

    if (productId && quantity) {
      // Single product checkout - fetch product details
      // This will be handled in the component
    }

    if (items.length === 0 && !productId) {
      toast.error('Your cart is empty');
      router.push('/cart');
      return;
    }

    loadAddresses();
  }, [isAuthenticated, router, items.length]);

  const loadAddresses = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.data?.addresses && response.data.data.addresses.length > 0) {
        setAddresses(response.data.data.addresses);
        const defaultAddress = response.data.data.addresses.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else {
          setSelectedAddress(response.data.data.addresses[0]);
        }
      } else {
        setShowAddressForm(true);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      // If no addresses, show form
      setShowAddressForm(true);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/users/addresses', newAddress);
      // The response contains the updated addresses array
      if (response.data.addresses) {
        setAddresses(response.data.addresses);
        const addedAddress = response.data.addresses[response.data.addresses.length - 1];
        setSelectedAddress(addedAddress);
      }
      setShowAddressForm(false);
      setNewAddress({
        type: 'home',
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: false,
      });
      toast.success('Address added successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    }
  };

  const calculateDeliveryCharge = () => {
    if (deliveryOption === 'seller_pickup') return 0;
    if (deliveryOption === 'metro') return 50;
    if (deliveryOption === 'dabbawala') return 30;
    return 100; // Rapido/Uber
  };

  const subtotal = getTotalPrice();
  const deliveryCharge = subtotal >= 500 && deliveryOption === 'seller_pickup' ? 0 : calculateDeliveryCharge();
  const total = subtotal + deliveryCharge;

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      router.push('/cart');
      return;
    }

    // Validate delivery requirements
    if (deliveryOption !== 'seller_pickup' && deliveryOption !== 'metro') {
      if (!selectedAddress) {
        toast.error('Please select or add a delivery address');
        return;
      }
    }

    if (deliveryOption === 'metro' && !metroStation.trim()) {
      toast.error('Please enter metro station name');
      return;
    }

    if (deliveryOption === 'seller_pickup' && !pickupLocation.trim()) {
      toast.error('Please enter pickup location');
      return;
    }

    setLoading(true);

    try {
      // Prepare order items
      const orderItems = items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        finalPrice: item.price,
      }));

      // Prepare delivery details
      const deliveryDetails: any = {};
      if (deliveryOption === 'metro') {
        deliveryDetails.metroStation = metroStation;
      }
      if (deliveryOption === 'seller_pickup') {
        deliveryDetails.pickupLocation = pickupLocation;
      }
      
      // Note: addressId will be set on backend if selectedAddress._id exists
      // For now, we send address details separately
      const addressId = selectedAddress?._id || null;

      // Create order
      const orderResponse = await api.post('/orders', {
        items: orderItems,
        paymentMethod,
        deliveryOption,
        deliveryDetails,
        addressId: selectedAddress?._id,
      });

      const order = orderResponse.data.order || orderResponse.data;

      if (paymentMethod === 'cod') {
        // Cash on Delivery - order created, redirect to success
        clearCart();
        toast.success('Order placed successfully!');
        router.push(`/orders/${order._id}`);
      } else {
        // Online payment - create Razorpay order
        await handleRazorpayPayment(order);
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async (order: any) => {
    try {
      // Create Razorpay order
      const paymentResponse = await api.post('/payments/create-order', {
        amount: order.total,
        orderId: order._id,
      });

      const { orderId: razorpayOrderId, key } = paymentResponse.data;

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          openRazorpayCheckout(razorpayOrderId, key, order);
        };
        document.body.appendChild(script);
      } else {
        openRazorpayCheckout(razorpayOrderId, key, order);
      }
    } catch (error: any) {
      console.error('Payment order creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    }
  };

  const openRazorpayCheckout = (razorpayOrderId: string, key: string, order: any) => {
    const options = {
      key,
      amount: order.total * 100, // Amount in paise
      currency: 'INR',
      name: 'MarketPlace',
      description: `Order #${order.orderId}`,
      order_id: razorpayOrderId,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.mobile || '',
      },
      theme: {
        color: '#2874f0',
      },
      handler: async (response: any) => {
        try {
          // Verify payment
          await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: order._id,
          });

          clearCart();
          toast.success('Payment successful! Order confirmed.');
          router.push(`/orders/${order._id}`);
        } catch (error: any) {
          console.error('Payment verification error:', error);
          toast.error(error.response?.data?.message || 'Payment verification failed');
        }
      },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled');
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

    // Show loading or redirect if no items
    if (items.length === 0 && !searchParams.get('product')) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>No items to checkout</p>
            <Link href="/products" style={{ color: '#2874f0', fontWeight: '600', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>
              Continue Shopping →
            </Link>
          </div>
        </div>
      );
    }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '32px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '32px' }}>
          Checkout
        </h1>

        <div 
          className="checkout-layout"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 400px', 
            gap: '24px' 
          }}
        >
          {/* Left Column - Delivery & Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Delivery Address */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Delivery Address
              </h2>

              {!showAddressForm && addresses.length > 0 ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {addresses.map((address) => (
                      <label
                        key={address._id || `${address.street}-${address.city}`}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '16px',
                          border: selectedAddress?._id === address._id ? '2px solid #2874f0' : '2px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: selectedAddress?._id === address._id ? '#eff6ff' : 'white',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedAddress?._id !== address._id) {
                            e.currentTarget.style.borderColor = '#93c5fd';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedAddress?._id !== address._id) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddress?._id === address._id}
                          onChange={() => setSelectedAddress(address)}
                          style={{ marginTop: '4px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px', textTransform: 'capitalize' }}>
                            {address.type || 'Home'} Address {address.isDefault && '(Default)'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                            {address.street}{address.landmark && `, ${address.landmark}`}
                            <br />
                            {address.city}, {address.state} - {address.pincode}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    style={{
                      color: '#2874f0',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 0',
                    }}
                  >
                    + Add New Address
                  </button>
                </>
              ) : (
                <form onSubmit={handleAddAddress}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                        Address Type *
                      </label>
                      <select
                        required
                        value={newAddress.type}
                        onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value as 'home' | 'work' | 'other' })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                        Street Address *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        placeholder="House/Flat No., Building Name, Street"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={newAddress.landmark}
                          onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                          placeholder="Nearby landmark"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                        />
                        <span style={{ fontSize: '14px', color: '#374151' }}>Set as default address</span>
                      </label>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={newAddress.landmark}
                        onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          backgroundColor: '#2874f0',
                          color: 'white',
                          padding: '12px 24px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Save Address
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          style={{
                            flex: 1,
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '14px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Delivery Options */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Delivery Options
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { value: 'seller_pickup', label: 'Pickup from Seller Location', icon: '🚚', desc: 'Free - Collect from seller', charge: 0 },
                  { value: 'metro', label: 'Metro Station Pickup', icon: '🚇', desc: 'Pickup from nearest metro', charge: 50 },
                  { value: 'dabbawala', label: 'Mumbai Dabbawala Network', icon: '📦', desc: 'Fast & reliable delivery', charge: 30 },
                  { value: 'rapido', label: 'Rapido Delivery', icon: '🏍️', desc: 'Quick delivery service', charge: 100 },
                  { value: 'uber', label: 'Uber Delivery', icon: '🚗', desc: 'Premium delivery service', charge: 100 },
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      border: deliveryOption === option.value ? '2px solid #2874f0' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: deliveryOption === option.value ? '#eff6ff' : 'white',
                    }}
                    onMouseEnter={(e) => {
                      if (deliveryOption !== option.value) {
                        e.currentTarget.style.borderColor = '#93c5fd';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (deliveryOption !== option.value) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={option.value}
                      checked={deliveryOption === option.value}
                      onChange={(e) => setDeliveryOption(e.target.value as any)}
                      style={{ marginTop: '2px' }}
                    />
                    <span style={{ fontSize: '24px' }}>{option.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                        {option.label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {option.desc} {option.charge > 0 && `- ₹${option.charge}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Additional fields based on delivery option */}
              {deliveryOption === 'metro' && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Metro Station Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={metroStation}
                    onChange={(e) => setMetroStation(e.target.value)}
                    placeholder="Enter metro station name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              )}

              {deliveryOption === 'seller_pickup' && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Pickup Location Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Enter seller pickup location"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Payment Method
              </h2>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: paymentMethod === 'online' ? '2px solid #2874f0' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: paymentMethod === 'online' ? '#eff6ff' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cod')}
                  />
                  <span style={{ fontSize: '24px' }}>💳</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>Online Payment</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Credit/Debit Card, UPI, Wallet</div>
                  </div>
                </label>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: paymentMethod === 'cod' ? '2px solid #2874f0' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: paymentMethod === 'cod' ? '#eff6ff' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cod')}
                  />
                  <span style={{ fontSize: '24px' }}>💵</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>Cash on Delivery</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Pay when you receive</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Order Summary
              </h2>

              {/* Cart Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
                    {item.image && (
                      <div style={{ width: '60px', height: '60px', backgroundColor: '#f3f4f6', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginTop: '4px' }}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', paddingTop: '20px', borderTop: '2px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#374151' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '600' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#374151' }}>
                  <span>Delivery Charges</span>
                  <span style={{ fontWeight: '600', color: deliveryCharge === 0 ? '#16a34a' : '#374151' }}>
                    {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                  </span>
                </div>
                {subtotal < 500 && deliveryOption === 'seller_pickup' && (
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

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#9ca3af' : '#fb641b',
                  color: 'white',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(251,100,27,0.3)',
                  marginBottom: '12px'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#ea580c';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(251,100,27,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#fb641b';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(251,100,27,0.4)';
                  }
                }}
              >
                {loading ? 'Processing...' : paymentMethod === 'online' ? 'Pay & Place Order' : 'Place Order'}
              </button>

              <Link
                href="/cart"
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
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

