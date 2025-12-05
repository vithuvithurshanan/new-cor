import React from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { X, Package, MapPin, Calendar, Truck, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface ShipmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    shipment: Shipment | null;
}

export const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({ isOpen, onClose, shipment }) => {
    if (!isOpen || !shipment) return null;

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
            case ShipmentStatus.DELIVERED: return <CheckCircle size={20} />;
            case ShipmentStatus.EXCEPTION: return <AlertTriangle size={20} />;
            case ShipmentStatus.IN_TRANSIT: return <Truck size={20} />;
            default: return <Clock size={20} />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Package size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Shipment Details</h2>
                                <p className="text-sm text-slate-500 font-mono">{shipment.id}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Status Banner */}
                    <div className={`p-4 rounded-xl flex items-center gap-4 ${getStatusColor(shipment.currentStatus)} bg-opacity-50`}>
                        <div className={`p-2 rounded-full bg-white/50`}>
                            {getStatusIcon(shipment.currentStatus)}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Current Status</p>
                            <p className="text-lg font-bold">{shipment.currentStatus.replace(/_/g, ' ')}</p>
                        </div>
                    </div>

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="text-slate-400 mt-1" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Destination</p>
                                    <p className="font-medium text-slate-800">{shipment.destination}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-slate-400 mt-1" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Estimated Delivery</p>
                                    <p className="font-medium text-slate-800">{shipment.estimatedDelivery}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 mt-1">To</div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Recipient</p>
                                    <p className="font-medium text-slate-800">{shipment.recipientName}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Truck size={18} className="text-indigo-600" /> Tracking History
                        </h3>
                        <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                            {shipment.events.map((event, index) => (
                                <div key={index} className="relative">
                                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm 
                    ${index === 0 ? 'bg-indigo-600 ring-4 ring-indigo-50' : 'bg-slate-300'}`}
                                    ></div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                        <div>
                                            <p className={`font-bold ${index === 0 ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                {event.status.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-sm text-slate-600">{event.description}</p>
                                            {event.location && (
                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <MapPin size={10} /> {event.location}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium shadow-sm transition-colors">
                        Download Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};
