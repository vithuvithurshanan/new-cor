import React, { useState, useEffect, useRef } from 'react';
import { Shipment, ShipmentStatus, User } from '../types';
import { mockDataService } from '../services/mockDataService';
import { Check, Truck, Package, MapPin, Clock, Home, AlertCircle, Map as MapIcon, Maximize2, Minimize2, Navigation, Lock, Eye, Search, Layers, Globe, Activity, Split } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix for default Leaflet markers in Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const STATUS_STEPS = [
  { key: ShipmentStatus.PLACED, label: "Order Placed", icon: Package },
  { key: ShipmentStatus.PICKUP_ASSIGNED, label: "Pickup Assigned", icon: Truck },
  { key: ShipmentStatus.PICKED, label: "Picked Up", icon: Check },
  { key: ShipmentStatus.HUB1_ARRIVAL, label: "Arrived at Central Hub", icon: MapPin },
  { key: ShipmentStatus.IN_TRANSIT, label: "In Transit", icon: Truck },
  { key: ShipmentStatus.HUB2_ARRIVAL, label: "Arrived at Local Hub", icon: MapPin },
  { key: ShipmentStatus.OUT_FOR_DELIVERY, label: "Out for Delivery", icon: Truck },
  { key: ShipmentStatus.DELIVERED, label: "Delivered", icon: Home },
];

interface TrackingViewProps {
  currentUser: User | null;
}

// Component to update map view when coordinates change
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
};

// Routing Control Component
const RoutingControl = ({
  pickup,
  dropoff,
  showAlternatives,
  onRouteFound
}: {
  pickup: [number, number],
  dropoff: [number, number],
  showAlternatives?: boolean,
  onRouteFound?: (summary: { totalDistance: number, totalTime: number }) => void
}) => {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  // Initialize control once
  useEffect(() => {
    if (!map) return;

    const routingControl = (L as any).Routing.control({
      waypoints: [
        L.latLng(pickup[0], pickup[1]),
        L.latLng(dropoff[0], dropoff[1])
      ],
      routeWhileDragging: false,
      show: true, // Show the itinerary instructions
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: showAlternatives,
      collapsible: true,
      position: 'topleft',
      lineOptions: {
        styles: [{ color: '#4f46e5', opacity: 0.7, weight: 5, dashArray: '10, 10' }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      altLineOptions: {
        styles: [{ color: '#94a3b8', opacity: 0.6, weight: 4 }]
      },
      createMarker: function () { return null; } // We already have custom markers
    });

    routingControl.on('routesfound', function (e: any) {
      const routes = e.routes;
      const summary = routes[0].summary;
      if (onRouteFound) {
        onRouteFound({
          totalDistance: summary.totalDistance, // in meters
          totalTime: summary.totalTime // in seconds
        });
      }
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;

    return () => {
      if (map && routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.warn("Error removing routing control:", e);
        }
      }
    };
  }, [map, showAlternatives]); // Re-run if showAlternatives changes (note: might need full re-init for this prop)

  // Update waypoints when props change
  useEffect(() => {
    if (routingControlRef.current && pickup && dropoff) {
      routingControlRef.current.setWaypoints([
        L.latLng(pickup[0], pickup[1]),
        L.latLng(dropoff[0], dropoff[1])
      ]);
    }
  }, [pickup, dropoff]);

  return null;
};

export const TrackingView: React.FC<TrackingViewProps> = ({ currentUser }) => {
  const [trackingId, setTrackingId] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [rider, setRider] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [routeMetrics, setRouteMetrics] = useState<{ totalDistance: number, totalTime: number } | null>(null);
  const [mapMode, setMapMode] = useState<'standard' | 'satellite' | 'traffic'>('standard');
  const [isFocused, setIsFocused] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Initialize with a default ID if available or empty
  useEffect(() => {
    // Optionally load a default shipment for demo
    handleSearch('TRK-885210');
  }, []);

  const handleSearch = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setTrackingId(id);
    setRouteMetrics(null); // Reset metrics on new search

    try {
      // Try to load from Firestore first
      const { firebaseService } = await import('../services/firebaseService');
      const allShipments = await firebaseService.queryDocuments<Shipment>('shipments', []);
      const data = allShipments.find(s => s.trackingId === id || s.id === id);

      if (data) {
        setShipment(data);
        // Fetch rider details if assigned
        if (data.riderId) {
          try {
            const riderData = await firebaseService.getDocument<User>('users', data.riderId);
            setRider(riderData);
          } catch (e) {
            console.error('Failed to fetch rider:', e);
            // Try mock rider
            const mockUsers = await mockDataService.getUsers();
            setRider(mockUsers.find(u => u.id === data.riderId) || null);
          }
        } else {
          setRider(null);
        }
      } else {
        setShipment(null);
        setRider(null);
        setError('Shipment not found. Please check the ID.');
      }
    } catch (err) {
      console.error('Firestore error, trying mock data:', err);
      // Fallback to mock data
      try {
        const data = await mockDataService.getShipmentById(id);
        if (data) {
          setShipment(data);
          if (data.riderId) {
            const mockUsers = await mockDataService.getUsers();
            setRider(mockUsers.find(u => u.id === data.riderId) || null);
          } else {
            setRider(null);
          }
        } else {
          setShipment(null);
          setRider(null);
          setError('Shipment not found. Please check the ID.');
        }
      } catch (mockErr) {
        setError('Error fetching shipment details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = shipment
    ? STATUS_STEPS.findIndex(s => s.key === shipment.currentStatus)
    : -1;

  const activeCoords = shipment?.events[shipment.events.length - 1]?.coordinates || { lat: 40.7128, lng: -74.0060 };

  // Custom Icons
  const pickupIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-4 h-4 bg-white border-4 border-indigo-600 rounded-full shadow-md"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const dropoffIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  const currentIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div class="relative">
             <div class="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-md z-10 relative"></div>
             <div class="absolute top-0 left-0 w-4 h-4 bg-indigo-600 rounded-full animate-ping opacity-75"></div>
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  // Check if current user has permission to update status
  const canUpdateStatus = currentUser && ['RIDER', 'HUB_MANAGER', 'HUB_STAFF'].includes(currentUser.role);
  const isAdmin = currentUser?.role === 'ADMIN';

  const handleSimulateProgress = async () => {
    if (!shipment) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STATUS_STEPS.length) {
      const nextStatus = STATUS_STEPS[nextIndex].key;
      await mockDataService.updateShipmentStatus(shipment.id, nextStatus);
      // Refresh data
      handleSearch(shipment.id);
    }
  };

  const handleReset = async () => {
    if (!shipment) return;
    // Reset to PLACED
    await mockDataService.updateShipmentStatus(shipment.id, ShipmentStatus.PLACED);
    handleSearch(shipment.id);
  };

  // Determine route start and end points based on status
  const getRoutePoints = () => {
    if (!shipment || !shipment.pickupAddress.coordinates || !shipment.dropoffAddress.coordinates) return null;

    const pickup = shipment.pickupAddress.coordinates;
    const dropoff = shipment.dropoffAddress.coordinates;
    const current = activeCoords;

    // If waiting for pickup or pickup assigned, show route from Current (Driver) to Pickup
    if (shipment.currentStatus === ShipmentStatus.PLACED || shipment.currentStatus === ShipmentStatus.PICKUP_ASSIGNED) {
      return {
        start: [current.lat, current.lng] as [number, number],
        end: [pickup.lat, pickup.lng] as [number, number],
        label: 'To Pickup'
      };
    }

    // If picked up or in transit, show route from Current (Package) to Dropoff
    if ([ShipmentStatus.PICKED, ShipmentStatus.IN_TRANSIT, ShipmentStatus.HUB1_ARRIVAL, ShipmentStatus.HUB2_ARRIVAL, ShipmentStatus.OUT_FOR_DELIVERY].includes(shipment.currentStatus)) {
      return {
        start: [current.lat, current.lng] as [number, number],
        end: [dropoff.lat, dropoff.lng] as [number, number],
        label: 'To Destination'
      };
    }

    // If delivered, show full original route
    return {
      start: [pickup.lat, pickup.lng] as [number, number],
      end: [dropoff.lat, dropoff.lng] as [number, number],
      label: 'Completed Route'
    };
  };

  const routePoints = getRoutePoints();

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-1 gap-8 pb-12 relative-7xl ">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 overflow-hidden transition-all duration-300">

        {/* Header */}
        <div className="p-6 border-b border-white/40 bg-gradient-to-r from-white/40 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Truck className="text-indigo-600" />
              Live Tracking
            </h2>
            <p className="text-slate-500 text-sm mt-1">Real-time delivery updates & location</p>
          </div>
          <div className="flex items-center space-x-2 bg-white/60 border border-white/60 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <span className="text-slate-400 font-mono text-sm">ID:</span>
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(trackingId)}
              placeholder="Enter Tracking ID"
              className="bg-transparent outline-none font-mono font-medium text-slate-700 w-32 md:w-40"
            />
            <button onClick={() => handleSearch(trackingId)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-lg">
              <Search size={18} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-10 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading shipment details...
          </div>
        )}

        {error && !loading && (
          <div className="p-10 text-center text-red-500 bg-red-50 m-6 rounded-xl border border-red-100">
            <AlertCircle size={32} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !shipment && (
          <div className="p-10 text-center text-slate-400">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p>Enter a tracking ID to view status.</p>
            <p className="text-xs mt-2">Try: TRK-885210</p>
          </div>
        )}

        {shipment && shipment.currentStatus === ShipmentStatus.DELIVERED && !loading && (
          <div className="p-12 text-center bg-emerald-50/50 m-6 rounded-3xl border border-emerald-100 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-lg shadow-emerald-200">
              <Check size={48} strokeWidth={3} />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-3">Shipment Delivered</h3>
            <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
              This package has successfully reached its destination. Live tracking is no longer active for this shipment.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-emerald-100">
              <Clock size={18} className="text-emerald-500" />
              <div className="text-left">
                <p className="text-xs text-slate-400 uppercase font-bold">Delivered On</p>
                <p className="font-mono font-medium text-slate-700">
                  {shipment.events.find(e => e.status === ShipmentStatus.DELIVERED)?.timestamp || 'Recently'}
                </p>
              </div>
            </div>
          </div>
        )}

        {shipment && shipment.currentStatus !== ShipmentStatus.DELIVERED && !loading && (
          <div className={`grid grid-cols-1 ${isFocused ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} transition-all duration-500`}>

            {/* LEFT COLUMN: Timeline */}
            {!isFocused && (
              <div className="p-6 md:p-8 overflow-y-auto max-h-[800px] border-r border-white/50 animate-in slide-in-from-left-5 duration-300">
                {/* Status Banner */}
                <div className="bg-indigo-50/60 backdrop-blur-sm border border-indigo-100 rounded-2xl p-6 flex flex-col justify-between items-start mb-8 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Package size={100} />
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${shipment.currentStatus === ShipmentStatus.DELIVERED ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    <p className="text-indigo-900 font-bold text-xs uppercase tracking-wider">Status Update</p>
                  </div>
                  <h3 className="text-3xl font-bold text-indigo-800 tracking-tight mb-1">{STATUS_STEPS.find(s => s.key === shipment.currentStatus)?.label}</h3>
                  <p className="text-slate-600 text-sm">Estimated Delivery: <span className="font-bold text-slate-800">{shipment.estimatedDelivery}</span></p>
                </div>

                {/* Rider Details Card */}
                {rider && (
                  <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-in slide-in-from-left-6 duration-500 delay-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                        {rider.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-0.5">Assigned Rider</p>
                        <h4 className="font-bold text-slate-800">{rider.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            Active
                          </span>
                          {/* Placeholder for vehicle info if we had it linked directly */}
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Truck size={12} />
                            Courier
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vertical Timeline */}
                <div className="relative pl-4 md:pl-6 space-y-0">
                  {/* The connector line */}
                  <div className="absolute left-[27px] md:left-[35px] top-3 bottom-10 w-0.5 bg-slate-200/80" />

                  {STATUS_STEPS.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;
                    const isPending = index > currentStepIndex;

                    const event = shipment.events.find(e => e.status === step.key);

                    return (
                      <div key={step.key} className="relative flex items-start pb-8 last:pb-0 group">
                        {/* Icon Circle */}
                        <div
                          className={`
                          relative z-10 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-4 transition-all duration-300 shadow-sm
                          ${isCompleted ? 'bg-emerald-500 border-white text-white shadow-emerald-100' : ''}
                          ${isActive ? 'bg-indigo-600 border-white ring-4 ring-indigo-100/50 text-white scale-110 shadow-indigo-200' : ''}
                          ${isPending ? 'bg-slate-100 border-white text-slate-300' : ''}
                        `}
                        >
                          <step.icon size={16} strokeWidth={2.5} />
                        </div>

                        {/* Content */}
                        <div className="ml-5 pt-1 flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start md:items-center gap-1">
                            <h4 className={`text-base font-semibold transition-colors ${isActive ? 'text-indigo-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                              {step.label}
                            </h4>

                            <div className="flex items-center gap-2">
                              {event?.timestamp && (
                                <span className="text-[10px] font-mono font-medium text-slate-500 bg-white/60 border border-white/40 px-1.5 py-0.5 rounded-md">
                                  {event.timestamp}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs">
                            {isActive ? "Currently processing at this stage." : event?.description || (isCompleted ? "Completed" : "")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RIGHT COLUMN: Leaflet Map */}
            <div className={`bg-slate-100 relative ${isFocused ? 'h-[800px]' : 'min-h-[400px] lg:min-h-full'} border-t lg:border-t-0 lg:border-l border-white/50 z-0 transition-all duration-500`}>
              {activeCoords ? (
                <MapContainer
                  center={[activeCoords.lat, activeCoords.lng]}
                  zoom={13}
                  className="w-full h-full"
                  zoomControl={false}
                >
                  {mapMode === 'standard' && (
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  )}
                  {mapMode === 'satellite' && (
                    <TileLayer
                      attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  )}
                  {mapMode === 'traffic' && (
                    <>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <TileLayer
                        attribution='Map data &copy; Google'
                        url="https://mt0.google.com/vt?lyrs=m,traffic&x={x}&y={y}&z={z}"
                      />
                    </>
                  )}
                  <MapUpdater center={[activeCoords.lat, activeCoords.lng]} />

                  {/* Pickup Marker */}
                  {shipment.pickupAddress.coordinates && (
                    <Marker position={[shipment.pickupAddress.coordinates.lat, shipment.pickupAddress.coordinates.lng]} icon={pickupIcon}>
                      <Popup>Pickup: {shipment.pickupAddress.street}</Popup>
                    </Marker>
                  )}

                  {/* Dropoff Marker */}
                  {shipment.dropoffAddress.coordinates && (
                    <Marker position={[shipment.dropoffAddress.coordinates.lat, shipment.dropoffAddress.coordinates.lng]} icon={dropoffIcon}>
                      <Popup autoClose={false} closeOnClick={false} autoPan={false}>
                        <div className="text-center">
                          <p className="font-bold text-slate-800">Dropoff</p>
                          <p className="text-xs text-slate-500">{shipment.dropoffAddress.street}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Current Location Marker */}
                  <Marker position={[activeCoords.lat, activeCoords.lng]} icon={currentIcon}>
                    <Popup>Current Location</Popup>
                  </Marker>

                  {/* Dynamic Route Line */}
                  {routePoints && (
                    <RoutingControl
                      pickup={routePoints.start}
                      dropoff={routePoints.end}
                      showAlternatives={showAlternatives}
                      onRouteFound={setRouteMetrics}
                    />
                  )}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 bg-slate-200/50">
                  <div className="text-center">
                    <MapIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Map data unavailable</p>
                  </div>
                </div>
              )}

              {/* Overlay Info Card on Map */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/60 animate-in slide-in-from-bottom-10 fade-in duration-500 z-[1000]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      {routePoints ? routePoints.label : 'Current Location'}
                    </p>
                    <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <MapPin size={18} className="text-indigo-600" />
                      {STATUS_STEPS.find(s => s.key === shipment.currentStatus)?.label.includes('Hub') ? 'Logistics Facility' : 'On Route'}
                    </p>

                    {/* Route Metrics */}
                    {routeMetrics && (
                      <div className="flex items-center gap-3 mt-1 text-sm font-medium text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock size={14} className="text-emerald-500" />
                          {Math.round(routeMetrics.totalTime / 60)} min
                        </span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="flex items-center gap-1">
                          <Navigation size={14} className="text-blue-500" />
                          {(routeMetrics.totalDistance / 1609.34).toFixed(1)} miles
                        </span>
                      </div>
                    )}

                    {!routeMetrics && (
                      <p className="text-xs text-slate-500">Lat: {activeCoords?.lat}, Lng: {activeCoords?.lng}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className={`p-2 rounded-lg shadow-md transition-all ${showAlternatives ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
                    title="Find Efficient Route (Show Alternatives)"
                  >
                    <Navigation size={20} className={showAlternatives ? "animate-pulse" : ""} />
                  </button>
                </div>
              </div>

              {/* Full Screen Toggle */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
                {/* Map Mode Controls */}
                <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-lg shadow-md border border-white/60 flex flex-col gap-1">
                  <button
                    onClick={() => setMapMode('standard')}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 ${mapMode === 'standard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Standard View"
                  >
                    <MapIcon size={18} />
                    {isFocused && <span className="text-xs font-medium">Map</span>}
                  </button>
                  <button
                    onClick={() => setMapMode('satellite')}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 ${mapMode === 'satellite' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Satellite View"
                  >
                    <Globe size={18} />
                    {isFocused && <span className="text-xs font-medium">Sat</span>}
                  </button>
                  <button
                    onClick={() => setMapMode('traffic')}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 ${mapMode === 'traffic' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Traffic View"
                  >
                    <Activity size={18} />
                    {isFocused && <span className="text-xs font-medium">Traffic</span>}
                  </button>
                </div>

                {/* Driver Tools */}
                {(canUpdateStatus || isAdmin) && (
                  <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-lg shadow-md border border-white/60">
                    <button
                      onClick={() => setShowAlternatives(!showAlternatives)}
                      className={`p-2 rounded-md transition-all w-full flex items-center justify-center ${showAlternatives ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                      title="Show Alternative Routes"
                    >
                      <Split size={18} className={showAlternatives ? "" : "rotate-90"} />
                    </button>
                  </div>
                )}

                {/* Focus Toggle */}
                <button
                  onClick={() => setIsFocused(!isFocused)}
                  className={`bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-md text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors border border-white/60`}
                  title={isFocused ? "Exit Focus Mode" : "Focus Mode"}
                >
                  {isFocused ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Controls Footer - RESTRICTED ACCESS */}
        {shipment && shipment.currentStatus !== ShipmentStatus.DELIVERED && (
          <div className="bg-slate-50/50 backdrop-blur-sm p-4 border-t border-white/50 flex justify-between items-center">
            <p className="text-xs text-slate-400 hidden sm:block">Last updated: Just now</p>

            <div className="flex gap-3 ml-auto">
              {canUpdateStatus ? (
                <>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all border border-transparent hover:border-slate-200 text-sm"
                  >
                    Reset Status
                  </button>
                  <button
                    onClick={handleSimulateProgress}
                    disabled={currentStepIndex >= STATUS_STEPS.length - 1}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 text-sm transform active:scale-95"
                  >
                    Update Status
                    <Clock size={16} />
                  </button>
                </>
              ) : (
                <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border ${isAdmin ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {isAdmin ? (
                    <>
                      <Eye size={16} />
                      <span className="font-semibold">Admin View - Live Monitoring</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Read-only View</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
