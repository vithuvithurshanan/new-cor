import React, { useState, useEffect } from 'react';
import { ViewState, User, UserRole } from './types';
import { DashboardView } from './components/DashboardView';
import { AccountDashboardView } from './components/AccountDashboardView';
import { FleetDashboardView } from './components/FleetDashboardView';
import { VehicleDashboardView } from './components/VehicleDashboardView';
import { TrackingView } from './components/TrackingView';
import { AssistantView } from './components/AssistantView';
import { PlaceOrderView } from './components/PlaceOrderView';
import { RiderView } from './components/RiderView';
import { HubView } from './components/HubView';
import { LoginView } from './components/LoginView';
import { ProfileView } from './components/ProfileView';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import PaymentDemo from './components/PaymentDemo';
import AppHeader from './components/AppHeader';
import ProfileDropdown from './components/ProfileDropdown';
import CollapsibleSidebar from './components/CollapsibleSidebar';
import { LayoutDashboard, PackageSearch, MessageSquareText, Menu, X, Box, Send, Bike, Warehouse, LogOut, User as UserIcon, ListOrdered, Wallet, Truck, Loader2, CreditCard, Settings, Users, BarChart3 } from 'lucide-react';
import { apiService } from './services/apiService';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('TRACKING');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      case 'ACCOUNT_DASHBOARD': return <AccountDashboardView />;
      case 'FLEET_DASHBOARD': return <FleetDashboardView currentUser={user} />;
      case 'VEHICLE_DASHBOARD': return <VehicleDashboardView />;
      case 'TRACKING': return <TrackingView currentUser={user} />;
      case 'NEW_SHIPMENT': return <PlaceOrderView currentUser={user} />;
      case 'AI_ASSISTANT': return <AssistantView />;
      case 'RIDER': return <RiderView currentUser={user} />;
      case 'HUB_MANAGER': return <HubView />;
      case 'PROFILE': return <ProfileView currentUser={user} />;
      case 'MY_ORDERS': return <CustomerOrdersView currentUser={user} />;
      case 'PAYMENT_DEMO': return <PaymentDemo />;
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

  // Menu Structure for Collapsible Sidebar
  const menuItems = [
    // Customer Section
    {
      id: 'NEW_SHIPMENT' as ViewState,
      icon: Send,
      label: 'Send Package',
      roles: ['CUSTOMER'] as UserRole[],
      strict: true
    },
    {
      id: 'MY_ORDERS' as ViewState,
      icon: ListOrdered,
      label: 'My Orders',
      roles: ['CUSTOMER'] as UserRole[],
      strict: true
    },
    {
      id: 'TRACKING' as ViewState,
      icon: PackageSearch,
      label: 'Track Package',
      roles: ['CUSTOMER', 'ADMIN', 'HUB_MANAGER', 'HUB_STAFF', 'RIDER'] as UserRole[]
    },
    {
      id: 'AI_ASSISTANT' as ViewState,
      icon: MessageSquareText,
      label: 'Smart Assistant',
      roles: ['CUSTOMER'] as UserRole[]
    },
    {
      id: 'PAYMENT_DEMO' as ViewState,
      icon: CreditCard,
      label: 'Payment Demo',
      roles: ['CUSTOMER', 'ADMIN'] as UserRole[]
    },

    // Rider Section
    {
      id: 'RIDER' as ViewState,
      icon: Bike,
      label: 'Rider Dashboard',
      roles: ['RIDER'] as UserRole[]
    },

    // Management Section (with children)
    {
      id: 'DASHBOARD' as ViewState,
      icon: LayoutDashboard,
      label: 'Management',
      roles: ['ADMIN', 'FINANCE', 'SUPPORT', 'HUB_MANAGER'] as UserRole[],
      children: [
        {
          id: 'DASHBOARD' as ViewState,
          icon: BarChart3,
          label: 'Admin Dashboard',
          roles: ['ADMIN', 'FINANCE', 'SUPPORT'] as UserRole[]
        },
        {
          id: 'FLEET_DASHBOARD' as ViewState,
          icon: Bike,
          label: 'Fleet Management',
          roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
        },
        {
          id: 'VEHICLE_DASHBOARD' as ViewState,
          icon: Truck,
          label: 'Vehicle Management',
          roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
        },
        {
          id: 'ACCOUNT_DASHBOARD' as ViewState,
          icon: Wallet,
          label: 'Account Dashboard',
          roles: ['ADMIN', 'FINANCE'] as UserRole[]
        },
        {
          id: 'HUB_MANAGER' as ViewState,
          icon: Warehouse,
          label: 'Hub Management',
          roles: ['ADMIN', 'HUB_MANAGER', 'HUB_STAFF'] as UserRole[]
        }
      ]
    }
  ];

  const handleNavigation = (newView: ViewState) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen font-sans bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Enhanced Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-white/50 fixed h-full z-10 shadow-xl shadow-slate-200/50 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-80'}`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Box size={24} strokeWidth={3} />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <span className="text-xl font-bold text-slate-800 tracking-tight">CourierOS</span>
                <p className="text-xs text-slate-500 mt-1">Logistics Management System</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <CollapsibleSidebar
            menuItems={menuItems}
            currentView={view}
            hasAccess={hasAccess}
            onNavigate={handleNavigation}
          />
        </div>

        {/* Profile Section */}
        <div className="p-4 border-t border-slate-100">
          <ProfileDropdown
            user={user}
            onProfileClick={() => setView('PROFILE')}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-white/50 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Box size={20} strokeWidth={3} />
          </div>
          <span className="text-lg font-bold text-slate-800">CourierOS</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <PackageSearch size={20} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-40 pt-20 px-6 lg:hidden flex flex-col animate-in slide-in-from-top-10 duration-200">
          {/* Mobile Profile */}
          <div className="mb-6">
            <ProfileDropdown
              user={user}
              onProfileClick={() => { setView('PROFILE'); setIsMobileMenuOpen(false); }}
              onLogout={handleLogout}
            />
          </div>

          {/* Mobile Navigation */}
          <div className="flex-1 overflow-y-auto">
            <CollapsibleSidebar
              menuItems={menuItems}
              currentView={view}
              hasAccess={hasAccess}
              onNavigate={handleNavigation}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-80'}`}>
        {/* Enhanced Header */}
        <AppHeader user={user} currentView={view} />
        
        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;