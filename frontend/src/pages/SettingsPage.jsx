import React from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white flex items-center">
        <Settings className="w-6 h-6 mr-3 text-blue-500" />
        Settings
      </h1>
      <div className="bg-[#1a1c23] rounded-2xl border border-gray-800 p-6 space-y-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Signed in as</p>
          <p className="text-white font-medium">{user?.name}</p>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <p className="text-gray-500 text-sm">Role: {user?.role} · {user?.employee_no}</p>
        </div>
        <div className="pt-4 border-t border-gray-800 text-sm text-gray-400">
          <p>API: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;





