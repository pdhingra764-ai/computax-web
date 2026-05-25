const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const ITRFiling = require('../models/ITRFiling');
const GSTFiling = require('../models/GSTFiling');
const auth = require('../middleware/auth');

// Import Clients
router.post('/clients', auth, async (req, res) => {
  const { records } = req.body;
  if (!records?.length) return res.status(400).json({ message: 'No records provided' });

  let imported = 0, skipped = 0, errors = 0;
  for (const rec of records) {
    try {
      // Skip if PAN already exists for this user
      if (rec.pan) {
        const existing = await Client.findOne({ user: req.user.id, pan: rec.pan.toUpperCase() });
        if (existing) { skipped++; continue; }
      }
      await Client.create({ ...rec, user: req.user.id });
      imported++;
    } catch { errors++; }
  }
  res.json({ imported, skipped, errors, total: records.length });
});

// Import ITR Filings
router.post('/itr', auth, async (req, res) => {
  const { records } = req.body;
  if (!records?.length) return res.status(400).json({ message: 'No records provided' });

  let imported = 0, skipped = 0, errors = 0;
  for (const rec of records) {
    try {
      // Find client by PAN if provided
      let clientId = rec.client;
      if (!clientId && rec.clientPAN) {
        const client = await Client.findOne({ user: req.user.id, pan: rec.clientPAN.toUpperCase() });
        if (!client) { skipped++; continue; }
        clientId = client._id;
      }
      if (!clientId) { skipped++; continue; }

      const data = { ...rec, client: clientId, user: req.user.id };
      delete data.clientPAN;

      // Compute totals
      data.grossTotalIncome = (data.salaryIncome||0)+(data.housePropertyIncome||0)+(data.businessIncome||0)+(data.capitalGains||0)+(data.otherIncome||0);
      data.totalDeductions = (data.deductionU80C||0)+(data.deductionU80D||0)+(data.deductionU80G||0)+(data.otherDeductions||0);
      data.taxableIncome = Math.max(0, data.grossTotalIncome - data.totalDeductions);

      await ITRFiling.create(data);
      imported++;
    } catch { errors++; }
  }
  res.json({ imported, skipped, errors, total: records.length });
});

// Import GST Filings
router.post('/gst', auth, async (req, res) => {
  const { records } = req.body;
  if (!records?.length) return res.status(400).json({ message: 'No records provided' });

  let imported = 0, skipped = 0, errors = 0;
  for (const rec of records) {
    try {
      let clientId = rec.client;
      if (!clientId && rec.clientGSTIN) {
        const client = await Client.findOne({ user: req.user.id, gstin: rec.clientGSTIN.toUpperCase() });
        if (!client) { skipped++; continue; }
        clientId = client._id;
      }
      if (!clientId) { skipped++; continue; }

      const data = { ...rec, client: clientId, user: req.user.id };
      delete data.clientGSTIN;

      data.totalITC = (data.itcCgst||0)+(data.itcSgst||0)+(data.itcIgst||0);
      data.cgstPayable = Math.max(0,(data.cgstOnSales||0)-(data.itcCgst||0));
      data.sgstPayable = Math.max(0,(data.sgstOnSales||0)-(data.itcSgst||0));
      data.igstPayable = Math.max(0,(data.igstOnSales||0)-(data.itcIgst||0));
      data.totalTaxPayable = data.cgstPayable+data.sgstPayable+data.igstPayable+(data.lateFee||0)+(data.interest||0);

      await GSTFiling.create(data);
      imported++;
    } catch { errors++; }
  }
  res.json({ imported, skipped, errors, total: records.length });
});

module.exports = router;
