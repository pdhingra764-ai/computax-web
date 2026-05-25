# 🧾 CompuTax Web — India's Tax Filing Platform

A full-stack web-based tax management software for **CA Professionals** and **Small Businesses**, covering **Income Tax (ITR)** and **GST Filing**.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT (JSON Web Tokens) |
| HTTP Client | Axios |

---

## 📁 Project Structure

```
computax-web/
├── backend/
│   ├── config/          # DB connection
│   ├── middleware/      # JWT auth middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── server.js        # Express entry point
│   └── .env.example
├── frontend/
│   └── src/
│       ├── api/         # Axios instance
│       ├── components/  # Shared UI components
│       ├── context/     # Auth context
│       ├── pages/       # Page components
│       └── App.jsx
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repo
```bash
git clone https://github.com/YOUR_USERNAME/computax-web.git
cd computax-web
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Environment Variables (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/computax
JWT_SECRET=your_super_secret_key
```

---

## 📦 Modules

### ✅ Income Tax (ITR Filing)
- ITR-1, ITR-2, ITR-3, ITR-4 form types
- Client-wise filing tracker
- Status management (Draft → Filed → Acknowledged)
- Tax computation summary

### ✅ GST Filing
- GSTR-1 (Outward Supplies)
- GSTR-3B (Monthly Summary)
- Tax liability calculation
- Filing status tracker

### ✅ Client Management
- Add/Edit/Delete clients
- PAN, Aadhaar, GSTIN storage
- Filing history per client

### ✅ Dashboard
- Overview stats
- Recent filings
- Pending tasks

---

## 🔐 Authentication
- Register / Login with email & password
- JWT-based protected routes
- Role: CA Professional or Business Owner

---

## 📬 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/clients | Get all clients |
| POST | /api/clients | Add client |
| PUT | /api/clients/:id | Update client |
| DELETE | /api/clients/:id | Delete client |
| GET | /api/itr | Get all ITR filings |
| POST | /api/itr | Create ITR filing |
| PUT | /api/itr/:id | Update ITR filing |
| GET | /api/gst | Get all GST filings |
| POST | /api/gst | Create GST filing |
| PUT | /api/gst/:id | Update GST filing |

---

## 🛠️ Future Enhancements
- [ ] TDS Management (CompuTDS)
- [ ] Balance Sheet & Tax Audit
- [ ] PDF report generation
- [ ] Email reminders for due dates
- [ ] DSC integration
- [ ] 26AS auto-import

---

## 📄 License
MIT License
