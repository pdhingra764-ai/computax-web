import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const EMPTY = {
  client: '', assessmentYear: '2024-25', itrType: 'ITR-1', status: 'draft',
  salaryIncome: '', housePropertyIncome: '', businessIncome: '', capitalGains: '', otherIncome: '',
  deductionU80C: '', deductionU80D: '', deductionU80G: '', otherDeductions: '',
  tdsCredited: '', advanceTaxPaid: '', ackNumber: '', filedOn: '', dueDate: '', remarks: ''
};

const statusBadge = (s) => {
  const styles = {
    draft: 'badge-draft', prepared: 'badge-pending',
    filed: 'badge-filed', acknowledged: 'badge-filed', defective: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
  };
  return <span className={styles[s] || 'badge-draft'}>{s}</span>;
};

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

export default function ITRFiling() {
  const [filings, setFilings] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = () => Promise.all([api.get('/itr'), api.get('/clients')]).then(([i, c]) => {
    setFilings(i.data); setClients(c.data); setLoading(false);
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
        await api.put(`/itr/${editing}`, form);
        toast.success('ITR filing updated');
      } else {
        await api.post('/itr', form);
        toast.success('ITR filing created');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving filing');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this filing?')) return;
    await api.delete(`/itr/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">ITR Filings</h1>
          <p className="text-sm text-gray-500">{filings.length} total filings</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ New ITR</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-6 w-6 border-b-2 border-brand-600 rounded-full"></div></div>
        ) : filings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">No ITR filings yet</p>
            <button onClick={openNew} className="mt-3 text-sm text-brand-600 hover:underline">Create your first filing</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-400 border-b border-gray-50">
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-4 py-3">AY</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Taxable Income</th>
                  <th className="text-right px-4 py-3">Tax Payable</th>
                  <th className="text-right px-4 py-3">Refund</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filings.map(f => (
                  <tr key={f._id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{f.client?.name}</p>
                      <p className="text-xs font-mono text-gray-400">{f.client?.pan}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{f.assessmentYear}</td>
                    <td className="px-4 py-3 font-mono text-xs bg-blue-50 text-blue-700 rounded px-2">{f.itrType}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(f.taxableIncome)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">{fmt(f.taxPayable)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">{fmt(f.refundAmount)}</td>
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
              <h3 className="font-display font-bold text-gray-900">{editing ? 'Edit ITR Filing' : 'New ITR Filing'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Basic */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Info</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client *</label>
                    <select className="input-field" value={form.client} onChange={e => setForm({...form, client: e.target.value})} required>
                      <option value="">Select client</option>
                      {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ITR Type *</label>
                    <select className="input-field" value={form.itrType} onChange={e => setForm({...form, itrType: e.target.value})}>
                      {['ITR-1','ITR-2','ITR-3','ITR-4'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Asst. Year *</label>
                    <select className="input-field" value={form.assessmentYear} onChange={e => setForm({...form, assessmentYear: e.target.value})}>
                      {['2024-25','2023-24','2022-23','2021-22'].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Income */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Income Details (₹)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Salary Income', 'salaryIncome'],
                    ['House Property', 'housePropertyIncome'],
                    ['Business / Profession', 'businessIncome'],
                    ['Capital Gains', 'capitalGains'],
                    ['Other Income', 'otherIncome'],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input type="number" className="input-field" min={0} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Deductions (₹)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['80C (LIC, PPF, etc.)', 'deductionU80C'],
                    ['80D (Health Insurance)', 'deductionU80D'],
                    ['80G (Donations)', 'deductionU80G'],
                    ['Other Deductions', 'otherDeductions'],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input type="number" className="input-field" min={0} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* TDS */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">TDS / Advance Tax (₹)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">TDS Credited (26AS)</label>
                    <input type="number" className="input-field" min={0} value={form.tdsCredited} onChange={e => setForm({...form, tdsCredited: e.target.value})} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Advance Tax Paid</label>
                    <input type="number" className="input-field" min={0} value={form.advanceTaxPaid} onChange={e => setForm({...form, advanceTaxPaid: e.target.value})} placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filing Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {['draft','prepared','filed','acknowledged','defective'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ack. Number</label>
                    <input className="input-field font-mono" value={form.ackNumber} onChange={e => setForm({...form, ackNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Filed On</label>
                    <input type="date" className="input-field" value={form.filedOn} onChange={e => setForm({...form, filedOn: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                    <input type="date" className="input-field" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                    <textarea className="input-field" rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} />
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

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold">ITR Summary</h3>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Client</span><span className="font-medium">{preview.client?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">PAN</span><span className="font-mono">{preview.client?.pan}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">AY / Type</span><span>{preview.assessmentYear} · {preview.itrType}</span></div>
              <hr className="border-gray-100" />
              <div className="flex justify-between text-sm"><span className="text-gray-500">Gross Total Income</span><span className="font-mono">{fmt(preview.grossTotalIncome)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Total Deductions</span><span className="font-mono text-green-600">- {fmt(preview.totalDeductions)}</span></div>
              <div className="flex justify-between text-sm font-semibold"><span>Taxable Income</span><span className="font-mono">{fmt(preview.taxableIncome)}</span></div>
              <hr className="border-gray-100" />
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax Liability</span><span className="font-mono">{fmt(preview.taxLiability)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">TDS + Advance Tax</span><span className="font-mono text-green-600">- {fmt((preview.tdsCredited || 0) + (preview.advanceTaxPaid || 0))}</span></div>
              <div className={`flex justify-between text-sm font-bold ${preview.taxPayable > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span>{preview.taxPayable > 0 ? 'Tax Payable' : 'Refund Due'}</span>
                <span className="font-mono">{fmt(preview.taxPayable > 0 ? preview.taxPayable : preview.refundAmount)}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span>{statusBadge(preview.status)}</div>
              {preview.ackNumber && <div className="flex justify-between text-sm"><span className="text-gray-500">Ack No.</span><span className="font-mono text-xs">{preview.ackNumber}</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
