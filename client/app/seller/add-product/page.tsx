'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  basePrice: number;
  sellingPrice: number;
  stock: number;
  priceDiscount: number;
  allowBargaining: boolean;
  minBargainPrice?: number;
  brand?: string;
  warranty?: {
    hasWarranty: boolean;
    duration: string;
    type: string;
  };
  images?: string[];
  gstNumber?: string;
  gstDocument?: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [originalProductData, setOriginalProductData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAddNewDialog, setShowAddNewDialog] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

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
    gstNumber: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [gstDocument, setGstDocument] = useState<File | null>(null);
  const [gstDocumentPreview, setGstDocumentPreview] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Check authentication and seller status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isAuthenticated) {
        toast.error('Please login to continue');
        router.push('/login');
        return;
      }
      if (user?.isSeller || user?.userType === 'seller' || user?.role === 'seller') {
        setIsReady(true);
      } else {
        toast.error('Only sellers can access this page. Please register as a seller first.');
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search products when query changes (3+ characters) - in edit mode only when no product selected
  useEffect(() => {
    if (searchQuery.trim().length >= 3 && isEditMode && !editingProductId) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await api.get(`/products/seller/my-products?search=${encodeURIComponent(searchQuery.trim())}`);
          const products = response.data.products || [];
          setSearchResults(products);
          setShowSearchResults(products.length > 0);
        } catch (error: any) {
          console.error('Search error:', error);
          setSearchResults([]);
          setShowSearchResults(false);
        }
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isEditMode, editingProductId]);

  // Detect changes in form data
  useEffect(() => {
    if (originalProductData && editingProductId) {
      const currentData = {
        name: formData.name,
        description: formData.description,
        category: formData.category || '',
        subcategory: formData.subcategory || '',
        quantity: formData.quantity,
        mrp: formData.mrp,
        discount: formData.discount || '0',
        bargainRange: formData.bargainRange || '',
        warrantyDetails: formData.warrantyDetails || '0',
        brand: formData.brand || '',
        allowBargaining: formData.allowBargaining,
        gstNumber: formData.gstNumber || '',
      };

      const changed = JSON.stringify(currentData) !== JSON.stringify(originalProductData);
      setHasChanges(changed);
    } else {
      setHasChanges(false);
    }
  }, [formData, originalProductData, editingProductId]);

  const resetForm = () => {
    setFormData({
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
      gstNumber: '',
    });
    setFiles([]);
    setPreviews([]);
    setEditingProductId(null);
    setIsEditMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleEditMode = () => {
    setIsEditMode(true);
    // Clear form but keep edit mode
    setFormData({
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
      gstNumber: '',
    });
    setFiles([]);
    setPreviews([]);
    setEditingProductId(null);
    setSelectedProduct(null);
    setOriginalProductData(null);
    setHasChanges(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    resetForm();
  };

  const handleProductSelect = async (product: Product) => {
    setLoadingProduct(true);
    try {
      // Fetch full product details
      const response = await api.get(`/products/${product._id}`);
      const fullProduct = response.data;
      
      setSelectedProduct(fullProduct);
      setEditingProductId(product._id);
      
      // Store original data for comparison - ensure GST fields are included
      const originalData = {
        name: fullProduct.name || '',
        description: fullProduct.description || '',
        category: fullProduct.category || '',
        subcategory: fullProduct.subcategory || '',
        quantity: (fullProduct.stock || 0).toString(),
        mrp: (fullProduct.basePrice || 0).toString(),
        discount: (fullProduct.priceDiscount || 0).toString(),
        bargainRange: fullProduct.minBargainPrice ? fullProduct.minBargainPrice.toString() : '',
        warrantyDetails: fullProduct.warranty?.duration || '0',
        brand: fullProduct.brand || '',
        allowBargaining: fullProduct.allowBargaining || false,
        gstNumber: (fullProduct.gstNumber && fullProduct.gstNumber.trim()) || '',
      };
      
      // Debug: Verify GST data is present
      if (fullProduct.gstNumber || fullProduct.gstDocument) {
        console.log('GST Data found:', {
          gstNumber: fullProduct.gstNumber,
          gstDocument: fullProduct.gstDocument
        });
      }
      
      setOriginalProductData(originalData);
      
      // Populate form with product data
      setFormData(originalData);
      
      // Set GST document preview if exists
      if (fullProduct.gstDocument) {
        // Store the GST document filename for display
        const gstDocFileName = fullProduct.gstDocument;
        // Check if it's a PDF or image based on extension
        if (gstDocFileName.toLowerCase().endsWith('.pdf')) {
          setGstDocumentPreview('pdf');
        } else {
          // For images, try to construct the URL
          const imageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/uploads/images/${gstDocFileName}`;
          setGstDocumentPreview(imageUrl);
        }
      } else {
        setGstDocumentPreview(null);
        setGstDocument(null);
      }
      
      setSearchQuery(product.name);
      setSearchResults([]);
      setShowSearchResults(false);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoadingProduct(false);
    }
  };

  // Removed handleSearchChange - now handled directly in Product Title onChange

  const handleAddNewProduct = () => {
    setShowAddNewDialog(false);
    setIsEditMode(false);
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const handleGstDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGstDocument(file);
      
      // Create preview for PDF/image
      if (file.type === 'application/pdf') {
        setGstDocumentPreview('pdf');
      } else {
        setGstDocumentPreview(URL.createObjectURL(file));
      }
    }
  };

  const removeGstDocument = () => {
    if (gstDocumentPreview && gstDocumentPreview !== 'pdf') {
      URL.revokeObjectURL(gstDocumentPreview);
    }
    setGstDocument(null);
    setGstDocumentPreview(null);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    
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

      // For new products, require files; for edit, files are optional
      if (!isEditMode && files.length === 0) {
        toast.error('Please upload at least one image or video');
        setLoading(false);
        return;
      }

      // If editing, update product
      if (isEditMode && editingProductId) {
        // Create FormData for update (to handle GST document if uploaded)
        const updateDataForm = new FormData();
        updateDataForm.append('name', formData.name);
        updateDataForm.append('description', formData.description);
        updateDataForm.append('category', formData.category || 'general');
        updateDataForm.append('subcategory', formData.subcategory || '');
        updateDataForm.append('basePrice', formData.mrp);
        updateDataForm.append('sellingPrice', calculateSellingPrice().toString());
        updateDataForm.append('stock', formData.quantity);
        updateDataForm.append('priceDiscount', formData.discount || '0');
        updateDataForm.append('allowBargaining', formData.allowBargaining.toString());
        updateDataForm.append('minBargainPrice', formData.bargainRange || '0');
        updateDataForm.append('brand', formData.brand || '');
        updateDataForm.append('gstNumber', formData.gstNumber || '');
        
        const warrantyObj = {
          hasWarranty: parseFloat(formData.warrantyDetails) > 0,
          duration: formData.warrantyDetails || '0',
          type: 'seller'
        };
        updateDataForm.append('warranty', JSON.stringify(warrantyObj));

        // Add GST document if uploaded
        if (gstDocument) {
          updateDataForm.append('gstDocument', gstDocument);
        }

        const response = await api.put(`/products/${editingProductId}`, updateDataForm, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Product updated successfully!');
        resetForm();
        setIsEditMode(false);
      } else {
        // Create new product
        const submitData = new FormData();
        
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
        submitData.append('gstNumber', formData.gstNumber || '');
        
        const warrantyObj = {
          hasWarranty: parseFloat(formData.warrantyDetails) > 0,
          duration: formData.warrantyDetails || '0',
          type: 'seller'
        };
        submitData.append('warranty', JSON.stringify(warrantyObj));

        files.forEach((file) => {
          submitData.append('files', file);
        });

        // Add GST document if uploaded
        if (gstDocument) {
          submitData.append('gstDocument', gstDocument);
        }

        const response = await api.post('/products/create', submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        toast.success('Product created successfully!');
        resetForm(); // Reset form instead of redirecting
      }
    } catch (error: any) {
      console.error('Product operation error:', error);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'fashion', label: 'Fashion & Clothing' },
    { value: 'home-living', label: 'Home & Living' },
    { value: 'books', label: 'Books' },
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'grocery', label: 'Grocery' },
  ];

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
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            {!isEditMode ? (
              <button
                onClick={handleEditMode}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                Edit Product
              </button>
            ) : (
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>
            {isEditMode 
              ? 'Search for a product to edit by entering at least 3 characters'
              : 'Fill in the details below to add your product to the marketplace'
            }
          </p>
        </div>

        {/* Add New Product Dialog */}
        {showAddNewDialog && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '16px'
              }}>
                Add New Product
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px'
              }}>
                Product not found. Would you like to add a new product?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddNewDialog(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewProduct}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2874f0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Add New Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Display - When product is selected */}
        {selectedProduct && editingProductId && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: hasChanges ? '2px solid #2874f0' : '1px solid #e5e7eb'
          }}>
            {loadingProduct ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p style={{ color: '#6b7280' }}>Loading product details...</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    Product Details
                  </h2>
                  {hasChanges && (
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Changes Detected
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  {/* Product Images */}
                  {selectedProduct.images && selectedProduct.images.length > 0 && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                        Images
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {selectedProduct.images.slice(0, 3).map((img, idx) => {
                          // Construct image URL - handle both local paths and URLs
                          const imageUrl = img.startsWith('http') 
                            ? img 
                            : `${typeof window !== 'undefined' ? window.location.origin : ''}/uploads/images/${img}`;
                          return (
                          <img
                            key={idx}
                            src={imageUrl}
                            alt={`Product ${idx + 1}`}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          );
                        })}
                        {selectedProduct.images.length > 3 && (
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f3f4f6',
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            +{selectedProduct.images.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Current Details */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Current Name
                    </label>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: 0, fontWeight: '500' }}>
                      {selectedProduct.name}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Current Category
                    </label>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>
                      {selectedProduct.category || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Current Price
                    </label>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: 0, fontWeight: '600' }}>
                      ₹{selectedProduct.sellingPrice?.toLocaleString() || '0'}
                      {selectedProduct.basePrice && selectedProduct.basePrice > selectedProduct.sellingPrice && (
                        <span style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'line-through', marginLeft: '8px' }}>
                          ₹{selectedProduct.basePrice.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Current Stock
                    </label>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>
                      {selectedProduct.stock || 0} units
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Bargaining
                    </label>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>
                      {selectedProduct.allowBargaining ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Warranty
                    </label>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>
                      {selectedProduct.warranty?.hasWarranty ? `${selectedProduct.warranty.duration} months` : 'No warranty'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Form - Always visible */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gap: '24px' }}>
              {/* Product Title with Search in Edit Mode */}
              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Product Title <span style={{ color: '#dc2626' }}>*</span>
                  {isEditMode && !editingProductId && (
                    <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
                      (Type 3+ characters to search your products)
                    </span>
                  )}
                </label>
                <input
                  ref={isEditMode ? searchInputRef : undefined}
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, name: value });
                    // In edit mode, also update search query for autocomplete
                    if (isEditMode && !editingProductId) {
                      setSearchQuery(value);
                    }
                  }}
                  placeholder={isEditMode && !editingProductId 
                    ? "Type at least 3 characters to search your products..." 
                    : "e.g., Samsung Galaxy S23 Ultra"
                  }
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
                
                {/* Search Results Dropdown - Show when in edit mode and typing */}
                {isEditMode && !editingProductId && showSearchResults && searchResults.length > 0 && (
                  <div
                    ref={searchResultsRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '8px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 1000
                    }}
                  >
                    {searchResults.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductSelect(product)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {product.brand && `${product.brand} • `}₹{product.sellingPrice}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No Results Message */}
                {isEditMode && !editingProductId && formData.name.trim().length >= 3 && searchResults.length === 0 && !showSearchResults && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '8px',
                    padding: '16px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000
                  }}>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
                      No products found. Continue typing to create a new product.
                    </p>
                  </div>
                )}
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
                    placeholder="e.g., Smartphones (Optional)"
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

              {/* GST Information */}
              <div style={{ display: 'grid', gap: '16px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  GST Information
                </h3>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g., 27AAAAA0000A1Z5"
                    maxLength={15}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase'
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
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Format: 15 characters (e.g., 27AAAAA0000A1Z5)
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    GST Document (PDF/Image)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleGstDocumentChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px dashed #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      backgroundColor: 'white',
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
                  {(gstDocumentPreview || (selectedProduct && selectedProduct.gstDocument)) && (
                    <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                      {(gstDocumentPreview === 'pdf' || (selectedProduct?.gstDocument && selectedProduct.gstDocument.toLowerCase().endsWith('.pdf'))) ? (
                        <div style={{
                          padding: '12px',
                          backgroundColor: gstDocument ? '#dc2626' : '#10b981',
                          color: 'white',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px'
                        }}>
                          <span>📄</span>
                          <span>{gstDocument?.name || selectedProduct?.gstDocument || 'GST Document.pdf'}</span>
                          {(gstDocument || (selectedProduct && selectedProduct.gstDocument)) && (
                            <button
                              type="button"
                              onClick={removeGstDocument}
                              style={{
                                marginLeft: '8px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : gstDocumentPreview ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={gstDocumentPreview}
                            alt="GST Document Preview"
                            style={{
                              maxWidth: '200px',
                              maxHeight: '200px',
                              borderRadius: '8px',
                              border: '2px solid #e5e7eb'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <button
                            type="button"
                            onClick={removeGstDocument}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Upload GST certificate (PDF, JPG, PNG) - Max 10MB
                  </p>
                </div>
              </div>

              {/* File Upload - Only required for new products */}
              {!isEditMode && (
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
                    required={!isEditMode}
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
              )}

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={loading || (isEditMode && editingProductId && !hasChanges)}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    backgroundColor: (loading || (isEditMode && editingProductId && !hasChanges)) ? '#9ca3af' : '#2874f0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: (loading || (isEditMode && editingProductId && !hasChanges)) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: (loading || (isEditMode && editingProductId && !hasChanges)) ? 'none' : '0 4px 12px rgba(40,116,240,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && !(isEditMode && editingProductId && !hasChanges)) {
                      e.currentTarget.style.backgroundColor = '#1e62d9';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(40,116,240,0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && !(isEditMode && editingProductId && !hasChanges)) {
                      e.currentTarget.style.backgroundColor = '#2874f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(40,116,240,0.3)';
                    }
                  }}
                  title={isEditMode && editingProductId && !hasChanges ? 'Make changes to enable update' : ''}
                >
                  {loading 
                    ? (isEditMode ? 'Updating Product...' : 'Creating Product...')
                    : (isEditMode && editingProductId && !hasChanges)
                      ? 'Update Product (No Changes)'
                      : (isEditMode ? 'Update Product' : 'Add Product')
                  }
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
