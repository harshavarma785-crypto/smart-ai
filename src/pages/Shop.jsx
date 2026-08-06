import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';
import { Search, Sparkles, ShoppingBag, Star, Filter, CheckCircle, Package, CreditCard } from 'lucide-react';

const Shop = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [payingProductId, setPayingProductId] = useState(null);

  const categories = ['All', 'Audio', 'Wearables', 'Electronics', 'Smart Home', 'Lifestyle', 'Demo'];

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/products';
      if (activeCategory !== 'All') {
        url += `?category=${encodeURIComponent(activeCategory)}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching shop products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const handleBuyNow = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (typeof window.Razorpay === 'undefined') {
      alert('Payment system is still loading — please try again in a moment.');
      return;
    }

    setPayingProductId(product.id || product._id);
    try {
      const res = await api.post('/payments/create-order', { productId: product.id || product._id });
      if (!res.data.success) {
        alert(res.data.message || 'Could not start payment');
        return;
      }

      const { orderId, amount, currency, keyId, productName } = res.data.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'SmartSupport AI Store',
        description: `Purchase: ${productName}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', response);
            if (verifyRes.data.verified) {
              alert(`Payment successful! Thank you for purchasing ${productName}.`);
            } else {
              alert('We could not verify that payment. Please contact support if money was deducted.');
            }
          } catch (verifyErr) {
            console.error('Verify error:', verifyErr);
            alert('Payment verification failed. Please contact support if money was deducted.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => setPayingProductId(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Buy Now error:', err);
      alert('Something went wrong starting the payment. Please try again.');
    } finally {
      setPayingProductId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Explore Our Catalog</h1>
          <p className="text-slate-600 text-sm mt-1">Discover high-quality electronics, wearables, audio, and smart home essentials</p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by keyword or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200 p-4 flex flex-col justify-between">
                <div className="bg-slate-200 h-44 rounded-xl mb-4"></div>
                <div className="bg-slate-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-slate-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            {search.trim() ? (
              <>
                <h3 className="text-lg font-bold text-slate-800">"{search}" is not available in our store</h3>
                <p className="text-sm text-slate-500 mt-1">We couldn't find any product matching that search. Try a different keyword, or browse by category above.</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-800">No products found</h3>
                <p className="text-sm text-slate-500 mt-1">Try tweaking your search term or category filter.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id || product._id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Image Container */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center p-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <ShoppingBag className="w-12 h-12 text-slate-300" />
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                      {product.category}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-amber-500 font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{product.rating} / 5</span>
                      </div>
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> In Stock ({product.stock})
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{product.name}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-3 gap-2">
                  <div>
                    <span className="text-xs text-slate-400 block">Price</span>
                    <span className="text-lg font-bold text-slate-900">{formatINR(product.price)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/chat?query=${encodeURIComponent(`Tell me more about ${product.name} and why I should buy it`)}`)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-2 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                      title="Ask AI"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleBuyNow(product)}
                      disabled={payingProductId === (product.id || product._id)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-3.5 py-2 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {payingProductId === (product.id || product._id) ? 'Starting...' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
