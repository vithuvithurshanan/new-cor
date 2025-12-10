import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Navigation, MapPin, Package } from 'lucide-react';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RiderMapProps {
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
    vehicleLocation?: { lat: number; lng: number };
    showLocationOverlay?: boolean;
    currentAddress?: string;
    destinationAddress?: string;
    estimatedTime?: string;
    distance?: string;
}

const RoutingMachine = ({ start, end, vehicleLocation }: { start: { lat: number; lng: number }, end: { lat: number; lng: number }, vehicleLocation?: { lat: number; lng: number } }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start.lat, start.lng),
                L.latLng(end.lat, end.lng)
            ],
            routeWhileDragging: false,
            showAlternatives: false,
            fitSelectedRoutes: true,
            show: false, // Hide the itinerary instructions
            // @ts-ignore - leaflet-routing-machine types are loose
            lineOptions: {
                styles: [{ color: '#6366f1', opacity: 0.8, weight: 6 }]
            },
            createMarker: function (i: number, waypoint: any, n: number) {
                const markerIcon = L.icon({
                    iconUrl: i === 0
                        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
                        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
                return L.marker(waypoint.latLng, {
                    draggable: false,
                    icon: markerIcon
                });
            }
        }).addTo(map);

        return () => {
            map.removeControl(routingControl);
        };
    }, [map, start, end]);

    return null;
};

// Vehicle Location Marker Component
const VehicleMarker = ({ position }: { position: { lat: number; lng: number } }) => {
    const map = useMap();
    const [marker, setMarker] = useState<L.Marker | null>(null);

    useEffect(() => {
        if (!map) return;

        // Create custom vehicle icon
        const vehicleIcon = L.divIcon({
            className: 'custom-vehicle-marker',
            html: `
                <div style="
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                    animation: pulse 2s infinite;
                ">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                        <path d="M5 17h14v-5H5v5z"/>
                        <path d="M3 17h2v2H3v-2z"/>
                        <path d="M19 17h2v2h-2v-2z"/>
                        <path d="M5 12l2-5h10l2 5"/>
                    </svg>
                </div>
                <style>
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                </style>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });

        const newMarker = L.marker([position.lat, position.lng], {
            icon: vehicleIcon,
            zIndexOffset: 1000
        }).addTo(map);

        newMarker.bindPopup(`
            <div style="text-align: center; font-family: system-ui;">
                <strong style="color: #6366f1;">🚗 Your Vehicle</strong><br/>
                <span style="font-size: 12px; color: #64748b;">Current Location</span>
            </div>
        `);

        setMarker(newMarker);

        return () => {
            map.removeLayer(newMarker);
        };
    }, [map, position.lat, position.lng]);

    return null;
};

export const RiderMap: React.FC<RiderMapProps> = ({ 
    start, 
    end, 
    vehicleLocation,
    showLocationOverlay = false,
    currentAddress,
    destinationAddress,
    estimatedTime,
    distance
}) => {
    // Use vehicle location as center if available, otherwise use start
    const mapCenter = vehicleLocation || start;

    return (
        <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 z-0 relative">
            <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RoutingMachine start={start} end={end} vehicleLocation={vehicleLocation} />
                
                {/* Show vehicle marker if location provided */}
                {vehicleLocation && <VehicleMarker position={vehicleLocation} />}
            </MapContainer>

            {/* Current Location Overlay at Bottom */}
            {showLocationOverlay && (
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 shadow-2xl z-[1000]">
                    <div className="flex items-start gap-4">
                        {/* Current Location */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Current Location</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                                {currentAddress || 'Fetching location...'}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-12 bg-slate-200"></div>

                        {/* Destination */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin size={12} className="text-emerald-600" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Destination</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                                {destinationAddress || 'Not set'}
                            </p>
                        </div>
                    </div>

                    {/* ETA and Distance */}
                    {(estimatedTime || distance) && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                            {estimatedTime && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Navigation size={14} className="text-indigo-600" />
                                    <span className="font-medium text-slate-600">ETA:</span>
                                    <span className="font-bold text-indigo-600">{estimatedTime}</span>
                                </div>
                            )}
                            {distance && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Package size={14} className="text-slate-400" />
                                    <span className="font-medium text-slate-600">{distance}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
