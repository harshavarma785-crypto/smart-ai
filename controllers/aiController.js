import { supabase } from '../config/supabase.js';

// ------------------------------------------------------------------
// Live exchange rate helper (grounds currency answers in real data
// instead of letting the model guess/hallucinate a rate)
// ------------------------------------------------------------------
let rateCache = { rates: null, fetchedAt: 0 };
const RATE_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Fallback rates used only if the live lookup fails (approximate, INR base)
const FALLBACK_RATES = {
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  KWD: 0.0037, // Kuwaiti Dinar
  BHD: 0.0045, // Bahraini Dinar
  JOD: 0.0085, // Jordanian Dinar
  SAR: 0.045,
};

const getExchangeRates = async () => {
  const now = Date.now();
  if (rateCache.rates && now - rateCache.fetchedAt < RATE_CACHE_TTL_MS) {
    return rateCache.rates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/INR');
    const data = await res.json();
    if (data && data.result === 'success' && data.rates) {
      rateCache = { rates: data.rates, fetchedAt: now };
      return data.rates;
    }
    throw new Error('Unexpected exchange rate response');
  } catch (err) {
    console.warn('Live exchange rate fetch failed, using fallback rates:', err.message);
    return FALLBACK_RATES;
  }
};

const buildRateBlock = (rates) => {
  // Only surface currencies we actually trust / are commonly asked about
  const relevant = ['USD', 'EUR', 'GBP', 'AED', 'KWD', 'BHD', 'JOD', 'SAR'];
  const labels = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    AED: 'UAE Dirham',
    KWD: 'Kuwaiti Dinar',
    BHD: 'Bahraini Dinar',
    JOD: 'Jordanian Dinar',
    SAR: 'Saudi Riyal',
  };
  return relevant
    .filter((code) => rates[code] !== undefined)
    .map((code) => `1 INR = ${rates[code]} ${code} (${labels[code]})`)
    .join('\n');
};

// ------------------------------------------------------------------
// Fallback AI generator when the Groq API is unavailable or errors
// ------------------------------------------------------------------
const generateFallbackResponse = (message, products) => {
  const lowerMsg = message.toLowerCase();

  const matchedProducts = products.filter(
    (p) =>
      lowerMsg.includes(p.name.toLowerCase()) ||
      lowerMsg.includes(p.category.toLowerCase()) ||
      p.tags.some((tag) => lowerMsg.includes(tag.toLowerCase()))
  );

  if (matchedProducts.length > 0) {
    const p = matchedProducts[0];
    return `Based on your request, I highly recommend checking out **${p.name}** in our ${p.category} collection (₹${Number(p.price).toLocaleString('en-IN')}). ${p.description}`;
  }

  // Heuristic: message looks like it's asking whether we carry / sell a specific item
  const soundsLikeProductQuery = /\b(do you have|do you sell|is there|got any|looking for|want to buy|available)\b/.test(
    lowerMsg
  );

  if (soundsLikeProductQuery && products.length > 0) {
    const categories = [...new Set(products.map((p) => p.category))].join(', ');
    return `We don't currently carry that item in our store. Here's what we do offer: ${categories}. Let me know if you'd like recommendations from any of those categories!`;
  }

  if (products.length > 0) {
    const topProduct = products[0];
    return `Hello! SmartSupport AI is here to assist you. Explore our top item, **${topProduct.name}** (₹${Number(topProduct.price).toLocaleString('en-IN')}) rated ${topProduct.rating}/5 stars! How else may I help you today?`;
  }

  return 'Thank you for reaching out to SmartSupport AI! How can I assist you with our products and services today?';
};

// ------------------------------------------------------------------
// Groq chat completion call (OpenAI-compatible API, no SDK needed)
// ------------------------------------------------------------------
const callGroq = async (prompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return null;
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You are SmartSupport AI, a friendly and precise e-commerce customer support assistant. Follow the instructions given to you exactly, especially around only referencing real catalog products and only using provided exchange rates.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
};

export const chat = async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id || req.user._id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Retrieve active product catalog from Supabase
    const { data: rawProducts } = await supabase.from('products').select('*');
    const products = (rawProducts || []).map((p) => ({
      ...p,
      _id: p.id,
      imageUrl: p.image_url ?? p.imageUrl ?? '',
      createdAt: p.created_at ?? p.createdAt,
    }));

    // Retrieve or initialize chat history from Supabase
    let { data: chatRecord } = await supabase
      .from('chat_histories')
      .select('id, user_id, messages(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!chatRecord) {
      const { data: newRecord } = await supabase
        .from('chat_histories')
        .insert([{ user_id: userId }])
        .select('id, user_id')
        .single();
      chatRecord = { ...newRecord, messages: [] };
    }

    // Format products for AI context (prices in INR — the store's base currency)
    const catalogContext = products
      .map(
        (p) =>
          `- ID: ${p.id} | Name: ${p.name} | Category: ${p.category} | Price: ₹${p.price} | Rating: ${p.rating}/5 | Stock: ${p.stock} | Tags: ${p.tags.join(', ')} | Description: ${p.description}`
      )
      .join('\n');

    // Format recent chat history (last 6 messages)
    const recentMessages = chatRecord.messages || [];
    const sortedMessages = [...recentMessages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const recentHistory = sortedMessages
      .slice(-6)
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n');

    // Live exchange rates so currency-conversion answers are grounded, not guessed
    const rates = await getExchangeRates();
    const rateBlock = buildRateBlock(rates);

    const prompt = `You are SmartSupport AI, an expert e-commerce customer experience assistant for a store that prices everything in Indian Rupees (INR / ₹).
User Name: ${req.user.name}
User Role: ${req.user.role}

Product Catalog (this is the COMPLETE and ONLY list of products the store sells):
${catalogContext || 'No products currently in stock.'}

Current Exchange Rates (use ONLY these for currency conversion — do not estimate):
${rateBlock}

Recent Conversation History:
${recentHistory || 'No previous history.'}

Customer's Query: "${message}"
Additional Context: ${context || 'None'}

Instructions:
1. Provide a friendly, polite, professional, and personalized response.
2. ONLY recommend or reference products that literally appear in the Product Catalog above. NEVER invent, assume, or hallucinate a product, brand, or variant that is not listed.
3. If the customer asks about a specific product, brand, or item that is NOT present in the Product Catalog, clearly and honestly say it isn't available in the store right now. Then suggest the closest matching alternative from the actual catalog if one reasonably exists, or invite them to browse the available categories. Do not soften this into a vague non-answer — be direct that it's unavailable.
4. If the customer asks a general usage question about a catalog product (how to use it, how to wear it, how to set it up, care/maintenance instructions, sizing, etc.), answer helpfully using the product's description plus general knowledge appropriate for that category of item.
5. If the customer asks for a price in a currency other than INR, convert the relevant product's price using ONLY the exchange rates provided above, and show your result rounded sensibly (e.g. "approximately 45 USD"). If they ask for a currency not in the provided list, say you don't have a live rate for that currency right now rather than guessing, and suggest they check a currency converter for the latest rate.
6. Be concise yet helpful. Answer questions directly.`;

    let botText = '';

    try {
      const groqResponse = await callGroq(prompt);
      if (groqResponse) {
        botText = groqResponse;
      }
    } catch (groqError) {
      console.warn('Groq API notice (using intelligent fallback):', groqError.message);
    }

    if (!botText) {
      botText = generateFallbackResponse(message, products);
    }

    // Save user & bot messages into Supabase messages table
    await supabase.from('messages').insert([
      { chat_history_id: chatRecord.id, sender: 'user', text: message },
      { chat_history_id: chatRecord.id, sender: 'bot', text: botText },
    ]);

    const { data: updatedMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_history_id', chatRecord.id)
      .order('timestamp', { ascending: true });

    // Identify recommended products based on bot response or query keywords
    const recommendedProducts = products
      .filter(
        (p) =>
          botText.toLowerCase().includes(p.name.toLowerCase()) ||
          message.toLowerCase().includes(p.category.toLowerCase()) ||
          p.tags.some((tag) => message.toLowerCase().includes(tag.toLowerCase()))
      )
      .slice(0, 3);

    return res.status(200).json({
      success: true,
      data: {
        response: botText,
        recommendedProducts,
        history: updatedMessages || [],
      },
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing AI chat request',
    });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const { data: rawProducts } = await supabase.from('products').select('*');
    const products = (rawProducts || []).map((p) => ({
      ...p,
      _id: p.id,
      imageUrl: p.image_url ?? p.imageUrl ?? '',
      createdAt: p.created_at ?? p.createdAt,
    }));

    const { data: chatRecord } = await supabase
      .from('chat_histories')
      .select('id, user_id, messages(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!products.length) {
      return res.status(200).json({ success: true, recommendations: [] });
    }

    // If user has chat history, try to extract interest tags
    let userInterests = [];
    const messages = chatRecord?.messages || [];
    if (messages.length > 0) {
      const allText = messages.map((m) => m.text).join(' ').toLowerCase();
      userInterests = products.filter(
        (p) =>
          allText.includes(p.category.toLowerCase()) ||
          p.tags.some((tag) => allText.includes(tag.toLowerCase()))
      );
    }

    // Priority: matched products -> top rated products
    let recommendations = [...userInterests];
    if (recommendations.length < 3) {
      const topRated = [...products].sort((a, b) => b.rating - a.rating);
      for (const p of topRated) {
        if (!recommendations.some((item) => item.id === p.id)) {
          recommendations.push(p);
        }
        if (recommendations.length >= 4) break;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, 4),
        user: req.user.name,
      },
    });
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
};
