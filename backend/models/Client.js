const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  pan: { type: String, uppercase: true, trim: true },
  aadhaar: { type: String, trim: true },
  gstin: { type: String, uppercase: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  clientType: {
    type: String,
    enum: ['individual', 'huf', 'firm', 'company', 'trust'],
    default: 'individual'
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', ClientSchema);
