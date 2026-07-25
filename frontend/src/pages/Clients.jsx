import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const EMPTY = { 
  name: '', pan: '', aadhaar: '', gstin: '', email: '', phone: '', 
  address: '', clientType: 'individual', notes: '',
  username: '', password: '' // Client portal login credentials
};

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const fileInputRef = useRef(null);

  const load = () => api.get('/clients').then(r => { setClients(r.data); setLoading(false); }).catch(() => { setLoading(false); });
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

  // Excel Import Functions
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          toast.error('Excel file is empty');
          return;
        }
        
        // Map Excel columns to client fields
        const mappedData = jsonData.map((row, index) => ({
          name: row['Name'] || row['Client Name'] || row['name'] || '',
          pan: (row['PAN'] || row['pan'] || '').toString().toUpperCase(),
          aadhaar: (row['Aadhaar'] || row['Aadhar'] || row['aadhaar'] || '').toString(),
          gstin: (row['GSTIN'] || row['gstin'] || '').toString().toUpperCase(),
          email: row['Email'] || row['email'] || row['E-mail'] || '',
          phone: row['Phone'] || row['phone'] || row['Mobile'] || row['Mobile No'] || '',
          address: row['Address'] || row['address'] || row['Addr'] || '',
          clientType: (row['Type'] || row['Client Type'] || row['clientType'] || 'individual').toLowerCase(),
          username: row['Username'] || row['Login ID'] || row['username'] || '',
          password: row['Password'] || row['Passwords'] || row['password'] || '',
        }));
        
        setPreviewData(mappedData);
        toast.success(`Found ${mappedData.length} clients in Excel`);
      } catch (err) {
        toast.error('Error reading Excel file. Make sure it\'s a valid .xlsx file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('No data to import');
      return;
    }
    
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;
    
    for (const client of previewData) {
      if (!client.name) {
        errorCount++;
        continue;
      }
      
      try {
        await api.post('/clients', client);
        successCount++;
      } catch (err) {
        errorCount++;
        console.log('Error importing:', client.name);
      }
    }
    
    setImporting(false);
    toast.success(`Imported ${successCount} clients successfully!`);
    if (errorCount > 0) {
      toast.error(`${errorCount} clients failed to import`);
    }
    setImportModal(false);
    setPreviewData([]);
    load();
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Name': 'Example Client',
        'PAN': 'ABCPK1234D',
        'Aadhaar': '123456789012',
        'GSTIN': '',
        'Email': 'client@example.com',
        'Phone': '9876543210',
        'Address': '123 Main Street, Delhi',
        'Type': 'individual',
        'Username': 'client001',
        'Password': 'password123'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, 'client_import_template.xlsx');
    toast.success('Template downloaded!');
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
        <div className="flex gap-2">
          <button onClick={() => setImportModal(true)} className="btn-secondary">📥 Import Excel</button>
          <button onClick={openNew} className="btn-primary">+ Add Client</button>
        </div>
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
                  <th className="text-left px-4 py-3">Login ID</th>
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
                    <td className="px-4 py-3">
                      {c.username ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {c.username}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
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

      {/* Add/Edit Modal */}
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
                
                {/* Login Credentials Section */}
                <div className="col-span-2 mt-2 pt-2 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">🔐 Client Portal Login</h4>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Login ID / Username</label>
                  <input className="input-field" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="client001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
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

      {/* Import Excel Modal */}
      {importModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-gray-900">📥 Import Clients from Excel</h3>
                <p className="text-xs text-gray-500 mt-0.5">Upload .xlsx file with client data</p>
              </div>
              <button onClick={() => { setImportModal(false); setPreviewData([]); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">📊 Excel Template</h4>
                    <p className="text-xs text-blue-600 mt-1">Download the template to see required columns</p>
                  </div>
                  <button onClick={downloadTemplate} className="btn-secondary text-sm">Download Template</button>
                </div>
              </div>
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="font-medium text-gray-700">Click to upload Excel file</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx or .xls format</p>
                </label>
              </div>
              
              {/* Excel Columns Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Required Excel Columns:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>• Name (Required)</div>
                  <div>• PAN</div>
                  <div>• Aadhaar</div>
                  <div>• GSTIN</div>
                  <div>• Email</div>
                  <div>• Phone / Mobile</div>
                  <div>• Address</div>
                  <div>• Type (individual, firm, etc.)</div>
                  <div>• Username (Login ID)</div>
                  <div>• Password</div>
                </div>
              </div>
              
              {/* Preview Data */}
              {previewData.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview ({previewData.length} clients)</h4>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Name</th>
                          <th className="px-2 py-1 text-left">PAN</th>
                          <th className="px-2 py-1 text-left">Username</th>
                          <th className="px-2 py-1 text-left">Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewData.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1">{row.name || <span className="text-red-400">Missing</span>}</td>
                            <td className="px-2 py-1 font-mono">{row.pan || '—'}</td>
                            <td className="px-2 py-1">{row.username || '—'}</td>
                            <td className="px-2 py-1">{row.password ? '••••' : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 10 && (
                      <p className="text-xs text-gray-500 text-center py-2 bg-gray-50">
                        ...and {previewData.length - 10} more clients
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Import Button */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setImportModal(false); setPreviewData([]); }} className="btn-secondary flex-1">Cancel</button>
                <button 
                  onClick={handleImport} 
                  disabled={previewData.length === 0 || importing}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : `Import ${previewData.length} Clients`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
