// Script to migrate products from local MongoDB to EC2 MongoDB
const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://localhost:27017/competitive-marketplace';
const EC2_URI = process.env.EC2_MONGODB_URI || 'mongodb://localhost:27017/marketplace';

async function migrateProducts() {
  let localClient, ec2Client;

  try {
    console.log('Connecting to local MongoDB...');
    localClient = new MongoClient(LOCAL_URI);
    await localClient.connect();
    console.log('✓ Connected to local MongoDB');

    console.log('Connecting to EC2 MongoDB...');
    ec2Client = new MongoClient(EC2_URI);
    await ec2Client.connect();
    console.log('✓ Connected to EC2 MongoDB');

    const localDb = localClient.db('competitive-marketplace');
    const ec2Db = ec2Client.db('marketplace');

    // Get products from local database
    console.log('\nFetching products from local database...');
    const products = await localDb.collection('products').find({}).toArray();
    console.log(`✓ Found ${products.length} products`);

    if (products.length === 0) {
      console.log('No products to migrate.');
      return;
    }

    // Insert products into EC2 database
    console.log('\nInserting products into EC2 database...');
    
    // Get existing products to avoid duplicates
    const existingProducts = await ec2Db.collection('products').find({}).toArray();
    const existingIds = new Set(existingProducts.map(p => p._id.toString()));
    
    // Filter out duplicates
    const newProducts = products.filter(p => !existingIds.has(p._id.toString()));
    
    if (newProducts.length === 0) {
      console.log('All products already exist in EC2 database.');
      return;
    }

    // Remove _id to let MongoDB create new ones or keep original IDs
    const productsToInsert = newProducts.map(product => {
      // Keep the original _id if you want to maintain references
      // Or remove it to let MongoDB generate new ones
      return product;
    });

    const result = await ec2Db.collection('products').insertMany(productsToInsert, { ordered: false });
    console.log(`✓ Successfully inserted ${result.insertedCount} products`);

    // Get final count
    const totalProducts = await ec2Db.collection('products').countDocuments();
    console.log(`\n✓ Total products in EC2 database: ${totalProducts}`);

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    if (localClient) await localClient.close();
    if (ec2Client) await ec2Client.close();
    console.log('\nMigration completed!');
  }
}

migrateProducts().catch(console.error);

