const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

const router = express.Router();

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
    if (search) {
      query.$text = { $search: search };
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
        // Handle both ObjectId objects and string IDs
        return p.sellerId.toString ? p.sellerId.toString() : String(p.sellerId);
      })
      .filter(Boolean);
    
    // Fetch all sellers at once
    const Seller = require('../models/Seller');
    const sellers = sellerIds.length > 0 ? await Seller.find({ 
      _id: { $in: sellerIds.map(id => mongoose.Types.ObjectId(id)) } 
    })
      .select('businessName rating')
      .lean() : [];
    
    // Create a map for quick lookup (use both string and ObjectId keys)
    const sellerMap = new Map();
    sellers.forEach(s => {
      const idStr = s._id.toString();
      sellerMap.set(idStr, s);
      sellerMap.set(s._id.toString(), s);
    });
    
    // Attach seller info to products
    const products = productsRaw.map(product => {
      if (product.sellerId) {
        const sellerIdStr = product.sellerId.toString ? product.sellerId.toString() : String(product.sellerId);
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

// Create product (seller only)
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
router.put('/:id', auth, authorize('seller'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(403).json({ message: 'Seller not found' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const updates = req.body;
    
    // Recalculate discount if price changes
    if (updates.basePrice || updates.sellingPrice) {
      const basePrice = updates.basePrice || product.basePrice;
      const sellingPrice = updates.sellingPrice || product.sellingPrice;
      updates.priceDiscount = ((basePrice - sellingPrice) / basePrice) * 100;
    }

    updates.updatedAt = new Date();
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        product[key] = updates[key];
      }
    });

    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
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
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

