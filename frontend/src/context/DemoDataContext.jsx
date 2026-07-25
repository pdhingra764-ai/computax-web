// Demo data for when backend is unavailable
export const demoData = {
  user: {
    _id: 'demo-user-001',
    name: 'Demo CA',
    email: 'demo@computax.in',
    firmName: 'CompuTax Demo Firm',
    firmAddress: 'Delhi, India',
    phone: '9876543210',
    role: 'ca'
  },
  stats: {
    totalClients: 12,
    totalITR: 8,
    filedITR: 5,
    pendingITR: 3,
    totalGST: 15,
    filedGST: 12,
    pendingGST: 3
  },
  clients: [
    { _id: 'c1', name: 'Rajesh Kumar', pan: 'ABCPK1234D', email: 'rajesh@example.com', phone: '9876543210', status: 'active', clientType: 'individual' },
    { _id: 'c2', name: 'Priya Sharma', pan: 'DEFPS5678E', email: 'priya@example.com', phone: '9876543211', status: 'active', clientType: 'individual' },
    { _id: 'c3', name: 'Tech Solutions Pvt Ltd', pan: 'AABCT1234F', email: 'info@techsol.com', phone: '9876543212', status: 'active', clientType: 'business' },
    { _id: 'c4', name: 'Amit Singh', pan: 'GHPAK9012G', email: 'amit@example.com', phone: '9876543213', status: 'active', clientType: 'individual' },
    { _id: 'c5', name: 'Neha Gupta', pan: 'IJPQU3456H', email: 'neha@example.com', phone: '9876543214', status: 'active', clientType: 'individual' },
  ],
  recentITR: [
    { _id: 'itr1', client: { name: 'Rajesh Kumar', pan: 'ABCPK1234D' }, itrType: 'ITR-1', assessmentYear: '2024-25', status: 'filed', salaryIncome: 850000, taxPayable: 52000, tdsCredited: 62000 },
    { _id: 'itr2', client: { name: 'Priya Sharma', pan: 'DEFPS5678E' }, itrType: 'ITR-1', assessmentYear: '2024-25', status: 'pending', salaryIncome: 1200000, taxPayable: 95000, tdsCredited: 85000 },
    { _id: 'itr3', client: { name: 'Amit Singh', pan: 'GHPAK9012G' }, itrType: 'ITR-2', assessmentYear: '2024-25', status: 'draft', salaryIncome: 650000, taxPayable: 28000, tdsCredited: 30000 },
  ],
  recentGST: [
    { _id: 'gst1', client: { name: 'Tech Solutions Pvt Ltd', gstin: '27AABCT1234F1Z5' }, returnType: 'GSTR-3B', period: 'Jun-2024', status: 'filed', totalTaxableSales: 2500000, cgst: 225000, sgst: 225000 },
    { _id: 'gst2', client: { name: 'Tech Solutions Pvt Ltd', gstin: '27AABCT1234F1Z5' }, returnType: 'GSTR-1', period: 'Jun-2024', status: 'filed', totalTaxableSales: 2500000, cgst: 225000, sgst: 225000 },
    { _id: 'gst3', client: { name: 'Neha Gupta', gstin: '27IJPQU3456H1Z4' }, returnType: 'GSTR-3B', period: 'Jun-2024', status: 'pending', totalTaxableSales: 850000, cgst: 76500, sgst: 76500 },
  ],
  dueDates: [
    { _id: 'dd1', type: 'ITR', description: 'ITR Filing Last Date', date: '2024-07-31', status: 'upcoming', applicableTo: 'All Taxpayers' },
    { _id: 'dd2', type: 'GST', description: 'GSTR-3B Monthly', date: '2024-07-20', status: 'upcoming', applicableTo: 'Regular Taxpayers' },
    { _id: 'dd3', type: 'TDS', description: 'TDS Quarterly Return', date: '2024-07-31', status: 'upcoming', applicableTo: 'All Deductors' },
    { _id: 'dd4', type: 'GST', description: 'GSTR-1 Monthly', date: '2024-07-11', status: 'upcoming', applicableTo: 'Regular Taxpayers' },
  ],
  tdsEntries: [
    { _id: 'tds1', deductorName: 'ABC Corporation Ltd', tan: 'ABCC12345A', amountPaid: 850000, tdsDeducted: 85000, quarter: 'Q1 FY24-25', date: '2024-06-30' },
    { _id: 'tds2', deductorName: 'XYZ Software Pvt Ltd', tan: 'XYZS67890B', amountPaid: 450000, tdsDeducted: 45000, quarter: 'Q1 FY24-25', date: '2024-06-30' },
  ]
};

export default demoData;
