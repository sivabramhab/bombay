'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AddProductPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    quantity: '',
    mrp: '',
    discount: '',
    bargainRange: '',
    warrantyDetails: '',
    brand: '',
    allowBargaining: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Check authentication and seller status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isAuthenticated) {
        toast.error('Please login to continue');
        router.push('/login');
        return;
      }
      // Allow access if user is a seller (check isSeller flag, role, or userType)
      if (user?.isSeller || user?.userType === 'seller' || user?.role === 'seller') {
        setIsReady(true);
      } else {
        toast.error('Only sellers can access this page. Please register as a seller first.');
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      // Create previews
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    
    // Revoke object URLs
    URL.revokeObjectURL(previews[index]);
  };

  const calculateSellingPrice = () => {
    const mrp = parseFloat(formData.mrp) || 0;
    const discount = parseFloat(formData.discount) || 0;
    return mrp - (mrp * discount / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.name || !formData.description || !formData.mrp || !formData.quantity) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      if (files.length === 0) {
        toast.error('Please upload at least one image or video');
        setLoading(false);
        return;
      }

      // Create FormData for multipart upload
      const submitData = new FormData();
      
      // Add text fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category || 'general');
      submitData.append('subcategory', formData.subcategory || '');
      submitData.append('basePrice', formData.mrp);
      submitData.append('sellingPrice', calculateSellingPrice().toString());
      submitData.append('stock', formData.quantity);
      submitData.append('priceDiscount', formData.discount || '0');
      submitData.append('allowBargaining', formData.allowBargaining.toString());
      submitData.append('minBargainPrice', formData.bargainRange || '0');
      submitData.append('brand', formData.brand || '');
      submitData.append('warrantyDetails', formData.warrantyDetails || '0');
      
      // Add warranty object
      const warrantyObj = {
        hasWarranty: parseFloat(formData.warrantyDetails) > 0,
        duration: formData.warrantyDetails || '0',
        type: 'seller'
      };
      submitData.append('warranty', JSON.stringify(warrantyObj));

      // Add files
      files.forEach((file) => {
        submitData.append('files', file);
      });

      // Submit to API
      const response = await api.post('/products/create', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Product created successfully!');
      router.push('/seller/dashboard');
    } catch (error: any) {
      console.error('Product creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Fashion & Clothing' },
    { value: 'home', label: 'Home & Living' },
    { value: 'books', label: 'Books' },
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'grocery', label: 'Grocery' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/"
            style={{
              color: '#2874f0',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '16px',
              display: 'inline-block'
            }}
          >
            ← Back to Home
          </Link>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            Add New Product
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>
            Fill in the details below to add your product to the marketplace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Product Title */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Product Title <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Samsung Galaxy S23 Ultra"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2874f0';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Product Description */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Product Description <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product in detail..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2874f0';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Category and Subcategory */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2874f0';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Subcategory
                </label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g., Smartphones"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2874f0';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Price Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  MRP (₹) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2874f0';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2874f0';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {formData.mrp && formData.discount && (
                  <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                    Selling Price: ₹{calculateSellingPrice().toFixed(2)}
                  </p>
                )}
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Bargain Range (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.bargainRange}
                  onChange={(e) => setFormData({ ...formData, bargainRange: e.target.value })}
                  placeholder="Min price"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2874f0';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Quantity and Brand */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Product Quantity <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2874f0';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Samsung"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2874f0';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Warranty Details */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Warranty Details (Months)
              </label>
              <input
                type="number"
                min="0"
                value={formData.warrantyDetails}
                onChange={(e) => setFormData({ ...formData, warrantyDetails: e.target.value })}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2874f0';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Allow Bargaining */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.allowBargaining}
                  onChange={(e) => setFormData({ ...formData, allowBargaining: e.target.checked })}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#2874f0'
                  }}
                />
                <span>Allow Bargaining on this product</span>
              </label>
            </div>

            {/* File Upload */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Images / Videos <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="file"
                required
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px dashed #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2874f0';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,116,240,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                Upload multiple images or videos. Files will be saved with their original names.
              </p>

              {/* File Previews */}
              {previews.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  {previews.map((preview, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid #e5e7eb'
                      }}
                    >
                      {files[index].type.startsWith('image/') ? (
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <video
                          src={preview}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover'
                          }}
                          controls={false}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}
                      >
                        ×
                      </button>
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '4px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {files[index].name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: loading ? '#9ca3af' : '#2874f0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(40,116,240,0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#1e62d9';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(40,116,240,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#2874f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(40,116,240,0.3)';
                  }
                }}
              >
                {loading ? 'Creating Product...' : 'Add Product'}
              </button>
              <Link
                href="/"
                style={{
                  padding: '14px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

