// Fix products sellerId in database
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./server/models/Product');
const Seller = require('./server/models/Seller');

async function fixProductsSellerId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace');
    console.log('✅ Connected to MongoDB');

    // Get first seller
    const seller = await Seller.findOne();
    if (!seller) {
      console.log('❌ No seller found. Please create a seller first.');
      process.exit(1);
    }

    console.log(`📦 Found seller: ${seller.businessName}`);

    // Update all products with null sellerId
    const result = await Product.updateMany(
      { sellerId: null },
      { $set: { sellerId: seller._id } }
    );

    console.log(`✅ Updated ${result.modifiedCount} products with sellerId: ${seller._id}`);
    
    // Verify
    const nullCount = await Product.countDocuments({ sellerId: null });
    console.log(`📊 Products with null sellerId: ${nullCount}`);
    
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total products: ${totalProducts}`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixProductsSellerId();

