import React, { useState, useEffect } from 'react';
import { ViewState, User, UserRole } from './types';
import { DashboardView } from './components/DashboardView';
import { TrackingView } from './components/TrackingView';
import { AssistantView } from './components/AssistantView';
import { PlaceOrderView } from './components/PlaceOrderView';
import { RiderView } from './components/RiderView';
import { HubView } from './components/HubView';
import { LoginView } from './components/LoginView';
import { ProfileView } from './components/ProfileView';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { LayoutDashboard, PackageSearch, MessageSquareText, Menu, X, Box, Send, Bike, Warehouse, LogOut, User as UserIcon, ListOrdered } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('TRACKING');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle Login
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Redirect based on role
    switch (loggedInUser.role) {
      case 'ADMIN':
        setView('DASHBOARD');
        break;
      case 'RIDER':
        setView('RIDER');
        break;
      case 'HUB_MANAGER':
        setView('HUB_MANAGER');
        break;
      case 'CUSTOMER':
      default:
        setView('NEW_SHIPMENT');
        break;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('TRACKING'); // Reset view or go to login, effectively LoginView shows when user is null
  };

  // If not logged in, show Login View
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD': return <DashboardView />;
      case 'TRACKING': return <TrackingView currentUser={user} />;
      case 'NEW_SHIPMENT': return <PlaceOrderView />;
      case 'AI_ASSISTANT': return <AssistantView />;
      case 'RIDER': return <RiderView currentUser={user} />;
      case 'HUB_MANAGER': return <HubView />;
      case 'HUB_MANAGER': return <HubView />;
      case 'PROFILE': return <ProfileView currentUser={user} />;
      case 'MY_ORDERS': return <CustomerOrdersView currentUser={user} />;
      default: return <TrackingView currentUser={user} />;
    }
  };

  // RBAC Helper
  const hasAccess = (requiredRoles: UserRole[], strict: boolean = false) => {
    if (!user) return false;
    if (strict) {
      return requiredRoles.includes(user.role);
    }
    return requiredRoles.includes(user.role) || user.role === 'ADMIN';
  };

  const NavItem = ({ id, icon: Icon, label, roles, strict = false }: { id: ViewState, icon: any, label: string, roles: UserRole[], strict?: boolean }) => {
    if (!hasAccess(roles, strict)) return null;

    return (
      <button
        onClick={() => {
          setView(id);
          setIsMobileMenuOpen(false);
        }}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-200
          ${view === id
            ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-200 backdrop-blur-sm'
            : 'text-slate-500 hover:bg-white/50 hover:text-indigo-600'}
        `}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen font-sans bg-transparent">
      {/* Sidebar - Desktop - Glass Effect */}
      <aside className="hidden lg:flex flex-col w-72 bg-white/70 backdrop-blur-xl border-r border-white/50 p-6 fixed h-full z-10 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Box size={24} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">CourierOS</span>
        </div>

        {/* User Profile Snippet */}
        <div
          onClick={() => setView('PROFILE')}
          className="mb-6 p-4 bg-white/50 rounded-2xl border border-white/60 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-white/80 transition-all hover:scale-[1.02]"
        >
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold ring-2 ring-white overflow-hidden">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {/* strict={true} prevents ADMIN from seeing this item */}
          <NavItem id="NEW_SHIPMENT" icon={Send} label="Send Package" roles={['CUSTOMER']} strict={true} />
          <NavItem id="MY_ORDERS" icon={ListOrdered} label="My Orders" roles={['CUSTOMER']} strict={true} />
          <NavItem id="TRACKING" icon={PackageSearch} label="Track Package" roles={['CUSTOMER', 'ADMIN', 'HUB_MANAGER', 'HUB_STAFF', 'RIDER']} />
          <NavItem id="AI_ASSISTANT" icon={MessageSquareText} label="Smart Assistant" roles={['CUSTOMER']} />

          <NavItem id="RIDER" icon={Bike} label="Rider App" roles={['RIDER']} />

          <div className="pt-4 pb-2">
            {hasAccess(['ADMIN', 'HUB_MANAGER']) && <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Management</p>}
            <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Admin Dashboard" roles={['ADMIN', 'FINANCE', 'SUPPORT']} />
            <NavItem id="HUB_MANAGER" icon={Warehouse} label="Hub Manager" roles={['ADMIN', 'HUB_MANAGER', 'HUB_STAFF']} />
          </div>
        </nav>

        <div className="border-t border-slate-200/60 pt-4 mt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header - Glass Effect */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-white/50 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Box size={20} strokeWidth={3} />
          </div>
          <span className="text-lg font-bold text-slate-800">CourierOS</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay - Glass Effect */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-xl z-40 pt-20 px-6 lg:hidden flex flex-col animate-in slide-in-from-top-10 duration-200">
          <div
            onClick={() => { setView('PROFILE'); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 mb-6 p-4 bg-white/50 border border-white/60 rounded-2xl shadow-sm cursor-pointer"
          >
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold ring-2 ring-white overflow-hidden">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
          </div>

          <nav className="space-y-3 flex-1">
            <NavItem id="NEW_SHIPMENT" icon={Send} label="Send Package" roles={['CUSTOMER']} strict={true} />
            <NavItem id="MY_ORDERS" icon={ListOrdered} label="My Orders" roles={['CUSTOMER']} strict={true} />
            <NavItem id="TRACKING" icon={PackageSearch} label="Track Package" roles={['CUSTOMER', 'ADMIN', 'RIDER', 'HUB_MANAGER']} />
            <NavItem id="RIDER" icon={Bike} label="Rider App" roles={['RIDER']} />
            <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Admin Dashboard" roles={['ADMIN']} />
            <NavItem id="HUB_MANAGER" icon={Warehouse} label="Hub Manager" roles={['ADMIN', 'HUB_MANAGER']} />
            <NavItem id="AI_ASSISTANT" icon={MessageSquareText} label="Smart Assistant" roles={['CUSTOMER']} />
          </nav>

          <div className="py-6 border-t border-slate-200">
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 font-medium">
              <LogOut size={20} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 pt-20 lg:pt-8 px-4 lg:px-10 pb-10 max-w-[1920px]">
        {renderView()}
      </main>
    </div>
  );
};

export default App;