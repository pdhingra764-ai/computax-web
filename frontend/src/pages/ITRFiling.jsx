import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  client: '', assessmentYear: '2024-25', itrType: 'ITR-1', status: 'draft', taxRegime: 'new',
  salaryIncome: '', housePropertyIncome: '', businessIncome: '', capitalGains: '', otherIncome: '',
  salaryDetails: {
    grossSalary: '', valueOfPerquisites: '', profitsInLieuOfSalary: '',
    exemptAllowances: '', professionalTax: '',
    nameOfEmployer: '', panOfEmployer: '', tanOfEmployer: '',
    hraReceived: '', hraRentPaid: '', hraMetroCity: false
  },
  deductions: {
    u80C: '', u80CCC: '', u80CCD1: '', u80CCD1B: '', u80CCD2: '',
    u80D: '', u80DD: '', u80DDB: '',
    u80E: '', u80EE: '', u80EEA: '', u80EEB: '',
    u80G: '', u80GGA: '', u80GGC: '',
    u80RRB: '', u80TTA: '', u80TTB: '',
    u24b: '', hraExemption: '', standardDeduction: ''
  },
  tdsDetails: { tdsOnSalary: '', tdsOnOther: '', tdsOnDividend: '', tdsOnInterest: '', totalTDS: '' },
  advanceTaxPaid: '', selfAssessmentTax: '',
  ackNumber: '', filedOn: '', dueDate: '', remarks: ''
};

const ITR_TYPES = [
  { value: 'ITR-1', label: 'ITR-1 (Sahaj)', desc: 'Salaried individuals, pension, HP' },
  { value: 'ITR-2', label: 'ITR-2', desc: 'Capital gains, NR, foreign income' },
  { value: 'ITR-3', label: 'ITR-3', desc: 'Business/profession income' },
  { value: 'ITR-4', label: 'ITR-4 (Sugam)', desc: 'Presumptive business/profession' },
  { value: 'ITR-5', label: 'ITR-5', desc: 'Partnership firms, LLPs' },
  { value: 'ITR-6', label: 'ITR-6', desc: 'Companies (non-80P)' },
  { value: 'ITR-7', label: 'ITR-7', desc: 'Trusts, political parties' }
];

const statusBadge = (s) => {
  const styles = {
    draft: 'badge-draft', prepared: 'badge-pending',
    filed: 'badge-filed', acknowledged: 'badge-filed', verified: 'badge-filed',
    defective: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const load = () => Promise.all([api.get('/itr'), api.get('/clients')]).then(([i, c]) => {
    setFilings(i.data); setClients(c.data); setLoading(false);
  });

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(JSON.parse(JSON.stringify(EMPTY_FORM)));
    setActiveTab('basic');
    setModal(true);
  };

  const openEdit = (f) => {
    setEditing(f._id);
    const formData = {
      ...f,
      client: f.client?._id || f.client,
      filedOn: f.filedOn ? f.filedOn.split('T')[0] : '',
      dueDate: f.dueDate ? f.dueDate.split('T')[0] : '',
      salaryDetails: { ...EMPTY_FORM.salaryDetails, ...f.salaryDetails },
      deductions: { ...EMPTY_FORM.deductions, ...f.deductions },
      tdsDetails: { ...EMPTY_FORM.tdsDetails, ...f.tdsDetails }
    };
    setForm(formData);
    setActiveTab('basic');
    setModal(true);
  };

  const updateForm = (path, value) => {
    setForm(prev => {
      const newForm = { ...prev };
      const keys = path.split('.');
      let obj = newForm;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newForm;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sd = form.salaryDetails;
      const salaryIncome = (parseFloat(sd.grossSalary) || 0) + (parseFloat(sd.valueOfPerquisites) || 0) + (parseFloat(sd.profitsInLieuOfSalary) || 0) - (parseFloat(sd.exemptAllowances) || 0) - (parseFloat(sd.professionalTax) || 0);
      const formData = { ...form, salaryIncome: salaryIncome || form.salaryIncome };
      if (editing) {
        await api.put(`/itr/${editing}`, formData);
        toast.success('ITR filing updated');
      } else {
        await api.post('/itr', formData);
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

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">📋 ITR Filings</h1>
          <p className="text-sm text-gray-500">{filings.length} total filings • AY 2024-25</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ New ITR</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[{ label: 'Draft', value: filings.filter(f => f.status === 'draft').length, color: 'gray' },
          { label: 'Prepared', value: filings.filter(f => f.status === 'prepared').length, color: 'yellow' },
          { label: 'Filed', value: filings.filter(f => f.status === 'filed').length, color: 'green' },
          { label: 'Acknowledged', value: filings.filter(f => f.status === 'acknowledged').length, color: 'blue' }
        ].map(stat => (
          <div key={stat.label} className={`bg-${stat.color}-50 border border-${stat.color}-100 rounded-xl p-4`}>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
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
                  <th className="text-left px-3 py-3">AY</th>
                  <th className="text-left px-3 py-3">Type</th>
                  <th className="text-left px-3 py-3">Regime</th>
                  <th className="text-right px-3 py-3">Gross</th>
                  <th className="text-right px-3 py-3">Taxable</th>
                  <th className="text-right px-3 py-3">Tax</th>
                  <th className="text-left px-3 py-3">Status</th>
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
                    <td className="px-3 py-3 text-gray-600">{f.assessmentYear}</td>
                    <td className="px-3 py-3"><span className="font-mono text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">{f.itrType}</span></td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${f.taxRegime === 'new' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {f.taxRegime === 'new' ? 'New' : 'Old'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-gray-700">{fmt(f.grossTotalIncome)}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">{fmt(f.taxableIncome)}</td>
                    <td className="px-3 py-3 text-right font-mono text-red-600">{fmt(f.taxPayable)}</td>
                    <td className="px-3 py-3">{statusBadge(f.status)}</td>
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

      {/* Comprehensive Form Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
              <h3 className="font-display font-bold text-lg">{editing ? 'Edit ITR Filing' : 'New ITR Filing'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="border-b border-gray-200 px-6 flex-shrink-0">
              <div className="flex gap-6">
                {['basic', 'salary', 'income', 'deductions', 'tds', 'status'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium border-b-2 capitalize ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {tab === 'tds' ? 'TDS/Payment' : tab === 'basic' ? 'Basic Info' : tab}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className={labelClass}>Select Client *</label>
                      <select className={inputClass} value={form.client} onChange={e => setForm({...form, client: e.target.value})} required>
                        <option value="">Choose client...</option>
                        {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.pan})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Assessment Year</label>
                      <select className={inputClass} value={form.assessmentYear} onChange={e => setForm({...form, assessmentYear: e.target.value})}>
                        {['2025-26','2024-25','2023-24','2022-23'].map(y => <option key={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>ITR Form Type *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {ITR_TYPES.map(type => (
                        <label key={type.value} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${form.itrType === type.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="itrType" value={type.value} checked={form.itrType === type.value}
                            onChange={e => setForm({...form, itrType: e.target.value})} className="mt-1" />
                          <div>
                            <p className="font-semibold text-sm">{type.label}</p>
                            <p className="text-xs text-gray-500">{type.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Tax Regime</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-all ${form.taxRegime === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <input type="radio" name="taxRegime" value="new" checked={form.taxRegime === 'new'}
                          onChange={e => setForm({...form, taxRegime: e.target.value})} className="mr-2" />
                        <span className="font-semibold">New Regime</span>
                        <p className="text-xs text-gray-500 mt-1">Higher slabs, fewer deductions</p>
                      </label>
                      <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-all ${form.taxRegime === 'old' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                        <input type="radio" name="taxRegime" value="old" checked={form.taxRegime === 'old'}
                          onChange={e => setForm({...form, taxRegime: e.target.value})} className="mr-2" />
                        <span className="font-semibold">Old Regime</span>
                        <p className="text-xs text-gray-500 mt-1">Lower slabs, full deductions</p>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'salary' && (
                <div className="space-y-6">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-orange-800 mb-3">👔 Salary Income Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelClass}>Gross Salary (Basic + DA)</label><input type="number" className={inputClass} value={form.salaryDetails.grossSalary} onChange={e => updateForm('salaryDetails.grossSalary', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>Value of Perquisites</label><input type="number" className={inputClass} value={form.salaryDetails.valueOfPerquisites} onChange={e => updateForm('salaryDetails.valueOfPerquisites', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>Profits in Lieu of Salary</label><input type="number" className={inputClass} value={form.salaryDetails.profitsInLieuOfSalary} onChange={e => updateForm('salaryDetails.profitsInLieuOfSalary', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>Exempt Allowances (HRA, LTA)</label><input type="number" className={inputClass} value={form.salaryDetails.exemptAllowances} onChange={e => updateForm('salaryDetails.exemptAllowances', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>Professional Tax Paid</label><input type="number" className={inputClass} value={form.salaryDetails.professionalTax} onChange={e => updateForm('salaryDetails.professionalTax', e.target.value)} placeholder="0" /></div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-blue-800 mb-3">🏢 Employer Details</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className={labelClass}>Employer Name</label><input className={inputClass} value={form.salaryDetails.nameOfEmployer} onChange={e => updateForm('salaryDetails.nameOfEmployer', e.target.value)} /></div>
                      <div><label className={labelClass}>Employer PAN</label><input className={`${inputClass} font-mono`} value={form.salaryDetails.panOfEmployer} onChange={e => updateForm('salaryDetails.panOfEmployer', e.target.value.toUpperCase())} maxLength={10} /></div>
                      <div><label className={labelClass}>TAN</label><input className={`${inputClass} font-mono`} value={form.salaryDetails.tanOfEmployer} onChange={e => updateForm('salaryDetails.tanOfEmployer', e.target.value.toUpperCase())} maxLength={10} /></div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-green-800 mb-3">🏠 HRA Details</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className={labelClass}>HRA Received</label><input type="number" className={inputClass} value={form.salaryDetails.hraReceived} onChange={e => updateForm('salaryDetails.hraReceived', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>Rent Paid per Month</label><input type="number" className={inputClass} value={form.salaryDetails.hraRentPaid} onChange={e => updateForm('salaryDetails.hraRentPaid', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>Metro City?</label><select className={inputClass} value={form.salaryDetails.hraMetroCity} onChange={e => updateForm('salaryDetails.hraMetroCity', e.target.value === 'true')}><option value={false}>No</option><option value={true}>Yes</option></select></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'income' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800 mb-3">💰 Income Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelClass}>House Property Income</label><input type="number" className={inputClass} value={form.housePropertyIncome} onChange={e => setForm({...form, housePropertyIncome: e.target.value})} placeholder="0" /></div>
                      <div><label className={labelClass}>Business/Profession Income</label><input type="number" className={inputClass} value={form.businessIncome} onChange={e => setForm({...form, businessIncome: e.target.value})} placeholder="0" /></div>
                      <div><label className={labelClass}>Capital Gains</label><input type="number" className={inputClass} value={form.capitalGains} onChange={e => setForm({...form, capitalGains: e.target.value})} placeholder="0" /></div>
                      <div><label className={labelClass}>Other Income</label><input type="number" className={inputClass} value={form.otherIncome} onChange={e => setForm({...form, otherIncome: e.target.value})} placeholder="0" /></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'deductions' && (
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-red-800 mb-3">📉 Section 80C (Max ₹1,50,000)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className={labelClass}>80C Amount</label><input type="number" className={inputClass} value={form.deductions?.u80C} onChange={e => updateForm('deductions.u80C', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>80CCC</label><input type="number" className={inputClass} value={form.deductions?.u80CCC} onChange={e => updateForm('deductions.u80CCC', e.target.value)} /></div>
                      <div><label className={labelClass}>80CCD(1) NPS Self</label><input type="number" className={inputClass} value={form.deductions?.u80CCD1} onChange={e => updateForm('deductions.u80CCD1', e.target.value)} /></div>
                      <div><label className={labelClass}>80CCD(1B) Extra NPS</label><input type="number" className={inputClass} value={form.deductions?.u80CCD1B} onChange={e => updateForm('deductions.u80CCD1B', e.target.value)} /></div>
                      <div><label className={labelClass}>80CCD(2) Employer NPS</label><input type="number" className={inputClass} value={form.deductions?.u80CCD2} onChange={e => updateForm('deductions.u80CCD2', e.target.value)} /></div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-blue-800 mb-3">🏥 Section 80D (Health Insurance)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelClass}>80D Amount</label><input type="number" className={inputClass} value={form.deductions?.u80D} onChange={e => updateForm('deductions.u80D', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>80DD (Disabled Dependent)</label><input type="number" className={inputClass} value={form.deductions?.u80DD} onChange={e => updateForm('deductions.u80DD', e.target.value)} /></div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-green-800 mb-3">🏦 Home Loan & Education</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className={labelClass}>80E Education Loan</label><input type="number" className={inputClass} value={form.deductions?.u80E} onChange={e => updateForm('deductions.u80E', e.target.value)} /></div>
                      <div><label className={labelClass}>80EE Home Loan Interest</label><input type="number" className={inputClass} value={form.deductions?.u80EE} onChange={e => updateForm('deductions.u80EE', e.target.value)} /></div>
                      <div><label className={labelClass}>80EEA Affordable Housing</label><input type="number" className={inputClass} value={form.deductions?.u80EEA} onChange={e => updateForm('deductions.u80EEA', e.target.value)} /></div>
                      <div><label className={labelClass}>80EEB EV Loan</label><input type="number" className={inputClass} value={form.deductions?.u80EEB} onChange={e => updateForm('deductions.u80EEB', e.target.value)} /></div>
                      <div><label className={labelClass}>Section 24(b) Home Int.</label><input type="number" className={inputClass} value={form.deductions?.u24b} onChange={e => updateForm('deductions.u24b', e.target.value)} /></div>
                      <div><label className={labelClass}>80TTA Savings Interest</label><input type="number" className={inputClass} value={form.deductions?.u80TTA} onChange={e => updateForm('deductions.u80TTA', e.target.value)} /></div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-purple-800 mb-3">🎁 Donations</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className={labelClass}>80G Donations</label><input type="number" className={inputClass} value={form.deductions?.u80G} onChange={e => updateForm('deductions.u80G', e.target.value)} /></div>
                      <div><label className={labelClass}>80GGA Scientific</label><input type="number" className={inputClass} value={form.deductions?.u80GGA} onChange={e => updateForm('deductions.u80GGA', e.target.value)} /></div>
                      <div><label className={labelClass}>80RRB Royalty</label><input type="number" className={inputClass} value={form.deductions?.u80RRB} onChange={e => updateForm('deductions.u80RRB', e.target.value)} /></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tds' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-yellow-800 mb-3">💰 TDS Details (from Form 16/26AS)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelClass}>TDS on Salary</label><input type="number" className={inputClass} value={form.tdsDetails?.tdsOnSalary} onChange={e => updateForm('tdsDetails.tdsOnSalary', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>TDS on Other Income</label><input type="number" className={inputClass} value={form.tdsDetails?.tdsOnOther} onChange={e => updateForm('tdsDetails.tdsOnOther', e.target.value)} placeholder="0" /></div>
                      <div><label className={labelClass}>TDS on Dividend</label><input type="number" className={inputClass} value={form.tdsDetails?.tdsOnDividend} onChange={e => updateForm('tdsDetails.tdsOnDividend', e.target.value)} /></div>
                      <div><label className={labelClass}>TDS on Interest</label><input type="number" className={inputClass} value={form.tdsDetails?.tdsOnInterest} onChange={e => updateForm('tdsDetails.tdsOnInterest', e.target.value)} /></div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-green-800 mb-3">📤 Tax Payments</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelClass}>Advance Tax Paid</label><input type="number" className={inputClass} value={form.advanceTaxPaid} onChange={e => setForm({...form, advanceTaxPaid: e.target.value})} placeholder="0" /></div>
                      <div><label className={labelClass}>Self Assessment Tax</label><input type="number" className={inputClass} value={form.selfAssessmentTax} onChange={e => setForm({...form, selfAssessmentTax: e.target.value})} placeholder="0" /></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'status' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Filing Status</label>
                      <select className={inputClass} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        {['draft','prepared','filed','acknowledged','verified','defective'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Acknowledgment Number</label>
                      <input className={`${inputClass} font-mono`} value={form.ackNumber} onChange={e => setForm({...form, ackNumber: e.target.value})} placeholder="e.g., 123456789012" />
                    </div>
                    <div>
                      <label className={labelClass}>Date of Filing</label>
                      <input type="date" className={inputClass} value={form.filedOn} onChange={e => setForm({...form, filedOn: e.target.value})} />
                    </div>
                    <div>
                      <label className={labelClass}>Due Date</label>
                      <input type="date" className={inputClass} value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Remarks / Notes</label>
                    <textarea className={inputClass} rows={4} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Add any notes about this filing..." />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save ITR Filing'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold">ITR Summary</h3>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-xs">Client</span><p className="font-semibold">{preview.client?.name}</p></div>
                <div><span className="text-gray-500 text-xs">PAN</span><p className="font-mono">{preview.client?.pan}</p></div>
                <div><span className="text-gray-500 text-xs">ITR Type</span><p className="font-semibold">{preview.itrType}</p></div>
                <div><span className="text-gray-500 text-xs">Regime</span><p className={preview.taxRegime === 'new' ? 'text-blue-600' : 'text-purple-600'}>{preview.taxRegime === 'new' ? 'New' : 'Old'}</p></div>
              </div>
              <hr />
              <div><span className="text-gray-500 text-xs">Gross Total Income</span><p className="font-mono text-lg">{fmt(preview.grossTotalIncome)}</p></div>
              <div><span className="text-gray-500 text-xs">Total Deductions</span><p className="font-mono text-green-600">- {fmt(preview.totalDeductions)}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 text-xs">Taxable Income</span><p className="font-mono font-bold text-lg">{fmt(preview.taxableIncome)}</p></div>
              <hr />
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-xs">Tax Liability</span><p className="font-mono">{fmt(preview.taxComputation?.totalTaxLiability || preview.taxLiability)}</p></div>
                <div><span className="text-gray-500 text-xs">TDS + Advance Tax</span><p className="font-mono text-green-600">- {fmt(preview.totalTaxPaid || 0)}</p></div>
              </div>
              <div className={`p-4 rounded-xl font-bold text-center ${preview.taxPayable > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {preview.taxPayable > 0 ? `Tax Payable: ${fmt(preview.taxPayable)}` : `Refund Due: ${fmt(preview.refundAmount)}`}
              </div>
              <hr />
              <div className="flex justify-between items-center">
                <div><span className="text-gray-500 text-xs">Status</span><p>{statusBadge(preview.status)}</p></div>
                {preview.ackNumber && <div><span className="text-gray-500 text-xs">Ack No.</span><p className="font-mono text-xs">{preview.ackNumber}</p></div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
