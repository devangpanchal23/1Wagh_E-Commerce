const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  subject: { type: String, default: 'General Inquiry' },
  message: { type: String, required: true },
  status: { type: String, enum: ['New', 'Read', 'Replied'], default: 'New' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Contact', contactSchema);
