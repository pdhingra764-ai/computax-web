import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ImportData() {
  const [activeTab, setActiveTab] = useState('clients');
  const [jsonText, setJsonText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const SAMPLES = {
    clients: JSON.stringify([
      { name: "Rajesh Kumar", pan: "ABCPK1234D", gstin: "27ABCPK1234D1Z5", email: "rajesh@example.com", phone: "9876543210", clientType: "individual" },
      { name: "Sharma Enterprises", pan: "AABCS1234E", gstin: "07AABCS1234E1ZP", email: "sharma@firm.com", phone: "9123456789", clientType: "firm" }
    ], null, 2),
    itr: JSON.stringify([
      { clientPAN: "ABCPK1234D", assessmentYear: "2024-25", itrType: "ITR-1", salaryIncome: 800000, deductionU80C: 150000, tdsCredited: 50000, status: "draft" }
    ], null, 2),
    gst: JSON.stringify([
      { clientGSTIN: "27ABCPK1234D1Z5", returnType: "GSTR-3B", period: "Oct-2024", totalTaxableSales: 500000, cgstOnSales: 45000, sgstOnSales: 45000, status: "draft" }
    ], null, 2),
  };

  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        if (f.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          setJsonText(JSON.stringify(parsed, null, 2));
          setPreview(parsed);
        } else {
          setJsonText(text);
          setPreview(null);
        }
      } catch {
        toast.error('Invalid file format');
      }
    };
    reader.readAsText(f);
  };

  const handleParseJSON = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setPreview(Array.isArray(parsed) ? parsed : [parsed]);
      toast.success(`Found ${Array.isArray(parsed) ? parsed.length : 1} records`);
    } catch {
      toast.error('Invalid JSON format');
    }
  };

  const handleImport = async () => {
    if (!preview?.length) return toast.error('No data to import');
    setImporting(true);
    try {
      const { data } = await api.post(`/import/${activeTab}`, { records: preview });
      setResult(data);
      toast.success(`✅ Imported ${data.imported} records!`);
      setPreview(null);
      setJsonText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const tabs = [
    { key: 'clients', label: '👥 Clients', color: '#667eea' },
    { key: 'itr', label: '📋 ITR Filings', color: '#FF9933' },
    { key: 'gst', label: '🧾 GST Filings', color: '#138808' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">📥 Import Data</h1>
        <p className="text-sm text-gray-500 mt-1">Import clients, ITR and GST filings from JSON files</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setPreview(null); setJsonText(''); setResult(null); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={activeTab === t.key
              ? { background: t.color, color: 'white', boxShadow: `0 4px 15px ${t.color}40` }
              : { background: 'white', color: '#666', border: '2px solid #eee' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="card p-5 space-y-4">
          <h3 className="font-display font-bold text-gray-800">📄 Paste JSON or Upload File</h3>

          {/* File upload */}
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-saffron-400 hover:bg-orange-50/30 transition-all">
            <span className="text-2xl mb-1">📂</span>
            <span className="text-xs text-gray-500">{file ? file.name : 'Click to upload .json file'}</span>
            <input type="file" accept=".json,.csv" className="hidden" onChange={handleFileUpload} />
          </label>

          <div className="text-center text-gray-400 text-xs">— OR paste JSON manually —</div>

          <textarea className="input-field font-mono text-xs" rows={10}
            placeholder={`Paste JSON array here...\n\nExample:\n${SAMPLES[activeTab].substring(0, 100)}...`}
            value={jsonText} onChange={e => setJsonText(e.target.value)} />

          <div className="flex gap-2">
            <button onClick={() => { setJsonText(SAMPLES[activeTab]); }}
              className="btn-secondary text-xs flex-1">Load Sample</button>
            <button onClick={handleParseJSON} className="btn-primary flex-1">
              🔍 Parse & Preview
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-5 space-y-4">
          <h3 className="font-display font-bold text-gray-800">👁️ Preview</h3>

          {!preview ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <span className="text-5xl mb-3">📋</span>
              <p className="text-sm">Parse JSON to preview records</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="badge-filed">{preview.length} records ready</span>
                <button onClick={handleImport} disabled={importing}
                  className="btn-green text-sm">
                  {importing ? '⏳ Importing...' : `✅ Import ${preview.length} Records`}
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {preview.map((rec, i) => (
                  <div key={i} className="p-3 rounded-xl text-xs font-mono overflow-x-auto"
                    style={{background:'#f8f9ff', border:'1px solid #e8ecff'}}>
                    {Object.entries(rec).slice(0, 5).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-indigo-500 font-semibold min-w-24">{k}:</span>
                        <span className="text-gray-700">{String(v)}</span>
                      </div>
                    ))}
                    {Object.keys(rec).length > 5 && <span className="text-gray-400">+{Object.keys(rec).length - 5} more fields</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Result */}
          {result && (
            <div className="p-4 rounded-xl" style={{background:'#e6f4ea', border:'1px solid #81c995'}}>
              <p className="font-semibold text-green-700">✅ Import Complete!</p>
              <p className="text-sm text-green-600">Imported: {result.imported} · Skipped: {result.skipped || 0} · Errors: {result.errors || 0}</p>
            </div>
          )}
        </div>
      </div>

      {/* Format Guide */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-gray-800 mb-4">📖 JSON Format Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(SAMPLES).map(([key, sample]) => (
            <div key={key}>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">{key} format</p>
              <pre className="text-xs font-mono overflow-x-auto p-3 rounded-xl text-green-800"
                style={{background:'#f0fdf4', border:'1px solid #bbf7d0'}}>
                {sample.substring(0, 200)}...
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
