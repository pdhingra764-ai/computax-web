// CompuTax Data Filler - Background Script

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('CompuTax Data Filler installed!');
    
    // Set default values
    chrome.storage.local.set({
      isEnabled: false,
      capturedData: {},
      lastCapture: null
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveData') {
    chrome.storage.local.set({ capturedData: request.data });
    sendResponse({ success: true });
  }
  
  if (request.action === 'getData') {
    chrome.storage.local.get(['capturedData'], (result) => {
      sendResponse(result.capturedData || {});
    });
    return true;
  }
  
  if (request.action === 'openCompuTax') {
    chrome.tabs.create({ url: 'https://computax-web.vercel.app/itr' });
    sendResponse({ success: true });
  }
});

// Handle toolbar icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['isEnabled'], (result) => {
    const newState = !result.isEnabled;
    chrome.storage.local.set({ isEnabled: newState });
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  });
});
