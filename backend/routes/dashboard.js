const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const ITRFiling = require('../models/ITRFiling');
const GSTFiling = require('../models/GSTFiling');
const auth = require('../middleware/auth');

// GET dashboard stats
router.get('/', auth, async (req, res) => {
  try {
    const uid = req.user.id;

    const [
      totalClients,
      totalITR,
      filedITR,
      pendingITR,
      totalGST,
      filedGST,
      pendingGST,
      recentITR,
      recentGST
    ] = await Promise.all([
      Client.countDocuments({ user: uid }),
      ITRFiling.countDocuments({ user: uid }),
      ITRFiling.countDocuments({ user: uid, status: { $in: ['filed', 'acknowledged'] } }),
      ITRFiling.countDocuments({ user: uid, status: { $in: ['draft', 'prepared'] } }),
      GSTFiling.countDocuments({ user: uid }),
      GSTFiling.countDocuments({ user: uid, status: { $in: ['filed', 'late_filed'] } }),
      GSTFiling.countDocuments({ user: uid, status: { $in: ['draft', 'prepared'] } }),
      ITRFiling.find({ user: uid }).populate('client', 'name pan').sort({ createdAt: -1 }).limit(5),
      GSTFiling.find({ user: uid }).populate('client', 'name gstin').sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      stats: {
        totalClients,
        totalITR, filedITR, pendingITR,
        totalGST, filedGST, pendingGST
      },
      recentITR,
      recentGST
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
