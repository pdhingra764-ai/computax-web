import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

export default function DataImport() {
  const [activeTab, setActiveTab] = useState('form26as');
  const [importing, setImporting] = useState(false);
  const [form26asData, setForm26asData] = useState(null);
  const [form16Data, setForm16Data] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [mappedITR, setMappedITR] = useState(null);

  // Load clients for mapping
  React.useEffect(() => {
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
  }, []);

  // Handle Form 26AS JSON file upload
  const handleForm26ASUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        setForm26asData(jsonData);
        
        // Parse and display summary
        const tdsDetails = parseForm26AS(jsonData);
        toast.success(`Form 26AS loaded! Found ${tdsDetails.length} TDS entries.`);
      } catch (err) {
        toast.error('Invalid JSON file. Please upload valid Form 26AS JSON.');
      }
      setImporting(false);
    };
    
    reader.readAsText(file);
  };

  // Handle Form 16 file upload
  const handleForm16Upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        setForm16Data(jsonData);
        
        const salaryDetails = parseForm16(jsonData);
        toast.success(`Form 16 loaded! Salary: ${fmt(salaryDetails.grossSalary)}`);
      } catch (err) {
        toast.error('Invalid JSON file. Please upload valid Form 16 JSON.');
      }
      setImporting(false);
    };
    
    reader.readAsText(file);
  };

  // Parse Form 26AS JSON
  const parseForm26AS = (data) => {
    const tdsEntries = [];
    
    // Handle different JSON structures
    if (data.TaxDetails || data.taxDetails) {
      const taxDetails = data.TaxDetails || data.taxDetails;
      taxDetails.forEach(txn => {
        tdsEntries.push({
          deductorname: txn.deductorname || txn.deductorname,
          tan: txn.tan || txn.TAN,
         amtPaid: txn.amtPaid || txn.amountPaid,
          tdsAmt: txn.tdsAmt || txn.tdsAmount,
          taxRate: txn.taxRate || txn.rate,
          quarter: txn.quarter || txn.Qtr,
          date: txn.date || txn.creditDate
        });
      });
    }
    
    return tdsEntries;
  };

  // Parse Form 16 JSON
  const parseForm16 = (data) => {
    return {
      employerName: data.employerName || data.employer_name || '',
      tan: data.tan || data.TAN || '',
      pan: data.pan || data.PAN || '',
      employeeName: data.employeeName || data.employee_name || '',
      grossSalary: parseFloat(data.grossSalary || data.gross_salary || 0),
      totalTDS: parseFloat(data.totalTDS || data.total_tds || 0),
      section80C: parseFloat(data.section80C || data.section_80c || 0),
      section80D: parseFloat(data.section80D || data.section_80d || 0),
      hraReceived: parseFloat(data.hraReceived || data.hra_received || 0),
      exemptAllowances: parseFloat(data.exemptAllowances || data.exempt_allowances || 0)
    };
  };

  // Create ITR from imported data
  const createITRFromImport = async () => {
    if (!selectedClient) {
      toast.error('Please select a client first');
      return;
    }

    setImporting(true);
    try {
      const itrData = {
        client: selectedClient,
        assessmentYear: '2024-25',
        itrType: 'ITR-1',
        taxRegime: 'new',
        status: 'draft',
        // Salary from Form 16
        salaryIncome: form16Data?.grossSalary || 0,
        salaryDetails: {
          grossSalary: form16Data?.grossSalary || 0,
          exemptAllowances: form16Data?.exemptAllowances || 0,
          hraReceived: form16Data?.hraReceived || 0,
          nameOfEmployer: form16Data?.employerName || '',
          panOfEmployer: form16Data?.pan || '',
          tanOfEmployer: form16Data?.tan || ''
        },
        // TDS from Form 26AS
        tdsDetails: {
          tdsOnSalary: form16Data?.totalTDS || 0,
          tdsOnOther: calculateOtherTDSTDS(form26asData),
          totalTDS: (form16Data?.totalTDS || 0) + calculateOtherTDSTDS(form26asData)
        },
        // Deductions from Form 16
        deductions: {
          u80C: form16Data?.section80C || 0,
          u80D: form16Data?.section80D || 0
        }
      };

      const response = await api.post('/itr', itrData);
      toast.success('ITR created from imported data!');
      setMappedITR(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ITR');
    }
    setImporting(false);
  };

  // Calculate TDS from other sources (non-salary)
  const calculateOtherTDSTDS = (data) => {
    if (!data) return 0;
    const taxDetails = data.TaxDetails || data.taxDetails || [];
    // Filter out salary TDS if identifiable
    return taxDetails.reduce((sum, txn) => sum + (parseFloat(txn.tdsAmt) || 0), 0);
  };

  // Calculate totals from Form 26AS
  const calculateForm26ASTotals = () => {
    if (!form26asData) return { totalTDS: 0, totalTax: 0, entries: 0 };
    const taxDetails = form26asData.TaxDetails || form26asData.taxDetails || [];
    return {
      totalTDS: taxDetails.reduce((sum, txn) => sum + (parseFloat(txn.tdsAmt) || 0), 0),
      totalTax: taxDetails.reduce((sum, txn) => sum + (parseFloat(txn.taxAmount) || 0), 0),
      entries: taxDetails.length
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">📥 Import Tax Data</h1>
          <p className="text-sm text-gray-500 mt-1">Import from Form 26AS, Form 16 (TRACES), or Income Tax Portal</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📋 How to Download Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-medium text-gray-800">Form 26AS (Annual Tax Statement)</p>
            <p className="text-gray-500 mt-1">Login to: <a href="https://www.incometax.gov.in" target="_blank" className="text-blue-600 underline">incometax.gov.in</a></p>
            <p className="text-gray-500">→ My Account → View Form 26AS → Download JSON</p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-medium text-gray-800">Form 16 (TDS Certificate)</p>
            <p className="text-gray-500 mt-1">Download from: <a href="https://www.tdscpc.gov.in" target="_blank" className="text-blue-600 underline">tdscpc.gov.in</a></p>
            <p className="text-gray-500">→ Taxpayer Services → Form 16 → Download</p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-medium text-gray-800">Annual Information Statement</p>
            <p className="text-gray-500 mt-1">Login to: <a href="https://www.incometax.gov.in" target="_blank" className="text-blue-600 underline">incometax.gov.in</a></p>
            <p className="text-gray-500">→ Services → Annual Information Statement</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'form26as', label: '📄 Form 26AS', icon: '26AS' },
            { id: 'form16', label: '📋 Form 16', icon: '16' },
            { id: 'ais', label: '📊 AIS', icon: 'AIS' },
            { id: 'auto', label: '⚡ Auto Populate', icon: 'AUTO' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form 26AS Tab */}
      {activeTab === 'form26as' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">📄 Upload Form 26AS (JSON)</h3>
            <p className="text-sm text-gray-500 mb-4">
              Download Form 26AS from Income Tax Portal as JSON format and upload here.
            </p>
            
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-400 transition-colors">
              <input type="file" accept=".json" onChange={handleForm26ASUpload} className="hidden" id="form26as-upload" />
              <label htmlFor="form26as-upload" className="cursor-pointer">
                <div className="text-4xl mb-3">📤</div>
                <p className="font-medium text-gray-700">Click to upload Form 26AS JSON</p>
                <p className="text-xs text-gray-400 mt-1">or drag and drop JSON file</p>
              </label>
            </div>

            {importing && <div className="text-center py-4"><div className="animate-spin h-6 w-6 border-b-2 border-brand-600 rounded-full mx-auto"></div></div>}

            <div className="mt-4 space-y-2">
              <a href="https://www.incometax.gov.in/iec/fipop/" target="_blank"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                🔗 Go to Income Tax Portal to download Form 26AS
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">📊 Form 26AS Summary</h3>
            
            {form26asData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{calculateForm26ASTotals().entries}</p>
                    <p className="text-xs text-green-600">TDS Entries</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">{fmt(calculateForm26ASTotals().totalTDS)}</p>
                    <p className="text-xs text-blue-600">Total TDS</p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs">Deductor</th>
                        <th className="px-3 py-2 text-left text-xs">TAN</th>
                        <th className="px-3 py-2 text-right text-xs">Amount</th>
                        <th className="px-3 py-2 text-right text-xs">TDS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(form26asData.TaxDetails || form26asData.taxDetails || []).slice(0, 10).map((txn, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-xs">{txn.deductorname || txn.deductorname || '-'}</td>
                          <td className="px-3 py-2 font-mono text-xs">{txn.tan || txn.TAN || '-'}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{fmt(txn.amtPaid || txn.amountPaid)}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-red-600">{fmt(txn.tdsAmt || txn.tdsAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(form26asData.TaxDetails || form26asData.taxDetails || []).length > 10 && (
                  <p className="text-xs text-gray-500 text-center">...and {(form26asData.TaxDetails || form26asData.taxDetails || []).length - 10} more entries</p>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">Upload Form 26AS JSON to see summary</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form 16 Tab */}
      {activeTab === 'form16' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">📋 Upload Form 16 (JSON)</h3>
            <p className="text-sm text-gray-500 mb-4">
              Download Form 16 Part A/B from TRACES portal and upload JSON here.
            </p>
            
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-400 transition-colors">
              <input type="file" accept=".json" onChange={handleForm16Upload} className="hidden" id="form16-upload" />
              <label htmlFor="form16-upload" className="cursor-pointer">
                <div className="text-4xl mb-3">📤</div>
                <p className="font-medium text-gray-700">Click to upload Form 16 JSON</p>
                <p className="text-xs text-gray-400 mt-1">or drag and drop JSON file</p>
              </label>
            </div>

            <div className="mt-4 space-y-2">
              <a href="https://www.tdscpc.gov.in" target="_blank"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                🔗 Go to TRACES Portal to download Form 16
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">📊 Form 16 Summary</h3>
            
            {form16Data ? (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Employee</p>
                      <p className="font-semibold">{form16Data.employeeName || form16Data.employee_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">PAN</p>
                      <p className="font-mono">{form16Data.pan || form16Data.PAN || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Employer</p>
                      <p className="font-semibold">{form16Data.employerName || form16Data.employer_name || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">{fmt(form16Data.grossSalary || form16Data.gross_salary || 0)}</p>
                    <p className="text-xs text-blue-600">Gross Salary</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-700">{fmt(form16Data.totalTDS || form16Data.total_tds || 0)}</p>
                    <p className="text-xs text-red-600">TDS Deducted</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">DEDUCTIONS CLAIMED</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">80C</span><span className="font-mono">{fmt(form16Data.section80C || form16Data.section_80c || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">80D</span><span className="font-mono">{fmt(form16Data.section80D || form16Data.section_80d || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">HRA</span><span className="font-mono">{fmt(form16Data.hraReceived || form16Data.hra_received || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Professional Tax</span><span className="font-mono">{fmt(form16Data.professionalTax || form16Data.professional_tax || 0)}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">Upload Form 16 JSON to see summary</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AIS Tab */}
      {activeTab === 'ais' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">📊 Annual Information Statement (AIS)</h3>
          <p className="text-sm text-gray-500 mb-4">
            AIS contains complete information of your tax-related transactions. Download from Income Tax Portal.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <input type="file" accept=".json" className="hidden" id="ais-upload" />
                <label htmlFor="ais-upload" className="cursor-pointer">
                  <div className="text-4xl mb-3">📤</div>
                  <p className="font-medium text-gray-700">Upload AIS JSON</p>
                </label>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
              <h4 className="font-semibold text-purple-800 mb-3">AIS Includes:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ TDS from all sources</li>
                <li>✅ TCS collections</li>
                <li>✅ Interest from banks/post office</li>
                <li>✅ Dividends</li>
                <li>✅ Capital gains from stocks/mutual funds</li>
                <li>✅ Foreign income</li>
                <li>✅ GST turnover (for businesses)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Auto Populate Tab */}
      {activeTab === 'auto' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">⚡ Auto Populate ITR from Imported Data</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select a client and click below to automatically create ITR from uploaded Form 26AS and Form 16 data.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Form 26AS</p>
              <p className={`font-semibold ${form26asData ? 'text-green-600' : 'text-red-500'}`}>
                {form26asData ? '✅ Loaded' : '❌ Not Uploaded'}
              </p>
              {form26asData && <p className="text-xs text-gray-500">{fmt(calculateForm26ASTotals().totalTDS)} TDS</p>}
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Form 16</p>
              <p className={`font-semibold ${form16Data ? 'text-green-600' : 'text-red-500'}`}>
                {form16Data ? '✅ Loaded' : '❌ Not Uploaded'}
              </p>
              {form16Data && <p className="text-xs text-gray-500">{fmt(form16Data.grossSalary)} Salary</p>}
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Select Client</p>
              <select className="w-full border rounded px-2 py-1" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                <option value="">Choose client...</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.pan})</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={createITRFromImport}
            disabled={!form26asData && !form16Data || !selectedClient || importing}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
            {importing ? 'Creating ITR...' : '🚀 Auto Create ITR Filing'}
          </button>

          {mappedITR && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-800">✅ ITR Created Successfully!</p>
              <p className="text-sm text-green-600 mt-1">
                ITR-{mappedITR.itrType} for AY {mappedITR.assessmentYear} has been created.
              </p>
              <a href="/itr" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                → Go to ITR Filings
              </a>
            </div>
          )}
        </div>
      )}

      {/* Quick Guide */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">📖 Quick Guide to Download Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Form 26AS Download Steps:</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Login to <a href="https://www.incometax.gov.in" target="_blank" className="text-blue-600">incometax.gov.in</a></li>
              <li>Go to "My Account" → "View Form 26AS"</li>
              <li>Select Assessment Year</li>
              <li>Click "Download" → Select "JSON" format</li>
              <li>Upload the downloaded JSON file here</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Form 16 Download Steps:</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Login to <a href="https://www.tdscpc.gov.in" target="_blank" className="text-blue-600">tdscpc.gov.in</a></li>
              <li>Go to "Taxpayer Services" → "Form 16"</li>
              <li>Enter TAN and PAN</li>
              <li>Select Financial Year</li>
              <li>Download Form 16 Part A/B in JSON</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
