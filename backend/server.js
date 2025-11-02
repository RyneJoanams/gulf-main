const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const labRoutes = require('./routes/labRoutes')
const patientRoutes = require('./routes/patientRoutes');
const userRoutes = require('./routes/userRoutes');
const labNumberRoutes = require('./routes/labNumberRoutes');
const radiologyRoutes = require('./routes/radiologyRoutes');
const clinicalRoute = require('./routes/clinicalRoutes');
const expenseRoutes = require('./routes/expenses');
const labResultRoutes = require('./routes/labResultRoutes');
require('dotenv').config();

// Initialize the app 
const app = express();
const PORT = process.env.PORT;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL // Add your production frontend URL to .env
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, true); // Allow all origins for now, tighten in production
    }
  },
  credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGO)
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
