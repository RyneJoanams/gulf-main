# QR Code Production Deployment Guide

## Problem Overview
The QR code functionality was not working in production because:
1. **Hardcoded localhost URLs** - All API calls used `http://localhost:5000`
2. **Missing environment configuration** - No `.env` files for production URLs
3. **localStorage limitation** - Data stored locally won't persist across deployments or devices

## Solutions Implemented

### 1. Environment Variables Setup

Created two environment files:

**`.env`** (for development):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FRONTEND_URL=http://localhost:3000
```

**`.env.production`** (for production - **YOU MUST UPDATE THESE**):
```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_FRONTEND_URL=https://your-frontend-domain.com
```

### 2. API Configuration File

Created `src/config/api.config.js` to centralize all API endpoints and use environment variables.

### 3. Updated LeftBar.jsx

Modified to use:
- `API_ENDPOINTS` from config instead of hardcoded URLs
- `FRONTEND_URL` for QR code generation

## Deployment Steps

### Step 1: Update Environment Variables

1. Open `frontend/.env.production`
2. Replace the placeholder URLs with your actual production URLs:

```env
# Example for a production setup:
REACT_APP_API_URL=https://api.gulfhealthcare.com
REACT_APP_FRONTEND_URL=https://gulfhealthcare.com
```

Or if using subdomains:
```env
REACT_APP_API_URL=https://backend.yourdomain.com
REACT_APP_FRONTEND_URL=https://app.yourdomain.com
```

### Step 2: Build the Production Version

```bash
cd frontend
npm run build
```

This will create a `build` folder with optimized production files that use the `.env.production` variables.

### Step 3: Deploy to Server

Upload the `build` folder contents to your web server (e.g., Nginx, Apache, or hosting service).

### Step 4: Backend Configuration

Ensure your backend server has CORS configured to accept requests from your production frontend URL:

```javascript
// In your backend server.js or app.js
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend-domain.com',
  credentials: true
}));
```

### Step 5: Test QR Code Functionality

1. **Generate a Lab Report** in production
2. **Print the report** - verify QR code appears
3. **Scan QR code** with a smartphone
4. **Verify** it opens the correct production URL (e.g., `https://yourdomain.com/lab-result/GHK-S001`)

## Important Notes

### localStorage Limitation

⚠️ **Current Implementation**: Lab report data is stored in browser's localStorage, which means:
- Data is only available on the same browser/device
- Data is lost if browser cache is cleared
- QR codes won't work if scanned on a different device/browser

### Recommended Production Solution

For a true production deployment, you should:

1. **Store lab results in the backend database** instead of localStorage
2. **Create a backend API endpoint** to retrieve lab results:
   ```javascript
   // Backend: GET /api/lab-result/:labNumber
   app.get('/api/lab-result/:labNumber', async (req, res) => {
     const labNumber = req.params.labNumber;
     const result = await LabResult.findOne({ labNumber });
     res.json(result);
   });
   ```
3. **Update LabResultViewer.jsx** to fetch from API instead of localStorage:
   ```javascript
   // Instead of localStorage.getItem()
   const response = await axios.get(`${API_BASE_URL}/api/lab-result/${reportId}`);
   setReportData(response.data);
   ```

## Troubleshooting

### QR Code Shows Wrong URL
- Check that `.env.production` has the correct `REACT_APP_FRONTEND_URL`
- Rebuild the app: `npm run build`
- Clear browser cache and test again

### QR Code Not Working After Scan
- Verify the production URL is accessible from external networks
- Check that the lab result data exists (currently in localStorage)
- Implement backend storage for persistent access (recommended)

### API Calls Failing
- Verify `REACT_APP_API_URL` points to the correct backend
- Check backend CORS configuration
- Inspect browser console for specific error messages

## Environment Variable Reference

### Development (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FRONTEND_URL=http://localhost:3000
```

### Production (.env.production)
```env
REACT_APP_API_URL=https://your-actual-backend-url.com
REACT_APP_FRONTEND_URL=https://your-actual-frontend-url.com
```

## Files Modified

1. ✅ `frontend/.env` - Created with development defaults
2. ✅ `frontend/.env.production` - Created (needs your URLs)
3. ✅ `frontend/src/config/api.config.js` - Created for centralized API config
4. ✅ `frontend/src/components/LeftBar.jsx` - Updated to use environment variables

## Next Steps

1. **Update `.env.production`** with your actual production URLs
2. **Test locally** first with `.env` set to production URLs
3. **Build for production**: `npm run build`
4. **Deploy** the build folder to your server
5. **Test QR codes** in production environment
6. **Consider implementing backend storage** for lab results (recommended for production)
