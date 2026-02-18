import React, { useState } from 'react';
import { getImageUrl, getPlaceholderUrl, isCloudinaryUrl } from '../utils/cloudinaryHelper';

/**
 * OptimizedImage Component
 * 
 * A React component that automatically optimizes Cloudinary images
 * and provides progressive loading with blur effect.
 * 
 * Usage:
 * <OptimizedImage 
 *   src={patient.photo} 
 *   alt={patient.name}
 *   width={300}
 *   height={300}
 *   className="profile-photo"
 * />
 */
export const OptimizedImage = ({ 
  src, 
  alt = 'Image', 
  width = 300, 
  height = 300,
  crop = 'fill',
  className = '',
  fallback = '/default-avatar.png',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // If no src or error, show fallback
  if (!src || error) {
    return <img src={fallback} alt={alt} className={className} {...props} />;
  }

  // Get optimized URLs
  const optimizedUrl = getImageUrl(src, { width, height, crop });
  const placeholderUrl = isCloudinaryUrl(src) 
    ? getPlaceholderUrl(src) 
    : optimizedUrl;

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Blurry placeholder */}
      {!isLoaded && (
        <img
          src={placeholderUrl}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        src={optimizedUrl}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
};

/**
 * ResponsiveImage Component
 * 
 * A component that serves different image sizes based on screen width
 * for optimal performance.
 * 
 * Usage:
 * <ResponsiveImage 
 *   src={patient.photo} 
 *   alt={patient.name}
 *   className="w-full h-auto"
 * />
 */
export const ResponsiveImage = ({ 
  src, 
  alt = 'Image', 
  className = '',
  sizes = '(max-width: 640px) 300px, (max-width: 1024px) 600px, 900px',
  fallback = '/default-avatar.png',
  ...props 
}) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <img src={fallback} alt={alt} className={className} {...props} />;
  }

  // Only create srcSet for Cloudinary images
  if (isCloudinaryUrl(src)) {
    const generateSrcSet = () => {
      const widths = [300, 600, 900, 1200];
      return widths
        .map(width => {
          const url = getImageUrl(src, { width, crop: 'limit' });
          return `${url} ${width}w`;
        })
        .join(', ');
    };

    return (
      <img
        src={getImageUrl(src, { width: 900 })}
        srcSet={generateSrcSet()}
        sizes={sizes}
        alt={alt}
        className={className}
        onError={() => setError(true)}
        loading="lazy"
        {...props}
      />
    );
  }

  // For non-Cloudinary images, render normally
  return (
    <img
      src={getImageUrl(src)}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
      {...props}
    />
  );
};

/**
 * AvatarImage Component
 * 
 * A circular avatar component optimized for profile photos
 * 
 * Usage:
 * <AvatarImage 
 *   src={patient.photo} 
 *   alt={patient.name}
 *   size={100}
 * />
 */
export const AvatarImage = ({ 
  src, 
  alt = 'Avatar', 
  size = 100,
  className = '',
  fallback = '/default-avatar.png',
  ...props 
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      crop="fill"
      className={`rounded-full ${className}`}
      fallback={fallback}
      {...props}
    />
  );
};

/**
 * ThumbnailGallery Component
 * 
 * Displays a gallery of thumbnail images
 * 
 * Usage:
 * <ThumbnailGallery 
 *   images={[url1, url2, url3]}
 *   onImageClick={(url) => console.log(url)}
 * />
 */
export const ThumbnailGallery = ({ 
  images = [], 
  onImageClick = () => {},
  size = 150,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {images.map((imageUrl, index) => (
        <div
          key={index}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onImageClick(imageUrl)}
        >
          <OptimizedImage
            src={imageUrl}
            alt={`Thumbnail ${index + 1}`}
            width={size}
            height={size}
            crop="fill"
            className="rounded-lg shadow-md"
          />
        </div>
      ))}
    </div>
  );
};

export default {
  OptimizedImage,
  ResponsiveImage,
  AvatarImage,
  ThumbnailGallery
};
