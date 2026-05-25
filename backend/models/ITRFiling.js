const mongoose = require('mongoose');

const ITRFilingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  assessmentYear: { type: String, required: true }, // e.g. "2024-25"
  itrType: {
    type: String,
    enum: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'prepared', 'filed', 'acknowledged', 'defective'],
    default: 'draft'
  },
  // Income details
  salaryIncome: { type: Number, default: 0 },
  housePropertyIncome: { type: Number, default: 0 },
  businessIncome: { type: Number, default: 0 },
  capitalGains: { type: Number, default: 0 },
  otherIncome: { type: Number, default: 0 },
  grossTotalIncome: { type: Number, default: 0 },

  // Deductions
  deductionU80C: { type: Number, default: 0 },
  deductionU80D: { type: Number, default: 0 },
  deductionU80G: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  taxableIncome: { type: Number, default: 0 },

  // Tax
  taxLiability: { type: Number, default: 0 },
  tdsCredited: { type: Number, default: 0 },
  advanceTaxPaid: { type: Number, default: 0 },
  taxPayable: { type: Number, default: 0 },
  refundAmount: { type: Number, default: 0 },

  // Filing info
  ackNumber: { type: String },
  filedOn: { type: Date },
  dueDate: { type: Date },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ITRFilingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ITRFiling', ITRFilingSchema);
