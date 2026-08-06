import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { formatINR } from '../utils/currency';
import { Search, Sparkles, ShoppingBag, ShieldCheck, Zap, HeartHandshake, ArrowRight, Star } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const suggestionPills = [
    'Best wireless headphones',
    'Budget tech under ₹5,000',
    'Smart fitness watches',
    'Office & desk lighting',
  ];

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get('/products');
        if (res.data.success && res.data.data.length > 0) {
          setFeaturedProducts(res.data.data.slice(0, 4));
        } else {
          // Auto seed if empty
          const seedRes = await api.post('/products/seed');
          if (seedRes.data.success) {
            setFeaturedProducts(seedRes.data.data.slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Error fetching home products:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/chat?query=${encodeURIComponent(query)}`);
    }
  };

  const handlePillClick = (pillText) => {
    navigate(`/chat?query=${encodeURIComponent(pillText)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/60 via-slate-50 to-slate-50 border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI-Powered Customer Assistant
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Shopping made effortless with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">SmartSupport AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Find the right products, ask questions in natural everyday language, and enjoy instant personalized recommendations.
          </p>

          {/* Interactive Search Query Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-lg shadow-blue-900/5 rounded-2xl bg-white border border-slate-200 p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <Search className="w-6 h-6 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="What are you looking for today?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-base bg-transparent px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-sm"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Clickable Suggestion Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-slate-500 mr-1">Popular searches:</span>
              {suggestionPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePillClick(pill)}
                  className="text-xs bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 border border-slate-200/80 px-3 py-1.5 rounded-full shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
            <p className="text-slate-600 text-sm">Explore our top-rated items curated for you</p>
          </div>
          <Link
            to="/shop"
            className="text-blue-600 font-semibold text-sm hover:text-blue-700 flex items-center gap-1"
          >
            View all products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200/60 p-4 flex flex-col justify-between">
                <div className="bg-slate-200 h-40 rounded-xl mb-4"></div>
                <div className="bg-slate-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-slate-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id || product._id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center p-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <ShoppingBag className="w-12 h-12 text-slate-300" />
                    )}
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                      {product.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-medium mb-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{product.rating} / 5</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{product.name}</h3>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{product.description}</p>
                  </div>
                </div>
                
                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-slate-900">{formatINR(product.price)}</span>
                  <button
                    onClick={() => navigate(`/chat?query=${encodeURIComponent(`Tell me about ${product.name}`)}`)}
                    className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-3 py-2 rounded-xl border border-blue-200 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Ask AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Benefit Cards Section */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Why Customers Love SmartSupport AI</h2>
            <p className="text-slate-600 text-sm mt-2">Built for simple, enjoyable, and helpful shopping experiences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Instant 24/7 Support</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Get immediate, friendly answers to product questions without long waiting times or complicated menus.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Smart Product Matching</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Our AI understands what you need and suggests items tailored specifically to your taste and budget.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Friendly & Conversational</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                No technical jargon or rigid syntax—just talk naturally like you would with an in-store assistant.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
