const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/competitive-marketplace';
    console.log(`Attempting to connect to MongoDB: ${mongoURI.replace(/\/\/.*@/, '//***@')}`);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\nPlease ensure:');
    console.error('1. MongoDB is running on localhost:27017');
    console.error('2. MongoDB service is started (net start MongoDB on Windows)');
    console.error('3. MongoDB is accessible from your network');
    process.exit(1);
  }
};

module.exports = connectDB;

