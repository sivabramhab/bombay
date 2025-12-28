'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  finalPrice: number;
}

interface Order {
  _id: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: 'online' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryOption: string;
  deliveryDetails: any;
  status: string;
  createdAt: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${params.id}`);
      // API might return order directly or in data.order
      setOrder(response.data.order || response.data);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast.error(error.response?.data?.message || 'Order not found');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      out_for_delivery: '#ec4899',
      delivered: '#16a34a',
      cancelled: '#dc2626',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '32px 0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px' }}>
        {/* Success Banner */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Order Placed Successfully!
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
            Order ID: <span style={{ fontWeight: '600', color: '#2874f0' }}>{order.orderId}</span>
          </p>
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#ecfdf5',
            borderRadius: '6px',
            border: '1px solid #86efac'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#15803d' }}>
              Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          {/* Order Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Order Items */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Order Items
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                        {item.name}
                      </h3>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                        Quantity: {item.quantity}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                        ₹{(item.finalPrice * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <Link
                      href={`/products/${item.productId}`}
                      style={{
                        color: '#2874f0',
                        fontSize: '14px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        alignSelf: 'flex-start'
                      }}
                    >
                      View Product →
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Delivery Information
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Delivery Option:</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>
                    {order.deliveryOption.replace('_', ' ')}
                  </span>
                </div>
                {order.deliveryDetails?.metroStation && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Metro Station:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {order.deliveryDetails.metroStation}
                    </span>
                  </div>
                )}
                {order.deliveryDetails?.pickupLocation && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Pickup Location:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {order.deliveryDetails.pickupLocation}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#374151' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '600' }}>₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#374151' }}>
                  <span>Delivery Charges</span>
                  <span style={{ fontWeight: '600', color: order.deliveryCharge === 0 ? '#16a34a' : '#374151' }}>
                    {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                  </span>
                </div>
                <div style={{
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                  margin: '8px 0'
                }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  Payment Method
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2874f0', marginBottom: '8px' }}>
                  {order.paymentMethod === 'online' ? '💳 Online Payment' : '💵 Cash on Delivery'}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Status: <span style={{
                    fontWeight: '600',
                    color: order.paymentStatus === 'paid' ? '#16a34a' : '#f59e0b'
                  }}>
                    {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'pending' ? 'Pending' : order.paymentStatus}
                  </span>
                </div>
              </div>

              <Link
                href="/products"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  backgroundColor: '#2874f0',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e62d9';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2874f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

