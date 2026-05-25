import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const EMPTY = { title: '', category: 'ITR', dueDate: '', description: '', clientName: '', priority: 'medium', status: 'pending' };

const PRESET_DATES = [
  { title: 'ITR Filing (Non-Audit)', category: 'ITR', dueDate: '2024-07-31', description: 'Due date for filing ITR for non-audit cases AY 2024-25', priority: 'high' },
  { title: 'ITR Filing (Audit Cases)', category: 'ITR', dueDate: '2024-10-31', description: 'Due date for filing ITR for audit cases AY 2024-25', priority: 'high' },
  { title: 'GSTR-1 (Monthly)', category: 'GST', dueDate: '2024-11-11', description: 'Monthly GSTR-1 filing for October 2024', priority: 'medium' },
  { title: 'GSTR-3B (Monthly)', category: 'GST', dueDate: '2024-11-20', description: 'Monthly GSTR-3B filing for October 2024', priority: 'high' },
  { title: 'TDS Return Q2', category: 'TDS', dueDate: '2024-10-31', description: 'TDS return for Q2 FY 2024-25', priority: 'high' },
  { title: 'Advance Tax Q3', category: 'ITR', dueDate: '2024-12-15', description: 'Third installment of advance tax FY 2024-25', priority: 'medium' },
];

const priorityStyle = {
  high: { bg: '#fff0f0', border: '#ffb3b3', text: '#cc0000', badge: 'badge-urgent', label: '🔴 High' },
  medium: { bg: '#fff8e6', border: '#ffd580', text: '#996600', badge: 'badge-pending', label: '🟡 Medium' },
  low: { bg: '#f0fff4', border: '#9ae6b4', text: '#276749', badge: 'badge-filed', label: '🟢 Low' },
};

const getDaysLeft = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function DueDates() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = () => api.get('/duedates').then(r => { setDates(r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/duedates/${editing}`, form);
      else await api.post('/duedates', form);
      toast.success(editing ? 'Updated!' : 'Due date added!');
      setModal(false); setEditing(null); setForm(EMPTY); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/duedates/${id}`);
    toast.success('Deleted'); load();
  };

  const markDone = async (item) => {
    await api.put(`/duedates/${item._id}`, { ...item, status: item.status === 'completed' ? 'pending' : 'completed' });
    load();
  };

  const addPresets = async () => {
    for (const preset of PRESET_DATES) {
      await api.post('/duedates', preset).catch(() => {});
    }
    toast.success('Common due dates added!');
    load();
  };

  const filtered = dates.filter(d => filter === 'all' ? true : filter === 'pending' ? d.status !== 'completed' : d.status === 'completed');
  const urgent = dates.filter(d => d.status !== 'completed' && getDaysLeft(d.dueDate) <= 7 && getDaysLeft(d.dueDate) >= 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">📅 Due Dates & Reminders</h1>
          <p className="text-sm text-gray-500">{dates.filter(d=>d.status!=='completed').length} pending deadlines</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addPresets} className="btn-secondary text-sm">+ Add Common Dates</button>
          <button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }} className="btn-primary">+ Add Deadline</button>
        </div>
      </div>

      {/* Urgent Alerts */}
      {urgent.length > 0 && (
        <div className="rounded-2xl p-4" style={{background:'linear-gradient(135deg,#ff4444,#cc0000)', color:'white'}}>
          <p className="font-display font-bold mb-2">🚨 Urgent Deadlines (within 7 days)</p>
          <div className="flex flex-wrap gap-2">
            {urgent.map(d => (
              <span key={d._id} className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium">
                {d.title} — {getDaysLeft(d.dueDate) === 0 ? 'TODAY!' : `${getDaysLeft(d.dueDate)} days left`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['all','pending','completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
            style={filter===f ? {background:'#1a237e',color:'white'} : {background:'white',color:'#666',border:'2px solid #eee'}}>
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-b-2 border-saffron-500 rounded-full"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📅</p>
          <p className="font-medium">No due dates yet</p>
          <button onClick={addPresets} className="mt-3 text-sm text-saffron-600 hover:underline">Add common FY 2024-25 deadlines</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(d => {
            const days = getDaysLeft(d.dueDate);
            const p = priorityStyle[d.priority] || priorityStyle.medium;
            const isOverdue = days < 0 && d.status !== 'completed';
            return (
              <div key={d._id} className="rounded-2xl p-4 border-2 transition-all hover:shadow-md"
                style={{
                  background: d.status === 'completed' ? '#f8f8f8' : p.bg,
                  borderColor: d.status === 'completed' ? '#ddd' : p.border,
                  opacity: d.status === 'completed' ? 0.7 : 1
                }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className={`font-display font-bold text-sm ${d.status==='completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {d.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.category} {d.clientName && `• ${d.clientName}`}</p>
                  </div>
                  <input type="checkbox" checked={d.status==='completed'} onChange={() => markDone(d)}
                    className="w-4 h-4 mt-0.5 accent-green-500 cursor-pointer" />
                </div>
                <p className="text-xs text-gray-500 mb-3">{d.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono font-semibold" style={{color: p.text}}>
                      📅 {new Date(d.dueDate).toLocaleDateString('en-IN')}
                    </p>
                    {d.status !== 'completed' && (
                      <p className={`text-xs font-bold ${isOverdue ? 'text-red-600' : days <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {isOverdue ? `⚠️ Overdue by ${Math.abs(days)} days` : days === 0 ? '🔴 Due Today!' : `${days} days left`}
                      </p>
                    )}
                    {d.status === 'completed' && <p className="text-xs text-green-600 font-semibold">✅ Completed</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(d._id); setForm({...d, dueDate: d.dueDate?.split('T')[0]}); setModal(true); }}
                      className="text-xs px-2 py-1 rounded-lg bg-white/70 hover:bg-white text-gray-600">✏️</button>
                    <button onClick={() => handleDelete(d._id)}
                      className="text-xs px-2 py-1 rounded-lg bg-white/70 hover:bg-white text-red-500">🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between"
              style={{background:'linear-gradient(135deg,#FF9933,#FF6600)'}}>
              <h3 className="font-display font-bold text-white">{editing ? 'Edit Deadline' : 'Add Deadline'}</h3>
              <button onClick={() => setModal(false)} className="text-white/80 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                <input className="input-field" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="e.g. GSTR-3B October 2024" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select className="input-field" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {['ITR','GST','TDS','Audit','Other'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                  <select className="input-field" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                    {['high','medium','low'].map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date *</label>
                <input type="date" className="input-field" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Client Name</label>
                <input className="input-field" value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea className="input-field" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving?'Saving...':'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
