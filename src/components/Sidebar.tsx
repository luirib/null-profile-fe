import React from 'react';
import { NavLink } from 'react-router-dom';
import { Key, Shield, User, BarChart3 } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 font-mono text-sm font-medium rounded-lg transition-all ${
      isActive
        ? 'bg-gray-900 text-white shadow-sm'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="w-64 h-full shrink-0 bg-white border-r border-gray-200 p-4 space-y-2">
      <NavLink to="/dashboard/profile" className={linkClass}>
        <User size={18} />
        Profile
      </NavLink>
      <NavLink to="/dashboard/passkeys" className={linkClass}>
        <Key size={18} />
        Passkeys
      </NavLink>
      <NavLink to="/dashboard/relying-parties" className={linkClass}>
        <Shield size={18} />
        Relying Parties
      </NavLink>
      <NavLink to="/dashboard/usage" className={linkClass}>
        <BarChart3 size={18} />
        Usage
      </NavLink>
    </div>
  );
};
