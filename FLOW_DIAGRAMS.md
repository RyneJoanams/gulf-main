# QR Code Flow Diagram

## Current Implementation (After Fix)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRINT LAB REPORT                          │
│                  (LeftBar.jsx)                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │ Read Environment Variables     │
         │ FRONTEND_URL from .env         │
         └────────────┬──────────────────┘
                      │
                      ▼
         ┌───────────────────────────────┐
         │ Generate QR Code URL           │
         │ ${FRONTEND_URL}/lab-result/    │
         │ {LAB_NUMBER}                   │
         └────────────┬──────────────────┘
                      │
                      ▼
         ┌───────────────────────────────┐
         │ Create QR Code (base64)        │
         │ Using qrcode library           │
         │ Size: 130x130px                │
         └────────────┬──────────────────┘
                      │
                      ▼
         ┌───────────────────────────────┐
         │ Store Report Data              │
         │ localStorage (temporary)        │
         └────────────┬──────────────────┘
                      │
                      ▼
         ┌───────────────────────────────┐
         │ Generate Print HTML            │
         │ Include QR code image          │
         └────────────┬──────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ PRINT REPORT │
              └──────────────┘
```

## QR Code Scanning Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  SCAN QR CODE                                │
│              (Smartphone Camera)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │ Detect QR Code URL             │
         │ https://yourdomain.com/        │
         │ lab-result/GHK-S001            │
         └────────────┬──────────────────┘
                      │
                      ▼
         ┌───────────────────────────────┐
         │ Open URL in Browser            │
         │ LabResultViewer.jsx            │
         └────────────┬──────────────────┘
                      │
                      ▼
         ┌───────────────────────────────┐
         │ Extract Lab Number from URL    │
         │ (useParams hook)               │
         └────────────┬──────────────────┘
                      │
                      ▼
         ┌───────────────────────────────┐
         │ Fetch Report Data              │
         │ (currently: localStorage)      │
         └────────────┬──────────────────┘
                      │
                      ▼
         ┌───────────────────────────────┐
         │ Generate Report Image          │
         │ (html2canvas)                  │
         └────────────┬──────────────────┘
                      │
                      ▼
         ┌───────────────────────────────┐
         │ Display Lab Result             │
         │ - Patient Info                 │
         │ - Test Results                 │
         │ - Report Image                 │
         └────────────┬──────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ VIEW REPORT  │
              └──────────────┘
```

## Environment Configuration Flow

```
Development:
┌──────────────┐
│   .env       │ ────▶ REACT_APP_API_URL=http://localhost:5000
│              │       REACT_APP_FRONTEND_URL=http://localhost:3000
└──────────────┘

Production:
┌──────────────┐
│.env.production│ ──▶ REACT_APP_API_URL=https://api.yourdomain.com
│              │      REACT_APP_FRONTEND_URL=https://yourdomain.com
└──────────────┘

        │
        ▼
┌─────────────────┐
│  npm run build  │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│   build folder     │ ◀── Environment variables baked in
│  (production code) │     (must rebuild if changed)
└────────────────────┘
```

## API Configuration Structure

```
┌────────────────────────────────────────────────┐
│           api.config.js                        │
├────────────────────────────────────────────────┤
│                                                │
│  API_BASE_URL                                  │
│    ├─ Dev:  http://localhost:5000             │
│    └─ Prod: https://api.yourdomain.com        │
│                                                │
│  FRONTEND_URL                                  │
│    ├─ Dev:  http://localhost:3000             │
│    └─ Prod: https://yourdomain.com            │
│                                                │
│  API_ENDPOINTS                                 │
│    ├─ patients: ${API_BASE_URL}/api/patient   │
│    ├─ labNumbers: ${API_BASE_URL}/api/number  │
│    ├─ clinical: ${API_BASE_URL}/api/clinical  │
│    └─ [other endpoints...]                    │
│                                                │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│  Import in Components:                         │
│  import { API_ENDPOINTS, FRONTEND_URL }        │
│           from '../config/api.config'          │
└────────────────────────────────────────────────┘
```

## Data Flow: Print to View

```
┌─────────────┐
│   Print     │
│   Report    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Generate QR URL    │
│  FRONTEND_URL +     │
│  /lab-result/       │
│  LAB_NUMBER         │
└──────┬──────────────┘
       │
       ├──────────────────────────┐
       │                          │
       ▼                          ▼
┌────────────┐          ┌──────────────────┐
│localStorage│          │ QR Code (image)  │
│ Store data │          │ Contains URL     │
└──────┬─────┘          └──────┬───────────┘
       │                       │
       │                       │
       │    ┌──────────┐       │
       │    │  PRINT   │       │
       │    └────┬─────┘       │
       │         │             │
       │         ▼             │
       │    ┌──────────┐       │
       │    │ QR Code  │       │
       │    │ on Paper │◀──────┘
       │    └────┬─────┘
       │         │
       │         ▼
       │    ┌──────────┐
       │    │   SCAN   │
       │    └────┬─────┘
       │         │
       │         ▼
       │    ┌──────────────┐
       │    │Open URL in   │
       │    │Browser       │
       │    └────┬─────────┘
       │         │
       │         ▼
       │    ┌──────────────┐
       │    │LabResultViewer│
       │    │ Component    │
       │    └────┬─────────┘
       │         │
       └─────────▶ Fetch data
              │
              ▼
         ┌──────────┐
         │ Display  │
         │ Report   │
         └──────────┘
```

## Before vs After: URL Generation

### BEFORE (Broken in Production)
```javascript
// Hardcoded localhost
axios.get('http://localhost:5000/api/number')
                    ↓
        Works in DEV ✅
        Fails in PROD ❌

// QR URL with window.location.origin
const qrUrl = `${window.location.origin}/lab-result/${id}`;
                    ↓
        Dev: http://localhost:3000/lab-result/GHK-S001
        Prod: https://yourdomain.com/lab-result/GHK-S001
                    ↓
        QR generation: OK ✅
        But API calls: FAIL ❌
```

### AFTER (Production Ready)
```javascript
// Environment-based configuration
import { API_ENDPOINTS } from '../config/api.config';
axios.get(API_ENDPOINTS.labNumbers)
                    ↓
        Dev:  http://localhost:5000/api/number ✅
        Prod: https://api.yourdomain.com/api/number ✅

// QR URL with environment variable
import { FRONTEND_URL } from '../config/api.config';
const qrUrl = `${FRONTEND_URL}/lab-result/${id}`;
                    ↓
        Dev:  http://localhost:3000/lab-result/GHK-S001 ✅
        Prod: https://yourdomain.com/lab-result/GHK-S001 ✅
                    ↓
        QR generation: OK ✅
        API calls: OK ✅
```

## localStorage vs Backend Storage

### Current: localStorage (Temporary Solution)
```
┌──────────┐      ┌──────────────┐      ┌──────────┐
│  Print   │ ───▶ │ localStorage │ ◀─── │ Scan QR  │
│  Report  │      │ (Same Device)│      │ (Browser)│
└──────────┘      └──────────────┘      └──────────┘
                         │
                         ▼
                  ✅ Works on same device
                  ❌ Fails on different device
                  ❌ Lost if cache cleared
```

### Recommended: Backend Storage (Production Solution)
```
┌──────────┐      ┌──────────────┐      ┌──────────┐
│  Print   │ ───▶ │   Backend    │ ◀─── │ Scan QR  │
│  Report  │      │   Database   │      │ (Any)    │
└──────────┘      └──────────────┘      └──────────┘
                         │
                         ▼
                  ✅ Works on any device
                  ✅ Persistent storage
                  ✅ Production-ready
```

## Deployment Flow

```
┌─────────────────┐
│ Update .env     │
│ .production     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ npm run build   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Upload to       │
│ Web Server      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Test QR Code    │
│ Functionality   │
└─────────────────┘
```
