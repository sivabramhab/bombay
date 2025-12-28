// Verify seller exists and test query
const mongoose = require('mongoose');
require('dotenv').config();

const Seller = require('./server/models/Seller');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace');
  
  const sellerIdStr = '6950a9690f29e037f70c7d9e';
  
  // Try different query methods
  console.log('Testing seller lookup...');
  
  const seller1 = await Seller.findOne().lean();
  console.log('First seller:', seller1 ? seller1.businessName : 'NOT FOUND');
  if (seller1) {
    console.log('Seller ID:', seller1._id.toString());
    console.log('Match:', seller1._id.toString() === sellerIdStr);
  }
  
  const seller2 = await Seller.findById(sellerIdStr).lean();
  console.log('FindById result:', seller2 ? seller2.businessName : 'NOT FOUND');
  
  const seller3 = await Seller.find({ _id: new mongoose.Types.ObjectId(sellerIdStr) }).lean();
  console.log('Find with ObjectId result:', seller3.length, seller3[0] ? seller3[0].businessName : 'NOT FOUND');
  
  const seller4 = await Seller.find({ _id: sellerIdStr }).lean();
  console.log('Find with string result:', seller4.length, seller4[0] ? seller4[0].businessName : 'NOT FOUND');
  
  await mongoose.connection.close();
}

verify().catch(console.error);

