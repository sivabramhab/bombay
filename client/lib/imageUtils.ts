/**
 * Utility functions for handling product images
 */

const getAPIBaseUrl = (): string => {
  // Auto-detect based on current window location (client-side)
  if (typeof window !== 'undefined') {
    const { hostname, protocol, port } = window.location;
    
    // If we're on EC2 server domain, use HTTPS
    if (hostname.includes('ec2-') || hostname.includes('compute-1.amazonaws.com')) {
      return `${protocol}//${hostname}${port && port !== '80' && port !== '443' ? `:${port}` : ''}`;
    }
    
    // If on localhost, use localhost:5000 for API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // For other domains, use the same protocol and hostname, but API on port 5000
    // If using HTTPS, assume Nginx is proxying, so use same hostname without port
    if (protocol === 'https:') {
      return `${protocol}//${hostname}`;
    }
    
    // For HTTP, use port 5000
    return `${protocol}//${hostname}:5000`;
  }
  
  // Server-side fallback - use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
  }
  
  // Default to localhost for development
  return 'http://localhost:5000';
};

/**
 * Constructs the full URL for a product image
 * @param imagePath - The image filename, path, or URL stored in the database
 * @returns The full URL to access the image, or null if imagePath is invalid
 */
export const getProductImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) {
    return null;
  }
  
  // Trim whitespace
  const trimmedPath = imagePath.trim();
  
  if (!trimmedPath) {
    return null;
  }
  
  // If it's already a full URL (http:// or https://), return as is
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }
  
  // If it's a full local file path (starts with / or C:\ or contains path separators), extract filename
  let filename = trimmedPath;
  if (trimmedPath.includes('/')) {
    // Extract filename from path (Unix-style)
    filename = trimmedPath.split('/').pop() || trimmedPath;
  } else if (trimmedPath.includes('\\')) {
    // Extract filename from path (Windows-style)
    filename = trimmedPath.split('\\').pop() || trimmedPath;
  }
  
  // Construct the full URL using the API base URL
  const baseUrl = getAPIBaseUrl();
  return `${baseUrl}/uploads/images/${filename}`;
};

