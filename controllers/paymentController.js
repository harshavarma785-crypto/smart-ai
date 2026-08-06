import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a Razorpay order for a given product and log it in Supabase
export const createOrder = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id || req.user._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (error || !product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Razorpay expects the amount in paise (smallest INR unit)
    const amountPaise = Math.round(Number(product.price) * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    const { error: insertError } = await supabase.from('orders').insert([
      {
        user_id: userId,
        product_id: product.id,
        razorpay_order_id: order.id,
        amount: product.price,
        status: 'created',
      },
    ]);

    if (insertError) {
      console.error('Order log insert error:', insertError);
      // Non-fatal: continue, payment can still proceed even if logging failed
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        productName: product.name,
      },
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// Verify the payment signature Razorpay returns after checkout completes
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, verified: false, message: 'Missing payment details' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', razorpay_order_id);

      return res.status(400).json({ success: false, verified: false, message: 'Payment verification failed' });
    }

    await supabase
      .from('orders')
      .update({ status: 'paid', razorpay_payment_id })
      .eq('razorpay_order_id', razorpay_order_id);

    return res.status(200).json({ success: true, verified: true });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return res.status(500).json({ success: false, verified: false, message: 'Payment verification error' });
  }
};

// List the logged-in user's own order history
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, products(name, image_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }

    return res.status(200).json({ success: true, data: orders || [] });
  } catch (error) {
    console.error('Get My Orders Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};
