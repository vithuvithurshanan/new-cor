import React, { useState, useEffect } from 'react';
import { Shipment, User, ShipmentStatus } from '../types';
import { mockDataService } from '../services/mockDataService';
import { Package, Search, Filter, ArrowRight, Clock, MapPin, Truck, CheckCircle, AlertTriangle, TrendingUp, DollarSign, LayoutDashboard, Send } from 'lucide-react';
import { ShipmentDetailsModal } from './ShipmentDetailsModal';

interface CustomerDashboardViewProps {
    currentUser: User;
}

type CustomerTab = 'OVERVIEW' | 'ORDERS';

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<CustomerTab>('OVERVIEW');
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'ALL'>('ALL');

    // Modal State
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const loadShipments = async () => {
            setLoading(true);
            try {
                // Load shipments from Firestore
                const { firebaseService } = await import('../services/firebaseService');
                const allShipments = await firebaseService.queryDocuments<Shipment>('shipments', []);

                // Filter for user's shipments
                const userShipments = allShipments.filter(s =>
                    s.customerId === currentUser.id ||
                    s.recipientEmail === currentUser.email
                );

                setShipments(userShipments);
            } catch (error) {
                console.error('Failed to load shipments from Firestore:', error);
                // Fallback to mock data
                const mockDataService = await import('../services/mockDataService');
                const allShipments = await mockDataService.mockDataService.getShipments();
                const userShipments = allShipments.filter(s =>
                    s.customerId === currentUser.id ||
                    s.recipientEmail === currentUser.email ||
                    (currentUser.role === 'CUSTOMER' && ['TRK-112233', 'TRK-885210', 'TRK-998877'].includes(s.id))
                );
                setShipments(userShipments);
            }
            setLoading(false);
        };

        loadShipments();
    }, [currentUser]);

    const filteredShipments = shipments.filter(s => {
        const matchesSearch =
            s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.destination.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || s.currentStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleViewDetails = (shipment: Shipment) => {
        setSelectedShipment(shipment);
        setShowModal(true);
    };

    const getStatusColor = (status: ShipmentStatus) => {
        switch (status) {
            case ShipmentStatus.PLACED: return 'bg-blue-100 text-blue-700';
            case ShipmentStatus.PICKUP_ASSIGNED: return 'bg-indigo-100 text-indigo-700';
            case ShipmentStatus.IN_TRANSIT: return 'bg-amber-100 text-amber-700';
            case ShipmentStatus.DELIVERED: return 'bg-emerald-100 text-emerald-700';
            case ShipmentStatus.EXCEPTION: return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusIcon = (status: ShipmentStatus) => {
        switch (status) {
            case ShipmentStatus.DELIVERED: return <CheckCircle size={16} />;
            case ShipmentStatus.EXCEPTION: return <AlertTriangle size={16} />;
            case ShipmentStatus.IN_TRANSIT: return <Truck size={16} />;
            default: return <Clock size={16} />;
        }
    };

    // Calculate stats for overview
    const activeShipments = shipments.filter(s => s.currentStatus === ShipmentStatus.IN_TRANSIT || s.currentStatus === ShipmentStatus.PICKUP_ASSIGNED).length;
    const deliveredShipments = shipments.filter(s => s.currentStatus === ShipmentStatus.DELIVERED).length;
    const totalSpent = shipments.length * 45; // Mock calculation

    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Welcome back, {currentUser.name}!</h2>
                <p className="text-slate-500">Here's an overview of your shipping activity.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/60 flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-indigo-50 text-indigo-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Active Shipments</p>
                        <p className="text-2xl font-bold text-slate-800">{activeShipments}</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/60 flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Delivered</p>
                        <p className="text-2xl font-bold text-slate-800">{deliveredShipments}</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/60 flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-violet-50 text-violet-600">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Spent</p>
                        <p className="text-2xl font-bold text-slate-800">${totalSpent}</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {shipments.slice(0, 3).map(shipment => (
                        <div key={shipment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="font-mono font-bold text-sm text-slate-800">{shipment.id}</p>
                                    <p className="text-xs text-slate-500">{shipment.destination}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${getStatusColor(shipment.currentStatus)}`}>
                                {getStatusIcon(shipment.currentStatus)}
                                {shipment.currentStatus.replace(/_/g, ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group">
                    <div className="text-left">
                        <p className="font-bold text-lg">Send a Package</p>
                        <p className="text-indigo-100 text-sm">Create a new shipment</p>
                    </div>
                    <Send size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button className="bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                    <div className="text-left">
                        <p className="font-bold text-lg text-slate-800">Track Package</p>
                        <p className="text-slate-500 text-sm">Find your shipment</p>
                    </div>
                    <Search size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </button>
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">My Orders</h2>
                <p className="text-slate-500">Track and manage your shipment history.</p>
            </div>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by ID, Recipient, or Destination..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={20} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full md:w-48 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PLACED">Placed</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="EXCEPTION">Exception</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading your orders...</p>
                    </div>
                ) : filteredShipments.length > 0 ? (
                    filteredShipments.map(shipment => (
                        <div
                            key={shipment.id}
                            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 p-6 hover:shadow-md transition-all group"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-mono font-bold text-lg text-slate-800">{shipment.id}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${getStatusColor(shipment.currentStatus)}`}>
                                                {getStatusIcon(shipment.currentStatus)}
                                                {shipment.currentStatus.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <Clock size={14} />
                                            Est. Delivery: <span className="font-medium text-slate-700">{shipment.estimatedDelivery}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 px-4 hidden md:block">
                                    <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                                        <span>Origin</span>
                                        <span>Destination</span>
                                    </div>
                                    <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`absolute top-0 left-0 h-full rounded-full ${shipment.currentStatus === 'DELIVERED' ? 'bg-emerald-500 w-full' : 'bg-indigo-500 w-1/2'}`}
                                        ></div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-medium text-slate-700 mt-2">
                                        <span className="truncate max-w-[150px]">New York, NY</span>
                                        <span className="truncate max-w-[150px]">{shipment.destination}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleViewDetails(shipment)}
                                    className="w-full md:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    View Details
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-300">
                        <Package size={48} className="mx-auto mb-4 text-slate-300" />
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No Orders Found</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            We couldn't find any shipments matching your search. Try adjusting your filters or create a new shipment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
            {/* Tabs */}
            <div className="mb-6 flex gap-2 bg-white/60 backdrop-blur-xl p-2 rounded-2xl border border-white/60 w-fit">
                <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'OVERVIEW'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <LayoutDashboard size={18} />
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('ORDERS')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'ORDERS'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Package size={18} />
                    My Orders
                </button>
            </div>

            {/* Content */}
            {activeTab === 'OVERVIEW' ? renderOverview() : renderOrders()}

            {/* Details Modal */}
            <ShipmentDetailsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                shipment={selectedShipment}
            />
        </div>
    );
};
