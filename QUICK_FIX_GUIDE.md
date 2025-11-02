# Quick Fix: QR Code Production Issue

## The Problem
QR codes don't work in production because URLs are hardcoded to `localhost:5000`.

## The Solution (3 Steps)

### 1️⃣ Update Environment Variables
Edit `frontend/.env.production` with YOUR production URLs:
```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_FRONTEND_URL=https://your-frontend-url.com
```

### 2️⃣ Build for Production
```bash
cd frontend
npm run build
```

### 3️⃣ Deploy
Upload the `build` folder to your web server.

---

## Files Already Fixed
✅ `frontend/src/components/LeftBar.jsx` - QR code generation now uses environment variables

## Files Created
✅ `frontend/.env` - Development configuration
✅ `frontend/.env.production` - Production configuration (UPDATE THIS!)
✅ `frontend/src/config/api.config.js` - Centralized API configuration

---

## What Changed in LeftBar.jsx

**Before:**
```javascript
const qrUrl = `${window.location.origin}/lab-result/${reportId}`;
```

**After:**
```javascript
import { FRONTEND_URL } from '../config/api.config';
const qrUrl = `${FRONTEND_URL}/lab-result/${reportId}`;
```

This ensures QR codes use your production URL, not localhost.

---

## Testing

1. **Local Test:**
   ```bash
   npm start
   # Should still work on localhost
   ```

2. **Production Test:**
   - Build: `npm run build`
   - Deploy to server
   - Print a lab report
   - Scan QR code with phone
   - Should open: `https://your-domain.com/lab-result/[LAB_NUMBER]`

---

## Important Notes

⚠️ **LocalStorage Issue**: Lab results are currently stored in browser's localStorage. This means:
- QR codes only work if the report was printed on the same device
- For true production use, implement backend storage (see below)

### Recommended: Backend Storage

For production, store lab results in the database:

1. Add to backend (`server.js` or routes):
```javascript
app.get('/api/lab-result/:labNumber', async (req, res) => {
  const result = await LabResult.findOne({ labNumber: req.params.labNumber });
  res.json(result);
});
```

2. Update `LabResultViewer.jsx`:
```javascript
// Replace localStorage code with:
const response = await axios.get(`${API_BASE_URL}/api/lab-result/${reportId}`);
setReportData(response.data);
```

---

## Need to Update More Files?

Other files still use `localhost:5000`. To update them all:

1. Press `Ctrl+Shift+H` in VS Code
2. Find: `'http://localhost:5000`
3. Replace with: `API_BASE_URL + '`
4. Add import at top: `import { API_BASE_URL } from '../config/api.config';`

See `API_MIGRATION_GUIDE.md` for complete instructions.

---

## Quick Troubleshooting

**QR code shows localhost URL:**
- Check `.env.production` is correct
- Rebuild: `npm run build`

**API calls fail in production:**
- Verify backend CORS allows your frontend domain
- Check backend URL is accessible

**QR code doesn't open report:**
- Implement backend storage (recommended)
- Or ensure QR is scanned on same device that printed it
