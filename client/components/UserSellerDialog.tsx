'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserSellerDialogProps {
  onSelect: (choice: 'user' | 'seller') => void;
}

export default function UserSellerDialog({ onSelect }: UserSellerDialogProps) {
  const [selected, setSelected] = useState<'user' | 'seller' | null>(null);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'fadeIn 0.3s ease-in'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Choose Your Dashboard
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          You have access to both User and Seller features. Which page would you like to open?
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* User Option */}
          <button
            onClick={() => setSelected('user')}
            style={{
              padding: '24px 16px',
              borderRadius: '12px',
              border: selected === 'user' ? '3px solid #2874f0' : '2px solid #e5e7eb',
              backgroundColor: selected === 'user' ? '#eff6ff' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (selected !== 'user') {
                e.currentTarget.style.borderColor = '#2874f0';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== 'user') {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <div style={{
              fontSize: '48px',
              marginBottom: '8px'
            }}>
              👤
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: selected === 'user' ? '#2874f0' : '#1f2937'
            }}>
              User Page
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.4'
            }}>
              Browse & purchase products
            </div>
          </button>

          {/* Seller Option */}
          <button
            onClick={() => setSelected('seller')}
            style={{
              padding: '24px 16px',
              borderRadius: '12px',
              border: selected === 'seller' ? '3px solid #2874f0' : '2px solid #e5e7eb',
              backgroundColor: selected === 'seller' ? '#eff6ff' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (selected !== 'seller') {
                e.currentTarget.style.borderColor = '#2874f0';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== 'seller') {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <div style={{
              fontSize: '48px',
              marginBottom: '8px'
            }}>
              🏪
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: selected === 'seller' ? '#2874f0' : '#1f2937'
            }}>
              Seller Page
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.4'
            }}>
              Manage products & sales
            </div>
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={() => onSelect(selected || 'user')}
            disabled={!selected}
            style={{
              flex: 1,
              padding: '14px 24px',
              backgroundColor: selected ? '#2874f0' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: selected ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: selected ? '0 4px 12px rgba(40,116,240,0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (selected) {
                e.currentTarget.style.backgroundColor = '#1e62d9';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(40,116,240,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (selected) {
                e.currentTarget.style.backgroundColor = '#2874f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(40,116,240,0.3)';
              }
            }}
          >
            Continue
          </button>
        </div>

        <p style={{
          fontSize: '11px',
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: '16px',
          marginBottom: 0
        }}>
          You can switch between pages anytime from the navigation menu
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

