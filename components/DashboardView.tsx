import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DashboardStats, User, PricingConfig, Shipment, ShipmentStatus } from '../types';
import { generateLogisticsReport, optimizePricingRules, generateNotificationTemplate } from '../services/geminiService';
import { mockDataService } from '../services/mockDataService';
import { TrendingUp, Package, AlertTriangle, CheckCircle, Sparkles, Loader2, Users, CreditCard, Bell, Search, Sliders, DollarSign, FileText, Server, Globe, Shield, Database, Activity, Wifi, Cpu, MessageSquare, ArrowRight, Filter } from 'lucide-react';
import { ShipmentDetailsModal } from './ShipmentDetailsModal';

const CHART_DATA = [
  { name: 'Mon', shipments: 120, revenue: 2400 },
  { name: 'Tue', shipments: 145, revenue: 2900 },
  { name: 'Wed', shipments: 180, revenue: 3600 },
  { name: 'Thu', shipments: 130, revenue: 2600 },
  { name: 'Fri', shipments: 200, revenue: 4000 },
  { name: 'Sat', shipments: 90, revenue: 1800 },
  { name: 'Sun', shipments: 50, revenue: 1000 },
];

const INITIAL_PRICING: PricingConfig = {
  baseRate: 10,
  perKm: 0.5,
  perKg: 2,
  serviceMultipliers: { standard: 1, express: 1.5, sameDay: 2.5 },
  peakHourSurcharge: 1.2
};

type AdminTab = 'OVERVIEW' | 'USERS' | 'ORDERS' | 'NOTIFICATIONS' | 'SYSTEM';

export const DashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [loadingAi, setLoadingAi] = useState(false);

  // Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  // -- OVERVIEW STATES --
  const [overviewReport, setOverviewReport] = useState<string | null>(null);

  // -- NOTIFICATION STATES --
  const [notifScenario, setNotifScenario] = useState('');
  const [notifTemplate, setNotifTemplate] = useState('');

  // -- ORDER MANAGEMENT STATES --
  const [orderFilter, setOrderFilter] = useState<ShipmentStatus | 'ALL'>('ALL');

  // -- MODAL STATES --
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', phone: '', role: 'CUSTOMER', status: 'ACTIVE' });
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', phone: '', role: 'CUSTOMER' });
  const [showViewShipmentModal, setShowViewShipmentModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const dashboardStats = await mockDataService.getDashboardStats();
      setStats(dashboardStats);

      const userList = await mockDataService.getUsers();
      setUsers(userList);

      const shipmentList = await mockDataService.getShipments();
      setShipments(shipmentList);
    };
    loadData();
  }, []);

  // --- HANDLERS ---
  const handleGenerateOverview = async () => {
    if (!stats) return;
    setLoadingAi(true);
    const report = await generateLogisticsReport(stats, []);
    setOverviewReport(report);
    setLoadingAi(false);
  };



  const handleGenerateTemplate = async () => {
    if (!notifScenario) return;
    setLoadingAi(true);
    const template = await generateNotificationTemplate(notifScenario);
    setNotifTemplate(template);
    setLoadingAi(false);
  };

  const handleApproveOrder = async (id: string) => {
    await mockDataService.updateShipmentStatus(id, ShipmentStatus.PICKUP_ASSIGNED, 'Hub Admin');
    // Refresh data
    const updatedShipments = await mockDataService.getShipments();
    setShipments(updatedShipments);
    const updatedStats = await mockDataService.getDashboardStats();
    setStats(updatedStats);
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const saveNewUser = () => {
    console.log('Creating new user:', newUserForm);
    // Add user to state
    const newUser: User = {
      id: `USR-${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      phone: newUserForm.phone,
      role: newUserForm.role as any,
      status: 'ACTIVE'
    };
    setUsers([...users, newUser]);
    setShowAddUserModal(false);
    setNewUserForm({ name: '', email: '', phone: '', role: 'CUSTOMER' });
  };


  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    });
    setShowEditUserModal(true);
  };

  const saveUserChanges = () => {
    if (!selectedUser) return;
    console.log('Updating user:', editUserForm);
    // Update user in state
    setUsers(users.map(u =>
      u.id === selectedUser.id ? { ...u, ...editUserForm } : u
    ));
    setShowEditUserModal(false);
    setSelectedUser(null);
  };

  const handleViewShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowViewShipmentModal(true);
  };

  // --- TAB RENDERERS ---

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
          <p className="text-slate-500">Real-time system metrics.</p>
        </div>
        <button
          onClick={handleGenerateOverview}
          disabled={loadingAi || !stats}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium disabled:opacity-70 shadow-lg shadow-indigo-200"
        >
          {loadingAi ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          AI Daily Brief
        </button>
      </div>

      {overviewReport && (
        <div className="bg-gradient-to-r from-violet-50/80 to-indigo-50/80 backdrop-blur-md border border-indigo-100/60 rounded-xl p-6 shadow-sm">
          <div className="flex gap-3">
            <Sparkles className="text-indigo-600 mt-1" size={20} />
            <div className="prose prose-sm max-w-none text-slate-700">
              {overviewReport.split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Shipments" value={stats.totalShipments} icon={Package} color="blue" />
          <StatCard title="Active In-Transit" value={stats.active} icon={TrendingUp} color="indigo" />
          <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle} color="emerald" />
          <StatCard title="Delayed / Issues" value={stats.delayed} icon={AlertTriangle} color="red" />
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/60">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue vs Volume</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              <Bar yAxisId="left" dataKey="shipments" fill="#6366f1" radius={[4, 4, 0, 0]} name="Shipments" />
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500">Manage customers, riders, and staff.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Search users..." className="pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button
            onClick={handleAddUser}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-md hover:bg-indigo-700"
          >
            + Add User
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                    ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'RIDER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}
                  `}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-medium
                    ${user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleViewUser(user)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                    title="View/Edit User"
                  >
                    <MessageSquare size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrderManagement = () => {
    const filteredShipments = orderFilter === 'ALL'
      ? shipments
      : shipments.filter(s => s.currentStatus === orderFilter);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Shipments & Orders</h2>
            <p className="text-slate-500">Track and manage active deliveries.</p>
          </div>
          <div className="flex gap-2">
            <select
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value as any)}
            >
              <option value="ALL">All Status</option>
              <option value="PLACED">Placed (New)</option>
              <option value="PICKUP_ASSIGNED">Pickup Assigned</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="EXCEPTION">Exception</option>
            </select>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tracking ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Recipient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Destination</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.length > 0 ? (
                filteredShipments.map(shipment => (
                  <tr key={shipment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600">{shipment.id}</td>
                    <td className="px-6 py-4 text-slate-800">{shipment.recipientName}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm truncate max-w-[200px]">{shipment.destination}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                        ${shipment.currentStatus === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                          shipment.currentStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                            shipment.currentStatus === 'EXCEPTION' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                      `}>
                        {shipment.currentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {shipment.currentStatus === 'PLACED' && (
                        <button
                          onClick={() => handleApproveOrder(shipment.id)}
                          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          Approve & Assign
                        </button>
                      )}
                      {shipment.currentStatus !== 'PLACED' && (
                        <button
                          onClick={() => handleViewShipment(shipment)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors text-xs font-medium"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Package size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No shipments found matching filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };




  const renderNotifications = () => (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notification Hub</h2>
          <p className="text-slate-500">Generate and manage customer alerts.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-white/60 shadow-lg">
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Describe Scenario</label>
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
            placeholder="e.g. A severe weather alert delaying all packages in the North region..."
            value={notifScenario}
            onChange={e => setNotifScenario(e.target.value)}
          ></textarea>
        </div>

        <button
          onClick={handleGenerateTemplate}
          disabled={!notifScenario || loadingAi}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loadingAi ? <Loader2 className="animate-spin" /> : 'Generate AI Template'}
        </button>

        {notifTemplate && (
          <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Generated Template</label>
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-mono text-sm leading-relaxed">
              {notifTemplate}
            </div>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Edit</button>
              <button className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-md">Save Template</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSystemArchitecture = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">System Status</h2>
        <p className="text-slate-500">Infrastructure health monitoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SystemCard icon={Server} label="API Gateway" status="Operational" ping="45ms" />
        <SystemCard icon={Database} label="Primary DB" status="Operational" ping="12ms" />
        <SystemCard icon={Globe} label="CDN & Static" status="Operational" ping="88ms" />
        <SystemCard icon={Cpu} label="AI Inference" status="High Load" ping="240ms" statusColor="amber" />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'OVERVIEW': return renderOverview();
      case 'USERS': return renderUserManagement();
      case 'ORDERS': return renderOrderManagement();
      case 'NOTIFICATIONS': return renderNotifications();
      case 'SYSTEM': return renderSystemArchitecture();
      default: return renderOverview();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-6rem)]">
      {/* Sidebar for Dashboard */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-2 overflow-y-auto pr-2 custom-scrollbar pb-4">
        <DashboardTab id="OVERVIEW" label="Overview" icon={Activity} active={activeTab} onClick={setActiveTab} />
        <div className="h-px bg-slate-200/50 my-2"></div>
        <DashboardTab id="USERS" label="User Management" icon={Users} active={activeTab} onClick={setActiveTab} />
        <DashboardTab id="ORDERS" label="Shipments & Orders" icon={FileText} active={activeTab} onClick={setActiveTab} />
        <DashboardTab id="NOTIFICATIONS" label="Notifications AI" icon={Bell} active={activeTab} onClick={setActiveTab} />
        <div className="h-px bg-slate-200/50 my-2"></div>
        <DashboardTab id="SYSTEM" label="System Status" icon={Server} active={activeTab} onClick={setActiveTab} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {renderContent()}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="RIDER">Rider</option>
                  <option value="HUB_MANAGER">Hub Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> User will receive an email with login instructions.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserForm({ name: '', email: '', phone: '', role: 'CUSTOMER' });
                }}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNewUser}
                disabled={!newUserForm.name || !newUserForm.email}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Edit User Details</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">User ID</p>
                <p className="font-mono text-sm text-slate-800">{selectedUser.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="RIDER">Rider</option>
                    <option value="HUB_MANAGER">Hub Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={editUserForm.status}
                    onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Changing the role or status will affect user permissions and access.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveUserChanges}
                disabled={!editUserForm.name || !editUserForm.email}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Shipment Modal */}
      <ShipmentDetailsModal
        isOpen={showViewShipmentModal}
        onClose={() => setShowViewShipmentModal(false)}
        shipment={selectedShipment}
      />
    </div>
  );
};

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/60 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl ${colors[color] || colors.blue}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

const DashboardTab = ({ id, label, icon: Icon, active, onClick }: { id: AdminTab, label: string, icon: any, active: AdminTab, onClick: (id: AdminTab) => void }) => (
  <button
    onClick={() => onClick(id)}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
      ${active === id ? 'bg-indigo-600/10 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
    `}
  >
    <Icon size={18} />
    {label}
  </button>
);

const SystemCard = ({ icon: Icon, label, status, ping, statusColor = 'emerald' }: any) => {
  const colorClass = statusColor === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50';
  const dotClass = statusColor === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Icon size={20} /></div>
        <span className="font-bold text-slate-700">{label}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 ${colorClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
          {status}
        </span>
        <span className="text-slate-400 flex items-center gap-1"><Wifi size={12} /> {ping}</span>
      </div>
    </div>
  );
}
