// Export entire database from local MongoDB
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const LOCAL_URI = 'mongodb://localhost:27017/competitive-marketplace';
const EXPORT_DIR = path.join(__dirname, 'database-export');

async function exportDatabase() {
  try {
    console.log('==========================================');
    console.log('Exporting Database from Local MongoDB');
    console.log('==========================================');
    console.log('');

    console.log('Connecting to local database...');
    await mongoose.connect(LOCAL_URI);
    console.log('✓ Connected to local database');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections:`);
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Create export directory
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    console.log(`\nExporting collections...`);
    const exported = {};

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Exporting ${collectionName}...`);
      
      const data = await db.collection(collectionName).find({}).toArray();
      const filePath = path.join(EXPORT_DIR, `${collectionName}.json`);
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      exported[collectionName] = data.length;
      
      console.log(`  ✓ Exported ${data.length} documents`);
    }

    // Create manifest
    const manifest = {
      exportedAt: new Date().toISOString(),
      source: LOCAL_URI,
      collections: exported,
      totalDocuments: Object.values(exported).reduce((sum, count) => sum + count, 0)
    };

    fs.writeFileSync(
      path.join(EXPORT_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log('\n==========================================');
    console.log('✅ Export Complete!');
    console.log('==========================================');
    console.log(`Total collections: ${Object.keys(exported).length}`);
    console.log(`Total documents: ${manifest.totalDocuments}`);
    console.log(`Export directory: ${EXPORT_DIR}`);
    console.log('');

    await mongoose.disconnect();

  } catch (error) {
    console.error('Error during export:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

exportDatabase();

