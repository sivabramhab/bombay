// Import entire database to EC2 MongoDB
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const EC2_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace';
const IMPORT_DIR = process.env.IMPORT_DIR || './database-export';

async function importDatabase() {
  try {
    console.log('==========================================');
    console.log('Importing Database to EC2 MongoDB');
    console.log('==========================================');
    console.log('');

    if (!fs.existsSync(IMPORT_DIR)) {
      console.error(`Error: Directory ${IMPORT_DIR} not found`);
      process.exit(1);
    }

    // Load manifest
    const manifestPath = path.join(IMPORT_DIR, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.error('Error: manifest.json not found');
      process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`Source: ${manifest.source}`);
    console.log(`Exported at: ${manifest.exportedAt}`);
    console.log(`Collections to import: ${Object.keys(manifest.collections).length}`);
    console.log('');

    console.log('Connecting to EC2 database...');
    await mongoose.connect(EC2_URI);
    console.log('✓ Connected to EC2 database');

    const db = mongoose.connection.db;
    const imported = {};

    console.log('\nImporting collections...');
    
    for (const [collectionName, expectedCount] of Object.entries(manifest.collections)) {
      const filePath = path.join(IMPORT_DIR, `${collectionName}.json`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠ Skipping ${collectionName} (file not found)`);
        continue;
      }

      console.log(`Importing ${collectionName}...`);
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.length === 0) {
        console.log(`  ⊘ No documents to import`);
        imported[collectionName] = 0;
        continue;
      }

      const collection = db.collection(collectionName);
      
      // Get existing documents to avoid duplicates
      const existing = await collection.find({}).project({_id: 1}).toArray();
      const existingIds = new Set(existing.map(doc => doc._id.toString()));
      
      // Filter out duplicates
      const newDocuments = data.filter(doc => {
        const docId = doc._id ? doc._id.toString() : null;
        return !docId || !existingIds.has(docId);
      });

      if (newDocuments.length > 0) {
        await collection.insertMany(newDocuments, { ordered: false });
        console.log(`  ✓ Imported ${newDocuments.length} new documents`);
      } else {
        console.log(`  ⊘ All documents already exist`);
      }

      imported[collectionName] = newDocuments.length;
    }

    console.log('\n==========================================');
    console.log('✅ Import Complete!');
    console.log('==========================================');
    
    // Get final counts
    for (const collectionName of Object.keys(manifest.collections)) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`${collectionName}: ${count} documents`);
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('Error during import:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

importDatabase();

