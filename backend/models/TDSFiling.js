const mongoose = require('mongoose');

const TDSFilingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  deductorName: { type: String, required: true, trim: true },
  deductorTAN: { type: String, uppercase: true, trim: true },
  deductorPAN: { type: String, uppercase: true, trim: true },
  financialYear: { type: String, required: true },
  quarter: { type: String, enum: ['Q1','Q2','Q3','Q4'], required: true },
  formType: { type: String, enum: ['24Q','26Q','27Q','27EQ'], default: '24Q' },
  status: { type: String, enum: ['draft','prepared','filed','late_filed'], default: 'draft' },
  totalAmountPaid: { type: Number, default: 0 },
  totalTaxDeducted: { type: Number, default: 0 },
  totalTaxDeposited: { type: Number, default: 0 },
  ackNumber: { type: String },
  filedOn: { type: Date },
  dueDate: { type: Date },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TDSFilingSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });
module.exports = mongoose.model('TDSFiling', TDSFilingSchema);
