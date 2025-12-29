/**
 * Utility functions for handling product images
 */

const getAPIBaseUrl = (): string => {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', ''); // Remove /api suffix
  }
  
  // Auto-detect based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('ec2-') || hostname.includes('compute-1.amazonaws.com')) {
      return `https://${hostname}`;
    }
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.protocol === 'https:' 
        ? `https://${hostname}`
        : `http://${hostname}:5000`;
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:5000';
};

/**
 * Constructs the full URL for a product image
 * @param imagePath - The image filename or path stored in the database
 * @returns The full URL to access the image
 */
export const getProductImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) {
    return null;
  }
  
  // If it's already a full URL (http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Construct the full URL using the API base URL
  const baseUrl = getAPIBaseUrl();
  return `${baseUrl}/uploads/images/${imagePath}`;
};

