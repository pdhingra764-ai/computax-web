import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-brand-900 flex-col justify-center px-16 text-white">
        <div className="mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6">
            <span className="text-brand-700 font-bold text-xl font-display">CT</span>
          </div>
          <h1 className="text-4xl font-display font-bold mb-3 leading-tight">
            India's Smartest<br />Tax Filing Platform
          </h1>
          <p className="text-brand-300 text-lg">
            Manage ITR, GST, and compliance — all in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '📋', label: 'ITR Filing', desc: 'ITR-1 to ITR-4' },
            { icon: '🧾', label: 'GST Returns', desc: 'GSTR-1 & 3B' },
            { icon: '👥', label: 'Client Mgmt', desc: 'Unlimited clients' },
            { icon: '📊', label: 'Dashboard', desc: 'Real-time stats' },
          ].map((f) => (
            <div key={f.label} className="bg-brand-800 rounded-xl p-4">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="font-semibold text-sm">{f.label}</p>
              <p className="text-brand-300 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-gray-900">Sign in</h2>
            <p className="text-gray-500 mt-1 text-sm">Welcome back to CompuTax Web</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
