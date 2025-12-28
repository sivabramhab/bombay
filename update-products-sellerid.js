// Update products with null sellerId to have valid seller ID
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./server/models/Product');
const Seller = require('./server/models/Seller');

async function updateProductsSellerId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace');
    console.log('✅ Connected to MongoDB');

    // Check products with null sellerId
    const productsWithNull = await Product.countDocuments({ sellerId: null });
    console.log(`\n📊 Products with null sellerId: ${productsWithNull}`);

    // Get total products
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total products: ${totalProducts}`);

    // Get first seller
    const seller = await Seller.findOne();
    if (!seller) {
      console.log('❌ No seller found. Please create a seller first.');
      process.exit(1);
    }

    console.log(`\n✅ Found seller: ${seller.businessName}`);
    console.log(`   Seller ID: ${seller._id.toString()}`);

    // Update all products with null sellerId
    if (productsWithNull > 0) {
      const result = await Product.updateMany(
        { sellerId: null },
        { $set: { sellerId: seller._id } }
      );
      
      console.log(`\n✅ Updated ${result.modifiedCount} products with sellerId`);
      console.log(`   Matched: ${result.matchedCount} products`);
    } else {
      console.log('\n✅ No products with null sellerId found');
    }

    // Verify update
    const nullAfterUpdate = await Product.countDocuments({ sellerId: null });
    const withSellerId = await Product.countDocuments({ sellerId: { $ne: null } });
    
    console.log(`\n📊 Verification after update:`);
    console.log(`   Products with null sellerId: ${nullAfterUpdate}`);
    console.log(`   Products with sellerId: ${withSellerId}`);

    // Test populate on one product
    const testProduct = await Product.findOne();
    if (testProduct) {
      console.log(`\n📦 Test product: ${testProduct.name}`);
      console.log(`   Product sellerId: ${testProduct.sellerId ? testProduct.sellerId.toString() : 'null'}`);
      
      // Try to find the seller
      const sellerTest = await Seller.findById(testProduct.sellerId);
      console.log(`   Seller found: ${sellerTest ? sellerTest.businessName : 'NOT FOUND'}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('✅ Update complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateProductsSellerId();

