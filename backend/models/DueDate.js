const mongoose = require('mongoose');

const DueDateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: ['ITR','GST','TDS','Audit','Other'], default: 'ITR' },
  dueDate: { type: Date, required: true },
  description: { type: String },
  clientName: { type: String },
  priority: { type: String, enum: ['high','medium','low'], default: 'medium' },
  status: { type: String, enum: ['pending','completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DueDate', DueDateSchema);
