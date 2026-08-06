import { supabase } from '../config/supabase.js';

const formatProduct = (p) => ({
  ...p,
  _id: p.id,
  imageUrl: p.image_url ?? p.imageUrl ?? '',
  createdAt: p.created_at ?? p.createdAt,
});

export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Get Products Supabase Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }

    const formattedProducts = (products || []).map(formatProduct);
    return res.status(200).json({ success: true, count: formattedProducts.length, data: formattedProducts });
  } catch (error) {
    console.error('Get Products Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: formatProduct(product) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, stock, tags, rating, imageUrl } = req.body;

    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          description,
          category,
          price: Number(price),
          stock: stock !== undefined ? Number(stock) : 0,
          tags: Array.isArray(tags) ? tags : [],
          rating: rating !== undefined ? Number(rating) : 0,
          image_url: imageUrl || '',
        },
      ])
      .select()
      .single();

    if (error || !product) {
      return res.status(400).json({ success: false, message: error?.message || 'Failed to create product' });
    }

    return res.status(201).json({ success: true, data: formatProduct(product) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const seedProducts = async (req, res) => {
  try {
    const sampleProducts = [
      {
        name: 'AuraSound Wireless Noise-Canceling Headphones',
        description: 'Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear acoustic sound.',
        category: 'Audio',
        price: 15999,
        stock: 45,
        tags: ['audio', 'wireless', 'headphones', 'noise-canceling'],
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      },
      {
        name: 'PulseFit Pro Smartwatch',
        description: 'Advanced fitness smartwatch with continuous heart rate monitor, AMOLED touch display, GPS tracking, and 7-day battery life.',
        category: 'Wearables',
        price: 11999,
        stock: 30,
        tags: ['fitness', 'smartwatch', 'wearables', 'health'],
        rating: 4.6,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      },
      {
        name: 'LuminaSmart RGB LED Desk Lamp',
        description: 'Ergonomic LED desk light featuring wireless smartphone charging base, touch control, customizable color temperatures, and energy saving.',
        category: 'Smart Home',
        price: 4999,
        stock: 60,
        tags: ['lighting', 'smart home', 'desk', 'office'],
        rating: 4.5,
        imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=500',
      },
      {
        name: 'Veloce Ultra-Slim Mechanical Keyboard',
        description: 'Compact 75% layout wireless mechanical keyboard with hot-swappable switches, RGB backlight, and multi-device Bluetooth pairing.',
        category: 'Electronics',
        price: 9499,
        stock: 25,
        tags: ['keyboard', 'gaming', 'pc', 'mechanical'],
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
      },
      {
        name: 'EcoHydro Insulated Smart Water Bottle',
        description: 'Double-wall stainless steel water bottle with LED temperature indicator touch cap and hydration reminder alerts.',
        category: 'Lifestyle',
        price: 2999,
        stock: 80,
        tags: ['fitness', 'hydration', 'bottle', 'eco'],
        rating: 4.4,
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
      },
      {
        name: 'VisionX 4K Ultra HD Streaming Camera',
        description: '1080p/4K high-definition webcam with auto-focus, dual noise-canceling stereo mics, and privacy shutter for streaming and conferencing.',
        category: 'Electronics',
        price: 6999,
        stock: 40,
        tags: ['camera', 'webcam', 'streaming', 'electronics'],
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
      },
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

    // Clear existing products table
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const formattedSeed = sampleProducts.map((p) => ({
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      stock: p.stock,
      tags: p.tags,
      rating: p.rating,
      image_url: p.imageUrl,
    }));

    const { data: inserted, error } = await supabase.from('products').insert(formattedSeed).select();

    if (error) {
      console.error('Seed Supabase Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to seed products' });
    }

    const formatted = (inserted || []).map(formatProduct);
    return res.status(201).json({
      success: true,
      message: 'Products seeded successfully',
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('Seed Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to seed products' });
  }
};
