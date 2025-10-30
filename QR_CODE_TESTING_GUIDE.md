# QR Code Testing Guide

## Prerequisites
- Ensure backend server is running on `http://localhost:5000`
- Ensure frontend is running (typically `http://localhost:3000`)
- Have a smartphone with camera/QR scanner app ready
- Have at least one lab report ready to print

## Test Steps

### Step 1: Generate and Print a Lab Report
1. Navigate to the Lab section
2. Select a patient with completed lab results
3. Click the "Print" button on a lab report
4. **Observe**: QR code should appear in the top-right corner of the print preview
5. **Verify**: QR code is approximately 150x150 pixels and clearly visible
6. Print the document (or save as PDF)

### Step 2: Test QR Code Scanning
1. Open your smartphone camera or QR scanner app
2. Point the camera at the printed QR code
3. **Expected Behavior**: 
   - Camera should detect the QR code within 1-2 seconds
   - A notification/link should appear to open the URL
   - URL format should be: `http://localhost:3000/lab-result/[LAB_NUMBER]`

### Step 3: Verify Digital Report Access
1. Click/tap the detected QR code link
2. **Expected Result**: Browser opens to the digital lab report page
3. **Verify the following**:
   - Patient name is displayed correctly
   - Lab number matches the printed report
   - Report date is shown
   - Lab result image is generated and displayed
   - All test results are visible
   - Download and Share buttons work

### Step 4: Test Different Scenarios

#### Scenario A: Different Lab Numbers
- Test with S-series lab number (e.g., GHK-S001)
- Test with F-series lab number (e.g., GHK-F001)
- **Verify**: QR codes for different reports lead to correct results

#### Scenario B: Print Multiple Reports
- Print 2-3 different lab reports
- Scan each QR code
- **Verify**: Each QR code opens its specific report

#### Scenario C: Test from PDF
- Save report as PDF instead of printing
- Scan QR code from PDF on another screen
- **Verify**: QR code works from digital PDF

### Step 5: Edge Case Testing

#### Test A: Old Saved Reports
If you have old reports saved before this fix:
1. Try accessing them via old URLs
2. **Expected**: Should still work due to backward compatibility

#### Test B: Network Issues
1. Open digital report
2. Turn off Wi-Fi/disconnect from network
3. **Expected**: Report should still display (data is cached)

#### Test C: Different Phones
- Test with different smartphone models
- Test with both iOS and Android
- **Expected**: Should work on all modern smartphones

## Success Criteria

✅ QR code is visible and properly sized on printed report  
✅ QR code scans within 1-2 seconds with phone camera  
✅ URL format is clean and readable  
✅ Digital report page loads successfully  
✅ All patient and test data displays correctly  
✅ Download/Share/Print functions work on digital report  

## Troubleshooting

### QR Code Not Appearing
- Check browser console for errors
- Verify `qrcode` npm package is installed: `npm list qrcode`
- Ensure logo image is loading properly

### QR Code Not Scanning
- Ensure adequate lighting when scanning
- Try moving phone closer/farther from QR code
- Clean camera lens
- Try a dedicated QR scanner app if native camera doesn't work

### Digital Report Not Loading
- Check if frontend server is running
- Verify lab number in URL matches stored data
- Check browser console for localStorage errors
- Try clearing browser cache and localStorage

### Image Not Generating
- Check browser console for html2canvas errors
- Verify patient data is complete
- Try in a different browser

## Reporting Issues

If you encounter any issues, please note:
1. Browser and version
2. Phone model and OS version
3. Exact error messages
4. Steps to reproduce
5. Screenshots of the problem

## Additional Notes

- QR codes work best in good lighting conditions
- Ensure printer quality is set to "Normal" or "High" for best QR code printing
- Digital reports are stored in browser localStorage (temporary storage)
- In production, consider implementing backend storage for reports
