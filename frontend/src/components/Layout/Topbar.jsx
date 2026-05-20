import React, { useState } from 'react';
import { Bell, Search, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showNotice, setShowNotice] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/equipment?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="h-16 bg-[#1a1c23] border-b border-gray-800 flex items-center justify-between px-6">
      <form onSubmit={handleSearch} className="flex-1 flex items-center max-w-md">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-500" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#242731] text-gray-300 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Find equipment..."
          />
        </div>
      </form>

      <div className="flex items-center space-x-6">
        <button
          type="button"
          onClick={() => setShowNotice(!showNotice)}
          className="relative text-gray-400 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        {showNotice && (
          <div className="absolute right-24 top-14 z-50 w-64 bg-[#242731] border border-gray-700 rounded-xl p-4 shadow-xl text-sm text-gray-400">
            No new notifications.
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center space-x-3 border-l border-gray-800 pl-6 hover:opacity-80"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div className="hidden md:block text-sm text-left">
            <p className="text-white font-medium">{user?.name || 'User'}</p>
            <p className="text-gray-500">{user?.employee_no || ''}</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Topbar;





