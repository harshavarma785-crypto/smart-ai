import 'dotenv/config';
import { supabase } from './config/db.js';

const products = [
  // Electronics
  {
    name: 'Veloce Ultra-Slim Mechanical Keyboard',
    description: 'Compact 75% layout wireless mechanical keyboard with hot-swappable tactile switches, RGB backlighting, and multi-device Bluetooth 5.0.',
    category: 'Electronics',
    price: 9499,
    stock: 35,
    tags: ['keyboard', 'electronics', 'gaming', 'pc'],
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
  },
  {
    name: 'VisionX 4K Ultra HD Streaming Camera',
    description: 'High-definition 4K webcam with AI autofocus, dual noise-canceling microphones, HDR enhancement, and a built-in privacy shutter.',
    category: 'Electronics',
    price: 6999,
    stock: 45,
    tags: ['camera', 'webcam', 'electronics', 'streaming'],
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
  },
  {
    name: 'AuraSound Wireless Headphones',
    description: 'Over-ear active noise-canceling headphones with 40mm drivers, 30-hour battery playback, and plush memory foam ear cushions.',
    category: 'Electronics',
    price: 15999,
    stock: 25,
    tags: ['audio', 'headphones', 'wireless', 'electronics'],
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  },
  {
    name: 'PulseFit Pro Smartwatch',
    description: 'Advanced fitness tracking smartwatch featuring continuous heart rate monitor, SPO2 sensor, AMOLED display, and 7-day battery life.',
    category: 'Electronics',
    price: 11999,
    stock: 50,
    tags: ['smartwatch', 'wearables', 'fitness', 'electronics'],
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
  },

  // Home
  {
    name: 'LuminaSmart RGB LED Desk Lamp',
    description: 'Modern dimmable desk lamp with wireless smartphone charging base, touch control panel, customizable color temperature, and timer settings.',
    category: 'Home',
    price: 4999,
    stock: 60,
    tags: ['lighting', 'home', 'office', 'desk'],
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=500',
  },
  {
    name: 'ZenMist Ultrasonic Essential Oil Diffuser',
    description: 'Aromatherapy smart diffuser with ambient LED nightlight, ultra-quiet operation, auto shut-off, and mist output timer options.',
    category: 'Home',
    price: 2799,
    stock: 40,
    tags: ['home', 'wellness', 'diffuser', 'aromatherapy'],
    rating: 4.4,
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500',
  },
  {
    name: 'ErgoComfort Memory Foam Seat Cushion',
    description: 'Orthopedic memory foam cushion designed for lumbar support, pressure relief, and ergonomic posture during long office hours.',
    category: 'Home',
    price: 3499,
    stock: 30,
    tags: ['home', 'office', 'ergonomic', 'cushion'],
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
  },

  // Fashion
  {
    name: 'UrbanFlex Premium Organic Cotton Hoodie',
    description: 'Ultra-soft 100% organic cotton fleece hoodie featuring a double-lined hood, relaxed drop-shoulder fit, and reinforced ribbed cuffs.',
    category: 'Fashion',
    price: 5499,
    stock: 75,
    tags: ['fashion', 'apparel', 'hoodie', 'streetwear'],
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500',
  },
  {
    name: 'Minimalist RFID Slim Leather Wallet',
    description: 'Handcrafted top-grain leather minimalist bi-fold wallet equipped with RFID blocking shield and quick-access card pull-tab.',
    category: 'Fashion',
    price: 2999,
    stock: 100,
    tags: ['fashion', 'accessories', 'wallet', 'leather'],
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
  },
  {
    name: 'Nomad Canvas Weatherproof Backpack',
    description: 'Durable water-resistant canvas laptop backpack featuring padded 15.6" laptop compartment, ergonomic shoulder straps, and hidden travel pockets.',
    category: 'Fashion',
    price: 6999,
    stock: 20,
    tags: ['fashion', 'backpack', 'travel', 'bags'],
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
  },

  // Demo
  {
    name: 'Demo Product — Test Purchase',
    description: 'A ₹1 demo item so you can test the full checkout and payment flow end to end before real products go live.',
    category: 'Demo',
    price: 1,
    stock: 999,
    tags: ['demo', 'test', 'sample'],
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=500',
  },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');

    console.log('Clearing existing product catalog...');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log(`Seeding ${products.length} e-commerce products (prices in INR)...`);
    const formattedSeed = products.map((p) => ({
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      stock: p.stock,
      tags: p.tags,
      rating: p.rating,
      image_url: p.imageUrl,
    }));

    const { data, error } = await supabase.from('products').insert(formattedSeed).select();

    if (error) {
      throw error;
    }

    console.log(`Successfully seeded ${data ? data.length : 0} products into Supabase PostgreSQL database!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
