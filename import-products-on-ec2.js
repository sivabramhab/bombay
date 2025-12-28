// Import products JSON file to EC2 MongoDB
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace';
const PRODUCT_FILE = process.env.PRODUCT_FILE || './products-export.json';

// Product schema
const ProductSchema = new mongoose.Schema({}, { strict: false });

async function importProducts() {
  try {
    console.log('==========================================');
    console.log('Importing Products to EC2 MongoDB');
    console.log('==========================================');
    console.log('');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Load products from JSON file
    console.log(`Loading products from ${PRODUCT_FILE}...`);
    if (!fs.existsSync(PRODUCT_FILE)) {
      console.error(`Error: File ${PRODUCT_FILE} not found`);
      process.exit(1);
    }

    const productsData = JSON.parse(fs.readFileSync(PRODUCT_FILE, 'utf8'));
    console.log(`✓ Loaded ${productsData.length} products`);
    
    if (productsData.length === 0) {
      console.log('No products to import.');
      return;
    }

    const Product = mongoose.model('Product', ProductSchema, 'products');

    // Get existing products to avoid duplicates
    console.log('Checking for existing products...');
    const existingProducts = await Product.find({}).select('_id').lean();
    const existingIds = new Set(existingProducts.map(p => p._id.toString()));
    
    // Filter out duplicates
    const newProducts = productsData.filter(p => !existingIds.has(p._id.toString()));
    console.log(`✓ Found ${newProducts.length} new products to import`);

    if (newProducts.length === 0) {
      console.log('All products already exist in database.');
      return;
    }

    // Import products
    console.log('\nImporting products...');
    const result = await Product.insertMany(newProducts, { ordered: false });
    console.log(`✓ Successfully imported ${result.length} products`);

    // Get final count
    const totalProducts = await Product.countDocuments();
    console.log(`\n✓ Total products in database: ${totalProducts}`);

    await mongoose.disconnect();
    console.log('\n✓ Import completed successfully!');

  } catch (error) {
    console.error('Error during import:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

importProducts();

