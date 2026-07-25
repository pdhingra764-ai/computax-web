const mongoose = require('mongoose');

const ITRFilingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  assessmentYear: { type: String, required: true },
  itrType: {
    type: String,
    enum: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4', 'ITR-5', 'ITR-6', 'ITR-7'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'prepared', 'filed', 'acknowledged', 'defective', 'verified'],
    default: 'draft'
  },
  taxRegime: {
    type: String,
    enum: ['new', 'old'],
    default: 'new'
  },

  // ===== SALARY INCOME =====
  salaryIncome: { type: Number, default: 0 },
  salaryDetails: {
    grossSalary: { type: Number, default: 0 },
    valueOfPerquisites: { type: Number, default: 0 },
    profitsInLieuOfSalary: { type: Number, default: 0 },
    exemptAllowances: { type: Number, default: 0 },
    standardDeduction: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    // Form 16 specific
    panOfEmployer: { type: String },
    tanOfEmployer: { type: String },
    nameOfEmployer: { type: String },
    addressOfEmployer: { type: String },
    // Section 80C breakdown
    section80C: {
      lifeInsurancePremium: { type: Number, default: 0 },
      publicProvidentFund: { type: Number, default: 0 },
      equityLinkedSavingsScheme: { type: Number, default: 0 },
      homeLoanPrincipal: { type: Number, default: 0 },
      tuitionFees: { type: Number, default: 0 },
      fixedDeposit5Year: { type: Number, default: 0 },
      nsc: { type: Number, default: 0 },
      ulip: { type: Number, default: 0 },
      contributionToPension: { type: Number, default: 0 },
      other80C: { type: Number, default: 0 }
    },
    // Section 80CCC
    section80CCC: { type: Number, default: 0 }, // NPS contribution
    // Section 80CCD(1)
    section80CCD1: { type: Number, default: 0 }, // NPS (employee)
    // Section 80CCD(1B)
    section80CCD1B: { type: Number, default: 0 }, // Extra NPS
    // Section 80CCD(2)
    section80CCD2: { type: Number, default: 0 }, // Employer NPS
    // HRA
    hraReceived: { type: Number, default: 0 },
    hraRentPaid: { type: Number, default: 0 },
    hraMetroCity: { type: Boolean, default: false },
    hraExemption: { type: Number, default: 0 }
  },

  // ===== HOUSE PROPERTY =====
  housePropertyIncome: { type: Number, default: 0 },
  housePropertyDetails: {
    propertyType: { type: String, enum: ['self-occupied', 'let-out', 'deemed-let-out'] },
    annualValue: { type: Number, default: 0 },
    municipalTaxesPaid: { type: Number, default: 0 },
    interestOnHomeLoan: { type: Number, default: 0 },
    interestOnHomeLoanSelf: { type: Number, default: 0 },
    interestOnHomeLoanLetOut: { type: Number, default: 0 },
    standardDeductionHP: { type: Number, default: 0 }
  },

  // ===== BUSINESS/PROFESSION =====
  businessIncome: { type: Number, default: 0 },
  professionIncome: { type: Number, default: 0 },
  businessDetails: {
    businessCode: { type: String },
    presumptiveBusinessIncome: { type: Number, default: 0 },
    professionIncome: { type: Number, default: 0 },
    totalTurnover: { type: Number, default: 0 },
    grossReceipts: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    depreciation: { type: Number, default: 0 }
  },

  // ===== CAPITAL GAINS =====
  capitalGains: { type: Number, default: 0 },
  capitalGainsDetails: {
    shortTermGainsShares: { type: Number, default: 0 },
    longTermGainsShares: { type: Number, default: 0 },
    shortTermGainsProperty: { type: Number, default: 0 },
    longTermGainsProperty: { type: Number, default: 0 },
    otherShortTermGains: { type: Number, default: 0 },
    otherLongTermGains: { type: Number, default: 0 },
    sttPaid: { type: Number, default: 0 }
  },

  // ===== OTHER INCOME =====
  otherIncome: { type: Number, default: 0 },
  otherIncomeDetails: {
    interestFromBanks: { type: Number, default: 0 },
    interestFromPostOffice: { type: Number, default: 0 },
    interestFromITR: { type: Number, default: 0 },
    dividendIncome: { type: Number, default: 0 },
    rentalIncome: { type: Number, default: 0 },
    familyPension: { type: Number, default: 0 },
    agriculturalIncome: { type: Number, default: 0 },
    otherSources: { type: Number, default: 0 }
  },

  // ===== DEDUCTIONS (Chapter VI-A) =====
  deductions: {
    // Section 80C
    u80C: { type: Number, default: 0 },
    // Section 80CCC
    u80CCC: { type: Number, default: 0 },
    // Section 80CCD(1)
    u80CCD1: { type: Number, default: 0 },
    // Section 80CCD(1B)
    u80CCD1B: { type: Number, default: 0 },
    // Section 80CCD(2)
    u80CCD2: { type: Number, default: 0 },
    // Section 80D
    u80D: { type: Number, default: 0 },
    u80DD: { type: Number, default: 0 }, // Disabled dependent
    u80DDB: { type: Number, default: 0 }, // Medical treatment
    // Section 80E
    u80E: { type: Number, default: 0 }, // Education loan
    // Section 80EE
    u80EE: { type: Number, default: 0 }, // First home loan interest
    // Section 80EEA
    u80EEA: { type: Number, default: 0 }, // Affordable housing interest
    // Section 80EEB
    u80EEB: { type: Number, default: 0 }, // Electric vehicle loan
    // Section 80G
    u80G: { type: Number, default: 0 },
    u80GGA: { type: Number, default: 0 }, // Scientific research
    u80GGC: { type: Number, default: 0 }, // Political party
    // Section 80RRB
    u80RRB: { type: Number, default: 0 }, // Royalty
    // Section 80TTA
    u80TTA: { type: Number, default: 0 }, // Savings interest
    // Section 80TTB
    u80TTB: { type: Number, default: 0 }, // Senior citizens savings
    // Section 24(b) - Home loan interest
    u24b: { type: Number, default: 0 },
    // HRA exemption (computed separately)
    hraExemption: { type: Number, default: 0 },
    // Standard deduction
    standardDeduction: { type: Number, default: 0 }
  },

  // Computed totals
  grossTotalIncome: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  taxableIncome: { type: Number, default: 0 },

  // Tax computation
  taxComputation: {
    taxOnIncome: { type: Number, default: 0 },
    rebate87A: { type: Number, default: 0 }, // Section 87A rebate
    taxAfterRebate: { type: Number, default: 0 },
    surcharge: { type: Number, default: 0 },
    healthEducationCess: { type: Number, default: 0 },
    totalTaxLiability: { type: Number, default: 0 },
    // Old regime specific
    taxOnOldRegime: { type: Number, default: 0 },
    // New regime specific
    taxOnNewRegime: { type: Number, default: 0 }
  },

  // TDS & Payments
  tdsDetails: {
    tdsOnSalary: { type: Number, default: 0 },
    tdsOnOther: { type: Number, default: 0 },
    tdsOnDividend: { type: Number, default: 0 },
    tdsOnInterest: { type: Number, default: 0 },
    totalTDS: { type: Number, default: 0 }
  },
  advanceTaxPaid: { type: Number, default: 0 },
  selfAssessmentTax: { type: Number, default: 0 },
  totalTaxPaid: { type: Number, default: 0 },

  // Tax payable/refund
  taxLiability: { type: Number, default: 0 },
  taxPayable: { type: Number, default: 0 },
  refundAmount: { type: Number, default: 0 },

  // Filing info
  ackNumber: { type: String },
  filedOn: { type: Date },
  dueDate: { type: Date },
  verificationDate: { type: Date },
  remarks: { type: String },

  // Bank details for refund
  bankDetails: {
    accountNumber: { type: String },
    bankName: { type: String },
    ifscCode: { type: String }
  },

  // Form 16 data
  form16Data: {
    issued: { type: Boolean, default: false },
    issuedOn: { type: Date },
    certificateNumber: { type: String }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ITRFilingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ITRFiling', ITRFilingSchema);
