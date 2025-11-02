# API Migration Script Usage Guide

## Quick Fix for All Files

Due to the extensive use of hardcoded `localhost:5000` URLs throughout the application, here's a comprehensive approach to fix all files:

### Option 1: Automated Find & Replace (Recommended)

Use VS Code's Find and Replace feature:

1. Press `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (Mac)
2. In "Find" field, enter: `'http://localhost:5000`
3. In "Replace" field, enter: `API_BASE_URL + '`
4. Make sure "Files to include" is set to: `frontend/src/**/*.jsx`
5. Click "Replace All"

Then add the import at the top of each modified file:
```javascript
import { API_BASE_URL } from '../config/api.config';
// or adjust the path based on file location
```

### Option 2: Manual File Updates

Here's the list of files that need updating:

#### High Priority (QR Code Related):
- ✅ `frontend/src/components/LeftBar.jsx` - **ALREADY UPDATED**

#### Medium Priority (Core Functionality):
- `frontend/src/pages/Lab/Lab.jsx`
- `frontend/src/pages/Clinical/Clinical.jsx`
- `frontend/src/pages/Radiology/Radiology.jsx`
- `frontend/src/pages/Phlebotomy/Phlebotomy.jsx`
- `frontend/src/pages/FrontOffice/FrontOffice.jsx`
- `frontend/src/pages/Accounts/Accounts.jsx`

#### Admin Pages:
- `frontend/src/pages/Admin/AdminAuth.jsx`
- `frontend/src/pages/Admin/AllPatients.jsx`
- `frontend/src/pages/Admin/AllUsers.jsx`
- `frontend/src/pages/Admin/Analytics.jsx`
- `frontend/src/pages/Admin/FinancialStatement.jsx`

#### Other:
- `frontend/src/pages/Agent/Agent.jsx`
- `frontend/src/context/patientContext.jsx`

### Import Statement Examples

Based on file location, use the appropriate import:

```javascript
// For files in src/components/
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';

// For files in src/pages/[Department]/
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';

// For files in src/context/
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
```

### URL Replacement Examples

**Before:**
```javascript
axios.get('http://localhost:5000/api/patient')
axios.post('http://localhost:5000/api/lab', data)
axios.put('http://localhost:5000/api/number/complete', data)
```

**After (Method 1 - Using API_BASE_URL):**
```javascript
axios.get(`${API_BASE_URL}/api/patient`)
axios.post(`${API_BASE_URL}/api/lab`, data)
axios.put(`${API_BASE_URL}/api/number/complete`, data)
```

**After (Method 2 - Using API_ENDPOINTS - Preferred):**
```javascript
axios.get(API_ENDPOINTS.patients)
axios.post(API_ENDPOINTS.labRoutes, data)
axios.put(`${API_BASE_URL}/api/number/complete`, data)
```

## Testing After Migration

### 1. Test Development Environment
```bash
cd frontend
npm start
```
- Verify all features work with localhost

### 2. Test with Production URLs Locally
Update `.env`:
```env
REACT_APP_API_URL=https://your-production-backend.com
REACT_APP_FRONTEND_URL=https://your-production-frontend.com
```
Then:
```bash
npm start
```
- Test that API calls go to production backend

### 3. Build and Deploy
```bash
npm run build
```
- Deploy the `build` folder to your server

## Verification Checklist

After making changes, verify these features work:

- [ ] Patient registration
- [ ] Lab number generation
- [ ] Lab report creation and printing
- [ ] QR code generation and scanning
- [ ] Clinical report creation
- [ ] Radiology report creation
- [ ] User login and authentication
- [ ] Accounts and payment processing
- [ ] Admin analytics dashboard

## Rollback Plan

If issues occur, you can quickly rollback by:

1. Using Git to revert changes:
   ```bash
   git checkout HEAD -- frontend/src
   ```

2. Or restore from backup if you created one

## Additional Considerations

### Backend CORS Configuration

Update your backend to accept requests from production:

```javascript
// backend/server.js
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'https://your-production-domain.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Environment-Specific Builds

For different environments (staging, production), create multiple env files:
- `.env.staging`
- `.env.production`

Build with specific env:
```bash
npm run build -- --env=staging
```

## Need Help?

If you encounter issues:
1. Check browser console for error messages
2. Verify environment variables are loaded: `console.log(process.env.REACT_APP_API_URL)`
3. Check network tab in DevTools to see actual URLs being called
4. Ensure backend is accessible from the frontend's network
