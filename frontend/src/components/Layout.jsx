import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard', color: 'from-purple-500 to-indigo-500' },
  { to: '/clients', icon: '👥', label: 'Clients', color: 'from-blue-500 to-cyan-500' },
  { to: '/itr', icon: '📋', label: 'ITR Filing', color: 'from-saffron-500 to-orange-500' },
  { to: '/gst', icon: '🧾', label: 'GST Filing', color: 'from-green-500 to-emerald-500' },
  { to: '/tds', icon: '💰', label: 'TDS', color: 'from-pink-500 to-rose-500' },
  { to: '/duedates', icon: '📅', label: 'Due Dates', color: 'from-amber-500 to-yellow-500' },
  { to: '/import', icon: '📥', label: 'Import Data', color: 'from-teal-500 to-cyan-500' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#f0f0ff'}}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col transition-all duration-200 flex-shrink-0`}
        style={{background:'linear-gradient(180deg, #1a237e 0%, #0d1547 100%)'}}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{background:'linear-gradient(135deg, #FF9933, #FF6600)'}}>
            <span className="text-white font-black text-sm font-display">CT</span>
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">CompuTax</p>
              <p className="text-xs" style={{color:'#FF9933'}}>Web Platform v2</p>
            </div>
          )}
        </div>

        {/* AY Badge */}
        {sidebarOpen && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl text-center text-xs font-semibold"
            style={{background:'rgba(255,153,51,0.15)', color:'#FF9933', border:'1px solid rgba(255,153,51,0.3)'}}>
            Assessment Year 2024-25
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 px-3 py-3">
          {sidebarOpen && (
            <div className="mb-2 px-2 py-2 rounded-xl" style={{background:'rgba(255,255,255,0.08)'}}>
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-xs" style={{color:'#FF9933'}}>{user?.role === 'ca' ? '⚖️ CA Professional' : '🏢 Business Owner'}</p>
              {user?.firm && <p className="text-xs text-white/50 truncate">{user.firm}</p>}
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl text-sm w-full transition-colors">
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors text-xl">☰</button>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Server Online
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.firm || 'CompuTax Web'}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold font-display shadow-md"
              style={{background:'linear-gradient(135deg, #FF9933, #FF6600)'}}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
