const mongoose = require('mongoose');

const orderCounterSchema = new mongoose.Schema({
  monthYearKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  }, // e.g. "0826"
  lastSequence: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('OrderCounter', orderCounterSchema);
