// backend/src/controllers/property.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all properties (public, with filters)
const getProperties = async (req, res) => {
  try {
    const {
      search,
      type,
      category,
      status,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sort = 'newest'
    } = req.query;

    const where = {};

    // Exclude sold properties from public listing
    where.status = { not: 'sold' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }

    // Sorting
    let orderBy = {};
    switch (sort) {
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = { views: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          media: true
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.property.count({ where })
    ]);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties.'
    });
  }
};

// Get featured properties
const getFeaturedProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        status: { in: ['available', 'rented'] }
      },
      include: { media: true },
      orderBy: { views: 'desc' },
      take: 8
    });

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Featured properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured properties.'
    });
  }
};

// Get single property by ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      include: { media: true }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.'
      });
    }

    // Increment view count
    await prisma.property.update({
      where: { id: parseInt(id) },
      data: { views: { increment: 1 } }
    });

    res.json({
      success: true,
      data: { ...property, views: property.views + 1 }
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property.'
    });
  }
};

// Create property (admin only)
const createProperty = async (req, res) => {
  try {
    const {
      name,
      type,
      category,
      description,
      price,
      address,
      latitude,
      longitude,
      status
    } = req.body;

    if (!name || !type || !category || !description || !price || !address) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, type, category, description, price, address.'
      });
    }

    const property = await prisma.property.create({
      data: {
        name,
        type,
        category,
        description,
        price: parseFloat(price),
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: status || 'available'
      }
    });

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const mediaData = req.files.map(file => ({
        propertyId: property.id,
        mediaUrl: `/uploads/${file.filename}`,
        mediaType: file.mimetype.startsWith('video') ? 'video' : 'image'
      }));

      await prisma.propertyMedia.createMany({
        data: mediaData
      });
    }

    const fullProperty = await prisma.property.findUnique({
      where: { id: property.id },
      include: { media: true }
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully!',
      data: fullProperty
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property.'
    });
  }
};

// Update property (admin only)
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      category,
      description,
      price,
      address,
      latitude,
      longitude,
      status
    } = req.body;

    const existing = await prisma.property.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (address) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (status) updateData.status = status;

    const property = await prisma.property.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const mediaData = req.files.map(file => ({
        propertyId: property.id,
        mediaUrl: `/uploads/${file.filename}`,
        mediaType: file.mimetype.startsWith('video') ? 'video' : 'image'
      }));

      await prisma.propertyMedia.createMany({
        data: mediaData
      });
    }

    const fullProperty = await prisma.property.findUnique({
      where: { id: property.id },
      include: { media: true }
    });

    res.json({
      success: true,
      message: 'Property updated successfully!',
      data: fullProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property.'
    });
  }
};

// Delete property (admin only)
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.property.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.'
      });
    }

    await prisma.property.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Property deleted successfully!'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property.'
    });
  }
};

// Delete single media
const deleteMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;

    await prisma.propertyMedia.delete({
      where: { id: parseInt(mediaId) }
    });

    res.json({
      success: true,
      message: 'Media deleted.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete media.'
    });
  }
};

// Toggle bookmark
const toggleBookmark = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId: parseInt(propertyId)
        }
      }
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id }
      });
      return res.json({
        success: true,
        bookmarked: false,
        message: 'Bookmark removed.'
      });
    }

    await prisma.bookmark.create({
      data: {
        userId,
        propertyId: parseInt(propertyId)
      }
    });

    res.json({
      success: true,
      bookmarked: true,
      message: 'Property bookmarked!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark.'
    });
  }
};

// Get user bookmarks
const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        property: {
          include: { media: true }
        }
      }
    });

    res.json({
      success: true,
      data: bookmarks.map(b => b.property)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmarks.'
    });
  }
};

module.exports = {
  getProperties,
  getFeaturedProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  deleteMedia,
  toggleBookmark,
  getBookmarks
};