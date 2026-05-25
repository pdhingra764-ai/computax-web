# 🚀 Deployment Guide — CompuTax Web v2

## Deploy Backend on Render (Free)

### Step 1 — Push to GitHub
Make sure all files are committed and pushed to GitHub.

### Step 2 — Create Render Account
Go to https://render.com and sign up (free).

### Step 3 — New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

### Step 4 — Environment Variables
Add these in Render dashboard:
```
MONGO_URI = mongodb+srv://pdhingra764_db_user:PASSWORD@cluster0.5hlgviu.mongodb.net/computax?retryWrites=true&w=majority
JWT_SECRET = computax_super_secret_2024
NODE_ENV = production
```

### Step 5 — Deploy
Click "Create Web Service". Render will deploy automatically.
Your API will be at: `https://computax-backend.onrender.com`

---

## Deploy Frontend on Vercel (Free)

### Step 1 — Create Vercel Account
Go to https://vercel.com and sign up.

### Step 2 — Import Project
1. Click "New Project"
2. Import your GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework:** Create React App
   - **Build Command:** `npm run build`

### Step 3 — Environment Variables
```
REACT_APP_API_URL = https://computax-backend.onrender.com/api
```

### Step 4 — Deploy
Click Deploy! Your app will be live at `https://computax-web.vercel.app`

---

## Update Frontend API URL

After Render deployment, update `frontend/src/api/axios.js`:
```javascript
baseURL: process.env.REACT_APP_API_URL || 'https://YOUR-RENDER-URL.onrender.com/api'
```

---

## MongoDB Atlas — Allow All IPs for Production
In Atlas → Network Access → Add `0.0.0.0/0` to allow Render servers.
