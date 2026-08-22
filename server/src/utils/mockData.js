const catChargers = {
  _id: '65a000000000000000000101',
  name: 'Chargers & Adapters',
  slug: 'chargers-adapters',
  description: 'Super fast GaN chargers, PD adapters, and dual-port power bricks built for extreme speed.',
  icon: 'Zap'
};

const catPowerBanks = {
  _id: '65a000000000000000000102',
  name: 'Power Banks',
  slug: 'power-banks',
  description: 'High-capacity, fast-charging portable power banks and MagSafe wireless battery packs.',
  icon: 'BatteryCharging'
};

const catCables = {
  _id: '65a000000000000000000103',
  name: 'Cables & Connectors',
  slug: 'cables-connectors',
  description: 'Heavy-duty braided Type-C, Lightning, and 100W PD fast charging cables.',
  icon: 'Cable'
};

const catAudio = {
  _id: '65a000000000000000000104',
  name: 'Audio & Wireless',
  slug: 'audio-wireless',
  description: 'TWS earbuds with ANC, Bluetooth neckbands, and premium acoustic accessories.',
  icon: 'Headphones'
};

const mockCategories = [catChargers, catPowerBanks, catCables, catAudio];

const mockUsers = [
  {
    _id: '65b000000000000000000001',
    name: 'WAGH Admin',
    email: 'admin@wagh.com',
    password: 'admin123password',
    role: 'admin',
    addresses: [{
      street: 'WAGH HQ, Tech Park, Block B',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
      phone: '+91 90544 05305',
      isDefault: true
    }]
  },
  {
    _id: '65b000000000000000000002',
    name: 'Devang Panchal',
    email: 'devang@example.com',
    password: 'customer123password',
    role: 'customer',
    addresses: [{
      street: '42 Speed Avenue, Sector 4',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 98765 43210',
      isDefault: true
    }]
  }
];

const mockProducts = [
  {
    _id: '65c000000000000000000001',
    name: 'WAGH Super Fast Charger 2.0 45W',
    slug: 'wagh-super-fast-charger-45w',
    description: 'Engineered for maximum power in a sleek, ultra-compact body. Features Super Fast Charging 2.0 protocol (PPS 45W) capable of boosting compatible phones up to 65% charge in just 25 minutes. Built with aerospace-grade thermal dissipation and 10-layer safety protection system.',
    price: 749,
    mrp: 1499,
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80'
    ],
    category: catChargers,
    brand: 'WAGH',
    specs: {
      outputPower: '45W Max PPS / PD 3.0',
      compatibility: 'Universal (Samsung SFC 2.0, iPhone 15/14, iPad, Mac, Pixel)',
      cableLength: '1.2m Braided Type-C Included',
      warranty: '6 Months Replacement Warranty',
      color: 'Premium Deep Teal & Matte Gold',
      material: 'Fireproof PC + Anodized Aluminum Rim'
    },
    stock: 150,
    ratingAvg: 4.9,
    ratingCount: 142,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    createdAt: new Date('2026-07-20T10:00:00Z')
  },
  {
    _id: '65c000000000000000000002',
    name: 'WAGH GaN Power Duo 65W Dual Wall Charger',
    slug: 'wagh-gan-power-duo-65w',
    description: 'Next-generation Gallium Nitride (GaN III) technology allows dual high-speed charging for laptops and smartphones simultaneously. Extremely lightweight design with foldable AC pins.',
    price: 1299,
    mrp: 2499,
    images: [
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
    ],
    category: catChargers,
    brand: 'WAGH',
    specs: {
      outputPower: '65W Total (USB-C 65W + USB-A 18W)',
      compatibility: 'MacBook Air/Pro, iPhone, Android, Steam Deck',
      warranty: '6 Months Warranty',
      color: 'Stealth Black',
      material: 'Gallium Nitride III Semiconductor'
    },
    stock: 80,
    ratingAvg: 4.8,
    ratingCount: 88,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    createdAt: new Date('2026-07-19T10:00:00Z')
  },
  {
    _id: '65c000000000000000000003',
    name: 'WAGH TitanPower 20,000mAh 22.5W Power Bank',
    slug: 'wagh-titanpower-20000mah-power-bank',
    description: 'Monstrous 20,000mAh Li-Polymer battery capacity capable of powering an average smartphone up to 4.5 times. Equipped with real-time LED digital percentage display and triple output ports.',
    price: 1499,
    mrp: 2999,
    images: [
      'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80'
    ],
    category: catPowerBanks,
    brand: 'WAGH',
    specs: {
      outputPower: '22.5W Fast Charge / 20W PD Type-C',
      compatibility: 'Universal USB-A & USB-C Devices',
      warranty: '6 Months Warranty',
      color: 'Deep Teal Metal Finish',
      material: 'Textured Anti-scratch ABS Alloy'
    },
    stock: 110,
    ratingAvg: 4.7,
    ratingCount: 210,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    createdAt: new Date('2026-07-18T10:00:00Z')
  },
  {
    _id: '65c000000000000000000004',
    name: 'WAGH Magnetic MagSafe 10,000mAh Wireless Power Bank',
    slug: 'wagh-magsafe-10000mah-power-bank',
    description: 'Snap & Charge wirelessly with ultra-strong N52 neodymium magnetic lock. Supports 15W wireless fast charging and 20W PD wired pass-through charging with a metallic ring stand.',
    price: 1199,
    mrp: 2299,
    images: [
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
    ],
    category: catPowerBanks,
    brand: 'WAGH',
    specs: {
      outputPower: '15W MagSafe Wireless / 20W Type-C PD',
      compatibility: 'iPhone 12/13/14/15/16 Series & Qi Android',
      warranty: '6 Months Warranty',
      color: 'Titanium Grey & Deep Teal',
      material: 'Soft-Touch Matte Silicone & Aluminum Stand'
    },
    stock: 65,
    ratingAvg: 4.9,
    ratingCount: 76,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: true,
    createdAt: new Date('2026-07-17T10:00:00Z')
  },
  {
    _id: '65c000000000000000000005',
    name: 'WAGH ArmorFlex Braided Type-C to Type-C 100W Cable (1.5m)',
    slug: 'wagh-armorflex-100w-type-c-cable',
    description: 'Indestructible double-braided nylon sleeve tested to withstand 30,000+ bends. Built-in E-Marker smart chip guarantees safe 100W Power Delivery and high-speed 480Mbps data transfer.',
    price: 399,
    mrp: 799,
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80'
    ],
    category: catCables,
    brand: 'WAGH',
    specs: {
      outputPower: '100W 5A Max Power Delivery',
      cableLength: '1.5 Meters (5 Feet)',
      compatibility: 'Type-C Laptops, Tablets, Smartphones',
      warranty: '6 Months Replacement Warranty',
      color: 'Deep Teal Braided Weave',
      material: 'Kevlar Reinforced Nylon Fiber'
    },
    stock: 300,
    ratingAvg: 4.8,
    ratingCount: 310,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    createdAt: new Date('2026-07-16T10:00:00Z')
  },
  {
    _id: '65c000000000000000000006',
    name: 'WAGH MFi Braided Lightning to USB-C Cable (1.2m)',
    slug: 'wagh-lightning-to-usb-c-cable',
    description: 'Apple MFi Certified fast charging cable designed to charge iPhones from 0 to 50% in 30 minutes when paired with a WAGH PD charger. Strain-relief joint architecture prevents fraying.',
    price: 449,
    mrp: 899,
    images: [
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80'
    ],
    category: catCables,
    brand: 'WAGH',
    specs: {
      outputPower: '27W Max iPhone PD Fast Charge',
      cableLength: '1.2 Meters',
      compatibility: 'iPhone 14/13/12/11, iPad, AirPods',
      warranty: '6 Months Warranty',
      color: 'Off-White & Amber Gold Connectors',
      material: 'Braided Nylon + Zinc Alloy Shell'
    },
    stock: 200,
    ratingAvg: 4.9,
    ratingCount: 165,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    createdAt: new Date('2026-07-15T10:00:00Z')
  },
  {
    _id: '65c000000000000000000007',
    name: 'WAGH Acoustic Pro TWS Active Noise Cancelling Earbuds',
    slug: 'wagh-acoustic-pro-tws-earbuds',
    description: 'Immerse yourself in rich, audiophile-grade sound with 32dB Active Noise Cancellation and 10mm Graphene Drivers. Enjoy up to 40 hours of playtime with the wireless charging case and quad MIC clear calls.',
    price: 1799,
    mrp: 3499,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
    ],
    category: catAudio,
    brand: 'WAGH',
    specs: {
      outputPower: '32dB Hybrid ANC + ENC Quad Mic',
      compatibility: 'Bluetooth 5.3 Universal (iOS & Android)',
      batteryLife: '40 Hours Total with Charging Case',
      warranty: '6 Months Replacement Warranty',
      color: 'Teal Green Glass Metallic Case',
      material: 'Ergonomic IPX5 Sweatproof Silicone'
    },
    stock: 95,
    ratingAvg: 4.9,
    ratingCount: 184,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    createdAt: new Date('2026-07-14T10:00:00Z')
  },
  {
    _id: '65c000000000000000000008',
    name: 'WAGH BassWave 30H Wireless Bluetooth Neckband',
    slug: 'wagh-basswave-wireless-neckband',
    description: 'Ultra-flexible silicone neckband with magnetic earbuds and 13mm dynamic titanium drivers for deep, thumping bass. Features ASAP Charge technology (10 min charge = 10 hrs playtime).',
    price: 699,
    mrp: 1499,
    images: [
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80'
    ],
    category: catAudio,
    brand: 'WAGH',
    specs: {
      outputPower: '13mm Titanium Drivers / ENC',
      batteryLife: '30 Hours Playback / ASAP Fast Charge',
      compatibility: 'Bluetooth v5.2 Dual Pairing',
      warranty: '6 Months Warranty',
      color: 'Matte Teal & Midnight Black',
      material: 'Liquid Silicone Neckband'
    },
    stock: 140,
    ratingAvg: 4.6,
    ratingCount: 92,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    createdAt: new Date('2026-07-13T10:00:00Z')
  },
  {
    _id: '65c000000000000000000009',
    name: 'WAGH 3-in-1 Foldable Wireless Charging Station 15W',
    slug: 'wagh-3-in-1-wireless-charging-stand',
    description: 'Declutter your nightstand with a single ultra-sleek charging hub for your iPhone, Apple Watch, and AirPods simultaneously. Folds completely flat for travel.',
    price: 1999,
    mrp: 3999,
    images: [
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80'
    ],
    category: catChargers,
    brand: 'WAGH',
    specs: {
      outputPower: '15W Phone + 5W AirPods + 3W Watch',
      compatibility: 'Qi-enabled phones, Apple Watch, AirPods',
      warranty: '6 Months Warranty',
      color: 'Metallic Teal & Frosted Glass',
      material: 'CNC Aluminum Base + Soft Rubber Pads'
    },
    stock: 50,
    ratingAvg: 4.9,
    ratingCount: 53,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    createdAt: new Date('2026-07-12T10:00:00Z')
  },
  {
    _id: '65c000000000000000000010',
    name: 'WAGH CyberCharge 100W GaN Desktop Super Station',
    slug: 'wagh-cybercharge-100w-gan-station',
    description: 'An ultra-powerful 4-port desktop GaN III charging station with intelligent power distribution and real-time LED wattage display. Powers two laptops simultaneously at high speed.',
    price: 2999,
    mrp: 5999,
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80'
    ],
    category: catChargers,
    brand: 'WAGH',
    specs: {
      outputPower: '100W Max Total (2x USB-C + 2x USB-A)',
      compatibility: 'MacBook Pro, Windows Laptops, iPad, iPhone, Galaxy',
      warranty: '6 Months Replacement Warranty',
      color: 'Cyber Matte Black & Gold',
      material: 'Fireproof ABS + Anodized Alloy Rim'
    },
    stock: 75,
    ratingAvg: 4.9,
    ratingCount: 112,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    createdAt: new Date('2026-07-11T10:00:00Z')
  },
  {
    _id: '65c000000000000000000011',
    name: 'WAGH SonicPro Max Over-Ear Active Noise Cancelling Headphones',
    slug: 'wagh-sonicpro-max-anc-headphones',
    description: 'Audiophile-grade wireless headphones engineered with custom 40mm beryllium-coated drivers and 45dB hybrid adaptive ANC. Enjoy up to 60 hours of uninterrupted playback with spatial acoustic immersion.',
    price: 3499,
    mrp: 6999,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80'
    ],
    category: catAudio,
    brand: 'WAGH',
    specs: {
      outputPower: '40mm Hi-Res Drivers / 45dB Hybrid ANC',
      batteryLife: '60 Hours Playtime (ANC Off) / 45 Hours (ANC On)',
      compatibility: 'Bluetooth 5.3 + 3.5mm Wired Aux',
      warranty: '6 Months Warranty',
      color: 'Midnight Black & Deep Teal Accents',
      material: 'Memory Foam Earcups & Aluminum Headband'
    },
    stock: 60,
    ratingAvg: 4.9,
    ratingCount: 89,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    createdAt: new Date('2026-07-10T10:00:00Z')
  },
  {
    _id: '65c000000000000000000012',
    name: 'WAGH SolarShield 25,000mAh Rugged Outdoor Power Bank',
    slug: 'wagh-solarshield-25000mah-power-bank',
    description: 'Built for extreme adventures, this rugged IP67 water and dust-resistant portable charger features a monocrystalline solar recharging panel, dual LED camping flashlights, and 30W USB-C Power Delivery.',
    price: 2199,
    mrp: 4499,
    images: [
      'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80'
    ],
    category: catPowerBanks,
    brand: 'WAGH',
    specs: {
      outputPower: '30W PD Type-C + 18W QC USB-A',
      compatibility: 'Universal USB-C & USB-A Devices',
      warranty: '6 Months Replacement Warranty',
      color: 'Tactical Green & Matte Black',
      material: 'Shockproof TPU Armor & Solar Shell'
    },
    stock: 85,
    ratingAvg: 4.8,
    ratingCount: 154,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    createdAt: new Date('2026-07-09T10:00:00Z')
  },
  {
    _id: '65c000000000000000000013',
    name: 'WAGH MagDock Pro Smart Auto-Clamping Car Wireless Mount',
    slug: 'wagh-magdock-pro-car-mount',
    description: 'Smart motorized car phone holder with built-in infrared sensor for automatic opening and clamping. Delivers 15W Qi and MagSafe fast wireless charging with a 360-degree titanium swivel ball joint.',
    price: 1599,
    mrp: 3199,
    images: [
      'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80'
    ],
    category: catChargers,
    brand: 'WAGH',
    specs: {
      outputPower: '15W Wireless Fast Charge + QC 3.0 Adapter Included',
      compatibility: 'MagSafe iPhone & Qi Wireless Android Phones',
      warranty: '6 Months Warranty',
      color: 'Carbon Fiber Texture & Teal LED Ring',
      material: 'Tempered Glass Face & Aluminum Clamp'
    },
    stock: 120,
    ratingAvg: 4.7,
    ratingCount: 203,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: true,
    createdAt: new Date('2026-07-08T10:00:00Z')
  }
];

const mockOrders = [
  {
    _id: '65d000000000000000000001',
    orderId: 'WAGH-847291',
    user: { _id: '65b000000000000000000002', name: 'Devang Panchal', email: 'devang@example.com' },
    items: [
      { name: 'WAGH Super Fast Charger 2.0 45W', price: 749, quantity: 2, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop' }
    ],
    shippingAddress: { street: '42 Speed Avenue, Sector 4', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '+91 98765 43210' },
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    orderStatus: 'Processing',
    subtotal: 1498,
    shippingFee: 0,
    discount: 0,
    total: 1498,
    createdAt: new Date('2026-07-25T14:30:00Z')
  },
  {
    _id: '65d000000000000000000002',
    orderId: 'WAGH-592304',
    user: { _id: '65b000000000000000000002', name: 'Devang Panchal', email: 'devang@example.com' },
    items: [
      { name: 'WAGH TitanPower 20,000mAh 22.5W Power Bank', price: 1499, quantity: 1, image: 'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=600&auto=format&fit=crop' }
    ],
    shippingAddress: { street: '42 Speed Avenue, Sector 4', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '+91 98765 43210' },
    paymentMethod: 'Razorpay',
    paymentStatus: 'Paid',
    orderStatus: 'Shipped',
    subtotal: 1499,
    shippingFee: 0,
    discount: 0,
    total: 1499,
    createdAt: new Date('2026-07-22T09:15:00Z')
  }
];

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
