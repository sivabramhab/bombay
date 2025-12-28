// Test products populate
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./server/models/Product');
const Seller = require('./server/models/Seller');

async function testPopulate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace');
    console.log('✅ Connected to MongoDB');

    // Get a product
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found');
      process.exit(1);
    }

    console.log('Product:', product.name);
    console.log('Product sellerId (raw):', product.sellerId);
    console.log('Product sellerId type:', typeof product.sellerId);

    // Check if seller exists
    const seller = await Seller.findById(product.sellerId);
    console.log('Seller found:', seller ? seller.businessName : 'NOT FOUND');

    // Try populate
    const productWithSeller = await Product.findOne().populate('sellerId', 'businessName rating');
    console.log('Product with populated sellerId:', productWithSeller.sellerId);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPopulate();

