/**
 * Cloudinary Image Utilities for Frontend
 * 
 * Helper functions for optimizing and transforming Cloudinary images
 * in the frontend application.
 */

/**
 * Extracts the public ID from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if invalid
 */
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;

  const urlParts = url.split('/');
  const uploadIndex = urlParts.indexOf('upload');

  if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
    const publicIdWithFormat = urlParts.slice(uploadIndex + 2).join('/');
    return publicIdWithFormat.substring(0, publicIdWithFormat.lastIndexOf('.'));
  }

  return null;
};

/**
 * Generates an optimized Cloudinary URL with transformations
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string} - Transformed URL
 */
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl; // Return original if not a Cloudinary URL
  }

  const {
    width = 300,
    height = 300,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'face', // Focus on faces when cropping
  } = options;

  // Build transformation string
  const transformations = [
    `w_${width}`,
    `h_${height}`,
    `c_${crop}`,
    `q_${quality}`,
    `f_${format}`,
    crop === 'fill' ? `g_${gravity}` : null
  ].filter(Boolean).join(',');

  // Insert transformations into URL
  return imageUrl.replace('/upload/', `/upload/${transformations}/`);
};

/**
 * Generates multiple sizes for responsive images
 * @param {string} imageUrl - Original Cloudinary URL
 * @returns {Object} - Object with URLs for different sizes
 */
export const getResponsiveImageUrls = (imageUrl) => {
  if (!imageUrl) return null;

  return {
    thumbnail: getOptimizedImageUrl(imageUrl, { width: 150, height: 150, crop: 'fill' }),
    small: getOptimizedImageUrl(imageUrl, { width: 300, height: 300, crop: 'limit' }),
    medium: getOptimizedImageUrl(imageUrl, { width: 600, height: 600, crop: 'limit' }),
    large: getOptimizedImageUrl(imageUrl, { width: 1000, height: 1000, crop: 'limit' }),
    original: imageUrl
  };
};

/**
 * Creates srcSet string for responsive images
 * @param {string} imageUrl - Original Cloudinary URL
 * @returns {string} - srcSet attribute value
 */
export const generateSrcSet = (imageUrl) => {
  if (!imageUrl) return '';

  const sizes = [300, 600, 900, 1200];
  return sizes
    .map(size => {
      const url = getOptimizedImageUrl(imageUrl, { width: size, crop: 'limit' });
      return `${url} ${size}w`;
    })
    .join(', ');
};

/**
 * Check if an image URL is from Cloudinary
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export const isCloudinaryUrl = (url) => {
  return url && typeof url === 'string' && url.includes('cloudinary.com');
};

/**
 * Check if an image is base64
 * @param {string} data - Image data
 * @returns {boolean}
 */
export const isBase64Image = (data) => {
  return data && typeof data === 'string' && (
    data.startsWith('data:image') || 
    (data.length > 100 && !data.startsWith('http'))
  );
};

/**
 * Get the appropriate image URL (handles both Cloudinary and base64)
 * @param {string} imageData - Image URL or base64 string
 * @param {Object} options - Transformation options (only for Cloudinary)
 * @returns {string}
 */
export const getImageUrl = (imageData, options = {}) => {
  if (!imageData) return null;

  // If it's a base64 image, return as is
  if (isBase64Image(imageData)) {
    if (!imageData.startsWith('data:')) {
      return `data:image/jpeg;base64,${imageData}`;
    }
    return imageData;
  }

  // If it's a Cloudinary URL, apply optimizations
  if (isCloudinaryUrl(imageData)) {
    return getOptimizedImageUrl(imageData, options);
  }

  // Return as is for other URLs
  return imageData;
};

/**
 * Generate a blurry placeholder URL for progressive image loading
 * @param {string} imageUrl - Original Cloudinary URL
 * @returns {string} - Placeholder URL
 */
export const getPlaceholderUrl = (imageUrl) => {
  if (!isCloudinaryUrl(imageUrl)) return imageUrl;

  return getOptimizedImageUrl(imageUrl, {
    width: 50,
    height: 50,
    quality: 10,
    effect: 'blur:1000'
  });
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
};

export default {
  extractPublicId,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  generateSrcSet,
  isCloudinaryUrl,
  isBase64Image,
  getImageUrl,
  getPlaceholderUrl,
  formatFileSize
};
