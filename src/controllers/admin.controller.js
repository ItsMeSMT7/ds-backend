// backend/src/controllers/admin.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProperties,
      totalRental,
      totalSale,
      totalSold,
      totalRented,
      totalAvailable,
      totalOnHold,
      totalLand,
      totalFlat,
      totalBungalow,
      totalShop
    ] = await Promise.all([
      prisma.user.count({ where: { role: 1 } }),
      prisma.property.count(),
      prisma.property.count({ where: { category: 'rent' } }),
      prisma.property.count({ where: { category: 'sale' } }),
      prisma.property.count({ where: { status: 'sold' } }),
      prisma.property.count({ where: { status: 'rented' } }),
      prisma.property.count({ where: { status: 'available' } }),
      prisma.property.count({ where: { status: 'on_hold' } }),
      prisma.property.count({ where: { type: 'land' } }),
      prisma.property.count({ where: { type: 'flat' } }),
      prisma.property.count({ where: { type: 'bungalow' } }),
      prisma.property.count({ where: { type: 'shop' } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        totalRental,
        totalSale,
        totalSold,
        totalRented,
        totalAvailable,
        totalOnHold,
        byType: {
          land: totalLand,
          flat: totalFlat,
          bungalow: totalBungalow,
          shop: totalShop
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics.'
    });
  }
};

// Get all properties for admin (including sold)
const getAllProperties = async (req, res) => {
  try {
    const { type, status, category, page = 1, limit = 20 } = req.query;

    const where = {};
    if (type && type !== 'all') where.type = type;
    if (status && status !== 'all') where.status = status;
    if (category && category !== 'all') where.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: { media: true },
        orderBy: { createdAt: 'desc' },
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
    console.error('Admin properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties.'
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 1 },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users.'
    });
  }
};

module.exports = { getDashboardStats, getAllProperties, getAllUsers };