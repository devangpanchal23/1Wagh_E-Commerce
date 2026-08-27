const mockCategories = [
  {
    _id: '65a000000000000000000001',
    name: 'Chargers & Adapters',
    slug: 'chargers-adapters',
    description: 'Super fast GaN chargers, PD adapters, and dual-port power bricks built for extreme speed.',
    icon: 'Zap'
  },
  {
    _id: '65a000000000000000000002',
    name: 'Power Banks',
    slug: 'power-banks',
    description: 'High-capacity, fast-charging portable power banks and MagSafe wireless battery packs.',
    icon: 'BatteryCharging'
  },
  {
    _id: '65a000000000000000000003',
    name: 'Cables & Connectors',
    slug: 'cables-connectors',
    description: 'Heavy-duty braided Type-C, Lightning, and 100W PD fast charging cables.',
    icon: 'Cable'
  },
  {
    _id: '65a000000000000000000004',
    name: 'Audio & Wireless',
    slug: 'audio-wireless',
    description: 'TWS earbuds with ANC, Bluetooth neckbands, and premium acoustic accessories.',
    icon: 'Headphones'
  }
];

const mockUsers = [
  {
    _id: '65b000000000000000000001',
    name: 'WAGH Admin',
    email: 'admin@wagh.com',
    role: 'admin',
    addresses: [{ street: 'WAGH HQ, Tech Park', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015', phone: '+91 90544 05305', isDefault: true }]
  },
  {
    _id: '65b000000000000000000002',
    name: 'Devang Panchal',
    email: 'devang@example.com',
    role: 'customer',
    addresses: [{ street: '42 Speed Avenue', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '+91 98765 43210', isDefault: true }]
  }
];

// Empty Mock Products List - Ready for manual or AI product additions
const mockProducts = [];

const mockOrders = [];

const mockCarts = {};

const isDbDisconnected = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState !== 1;
};

module.exports = {
  mockCategories,
  mockUsers,
  mockProducts,
  mockOrders,
  mockCarts,
  isDbDisconnected
};
