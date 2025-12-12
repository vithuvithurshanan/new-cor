
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DashboardStats, User, PricingConfig, Shipment, ShipmentStatus, UserRole } from '../types';
import { generateLogisticsReport, optimizePricingRules, generateNotificationTemplate } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { mockDataService } from '../services/mockDataService';
import { useToast } from './ui/ToastContext';
import { TrendingUp, Package, AlertTriangle, CheckCircle, Sparkles, Loader2, Users, CreditCard, Bell, Search, Sliders, DollarSign, FileText, Server, Globe, Shield, Database, Activity, Wifi, Cpu, MessageSquare, ArrowRight, Filter, Eye } from 'lucide-react';
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

interface DashboardViewProps {
  initialTab?: AdminTab;
  roleFilter?: UserRole;
  orderFilter?: ShipmentStatus;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ initialTab = 'OVERVIEW', roleFilter, orderFilter: initialOrderFilter }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
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
  const [orderFilter, setOrderFilter] = useState<ShipmentStatus | 'ALL'>(initialOrderFilter || 'ALL');

  // -- MODAL STATES --
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', phone: '', role: 'CUSTOMER', status: 'ACTIVE' });
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', phone: '', role: 'CUSTOMER' });
  const [showViewShipmentModal, setShowViewShipmentModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const { showToast } = useToast();

  // -- RIDER ASSIGNMENT STATES --
  const [showAssignRiderModal, setShowAssignRiderModal] = useState(false);
  const [selectedShipmentForAssignment, setSelectedShipmentForAssignment] = useState<Shipment | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const { firebaseService } = await import('../services/firebaseService');

        // Load all data from Firestore
        const [userList, shipmentList] = await Promise.all([
          firebaseService.queryDocuments<User>('users', []),
          firebaseService.queryDocuments<Shipment>('shipments', [])
        ]);

        // Calculate dashboard stats from real data
        const dashboardStats = {
          totalShipments: shipmentList.length,
          activeShipments: shipmentList.filter(s => s.currentStatus !== 'DELIVERED').length,
          totalRevenue: shipmentList.reduce((sum, s) => sum + (s.price || 0), 0),
          totalUsers: userList.length,
          pendingApprovals: shipmentList.filter(s => s.currentStatus === 'PLACED').length,
          deliveredToday: shipmentList.filter(s => {
            const today = new Date().toDateString();
            return s.currentStatus === 'DELIVERED' && new Date(s.updatedAt).toDateString() === today;
          }).length
        };

        setStats(dashboardStats);
        setUsers(userList);
        setShipments(shipmentList);
      } catch (error) {
        console.error('Firestore error, using mock data:', error);
        showToast('Failed to load data. Using mock data.', 'error');
        // Fallback to mock data
        const dashboardStats = await apiService.getDashboardStats();
        const userList = await apiService.getUsers();
        const shipmentList = await apiService.getShipments();

        setStats(dashboardStats);
        setUsers(userList);
        setShipments(shipmentList);
      }
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

  const handleStatusChange = async (shipmentId: string, newStatus: ShipmentStatus) => {
    try {
      const { firebaseService } = await import('../services/firebaseService');
      await firebaseService.updateDocument('shipments', shipmentId, { currentStatus: newStatus });

      // Reload shipments from Firestore
      const shipmentList = await firebaseService.queryDocuments<Shipment>('shipments', []);
      setShipments(shipmentList);

      // Recalculate stats
      // Recalculate stats
      const dashboardStats = {
        totalShipments: shipmentList.length,
        activeShipments: shipmentList.filter(s => s.currentStatus !== 'DELIVERED').length,
        totalRevenue: shipmentList.reduce((sum, s) => sum + (s.price || 0), 0),
        totalUsers: users.length,
        pendingApprovals: shipmentList.filter(s => s.currentStatus === 'PLACED').length,
        deliveredToday: shipmentList.filter(s => {
          const today = new Date().toDateString();
          return s.currentStatus === 'DELIVERED' && new Date(s.updatedAt).toDateString() === today;
        }).length
      };
      setStats(dashboardStats);
      showToast('Shipment status updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update shipment status:', error);
      // Fallback to mock data reload
      const updatedShipments = await mockDataService.getShipments();
      setShipments(updatedShipments);
      const updatedStats = await mockDataService.getDashboardStats();
      setStats(updatedStats);
      showToast('Status updated (Mock Data)', 'warning');
    }
  };

  const handleGenerateTemplate = async () => {
    if (!notifScenario) return;
    setLoadingAi(true);
    const template = await generateNotificationTemplate(notifScenario);
    setNotifTemplate(template);
    setLoadingAi(false);
  };

  const handleApproveOrder = async (id: string) => {
    try {
      const { firebaseService } = await import('../services/firebaseService');
      // Update shipment status to PICKUP_ASSIGNED
      await firebaseService.updateDocument('shipments', id, {
        currentStatus: ShipmentStatus.PICKUP_ASSIGNED
      });

      // Notify Customer
      const shipment = shipments.find(s => s.id === id);
      if (shipment) {
        await firebaseService.addNotification({
          userId: shipment.customerId,
          title: 'Order Accepted',
          message: `Your order ${shipment.trackingId} has been accepted and a rider is being assigned.`,
          type: 'SUCCESS',
          read: false,
          relatedId: shipment.id
        });
      }

      // Refresh shipments from Firestore
      await handleStatusChange(id, ShipmentStatus.PICKUP_ASSIGNED);
      showToast('Order approved and pickup assigned', 'success');
    } catch (error) {
      console.error('Failed to approve order:', error);
      // Fallback to mock data
      await mockDataService.updateShipmentStatus(id, ShipmentStatus.PICKUP_ASSIGNED, 'Hub Admin');
      const updatedShipments = await mockDataService.getShipments();
      setShipments(updatedShipments);
      const updatedStats = await mockDataService.getDashboardStats();
      setStats(updatedStats);
      showToast('Order approved (Mock Data)', 'warning');
    }
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const saveNewUser = () => {
    console.log('Creating new user:', newUserForm);
    // Add user to state
    const newUser: User = {
      id: `USR - ${Date.now()} `,
      name: newUserForm.name,
      email: newUserForm.email,
      phone: newUserForm.phone,
      role: newUserForm.role as any,
      status: 'ACTIVE'
    };
    setUsers([...users, newUser]);
    setShowAddUserModal(false);
    setNewUserForm({ name: '', email: '', phone: '', role: 'CUSTOMER' });
    showToast('New user added successfully', 'success');
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
    showToast('User details updated successfully', 'success');
  };

  const handleViewShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowViewShipmentModal(true);
  };

  const openAssignRiderModal = (shipment: Shipment) => {
    setSelectedShipmentForAssignment(shipment);
    setShowAssignRiderModal(true);
    setSelectedRiderId('');
  };

  const confirmAssignment = async () => {
    if (!selectedShipmentForAssignment || !selectedRiderId) return;

    try {
      const { firebaseService } = await import('../services/firebaseService');

      // Update shipment
      await firebaseService.updateDocument('shipments', selectedShipmentForAssignment.id, {
        riderId: selectedRiderId,
        currentStatus: ShipmentStatus.PICKUP_ASSIGNED
      });

      // Notify Rider
      await firebaseService.addNotification({
        userId: selectedRiderId,
        title: 'New Order Assigned',
        message: `You have been assigned to pickup order ${selectedShipmentForAssignment.trackingId} `,
        type: 'INFO',
        read: false,
        relatedId: selectedShipmentForAssignment.id
      });

      // Create Rider Task
      await firebaseService.addRiderTask({
        riderId: selectedRiderId,
        type: 'PICKUP',
        status: 'PENDING',
        address: `${selectedShipmentForAssignment.pickupAddress.street}, ${selectedShipmentForAssignment.pickupAddress.city}`,
        customerName: selectedShipmentForAssignment.recipientName, // Or sender if available
        timeSlot: 'ASAP', // You might want to format createdAt or estimatedDelivery
        packageDetails: selectedShipmentForAssignment.description || 'Package',
        earnings: selectedShipmentForAssignment.price ? selectedShipmentForAssignment.price * 0.8 : 15.00, // 80% commission or default
        distance: `${selectedShipmentForAssignment.distanceMiles || 0} miles`,
        shipmentId: selectedShipmentForAssignment.id,
        startCoordinates: selectedShipmentForAssignment.pickupAddress.coordinates || { lat: 40.7128, lng: -74.0060 },
        endCoordinates: selectedShipmentForAssignment.dropoffAddress.coordinates || { lat: 40.7489, lng: -73.9680 }
      });

      // Check if vehicle needs upgrade based on new load
      await firebaseService.assignVehicleToRiderBasedOnLoad(selectedRiderId);

      // Refresh data
      const shipmentList = await firebaseService.queryDocuments<Shipment>('shipments', []);
      setShipments(shipmentList);

      setShowAssignRiderModal(false);
      setSelectedShipmentForAssignment(null);
      setSelectedRiderId('');

      // Recalculate stats (simplified)
      const dashboardStats = {
        totalShipments: shipmentList.length,
        activeShipments: shipmentList.filter(s => s.currentStatus !== 'DELIVERED').length,
        totalRevenue: shipmentList.reduce((sum, s) => sum + (s.price || 0), 0),
        totalUsers: users.length,
        pendingApprovals: shipmentList.filter(s => s.currentStatus === 'PLACED').length,
        deliveredToday: shipmentList.filter(s => {
          const today = new Date().toDateString();
          return s.currentStatus === 'DELIVERED' && new Date(s.updatedAt).toDateString() === today;
        }).length
      };
      setStats(dashboardStats);

      showToast('Rider assigned successfully!', 'success');

    } catch (error) {
      console.error('Failed to assign rider:', error);
      showToast('Failed to assign rider. Please try again.', 'error');
    }
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


  const renderUserManagement = () => {
    const filteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;
    const title = roleFilter ? `${roleFilter.charAt(0) + roleFilter.slice(1).toLowerCase().replace('_', ' ')} Management` : 'User Management';

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            <p className="text-slate-500">Manage {roleFilter ? roleFilter.toLowerCase().replace('_', ' ') + 's' : 'customers, riders, and staff'}.</p>
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

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-x-auto">
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
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{user.name}</p>
                        <p className="text-slate-800 font-medium">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                    ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'RIDER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }
                    `}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium
                    ${user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'} `}></span>
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
  };

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
            <thead>
              <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Tracking ID</th>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Destination</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.length > 0 ? (
                filteredShipments.map(shipment => (
                  <tr key={shipment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-500">{shipment.id.substring(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-indigo-600 font-medium">{shipment.trackingId}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-medium text-sm">{shipment.recipientName}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm truncate max-w-[200px]">{shipment.destination}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                            ${shipment.currentStatus === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                          shipment.currentStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                            shipment.currentStatus === 'EXCEPTION' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }
                      `}>
                        {shipment.currentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewShipment(shipment)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {shipment.currentStatus === 'PLACED' && (
                          <button
                            onClick={() => handleApproveOrder(shipment.id)}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            Approve & Assign
                          </button>
                        )}
                        {shipment.currentStatus === 'PICKUP_ASSIGNED' && !shipment.riderId && (
                          <button
                            onClick={() => openAssignRiderModal(shipment)}
                            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
                          >
                            <Users size={12} />
                            Assign Rider
                          </button>
                        )}
                        {shipment.currentStatus === 'PICKUP_ASSIGNED' && shipment.riderId && (
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 cursor-not-allowed">
                            <CheckCircle size={12} />
                            Rider Assigned
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
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
    <div className="h-full">
      {/* Main Content */}
      <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
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

      <ShipmentDetailsModal
        isOpen={showViewShipmentModal}
        onClose={() => setShowViewShipmentModal(false)}
        shipment={selectedShipment}
      />

      {/* Assign Rider Modal */}
      {showAssignRiderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Assign Rider</h3>
            <p className="text-sm text-slate-500 mb-4">
              Select a rider for order <span className="font-mono font-bold text-slate-700">{selectedShipmentForAssignment?.trackingId}</span>
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar mb-6">
              {users.filter(u => u.role === 'RIDER' && u.status === 'ACTIVE').map(rider => (
                <div
                  key={rider.id}
                  onClick={() => setSelectedRiderId(rider.id)}
                  className={`p - 3 rounded - xl border cursor - pointer transition - all flex items - center justify - between
                    ${selectedRiderId === rider.id
                      ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }
`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      {rider.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{rider.name}</p>
                      <p className="text-xs text-slate-500">{rider.phone}</p>
                    </div>
                  </div>
                  {selectedRiderId === rider.id && <CheckCircle size={16} className="text-indigo-600" />}
                </div>
              ))}
              {users.filter(u => u.role === 'RIDER' && u.status === 'ACTIVE').length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">No active riders found.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignRiderModal(false);
                  setSelectedShipmentForAssignment(null);
                  setSelectedRiderId('');
                }}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAssignment}
                disabled={!selectedRiderId}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
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
      <div className={`p - 4 rounded - xl ${colors[color] || colors.blue} `}>
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
w - full flex items - center gap - 3 px - 4 py - 3 rounded - xl text - sm font - medium transition - all
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
        <span className={`px - 2 py - 1 rounded - md text - xs font - bold flex items - center gap - 1.5 ${colorClass} `}>
          <span className={`w - 1.5 h - 1.5 rounded - full ${dotClass} `}></span>
          {status}
        </span>
        <span className="text-slate-400 flex items-center gap-1"><Wifi size={12} /> {ping}</span>
      </div>
    </div>
  );
}
