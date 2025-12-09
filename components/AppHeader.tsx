import React from 'react';
import { Search, Calendar, Clock } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import StatusIndicator from './StatusIndicator';
import { User } from '../types';

interface AppHeaderProps {
  user: User;
  currentView: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, currentView }) => {
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getViewTitle = (view: string) => {
    const titles: { [key: string]: string } = {
      'DASHBOARD': 'Admin Dashboard',
      'ACCOUNT_DASHBOARD': 'Account Dashboard',
      'FLEET_DASHBOARD': 'Fleet Management',
      'VEHICLE_DASHBOARD': 'Vehicle Management',
      'TRACKING': 'Package Tracking',
      'NEW_SHIPMENT': 'Create Shipment',
      'AI_ASSISTANT': 'Smart Assistant',
      'RIDER': 'Rider Dashboard',
      'HUB_MANAGER': 'Hub Management',
      'PROFILE': 'User Profile',
      'MY_ORDERS': 'My Orders',
      'PAYMENT_DEMO': 'Payment Demo'
    };
    return titles[view] || 'CourierOS';
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-white/50 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Section - Title and Breadcrumb */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {getViewTitle(currentView)}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <Calendar size={14} />
              <span>{getCurrentDate()}</span>
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search packages, orders, or tracking IDs..."
              className="w-full pl-10 pr-4 py-2 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Section - Time, Status, Notifications */}
        <div className="flex items-center gap-4">
          {/* Current Time */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100/50 rounded-lg">
            <Clock size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {getCurrentTime()}
            </span>
          </div>

          {/* Status Indicator */}
          <StatusIndicator />

          {/* Notifications */}
          <NotificationCenter />

          {/* User Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span className="text-sm text-slate-600 capitalize hidden sm:block">
              {user.status.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden mt-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;