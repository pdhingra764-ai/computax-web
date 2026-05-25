import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ITRFiling from './pages/ITRFiling';
import GSTFiling from './pages/GSTFiling';
import TDSFiling from './pages/TDSFiling';
import DueDates from './pages/DueDates';
import ImportData from './pages/ImportData';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontFamily: 'DM Sans' }
        }} />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="itr" element={<ITRFiling />} />
            <Route path="gst" element={<GSTFiling />} />
            <Route path="tds" element={<TDSFiling />} />
            <Route path="duedates" element={<DueDates />} />
            <Route path="import" element={<ImportData />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
