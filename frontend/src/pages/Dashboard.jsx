import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import demoData from '../context/DemoDataContext';

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

const statusBadge = (s) => {
  const map = { draft:'badge-draft', prepared:'badge-pending', filed:'badge-filed', acknowledged:'badge-filed', late_filed:'badge-pending' };
  return <span className={map[s]||'badge-draft'}>{s}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => {
        console.log('Using demo data - backend unavailable');
        setUsingDemo(true);
        setData(demoData);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse"
          style={{background:'linear-gradient(135deg,#FF9933,#FF6600)'}}>
          <span className="text-white font-black font-display">CT</span>
        </div>
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  const s = data?.stats || {};
  const recentITR = data?.recentITR || [];
  const recentGST = data?.recentGST || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            नमस्ते, {user?.name?.split(' ')[0]} 🙏
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Assessment Year 2024-25 • {new Date().toLocaleDateString('en-IN', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{background:'linear-gradient(135deg,#FF9933,#1a237e)', color:'white'}}>
          🇮🇳 India Tax Platform
        </div>
      </div>

      {/* Demo Banner */}
      {usingDemo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            📊 <strong>Demo Mode:</strong> Showing sample data. Backend server is starting up or unavailable.
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Clients', value: s.totalClients||0, icon:'👥', gradient:'linear-gradient(135deg,#667eea,#764ba2)', sub:'Registered' },
          { label:'ITR Filed', value: s.filedITR||0, icon:'📋', gradient:'linear-gradient(135deg,#FF9933,#FF6600)', sub:`${s.pendingITR||0} pending` },
          { label:'GST Filed', value: s.filedGST||0, icon:'🧾', gradient:'linear-gradient(135deg,#138808,#0a5c05)', sub:`${s.pendingGST||0} pending` },
          { label:'Total Filings', value:(s.totalITR||0)+(s.totalGST||0), icon:'📊', gradient:'linear-gradient(135deg,#1a237e,#0d1547)', sub:'ITR + GST' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-5 text-white shadow-lg"
            style={{background: card.gradient}}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs opacity-70 font-medium">{card.sub}</span>
            </div>
            <p className="text-3xl font-display font-black">{card.value}</p>
            <p className="text-xs opacity-80 mt-1 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="section-title">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to:'/clients', icon:'👥', label:'Add Client', bg:'#fff0e6', border:'#FFB366', text:'#cc5500' },
            { to:'/itr', icon:'📋', label:'New ITR', bg:'#e8f0fe', border:'#7baaf7', text:'#1a237e' },
            { to:'/gst', icon:'🧾', label:'New GST', bg:'#e6f4ea', border:'#81c995', text:'#137333' },
            { to:'/import', icon:'📥', label:'Import Data', bg:'#fce8e6', border:'#f28b82', text:'#c5221f' },
          ].map((a) => (
            <Link key={a.label} to={a.to}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all hover:shadow-md hover:scale-105"
              style={{background:a.bg, borderColor:a.border, color:a.text}}>
              <span className="text-xl">{a.icon}</span>
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{background:'linear-gradient(135deg,#FF9933,#FF6600)'}}>
            <h3 className="font-display font-bold text-white">📋 Recent ITR Filings</h3>
            <Link to="/itr" className="text-xs text-white/80 hover:text-white bg-white/20 px-2 py-1 rounded-lg">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!recentITR.length && <p className="px-5 py-8 text-center text-sm text-gray-400">No ITR filings yet</p>}
            {recentITR.map(f => (
              <div key={f._id} className="px-5 py-3 flex items-center justify-between hover:bg-orange-50/30">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.client?.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{f.client?.pan} · {f.itrType} · {f.assessmentYear}</p>
                </div>
                {statusBadge(f.status)}
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{background:'linear-gradient(135deg,#138808,#0a5c05)'}}>
            <h3 className="font-display font-bold text-white">🧾 Recent GST Filings</h3>
            <Link to="/gst" className="text-xs text-white/80 hover:text-white bg-white/20 px-2 py-1 rounded-lg">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!recentGST.length && <p className="px-5 py-8 text-center text-sm text-gray-400">No GST filings yet</p>}
            {recentGST.map(f => (
              <div key={f._id} className="px-5 py-3 flex items-center justify-between hover:bg-green-50/30">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.client?.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{f.gstin} · {f.returnType} · {f.period}</p>
                </div>
                {statusBadge(f.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
