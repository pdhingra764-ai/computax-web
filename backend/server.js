const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// CORS for Vercel and production
app.use(cors({
  origin: ['https://computax-web.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB (skip in serverless cold start sometimes)
let dbConnected = false;
connectDB().then(() => { dbConnected = true; }).catch(() => { dbConnected = false; });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/itr', require('./routes/itr'));
app.use('/api/gst', require('./routes/gst'));
app.use('/api/tds', require('./routes/tds'));
app.use('/api/duedates', require('./routes/duedates'));
app.use('/api/import', require('./routes/import'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/', (req, res) => res.json({ message: 'CompuTax API v2 ✅', version: '2.0.0', db: dbConnected ? 'connected' : 'disconnected' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// For local development
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 CompuTax v2 running on port ${PORT}`));
}

// Export for Vercel serverless
module.exports = app;
