const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const upload = require('../config/multer');

const router = express.Router();

// Get seller's products (for edit/search) - ONLY products created by this seller
router.get('/seller/my-products', auth, async (req, res) => {
  try {
    // Get seller record for the authenticated user
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(403).json({ 
        success: false,
        message: 'Seller not found. Please register as a seller first.' 
      });
    }

    const { search } = req.query;
    
    // IMPORTANT: Only return products where sellerId matches the authenticated seller's ID
    // This ensures sellers can only see and edit their own products
    const query = { 
      sellerId: seller._id, // Filter by seller's ID - critical security check
      isActive: true 
    };

    // If search query provided (3+ characters), search products
    if (search && search.trim().length >= 3) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
      ];
    }

    // Fetch only products belonging to this seller
    const products = await Product.find(query)
      .select('name description brand category subcategory basePrice sellingPrice stock images gstNumber gstDocument')
      .limit(50)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Seller ${seller._id} requested products - found ${products.length} products`);

    res.json({ success: true, products });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      allowBargaining,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { isActive: true };
    
    if (category) query.category = category;
    if (allowBargaining !== undefined) query.allowBargaining = allowBargaining === 'true';
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }
    // Case-insensitive search across multiple fields
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i'); // 'i' flag makes it case-insensitive
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { subcategory: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch products and manually populate sellerId since Mongoose populate isn't working
    const productsRaw = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort)
      .lean();

    // Get all unique sellerIds (handle both ObjectId and string)
    const sellerIds = productsRaw
      .map(p => {
        if (!p.sellerId) return null;
        // Handle both ObjectId objects and string IDs - with lean(), sellerId might be ObjectId or string
        if (typeof p.sellerId === 'object' && p.sellerId.toString) {
          return p.sellerId.toString();
        }
        return String(p.sellerId);
      })
      .filter(Boolean);
    
    // Fetch all sellers and match manually (since findById isn't working)
    let sellers = [];
    if (sellerIds.length > 0) {
      try {
        // Get all sellers and filter manually
        const allSellers = await Seller.find()
          .select('businessName rating _id')
          .lean();
        
        // Match sellers by comparing string representations of _id
        sellers = allSellers.filter(s => {
          const sellerIdStr = s._id.toString();
          return sellerIds.includes(sellerIdStr);
        });
      } catch (e) {
        console.error('Error fetching sellers:', e);
      }
    }
    
    console.log('Found sellers:', sellers.length);
    if (sellers.length > 0) {
      console.log('First seller:', sellers[0].businessName, sellers[0]._id.toString());
    }
    
    // Create a map for quick lookup - use string representation as key
    const sellerMap = new Map();
    sellers.forEach(s => {
      const idStr = s._id.toString();
      sellerMap.set(idStr, {
        _id: s._id,
        businessName: s.businessName,
        rating: s.rating || { average: 0, count: 0 }
      });
    });
    
    // Attach seller info to products
    const products = productsRaw.map(product => {
      if (product.sellerId) {
        // Convert sellerId to string for lookup
        let sellerIdStr;
        if (typeof product.sellerId === 'object' && product.sellerId.toString) {
          sellerIdStr = product.sellerId.toString();
        } else {
          sellerIdStr = String(product.sellerId);
        }
        
        const seller = sellerMap.get(sellerIdStr);
        product.sellerId = seller || null;
      } else {
        product.sellerId = null;
      }
      return product;
    });

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'businessName rating pickupLocations');

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create product with file upload (seller only) - supports images and GST document
router.post('/create', auth, upload.fields([{ name: 'files', maxCount: 10 }, { name: 'gstDocument', maxCount: 1 }]), async (req, res) => {
  try {
    // Check if user is a seller (check isSeller flag first, then role/userType)
    // Users who converted to sellers will have isSeller = true
    if (!req.user.isSeller && req.user.role !== 'seller' && req.user.userType !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can create products. Please register as a seller first.' });
    }

    // Get or create seller
    let seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      // Create seller record if doesn't exist
      seller = new Seller({
        userId: req.user._id,
        businessName: req.user.name || 'My Business',
        isCloseKnit: true,
        verificationStatus: 'approved', // Auto-approve for userType sellers
      });
      await seller.save();
    }

    const {
      name,
      description,
      category,
      subcategory,
      basePrice,
      sellingPrice,
      stock,
      priceDiscount,
      allowBargaining,
      minBargainPrice,
      brand,
      warrantyDetails,
      warranty,
      gstNumber,
    } = req.body;

    // Validate required fields
    if (!name || !description || !basePrice || !stock) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Process uploaded files - separate images and GST document
    const imageUrls = [];
    let gstDocumentName = null;
    
    // Handle files uploaded via upload.fields() - req.files is an object
    if (req.files) {
      // Process product images/videos (fieldname 'files')
      if (req.files['files'] && Array.isArray(req.files['files'])) {
        req.files['files'].forEach((file) => {
          imageUrls.push(file.filename);
        });
      }
      
      // Process GST document (fieldname 'gstDocument')
      if (req.files['gstDocument'] && Array.isArray(req.files['gstDocument']) && req.files['gstDocument'].length > 0) {
        gstDocumentName = req.files['gstDocument'][0].filename;
      }
    }

    // Parse warranty if it's a string
    let warrantyObj = {};
    if (warranty) {
      try {
        warrantyObj = typeof warranty === 'string' ? JSON.parse(warranty) : warranty;
      } catch (e) {
        warrantyObj = {
          hasWarranty: parseFloat(warrantyDetails) > 0,
          duration: warrantyDetails || '0',
          type: 'seller'
        };
      }
    } else {
      warrantyObj = {
        hasWarranty: parseFloat(warrantyDetails || '0') > 0,
        duration: warrantyDetails || '0',
        type: 'seller'
      };
    }

    // Calculate discount if not provided
    const discount = priceDiscount ? parseFloat(priceDiscount) : 
      ((parseFloat(basePrice) - parseFloat(sellingPrice || basePrice)) / parseFloat(basePrice)) * 100;

    const product = new Product({
      sellerId: seller._id,
      name: name.trim(),
      description: description.trim(),
      category: category || 'general',
      subcategory: subcategory || '',
      images: imageUrls,
      basePrice: parseFloat(basePrice),
      sellingPrice: parseFloat(sellingPrice || basePrice),
      priceDiscount: discount,
      allowBargaining: allowBargaining === 'true' || allowBargaining === true,
      minBargainPrice: minBargainPrice ? parseFloat(minBargainPrice) : undefined,
      stock: parseInt(stock),
      brand: brand || '',
      warranty: warrantyObj,
      tags: [],
      isActive: true,
    });

    await product.save();
    res.status(201).json({ 
      success: true,
      message: 'Product created successfully', 
      product 
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Create product (seller only) - Original endpoint kept for backward compatibility
router.post('/', auth, authorize('seller'), [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('basePrice').isFloat({ min: 0 }),
  body('sellingPrice').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller || seller.verificationStatus !== 'approved') {
      return res.status(403).json({ message: 'Seller not verified' });
    }

    const {
      name,
      description,
      category,
      subcategory,
      images,
      basePrice,
      sellingPrice,
      competitivePrice,
      allowBargaining,
      minBargainPrice,
      stock,
      brand,
      specifications,
      warranty,
      tags,
    } = req.body;

    // Calculate discount percentage
    const priceDiscount = ((basePrice - sellingPrice) / basePrice) * 100;

    const product = new Product({
      sellerId: seller._id,
      name,
      description,
      category,
      subcategory,
      images: images || [],
      basePrice,
      sellingPrice,
      competitivePrice,
      priceDiscount,
      allowBargaining,
      minBargainPrice,
      stock,
      brand,
      specifications,
      warranty,
      tags: tags || [],
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product (seller only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is a seller
    if (!req.user.isSeller && req.user.role !== 'seller' && req.user.userType !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can update products' });
    }

    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(403).json({ message: 'Seller not found' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // SECURITY: Ensure only the product owner can update it
    // Compare sellerId from product with the authenticated seller's _id
    if (product.sellerId.toString() !== seller._id.toString()) {
      console.warn(`Unauthorized update attempt: Seller ${seller._id} tried to update product ${req.params.id} owned by ${product.sellerId}`);
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this product. You can only edit products you created.' 
      });
    }

    const updates = req.body;
    
    // Recalculate discount if price changes
    if (updates.basePrice || updates.sellingPrice) {
      const basePrice = updates.basePrice || product.basePrice;
      const sellingPrice = updates.sellingPrice || product.sellingPrice;
      updates.priceDiscount = ((basePrice - sellingPrice) / basePrice) * 100;
    }

    updates.updatedAt = new Date();
    
    // Update product fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'updatedAt') {
        product[key] = updates[key];
      }
    });

    await product.save();
    res.json({ 
      success: true,
      message: 'Product updated successfully', 
      product 
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product (seller only)
router.delete('/:id', auth, authorize('seller'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(403).json({ message: 'Seller not found' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // SECURITY: Ensure only the product owner can delete it
    if (product.sellerId.toString() !== seller._id.toString()) {
      console.warn(`Unauthorized delete attempt: Seller ${seller._id} tried to delete product ${req.params.id} owned by ${product.sellerId}`);
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this product. You can only delete products you created.' 
      });
    }

    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

