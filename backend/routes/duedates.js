const express = require('express');
const router = express.Router();
const DueDate = require('../models/DueDate');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const dates = await DueDate.find({ user: req.user.id }).sort({ dueDate: 1 });
    res.json(dates);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const date = new DueDate({ ...req.body, user: req.user.id });
    await date.save();
    res.status(201).json(date);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const date = await DueDate.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, req.body, { new: true }
    );
    if (!date) return res.status(404).json({ message: 'Not found' });
    res.json(date);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await DueDate.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
