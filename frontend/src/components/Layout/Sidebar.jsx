import React from 'react';
import { LayoutDashboard, Wrench, Calendar, FileText, Settings, LogOut, FileBadge, BookOpen, ClipboardList, LayoutGrid } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Equipment', path: '/equipment', icon: Wrench },
    { name: 'Calibration', path: '/calibration', icon: FileText },
    { name: 'Cal. History', path: '/cal-history', icon: ClipboardList },
    { name: 'Cal. Status', path: '/cal-status', icon: LayoutGrid },
    { name: 'Certificates', path: '/certificates', icon: FileBadge },
    { name: 'Narratives', path: '/narratives', icon: BookOpen },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    if (window.confirm('Sign out of CMS?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="w-64 bg-[#1a1c23] border-r border-gray-800 flex flex-col h-screen">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white tracking-wider">CMS System</h1>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600/10 text-blue-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        {user && <p className="text-xs text-gray-500 mb-2 px-3 truncate">{user.name}</p>}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;





