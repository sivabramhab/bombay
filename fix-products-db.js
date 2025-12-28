// Fix all products to have proper ObjectId sellerId
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./server/models/Product');
const Seller = require('./server/models/Seller');

async function fixProductsDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace');
    console.log('✅ Connected to MongoDB');

    // Get first seller
    const seller = await Seller.findOne();
    if (!seller) {
      console.log('❌ No seller found. Creating a test seller...');
      
      // Try to find a user first
      const User = require('./server/models/User');
      const user = await User.findOne();
      
      if (!user) {
        console.log('❌ No user found. Please create a user and seller first.');
        process.exit(1);
      }
      
      // Create a seller for the user
      const newSeller = new Seller({
        userId: user._id,
        businessName: 'Best Deals Store',
        gstNumber: 'GST123456789',
        verificationStatus: 'approved'
      });
      await newSeller.save();
      console.log('✅ Created test seller');
      
      // Update products
      await Product.updateMany(
        {},
        { $set: { sellerId: newSeller._id } }
      );
      console.log(`✅ Updated all products with sellerId: ${newSeller._id}`);
    } else {
      console.log(`📦 Found seller: ${seller.businessName} (${seller._id})`);
      
      // Update all products to use this seller's ObjectId
      const result = await Product.updateMany(
        {},
        { $set: { sellerId: seller._id } }
      );
      console.log(`✅ Updated ${result.modifiedCount} products with sellerId: ${seller._id}`);
    }
    
    // Verify - count products with valid sellerId
    const totalProducts = await Product.countDocuments();
    const productsWithSeller = await Product.countDocuments({ sellerId: { $ne: null } });
    const productsWithNullSeller = await Product.countDocuments({ sellerId: null });
    
    console.log(`\n📊 Verification:`);
    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Products with sellerId: ${productsWithSeller}`);
    console.log(`   Products with null sellerId: ${productsWithNullSeller}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixProductsDB();

