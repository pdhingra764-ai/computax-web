const express = require('express');
const router = express.Router();
const ITRFiling = require('../models/ITRFiling');
const auth = require('../middleware/auth');

// GET all ITR filings
router.get('/', auth, async (req, res) => {
  try {
    const filings = await ITRFiling.find({ user: req.user.id })
      .populate('client', 'name pan email')
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
      .populate('client', 'name pan email phone');
    if (!filing) return res.status(404).json({ message: 'Filing not found' });
    res.json(filing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create ITR filing
router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body, user: req.user.id };

    // Auto compute totals
    data.grossTotalIncome =
      (data.salaryIncome || 0) +
      (data.housePropertyIncome || 0) +
      (data.businessIncome || 0) +
      (data.capitalGains || 0) +
      (data.otherIncome || 0);

    data.totalDeductions =
      (data.deductionU80C || 0) +
      (data.deductionU80D || 0) +
      (data.deductionU80G || 0) +
      (data.otherDeductions || 0);

    data.taxableIncome = Math.max(0, data.grossTotalIncome - data.totalDeductions);

    // Basic tax slab (New Regime FY 2024-25)
    data.taxLiability = computeNewRegimeTax(data.taxableIncome);
    data.taxPayable = Math.max(0, data.taxLiability - (data.tdsCredited || 0) - (data.advanceTaxPaid || 0));
    data.refundAmount = Math.max(0, (data.tdsCredited || 0) + (data.advanceTaxPaid || 0) - data.taxLiability);

    const filing = new ITRFiling(data);
    await filing.save();
    const populated = await filing.populate('client', 'name pan email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update ITR filing
router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    data.grossTotalIncome =
      (data.salaryIncome || 0) + (data.housePropertyIncome || 0) +
      (data.businessIncome || 0) + (data.capitalGains || 0) + (data.otherIncome || 0);
    data.totalDeductions =
      (data.deductionU80C || 0) + (data.deductionU80D || 0) +
      (data.deductionU80G || 0) + (data.otherDeductions || 0);
    data.taxableIncome = Math.max(0, data.grossTotalIncome - data.totalDeductions);
    data.taxLiability = computeNewRegimeTax(data.taxableIncome);
    data.taxPayable = Math.max(0, data.taxLiability - (data.tdsCredited || 0) - (data.advanceTaxPaid || 0));
    data.refundAmount = Math.max(0, (data.tdsCredited || 0) + (data.advanceTaxPaid || 0) - data.taxLiability);

    const filing = await ITRFiling.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      data,
      { new: true }
    ).populate('client', 'name pan email');
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

// Tax computation helper - New Regime FY 2024-25
function computeNewRegimeTax(income) {
  if (income <= 300000) return 0;
  let tax = 0;
  if (income > 1500000) tax += (income - 1500000) * 0.30;
  if (income > 1200000) tax += (Math.min(income, 1500000) - 1200000) * 0.20;
  if (income > 900000) tax += (Math.min(income, 1200000) - 900000) * 0.15;
  if (income > 600000) tax += (Math.min(income, 900000) - 600000) * 0.10;
  if (income > 300000) tax += (Math.min(income, 600000) - 300000) * 0.05;
  const cess = tax * 0.04;
  return Math.round(tax + cess);
}

module.exports = router;
