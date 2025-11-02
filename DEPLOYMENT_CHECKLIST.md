# 🚀 Production Deployment Checklist

Use this checklist to deploy the QR code fix to production.

## Pre-Deployment

### 1. Update Environment Variables
- [ ] Open `frontend/.env.production`
- [ ] Replace `REACT_APP_API_URL` with your backend URL
- [ ] Replace `REACT_APP_FRONTEND_URL` with your frontend URL
- [ ] Save the file

**Example:**
```env
REACT_APP_API_URL=https://api.gulfhealthcare.com
REACT_APP_FRONTEND_URL=https://gulfhealthcare.com
```

### 2. Test Locally (Optional but Recommended)
- [ ] Update `.env` with production URLs temporarily
- [ ] Run `npm start` in frontend folder
- [ ] Test that API calls work with production backend
- [ ] Test QR code generation
- [ ] Restore `.env` to localhost values

### 3. Build Production Version
- [ ] Open terminal in `frontend` folder
- [ ] Run: `npm run build`
- [ ] Verify build completes without errors
- [ ] Check that `build` folder is created

### 4. Backend Configuration
- [ ] Verify backend CORS allows your frontend domain
- [ ] Backend should be running and accessible
- [ ] Test backend API endpoints are working

## Deployment

### 5. Deploy Frontend
- [ ] Upload contents of `frontend/build` folder to web server
- [ ] OR use your hosting platform's deployment process
- [ ] Verify files are uploaded correctly

### 6. Deploy Backend (if needed)
- [ ] Ensure backend is deployed and running
- [ ] Verify backend is accessible at the URL in `REACT_APP_API_URL`
- [ ] Check backend logs for any errors

## Post-Deployment Testing

### 7. Basic Functionality Test
- [ ] Access production site in browser
- [ ] Login to the system
- [ ] Navigate to Lab section
- [ ] Verify page loads without console errors

### 8. QR Code Generation Test
- [ ] Select a patient with lab results
- [ ] Click Print button
- [ ] Verify QR code appears in print preview
- [ ] Check QR code is approximately 130x130 pixels
- [ ] Print or save as PDF

### 9. QR Code Scanning Test
- [ ] Use smartphone camera or QR scanner app
- [ ] Point at printed QR code
- [ ] Verify QR code is detected within 1-2 seconds
- [ ] Check the URL shows your production domain (NOT localhost)
- [ ] Tap to open the link

### 10. Lab Result Viewer Test
- [ ] After scanning QR code, browser should open
- [ ] Verify page loads at: `https://your-domain.com/lab-result/[LAB_NUMBER]`
- [ ] Check patient name is displayed
- [ ] Verify lab number is correct
- [ ] Confirm report date is shown
- [ ] Check all test results are visible
- [ ] Test Download button works
- [ ] Test Share button works (if applicable)
- [ ] Test Print button works (if applicable)

### 11. Cross-Device Test
- [ ] Test QR code from different smartphone (iOS)
- [ ] Test QR code from different smartphone (Android)
- [ ] Test from tablet
- [ ] Verify works from different browsers

### 12. Multiple Reports Test
- [ ] Print 2-3 different lab reports
- [ ] Scan each QR code
- [ ] Verify each opens the correct specific report
- [ ] Confirm no cross-contamination of data

## Troubleshooting Tests

### 13. Network Issues
- [ ] Open report on mobile device
- [ ] Turn off WiFi/data
- [ ] Check if report still displays (localStorage)
- [ ] Turn connection back on
- [ ] Refresh page, verify still works

### 14. Browser Console Check
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Look for any error messages
- [ ] All errors should be resolved

### 15. Network Tab Check
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Scan a QR code and load report
- [ ] Check API calls are going to correct URLs
- [ ] Verify no 404 or 500 errors

## Rollback Plan (If Issues Occur)

### If QR Code Shows localhost:
- [ ] Check `.env.production` file has correct URLs
- [ ] Delete `build` folder
- [ ] Run `npm run build` again
- [ ] Redeploy

### If API Calls Fail:
- [ ] Check backend is running
- [ ] Verify CORS configuration
- [ ] Check `REACT_APP_API_URL` is correct
- [ ] Check network allows frontend to reach backend

### If Report Doesn't Load:
- [ ] Check browser console for errors
- [ ] Verify localStorage has data (temporary)
- [ ] Consider implementing backend storage

### Complete Rollback:
- [ ] Restore previous build folder from backup
- [ ] Or use Git: `git checkout main -- frontend/`
- [ ] Rebuild: `npm run build`
- [ ] Redeploy old version

## Success Criteria

✅ **Deployment is successful when:**
1. Production QR code shows production domain
2. Scanning works within 1-2 seconds
3. Report loads correctly on scan
4. No console errors
5. Works on multiple devices
6. No localhost references visible

## Documentation Updates

After successful deployment:
- [ ] Document your production URLs for team reference
- [ ] Update any internal wiki or deployment docs
- [ ] Note any issues encountered and solutions

## Optional Enhancements (Future)

Consider these improvements after initial deployment:
- [ ] Implement backend storage for lab results
- [ ] Add QR code expiration dates
- [ ] Implement analytics for QR code scans
- [ ] Add password protection for sensitive reports
- [ ] Create QR code scan history/logs

## Sign-Off

- [ ] QR codes working in production
- [ ] Team members tested and approved
- [ ] Documentation updated
- [ ] Backup plan documented

**Deployment Date:** _____________
**Deployed By:** _____________
**Tested By:** _____________
**Status:** _____________

---

## Quick Reference

**Environment Files:**
- `frontend/.env` - Development
- `frontend/.env.production` - Production

**Build Command:**
```bash
cd frontend
npm run build
```

**Deploy Location:**
Upload `frontend/build/*` to web server

**Test URL Format:**
`https://your-domain.com/lab-result/GHK-S001`

**Support Documents:**
- `QUICK_FIX_GUIDE.md` - Quick reference
- `QR_CODE_PRODUCTION_FIX.md` - Detailed guide
- `IMPLEMENTATION_SUMMARY.md` - Complete overview
