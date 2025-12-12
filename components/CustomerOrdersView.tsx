import React, { useState, useEffect } from 'react';
import { Shipment, User, ShipmentStatus } from '../types';
import { mockDataService } from '../services/mockDataService';
import { Package, Search, Filter, ArrowRight, Clock, MapPin, Truck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ShipmentDetailsModal } from './ShipmentDetailsModal';
import { RateRiderModal } from './RateRiderModal';

interface CustomerOrdersViewProps {
    currentUser: User;
}



export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({ currentUser }) => {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'ALL'>('ALL');

    // Rating Modal State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [shipmentToRate, setShipmentToRate] = useState<Shipment | null>(null);

    const handleRateRider = (shipment: Shipment) => {
        setShipmentToRate(shipment);
        setShowRatingModal(true);
    };

    const submitRating = async (shipmentId: string, rating: number, feedback: string) => {
        try {
            const { firebaseService } = await import('../services/firebaseService');
            await firebaseService.updateDocument('shipments', shipmentId, { rating, feedback });

            // Update local state
            setShipments(prev => prev.map(s =>
                s.id === shipmentId ? { ...s, rating, feedback } : s
            ));

            // Show success toast (using alert for now as toast hook isn't directly imported here but handled by parent)
            // Ideally we'd use the toast context here
        } catch (error) {
            console.error('Failed to submit rating:', error);
            alert('Failed to submit rating. Please try again.');
        }
    };
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

                // Filter for shipments where the user is the customer
                const userShipments = allShipments.filter(s =>
                    s.customerId === currentUser.id ||
                    s.recipientEmail === currentUser.email
                );

                setShipments(userShipments);
            } catch (error) {
                console.error('Failed to load shipments from Firestore:', error);
                // Fallback to mock data if Firestore fails
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

    const handleCancelOrder = async (shipmentId: string) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            const { firebaseService } = await import('../services/firebaseService');
            await firebaseService.updateDocument('shipments', shipmentId, { currentStatus: ShipmentStatus.CANCELLED });

            // Update local state
            setShipments(prev => prev.map(s =>
                s.id === shipmentId ? { ...s, currentStatus: ShipmentStatus.CANCELLED } : s
            ));
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert('Failed to cancel order. Please try again.');
        }
    };

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
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-1 gap-8 pb-12 relative-7xl  animate-fade-in">
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
                                            <div>
                                                <p className="text-xs text-slate-400 mb-0.5">Order ID</p>
                                                <span className="font-mono text-xs text-slate-600">{shipment.id.substring(0, 12)}</span>
                                            </div>
                                            <div className="h-8 w-px bg-slate-200"></div>
                                            <div>
                                                <p className="text-xs text-slate-400 mb-0.5">Tracking ID</p>
                                                <span className="font-mono font-bold text-sm text-indigo-600">{shipment.trackingId}</span>
                                            </div>
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
                                <div className="flex flex-col md:flex-row gap-2">
                                    <button
                                        onClick={() => handleViewDetails(shipment)}
                                        className="w-full md:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        View Details
                                        <ArrowRight size={16} />
                                    </button>

                                    {shipment.currentStatus === ShipmentStatus.PLACED && (
                                        <button
                                            onClick={() => handleCancelOrder(shipment.id)}
                                            className="w-full md:w-auto px-5 py-2.5 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            Cancel Order
                                            <XCircle size={16} />
                                        </button>
                                    )}

                                    {shipment.currentStatus === ShipmentStatus.DELIVERED && !shipment.rating && (
                                        <button
                                            onClick={() => handleRateRider(shipment)}
                                            className="w-full md:w-auto px-5 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 font-medium rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            Rate Rider
                                            <CheckCircle size={16} />
                                        </button>
                                    )}
                                </div>
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

            {/* Rate Rider Modal */}
            <RateRiderModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                shipment={shipmentToRate}
                onSubmit={submitRating}
            />
        </div>
    );
};
