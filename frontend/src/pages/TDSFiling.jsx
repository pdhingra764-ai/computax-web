import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const EMPTY = {
  client: '', deductorName: '', deductorTAN: '', deductorPAN: '',
  financialYear: '2024-25', quarter: 'Q1', formType: '24Q',
  status: 'draft', totalAmountPaid: '', totalTaxDeducted: '',
  totalTaxDeposited: '', ackNumber: '', filedOn: '', dueDate: '', remarks: ''
};

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

const statusBadge = (s) => {
  const map = { draft:'badge-draft', prepared:'badge-pending', filed:'badge-filed', late_filed:'badge-pending' };
  return <span className={map[s]||'badge-draft'}>{s.replace('_',' ')}</span>;
};

export default function TDSFiling() {
  const [filings, setFilings] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([api.get('/tds'), api.get('/clients')]).then(([t,c]) => {
    setFilings(t.data); setClients(c.data); setLoading(false);
  }).catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (f) => {
    setEditing(f._id);
    setForm({ ...f, client: f.client?._id || f.client, filedOn: f.filedOn?.split('T')[0]||'', dueDate: f.dueDate?.split('T')[0]||'' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/tds/${editing}`, form);
      else await api.post('/tds', form);
      toast.success(editing ? 'TDS updated!' : 'TDS filing created!');
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/tds/${id}`);
    toast.success('Deleted'); load();
  };

  const totalDeducted = filings.reduce((s,f) => s + (f.totalTaxDeducted||0), 0);
  const totalDeposited = filings.reduce((s,f) => s + (f.totalTaxDeposited||0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">💰 TDS Management</h1>
          <p className="text-sm text-gray-500">{filings.length} total TDS returns</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ New TDS Return</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total Returns', value: filings.length, gradient:'linear-gradient(135deg,#667eea,#764ba2)' },
          { label:'Total TDS Deducted', value: fmt(totalDeducted), gradient:'linear-gradient(135deg,#FF9933,#FF6600)' },
          { label:'Total Deposited', value: fmt(totalDeposited), gradient:'linear-gradient(135deg,#138808,#0a5c05)' },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-4 text-white" style={{background:c.gradient}}>
            <p className="text-xs opacity-80 font-medium">{c.label}</p>
            <p className="text-2xl font-display font-black mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4" style={{background:'linear-gradient(135deg,#ff69b4,#c71585)'}}>
          <h3 className="font-display font-bold text-white">💰 TDS Returns</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-6 w-6 border-b-2 border-pink-500 rounded-full"></div></div>
        ) : filings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">💰</p>
            <p className="font-medium">No TDS filings yet</p>
            <button onClick={openNew} className="mt-3 text-sm text-pink-600 hover:underline">Create first TDS return</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-400 border-b">
                  <th className="text-left px-5 py-3">Deductor</th>
                  <th className="text-left px-4 py-3">TAN</th>
                  <th className="text-left px-4 py-3">Form / Quarter</th>
                  <th className="text-left px-4 py-3">FY</th>
                  <th className="text-right px-4 py-3">TDS Deducted</th>
                  <th className="text-right px-4 py-3">TDS Deposited</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filings.map(f => (
                  <tr key={f._id} className="hover:bg-pink-50/20">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">{f.deductorName}</p>
                      <p className="text-xs text-gray-400">{f.client?.name}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{f.deductorTAN||'—'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-pink-100 text-pink-700 text-xs font-mono px-2 py-0.5 rounded">{f.formType}</span>
                      <span className="ml-1 text-gray-500 text-xs">{f.quarter}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{f.financialYear}</td>
                    <td className="px-4 py-3 text-right font-mono text-orange-600">{fmt(f.totalTaxDeducted)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">{fmt(f.totalTaxDeposited)}</td>
                    <td className="px-4 py-3">{statusBadge(f.status)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openEdit(f)} className="text-pink-600 hover:underline text-xs mr-2">Edit</button>
                      <button onClick={() => handleDelete(f._id)} className="text-red-500 hover:underline text-xs">Del</button>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b sticky top-0 bg-white"
              style={{background:'linear-gradient(135deg,#ff69b4,#c71585)'}}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-white">{editing?'Edit TDS Return':'New TDS Return'}</h3>
                <button onClick={()=>setModal(false)} className="text-white/80 hover:text-white text-xl">✕</button>
              </div>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Client *</label>
                  <select className="input-field" value={form.client} onChange={e=>setForm({...form,client:e.target.value})} required>
                    <option value="">Select client</option>
                    {clients.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Deductor Name *</label>
                  <input className="input-field" value={form.deductorName} onChange={e=>setForm({...form,deductorName:e.target.value})} required placeholder="Company/Person deducting TDS" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">TAN</label>
                  <input className="input-field font-mono uppercase" maxLength={10} value={form.deductorTAN} onChange={e=>setForm({...form,deductorTAN:e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">PAN</label>
                  <input className="input-field font-mono uppercase" maxLength={10} value={form.deductorPAN} onChange={e=>setForm({...form,deductorPAN:e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Form Type</label>
                  <select className="input-field" value={form.formType} onChange={e=>setForm({...form,formType:e.target.value})}>
                    {['24Q','26Q','27Q','27EQ'].map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quarter</label>
                  <select className="input-field" value={form.quarter} onChange={e=>setForm({...form,quarter:e.target.value})}>
                    {['Q1','Q2','Q3','Q4'].map(q=><option key={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Financial Year</label>
                  <select className="input-field" value={form.financialYear} onChange={e=>setForm({...form,financialYear:e.target.value})}>
                    {['2024-25','2023-24','2022-23'].map(y=><option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select className="input-field" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                    {['draft','prepared','filed','late_filed'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Total Amount Paid (₹)</label>
                  <input type="number" className="input-field" value={form.totalAmountPaid} onChange={e=>setForm({...form,totalAmountPaid:e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">TDS Deducted (₹)</label>
                  <input type="number" className="input-field" value={form.totalTaxDeducted} onChange={e=>setForm({...form,totalTaxDeducted:e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">TDS Deposited (₹)</label>
                  <input type="number" className="input-field" value={form.totalTaxDeposited} onChange={e=>setForm({...form,totalTaxDeposited:e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ack. Number</label>
                  <input className="input-field font-mono" value={form.ackNumber} onChange={e=>setForm({...form,ackNumber:e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Filed On</label>
                  <input type="date" className="input-field" value={form.filedOn} onChange={e=>setForm({...form,filedOn:e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                  <input type="date" className="input-field" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label>
                  <textarea className="input-field" rows={2} value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} />
                </div>
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
