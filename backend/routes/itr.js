const express = require('express');
const router = express.Router();
const ITRFiling = require('../models/ITRFiling');
const auth = require('../middleware/auth');

// GET all ITR filings
router.get('/', auth, async (req, res) => {
  try {
    const filings = await ITRFiling.find({ user: req.user.id })
      .populate('client', 'name pan email phone address')
      .sort({ createdAt: -1 });
    res.json(filings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single ITR filing
router.get('/:id', auth, async (req, res) => {
  try {
    const filing = await ITRFiling.findOne({ _id: req.params.id, user: req.user.id })
      .populate('client', 'name pan email phone address');
    if (!filing) return res.status(404).json({ message: 'Filing not found' });
    res.json(filing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create ITR filing
router.post('/', auth, async (req, res) => {
  try {
    const data = computeTax(req.body, req.user.id);
    const filing = new ITRFiling(data);
    await filing.save();
    const populated = await filing.populate('client', 'name pan email phone address');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update ITR filing
router.put('/:id', auth, async (req, res) => {
  try {
    const data = computeTax(req.body, req.user.id);
    const filing = await ITRFiling.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      data,
      { new: true }
    ).populate('client', 'name pan email phone address');
    if (!filing) return res.status(404).json({ message: 'Filing not found' });
    res.json(filing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE filing
router.delete('/:id', auth, async (req, res) => {
  try {
    const filing = await ITRFiling.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!filing) return res.status(404).json({ message: 'Filing not found' });
    res.json({ message: 'Filing deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Calculate Tax (without saving)
router.post('/calculate', auth, async (req, res) => {
  try {
    const data = computeTax(req.body, req.user.id);
    res.json({
      grossTotalIncome: data.grossTotalIncome,
      totalDeductions: data.totalDeductions,
      taxableIncome: data.taxableIncome,
      taxComputation: data.taxComputation,
      taxPayable: data.taxPayable,
      refundAmount: data.refundAmount,
      comparison: data.comparison
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Comprehensive tax computation function
function computeTax(body, userId) {
  const data = { ...body, user: userId };
  
  // Get income values
  const salaryIncome = parseFloat(data.salaryIncome) || 0;
  const housePropertyIncome = parseFloat(data.housePropertyIncome) || 0;
  const businessIncome = parseFloat(data.businessIncome) || 0;
  const capitalGains = parseFloat(data.capitalGains) || 0;
  const otherIncome = parseFloat(data.otherIncome) || 0;

  // Calculate gross total income
  data.grossTotalIncome = salaryIncome + housePropertyIncome + businessIncome + capitalGains + otherIncome;

  // Calculate HRA exemption if applicable
  if (data.salaryDetails) {
    data.salaryDetails.hraExemption = calculateHRAExemption(data.salaryDetails);
    data.deductions.hraExemption = data.salaryDetails.hraExemption;
  }

  // Calculate total deductions based on regime
  data.totalDeductions = calculateTotalDeductions(data);

  // Calculate taxable income
  data.taxableIncome = Math.max(0, data.grossTotalIncome - data.totalDeductions);

  // Calculate tax for both regimes
  const oldRegimeTax = calculateOldRegimeTax(data.taxableIncome, data.grossTotalIncome);
  const newRegimeTax = calculateNewRegimeTax(data.taxableIncome);
  
  // Store both regime calculations
  data.taxComputation = {
    taxOnOldRegime: oldRegimeTax.taxOnIncome,
    surchargeOld: oldRegimeTax.surcharge,
    cessOld: oldRegimeTax.cess,
    totalTaxOldRegime: oldRegimeTax.totalTax,
    taxOnNewRegime: newRegimeTax.taxOnIncome,
    surchargeNew: newRegimeTax.surcharge,
    cessNew: newRegimeTax.cess,
    totalTaxNewRegime: newRegimeTax.totalTax,
    recommendedRegime: newRegimeTax.totalTax <= oldRegimeTax.totalTax ? 'new' : 'old'
  };

  // Use selected regime for final calculation
  if (data.taxRegime === 'old') {
    data.taxComputation.taxOnIncome = oldRegimeTax.taxOnIncome;
    data.taxComputation.surcharge = oldRegimeTax.surcharge;
    data.taxComputation.healthEducationCess = oldRegimeTax.cess;
    data.taxComputation.totalTaxLiability = oldRegimeTax.totalTax;
  } else {
    data.taxComputation.taxOnIncome = newRegimeTax.taxOnIncome;
    data.taxComputation.surcharge = newRegimeTax.surcharge;
    data.taxComputation.healthEducationCess = newRegimeTax.cess;
    data.taxComputation.totalTaxLiability = newRegimeTax.totalTax;
  }

  // Apply rebate 87A
  if (data.taxComputation.totalTaxLiability <= 700000 && data.taxableIncome <= 700000) {
    data.taxComputation.rebate87A = data.taxComputation.totalTaxLiability;
    data.taxComputation.totalTaxLiability = 0;
  } else {
    data.taxComputation.rebate87A = 0;
  }

  // Calculate TDS total
  const tdsDetails = data.tdsDetails || {};
  tdsDetails.totalTDS = (tdsDetails.tdsOnSalary || 0) + (tdsDetails.tdsOnOther || 0) + 
                        (tdsDetails.tdsOnDividend || 0) + (tdsDetails.tdsOnInterest || 0);
  data.tdsDetails = tdsDetails;

  // Total tax paid
  data.totalTaxPaid = tdsDetails.totalTDS + (parseFloat(data.advanceTaxPaid) || 0) + 
                      (parseFloat(data.selfAssessmentTax) || 0);

  // Tax payable or refund
  data.taxLiability = data.taxComputation.totalTaxLiability;
  data.taxPayable = Math.max(0, data.taxLiability - data.totalTaxPaid);
  data.refundAmount = Math.max(0, data.totalTaxPaid - data.taxLiability);

  // Comparison for recommendation
  data.comparison = {
    oldRegimeTax: oldRegimeTax.totalTax,
    newRegimeTax: newRegimeTax.totalTax,
    savingsInNewRegime: oldRegimeTax.totalTax - newRegimeTax.totalTax,
    recommendedRegime: newRegimeTax.totalTax <= oldRegimeTax.totalTax ? 'new' : 'old'
  };

  return data;
}

// Calculate HRA exemption
function calculateHRAExemption(salaryDetails) {
  if (!salaryDetails.hraReceived || salaryDetails.hraReceived === 0) return 0;
  
  const hraReceived = salaryDetails.hraReceived;
  const rentPaid = salaryDetails.hraRentPaid || 0;
  const basicSalary = salaryDetails.grossSalary * 0.4 || 0; // Approximate
  
  // Minimum of three:
  // 1. HRA received
  // 2. Rent paid - 10% of salary
  // 3. 50% of salary (metro) or 40% (non-metro)
  const excessRent = Math.max(0, rentPaid - (basicSalary * 0.1));
  const salaryPercent = salaryDetails.hraMetroCity ? 0.5 : 0.4;
  
  const exemption1 = hraReceived;
  const exemption2 = excessRent;
  const exemption3 = basicSalary * salaryPercent;
  
  return Math.min(exemption1, exemption2, exemption3);
}

// Calculate total deductions based on tax regime
function calculateTotalDeductions(data) {
  const deductions = data.deductions || {};
  
  if (data.taxRegime === 'new') {
    // New Regime: Limited deductions
    // Standard deduction of 75,000 (FY 2024-25)
    let total = parseFloat(deductions.standardDeduction) || 75000;
    
    // Add employer NPS 80CCD(2)
    total += Math.min(parseFloat(deductions.u80CCD2) || 0, 750000);
    
    // Add 80CCD(1B) - NPS additional
    total += Math.min(parseFloat(deductions.u80CCD1B) || 0, 50000);
    
    // Add HRA exemption
    total += parseFloat(deductions.hraExemption) || 0;
    
    return total;
  } else {
    // Old Regime: Full deductions (Chapter VI-A)
    let total = 0;
    
    // Section 80C (max 1.5L)
    total += Math.min(parseFloat(deductions.u80C) || 0, 150000);
    
    // Section 80CCC
    total += Math.min(parseFloat(deductions.u80CCC) || 0, 150000);
    
    // Section 80CCD(1) - NPS self (max 10% of salary, within 80C limit)
    total += Math.min(parseFloat(deductions.u80CCD1) || 0, 150000 - total > 0 ? 150000 - total : 0);
    
    // Section 80CCD(1B) - Extra NPS (max 50k)
    total += Math.min(parseFloat(deductions.u80CCD1B) || 0, 50000);
    
    // Section 80CCD(2) - Employer NPS (max 10% of salary)
    total += Math.min(parseFloat(deductions.u80CCD2) || 0, 150000);
    
    // Section 80D - Health Insurance
    let u80d = parseFloat(deductions.u80D) || 0;
    // Self/Spouse/Child: 25k (50k for senior citizen)
    // Parents: Additional 25k (50k for senior citizen)
    total += Math.min(u80d, 100000);
    
    // Section 80DD - Disabled dependent
    total += parseFloat(deductions.u80DD) || 0;
    
    // Section 80DDB - Medical treatment
    total += Math.min(parseFloat(deductions.u80DDB) || 0, 100000);
    
    // Section 80E - Education loan interest (no limit)
    total += parseFloat(deductions.u80E) || 0;
    
    // Section 80EE - First home loan interest (max 50k)
    total += Math.min(parseFloat(deductions.u80EE) || 0, 50000);
    
    // Section 80EEA - Affordable housing interest (max 1.5L)
    total += Math.min(parseFloat(deductions.u80EEA) || 0, 150000);
    
    // Section 80EEB - EV loan (max 1.5L)
    total += Math.min(parseFloat(deductions.u80EEB) || 0, 150000);
    
    // Section 80G - Donations
    total += parseFloat(deductions.u80G) || 0;
    
    // Section 80GGA - Scientific research
    total += parseFloat(deductions.u80GGA) || 0;
    
    // Section 80GGC - Political party
    total += parseFloat(deductions.u80GGC) || 0;
    
    // Section 80RRB - Royalty
    total += Math.min(parseFloat(deductions.u80RRB) || 0, 300000);
    
    // Section 80TTA - Savings interest (max 10k)
    total += Math.min(parseFloat(deductions.u80TTA) || 0, 10000);
    
    // Section 80TTB - Senior citizen savings (max 50k)
    total += Math.min(parseFloat(deductions.u80TTB) || 0, 50000);
    
    // Section 24(b) - Home loan interest (max 2L for self-occupied)
    total += Math.min(parseFloat(deductions.u24b) || 0, 200000);
    
    // Add HRA exemption
    total += parseFloat(deductions.hraExemption) || 0;
    
    // Add standard deduction
    total += parseFloat(deductions.standardDeduction) || 0;
    
    return total;
  }
}

// New Regime Tax Calculation FY 2024-25
function calculateNewRegimeTax(income) {
  let tax = 0;
  
  // Rebate 87A: Full tax rebate if income <= 7L
  if (income <= 700000) {
    return { taxOnIncome: 0, surcharge: 0, cess: 0, totalTax: 0 };
  }
  
  // New tax slabs
  if (income > 2000000) {
    tax += (income - 2000000) * 0.30;
    tax += (2000000 - 1500000) * 0.25;
    tax += (1500000 - 1200000) * 0.20;
    tax += (1200000 - 900000) * 0.15;
    tax += (900000 - 600000) * 0.10;
    tax += (600000 - 300000) * 0.05;
  } else if (income > 1500000) {
    tax += (income - 1500000) * 0.25;
    tax += (1500000 - 1200000) * 0.20;
    tax += (1200000 - 900000) * 0.15;
    tax += (900000 - 600000) * 0.10;
    tax += (600000 - 300000) * 0.05;
  } else if (income > 1200000) {
    tax += (income - 1200000) * 0.20;
    tax += (1200000 - 900000) * 0.15;
    tax += (900000 - 600000) * 0.10;
    tax += (600000 - 300000) * 0.05;
  } else if (income > 900000) {
    tax += (income - 900000) * 0.15;
    tax += (900000 - 600000) * 0.10;
    tax += (600000 - 300000) * 0.05;
  } else if (income > 600000) {
    tax += (income - 600000) * 0.10;
    tax += (600000 - 300000) * 0.05;
  } else if (income > 300000) {
    tax += (income - 300000) * 0.05;
  }
  
  // Calculate surcharge
  let surcharge = 0;
  if (income > 50000000) surcharge = tax * 0.25;
  else if (income > 20000000) surcharge = tax * 0.15;
  else if (income > 10000000) surcharge = tax * 0.10;
  
  // Health & Education Cess
  const cess = Math.round((tax + surcharge) * 0.04);
  
  return {
    taxOnIncome: Math.round(tax),
    surcharge: Math.round(surcharge),
    cess: cess,
    totalTax: Math.round(tax + surcharge + cess)
  };
}

// Old Regime Tax Calculation FY 2024-25
function calculateOldRegimeTax(taxableIncome, grossTotalIncome) {
  let tax = 0;
  
  // Rebate 87A: Full tax rebate if income <= 5L
  if (taxableIncome <= 500000) {
    return { taxOnIncome: 0, surcharge: 0, cess: 0, totalTax: 0 };
  }
  
  // Old tax slabs
  if (taxableIncome > 10000000) {
    tax += (taxableIncome - 10000000) * 0.30;
    tax += (10000000 - 5000000) * 0.20;
    tax += (5000000 - 2500000) * 0.20;
    tax += (2500000 - 1500000) * 0.20;
    tax += (1500000 - 1200000) * 0.20;
    tax += (1200000 - 900000) * 0.20;
    tax += (900000 - 600000) * 0.20;
    tax += (600000 - 300000) * 0.05;
  } else if (taxableIncome > 5000000) {
    tax += (taxableIncome - 5000000) * 0.20;
    tax += (5000000 - 2500000) * 0.20;
    tax += (2500000 - 1500000) * 0.20;
    tax += (1500000 - 1200000) * 0.20;
    tax += (1200000 - 900000) * 0.20;
    tax += (900000 - 600000) * 0.20;
    tax += (600000 - 300000) * 0.05;
  } else if (taxableIncome > 2500000) {
    tax += (taxableIncome - 2500000) * 0.20;
    tax += (2500000 - 1500000) * 0.20;
    tax += (1500000 - 1200000) * 0.20;
    tax += (1200000 - 900000) * 0.20;
    tax += (900000 - 600000) * 0.20;
    tax += (600000 - 300000) * 0.05;
  } else if (taxableIncome > 1500000) {
    tax += (taxableIncome - 1500000) * 0.20;
    tax += (1500000 - 1200000) * 0.20;
    tax += (1200000 - 900000) * 0.20;
    tax += (900000 - 600000) * 0.20;
    tax += (600000 - 300000) * 0.05;
  } else if (taxableIncome > 1200000) {
    tax += (taxableIncome - 1200000) * 0.20;
    tax += (1200000 - 900000) * 0.20;
    tax += (900000 - 600000) * 0.20;
    tax += (600000 - 300000) * 0.05;
  } else if (taxableIncome > 900000) {
    tax += (taxableIncome - 900000) * 0.20;
    tax += (900000 - 600000) * 0.20;
    tax += (600000 - 300000) * 0.05;
  } else if (taxableIncome > 600000) {
    tax += (taxableIncome - 600000) * 0.20;
    tax += (600000 - 300000) * 0.05;
  } else if (taxableIncome > 300000) {
    tax += (taxableIncome - 300000) * 0.05;
  }
  
  // Calculate surcharge
  let surcharge = 0;
  if (taxableIncome > 50000000) surcharge = tax * 0.37;
  else if (taxableIncome > 20000000) surcharge = tax * 0.25;
  else if (taxableIncome > 10000000) surcharge = tax * 0.15;
  else if (taxableIncome > 5000000) surcharge = tax * 0.10;
  
  // Health & Education Cess
  const cess = Math.round((tax + surcharge) * 0.04);
  
  return {
    taxOnIncome: Math.round(tax),
    surcharge: Math.round(surcharge),
    cess: cess,
    totalTax: Math.round(tax + surcharge + cess)
  };
}

module.exports = router;
