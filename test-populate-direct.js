const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./server/models/Product');
const Seller = require('./server/models/Seller');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace');
  
  const seller = await Seller.findOne();
  console.log('Seller:', seller ? seller.businessName : 'NOT FOUND');
  console.log('Seller ID:', seller ? seller._id.toString() : 'N/A');
  
  const product = await Product.findOne();
  console.log('Product:', product ? product.name : 'NOT FOUND');
  console.log('Product sellerId:', product ? product.sellerId.toString() : 'N/A');
  
  if (product && seller) {
    const populated = await Product.findById(product._id).populate('sellerId');
    console.log('Populated sellerId:', populated.sellerId ? populated.sellerId.businessName : 'NULL');
  }
  
  await mongoose.connection.close();
}

test().catch(console.error);

