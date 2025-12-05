import React, { useState, useEffect } from 'react';
import { Shipment, User, ShipmentStatus } from '../types';
import { mockDataService } from '../services/mockDataService';
import { Package, Search, Filter, ArrowRight, Clock, MapPin, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { ShipmentDetailsModal } from './ShipmentDetailsModal';

interface CustomerOrdersViewProps {
    currentUser: User;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({ currentUser }) => {
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
            // In a real app, we'd fetch only the user's shipments from the backend
            // For now, we fetch all and filter client-side
            const allShipments = await mockDataService.getShipments();

            // Filter for shipments where the user is the sender or recipient
            // Note: In a real scenario, we'd match by ID or email more robustly
            const userShipments = allShipments.filter(s =>
                s.senderId === currentUser.id ||
                s.recipientEmail === currentUser.email ||
                // For demo purposes, if the user is a generic customer, show some demo data
                (currentUser.role === 'CUSTOMER' && ['TRK-112233', 'TRK-885210', 'TRK-998877'].includes(s.id))
            );

            setShipments(userShipments);
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

    return (
        <div className="max-w-6xl mx-auto pb-10 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">My Orders</h1>
                <p className="text-slate-500">Track and manage your shipment history.</p>
            </div>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
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

                                {/* Left: ID and Status */}
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

                                {/* Middle: Route Info */}
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

                                {/* Right: Action */}
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

            {/* Details Modal */}
            <ShipmentDetailsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                shipment={selectedShipment}
            />
        </div>
    );
};
