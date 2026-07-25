// CompuTax Data Filler - Popup Script

let isEnabled = false;
let capturedData = {};
let currentTabId = null;

// DOM Elements
const enableBtn = document.getElementById('enableBtn');
const captureBtn = document.getElementById('captureBtn');
const sendBtn = document.getElementById('sendToCompuTaxBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const capturedDataDiv = document.getElementById('capturedData');
const dataList = document.getElementById('dataList');
const successMsg = document.getElementById('successMsg');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    currentTabId = tabs[0].id;
  }

  // Load saved state
  const result = await chrome.storage.local.get(['isEnabled', 'capturedData']);
  if (result.isEnabled) {
    isEnabled = true;
    updateUI();
  }
  if (result.capturedData) {
    capturedData = result.capturedData;
    displayCapturedData();
  }
});

// Enable/Disable Extension
enableBtn.addEventListener('click', async () => {
  isEnabled = !isEnabled;
  
  if (isEnabled) {
    // Get current tab and inject content script
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tabs[0].id },
          files: ['content.css']
        });
      } catch (e) {
        console.log('Script already injected or error:', e);
      }
    }
  }
  
  await chrome.storage.local.set({ isEnabled });
  updateUI();
});

// Capture Data
captureBtn.addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    try {
      // Send message to content script to capture data
      const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'capture' });
      
      if (response && response.success) {
        capturedData = { ...capturedData, ...response.data };
        await chrome.storage.local.set({ capturedData });
        displayCapturedData();
        showSuccess('Data capture ho gaya!');
      } else {
        showSuccess('Page par data nahi mila. Sahi page kholein.');
      }
    } catch (e) {
      console.error('Capture error:', e);
      showSuccess('Error: Content script load karein');
    }
  }
});

// Send to CompuTax
sendBtn.addEventListener('click', async () => {
  if (Object.keys(capturedData).length === 0) {
    showSuccess('Pehle data capture karein!');
    return;
  }

  try {
    // Send to backend
    const response = await fetch('https://computax-backend.onrender.com/api/itr/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token-bypass-login'
      },
      body: JSON.stringify(capturedData)
    });

    if (response.ok) {
      showSuccess('✅ Data CompuTax mein bhej diya!');
      capturedData = {};
      await chrome.storage.local.set({ capturedData: {} });
      displayCapturedData();
      
      // Open CompuTax in new tab
      chrome.tabs.create({ url: 'https://computax-web.vercel.app/itr' });
    } else {
      showSuccess('Error: Data bhejne mein problem');
    }
  } catch (e) {
    console.error('Send error:', e);
    showSuccess('Error: Server se connect nahi ho paya');
  }
});

function updateUI() {
  if (isEnabled) {
    statusDot.classList.remove('inactive');
    statusText.textContent = 'Extension Active - Page data capture karein';
    enableBtn.textContent = '⏸️ Disable Extension';
    enableBtn.classList.remove('btn-primary');
    enableBtn.classList.add('btn-secondary');
    captureBtn.disabled = false;
    sendBtn.disabled = false;
  } else {
    statusDot.classList.add('inactive');
    statusText.textContent = 'Extension Disabled';
    enableBtn.textContent = '✅ Enable Extension';
    enableBtn.classList.add('btn-primary');
    enableBtn.classList.remove('btn-secondary');
    captureBtn.disabled = true;
    sendBtn.disabled = true;
  }
}

function displayCapturedData() {
  if (Object.keys(capturedData).length === 0) {
    capturedDataDiv.style.display = 'none';
    return;
  }

  capturedDataDiv.style.display = 'block';
  dataList.innerHTML = '';

  // Display TDS Data
  if (capturedData.tdsData) {
    const tds = capturedData.tdsData;
    addDataItem('TDS Employer', tds.employerName || 'N/A');
    addDataItem('TAN', tds.tan || 'N/A');
    addDataItem('Total TDS', formatCurrency(tds.totalTDS));
    addDataItem('TDS Deposited', formatCurrency(tds.tdsDeposited));
  }

  // Display Salary Data
  if (capturedData.salaryData) {
    const sal = capturedData.salaryData;
    addDataItem('Gross Salary', formatCurrency(sal.grossSalary));
    addDataItem('Employer Name', sal.employerName || 'N/A');
    addDataItem('80C Deduction', formatCurrency(sal.section80C));
    addDataItem('80D Deduction', formatCurrency(sal.section80D));
  }

  // Display PAN Data
  if (capturedData.panData) {
    const pan = capturedData.panData;
    addDataItem('PAN', pan.pan || 'N/A');
    addDataItem('Name', pan.name || 'N/A');
    addDataItem('Aadhaar Status', pan.aadhaarLinked ? 'Linked ✅' : 'Not Linked ❌');
  }

  // Display Form 26AS Summary
  if (capturedData.form26AS) {
    addDataItem('Form 26AS TDS', formatCurrency(capturedData.form26AS.totalTDS));
    addDataItem('Tax Deducted', formatCurrency(capturedData.form26AS.totalTax));
    addDataItem('Refund Claimed', formatCurrency(capturedData.form26AS.refund));
  }
}

function addDataItem(label, value) {
  const div = document.createElement('div');
  div.className = 'data-item';
  div.innerHTML = `<span class="data-label">${label}</span><span class="data-value">${value}</span>`;
  dataList.appendChild(div);
}

function formatCurrency(amount) {
  if (!amount) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function showSuccess(message) {
  successMsg.style.display = 'block';
  successMsg.querySelector('.success-text').textContent = message;
  setTimeout(() => {
    successMsg.style.display = 'none';
  }, 3000);
}
