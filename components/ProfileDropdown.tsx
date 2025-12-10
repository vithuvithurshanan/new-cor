import React, { useState } from 'react';
import { User, Settings, LogOut, Shield, HelpCircle, Moon, Sun, ChevronDown } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileDropdownProps {
  user: UserType;
  onProfileClick: () => void;
  onLogout: () => void;
  isCollapsed?: boolean;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onProfileClick, onLogout, isCollapsed = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 w-full ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? user.name : undefined}
      >
        <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold ring-2 ring-white/10 overflow-hidden flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user.name.charAt(0)
          )}
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {user.role.replace('_', ' ').toLowerCase()}
              </p>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className={`absolute bottom-full left-0 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-200 ${isCollapsed ? 'w-72' : 'right-0'}`}>
            {/* User Info Header */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium capitalize">
                      {user.role.replace('_', ' ').toLowerCase()}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span className="text-xs text-slate-400 capitalize">{user.status.toLowerCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  onProfileClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <User size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">View Profile</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <Settings size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Account Settings</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <Shield size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Privacy & Security</span>
              </button>

              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                {isDarkMode ? (
                  <Sun size={18} className="text-slate-500" />
                ) : (
                  <Moon size={18} className="text-slate-500" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <HelpCircle size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Help & Support</span>
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-slate-100 py-2">
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left text-red-600"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileDropdown;