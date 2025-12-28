// Migrate products from local MongoDB to EC2 MongoDB
const mongoose = require('mongoose');

// Local database connection
const LOCAL_URI = 'mongodb://localhost:27017/competitive-marketplace';
// EC2 database connection (you can also use SSH tunnel or direct connection)
const EC2_URI = process.env.EC2_MONGODB_URI || 'mongodb://localhost:27017/marketplace';

// Product schema (should match your Product model)
const ProductSchema = new mongoose.Schema({}, { strict: false });

async function migrateProducts() {
  let localConnection, ec2Connection;

  try {
    console.log('==========================================');
    console.log('Product Migration: Local to EC2');
    console.log('==========================================');
    console.log('');

    // Connect to local database
    console.log('Connecting to local database...');
    localConnection = await mongoose.createConnection(LOCAL_URI);
    const LocalProduct = localConnection.model('Product', ProductSchema, 'products');
    console.log('✓ Connected to local database');

    // Fetch products from local
    console.log('Fetching products from local database...');
    const products = await LocalProduct.find({}).lean();
    console.log(`✓ Found ${products.length} products`);
    
    if (products.length === 0) {
      console.log('No products to migrate.');
      return;
    }

    // Connect to EC2 database (via SSH tunnel or direct)
    console.log('\nConnecting to EC2 database...');
    console.log('Note: If EC2 MongoDB is not accessible directly,');
    console.log('      you may need to set up SSH tunnel or run this script on EC2');
    
    // For now, we'll export to JSON and import via SSH
    const fs = require('fs');
    const path = require('path');
    
    const exportFile = path.join(__dirname, 'products-export.json');
    fs.writeFileSync(exportFile, JSON.stringify(products, null, 2));
    console.log(`✓ Products exported to ${exportFile}`);
    console.log(`✓ ${products.length} products ready for migration`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Transfer products-export.json to EC2');
    console.log('2. Run import script on EC2');
    console.log('');
    console.log('Or run: node import-products-on-ec2.js');

    await localConnection.close();

  } catch (error) {
    console.error('Error during migration:', error);
    if (localConnection) await localConnection.close();
    if (ec2Connection) await ec2Connection.close();
    process.exit(1);
  }
}

migrateProducts();

