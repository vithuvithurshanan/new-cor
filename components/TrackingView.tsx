import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, User } from '../types';
import { mockDataService } from '../services/mockDataService';
import { Check, Truck, Package, MapPin, Clock, Home, AlertCircle, Map as MapIcon, Maximize2, Navigation, Lock, Eye, Search } from 'lucide-react';

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

export const TrackingView: React.FC<TrackingViewProps> = ({ currentUser }) => {
  const [trackingId, setTrackingId] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      const data = await mockDataService.getShipmentById(id);
      if (data) {
        setShipment(data);
      } else {
        setShipment(null);
        setError('Shipment not found. Please check the ID.');
      }
    } catch (err) {
      setError('Error fetching shipment details.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = shipment
    ? STATUS_STEPS.findIndex(s => s.key === shipment.currentStatus)
    : -1;

  const activeCoords = shipment?.events[shipment.events.length - 1]?.coordinates || { lat: 40.7128, lng: -74.0060 };

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

  return (
    <div className="max-w-6xl mx-auto pb-10">
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
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* LEFT COLUMN: Timeline */}
            <div className="p-6 md:p-8 overflow-y-auto max-h-[800px] border-r border-white/50">
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

            {/* RIGHT COLUMN: Google Map */}
            <div className="bg-slate-100 relative min-h-[400px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-white/50">
              {activeCoords ? (
                <iframe
                  width="100%"
                  height="100%"
                  className="absolute inset-0 w-full h-full opacity-90 hover:opacity-100 transition-opacity"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${activeCoords.lat},${activeCoords.lng}&z=14&output=embed`}
                  title="Live Tracking Map"
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 bg-slate-200/50">
                  <div className="text-center">
                    <MapIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Map data unavailable</p>
                  </div>
                </div>
              )}

              {/* Overlay Info Card on Map */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/60 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Current Location</p>
                    <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <MapPin size={18} className="text-indigo-600" />
                      {STATUS_STEPS.find(s => s.key === shipment.currentStatus)?.label.includes('Hub') ? 'Logistics Facility' : 'On Route'}
                    </p>
                    <p className="text-xs text-slate-500">Lat: {activeCoords?.lat}, Lng: {activeCoords?.lng}</p>
                  </div>
                  <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-md shadow-indigo-200">
                    <Navigation size={20} />
                  </div>
                </div>
              </div>

              {/* Full Screen Toggle (Visual only for demo) */}
              <button className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow-md text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors">
                <Maximize2 size={20} />
              </button>
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
