// Fix sellerId type in products - ensure it's ObjectId not string
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./server/models/Product');
const Seller = require('./server/models/Seller');

async function fixSellerIdType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace');
    console.log('✅ Connected to MongoDB');

    // Get seller
    const seller = await Seller.findOne();
    if (!seller) {
      console.log('❌ No seller found');
      process.exit(1);
    }

    console.log(`✅ Found seller: ${seller.businessName}`);
    console.log(`   Seller ID: ${seller._id}`);
    console.log(`   Seller ID type: ${seller._id.constructor.name}`);

    // Get a product to check its sellerId type
    const product = await Product.findOne();
    if (product) {
      console.log(`\n📦 Sample product: ${product.name}`);
      console.log(`   Product sellerId: ${product.sellerId}`);
      console.log(`   Product sellerId type: ${product.sellerId ? product.sellerId.constructor.name : 'null'}`);
      console.log(`   Are they equal? ${product.sellerId && product.sellerId.toString() === seller._id.toString()}`);
    }

    // Force update all products with proper ObjectId
    const result = await Product.updateMany(
      {},
      [{ $set: { sellerId: mongoose.Types.ObjectId(seller._id) } }]
    );

    console.log(`\n✅ Updated ${result.modifiedCount} products with proper ObjectId`);

    // Verify populate works now
    const testProduct = await Product.findOne().populate('sellerId', 'businessName');
    console.log(`\n📊 Test populate:`);
    console.log(`   Product: ${testProduct.name}`);
    console.log(`   Seller populated: ${testProduct.sellerId ? testProduct.sellerId.businessName : 'null'}`);

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSellerIdType();

