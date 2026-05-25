import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const EMPTY = {
  client: '', gstin: '', returnType: 'GSTR-3B', period: '', status: 'draft',
  totalTaxableSales: '', b2bSales: '', b2cSales: '', exportSales: '',
  cgstOnSales: '', sgstOnSales: '', igstOnSales: '',
  totalTaxablePurchases: '', itcCgst: '', itcSgst: '', itcIgst: '',
  lateFee: '', interest: '',
  ackNumber: '', filedOn: '', dueDate: '', remarks: ''
};

const statusBadge = (s) => {
  const styles = {
    draft: 'badge-draft', prepared: 'badge-pending',
    filed: 'badge-filed', late_filed: 'badge-pending'
  };
  return <span className={styles[s] || 'badge-draft'}>{s.replace('_', ' ')}</span>;
};

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

export default function GSTFiling() {
  const [filings, setFilings] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = () => Promise.all([api.get('/gst'), api.get('/clients')]).then(([g, c]) => {
    setFilings(g.data); setClients(c.data); setLoading(false);
  });

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (f) => {
    setEditing(f._id);
    setForm({
      ...f,
      client: f.client?._id || f.client,
      filedOn: f.filedOn ? f.filedOn.split('T')[0] : '',
      dueDate: f.dueDate ? f.dueDate.split('T')[0] : '',
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/gst/${editing}`, form);
        toast.success('GST filing updated');
      } else {
        await api.post('/gst', form);
        toast.success('GST filing created');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving filing');
    } finally {
      setSaving(false);
    }
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c._id === clientId);
    setForm({ ...form, client: clientId, gstin: client?.gstin || '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this filing?')) return;
    await api.delete(`/gst/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">GST Filings</h1>
          <p className="text-sm text-gray-500">{filings.length} total filings</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ New GST</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-6 w-6 border-b-2 border-brand-600 rounded-full"></div></div>
        ) : filings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🧾</p>
            <p className="font-medium">No GST filings yet</p>
            <button onClick={openNew} className="mt-3 text-sm text-brand-600 hover:underline">Create your first filing</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-400 border-b border-gray-50">
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-4 py-3">GSTIN</th>
                  <th className="text-left px-4 py-3">Return</th>
                  <th className="text-left px-4 py-3">Period</th>
                  <th className="text-right px-4 py-3">Tax Payable</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filings.map(f => (
                  <tr key={f._id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{f.client?.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{f.gstin}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-50 text-green-700 text-xs font-mono px-2 py-0.5 rounded">{f.returnType}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{f.period}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">{fmt(f.totalTaxPayable)}</td>
                    <td className="px-4 py-3">{statusBadge(f.status)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setPreview(f)} className="text-gray-500 hover:text-gray-700 text-xs mr-2">View</button>
                      <button onClick={() => openEdit(f)} className="text-brand-600 hover:underline text-xs mr-2">Edit</button>
                      <button onClick={() => handleDelete(f._id)} className="text-red-500 hover:underline text-xs">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-display font-bold">{editing ? 'Edit GST Filing' : 'New GST Filing'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Basic */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client *</label>
                    <select className="input-field" value={form.client} onChange={e => handleClientChange(e.target.value)} required>
                      <option value="">Select client</option>
                      {clients.map(c => <option key={c._id} value={c._id}>{c.name} {c.gstin ? `(${c.gstin})` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN *</label>
                    <input className="input-field font-mono uppercase" value={form.gstin}
                      onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} maxLength={15} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Return Type *</label>
                    <select className="input-field" value={form.returnType} onChange={e => setForm({...form, returnType: e.target.value})}>
                      {['GSTR-1','GSTR-3B','GSTR-9','GSTR-9C'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Period *</label>
                    <input className="input-field" placeholder="Oct-2024 or 2023-24" value={form.period}
                      onChange={e => setForm({...form, period: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {['draft','prepared','filed','late_filed'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sales (Output Tax) */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Output Tax / Sales (₹)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Total Taxable Sales', 'totalTaxableSales'],
                    ['B2B Sales', 'b2bSales'],
                    ['B2C Sales', 'b2cSales'],
                    ['Export Sales', 'exportSales'],
                    ['CGST on Sales', 'cgstOnSales'],
                    ['SGST on Sales', 'sgstOnSales'],
                    ['IGST on Sales', 'igstOnSales'],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input type="number" className="input-field" min={0} value={form[key]}
                        onChange={e => setForm({...form, [key]: e.target.value})} placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ITC / Purchases */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Input Tax Credit (₹)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Total Taxable Purchases', 'totalTaxablePurchases'],
                    ['ITC CGST', 'itcCgst'],
                    ['ITC SGST', 'itcSgst'],
                    ['ITC IGST', 'itcIgst'],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input type="number" className="input-field" min={0} value={form[key]}
                        onChange={e => setForm({...form, [key]: e.target.value})} placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Penalty */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Late Fee / Interest (₹)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Late Fee</label>
                    <input type="number" className="input-field" min={0} value={form.lateFee}
                      onChange={e => setForm({...form, lateFee: e.target.value})} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Interest</label>
                    <input type="number" className="input-field" min={0} value={form.interest}
                      onChange={e => setForm({...form, interest: e.target.value})} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ack. Number</label>
                    <input className="input-field font-mono" value={form.ackNumber}
                      onChange={e => setForm({...form, ackNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Filed On</label>
                    <input type="date" className="input-field" value={form.filedOn}
                      onChange={e => setForm({...form, filedOn: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                    <textarea className="input-field" rows={2} value={form.remarks}
                      onChange={e => setForm({...form, remarks: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Filing'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold">GST Summary</h3>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{preview.client?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GSTIN</span><span className="font-mono text-xs">{preview.gstin}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Return / Period</span><span>{preview.returnType} · {preview.period}</span></div>
              <hr className="border-gray-100" />
              <p className="text-xs font-semibold text-gray-400 uppercase">Output Tax</p>
              <div className="flex justify-between"><span className="text-gray-500">Taxable Sales</span><span className="font-mono">{fmt(preview.totalTaxableSales)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">CGST</span><span className="font-mono">{fmt(preview.cgstOnSales)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">SGST</span><span className="font-mono">{fmt(preview.sgstOnSales)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">IGST</span><span className="font-mono">{fmt(preview.igstOnSales)}</span></div>
              <hr className="border-gray-100" />
              <p className="text-xs font-semibold text-gray-400 uppercase">Input Tax Credit</p>
              <div className="flex justify-between"><span className="text-gray-500">Total ITC</span><span className="font-mono text-green-600">- {fmt(preview.totalITC)}</span></div>
              <hr className="border-gray-100" />
              <div className="flex justify-between font-bold text-red-600">
                <span>Net Tax Payable</span><span className="font-mono">{fmt(preview.totalTaxPayable)}</span>
              </div>
              {preview.lateFee > 0 && <div className="flex justify-between text-orange-600"><span>Late Fee</span><span className="font-mono">{fmt(preview.lateFee)}</span></div>}
              <hr className="border-gray-100" />
              <div className="flex justify-between"><span className="text-gray-500">Status</span>{statusBadge(preview.status)}</div>
              {preview.ackNumber && <div className="flex justify-between"><span className="text-gray-500">Ack No.</span><span className="font-mono text-xs">{preview.ackNumber}</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
