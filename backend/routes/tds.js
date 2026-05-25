const express = require('express');
const router = express.Router();
const TDSFiling = require('../models/TDSFiling');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filings = await TDSFiling.find({ user: req.user.id }).populate('client','name pan').sort({ createdAt: -1 });
    res.json(filings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const filing = await TDSFiling.findOne({ _id: req.params.id, user: req.user.id }).populate('client','name pan');
    if (!filing) return res.status(404).json({ message: 'Not found' });
    res.json(filing);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const filing = new TDSFiling({ ...req.body, user: req.user.id });
    await filing.save();
    const populated = await filing.populate('client','name pan');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const filing = await TDSFiling.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, req.body, { new: true }
    ).populate('client','name pan');
    if (!filing) return res.status(404).json({ message: 'Not found' });
    res.json(filing);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await TDSFiling.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
