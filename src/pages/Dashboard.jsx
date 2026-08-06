import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, MessageSquare, ThumbsUp, Sparkles, Clock, CheckCircle2, User, PlusCircle, Loader2 } from 'lucide-react';

const emptyProductForm = {
  name: '',
  description: '',
  category: '',
  price: '',
  stock: '',
  tags: '',
  imageUrl: '',
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInquiries: 12,
    satisfactionRate: 98,
    savedTimeMinutes: 45,
  });

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null); // { type: 'success' | 'error', text }

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormMessage(null);

    if (!productForm.name || !productForm.description || !productForm.category || !productForm.price) {
      setFormMessage({ type: 'error', text: 'Name, description, category, and price are required.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: Number(productForm.price),
        stock: productForm.stock ? Number(productForm.stock) : 0,
        tags: productForm.tags
          ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        imageUrl: productForm.imageUrl || '',
      };

      const res = await api.post('/products', payload);
      if (res.data.success) {
        setFormMessage({ type: 'success', text: `"${res.data.data.name}" was added to the store!` });
        setProductForm(emptyProductForm);
      } else {
        setFormMessage({ type: 'error', text: res.data.message || 'Failed to add product.' });
      }
    } catch (err) {
      console.error('Add product error:', err);
      setFormMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add product. Admin access is required.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categoryData = [
    { name: 'Audio', inquiries: 5, fill: '#2563eb' },
    { name: 'Wearables', inquiries: 4, fill: '#10b981' },
    { name: 'Electronics', inquiries: 3, fill: '#8b5cf6' },
    { name: 'Smart Home', inquiries: 2, fill: '#f59e0b' },
  ];

  const satisfactionData = [
    { name: 'Satisfied', value: 98, color: '#10b981' },
    { name: 'Needs Follow-up', value: 2, color: '#e2e8f0' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-600/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-100 bg-white/10 px-3 py-1 rounded-full">Customer Portal</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Welcome back, {user?.name || 'Valued Customer'}!</h1>
            <p className="text-blue-100 text-sm mt-1">Here is your recent SmartSupport AI activity summary and personalized analytics.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
            <User className="w-8 h-8 text-white/80" />
            <div>
              <span className="text-xs text-blue-100 block">Account Role</span>
              <span className="font-bold text-sm capitalize">{user?.role || 'Customer'}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">AI Help Conversations</span>
              <span className="text-2xl font-bold text-slate-900">{stats.totalInquiries}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Customer Satisfaction</span>
              <span className="text-2xl font-bold text-slate-900">{stats.satisfactionRate}%</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Est. Time Saved</span>
              <span className="text-2xl font-bold text-slate-900">{stats.savedTimeMinutes} mins</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Category Interest Chart */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Top Inquired Product Categories</h3>
            <p className="text-xs text-slate-500 mb-6">Distribution of your product questions by category</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="inquiries" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Satisfaction Breakdown Chart */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">AI Resolution Rate</h3>
              <p className="text-xs text-slate-500 mb-4">Queries answered directly without escalation</p>
            </div>
            <div className="h-52 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={satisfactionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {satisfactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900">98%</span>
                <span className="text-[11px] text-slate-500 font-medium">Solved</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs mt-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Solved Instantaneously
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <span className="w-3 h-3 rounded-full bg-slate-200 inline-block"></span> Follow-up
              </span>
            </div>
          </div>

        </div>

        {/* Admin: Add Product to Store */}
        {user?.role === 'admin' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Add a Product to the Store</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Admin-only: new products appear in the Shop and AI catalog immediately.</p>

            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Aurora Smart LED Strip"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description *</label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Short, honest description of the product"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Category *</label>
                <input
                  type="text"
                  name="category"
                  value={productForm.category}
                  onChange={handleProductFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Electronics"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  min="1"
                  step="1"
                  value={productForm.price}
                  onChange={handleProductFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. 2999"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={productForm.stock}
                  onChange={handleProductFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={productForm.tags}
                  onChange={handleProductFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. lighting, smart home, led"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Image URL</label>
                <input
                  type="text"
                  name="imageUrl"
                  value={productForm.imageUrl}
                  onChange={handleProductFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              {formMessage && (
                <div
                  className={`md:col-span-2 text-xs font-medium px-3.5 py-2.5 rounded-xl ${
                    formMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {formMessage.text}
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  {submitting ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
