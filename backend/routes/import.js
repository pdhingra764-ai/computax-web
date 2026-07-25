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

// Chrome Extension Import - Capture from Income Tax Portal
router.post('/capture', auth, async (req, res) => {
  try {
    const data = req.body;
    
    let clientId = null;
    
    // Try to find or create client based on PAN
    if (data.panData?.pan) {
      let client = await Client.findOne({ 
        user: req.user.id, 
        pan: data.panData.pan.toUpperCase() 
      });
      
      if (!client) {
        // Create new client
        client = new Client({
          user: req.user.id,
          name: data.panData.name || 'Auto Imported',
          pan: data.panData.pan.toUpperCase(),
          email: data.panData.email || '',
          phone: data.panData.phone || '',
          clientType: 'individual',
          status: 'active'
        });
        await client.save();
      }
      clientId = client._id;
    }

    // Create ITR filing with captured data
    const itrData = {
      user: req.user.id,
      client: clientId,
      assessmentYear: '2024-25',
      itrType: 'ITR-1',
      status: 'draft',
      taxRegime: 'new',
      // Salary from captured data
      salaryIncome: data.salaryData?.grossSalary || data.itrPrefill?.salaryIncome || 0,
      salaryDetails: {
        grossSalary: data.salaryData?.grossSalary || 0,
        nameOfEmployer: data.salaryData?.employerName || data.tdsData?.employerName || '',
        exemptAllowances: 0,
        hraReceived: 0
      },
      // Other income
      housePropertyIncome: data.itrPrefill?.housePropertyIncome || 0,
      businessIncome: data.itrPrefill?.businessIncome || 0,
      otherIncome: data.itrPrefill?.otherIncome || 0,
      capitalGains: 0,
      // Deductions
      deductions: {
        u80C: data.salaryData?.section80C || 0,
        u80D: data.salaryData?.section80D || 0,
        u80G: 0,
        u80TTA: 0,
        standardDeduction: 75000
      },
      // TDS from Form 26AS
      tdsDetails: {
        tdsOnSalary: data.tdsData?.totalTDS || data.form26AS?.totalTDS || 0,
        tdsOnOther: 0,
        totalTDS: data.form26AS?.totalTDS || data.tdsData?.totalTDS || 0
      },
      // Save raw captured data for reference
      importedData: data,
      remarks: `Data imported from Income Tax Portal via Chrome Extension on ${new Date().toLocaleDateString()}`
    };

    // Calculate totals
    itrData.grossTotalIncome = itrData.salaryIncome + itrData.housePropertyIncome + 
                               itrData.businessIncome + itrData.capitalGains + itrData.otherIncome;
    itrData.totalDeductions = (itrData.deductions.u80C || 0) + (itrData.deductions.u80D || 0) + 
                             (itrData.deductions.u80G || 0) + (itrData.deductions.u80TTA || 0) + 75000;
    itrData.taxableIncome = Math.max(0, itrData.grossTotalIncome - itrData.totalDeductions);

    const filing = new ITRFiling(itrData);
    await filing.save();
    
    const populated = await filing.populate('client', 'name pan email');
    
    res.status(201).json({
      success: true,
      message: 'ITR created from imported data',
      filing: populated,
      client: populated.client
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: err.message });
  }
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
