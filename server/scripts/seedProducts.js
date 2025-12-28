const mongoose = require('mongoose');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/competitive-marketplace';

const products = [
  // ELECTRONICS
  {
    name: 'Samsung Galaxy M34 5G (Midnight Blue, 8GB, 128GB)',
    description: '6.5" Super AMOLED Display, 50MP Triple Camera, 6000mAh Battery, Android 13',
    category: 'electronics',
    subcategory: 'smartphones',
    basePrice: 18999,
    sellingPrice: 17099, // 10% cheaper
    competitivePrice: {
      flipkart: 18999,
      amazon: 18999,
    },
    brand: 'Samsung',
    stock: 50,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'],
    specifications: {
      display: '6.5" Super AMOLED',
      processor: 'Exynos 1280',
      ram: '8GB',
      storage: '128GB',
      camera: '50MP + 8MP + 2MP',
      battery: '6000mAh',
    },
    warranty: {
      hasWarranty: true,
      duration: '1 Year',
      type: 'manufacturer',
      details: 'Manufacturer warranty included',
    },
    tags: ['smartphone', '5G', 'samsung', 'android'],
    rating: { average: 4.3, count: 1250 },
  },
  {
    name: 'Sony WH-CH720N Wireless Noise Cancelling Headphones',
    description: 'Bluetooth 5.2, 35hrs Battery, Fast Charge, Clear Bass Sound',
    category: 'electronics',
    subcategory: 'audio',
    basePrice: 7999,
    sellingPrice: 7199,
    competitivePrice: {
      flipkart: 7999,
      amazon: 7999,
    },
    brand: 'Sony',
    stock: 30,
    allowBargaining: true,
    minBargainPrice: 6999,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
    specifications: {
      connectivity: 'Bluetooth 5.2',
      battery: '35 hours',
      noiseCancellation: 'Yes',
      color: 'Black',
    },
    warranty: {
      hasWarranty: true,
      duration: '1 Year',
      type: 'manufacturer',
    },
    tags: ['headphones', 'wireless', 'noise-cancelling', 'sony'],
    rating: { average: 4.5, count: 890 },
  },
  {
    name: 'LG 32" HD Smart LED TV (32LM563BPTC)',
    description: 'HD Ready, WebOS, Magic Remote, Built-in WiFi, HDR10 Pro',
    category: 'electronics',
    subcategory: 'televisions',
    basePrice: 16999,
    sellingPrice: 15299,
    competitivePrice: {
      flipkart: 16999,
      amazon: 16999,
    },
    brand: 'LG',
    stock: 25,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500'],
    specifications: {
      screenSize: '32 inches',
      resolution: 'HD Ready 1366x768',
      smartTV: 'Yes (WebOS)',
      hdr: 'HDR10 Pro',
    },
    warranty: {
      hasWarranty: true,
      duration: '1 Year',
      type: 'manufacturer',
    },
    tags: ['tv', 'smart-tv', 'lg', 'hd'],
    rating: { average: 4.2, count: 650 },
  },

  // FASHION
  {
    name: 'Men\'s Casual Cotton T-Shirt (Pack of 3)',
    description: '100% Premium Cotton, Regular Fit, Machine Wash, Multiple Colors',
    category: 'clothing',
    subcategory: 'mens-tshirts',
    basePrice: 899,
    sellingPrice: 809,
    competitivePrice: {
      flipkart: 899,
      amazon: 899,
    },
    brand: 'Fashion Hub',
    stock: 100,
    allowBargaining: true,
    minBargainPrice: 750,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
    specifications: {
      material: '100% Cotton',
      fit: 'Regular',
      care: 'Machine Wash',
      pack: '3',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['tshirt', 'cotton', 'mens', 'casual'],
    rating: { average: 4.1, count: 2100 },
  },
  {
    name: 'Women\'s Printed Kurti Set',
    description: 'Cotton Blend, Designer Print, Comfortable Fit, Size: S to XXL',
    category: 'clothing',
    subcategory: 'womens-kurtis',
    basePrice: 1299,
    sellingPrice: 1169,
    competitivePrice: {
      flipkart: 1299,
      amazon: 1299,
    },
    brand: 'Ethnic Wear',
    stock: 75,
    allowBargaining: true,
    minBargainPrice: 1099,
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500'],
    specifications: {
      material: 'Cotton Blend',
      style: 'Printed',
      sizes: 'S, M, L, XL, XXL',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['kurti', 'ethnic', 'womens', 'printed'],
    rating: { average: 4.4, count: 1850 },
  },
  {
    name: 'Men\'s Denim Jeans (Slim Fit)',
    description: 'Premium Denim, Stretchable, Multiple Washes, Size: 28 to 38',
    category: 'clothing',
    subcategory: 'mens-jeans',
    basePrice: 1499,
    sellingPrice: 1349,
    competitivePrice: {
      flipkart: 1499,
      amazon: 1499,
    },
    brand: 'Denim Co',
    stock: 60,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'],
    specifications: {
      material: 'Premium Denim',
      fit: 'Slim Fit',
      stretchable: 'Yes',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['jeans', 'denim', 'mens', 'slim-fit'],
    rating: { average: 4.3, count: 3200 },
  },

  // BOOKS
  {
    name: 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
    description: 'By James Clear - Paperback Edition, 320 Pages',
    category: 'books',
    subcategory: 'self-help',
    basePrice: 499,
    sellingPrice: 449,
    competitivePrice: {
      flipkart: 499,
      amazon: 499,
    },
    brand: 'Random House',
    stock: 150,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'],
    specifications: {
      pages: '320',
      language: 'English',
      format: 'Paperback',
      author: 'James Clear',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['self-help', 'habits', 'personal-development'],
    rating: { average: 4.7, count: 4500 },
  },
  {
    name: 'The Alchemist by Paulo Coelho',
    description: 'Paperback Edition, 208 Pages, Bestseller',
    category: 'books',
    subcategory: 'fiction',
    basePrice: 299,
    sellingPrice: 269,
    competitivePrice: {
      flipkart: 299,
      amazon: 299,
    },
    brand: 'HarperOne',
    stock: 200,
    allowBargaining: true,
    minBargainPrice: 249,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'],
    specifications: {
      pages: '208',
      language: 'English',
      format: 'Paperback',
      author: 'Paulo Coelho',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['fiction', 'bestseller', 'inspirational'],
    rating: { average: 4.6, count: 8900 },
  },
  {
    name: 'Rich Dad Poor Dad by Robert Kiyosaki',
    description: 'What the Rich Teach Their Kids About Money - Paperback',
    category: 'books',
    subcategory: 'finance',
    basePrice: 349,
    sellingPrice: 314,
    competitivePrice: {
      flipkart: 349,
      amazon: 349,
    },
    brand: 'Plata Publishing',
    stock: 120,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'],
    specifications: {
      pages: '336',
      language: 'English',
      format: 'Paperback',
      author: 'Robert Kiyosaki',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['finance', 'money', 'investing', 'bestseller'],
    rating: { average: 4.5, count: 5600 },
  },

  // SPORTS
  {
    name: 'Nike Revolution 6 Running Shoes',
    description: 'Lightweight, Cushioned Sole, Breathable Mesh Upper, All Sizes',
    category: 'sports',
    subcategory: 'footwear',
    basePrice: 3499,
    sellingPrice: 3149,
    competitivePrice: {
      flipkart: 3499,
      amazon: 3499,
    },
    brand: 'Nike',
    stock: 40,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
    specifications: {
      material: 'Mesh & Synthetic',
      sole: 'Rubber',
      closure: 'Lace-up',
      type: 'Running Shoes',
    },
    warranty: {
      hasWarranty: true,
      duration: '6 Months',
      type: 'seller',
    },
    tags: ['running', 'shoes', 'nike', 'sports'],
    rating: { average: 4.4, count: 2800 },
  },
  {
    name: 'Yonex GR 303 Badminton Racquet',
    description: 'Aluminum Frame, Pre-strung, Beginner Friendly, With Cover',
    category: 'sports',
    subcategory: 'racquets',
    basePrice: 899,
    sellingPrice: 809,
    competitivePrice: {
      flipkart: 899,
      amazon: 899,
    },
    brand: 'Yonex',
    stock: 35,
    allowBargaining: true,
    minBargainPrice: 750,
    images: ['https://images.unsplash.com/photo-1622163642992-4d47d7243e0f?w=500'],
    specifications: {
      frame: 'Aluminum',
      string: 'Pre-strung',
      weight: '85-89g',
      grip: 'G4',
    },
    warranty: {
      hasWarranty: true,
      duration: '1 Year',
      type: 'manufacturer',
    },
    tags: ['badminton', 'racquet', 'yonex', 'sports'],
    rating: { average: 4.3, count: 1500 },
  },
  {
    name: 'Adidas Football/Soccer Ball',
    description: 'Official Size 5, Machine Stitched, FIFA Quality Pro',
    category: 'sports',
    subcategory: 'balls',
    basePrice: 1299,
    sellingPrice: 1169,
    competitivePrice: {
      flipkart: 1299,
      amazon: 1299,
    },
    brand: 'Adidas',
    stock: 50,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=500'],
    specifications: {
      size: '5 (Official)',
      material: 'Synthetic Leather',
      construction: 'Machine Stitched',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['football', 'soccer', 'adidas', 'ball'],
    rating: { average: 4.5, count: 2100 },
  },

  // BEAUTY
  {
    name: 'Lakme Absolute Perfect Radiance Skin Lightening Day Cream SPF 20',
    description: '50g, Brightens Skin, Reduces Dark Spots, Sun Protection',
    category: 'beauty',
    subcategory: 'skincare',
    basePrice: 499,
    sellingPrice: 449,
    competitivePrice: {
      flipkart: 499,
      amazon: 499,
    },
    brand: 'Lakme',
    stock: 80,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1556228720-da4a4b0e0c44?w=500'],
    specifications: {
      weight: '50g',
      spf: '20',
      skinType: 'All',
      benefits: 'Brightening, SPF Protection',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['skincare', 'moisturizer', 'lakme', 'spf'],
    rating: { average: 4.2, count: 3200 },
  },
  {
    name: 'Maybelline New York Super Stay Matte Ink Liquid Lipstick',
    description: 'Long Lasting, Transfer Proof, 16 Hour Wear, Multiple Shades',
    category: 'beauty',
    subcategory: 'makeup',
    basePrice: 599,
    sellingPrice: 539,
    competitivePrice: {
      flipkart: 599,
      amazon: 599,
    },
    brand: 'Maybelline',
    stock: 60,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1583241802269-4c50c0e74ce7?w=500'],
    specifications: {
      finish: 'Matte',
      longLasting: '16 Hours',
      transferProof: 'Yes',
      shades: 'Multiple Available',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['lipstick', 'makeup', 'maybelline', 'long-lasting'],
    rating: { average: 4.4, count: 4500 },
  },
  {
    name: 'L\'Oreal Paris Revitalift Anti-Aging Face Serum',
    description: '30ml, With Hyaluronic Acid, Reduces Fine Lines & Wrinkles',
    category: 'beauty',
    subcategory: 'skincare',
    basePrice: 999,
    sellingPrice: 899,
    competitivePrice: {
      flipkart: 999,
      amazon: 999,
    },
    brand: 'L\'Oreal Paris',
    stock: 45,
    allowBargaining: true,
    minBargainPrice: 849,
    images: ['https://images.unsplash.com/photo-1556228720-da4a4b0e0c44?w=500'],
    specifications: {
      volume: '30ml',
      keyIngredients: 'Hyaluronic Acid',
      benefits: 'Anti-Aging, Hydration',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['serum', 'anti-aging', 'loreal', 'skincare'],
    rating: { average: 4.3, count: 1800 },
  },

  // TOYS
  {
    name: 'LEGO Classic Creative Brick Box 10696',
    description: '790 Pieces, Multiple Colors, Building Blocks for Kids 4+',
    category: 'toys',
    subcategory: 'building-blocks',
    basePrice: 1999,
    sellingPrice: 1799,
    competitivePrice: {
      flipkart: 1999,
      amazon: 1999,
    },
    brand: 'LEGO',
    stock: 30,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    specifications: {
      pieces: '790',
      ageGroup: '4+ Years',
      material: 'Plastic',
      includes: 'Storage Box',
    },
    warranty: {
      hasWarranty: true,
      duration: '1 Year',
      type: 'manufacturer',
    },
    tags: ['lego', 'building-blocks', 'kids', 'educational'],
    rating: { average: 4.7, count: 5600 },
  },
  {
    name: 'Remote Control Car with LED Lights',
    description: '1:14 Scale, 2.4GHz Frequency, 360° Rotation, Rechargeable Battery',
    category: 'toys',
    subcategory: 'remote-control',
    basePrice: 1499,
    sellingPrice: 1349,
    competitivePrice: {
      flipkart: 1499,
      amazon: 1499,
    },
    brand: 'Toy Master',
    stock: 40,
    allowBargaining: true,
    minBargainPrice: 1249,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    specifications: {
      scale: '1:14',
      frequency: '2.4GHz',
      battery: 'Rechargeable',
      features: 'LED Lights, 360° Rotation',
    },
    warranty: {
      hasWarranty: true,
      duration: '6 Months',
      type: 'seller',
    },
    tags: ['rc-car', 'remote-control', 'kids', 'toy'],
    rating: { average: 4.2, count: 2300 },
  },
  {
    name: 'Barbie Dreamhouse Playset',
    description: '3-Story Dollhouse, 70+ Pieces, Multiple Rooms, Accessories Included',
    category: 'toys',
    subcategory: 'dolls',
    basePrice: 5999,
    sellingPrice: 5399,
    competitivePrice: {
      flipkart: 5999,
      amazon: 5999,
    },
    brand: 'Barbie',
    stock: 15,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    specifications: {
      pieces: '70+',
      ageGroup: '3+ Years',
      type: 'Dollhouse',
      includes: 'Accessories',
    },
    warranty: {
      hasWarranty: true,
      duration: '1 Year',
      type: 'manufacturer',
    },
    tags: ['barbie', 'dollhouse', 'kids', 'playset'],
    rating: { average: 4.6, count: 4200 },
  },

  // GROCERY
  {
    name: 'Basmati Rice 5kg - Premium Quality',
    description: 'Aged Basmati Rice, Long Grain, Aroma Rich, Food Grade',
    category: 'grocery',
    subcategory: 'rice',
    basePrice: 599,
    sellingPrice: 539,
    competitivePrice: {
      flipkart: 599,
      amazon: 599,
    },
    brand: 'Farm Fresh',
    stock: 100,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500'],
    specifications: {
      weight: '5kg',
      type: 'Basmati Rice',
      grain: 'Long Grain',
      shelfLife: '12 Months',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['rice', 'basmati', 'grocery', 'food'],
    rating: { average: 4.5, count: 5800 },
  },
  {
    name: 'Extra Virgin Olive Oil - 1 Litre',
    description: 'Cold Pressed, Pure, Imported, Rich in Antioxidants',
    category: 'grocery',
    subcategory: 'oils',
    basePrice: 899,
    sellingPrice: 809,
    competitivePrice: {
      flipkart: 899,
      amazon: 899,
    },
    brand: 'Olive Valley',
    stock: 60,
    allowBargaining: true,
    minBargainPrice: 749,
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500'],
    specifications: {
      volume: '1 Litre',
      type: 'Extra Virgin',
      process: 'Cold Pressed',
      origin: 'Imported',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['oil', 'olive-oil', 'grocery', 'cooking'],
    rating: { average: 4.4, count: 3200 },
  },
  {
    name: 'Organic Honey - 500g',
    description: 'Pure, Natural, Unprocessed, Rich in Nutrients, Antibacterial',
    category: 'grocery',
    subcategory: 'honey',
    basePrice: 449,
    sellingPrice: 404,
    competitivePrice: {
      flipkart: 449,
      amazon: 449,
    },
    brand: 'Nature\'s Best',
    stock: 80,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500'],
    specifications: {
      weight: '500g',
      type: 'Organic',
      purity: '100% Pure',
      shelfLife: '24 Months',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['honey', 'organic', 'grocery', 'natural'],
    rating: { average: 4.6, count: 4800 },
  },

  // HOME & LIVING
  {
    name: 'Premium Cotton Bed Sheet Set (King Size)',
    description: '4 Piece Set, 100% Cotton, Premium Quality, Multiple Colors Available',
    category: 'home',
    subcategory: 'bedding',
    basePrice: 1499,
    sellingPrice: 1349,
    competitivePrice: {
      flipkart: 1499,
      amazon: 1499,
    },
    brand: 'Home Comfort',
    stock: 60,
    allowBargaining: true,
    minBargainPrice: 1249,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500'],
    specifications: {
      size: 'King Size',
      material: '100% Cotton',
      pieces: '4 Piece Set',
      threadCount: '200',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['bedding', 'bedsheet', 'cotton', 'bedroom'],
    rating: { average: 4.4, count: 3200 },
  },
  {
    name: 'Modern LED Table Lamp with USB Charging Port',
    description: 'Touch Control, 3 Light Modes, Adjustable Brightness, Energy Efficient',
    category: 'home',
    subcategory: 'lighting',
    basePrice: 1299,
    sellingPrice: 1169,
    competitivePrice: {
      flipkart: 1299,
      amazon: 1299,
    },
    brand: 'Bright Home',
    stock: 45,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
    specifications: {
      type: 'LED',
      power: '5W',
      usbPort: 'Yes',
      control: 'Touch Control',
      modes: '3 Light Modes',
    },
    warranty: {
      hasWarranty: true,
      duration: '1 Year',
      type: 'seller',
    },
    tags: ['lamp', 'led', 'lighting', 'table-lamp'],
    rating: { average: 4.3, count: 1850 },
  },
  {
    name: 'Non-Stick Cookware Set (5 Pieces)',
    description: 'Premium Aluminum, Heat Resistant Handles, Dishwasher Safe, PFOA Free',
    category: 'home',
    subcategory: 'kitchen',
    basePrice: 2499,
    sellingPrice: 2249,
    competitivePrice: {
      flipkart: 2499,
      amazon: 2499,
    },
    brand: 'Cook Perfect',
    stock: 35,
    allowBargaining: true,
    minBargainPrice: 2099,
    images: ['https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=500'],
    specifications: {
      pieces: '5 Pieces',
      material: 'Premium Aluminum',
      coating: 'Non-Stick',
      dishwasherSafe: 'Yes',
    },
    warranty: {
      hasWarranty: true,
      duration: '2 Years',
      type: 'manufacturer',
    },
    tags: ['cookware', 'non-stick', 'kitchen', 'cooking'],
    rating: { average: 4.5, count: 4500 },
  },
  {
    name: 'Decorative Wall Clock - Modern Design',
    description: 'Silent Movement, Battery Operated, Elegant Design, 12 inch',
    category: 'home',
    subcategory: 'decor',
    basePrice: 899,
    sellingPrice: 809,
    competitivePrice: {
      flipkart: 899,
      amazon: 899,
    },
    brand: 'Time Style',
    stock: 50,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1594304460361-7011a69ffee3?w=500'],
    specifications: {
      size: '12 inch',
      movement: 'Quartz',
      battery: 'AA Battery (Not Included)',
      silent: 'Yes',
    },
    warranty: {
      hasWarranty: true,
      duration: '1 Year',
      type: 'seller',
    },
    tags: ['clock', 'wall-clock', 'decor', 'home-decor'],
    rating: { average: 4.2, count: 2100 },
  },
  {
    name: 'Storage Organizer Baskets Set (Set of 6)',
    description: 'Woven Fabric, Multiple Sizes, Perfect for Home Organization, Washable',
    category: 'home',
    subcategory: 'storage',
    basePrice: 799,
    sellingPrice: 719,
    competitivePrice: {
      flipkart: 799,
      amazon: 799,
    },
    brand: 'Organize Well',
    stock: 70,
    allowBargaining: true,
    minBargainPrice: 649,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'],
    specifications: {
      pieces: 'Set of 6',
      material: 'Woven Fabric',
      washable: 'Yes',
      sizes: 'Multiple Sizes',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['storage', 'baskets', 'organizer', 'home-organization'],
    rating: { average: 4.4, count: 2800 },
  },
  {
    name: 'Premium Curtains Set - Thermal Insulated',
    description: 'Room Darkening, Thermal Insulated, Machine Washable, Multiple Colors',
    category: 'home',
    subcategory: 'curtains',
    basePrice: 2499,
    sellingPrice: 2249,
    competitivePrice: {
      flipkart: 2499,
      amazon: 2499,
    },
    brand: 'Window Style',
    stock: 40,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'],
    specifications: {
      type: 'Thermal Insulated',
      lightControl: 'Room Darkening',
      material: 'Polyester Blend',
      washable: 'Machine Washable',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['curtains', 'window-treatment', 'thermal', 'home-decor'],
    rating: { average: 4.3, count: 3600 },
  },
  {
    name: 'Vacuum Insulated Water Bottle - 1 Litre',
    description: 'Stainless Steel, Keeps Hot/Cold for 24 Hours, Leak Proof, BPA Free',
    category: 'home',
    subcategory: 'kitchen',
    basePrice: 899,
    sellingPrice: 809,
    competitivePrice: {
      flipkart: 899,
      amazon: 899,
    },
    brand: 'Stay Hydrated',
    stock: 80,
    allowBargaining: false,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    specifications: {
      capacity: '1 Litre',
      material: 'Stainless Steel',
      insulation: 'Vacuum Insulated',
      temperatureRetention: '24 Hours',
    },
    warranty: {
      hasWarranty: true,
      duration: '1 Year',
      type: 'manufacturer',
    },
    tags: ['water-bottle', 'insulated', 'stainless-steel', 'kitchen'],
    rating: { average: 4.6, count: 5200 },
  },
  {
    name: 'Floor Mat Set - Anti Slip (Set of 4)',
    description: 'Bathroom/Kitchen Mats, Water Absorbent, Machine Washable, Non-Slip',
    category: 'home',
    subcategory: 'flooring',
    basePrice: 699,
    sellingPrice: 629,
    competitivePrice: {
      flipkart: 699,
      amazon: 699,
    },
    brand: 'Safe Home',
    stock: 65,
    allowBargaining: true,
    minBargainPrice: 579,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'],
    specifications: {
      pieces: 'Set of 4',
      material: 'Microfiber',
      antiSlip: 'Yes',
      washable: 'Machine Washable',
    },
    warranty: {
      hasWarranty: false,
    },
    tags: ['mats', 'floor-mat', 'anti-slip', 'bathroom'],
    rating: { average: 4.3, count: 2400 },
  },
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products (optional - comment out if you want to keep existing)
    // await Product.deleteMany({});
    // console.log('Cleared existing products');

    // Find or create a test seller
    let testUser = await User.findOne({ email: 'seller@test.com' });
    
    if (!testUser) {
      // Create test user
      testUser = new User({
        name: 'Test Seller',
        email: 'seller@test.com',
        password: 'Test@123', // This will be hashed by the pre-save hook
        mobile: '9876543210',
        isSeller: true,
        isVerified: true,
      });
      await testUser.save();
      console.log('Created test seller user');
    }

    // Find or create seller profile
    let seller = await Seller.findOne({ userId: testUser._id });
    
    if (!seller) {
      seller = new Seller({
        userId: testUser._id,
        businessName: 'Best Deals Store',
        gstNumber: '29ABCDE1234F1Z5',
        gstVerified: true,
        verificationStatus: 'approved',
        isCloseKnit: false,
      });
      await seller.save();
      console.log('Created seller profile');
    } else {
      // Ensure seller is approved
      seller.verificationStatus = 'approved';
      await seller.save();
      console.log('Seller profile found and updated');
    }

    // Add products
    let addedCount = 0;
    let skippedCount = 0;

    for (const productData of products) {
      // Check if product already exists (by name and seller)
      const existing = await Product.findOne({
        name: productData.name,
        sellerId: seller._id,
      });

      if (existing) {
        console.log(`Skipping existing product: ${productData.name}`);
        skippedCount++;
        continue;
      }

      // Calculate discount
      const priceDiscount = ((productData.basePrice - productData.sellingPrice) / productData.basePrice) * 100;

      const product = new Product({
        ...productData,
        sellerId: seller._id,
        priceDiscount: Math.round(priceDiscount),
        isActive: true,
        isVerified: true,
      });

      await product.save();
      addedCount++;
      console.log(`✓ Added: ${productData.name}`);
    }

    console.log('\n=== Seeding Complete ===');
    console.log(`✓ Added: ${addedCount} products`);
    console.log(`⊘ Skipped: ${skippedCount} products`);
    console.log(`Total products in database: ${await Product.countDocuments()}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedProducts();

