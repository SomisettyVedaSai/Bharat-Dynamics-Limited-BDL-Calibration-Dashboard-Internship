import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentPage from './pages/EquipmentPage';
import FactoryCalendarPage from './pages/FactoryCalendarPage';
import CalibrationPage from './pages/CalibrationPage';
import CalibrationHistory from './pages/CalibrationHistory';
import CalibrationStatusDashboard from './pages/CalibrationStatusDashboard';
import CertificatesPage from './pages/CertificatesPage';
import NarrativeGallery from './pages/NarrativeGallery';
import NarrativeWizard from './pages/NarrativeWizard';
import SettingsPage from './pages/SettingsPage';
import Register from './pages/Register';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="calendar" element={<FactoryCalendarPage />} />
            <Route path="calibration" element={<CalibrationPage />} />
            <Route path="cal-history" element={<CalibrationHistory />} />
            <Route path="cal-status" element={<CalibrationStatusDashboard />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="narratives" element={<NarrativeGallery />} />
            <Route path="narrative/new" element={<NarrativeWizard />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;





