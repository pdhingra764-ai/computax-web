const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const auth = require('../middleware/auth');

// GET all clients
router.get('/', auth, async (req, res) => {
  try {
    const clients = await Client.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single client
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, user: req.user.id });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create client
router.post('/', auth, async (req, res) => {
  try {
    const client = new Client({ ...req.body, user: req.user.id });
    await client.save();
    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update client
router.put('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE client
router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
