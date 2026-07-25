import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';
const fmtNum = (n) => Number(n || 0);

const EMPTY_FORM = {
  assessmentYear: '2024-25',
  // Salary
  grossSalary: '',
  valueOfPerquisites: '',
  profitsInLieuOfSalary: '',
  exemptAllowances: '',
  professionalTax: '',
  // HRA
  hraReceived: '',
  hraRentPaid: '',
  hraMetroCity: false,
  // Other Income
  housePropertyIncome: '',
  businessIncome: '',
  capitalGains: '',
  otherIncome: '',
  // Capital Gains Details
  stcgShares: '',
  ltcgShares: '',
  stcgProperty: '',
  ltcgProperty: '',
  // Deductions - 80C
  lifeInsurance: '',
  ppf: '',
  elss: '',
  homeLoanPrincipal: '',
  tuitionFees: '',
  fd5Year: '',
  nsc: '',
  other80C: '',
  // 80D
  healthInsuranceSelf: '',
  healthInsuranceParents: '',
  healthInsuranceSenior: false,
  // 80CCD
  npsSelf: '',
  npsAdditional: '',
  npsEmployer: '',
  // Other Deductions
  homeLoanInterest: '',
  educationLoan: '',
  donation80G: '',
  savingsInterest: '',
  seniorCitizen: false,
  // TDS
  tdsSalary: '',
  tdsOther: '',
  advanceTax: ''
};

export default function TaxCalculator() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('income');

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Calculate totals
  const calculate80C = () => {
    return Math.min(
      fmtNum(form.lifeInsurance) + fmtNum(form.ppf) + fmtNum(form.elss) +
      fmtNum(form.homeLoanPrincipal) + fmtNum(form.tuitionFees) + fmtNum(form.fd5Year) +
      fmtNum(form.nsc) + fmtNum(form.other80C),
      150000
    );
  };

  const calculate80D = () => {
    let amount = fmtNum(form.healthInsuranceSelf);
    amount += fmtNum(form.healthInsuranceParents);
    // Senior citizen limit is higher (50k vs 25k)
    const maxLimit = form.healthInsuranceSenior ? 100000 : 50000;
    return Math.min(amount, maxLimit);
  };

  const calculateHRAExemption = () => {
    if (!form.hraReceived) return 0;
    const hra = fmtNum(form.hraReceived);
    const rent = fmtNum(form.hraRentPaid);
    const basic = fmtNum(form.grossSalary) * 0.4; // Approximate
    
    const option1 = hra;
    const option2 = Math.max(0, rent - basic * 0.1);
    const option3 = basic * (form.hraMetroCity ? 0.5 : 0.4);
    
    return Math.min(option1, option2, option3);
  };

  const calculateGrossSalary = () => {
    const gross = fmtNum(form.grossSalary);
    const perquisites = fmtNum(form.valueOfPerquisites);
    const profits = fmtNum(form.profitsInLieuOfSalary);
    const exempt = fmtNum(form.exemptAllowances);
    const pt = fmtNum(form.professionalTax);
    const hraExempt = calculateHRAExemption();
    
    return gross + perquisites + profits - exempt - pt - hraExempt;
  };

  const calculateTotalIncome = () => {
    const salary = calculateGrossSalary();
    const hp = fmtNum(form.housePropertyIncome);
    const business = fmtNum(form.businessIncome);
    const cg = fmtNum(form.capitalGains);
    const other = fmtNum(form.otherIncome);
    
    return salary + hp + business + cg + other;
  };

  const calculateNewRegimeTax = (grossIncome) => {
    // New Regime: Standard deduction 75,000 + Employer NPS
    const standardDeduction = 75000;
    const npsEmployer = Math.min(fmtNum(form.npsEmployer), 750000);
    const npsAdditional = Math.min(fmtNum(form.npsAdditional), 50000);
    
    const taxableIncome = Math.max(0, grossIncome - standardDeduction - npsEmployer - npsAdditional - calculateHRAExemption());
    
    if (taxableIncome <= 300000) return { tax: 0, surcharge: 0, cess: 0, total: 0, taxableIncome };
    if (taxableIncome <= 700000) {
      const tax = (taxableIncome - 300000) * 0.05;
      return { tax, surcharge: 0, cess: Math.round(tax * 0.04), total: Math.round(tax * 1.04), taxableIncome };
    }
    
    let tax = 0;
    if (taxableIncome > 2000000) {
      tax += (taxableIncome - 2000000) * 0.30;
      tax += 500000 * 0.25;
      tax += 300000 * 0.20;
      tax += 300000 * 0.15;
      tax += 300000 * 0.10;
      tax += 400000 * 0.05;
    } else if (taxableIncome > 1500000) {
      tax += (taxableIncome - 1500000) * 0.25;
      tax += 300000 * 0.20;
      tax += 300000 * 0.15;
      tax += 300000 * 0.10;
      tax += 400000 * 0.05;
    } else if (taxableIncome > 1200000) {
      tax += (taxableIncome - 1200000) * 0.20;
      tax += 300000 * 0.15;
      tax += 300000 * 0.10;
      tax += 400000 * 0.05;
    } else if (taxableIncome > 900000) {
      tax += (taxableIncome - 900000) * 0.15;
      tax += 300000 * 0.10;
      tax += 400000 * 0.05;
    } else if (taxableIncome > 600000) {
      tax += (taxableIncome - 600000) * 0.10;
      tax += 400000 * 0.05;
    } else {
      tax += (taxableIncome - 300000) * 0.05;
    }
    
    // Rebate 87A for new regime
    if (taxableIncome <= 700000) {
      return { tax: 0, surcharge: 0, cess: 0, total: 0, taxableIncome };
    }
    
    // Surcharge
    let surcharge = 0;
    if (taxableIncome > 50000000) surcharge = tax * 0.25;
    else if (taxableIncome > 20000000) surcharge = tax * 0.15;
    else if (taxableIncome > 10000000) surcharge = tax * 0.10;
    
    const cess = Math.round((tax + surcharge) * 0.04);
    
    return { tax: Math.round(tax), surcharge, cess, total: Math.round(tax + surcharge + cess), taxableIncome };
  };

  const calculateOldRegimeTax = (grossIncome) => {
    // Old Regime: Full deductions
    const sec80C = calculate80C();
    const sec80D = calculate80D();
    const npsSelf = fmtNum(form.npsSelf);
    const npsAdditional = fmtNum(form.npsAdditional);
    const homeLoanInterest = Math.min(fmtNum(form.homeLoanInterest), 200000);
    const educationLoan = fmtNum(form.educationLoan);
    const donation80G = fmtNum(form.donation80G);
    const savingsInterest = form.seniorCitizen ? Math.min(fmtNum(form.savingsInterest), 50000) : Math.min(fmtNum(form.savingsInterest), 10000);
    const hraExempt = calculateHRAExemption();
    const professionalTax = fmtNum(form.professionalTax);
    
    const totalDeductions = sec80C + sec80D + npsSelf + npsAdditional + homeLoanInterest + educationLoan + donation80G + savingsInterest + hraExempt + professionalTax;
    const taxableIncome = Math.max(0, grossIncome - totalDeductions - 50000); // 50k standard deduction
    
    if (taxableIncome <= 300000) return { tax: 0, surcharge: 0, cess: 0, total: 0, taxableIncome, totalDeductions };
    if (taxableIncome <= 500000) {
      const tax = (taxableIncome - 300000) * 0.05;
      return { tax, surcharge: 0, cess: Math.round(tax * 0.04), total: Math.round(tax * 1.04), taxableIncome, totalDeductions };
    }
    
    let tax = 0;
    if (taxableIncome > 10000000) {
      tax += (taxableIncome - 10000000) * 0.30;
      tax += 5000000 * 0.20;
      tax += 2500000 * 0.20;
      tax += 1000000 * 0.20;
      tax += 600000 * 0.05;
    } else if (taxableIncome > 5000000) {
      tax += (taxableIncome - 5000000) * 0.20;
      tax += 2500000 * 0.20;
      tax += 1000000 * 0.20;
      tax += 600000 * 0.05;
    } else if (taxableIncome > 2500000) {
      tax += (taxableIncome - 2500000) * 0.20;
      tax += 1000000 * 0.20;
      tax += 600000 * 0.05;
    } else if (taxableIncome > 1500000) {
      tax += (taxableIncome - 1500000) * 0.20;
      tax += 600000 * 0.05;
    } else if (taxableIncome > 1200000) {
      tax += (taxableIncome - 1200000) * 0.20;
      tax += 600000 * 0.05;
    } else if (taxableIncome > 900000) {
      tax += (taxableIncome - 900000) * 0.20;
      tax += 600000 * 0.05;
    } else if (taxableIncome > 600000) {
      tax += (taxableIncome - 600000) * 0.20;
      tax += 300000 * 0.05;
    } else {
      tax += (taxableIncome - 300000) * 0.05;
    }
    
    // Surcharge
    let surcharge = 0;
    if (taxableIncome > 50000000) surcharge = tax * 0.37;
    else if (taxableIncome > 20000000) surcharge = tax * 0.25;
    else if (taxableIncome > 10000000) surcharge = tax * 0.15;
    else if (taxableIncome > 5000000) surcharge = tax * 0.10;
    
    const cess = Math.round((tax + surcharge) * 0.04);
    
    return { tax: Math.round(tax), surcharge, cess, total: Math.round(tax + surcharge + cess), taxableIncome, totalDeductions };
  };

  const calculateTax = () => {
    const grossIncome = calculateTotalIncome();
    const newRegime = calculateNewRegimeTax(grossIncome);
    const oldRegime = calculateOldRegimeTax(grossIncome);
    
    const tds = fmtNum(form.tdsSalary) + fmtNum(form.tdsOther);
    const advanceTax = fmtNum(form.advanceTax);
    const totalPaid = tds + advanceTax;
    
    const newRegimePayable = Math.max(0, newRegime.total - totalPaid);
    const newRegimeRefund = Math.max(0, totalPaid - newRegime.total);
    
    const oldRegimePayable = Math.max(0, oldRegime.total - totalPaid);
    const oldRegimeRefund = Math.max(0, totalPaid - oldRegime.total);
    
    setResult({
      grossIncome,
      newRegime: { ...newRegime, payable: newRegimePayable, refund: newRegimeRefund, totalPaid },
      oldRegime: { ...oldRegime, payable: oldRegimePayable, refund: oldRegimeRefund, totalPaid },
      recommended: oldRegime.total <= newRegime.total ? 'old' : 'new',
      savings: Math.abs(oldRegime.total - newRegime.total)
    });
  };

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const sectionClass = "bg-white rounded-xl border border-gray-100 p-5 shadow-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">🧮 Income Tax Calculator</h1>
          <p className="text-sm text-gray-500 mt-1">Compare Old vs New Tax Regime • AY {form.assessmentYear}</p>
        </div>
        <button onClick={calculateTax} className="btn-primary px-6 py-2.5 text-base font-semibold">
          Calculate Tax
        </button>
      </div>

      {/* Quick Summary Cards */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${result.recommended === 'new' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gray-100'} rounded-xl p-5 text-white`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-80">New Regime</span>
              {result.recommended === 'new' && <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">Recommended</span>}
            </div>
            <p className="text-2xl font-bold">{fmt(result.newRegime.total)}</p>
            <p className="text-xs opacity-80 mt-1">Taxable: {fmt(result.newRegime.taxableIncome)}</p>
          </div>
          <div className={`${result.recommended === 'old' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gray-100'} rounded-xl p-5 text-white`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-80">Old Regime</span>
              {result.recommended === 'old' && <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">Recommended</span>}
            </div>
            <p className="text-2xl font-bold">{fmt(result.oldRegime.total)}</p>
            <p className="text-xs opacity-80 mt-1">Deductions: {fmt(result.oldRegime.totalDeductions)}</p>
          </div>
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-5 text-white">
            <span className="text-sm font-medium opacity-80">You Save</span>
            <p className="text-2xl font-bold">{fmt(result.savings)}</p>
            <p className="text-xs opacity-80 mt-1">with {result.recommended === 'new' ? 'New' : 'Old'} Regime</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {['income', 'deductions', 'tax'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'tax' ? 'TDS/Payments' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Income Section */}
      {activeTab === 'income' && (
        <div className="space-y-6">
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              💰 Salary Income
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Gross Salary (Basic + Allowances)</label>
                <input type="number" className={inputClass} value={form.grossSalary} onChange={e => updateField('grossSalary', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Value of Perquisites</label>
                <input type="number" className={inputClass} value={form.valueOfPerquisites} onChange={e => updateField('valueOfPerquisites', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Profits in Lieu of Salary</label>
                <input type="number" className={inputClass} value={form.profitsInLieuOfSalary} onChange={e => updateField('profitsInLieuOfSalary', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Exempt Allowances (LTA, HRA, etc.)</label>
                <input type="number" className={inputClass} value={form.exemptAllowances} onChange={e => updateField('exemptAllowances', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Professional Tax Paid</label>
                <input type="number" className={inputClass} value={form.professionalTax} onChange={e => updateField('professionalTax', e.target.value)} placeholder="0" />
              </div>
              <div className="flex items-end">
                <p className="text-sm text-gray-500">Net Salary: <span className="font-semibold text-gray-800">{fmt(calculateGrossSalary())}</span></p>
              </div>
            </div>
          </div>

          {/* HRA Section */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🏠 House Rent Allowance (HRA)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>HRA Received from Employer</label>
                <input type="number" className={inputClass} value={form.hraReceived} onChange={e => updateField('hraReceived', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Rent Paid per Month</label>
                <input type="number" className={inputClass} value={form.hraRentPaid} onChange={e => updateField('hraRentPaid', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Metro City?</label>
                <select className={inputClass} value={form.hraMetroCity} onChange={e => updateField('hraMetroCity', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes (Delhi, Mumbai, Chennai, Kolkata)</option>
                </select>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">HRA Exemption: <span className="font-semibold">{fmt(calculateHRAExemption())}</span></p>
            </div>
          </div>

          {/* Other Income */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📈 Other Income Sources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>House Property Income</label>
                <input type="number" className={inputClass} value={form.housePropertyIncome} onChange={e => updateField('housePropertyIncome', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Business/Profession Income</label>
                <input type="number" className={inputClass} value={form.businessIncome} onChange={e => updateField('businessIncome', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Short Term Capital Gains</label>
                <input type="number" className={inputClass} value={form.capitalGains} onChange={e => updateField('capitalGains', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Other Income (Interest, Dividend)</label>
                <input type="number" className={inputClass} value={form.otherIncome} onChange={e => updateField('otherIncome', e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deductions Section */}
      {activeTab === 'deductions' && (
        <div className="space-y-6">
          {/* Section 80C */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">80C Investments (Max ₹1,50,000)</h3>
              <span className="text-sm font-medium text-brand-600">{fmt(calculate80C())}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Life Insurance Premium</label>
                <input type="number" className={inputClass} value={form.lifeInsurance} onChange={e => updateField('lifeInsurance', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>PPF Contribution</label>
                <input type="number" className={inputClass} value={form.ppf} onChange={e => updateField('ppf', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>ELSS Mutual Funds</label>
                <input type="number" className={inputClass} value={form.elss} onChange={e => updateField('elss', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Home Loan Principal</label>
                <input type="number" className={inputClass} value={form.homeLoanPrincipal} onChange={e => updateField('homeLoanPrincipal', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Children Tuition Fees</label>
                <input type="number" className={inputClass} value={form.tuitionFees} onChange={e => updateField('tuitionFees', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>5-Year FD (Tax Saver)</label>
                <input type="number" className={inputClass} value={form.fd5Year} onChange={e => updateField('fd5Year', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>NSC Investment</label>
                <input type="number" className={inputClass} value={form.nsc} onChange={e => updateField('nsc', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Other 80C Items</label>
                <input type="number" className={inputClass} value={form.other80C} onChange={e => updateField('other80C', e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Section 80D */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">80D Health Insurance (Max ₹1,00,000)</h3>
              <span className="text-sm font-medium text-brand-600">{fmt(calculate80D())}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Self, Spouse & Children Premium</label>
                <input type="number" className={inputClass} value={form.healthInsuranceSelf} onChange={e => updateField('healthInsuranceSelf', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Parents' Premium</label>
                <input type="number" className={inputClass} value={form.healthInsuranceParents} onChange={e => updateField('healthInsuranceParents', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Parents Senior Citizen?</label>
                <select className={inputClass} value={form.healthInsuranceSenior} onChange={e => updateField('healthInsuranceSenior', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes (Higher limit)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 80CCD (NPS) */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">80CCD NPS Contributions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Self Contribution (80CCD(1))</label>
                <input type="number" className={inputClass} value={form.npsSelf} onChange={e => updateField('npsSelf', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Additional NPS (80CCD(1B)) Max ₹50,000</label>
                <input type="number" className={inputClass} value={form.npsAdditional} onChange={e => updateField('npsAdditional', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Employer Contribution (80CCD(2))</label>
                <input type="number" className={inputClass} value={form.npsEmployer} onChange={e => updateField('npsEmployer', e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Other Deductions */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Other Deductions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Home Loan Interest (80E/24b)</label>
                <input type="number" className={inputClass} value={form.homeLoanInterest} onChange={e => updateField('homeLoanInterest', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Education Loan Interest (80E)</label>
                <input type="number" className={inputClass} value={form.educationLoan} onChange={e => updateField('educationLoan', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Donations (80G)</label>
                <input type="number" className={inputClass} value={form.donation80G} onChange={e => updateField('donation80G', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Savings Interest (80TTA/TTB)</label>
                <input type="number" className={inputClass} value={form.savingsInterest} onChange={e => updateField('savingsInterest', e.target.value)} placeholder="0" />
                <select className="mt-1" value={form.seniorCitizen} onChange={e => updateField('seniorCitizen', e.target.value === 'true')}>
                  <option value="false">Below 60 years</option>
                  <option value="true">60+ years (80TTB)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TDS/Payments Section */}
      {activeTab === 'tax' && (
        <div className="space-y-6">
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Tax Already Paid</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>TDS on Salary</label>
                <input type="number" className={inputClass} value={form.tdsSalary} onChange={e => updateField('tdsSalary', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>TDS on Other Income</label>
                <input type="number" className={inputClass} value={form.tdsOther} onChange={e => updateField('tdsOther', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Advance Tax Paid</label>
                <input type="number" className={inputClass} value={form.advanceTax} onChange={e => updateField('advanceTax', e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Detailed Comparison */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Regime Details */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">New Regime</h3>
                  {result.recommended === 'new' && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Recommended</span>}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Gross Income</span><span className="font-mono">{fmt(result.grossIncome)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Standard Deduction</span><span className="font-mono text-green-600">- ₹75,000</span></div>
                  <div className="flex justify-between font-medium"><span>Taxable Income</span><span className="font-mono">{fmt(result.newRegime.taxableIncome)}</span></div>
                  <hr className="my-2" />
                  <div className="flex justify-between"><span className="text-gray-600">Tax Slab</span><span className="font-mono">{fmt(result.newRegime.tax)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Surcharge</span><span className="font-mono">{fmt(result.newRegime.surcharge)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Health & Education Cess</span><span className="font-mono">{fmt(result.newRegime.cess)}</span></div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold"><span>Total Tax</span><span className="font-mono text-brand-600">{fmt(result.newRegime.total)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Tax Paid</span><span className="font-mono text-green-600">- {fmt(result.newRegime.totalPaid)}</span></div>
                  <hr className="my-2" />
                  {result.newRegime.payable > 0 ? (
                    <div className="flex justify-between font-bold text-red-600"><span>Tax Payable</span><span className="font-mono">{fmt(result.newRegime.payable)}</span></div>
                  ) : (
                    <div className="flex justify-between font-bold text-green-600"><span>Refund Due</span><span className="font-mono">{fmt(result.newRegime.refund)}</span></div>
                  )}
                </div>
              </div>

              {/* Old Regime Details */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Old Regime</h3>
                  {result.recommended === 'old' && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Recommended</span>}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Gross Income</span><span className="font-mono">{fmt(result.grossIncome)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Total Deductions</span><span className="font-mono text-green-600">- {fmt(result.oldRegime.totalDeductions)}</span></div>
                  <div className="flex justify-between font-medium"><span>Taxable Income</span><span className="font-mono">{fmt(result.oldRegime.taxableIncome)}</span></div>
                  <hr className="my-2" />
                  <div className="flex justify-between"><span className="text-gray-600">Tax Slab</span><span className="font-mono">{fmt(result.oldRegime.tax)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Surcharge</span><span className="font-mono">{fmt(result.oldRegime.surcharge)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Health & Education Cess</span><span className="font-mono">{fmt(result.oldRegime.cess)}</span></div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold"><span>Total Tax</span><span className="font-mono text-brand-600">{fmt(result.oldRegime.total)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Tax Paid</span><span className="font-mono text-green-600">- {fmt(result.oldRegime.totalPaid)}</span></div>
                  <hr className="my-2" />
                  {result.oldRegime.payable > 0 ? (
                    <div className="flex justify-between font-bold text-red-600"><span>Tax Payable</span><span className="font-mono">{fmt(result.oldRegime.payable)}</span></div>
                  ) : (
                    <div className="flex justify-between font-bold text-green-600"><span>Refund Due</span><span className="font-mono">{fmt(result.oldRegime.refund)}</span></div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tax Slab Reference */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">📊 Tax Slab Reference AY {form.assessmentYear}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">New Regime</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500"><th>Income Range</th><th className="text-right">Rate</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td>₹0 - ₹3,00,000</td><td className="text-right">NIL</td></tr>
                <tr><td>₹3,00,001 - ₹6,00,000</td><td className="text-right">5%</td></tr>
                <tr><td>₹6,00,001 - ₹9,00,000</td><td className="text-right">10%</td></tr>
                <tr><td>₹9,00,001 - ₹12,00,000</td><td className="text-right">15%</td></tr>
                <tr><td>₹12,00,001 - ₹15,00,000</td><td className="text-right">20%</td></tr>
                <tr><td>₹15,00,001+</td><td className="text-right">30%</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">Rebate 87A: Tax rebate for income up to ₹7L</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Old Regime</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500"><th>Income Range</th><th className="text-right">Rate</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td>₹0 - ₹2,50,000</td><td className="text-right">NIL</td></tr>
                <tr><td>₹2,50,001 - ₹5,00,000</td><td className="text-right">5%</td></tr>
                <tr><td>₹5,00,001 - ₹10,00,000</td><td className="text-right">20%</td></tr>
                <tr><td>₹10,00,001+</td><td className="text-right">30%</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">Rebate 87A: Tax rebate for income up to ₹5L</p>
          </div>
        </div>
      </div>
    </div>
  );
}
