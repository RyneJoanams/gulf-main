const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Use HTTPS
});

// Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on file field name or route
    let folder = 'gulf-medical/general';
    
    if (file.fieldname === 'photo') {
      folder = 'gulf-medical/patients';
    } else if (file.fieldname === 'patientImage') {
      folder = 'gulf-medical/lab-reports';
    } else if (req.path && req.path.includes('radiology')) {
      folder = 'gulf-medical/radiology';
    }

    return {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' }, // Limit max dimensions
        { quality: 'auto' }, // Auto quality optimization
        { fetch_format: 'auto' } // Auto format selection (WebP when supported)
      ],
      resource_type: 'auto', // Automatically detect resource type
      // Generate unique filename with timestamp
      public_id: `${file.fieldname}-${Date.now()}`
    };
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Allowed mime types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF files are allowed.'), false);
  }
};

// Configure Multer with Cloudinary storage with error handling
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (can be adjusted)
  }
});

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary deletion result:', result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  if (!url) return null;
  
  // Extract public_id from Cloudinary URL
  // URL format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id].[format]
  const urlParts = url.split('/');
  const uploadIndex = urlParts.indexOf('upload');
  
  if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
    // Get everything after 'upload/v[version]/'
    const publicIdWithFormat = urlParts.slice(uploadIndex + 2).join('/');
    // Remove file extension
    const publicId = publicIdWithFormat.substring(0, publicIdWithFormat.lastIndexOf('.'));
    return publicId;
  }
  
  return null;
};

// Helper function to generate optimized image URLs with transformations
const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 300,
    height = 300,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop },
      { quality, fetch_format: format }
    ],
    secure: true
  });
};

// Helper function to generate multiple image sizes (for responsive images)
const getResponsiveImageUrls = (publicId) => {
  return {
    thumbnail: getOptimizedImageUrl(publicId, { width: 150, height: 150 }),
    small: getOptimizedImageUrl(publicId, { width: 300, height: 300 }),
    medium: getOptimizedImageUrl(publicId, { width: 600, height: 600 }),
    large: getOptimizedImageUrl(publicId, { width: 1000, height: 1000 }),
    original: cloudinary.url(publicId, { secure: true })
  };
};

module.exports = {
  cloudinary,
  upload,
  deleteFromCloudinary,
  extractPublicId,
  getOptimizedImageUrl,
  getResponsiveImageUrls
};
