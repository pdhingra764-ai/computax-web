const mongoose = require('mongoose');

const GSTFilingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  gstin: { type: String, required: true, uppercase: true },
  returnType: {
    type: String,
    enum: ['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-9C'],
    required: true
  },
  period: { type: String, required: true }, // e.g. "Oct-2024" or "2023-24"
  status: {
    type: String,
    enum: ['draft', 'prepared', 'filed', 'late_filed'],
    default: 'draft'
  },

  // GSTR-1 / Sales
  totalTaxableSales: { type: Number, default: 0 },
  b2bSales: { type: Number, default: 0 },
  b2cSales: { type: Number, default: 0 },
  exportSales: { type: Number, default: 0 },
  cgstOnSales: { type: Number, default: 0 },
  sgstOnSales: { type: Number, default: 0 },
  igstOnSales: { type: Number, default: 0 },

  // GSTR-3B / Summary
  totalTaxablePurchases: { type: Number, default: 0 },
  itcCgst: { type: Number, default: 0 },
  itcSgst: { type: Number, default: 0 },
  itcIgst: { type: Number, default: 0 },
  totalITC: { type: Number, default: 0 },

  // Net Tax
  cgstPayable: { type: Number, default: 0 },
  sgstPayable: { type: Number, default: 0 },
  igstPayable: { type: Number, default: 0 },
  totalTaxPayable: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },
  interest: { type: Number, default: 0 },

  // Filing info
  ackNumber: { type: String },
  filedOn: { type: Date },
  dueDate: { type: Date },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

GSTFilingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GSTFiling', GSTFilingSchema);
