const express = require('express');
const router = express.Router();
const GSTFiling = require('../models/GSTFiling');
const auth = require('../middleware/auth');

// GET all GST filings
router.get('/', auth, async (req, res) => {
  try {
    const filings = await GSTFiling.find({ user: req.user.id })
      .populate('client', 'name gstin email')
      .sort({ createdAt: -1 });
    res.json(filings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single GST filing
router.get('/:id', auth, async (req, res) => {
  try {
    const filing = await GSTFiling.findOne({ _id: req.params.id, user: req.user.id })
      .populate('client', 'name gstin email phone');
    if (!filing) return res.status(404).json({ message: 'Filing not found' });
    res.json(filing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create GST filing
router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body, user: req.user.id };

    // Auto compute totals
    data.totalITC = (data.itcCgst || 0) + (data.itcSgst || 0) + (data.itcIgst || 0);
    data.cgstPayable = Math.max(0, (data.cgstOnSales || 0) - (data.itcCgst || 0));
    data.sgstPayable = Math.max(0, (data.sgstOnSales || 0) - (data.itcSgst || 0));
    data.igstPayable = Math.max(0, (data.igstOnSales || 0) - (data.itcIgst || 0));
    data.totalTaxPayable = data.cgstPayable + data.sgstPayable + data.igstPayable +
      (data.lateFee || 0) + (data.interest || 0);

    const filing = new GSTFiling(data);
    await filing.save();
    const populated = await filing.populate('client', 'name gstin email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update GST filing
router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    data.totalITC = (data.itcCgst || 0) + (data.itcSgst || 0) + (data.itcIgst || 0);
    data.cgstPayable = Math.max(0, (data.cgstOnSales || 0) - (data.itcCgst || 0));
    data.sgstPayable = Math.max(0, (data.sgstOnSales || 0) - (data.itcSgst || 0));
    data.igstPayable = Math.max(0, (data.igstOnSales || 0) - (data.itcIgst || 0));
    data.totalTaxPayable = data.cgstPayable + data.sgstPayable + data.igstPayable +
      (data.lateFee || 0) + (data.interest || 0);

    const filing = await GSTFiling.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      data,
      { new: true }
    ).populate('client', 'name gstin email');
    if (!filing) return res.status(404).json({ message: 'Filing not found' });
    res.json(filing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    const filing = await GSTFiling.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!filing) return res.status(404).json({ message: 'Filing not found' });
    res.json({ message: 'Filing deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
