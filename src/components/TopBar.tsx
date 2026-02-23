import React from 'react';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logout } from '../lib/api';

export const TopBar: React.FC = () => {
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Logout function already handles redirect
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <Link
        to="/dashboard"
        className="text-lg font-mono font-semibold text-gray-900 hover:text-gray-700 transition-colors"
      >
        nullProfile Dashboard
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-sm font-mono font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
};
