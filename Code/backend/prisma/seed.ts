import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'spirits' }, update: {}, create: { name: 'Spirits', slug: 'spirits', sortOrder: 1 } }),
    prisma.category.upsert({ where: { slug: 'beer' }, update: {}, create: { name: 'Beer', slug: 'beer', sortOrder: 2 } }),
    prisma.category.upsert({ where: { slug: 'wine' }, update: {}, create: { name: 'Wine', slug: 'wine', sortOrder: 3 } }),
    prisma.category.upsert({ where: { slug: 'mixers' }, update: {}, create: { name: 'Mixers & Seltzers', slug: 'mixers', sortOrder: 4 } }),
    prisma.category.upsert({ where: { slug: 'cider' }, update: {}, create: { name: 'Cider', slug: 'cider', sortOrder: 5 } }),
  ]);
  const [spirits, beer, wine, mixers] = categories;
  console.log('✓ Categories');

  // Products
  const products = await Promise.all([
    // Spirits
    prisma.product.upsert({ where: { id: 'prod-01' }, update: {}, create: { id: 'prod-01', name: 'Bacardi Superior White Rum', brand: 'Bacardi', size: '750ml', abv: 40, type: 'Rum', country: 'Puerto Rico', categoryId: spirits.id, description: 'Light and dry with subtle floral notes.' } }),
    prisma.product.upsert({ where: { id: 'prod-02' }, update: {}, create: { id: 'prod-02', name: 'Hendrick\'s Gin', brand: 'Hendrick\'s', size: '750ml', abv: 44, type: 'Gin', country: 'Scotland', categoryId: spirits.id, description: 'Infused with rose and cucumber.' } }),
    prisma.product.upsert({ where: { id: 'prod-03' }, update: {}, create: { id: 'prod-03', name: 'Jose Cuervo Silver Tequila', brand: 'Jose Cuervo', size: '750ml', abv: 40, type: 'Tequila', country: 'Mexico', categoryId: spirits.id, description: 'Smooth blanco tequila, great for margaritas.' } }),
    prisma.product.upsert({ where: { id: 'prod-04' }, update: {}, create: { id: 'prod-04', name: 'Ketel One Vodka', brand: 'Ketel One', size: '750ml', abv: 40, type: 'Vodka', country: 'Netherlands', categoryId: spirits.id, description: 'Crisp, clean, and refreshing.' } }),
    prisma.product.upsert({ where: { id: 'prod-05' }, update: {}, create: { id: 'prod-05', name: 'Maker\'s Mark Bourbon', brand: 'Maker\'s Mark', size: '750ml', abv: 45, type: 'Bourbon', country: 'USA', categoryId: spirits.id, description: 'Soft, full-flavored Kentucky bourbon.' } }),
    prisma.product.upsert({ where: { id: 'prod-06' }, update: {}, create: { id: 'prod-06', name: 'Cointreau Orange Liqueur', brand: 'Cointreau', size: '750ml', abv: 40, type: 'Liqueur', country: 'France', categoryId: spirits.id, description: 'Essential for margaritas and cosmos.' } }),
    prisma.product.upsert({ where: { id: 'prod-07' }, update: {}, create: { id: 'prod-07', name: 'Malibu Coconut Rum', brand: 'Malibu', size: '750ml', abv: 21, type: 'Rum Liqueur', country: 'Barbados', categoryId: spirits.id, description: 'Coconut-flavored Caribbean rum liqueur.' } }),

    // Beer
    prisma.product.upsert({ where: { id: 'prod-08' }, update: {}, create: { id: 'prod-08', name: 'Corona Extra', brand: 'Corona', size: '12-pack 12oz', abv: 4.6, type: 'Lager', country: 'Mexico', categoryId: beer.id, description: 'Light, crisp Mexican lager.' } }),
    prisma.product.upsert({ where: { id: 'prod-09' }, update: {}, create: { id: 'prod-09', name: 'Modelo Especial', brand: 'Modelo', size: '6-pack 12oz', abv: 4.4, type: 'Lager', country: 'Mexico', categoryId: beer.id, description: 'Rich, full-flavored pilsner-style lager.' } }),
    prisma.product.upsert({ where: { id: 'prod-10' }, update: {}, create: { id: 'prod-10', name: 'Blue Moon Belgian White', brand: 'Blue Moon', size: '6-pack 12oz', abv: 5.4, type: 'Wheat Beer', country: 'USA', categoryId: beer.id, description: 'Crafted with Valencia orange peel.' } }),
    prisma.product.upsert({ where: { id: 'prod-11' }, update: {}, create: { id: 'prod-11', name: 'Heineken Lager', brand: 'Heineken', size: '12-pack 12oz', abv: 5.0, type: 'Lager', country: 'Netherlands', categoryId: beer.id, description: 'World-famous Dutch pale lager.' } }),

    // Wine
    prisma.product.upsert({ where: { id: 'prod-12' }, update: {}, create: { id: 'prod-12', name: 'Kim Crawford Sauvignon Blanc', brand: 'Kim Crawford', size: '750ml', abv: 12.5, type: 'White Wine', country: 'New Zealand', categoryId: wine.id, description: 'Crisp citrus and tropical fruit notes.' } }),
    prisma.product.upsert({ where: { id: 'prod-13' }, update: {}, create: { id: 'prod-13', name: 'Meiomi Pinot Noir', brand: 'Meiomi', size: '750ml', abv: 13.5, type: 'Red Wine', country: 'USA', categoryId: wine.id, description: 'Silky smooth with strawberry and blackberry.' } }),
    prisma.product.upsert({ where: { id: 'prod-14' }, update: {}, create: { id: 'prod-14', name: 'La Marca Prosecco', brand: 'La Marca', size: '750ml', abv: 11.0, type: 'Sparkling Wine', country: 'Italy', categoryId: wine.id, description: 'Light and bubbly with honey and cream notes.' } }),

    // Mixers
    prisma.product.upsert({ where: { id: 'prod-15' }, update: {}, create: { id: 'prod-15', name: 'Fever-Tree Ginger Beer', brand: 'Fever-Tree', size: '4-pack 200ml', abv: 0, type: 'Mixer', country: 'UK', categoryId: mixers.id, description: 'Premium ginger beer, perfect for mules.' } }),
    prisma.product.upsert({ where: { id: 'prod-16' }, update: {}, create: { id: 'prod-16', name: 'Fever-Tree Tonic Water', brand: 'Fever-Tree', size: '4-pack 200ml', abv: 0, type: 'Mixer', country: 'UK', categoryId: mixers.id, description: 'Premium Indian tonic water with quinine.' } }),
    prisma.product.upsert({ where: { id: 'prod-17' }, update: {}, create: { id: 'prod-17', name: 'Roses Lime Juice', brand: 'Rose\'s', size: '750ml', abv: 0, type: 'Mixer', country: 'USA', categoryId: mixers.id, description: 'Sweetened lime juice for cocktails.' } }),
    prisma.product.upsert({ where: { id: 'prod-18' }, update: {}, create: { id: 'prod-18', name: 'Mint Simple Syrup', brand: 'Monin', size: '750ml', abv: 0, type: 'Mixer', country: 'France', categoryId: mixers.id, description: 'Mojito-ready mint syrup.' } }),
  ]);
  console.log(`✓ ${products.length} Products`);

  // Admin user
  const adminPass = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@liquorbuddy.com' },
    update: {},
    create: { email: 'admin@liquorbuddy.com', password: adminPass, name: 'Admin', role: 'admin' },
  });
  console.log('✓ Admin user (admin@liquorbuddy.com / admin123)');

  // Stores — scattered around Miami, FL for demo
  const storeData = [
    { id: 'store-01', name: 'Brickell Bottle Shop', address: '1221 Brickell Ave', city: 'Miami', state: 'FL', zip: '33131', phone: '(305) 555-0101', lat: 25.7589, lng: -80.1925, description: 'Premium selection in the heart of Brickell.', hours: JSON.stringify({ mon: '10am-11pm', tue: '10am-11pm', wed: '10am-11pm', thu: '10am-11pm', fri: '10am-12am', sat: '10am-12am', sun: '11am-10pm' }), rating: 4.7, reviewCount: 312 },
    { id: 'store-02', name: 'South Beach Spirits', address: '1500 Collins Ave', city: 'Miami Beach', state: 'FL', zip: '33139', phone: '(305) 555-0202', lat: 25.7816, lng: -80.1303, description: 'Party-ready stock steps from the beach.', hours: JSON.stringify({ mon: '9am-12am', tue: '9am-12am', wed: '9am-12am', thu: '9am-12am', fri: '9am-2am', sat: '9am-2am', sun: '10am-11pm' }), rating: 4.5, reviewCount: 210 },
    { id: 'store-03', name: 'Wynwood Wine & Spirits', address: '2200 NW 2nd Ave', city: 'Miami', state: 'FL', zip: '33127', phone: '(305) 555-0303', lat: 25.7990, lng: -80.1994, description: 'Curated craft selection in the arts district.', hours: JSON.stringify({ mon: 'Closed', tue: '12pm-10pm', wed: '12pm-10pm', thu: '12pm-10pm', fri: '12pm-11pm', sat: '11am-11pm', sun: '12pm-9pm' }), rating: 4.8, reviewCount: 178 },
    { id: 'store-04', name: 'Coconut Grove Liquors', address: '3015 Grand Ave', city: 'Miami', state: 'FL', zip: '33133', phone: '(305) 555-0404', lat: 25.7264, lng: -80.2383, description: 'Neighborhood favorite with great prices.', hours: JSON.stringify({ mon: '10am-10pm', tue: '10am-10pm', wed: '10am-10pm', thu: '10am-10pm', fri: '10am-11pm', sat: '10am-11pm', sun: '11am-9pm' }), rating: 4.3, reviewCount: 95 },
    { id: 'store-05', name: 'Coral Gables Fine Wines', address: '244 Miracle Mile', city: 'Coral Gables', state: 'FL', zip: '33134', phone: '(305) 555-0505', lat: 25.7489, lng: -80.2575, description: 'Extensive wine cellar and premium spirits.', hours: JSON.stringify({ mon: '11am-9pm', tue: '11am-9pm', wed: '11am-9pm', thu: '11am-9pm', fri: '11am-10pm', sat: '10am-10pm', sun: '12pm-8pm' }), rating: 4.9, reviewCount: 430 },
  ];

  for (const s of storeData) {
    await prisma.store.upsert({ where: { id: s.id }, update: {}, create: s });
  }
  console.log(`✓ ${storeData.length} Stores`);

  // Inventory — each store gets a different selection
  const allProducts = await prisma.product.findMany();
  const prodMap = new Map(allProducts.map((p) => [p.id, p]));

  const inventoryData: { storeId: string; productId: string; quantity: number; price: number; featured?: boolean }[] = [
    // Brickell Bottle Shop
    { storeId: 'store-01', productId: 'prod-01', quantity: 24, price: 18.99, featured: true },
    { storeId: 'store-01', productId: 'prod-02', quantity: 8, price: 37.99 },
    { storeId: 'store-01', productId: 'prod-03', quantity: 15, price: 22.99 },
    { storeId: 'store-01', productId: 'prod-04', quantity: 12, price: 29.99 },
    { storeId: 'store-01', productId: 'prod-05', quantity: 6, price: 32.99 },
    { storeId: 'store-01', productId: 'prod-08', quantity: 30, price: 19.99 },
    { storeId: 'store-01', productId: 'prod-09', quantity: 18, price: 11.99 },
    { storeId: 'store-01', productId: 'prod-12', quantity: 10, price: 14.99 },
    { storeId: 'store-01', productId: 'prod-15', quantity: 20, price: 6.99 },
    { storeId: 'store-01', productId: 'prod-16', quantity: 20, price: 6.99 },
    { storeId: 'store-01', productId: 'prod-17', quantity: 12, price: 4.49 },
    { storeId: 'store-01', productId: 'prod-18', quantity: 0, price: 9.99 }, // out of stock

    // South Beach Spirits
    { storeId: 'store-02', productId: 'prod-01', quantity: 40, price: 17.99, featured: true },
    { storeId: 'store-02', productId: 'prod-03', quantity: 25, price: 21.99 },
    { storeId: 'store-02', productId: 'prod-06', quantity: 10, price: 34.99 },
    { storeId: 'store-02', productId: 'prod-07', quantity: 18, price: 19.99 },
    { storeId: 'store-02', productId: 'prod-08', quantity: 48, price: 18.99, featured: true },
    { storeId: 'store-02', productId: 'prod-09', quantity: 24, price: 10.99 },
    { storeId: 'store-02', productId: 'prod-10', quantity: 12, price: 11.49 },
    { storeId: 'store-02', productId: 'prod-11', quantity: 36, price: 17.99 },
    { storeId: 'store-02', productId: 'prod-14', quantity: 15, price: 15.99 },
    { storeId: 'store-02', productId: 'prod-15', quantity: 24, price: 6.49 },
    { storeId: 'store-02', productId: 'prod-16', quantity: 24, price: 6.49 },
    { storeId: 'store-02', productId: 'prod-17', quantity: 8, price: 4.29 },
    { storeId: 'store-02', productId: 'prod-18', quantity: 14, price: 9.49 },

    // Wynwood Wine & Spirits
    { storeId: 'store-03', productId: 'prod-02', quantity: 5, price: 39.99, featured: true },
    { storeId: 'store-03', productId: 'prod-04', quantity: 7, price: 31.99 },
    { storeId: 'store-03', productId: 'prod-05', quantity: 9, price: 34.99 },
    { storeId: 'store-03', productId: 'prod-10', quantity: 14, price: 10.99 },
    { storeId: 'store-03', productId: 'prod-12', quantity: 8, price: 13.99, featured: true },
    { storeId: 'store-03', productId: 'prod-13', quantity: 6, price: 17.99 },
    { storeId: 'store-03', productId: 'prod-14', quantity: 11, price: 14.99 },
    { storeId: 'store-03', productId: 'prod-15', quantity: 16, price: 7.29 },
    { storeId: 'store-03', productId: 'prod-16', quantity: 16, price: 7.29 },

    // Coconut Grove Liquors
    { storeId: 'store-04', productId: 'prod-01', quantity: 20, price: 16.99 },
    { storeId: 'store-04', productId: 'prod-03', quantity: 18, price: 20.99 },
    { storeId: 'store-04', productId: 'prod-07', quantity: 10, price: 18.99 },
    { storeId: 'store-04', productId: 'prod-08', quantity: 36, price: 17.99, featured: true },
    { storeId: 'store-04', productId: 'prod-09', quantity: 0, price: 10.49 }, // out of stock
    { storeId: 'store-04', productId: 'prod-11', quantity: 24, price: 16.99 },
    { storeId: 'store-04', productId: 'prod-13', quantity: 5, price: 16.99 },
    { storeId: 'store-04', productId: 'prod-15', quantity: 12, price: 6.99 },
    { storeId: 'store-04', productId: 'prod-17', quantity: 9, price: 4.49 },
    { storeId: 'store-04', productId: 'prod-18', quantity: 7, price: 9.99 },

    // Coral Gables Fine Wines
    { storeId: 'store-05', productId: 'prod-02', quantity: 6, price: 38.99 },
    { storeId: 'store-05', productId: 'prod-04', quantity: 10, price: 30.99 },
    { storeId: 'store-05', productId: 'prod-05', quantity: 8, price: 33.99, featured: true },
    { storeId: 'store-05', productId: 'prod-06', quantity: 4, price: 33.99 },
    { storeId: 'store-05', productId: 'prod-12', quantity: 14, price: 12.99, featured: true },
    { storeId: 'store-05', productId: 'prod-13', quantity: 9, price: 16.99 },
    { storeId: 'store-05', productId: 'prod-14', quantity: 20, price: 13.99, featured: true },
    { storeId: 'store-05', productId: 'prod-15', quantity: 18, price: 6.99 },
    { storeId: 'store-05', productId: 'prod-16', quantity: 18, price: 6.99 },
  ];

  for (const item of inventoryData) {
    const existing = await prisma.storeInventory.findUnique({
      where: { storeId_productId: { storeId: item.storeId, productId: item.productId } },
    });
    if (!existing) {
      await prisma.storeInventory.create({
        data: { ...item, inStock: item.quantity > 0 },
      });
    }
  }
  console.log(`✓ ${inventoryData.length} Inventory items`);

  console.log('\n🍾 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
