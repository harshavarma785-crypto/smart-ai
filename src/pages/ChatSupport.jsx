import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatINR } from '../utils/currency';
import { Bot, Send, Sparkles, Loader2, ShoppingBag, Star, RefreshCw, MessageSquare } from 'lucide-react';

const ChatSupport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRecommendations();
    if (initialQuery) {
      handleSend(initialQuery);
    } else {
      setMessages([
        {
          sender: 'bot',
          text: `Hello ${user?.name || 'there'}! I'm SmartSupport AI. Ask me anything about our products, recommendations, or order inquiries!`,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/ai/recommendations');
      if (res.data.success && res.data.data.recommendations) {
        setRecommendedProducts(res.data.data.recommendations);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || inputMsg;
    if (!query.trim()) return;

    const userMessage = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: query });
      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: res.data.data.response },
        ]);

        if (res.data.data.recommendedProducts && res.data.data.recommendedProducts.length > 0) {
          setRecommendedProducts(res.data.data.recommendedProducts);
        }
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'I apologize, but I experienced a momentary glitch. Please feel free to rephrase or try again!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[85vh]">
        
        {/* Left Side: Conversational Chat Panel */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-base">SmartSupport AI Assistant</h2>
                <p className="text-xs text-blue-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Personalized customer care
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchRecommendations()}
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Refresh Recommendations"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Suggestions
            </button>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-slate-500 text-xs py-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <Bot className="w-5 h-5 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200/80 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Analyzing products & crafting response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Ask about recommendations, features, price comparisons..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !inputMsg.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium px-5 py-3 rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Recommended Product Cards */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recommended Items</h3>
              <p className="text-slate-500 text-xs">Products matching your conversation</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {recommendedProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
                Start chatting to discover personalized product suggestions!
              </div>
            ) : (
              recommendedProducts.map((product) => (
                <div
                  key={product.id || product._id}
                  className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 hover:border-blue-300 transition-colors flex items-center gap-3 group"
                >
                  <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-1">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {product.category}
                    </span>
                    <h4 className="font-bold text-slate-800 text-xs truncate mt-1">{product.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold text-slate-900">{formatINR(product.price)}</span>
                      <div className="flex items-center gap-0.5 text-amber-500 text-[11px]">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatSupport;
