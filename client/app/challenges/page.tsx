'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Challenge {
  _id: string;
  productName: string;
  productUrl: string;
  platform: string;
  currentPrice: number;
  challengePrice: number;
  deliveryTime: string;
  status: string;
  userId: {
    name: string;
  };
  responses: any[];
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    productUrl: '',
    platform: 'flipkart',
    currentPrice: '',
    challengePrice: '',
    deliveryTime: '',
    description: '',
  });
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await api.get('/challenges?status=active');
      setChallenges(response.data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to create a challenge');
      router.push('/login');
      return;
    }

    try {
      await api.post('/challenges', {
        ...formData,
        currentPrice: parseFloat(formData.currentPrice),
        challengePrice: parseFloat(formData.challengePrice),
      });
      toast.success('Challenge created successfully!');
      setShowCreateModal(false);
      setFormData({
        productName: '',
        productUrl: '',
        platform: 'flipkart',
        currentPrice: '',
        challengePrice: '',
        deliveryTime: '',
        description: '',
      });
      fetchChallenges();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create challenge');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Competitive Challenges</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Challenge
          </button>
        </div>

        <p className="text-gray-600 mb-8">
          Found a better deal? Challenge our sellers to match or beat it!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <div key={challenge._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-lg">{challenge.productName}</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {challenge.platform}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">Current Price:</span>
                  <span className="line-through text-gray-400">₹{challenge.currentPrice}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">Challenge Price:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{challenge.challengePrice}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Delivery in: {challenge.deliveryTime}
                </div>
              </div>

              {challenge.responses && challenge.responses.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {challenge.responses.length} seller(s) responded
                  </p>
                </div>
              )}

              <Link
                href={`/challenges/${challenge._id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>

        {challenges.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No active challenges yet</p>
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Challenge</h2>
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product URL</label>
                <input
                  type="url"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.productUrl}
                  onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Platform</label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                >
                  <option value="flipkart">Flipkart</option>
                  <option value="amazon">Amazon</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Price (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Challenge Price (₹) - Must be 10% less
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.challengePrice}
                    onChange={(e) => setFormData({ ...formData, challengePrice: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expected Delivery Time</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2-3 days, Same day"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Challenge
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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

