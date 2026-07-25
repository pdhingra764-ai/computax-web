import React, { useState } from 'react';
import toast from 'react-hot-toast';

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';
const fmtNum = (n) => Number(n || 0);

export default function Form16Generator() {
  const [form, setForm] = useState({
    // Employee Details
    employeeName: '',
    pan: '',
    aadhaar: '',
    designation: '',
    empStatus: 'GOVERNMENT',
    // Employer Details
    employerName: '',
    employerPan: '',
    tan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    // Period
    assessmentYear: '2024-25',
    fyStart: '01-04-2023',
    fyEnd: '31-03-2024',
    // Salary Details
    grossSalary: '',
    valueOfPerquisites: '',
    profitsInLieuOfSalary: '',
    // Allowances
    taReceived: '',
    totalAllowances: '',
    // Exemptions
    hraExemption: '',
    ltaExemption: '',
    otherExemption: '',
    // Section 80C
    section80C: '',
    // Section 80CCC
    section80CCC: '',
    // Section 80CCD
    section80CCD1: '',
    section80CCD1B: '',
    section80CCD2: '',
    // Section 80D
    section80D: '',
    // Section 80E
    section80E: '',
    // Other Sections
    section80G: '',
    section80TTA: '',
    // Chapter VI
    chapterVI: '',
    // Tax Details
    totalTaxableSalary: '',
    totalDeductions: '',
    taxableIncome: '',
    taxOnIncome: '',
    rebate87A: '',
    taxAfterRebate: '',
    surcharge: '',
    cess: '',
    totalTax: '',
    // TDS
    tdsOnSalary: '',
    tdsOnIncome: '',
    totalTdsDeducted: '',
    // Relief
    relief89: '',
    netTax: ''
  });

  const [generated, setGenerated] = useState(false);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotals = () => {
    const grossSalary = fmtNum(form.grossSalary);
    const perquisites = fmtNum(form.valueOfPerquisites);
    const profits = fmtNum(form.profitsInLieuOfSalary);
    const totalGross = grossSalary + perquisites + profits;

    const hra = fmtNum(form.hraExemption);
    const lta = fmtNum(form.ltaExemption);
    const other = fmtNum(form.otherExemption);
    const totalExempt = hra + lta + other;

    const sec80C = Math.min(fmtNum(form.section80C), 150000);
    const sec80CCC = fmtNum(form.section80CCC);
    const sec80CCD1 = fmtNum(form.section80CCD1);
    const sec80CCD1B = Math.min(fmtNum(form.section80CCD1B), 50000);
    const sec80CCD2 = fmtNum(form.section80CCD2);
    const sec80D = fmtNum(form.section80D);
    const sec80E = fmtNum(form.section80E);
    const sec80G = fmtNum(form.section80G);
    const sec80TTA = Math.min(fmtNum(form.section80TTA), 10000);
    const chapterVI = fmtNum(form.chapterVI);

    const totalDeductions = sec80C + sec80CCC + sec80CCD1 + sec80CCD1B + sec80CCD2 + 
                           sec80D + sec80E + sec80G + sec80TTA + chapterVI;

    const taxableSalary = Math.max(0, totalGross - totalExempt - 50000 - totalDeductions);

    // Calculate tax
    let tax = 0;
    if (taxableSalary <= 300000) tax = 0;
    else if (taxableSalary <= 500000) tax = (taxableSalary - 300000) * 0.05;
    else if (taxableSalary <= 1000000) tax = 10000 + (taxableSalary - 500000) * 0.20;
    else tax = 110000 + (taxableSalary - 1000000) * 0.30;

    const rebate = taxableSalary <= 500000 ? tax : 0;
    const taxAfterRebate = tax - rebate;
    
    let surcharge = 0;
    if (taxableSalary > 50000000) surcharge = taxAfterRebate * 0.37;
    else if (taxableSalary > 20000000) surcharge = taxAfterRebate * 0.25;
    else if (taxableSalary > 10000000) surcharge = taxAfterRebate * 0.15;
    else if (taxableSalary > 5000000) surcharge = taxAfterRebate * 0.10;

    const cess = Math.round((taxAfterRebate + surcharge) * 0.04);
    const totalTax = Math.round(taxAfterRebate + surcharge + cess);

    return {
      totalGross,
      totalExempt,
      totalDeductions,
      taxableSalary,
      tax,
      rebate,
      taxAfterRebate,
      surcharge,
      cess,
      totalTax
    };
  };

  const generateForm16 = () => {
    if (!form.employeeName || !form.pan || !form.employerName || !form.tan) {
      toast.error('Please fill in all required fields');
      return;
    }
    setGenerated(true);
    toast.success('Form 16 generated successfully!');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const sectionClass = "bg-white rounded-xl border border-gray-100 p-5 shadow-sm";
  const printRef = React.useRef();

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">📄 Form 16 Generator</h1>
          <p className="text-sm text-gray-500 mt-1">Generate TDS Certificate (Part A & B) for AY {form.assessmentYear}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="btn-secondary px-4 py-2" disabled={!generated}>
            🖨️ Print Form 16
          </button>
          <button onClick={generateForm16} className="btn-primary px-6 py-2">
            Generate Form 16
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Details */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">👤 Employee Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Employee Name *</label>
                <input className={inputClass} value={form.employeeName} onChange={e => updateField('employeeName', e.target.value)} placeholder="Full Name" />
              </div>
              <div>
                <label className={labelClass}>PAN *</label>
                <input className={inputClass} value={form.pan} onChange={e => updateField('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
              </div>
              <div>
                <label className={labelClass}>Aadhaar Number</label>
                <input className={inputClass} value={form.aadhaar} onChange={e => updateField('aadhaar', e.target.value)} placeholder="XXXX XXXX XXXX" />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input className={inputClass} value={form.designation} onChange={e => updateField('designation', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Employment Status</label>
                <select className={inputClass} value={form.empStatus} onChange={e => updateField('empStatus', e.target.value)}>
                  <option value="GOVERNMENT">Government</option>
                  <option value="PENSIONER">Pensioner</option>
                  <option value="OTHER">Others</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employer Details */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">🏢 Employer Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Employer Name *</label>
                <input className={inputClass} value={form.employerName} onChange={e => updateField('employerName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Employer PAN *</label>
                <input className={inputClass} value={form.employerPan} onChange={e => updateField('employerPan', e.target.value.toUpperCase())} maxLength={10} />
              </div>
              <div>
                <label className={labelClass}>TAN *</label>
                <input className={inputClass} value={form.tan} onChange={e => updateField('tan', e.target.value.toUpperCase())} maxLength={10} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Address</label>
                <input className={inputClass} value={form.address} onChange={e => updateField('address', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input className={inputClass} value={form.city} onChange={e => updateField('city', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input className={inputClass} value={form.state} onChange={e => updateField('state', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Pincode</label>
                <input className={inputClass} value={form.pincode} onChange={e => updateField('pincode', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">💰 Salary Details (FY {form.assessmentYear.slice(0,4)}-{form.assessmentYear.slice(7)})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Gross Salary</label>
                <input type="number" className={inputClass} value={form.grossSalary} onChange={e => updateField('grossSalary', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Value of Perquisites</label>
                <input type="number" className={inputClass} value={form.valueOfPerquisites} onChange={e => updateField('valueOfPerquisites', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Profits in Lieu of Salary</label>
                <input type="number" className={inputClass} value={form.profitsInLieuOfSalary} onChange={e => updateField('profitsInLieuOfSalary', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>HRA Exemption</label>
                <input type="number" className={inputClass} value={form.hraExemption} onChange={e => updateField('hraExemption', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>LTA Exemption</label>
                <input type="number" className={inputClass} value={form.ltaExemption} onChange={e => updateField('ltaExemption', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Other Exemptions</label>
                <input type="number" className={inputClass} value={form.otherExemption} onChange={e => updateField('otherExemption', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">📉 Deductions (Chapter VI-A)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>80C (Max 1,50,000)</label>
                <input type="number" className={inputClass} value={form.section80C} onChange={e => updateField('section80C', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>80CCC</label>
                <input type="number" className={inputClass} value={form.section80CCC} onChange={e => updateField('section80CCC', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>80CCD(1) Self</label>
                <input type="number" className={inputClass} value={form.section80CCD1} onChange={e => updateField('section80CCD1', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>80CCD(1B) Max 50k</label>
                <input type="number" className={inputClass} value={form.section80CCD1B} onChange={e => updateField('section80CCD1B', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>80CCD(2) Employer</label>
                <input type="number" className={inputClass} value={form.section80CCD2} onChange={e => updateField('section80CCD2', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>80D Health</label>
                <input type="number" className={inputClass} value={form.section80D} onChange={e => updateField('section80D', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>80E Education</label>
                <input type="number" className={inputClass} value={form.section80E} onChange={e => updateField('section80E', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>80G Donations</label>
                <input type="number" className={inputClass} value={form.section80G} onChange={e => updateField('section80G', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>80TTA Savings</label>
                <input type="number" className={inputClass} value={form.section80TTA} onChange={e => updateField('section80TTA', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Other Chapter VI-A Deductions</label>
                <input type="number" className={inputClass} value={form.chapterVI} onChange={e => updateField('chapterVI', e.target.value)} />
              </div>
            </div>
          </div>

          {/* TDS Details */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">💵 TDS & Tax Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>TDS on Salary</label>
                <input type="number" className={inputClass} value={form.tdsOnSalary} onChange={e => updateField('tdsOnSalary', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>TDS on Other Income</label>
                <input type="number" className={inputClass} value={form.tdsOnIncome} onChange={e => updateField('tdsOnIncome', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Total TDS Deducted</label>
                <input type="number" className={inputClass} value={form.totalTdsDeducted} onChange={e => updateField('totalTdsDeducted', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Relief under 89(1)</label>
                <input type="number" className={inputClass} value={form.relief89} onChange={e => updateField('relief89', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-brand-50 to-white rounded-xl border border-brand-100 p-5 shadow-sm sticky top-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">📊 Tax Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Salary</span>
                <span className="font-mono">{fmt(totals.totalGross)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exemptions</span>
                <span className="font-mono text-green-600">- {fmt(totals.totalExempt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Standard Deduction</span>
                <span className="font-mono text-green-600">- ₹50,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Deductions</span>
                <span className="font-mono text-green-600">- {fmt(totals.totalDeductions)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold">
                <span>Taxable Income</span>
                <span className="font-mono">{fmt(totals.taxableSalary)}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-600">Tax on Income</span>
                <span className="font-mono">{fmt(totals.tax)}</span>
              </div>
              {totals.rebate > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Rebate 87A</span>
                  <span className="font-mono">- {fmt(totals.rebate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Surcharge</span>
                <span className="font-mono">{fmt(totals.surcharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Health & Education Cess</span>
                <span className="font-mono">{fmt(totals.cess)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Tax</span>
                <span className="font-mono text-brand-600">{fmt(totals.totalTax)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>TDS Deducted</span>
                <span className="font-mono">- {fmt(fmtNum(form.totalTdsDeducted || form.tdsOnSalary))}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>Net Tax Payable</span>
                <span className="font-mono text-red-600">{fmt(Math.max(0, totals.totalTax - fmtNum(form.totalTdsDeducted || form.tdsOnSalary)))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Form 16 Preview */}
      {generated && (
        <div ref={printRef} className="bg-white rounded-xl border-2 border-gray-200 p-8 print:p-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">FORM 16</h2>
            <p className="text-sm text-gray-600">[See Rule 31(1)(a)]</p>
            <p className="text-sm">TDS Certificate (Part A & Part B)</p>
          </div>

          {/* Part A */}
          <div className="border-2 border-black p-4 mb-6">
            <h3 className="font-bold text-center mb-4">PART A</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border p-2">
                <p className="text-xs text-gray-500">Name and Address of the Employer</p>
                <p className="font-semibold">{form.employerName || '-'}</p>
                <p className="text-sm">{form.address || '-'}, {form.city || '-'}, {form.state || '-'}</p>
              </div>
              <div className="border p-2">
                <p className="text-xs text-gray-500">Name and Address of the Employee</p>
                <p className="font-semibold">{form.employeeName || '-'}</p>
                <p className="text-sm">PAN: {form.pan || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">PAN of Deductor</p>
                <p className="font-mono">{form.employerPan || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">TAN of Deductor</p>
                <p className="font-mono">{form.tan || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Assessment Year</p>
                <p className="font-mono">{form.assessmentYear}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Financial Year</p>
                <p className="font-mono">{form.assessmentYear.slice(0,4)}-{form.assessmentYear.slice(7)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Period of Employment</p>
                <p>{form.fyStart} to {form.fyEnd}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">TDS Account No.</p>
                <p className="font-mono">{form.tan || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p>{form.empStatus}</p>
              </div>
            </div>

            <table className="w-full border-collapse border text-sm mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Quarter</th>
                  <th className="border p-2 text-right">TDS Deducted</th>
                  <th className="border p-2 text-right">TDS Remitted</th>
                  <th className="border p-2 text-left">Date of Payment</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border p-2">Q1</td><td className="border p-2 text-right font-mono">-</td><td className="border p-2 text-right font-mono">-</td><td className="border p-2">-</td></tr>
                <tr><td className="border p-2">Q2</td><td className="border p-2 text-right font-mono">-</td><td className="border p-2 text-right font-mono">-</td><td className="border p-2">-</td></tr>
                <tr><td className="border p-2">Q3</td><td className="border p-2 text-right font-mono">-</td><td className="border p-2 text-right font-mono">-</td><td className="border p-2">-</td></tr>
                <tr><td className="border p-2">Q4</td><td className="border p-2 text-right font-mono">-</td><td className="border p-2 text-right font-mono">-</td><td className="border p-2">-</td></tr>
                <tr className="bg-gray-100 font-semibold">
                  <td className="border p-2">Total</td>
                  <td className="border p-2 text-right font-mono">{fmt(fmtNum(form.totalTdsDeducted || form.tdsOnSalary))}</td>
                  <td className="border p-2 text-right font-mono">{fmt(fmtNum(form.totalTdsDeducted || form.tdsOnSalary))}</td>
                  <td className="border p-2"></td>
                </tr>
              </tbody>
            </table>

            <div className="border p-2">
              <p className="text-xs text-gray-500">Verification</p>
              <p className="text-sm">I, <span className="font-semibold">{form.employerName || 'Employer Name'}</span>, son/daughter of _________________, working in the capacity of _________________, do hereby certify that a sum of Rs. <span className="font-mono">{fmt(fmtNum(form.totalTdsDeducted || form.tdsOnSalary))}</span> (Rupees _________________________) has been deducted and deposited to the credit of the Central Government.</p>
            </div>
          </div>

          {/* Part B */}
          <div className="border-2 border-black p-4">
            <h3 className="font-bold text-center mb-4">PART B</h3>
            
            <div className="space-y-4 text-sm">
              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">1. Gross Salary</p>
                <table className="w-full">
                  <tr><td>(a) Salary as per Form 16A</td><td className="text-right font-mono">{fmt(totals.totalGross)}</td></tr>
                  <tr><td>(b) Value of Perquisites [u/s 17(2)]</td><td className="text-right font-mono">{fmt(fmtNum(form.valueOfPerquisites))}</td></tr>
                  <tr><td>(c) Profits in lieu of salary [u/s 17(3)]</td><td className="text-right font-mono">{fmt(fmtNum(form.profitsInLieuOfSalary))}</td></tr>
                  <tr><td>(d) Total Gross Salary</td><td className="text-right font-mono font-semibold">{fmt(totals.totalGross)}</td></tr>
                </table>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">2. Less: Exemptions u/s 10</p>
                <table className="w-full">
                  <tr><td>(a) HRA Exemption</td><td className="text-right font-mono">{fmt(fmtNum(form.hraExemption))}</td></tr>
                  <tr><td>(b) LTA Exemption</td><td className="text-right font-mono">{fmt(fmtNum(form.ltaExemption))}</td></tr>
                  <tr><td>(c) Other Exemptions</td><td className="text-right font-mono">{fmt(fmtNum(form.otherExemption))}</td></tr>
                  <tr><td>(d) Total Exemptions</td><td className="text-right font-mono font-semibold">{fmt(totals.totalExempt)}</td></tr>
                </table>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">3. Net Salary (1d - 2d)</p>
                <p className="text-right font-mono font-semibold">{fmt(totals.totalGross - totals.totalExempt)}</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">4. Less: Deductions</p>
                <table className="w-full">
                  <tr><td>(a) Standard Deduction u/s 16(ia)</td><td className="text-right font-mono">50,000</td></tr>
                  <tr><td>(b) Professional Tax u/s 16(iii)</td><td className="text-right font-mono">-</td></tr>
                  <tr><td>(c) Total Standard Deductions</td><td className="text-right font-mono font-semibold">50,000</td></tr>
                </table>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">5. Aggregate of 4(a) to 4(c)</p>
                <p className="text-right font-mono font-semibold">50,000</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">6. Income chargeable under "Salaries"</p>
                <p className="text-right font-mono font-semibold">{fmt(totals.totalGross - totals.totalExempt - 50000)}</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">7. Add: Any other income reported by employee</p>
                <p className="text-right font-mono">-</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">8. Gross Total Income (6 + 7)</p>
                <p className="text-right font-mono font-semibold">{fmt(totals.totalGross - totals.totalExempt - 50000)}</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">9. Less: Deductions under Chapter VI-A</p>
                <table className="w-full">
                  <tr><td>(a) 80C</td><td className="text-right font-mono">{fmt(Math.min(fmtNum(form.section80C), 150000))}</td></tr>
                  <tr><td>(b) 80CCD(1) & 80CCD(1B)</td><td className="text-right font-mono">{fmt(fmtNum(form.section80CCD1) + fmtNum(form.section80CCD1B))}</td></tr>
                  <tr><td>(c) 80CCD(2) Employer</td><td className="text-right font-mono">{fmt(fmtNum(form.section80CCD2))}</td></tr>
                  <tr><td>(d) 80D</td><td className="text-right font-mono">{fmt(fmtNum(form.section80D))}</td></tr>
                  <tr><td>(e) 80E</td><td className="text-right font-mono">{fmt(fmtNum(form.section80E))}</td></tr>
                  <tr><td>(f) 80G</td><td className="text-right font-mono">{fmt(fmtNum(form.section80G))}</td></tr>
                  <tr><td>(g) 80TTA</td><td className="text-right font-mono">{fmt(fmtNum(form.section80TTA))}</td></tr>
                  <tr><td>(h) Other Chapter VI-A</td><td className="text-right font-mono">{fmt(fmtNum(form.chapterVI))}</td></tr>
                  <tr className="font-semibold"><td>(i) Total Deductions</td><td className="text-right font-mono">{fmt(totals.totalDeductions)}</td></tr>
                </table>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">10. Total Taxable Income (8 - 9)</p>
                <p className="text-right font-mono font-semibold text-lg">{fmt(totals.taxableSalary)}</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">11. Tax on Total Income</p>
                <p className="text-right font-mono font-semibold">{fmt(totals.tax)}</p>
              </div>

              {totals.rebate > 0 && (
                <div className="border p-2">
                  <p className="text-xs text-gray-500 mb-1">12. Less: Rebate under section 87A</p>
                  <p className="text-right font-mono text-green-600">- {fmt(totals.rebate)}</p>
                </div>
              )}

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">13. Tax after Rebate</p>
                <p className="text-right font-mono font-semibold">{fmt(totals.taxAfterRebate)}</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">14. Add: Surcharge</p>
                <p className="text-right font-mono">{fmt(totals.surcharge)}</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">15. Add: Health & Education Cess @4%</p>
                <p className="text-right font-mono">{fmt(totals.cess)}</p>
              </div>

              <div className="border p-2 bg-gray-100">
                <p className="text-xs text-gray-500 mb-1">16. Total Tax Liability</p>
                <p className="text-right font-mono font-bold text-lg">{fmt(totals.totalTax)}</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">17. Less: TDS Deducted</p>
                <p className="text-right font-mono text-green-600">- {fmt(fmtNum(form.totalTdsDeducted || form.tdsOnSalary))}</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">18. Less: Advance Tax Paid</p>
                <p className="text-right font-mono">-</p>
              </div>

              <div className="border p-2">
                <p className="text-xs text-gray-500 mb-1">19. Less: Self Assessment Tax Paid</p>
                <p className="text-right font-mono">-</p>
              </div>

              <div className="border-2 border-black p-3 bg-yellow-50">
                <p className="text-xs text-gray-500 mb-1">20. Net Tax Payable / (Refund Due)</p>
                <p className="text-right font-mono font-bold text-xl text-red-600">{fmt(Math.max(0, totals.totalTax - fmtNum(form.totalTdsDeducted || form.tdsOnSalary)))}</p>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-8 flex justify-between">
            <div className="text-sm">
              <p>Place: _________________</p>
              <p>Date: _________________</p>
            </div>
            <div className="text-right">
              <div className="h-12 w-48 border-b border-gray-400"></div>
              <p className="text-sm">Authorised Signatory</p>
              <p className="text-xs text-gray-500">{form.employerName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
