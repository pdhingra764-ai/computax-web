// CompuTax Data Filler - Content Script
// Captures data from Income Tax Portal pages

(function() {
  'use strict';

  let isActive = false;
  let captureButton = null;

  // Create floating capture button
  function createCaptureButton() {
    if (captureButton) return;

    captureButton = document.createElement('div');
    captureButton.id = 'computax-capture-btn';
    captureButton.innerHTML = `
      <div class="computax-btn-inner">
        <span class="computax-btn-icon">📥</span>
        <span class="computax-btn-text">CompuTax Capture</span>
      </div>
    `;
    captureButton.addEventListener('click', captureAllData);
    document.body.appendChild(captureButton);
  }

  function removeCaptureButton() {
    if (captureButton) {
      captureButton.remove();
      captureButton = null;
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'capture') {
      const data = captureAllData();
      sendResponse({ success: true, data });
    }
    if (request.action === 'toggle') {
      isActive = !isActive;
      if (isActive) {
        createCaptureButton();
      } else {
        removeCaptureButton();
      }
    }
    return true;
  });

  // Main capture function
  function captureAllData() {
    const capturedData = {};
    const url = window.location.href.toLowerCase();

    // Check which page we're on and capture accordingly
    if (url.includes('form26as') || url.includes('26as')) {
      capturedData.form26AS = captureForm26AS();
    }
    if (url.includes('ais') || url.includes('annualinformation')) {
      capturedData.aisData = captureAIS();
    }
    if (url.includes('prefill') || url.includes('itr')) {
      capturedData.itrPrefill = captureITRPrefill();
    }
    if (url.includes('tds') || url.includes('traces')) {
      capturedData.tdsData = captureTDS();
    }
    if (url.includes('taxpayer') || url.includes('dashboard') || url.includes('pan')) {
      capturedData.panData = capturePANDetails();
      capturedData.salaryData = captureSalaryDetails();
    }

    // Also capture any visible TDS/Form 16 data
    capturedData.form16 = captureForm16FromPage();
    capturedData.allTDSEntries = captureAllTDSEntries();

    return capturedData;
  }

  // Capture Form 26AS data
  function captureForm26AS() {
    const data = {
      totalTDS: 0,
      totalTax: 0,
      refund: 0,
      entries: []
    };

    // Try to find TDS amount from page
    const tdsElements = document.querySelectorAll('[class*="tds"], [class*="amount"], [class*="tax"]');
    tdsElements.forEach(el => {
      const text = el.textContent;
      if (text.includes('TDS') && text.includes('₹')) {
        const match = text.match(/₹?[\d,]+/g);
        if (match) {
          const amount = parseFloat(match[0].replace(/,/g, ''));
          if (amount > data.totalTDS) {
            data.totalTDS = amount;
          }
        }
      }
    });

    // Find table rows with TDS details
    const rows = document.querySelectorAll('table tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        const entry = {
          deductor: cells[0]?.textContent?.trim() || '',
          tan: cells[1]?.textContent?.trim() || '',
          amount: cells[2]?.textContent?.trim() || '',
          tds: cells[3]?.textContent?.trim() || ''
        };
        if (entry.deductor && entry.tds) {
          data.entries.push(entry);
        }
      }
    });

    // Look for summary section
    const summaryText = document.body.innerText;
    const tdsMatch = summaryText.match(/Total TDS.*?₹?([\d,]+)/i);
    if (tdsMatch) {
      data.totalTDS = parseFloat(tdsMatch[1].replace(/,/g, ''));
    }

    return data;
  }

  // Capture AIS data
  function captureAIS() {
    const data = {
      totalIncome: 0,
      taxDeducted: 0,
      taxCollected: 0,
      entries: []
    };

    const text = document.body.innerText;
    
    // Find total income
    const incomeMatch = text.match(/Total Income.*?₹?([\d,]+)/i);
    if (incomeMatch) {
      data.totalIncome = parseFloat(incomeMatch[1].replace(/,/g, ''));
    }

    // Find TDS
    const tdsMatch = text.match(/Tax Deducted.*?₹?([\d,]+)/i);
    if (tdsMatch) {
      data.taxDeducted = parseFloat(tdsMatch[1].replace(/,/g, ''));
    }

    return data;
  }

  // Capture ITR Pre-fill data
  function captureITRPrefill() {
    const data = {
      pan: '',
      name: '',
      salaryIncome: 0,
      housePropertyIncome: 0,
      businessIncome: 0,
      otherIncome: 0,
      deductions: {}
    };

    // Find PAN
    const panEl = document.querySelector('[class*="pan"], [id*="pan"]');
    if (panEl) {
      data.pan = panEl.value || panEl.textContent;
    }

    // Find Name
    const nameEl = document.querySelector('[class*="name"], [id*="name"]');
    if (nameEl) {
      data.name = nameEl.value || nameEl.textContent;
    }

    // Find income fields
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(input => {
      const label = input.closest('div')?.previousElementSibling?.textContent?.toLowerCase() || '';
      const value = parseFloat(input.value?.replace(/,/g, '')) || 0;

      if (label.includes('salary') && value > 0) {
        data.salaryIncome = value;
      }
      if (label.includes('house') && value > 0) {
        data.housePropertyIncome = value;
      }
      if (label.includes('business') && value > 0) {
        data.businessIncome = value;
      }
      if (label.includes('other') && value > 0) {
        data.otherIncome = value;
      }
    });

    return data;
  }

  // Capture TDS data
  function captureTDS() {
    const data = {
      employerName: '',
      tan: '',
      totalTDS: 0,
      tdsDeposited: 0,
      quarterlyStatements: []
    };

    // Find TAN
    const tanEl = document.querySelector('[class*="tan"], input[id*="tan"]');
    if (tanEl) {
      data.tan = tanEl.value || tanEl.textContent;
    }

    // Find TDS amounts in tables
    const amounts = document.querySelectorAll('td');
    amounts.forEach(td => {
      const text = td.textContent;
      if (text.includes('TDS') && text.includes('₹')) {
        const match = text.match(/₹?([\d,]+)/);
        if (match) {
          data.tdsDeposited += parseFloat(match[1].replace(/,/g, ''));
        }
      }
    });

    return data;
  }

  // Capture PAN details
  function capturePANDetails() {
    const data = {
      pan: '',
      name: '',
      aadhaarLinked: false,
      dateOfBirth: '',
      status: ''
    };

    // Find PAN number
    const panPattern = /[A-Z]{5}[0-9]{4}[A-Z]{1}/i;
    const bodyText = document.body.innerText;
    const panMatch = bodyText.match(panPattern);
    if (panMatch) {
      data.pan = panMatch[0].toUpperCase();
    }

    // Find name
    const nameMatch = bodyText.match(/(?:Name|Pluck Name)[\s:]*([A-Za-z\s]+)/i);
    if (nameMatch) {
      data.name = nameMatch[1].trim();
    }

    // Check Aadhaar link status
    data.aadhaarLinked = bodyText.includes('Linked') || bodyText.includes('verified');

    return data;
  }

  // Capture Salary details from page
  function captureSalaryDetails() {
    const data = {
      grossSalary: 0,
      employerName: '',
      section80C: 0,
      section80D: 0,
      hraReceived: 0,
      exemptions: []
    };

    const text = document.body.innerText;

    // Find salary
    const salaryMatch = text.match(/Gross.*?₹?([\d,]+)/i);
    if (salaryMatch) {
      data.grossSalary = parseFloat(salaryMatch[1].replace(/,/g, ''));
    }

    // Find employer
    const employerMatch = text.match(/(?:Employer|Company|Deductor)[\s:]*([A-Za-z0-9\s]+)/i);
    if (employerMatch) {
      data.employerName = employerMatch[1].trim();
    }

    // Find 80C
    const c80Match = text.match(/80[Cc].*?₹?([\d,]+)/i);
    if (c80Match) {
      data.section80C = parseFloat(c80Match[1].replace(/,/g, ''));
    }

    // Find 80D
    const d80Match = text.match(/80[Dd].*?₹?([\d,]+)/i);
    if (d80Match) {
      data.section80D = parseFloat(d80Match[1].replace(/,/g, ''));
    }

    return data;
  }

  // Capture Form 16 data from page
  function captureForm16FromPage() {
    const data = {
      partA: {},
      partB: {},
      employerDetails: {},
      employeeDetails: {}
    };

    const text = document.body.innerText;

    // Extract all ₹ amounts
    const amounts = text.match(/₹[\d,]+/g) || [];
    
    // Try to find structured data
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        if (cells.length >= 2) {
          const key = cells[0].textContent.trim().toLowerCase();
          const value = cells[1].textContent.trim();
          
          if (key.includes('employer')) data.employerDetails.name = value;
          if (key.includes('tan')) data.employerDetails.tan = value;
          if (key.includes('employee') || key.includes(' PAN')) data.employeeDetails.pan = value;
        }
      });
    });

    return data;
  }

  // Capture all TDS entries from page
  function captureAllTDSEntries() {
    const entries = [];
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
          const entry = {
            deductorName: cells[0]?.textContent?.trim(),
            tan: cells[1]?.textContent?.trim(),
            amountPaid: cells[2]?.textContent?.trim(),
            tdsDeducted: cells[3]?.textContent?.trim(),
            date: cells[4]?.textContent?.trim()
          };
          if (entry.tan && entry.tdsDeducted) {
            entries.push(entry);
          }
        }
      });
    });

    return entries;
  }

  // Auto-detect page and show notification
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'computax-notification';
    notification.innerHTML = `<span>🧾</span> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Initialize - check if we're on Income Tax portal
  const url = window.location.href.toLowerCase();
  if (url.includes('incometax.gov') || url.includes('tdscpc.gov') || url.includes('eportal')) {
    createCaptureButton();
    console.log('CompuTax Data Filler: Active on this page');
  }

})();
