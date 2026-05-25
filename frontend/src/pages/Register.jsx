import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'ca', firm: '', phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(form);
    if (result.success) {
      toast.success('Account created!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl font-display">CT</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Create your account</h2>
          <p className="text-gray-500 mt-1 text-sm">Start managing taxes the smart way</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input className="input-field" placeholder="Rajesh Kumar" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" className="input-field" placeholder="rajesh@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" className="input-field" placeholder="Min. 8 characters" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                <div className="flex gap-3">
                  {[{ val: 'ca', label: 'CA / Tax Professional' }, { val: 'business', label: 'Business Owner' }].map((opt) => (
                    <button key={opt.val} type="button"
                      onClick={() => setForm({ ...form, role: opt.val })}
                      className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                        form.role === opt.val
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firm / Company</label>
                <input className="input-field" placeholder="Sharma & Associates" value={form.firm}
                  onChange={(e) => setForm({ ...form, firm: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input className="input-field" placeholder="+91 98765 43210" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
