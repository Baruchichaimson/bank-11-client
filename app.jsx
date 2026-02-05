import { Routes, Route, Navigate } from 'react-router-dom';

import BankLayout from './layouts/BankLayout.jsx';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transfer from './pages/Transfer.jsx';
import Verify from './pages/Verify.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import ProtectedRoute from './components/protectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<BankLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfer" element={<Transfer />} />
        </Route>
      </Route>
    </Routes>
  );
}
