// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@brokerpro.com' },
    update: {},
    create: {
      name: 'Admin Broker',
      email: 'admin@brokerpro.com',
      phone: '9999999999',
      password: hashedPassword,
      role: 2
    }
  });

  console.log('Admin created:', admin.email);

  // Create sample properties
  const properties = [
    {
      name: 'Luxury 3BHK Apartment in Downtown',
      type: 'flat',
      category: 'sale',
      description: 'Beautiful 3BHK apartment with modern amenities, swimming pool, gym, and 24/7 security. Located in the heart of the city with excellent connectivity.',
      price: 8500000,
      address: '123 Downtown Avenue, Mumbai, Maharashtra',
      latitude: 19.076,
      longitude: 72.8777,
      status: 'available'
    },
    {
      name: 'Spacious Bungalow with Garden',
      type: 'bungalow',
      category: 'sale',
      description: 'A magnificent 4BHK bungalow spread across 3000 sq ft with a beautiful garden, parking space, and modern interiors.',
      price: 25000000,
      address: '456 Green Valley Road, Pune, Maharashtra',
      latitude: 18.5204,
      longitude: 73.8567,
      status: 'available'
    },
    {
      name: 'Commercial Shop in Prime Location',
      type: 'shop',
      category: 'rent',
      description: 'Well-maintained commercial shop in a busy market area. Ground floor with good footfall and visibility.',
      price: 45000,
      address: '789 Market Street, Delhi',
      latitude: 28.7041,
      longitude: 77.1025,
      status: 'available'
    },
    {
      name: 'Premium Land Plot',
      type: 'land',
      category: 'sale',
      description: 'A prime land plot of 5000 sq ft in a developing area. Clear title, ready for construction. All amenities nearby.',
      price: 15000000,
      address: '321 Highway Road, Bangalore, Karnataka',
      latitude: 12.9716,
      longitude: 77.5946,
      status: 'available'
    },
    {
      name: '2BHK Flat for Rent Near Metro',
      type: 'flat',
      category: 'rent',
      description: 'Furnished 2BHK flat near metro station. Includes modular kitchen, AC, and parking. Perfect for families.',
      price: 25000,
      address: '567 Metro Lane, Hyderabad, Telangana',
      latitude: 17.385,
      longitude: 78.4867,
      status: 'available'
    },
    {
      name: 'Modern Studio Apartment',
      type: 'flat',
      category: 'rent',
      description: 'A cozy studio apartment ideal for working professionals. Fully furnished with all modern amenities.',
      price: 15000,
      address: '890 Tech Park Road, Bangalore, Karnataka',
      latitude: 12.9352,
      longitude: 77.6245,
      status: 'rented'
    }
  ];

  for (const prop of properties) {
    await prisma.property.create({ data: prop });
  }

  console.log(`${properties.length} sample properties created.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });