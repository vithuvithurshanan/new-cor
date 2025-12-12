import React, { useState } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { Star, Map, Calendar, Package, ChevronRight } from 'lucide-react';
import { RouteMapModal } from './RouteMapModal';

interface RiderHistoryListProps {
    shipments: Shipment[];
}

export const RiderHistoryList: React.FC<RiderHistoryListProps> = ({ shipments }) => {
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

    // Mock coordinates generator (since real data might not have them yet)
    const getCoordinates = (address: string) => {
        // Deterministic pseudo-random based on address length
        const seed = address.length;
        return {
            lat: 40.7128 + (seed % 10) * 0.01,
            lng: -74.0060 - (seed % 10) * 0.01
        };
    };

    return (
        <div className="space-y-4">
            {shipments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Package size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No completed shipments yet</p>
                </div>
            ) : (
                shipments.map(shipment => (
                    <div key={shipment.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-800 text-sm">{shipment.trackingId}</span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full">
                                        Delivered
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(shipment.updatedAt).toLocaleDateString()}
                                </p>
                            </div>

                            {shipment.rating ? (
                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                    <Star size={14} className="fill-amber-400 text-amber-400" />
                                    <span className="font-bold text-amber-700 text-sm">{shipment.rating}</span>
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400 italic">Not rated</span>
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Pickup</p>
                                    <p className="text-sm text-slate-700 truncate w-64">{shipment.pickupAddress.street}, {shipment.pickupAddress.city}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Dropoff</p>
                                    <p className="text-sm text-slate-700 truncate w-64">{shipment.dropoffAddress.street}, {shipment.dropoffAddress.city}</p>
                                </div>
                            </div>
                        </div>

                        {shipment.feedback && (
                            <div className="bg-slate-50 p-3 rounded-lg mb-3 text-sm text-slate-600 italic border border-slate-100">
                                "{shipment.feedback}"
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedShipment(shipment)}
                            className="w-full py-2 bg-white border border-slate-200 text-indigo-600 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Map size={16} />
                            View Route
                        </button>
                    </div>
                ))
            )}

            {selectedShipment && (
                <RouteMapModal
                    isOpen={!!selectedShipment}
                    onClose={() => setSelectedShipment(null)}
                    shipmentId={selectedShipment.trackingId}
                    pickup={{
                        ...getCoordinates(selectedShipment.pickupAddress.street),
                        address: selectedShipment.pickupAddress.street
                    }}
                    dropoff={{
                        ...getCoordinates(selectedShipment.dropoffAddress.street),
                        address: selectedShipment.dropoffAddress.street
                    }}
                />
            )}
        </div>
    );
};
