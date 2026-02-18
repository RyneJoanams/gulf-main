require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');


const labRoutes = require('./routes/labRoutes')
const patientRoutes = require('./routes/patientRoutes');
const userRoutes = require('./routes/userRoutes');
const labNumberRoutes = require('./routes/labNumberRoutes');
const radiologyRoutes = require('./routes/radiologyRoutes');
const clinicalRoute = require('./routes/clinicalRoutes');
const expenseRoutes = require('./routes/expenses');
const labResultRoutes = require('./routes/labResultRoutes');

// Initialize the app 
const app = express();
const PORT = process.env.PORT;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_FRONTEND_URL,
  'https://www.ghck.co.ke',
  'https://ghck.co.ke'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Global request timeout — kills requests that hang longer than 25s before the
// gateway (Nginx/render.com) fires a 502/504.
app.use((req, res, next) => {
  res.setTimeout(25000, () => {
    console.error(`[TIMEOUT] ${req.method} ${req.originalUrl} exceeded 25 s`);
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timed out. Please try again.' });
    }
  });
  next();
});

// Light cache headers for GET requests — lets browsers/CDNs reuse responses for
// up to 30 s, drastically reducing redundant API hammering on page load.
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO, {
  maxPoolSize: 10,          // Allow up to 10 simultaneous connections (default is 5)
  minPoolSize: 2,           // Keep at least 2 connections warm
  serverSelectionTimeoutMS: 10000, // Give up selecting a server after 10 s
  connectTimeoutMS: 10000,  // TCP connection timeout
  socketTimeoutMS: 30000,   // Kill idle sockets after 30 s (prevents 504 hangs)
  heartbeatFrequencyMS: 10000, // Send keepalive every 10 s
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import routes
app.use('/api/lab', labRoutes);
app.use('/api/number', labNumberRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/user', userRoutes);
app.use('/api/radiology', radiologyRoutes);
app.use('/api/clinical', clinicalRoute);
app.use('/api/expenses', expenseRoutes);
app.use('/api', labResultRoutes); // Lab result snapshot routes for QR code functionality

// Example route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the backend!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});