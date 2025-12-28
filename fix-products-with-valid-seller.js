// Fix products to use valid seller ID
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./server/models/Product');
const Seller = require('./server/models/Seller');

async function fixProductsWithValidSeller() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace');
    console.log('✅ Connected to MongoDB');

    // Get all sellers
    const sellers = await Seller.find();
    console.log(`\n📦 Found ${sellers.length} sellers:`);
    sellers.forEach(s => {
      console.log(`   - ${s._id.toString()}: ${s.businessName}`);
    });

    if (sellers.length === 0) {
      console.log('❌ No sellers found. Please create a seller first.');
      process.exit(1);
    }

    // Use first seller
    const seller = sellers[0];
    console.log(`\n✅ Using seller: ${seller.businessName} (${seller._id.toString()})`);

    // Check current products
    const productsBefore = await Product.find().select('_id sellerId name');
    console.log(`\n📊 Products before update:`);
    productsBefore.slice(0, 3).forEach(p => {
      console.log(`   - ${p.name}: sellerId = ${p.sellerId ? p.sellerId.toString() : 'null'}`);
    });

    // Update all products to use the valid seller ID
    const result = await Product.updateMany(
      {},
      { $set: { sellerId: seller._id } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} products`);

    // Verify
    const productsAfter = await Product.find().limit(3);
    console.log(`\n📊 Verification (first 3 products):`);
    for (const p of productsAfter) {
      const populated = await Product.findById(p._id).populate('sellerId', 'businessName');
      console.log(`   - ${p.name}: seller = ${populated.sellerId ? populated.sellerId.businessName : 'null'}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixProductsWithValidSeller();

