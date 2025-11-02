# Backend Storage Architecture - Visual Guide

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTIONS                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │ Print Report │    │  Scan QR     │
            │ (LeftBar.jsx)│    │   Code       │
            └──────┬───────┘    └──────┬───────┘
                   │                   │
                   ▼                   ▼


┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LeftBar.jsx                    LabResultViewer.jsx              │
│  ┌─────────────────┐            ┌──────────────────┐            │
│  │ Generate QR Code│            │ Fetch Report Data│            │
│  │                 │            │                  │            │
│  │ Save Data:      │            │ Fetch Priority:  │            │
│  │ 1. localStorage │◄───────────┤ 1. Backend DB    │            │
│  │ 2. Backend DB   │            │ 2. localStorage  │            │
│  └────────┬────────┘            └────────┬─────────┘            │
│           │                              │                       │
└───────────┼──────────────────────────────┼───────────────────────┘
            │                              │
            │ POST /api/lab-result/save    │ GET /api/lab-result/:id
            │                              │
┌───────────┼──────────────────────────────┼───────────────────────┐
│           ▼                              ▼                        │
│  ┌────────────────────────────────────────────────┐             │
│  │            BACKEND API LAYER                    │             │
│  │         (Express.js Server)                     │             │
│  ├────────────────────────────────────────────────┤             │
│  │                                                 │             │
│  │  Routes: labResultRoutes.js                    │             │
│  │  ┌───────────────────────────────────┐        │             │
│  │  │ POST /api/lab-result/save         │        │             │
│  │  │ GET  /api/lab-result/:labNumber   │        │             │
│  │  │ DELETE /api/lab-result/:labNumber │        │             │
│  │  │ GET  /api/lab-result-stats        │        │             │
│  │  └───────────┬───────────────────────┘        │             │
│  │              │                                  │             │
│  │              ▼                                  │             │
│  │  ┌───────────────────────────────────┐        │             │
│  │  │  Validation & Error Handling      │        │             │
│  │  └───────────┬───────────────────────┘        │             │
│  │              │                                  │             │
│  └──────────────┼──────────────────────────────────┘             │
│                 │                                                │
└─────────────────┼────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (MongoDB)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Collections:                                                    │
│  ┌────────────────────────────┐  ┌─────────────────────────┐  │
│  │  labresultsnapshots        │  │  labs                   │  │
│  ├────────────────────────────┤  ├─────────────────────────┤  │
│  │ • labNumber (indexed)      │  │ • patientName          │  │
│  │ • patientName              │  │ • labNumber            │  │
│  │ • reportData (full object) │  │ • urineTest            │  │
│  │ • createdAt                │  │ • bloodTest            │  │
│  │ • expiresAt (90 days)      │  │ • ... (original data)  │  │
│  │ • Auto-cleanup enabled     │  │                         │  │
│  └───────────┬────────────────┘  └────────┬────────────────┘  │
│              │                             │                   │
│              │  Primary Source             │  Fallback Source  │
│              │  (Recent prints)            │  (Original data)  │
│              │                             │                   │
└──────────────┴─────────────────────────────┴───────────────────┘


## Data Flow: Print to View

┌──────────────────────────────────────────────────────────────────┐
│                    PRINT REPORT FLOW                              │
└──────────────────────────────────────────────────────────────────┘

  User Clicks Print
        │
        ▼
  ┌─────────────────┐
  │ Prepare Report  │
  │ Data + QR URL   │
  └────────┬────────┘
           │
           ├──────────────────┬──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
  │ localStorage│   │ Backend POST │   │  Generate   │
  │ (immediate) │   │  /save API   │   │  QR Code    │
  └─────────────┘   └──────────────┘   │  (base64)   │
           │                  │         └──────┬──────┘
           │                  │                │
           │                  ▼                │
           │         ┌──────────────┐         │
           │         │   MongoDB    │         │
           │         │   Storage    │         │
           │         └──────────────┘         │
           │                                   │
           └─────────────────┬─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Print Window   │
                    │  with QR Code   │
                    └─────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│                    SCAN QR CODE FLOW                              │
└──────────────────────────────────────────────────────────────────┘

  Scan QR Code
        │
        ▼
  ┌──────────────────┐
  │ Extract Lab      │
  │ Number from URL  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────────────┐
  │ LabResultViewer.jsx      │
  │ useParams: reportId      │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │ Try Fetch Sources:       │
  │                          │
  │ 1. Backend API           │◄──── Preferred (production)
  │    GET /api/lab-result   │
  │         ↓                │
  │    ✅ Success → Display  │
  │    ❌ Fail → Next        │
  │         ↓                │
  │ 2. localStorage          │◄──── Fallback (backward compat)
  │    getItem()             │
  │         ↓                │
  │    ✅ Found → Display    │
  │    ❌ Not Found → Error  │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────┐
  │ Generate Image   │
  │ (html2canvas)    │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Display Report   │
  │ + Data Source    │
  └──────────────────┘


## API Request/Response Flow

┌──────────────────────────────────────────────────────────────────┐
│                    SAVE REQUEST                                   │
└──────────────────────────────────────────────────────────────────┘

  Frontend (LeftBar.jsx)
        │
        │ POST /api/lab-result/save
        │ {
        │   labNumber: "GHK-S001",
        │   patientName: "John Doe",
        │   reportData: { ... }
        │ }
        │
        ▼
  Backend (labResultRoutes.js)
        │
        ├─► Validate Input
        │   • labNumber present?
        │   • patientName present?
        │   • reportData present?
        │
        ├─► MongoDB Operation
        │   • findOneAndUpdate
        │   • upsert: true (create or update)
        │   • set expiresAt: +90 days
        │
        ▼
  Response
        │
        │ 200 OK
        │ {
        │   success: true,
        │   message: "Saved successfully",
        │   data: { labNumber, patientName, createdAt }
        │ }
        │
        ▼
  Frontend
        │
        └─► toast.success("QR code generated")


┌──────────────────────────────────────────────────────────────────┐
│                    RETRIEVE REQUEST                               │
└──────────────────────────────────────────────────────────────────┘

  Frontend (LabResultViewer.jsx)
        │
        │ GET /api/lab-result/GHK-S001
        │
        ▼
  Backend (labResultRoutes.js)
        │
        ├─► Try LabResultSnapshot
        │   • findOne({ labNumber })
        │   • Found? Return with source: "snapshot"
        │
        ├─► Fallback to Lab Collection
        │   • findOne({ labNumber })
        │   • Found? Return with source: "lab-collection"
        │
        └─► Not Found
            • Return 404
        │
        ▼
  Response
        │
        │ 200 OK
        │ {
        │   success: true,
        │   data: {
        │     id, patientName, labNumber,
        │     reportDate, data: { ... }
        │   },
        │   source: "snapshot"
        │ }
        │
        ▼
  Frontend
        │
        ├─► setReportData(data)
        ├─► generateReportImage()
        └─► Display with source indicator


## Error Handling & Fallback Flow

┌──────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                                │
└──────────────────────────────────────────────────────────────────┘

  Backend API Call
        │
        ├─► Network Error
        │   └─► Fallback to localStorage
        │       └─► Found? Display
        │           └─► Not Found? Show Error
        │
        ├─► 404 Not Found
        │   └─► Try localStorage
        │       └─► Found? Display
        │           └─► Not Found? Show Error
        │
        ├─► 500 Server Error
        │   └─► Try localStorage
        │       └─► Log error
        │           └─► Show user-friendly message
        │
        └─► Success
            └─► Display report


## Storage Comparison

┌────────────────────────────────────────────────────────────────┐
│                    STORAGE STRATEGIES                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  localStorage                     Backend Database              │
│  ┌─────────────────────┐         ┌──────────────────────┐     │
│  │ ✅ Instant access    │         │ ✅ Cross-device      │     │
│  │ ✅ No network needed │         │ ✅ Persistent        │     │
│  │ ✅ Backward compat   │         │ ✅ Centralized       │     │
│  │ ❌ Device-specific   │         │ ✅ Backup-able       │     │
│  │ ❌ Can be cleared    │         │ ✅ Queryable         │     │
│  │ ❌ Limited storage   │         │ ❌ Network required  │     │
│  └─────────────────────┘         └──────────────────────┘     │
│           │                                │                    │
│           │    Used Together for Best      │                    │
│           └────────► of Both Worlds ◄──────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


## Deployment Architecture

┌────────────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                             │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Internet/Users                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
          ┌──────────────────┐  ┌──────────────────┐
          │  Frontend Server │  │  Mobile Devices  │
          │  (Nginx/Apache)  │  │  (QR Scanners)   │
          │                  │  │                  │
          │ React Build      │  └─────────┬────────┘
          │ .env.production  │            │
          └────────┬─────────┘            │
                   │                      │
                   │ HTTPS                │
                   │                      │
          ┌────────┴──────────────────────┘
          │
          ▼
┌──────────────────────────────────────────┐
│         Backend Server                    │
│         (Node.js + Express)               │
│                                           │
│  • API Routes                             │
│  • CORS: production domain                │
│  • Environment: .env (production)         │
│  • Logging & Monitoring                   │
└────────────┬──────────────────────────────┘
             │
             │ MongoDB Connection
             │ (Authenticated)
             │
             ▼
┌─────────────────────────────────────────┐
│      MongoDB Atlas / Database            │
│                                          │
│  • Replica Set                           │
│  • Automatic Backups                     │
│  • TTL Indexes (auto-cleanup)            │
│  • Monitoring & Alerts                   │
└──────────────────────────────────────────┘


## Data Lifecycle

┌────────────────────────────────────────────────────────────────┐
│              LAB RESULT LIFECYCLE                               │
└────────────────────────────────────────────────────────────────┘

  Day 0: Report Printed
        │
        ▼
  ┌─────────────────────────────┐
  │ Saved to MongoDB             │
  │ • labresultsnapshots         │
  │ • expiresAt: Day 0 + 90 days │
  └────────┬────────────────────┘
           │
           ▼
  Day 1-89: Active Period
        │
        ├─► QR Code Scans
        ├─► Report Views
        └─► Data Accessible
           │
           ▼
  Day 90: Expiration
        │
        ▼
  ┌─────────────────────────────┐
  │ MongoDB TTL Index            │
  │ Auto-deletes expired docs    │
  └────────┬────────────────────┘
           │
           ▼
  Original Lab Collection
        │
        └─► Still Available
            (permanent record)
```
