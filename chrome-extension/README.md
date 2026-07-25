# CompuTax Data Filler - Chrome Extension

## Overview

This Chrome Extension captures data from Income Tax Portal (incometax.gov.in) and automatically fills it into CompuTax Web.

## Features

- 📥 Capture Form 26AS data
- 📊 Capture AIS (Annual Information Statement) data  
- 📋 Capture ITR Pre-fill data
- 💰 Capture TDS data
- 👤 Capture PAN/Employee details
- 🚀 Auto-send to CompuTax

## Installation

### Step 1: Create Icons

The extension needs PNG icon files. Create the following files in the `icons` folder:

1. **icon16.png** (16x16 pixels)
2. **icon48.png** (48x48 pixels)  
3. **icon128.png** (128x128 pixels)

You can create these using any image editor, or use online tools to convert PNG.

**Recommended:** Use the CompuTax logo/colors:
- Orange (#FF9933) background
- White "CT" text or tax-related icon

### Step 2: Load Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder
5. Extension will be added to Chrome

### Step 3: Use the Extension

1. Go to [incometax.gov.in](https://www.incometax.gov.in)
2. Login with your credentials (you do this manually)
3. Navigate to Form 26AS, AIS, or any tax-related page
4. Click the CompuTax extension icon in toolbar
5. Click "Enable Extension"
6. Click "Capture Current Page Data"
7. Click "Send to CompuTax"
8. Your data will open in CompuTax Web!

## How It Works

```
┌─────────────────────┐     ┌──────────────────────┐
│  Income Tax Portal  │     │    CompuTax Web       │
│  (You Login Manually)│     │                      │
│                     │     │                      │
│  • Form 26AS       │────▶│  Auto-filled ITR     │
│  • AIS             │     │  Form with all        │
│  • ITR Pre-fill    │     │  TDS/Salary data     │
│  • TDS Details      │     │                      │
└─────────────────────┘     └──────────────────────┘
         │
         │ Capture Button
         ▼
   ┌─────────────────┐
   │ Chrome Extension │
   │ • Captures data  │
   │ • Parses pages   │
   │ • Sends to API   │
   └─────────────────┘
```

## File Structure

```
chrome-extension/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js          # Popup logic
├── content.js        # Page data capture
├── content.css       # Floating button styles
├── background.js    # Background service worker
├── icons/
│   ├── icon16.png    # Toolbar icon (16x16)
│   ├── icon48.png    # Extension page icon (48x48)
│   └── icon128.png   # Store icon (128x128)
└── README.md        # This file
```

## API Endpoint

The extension sends captured data to:
```
POST https://computax-backend.onrender.com/api/itr/import
Headers:
  Content-Type: application/json
  Authorization: Bearer demo-token-bypass-login

Body: {
  form26AS: { ... },
  salaryData: { ... },
  tdsData: { ... },
  panData: { ... },
  ...
}
```

## Supported Pages

| Portal | URL Pattern | Captures |
|--------|-------------|----------|
| Form 26AS | `*form26as*`, `*26as*` | TDS details, amounts |
| AIS | `*ais*`, `*annualinformation*` | Annual income, tax |
| ITR Pre-fill | `*prefill*`, `*itr*` | Income details |
| TDS | `*tds*`, `*traces*` | TDS deposited, TAN |
| Dashboard | `*taxpayer*`, `*dashboard*` | PAN, name, status |

## Troubleshooting

**Q: Extension not capturing data**
- Make sure you're on Income Tax Portal
- Try refreshing the page
- Click "Enable Extension" first

**Q: Data not appearing in CompuTax**
- Check if you're logged in to CompuTax
- Try clicking "Send to CompuTax" again
- Make sure you have clients created in CompuTax

**Q: Can't load extension**
- Make sure Developer mode is ON
- Check that all files are present
- Icons must be PNG format (not JPG or SVG)

## Security

- Extension only runs on Income Tax and TDS portals
- Data is sent directly to CompuTax backend
- No data is stored on external servers
- You manually login to government portals (secure)

## License

For CompuTax Web Platform v2
