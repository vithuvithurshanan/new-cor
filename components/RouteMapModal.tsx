import React from 'react';
import { X, MapPin, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RouteMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    pickup: { lat: number; lng: number; address: string };
    dropoff: { lat: number; lng: number; address: string };
    shipmentId: string;
}

export const RouteMapModal: React.FC<RouteMapModalProps> = ({ isOpen, onClose, pickup, dropoff, shipmentId }) => {
    if (!isOpen) return null;

    const centerLat = (pickup.lat + dropoff.lat) / 2;
    const centerLng = (pickup.lng + dropoff.lng) / 2;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">

                {/* Header */}
                <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg pointer-events-auto border border-white/50">
                        <h3 className="font-bold text-slate-800">Route Details</h3>
                        <p className="text-xs text-slate-500 font-mono">#{shipmentId}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white text-slate-500 hover:text-slate-800 pointer-events-auto transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Map */}
                <div className="flex-1 w-full h-full">
                    <MapContainer
                        center={[centerLat, centerLng]}
                        zoom={13}
                        className="w-full h-full"
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Pickup Marker */}
                        <Marker position={[pickup.lat, pickup.lng]}>
                            <Popup>
                                <div className="text-center">
                                    <p className="font-bold text-indigo-600">Pickup</p>
                                    <p className="text-xs text-slate-500">{pickup.address}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Dropoff Marker */}
                        <Marker position={[dropoff.lat, dropoff.lng]}>
                            <Popup>
                                <div className="text-center">
                                    <p className="font-bold text-emerald-600">Dropoff</p>
                                    <p className="text-xs text-slate-500">{dropoff.address}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Route Line */}
                        <Polyline
                            positions={[
                                [pickup.lat, pickup.lng],
                                [dropoff.lat, dropoff.lng]
                            ]}
                            pathOptions={{ color: '#4f46e5', weight: 4, opacity: 0.7, dashArray: '10, 10' }}
                        />
                    </MapContainer>
                </div>

                {/* Footer Info */}
                <div className="bg-white p-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                            Pickup
                        </div>
                        <div className="w-8 h-px bg-slate-300"></div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            Dropoff
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
