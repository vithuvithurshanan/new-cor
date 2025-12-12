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
import { CustomerDashboardView } from './components/CustomerDashboardView';
import { AllUsersView } from './components/AllUsersView';
import { CustomersView } from './components/CustomersView';
import { RidersView } from './components/RidersView';
import { HubManagersView } from './components/HubManagersView';
import PaymentDemo from './components/PaymentDemo';
import AppHeader from './components/AppHeader';
import ProfileDropdown from './components/ProfileDropdown';
import CollapsibleSidebar from './components/CollapsibleSidebar';
import { LayoutDashboard, PackageSearch, MessageSquareText, Menu, X, Box, Send, Bike, Warehouse, LogOut, User as UserIcon, ListOrdered, Wallet, Truck, Loader2, CreditCard, Settings, Users, BarChart3, FileText, Bell, Server, CheckCircle, AlertTriangle, Map, DollarSign } from 'lucide-react';
import { apiService } from './services/apiService';
import { ToastProvider } from './components/ui/ToastContext';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('TRACKING');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => {
    try {
      const { getAuth, signOut } = await import('firebase/auth');
      const auth = getAuth();
      await signOut(auth);
      setUser(null);
      setView('TRACKING');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Check for persistent login
  useEffect(() => {
    const checkAuth = async () => {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const { firebaseService } = await import('./services/firebaseService');
      const auth = getAuth();

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Fetch user profile from Firestore
            const userProfile = await firebaseService.getDocument<User>('users', firebaseUser.uid);
            if (userProfile) {
              setUser(userProfile);
              // Only set view if currently on default/login view to avoid overriding navigation
              if (view === 'TRACKING') {
                switch (userProfile.role) {
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
                    setView('NEW_SHIPMENT');
                    break;
                }
              }
            } else {
              console.error('User profile not found in Firestore');
              setUser(null);
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading CourierOS...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Login View
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD': return <DashboardView initialTab="OVERVIEW" />;
      case 'USER_MANAGEMENT': return <AllUsersView />;
      case 'USERS_CUSTOMERS': return <CustomersView />;
      case 'USERS_RIDERS': return <RidersView />;
      case 'USERS_ADMINS': return <AllUsersView roleFilter="ADMIN" />;
      case 'USERS_HUB_MANAGERS': return <HubManagersView />;
      case 'SHIPMENTS': return <DashboardView initialTab="ORDERS" />;
      case 'SHIPMENTS_PLACED': return <DashboardView initialTab="ORDERS" orderFilter="PLACED" />;
      case 'SHIPMENTS_PICKUP_ASSIGNED': return <DashboardView initialTab="ORDERS" orderFilter="PICKUP_ASSIGNED" />;
      case 'SHIPMENTS_IN_TRANSIT': return <DashboardView initialTab="ORDERS" orderFilter="IN_TRANSIT" />;
      case 'SHIPMENTS_DELIVERED': return <DashboardView initialTab="ORDERS" orderFilter="DELIVERED" />;
      case 'SHIPMENTS_EXCEPTION': return <DashboardView initialTab="ORDERS" orderFilter="EXCEPTION" />;
      case 'NOTIFICATIONS': return <DashboardView initialTab="NOTIFICATIONS" />;
      case 'SYSTEM_STATUS': return <DashboardView initialTab="SYSTEM" />;
      case 'ACCOUNT_DASHBOARD': return <AccountDashboardView />;
      case 'FLEET_DASHBOARD': return <FleetDashboardView currentUser={user} initialTab="OVERVIEW" />;
      case 'FLEET_OVERVIEW': return <FleetDashboardView currentUser={user} initialTab="OVERVIEW" />;
      case 'FLEET_RIDER_APP': return <FleetDashboardView currentUser={user} initialTab="RIDER_APP" />;
      case 'FLEET_TRACKING': return <FleetDashboardView currentUser={user} initialTab="TRACKING" />;
      case 'FLEET_RIDERS': return <FleetDashboardView currentUser={user} initialTab="RIDERS" />;
      case 'VEHICLE_DASHBOARD': return <VehicleDashboardView />;
      case 'ACCOUNT_OVERVIEW': return <AccountDashboardView initialTab="OVERVIEW" />;
      case 'ACCOUNT_GOVERNMENT': return <AccountDashboardView initialTab="GOVERNMENT" />;
      case 'ACCOUNT_ACTUAL': return <AccountDashboardView initialTab="ACTUAL" />;
      case 'ACCOUNT_PRICING': return <AccountDashboardView initialTab="PRICING" />;
      case 'HUB_MANAGER': return <HubView initialTab="DASHBOARD" />;
      case 'HUB_DASHBOARD': return <HubView initialTab="DASHBOARD" />;
      case 'HUB_INBOUND': return <HubView initialTab="INBOUND" />;
      case 'HUB_OUTBOUND': return <HubView initialTab="OUTBOUND" />;
      case 'HUB_INVENTORY': return <HubView initialTab="INVENTORY" />;
      case 'HUB_NETWORK': return <HubView initialTab="NETWORK" />;
      case 'TRACKING': return <TrackingView currentUser={user} />;
      case 'NEW_SHIPMENT': return <PlaceOrderView currentUser={user} />;
      case 'AI_ASSISTANT': return <AssistantView currentUser={user} />;
      case 'RIDER': return <RiderView currentUser={user} />;
      case 'PROFILE': return <ProfileView currentUser={user} onUserUpdate={handleUserUpdate} />;
      case 'MY_ORDERS': return <CustomerOrdersView currentUser={user} />;
      case 'CUSTOMER_DASHBOARD': return <CustomerDashboardView currentUser={user} />;
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
      id: 'CUSTOMER_DASHBOARD' as ViewState,
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['CUSTOMER'] as UserRole[],
      strict: true
    },
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
          id: 'USER_MANAGEMENT' as ViewState,
          icon: Users,
          label: 'User Management',
          roles: ['ADMIN'] as UserRole[],
          children: [
            {
              id: 'USER_MANAGEMENT' as ViewState,
              icon: Users,
              label: 'All Users',
              roles: ['ADMIN'] as UserRole[]
            },
            {
              id: 'USERS_CUSTOMERS' as ViewState,
              icon: UserIcon,
              label: 'Customers',
              roles: ['ADMIN'] as UserRole[]
            },
            {
              id: 'USERS_RIDERS' as ViewState,
              icon: Bike,
              label: 'Riders',
              roles: ['ADMIN'] as UserRole[]
            },
            {
              id: 'USERS_HUB_MANAGERS' as ViewState,
              icon: Warehouse,
              label: 'Hub Managers',
              roles: ['ADMIN'] as UserRole[]
            },
            {
              id: 'USERS_ADMINS' as ViewState,
              icon: Settings,
              label: 'Admins',
              roles: ['ADMIN'] as UserRole[]
            }
          ]
        },
        {
          id: 'SHIPMENTS' as ViewState,
          icon: FileText,
          label: 'Shipments & Orders',
          roles: ['ADMIN', 'HUB_MANAGER', 'SUPPORT'] as UserRole[],
          children: [
            {
              id: 'SHIPMENTS' as ViewState,
              icon: FileText,
              label: 'All Shipments',
              roles: ['ADMIN', 'HUB_MANAGER', 'SUPPORT'] as UserRole[]
            },
            {
              id: 'SHIPMENTS_PLACED' as ViewState,
              icon: PackageSearch,
              label: 'New Orders',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'SHIPMENTS_IN_TRANSIT' as ViewState,
              icon: Truck,
              label: 'In Transit',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'SHIPMENTS_DELIVERED' as ViewState,
              icon: CheckCircle, // Need to import CheckCircle
              label: 'Delivered',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'SHIPMENTS_EXCEPTION' as ViewState,
              icon: AlertTriangle, // Need to import AlertTriangle
              label: 'Exceptions',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            }
          ]
        },
        {
          id: 'NOTIFICATIONS' as ViewState,
          icon: Bell,
          label: 'Notifications AI',
          roles: ['ADMIN', 'SUPPORT'] as UserRole[]
        },
        {
          id: 'SYSTEM_STATUS' as ViewState,
          icon: Server,
          label: 'System Status',
          roles: ['ADMIN'] as UserRole[]
        },
        {
          id: 'FLEET_DASHBOARD' as ViewState,
          icon: Bike,
          label: 'Fleet Management',
          roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[],
          children: [
            {
              id: 'FLEET_OVERVIEW' as ViewState,
              icon: LayoutDashboard,
              label: 'Overview',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'FLEET_TRACKING' as ViewState,
              icon: Map, // Need to import Map
              label: 'Live Tracking',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'FLEET_RIDERS' as ViewState,
              icon: Users,
              label: 'Riders',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'FLEET_RIDER_APP' as ViewState,
              icon: Bike,
              label: 'Rider App View',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            }
          ]
        },
        {
          id: 'VEHICLE_DASHBOARD' as ViewState,
          icon: Truck,
          label: 'Vehicle Management',
          roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
        },
        {
          id: 'HUB_MANAGER' as ViewState,
          icon: Warehouse,
          label: 'Hub Management',
          roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[],
          children: [
            {
              id: 'HUB_DASHBOARD' as ViewState,
              icon: BarChart3,
              label: 'Overview',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'HUB_INBOUND' as ViewState,
              icon: PackageSearch, // Reusing PackageSearch for Scan
              label: 'Inbound Scan',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'HUB_OUTBOUND' as ViewState,
              icon: Truck,
              label: 'Outbound',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'HUB_INVENTORY' as ViewState,
              icon: Warehouse,
              label: 'Storage',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            },
            {
              id: 'HUB_NETWORK' as ViewState,
              icon: Map,
              label: 'Hub Network',
              roles: ['ADMIN', 'HUB_MANAGER'] as UserRole[]
            }
          ]
        },
        {
          id: 'ACCOUNT_DASHBOARD' as ViewState,
          icon: Wallet,
          label: 'Account & Finance',
          roles: ['ADMIN'] as UserRole[],
          children: [
            {
              id: 'ACCOUNT_OVERVIEW' as ViewState,
              icon: BarChart3,
              label: 'Financial Overview',
              roles: ['ADMIN'] as UserRole[]
            },
            {
              id: 'ACCOUNT_GOVERNMENT' as ViewState,
              icon: FileText, // Using FileText for Reports
              label: 'Government Reports',
              roles: ['ADMIN'] as UserRole[]
            },
            {
              id: 'ACCOUNT_ACTUAL' as ViewState,
              icon: BarChart3, // Using BarChart3 for Actual Reports
              label: 'Actual Reports',
              roles: ['ADMIN'] as UserRole[]
            },
            {
              id: 'ACCOUNT_PRICING' as ViewState,
              icon: DollarSign, // Need to import DollarSign
              label: 'Smart Pricing',
              roles: ['ADMIN'] as UserRole[]
            }
          ]
        }
      ]
    }
  ];

  const handleNavigation = (newView: ViewState) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen font-sans text-slate-900 bg-slate-50 selection:bg-indigo-100">
        {/* Enhanced Sidebar - Desktop */}
        <aside className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200 fixed h-full z-10 shadow-xl shadow-slate-200/50 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-80'}`}>
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
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 min-h-0 flex flex-col overflow-hidden">
            <CollapsibleSidebar
              menuItems={menuItems}
              currentView={view}
              hasAccess={hasAccess}
              onNavigate={handleNavigation}
              isCollapsed={sidebarCollapsed}
            />
          </div>

          {/* Profile Section */}
          <div className="p-4 border-t border-slate-100">
            <ProfileDropdown
              user={user}
              onProfileClick={() => setView('PROFILE')}
              onLogout={handleLogout}
              isCollapsed={sidebarCollapsed}
            />
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Box size={20} strokeWidth={3} />
            </div>
            <span className="text-lg font-bold text-slate-800">CourierOS</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <PackageSearch size={20} />
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
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
    </ToastProvider>
  );
};

export default App;