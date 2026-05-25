import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const EMPTY = { name: '', pan: '', aadhaar: '', gstin: '', email: '', phone: '', address: '', clientType: 'individual', notes: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/clients').then(r => { setClients(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c) => { setEditing(c._id); setForm({ ...c }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/clients/${editing}`, form);
        toast.success('Client updated');
      } else {
        await api.post('/clients', form);
        toast.success('Client added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      load();
    } catch {
      toast.error('Error deleting client');
    }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.pan?.toLowerCase().includes(search.toLowerCase()) ||
    c.gstin?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">{clients.length} total clients</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Add Client</button>
      </div>

      <div className="card">
        <div className="px-5 py-3 border-b border-gray-50">
          <input className="input-field max-w-xs" placeholder="Search by name, PAN, GSTIN..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-6 w-6 border-b-2 border-brand-600 rounded-full"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium">No clients found</p>
            <button onClick={openNew} className="mt-3 text-sm text-brand-600 hover:underline">Add your first client</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-400 border-b border-gray-50">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-4 py-3">PAN</th>
                  <th className="text-left px-4 py-3">GSTIN</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{c.pan || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 text-xs">{c.gstin || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-600">{c.clientType}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.email || c.phone || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openEdit(c)} className="text-brand-600 hover:underline text-xs mr-3">Edit</button>
                      <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-gray-900">{editing ? 'Edit Client' : 'Add Client'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PAN</label>
                  <input className="input-field font-mono uppercase" maxLength={10} value={form.pan} onChange={e => setForm({...form, pan: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Aadhaar</label>
                  <input className="input-field font-mono" maxLength={12} value={form.aadhaar} onChange={e => setForm({...form, aadhaar: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN</label>
                  <input className="input-field font-mono uppercase" maxLength={15} value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Client Type</label>
                  <select className="input-field" value={form.clientType} onChange={e => setForm({...form, clientType: e.target.value})}>
                    {['individual','huf','firm','company','trust'].map(t => <option key={t} value={t} className="capitalize">{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <textarea className="input-field" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
