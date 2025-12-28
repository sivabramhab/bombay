'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  description: string;
  sellingPrice: number;
  basePrice: number;
  images: string[];
  category: string;
  allowBargaining: boolean;
  minBargainPrice?: number;
  stock: number;
  sellerId: {
    businessName: string;
    pickupLocations: any[];
  };
  priceDiscount: number;
  warranty?: {
    hasWarranty: boolean;
    duration: string;
    type: string;
    details: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBargainModal, setShowBargainModal] = useState(false);
  const [bargainOffer, setBargainOffer] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${params.id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleBargain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to bargain');
      router.push('/login');
      return;
    }

    try {
      await api.post('/bargains', {
        productId: product?._id,
        buyerOffer: parseFloat(bargainOffer),
      });
      toast.success('Bargain request sent!');
      setShowBargainModal(false);
      setBargainOffer('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create bargain request');
    }
  };

  const handleAddToCart = () => {
    // This would typically add to cart
    // For now, we'll proceed directly to checkout
    router.push(`/checkout?product=${product?._id}&quantity=${quantity}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div>
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1, 5).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${product.name} ${idx + 2}`}
                      className="aspect-square object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-4xl font-bold text-blue-600">
                    ₹{product.sellingPrice}
                  </span>
                  {product.basePrice > product.sellingPrice && (
                    <>
                      <span className="text-2xl text-gray-400 line-through">
                        ₹{product.basePrice}
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {product.priceDiscount.toFixed(0)}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Guaranteed 10% cheaper than major platforms
                </p>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">{product.description}</p>

                {product.warranty && product.warranty.hasWarranty && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="font-semibold text-blue-900">Warranty Information</p>
                    <p className="text-sm text-blue-700">
                      {product.warranty.duration} - {product.warranty.type} Warranty
                    </p>
                    {product.warranty.details && (
                      <p className="text-sm text-blue-700 mt-1">{product.warranty.details}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Category:</span> {product.category}</p>
                  <p><span className="font-semibold">Seller:</span> {product.sellerId?.businessName}</p>
                  <p>
                    <span className="font-semibold">Stock:</span>{' '}
                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  </p>
                </div>
              </div>

              {product.allowBargaining && (
                <div className="mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="font-semibold text-yellow-900 mb-2">✨ Bargaining Allowed</p>
                    <p className="text-sm text-yellow-800 mb-3">
                      You can negotiate the price for this product!
                    </p>
                    <button
                      onClick={() => setShowBargainModal(true)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 text-sm font-medium"
                    >
                      Make an Offer
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Buy Now
                </button>
              </div>

              {product.sellerId?.pickupLocations && product.sellerId.pickupLocations.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold mb-2">Pickup Locations:</p>
                  {product.sellerId.pickupLocations.map((location: any, idx: number) => (
                    <p key={idx} className="text-sm text-gray-700">
                      {location.name}: {location.address?.street}, {location.address?.city}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bargain Modal */}
      {showBargainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Make an Offer</h2>
            <form onSubmit={handleBargain} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Current Price: <span className="font-semibold">₹{product.sellingPrice}</span>
                </p>
                {product.minBargainPrice && (
                  <p className="text-sm text-gray-600 mb-2">
                    Minimum Price: <span className="font-semibold">₹{product.minBargainPrice}</span>
                  </p>
                )}
                <label className="block text-sm font-medium mb-1">Your Offer (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={product.sellingPrice}
                  min={product.minBargainPrice || 0}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={bargainOffer}
                  onChange={(e) => setBargainOffer(e.target.value)}
                  placeholder={`Max: ₹${product.sellingPrice}`}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Send Offer
                </button>
                <button
                  type="button"
                  onClick={() => setShowBargainModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

