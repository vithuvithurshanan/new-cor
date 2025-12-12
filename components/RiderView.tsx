import React, { useState, useEffect } from 'react';
import { RiderTask, RiderTaskStatus, RiderEarnings, User, PackageAssignment, Shipment, ShipmentStatus } from '../types';
import { mockDataService } from '../services/mockDataService';
import { MapPin, Navigation, Package, Camera, CheckCircle, XCircle, DollarSign, Calendar, ChevronRight, Upload, Truck, User as UserIcon, Lock, QrCode, Scan } from 'lucide-react';
import { RiderMap } from './RiderMap';
import { RiderHistoryList } from './RiderHistoryList';

interface RiderViewProps {
  currentUser: User | null;
}

const MOCK_EARNINGS: RiderEarnings = {
  today: 45.50,
  thisWeek: 320.00,
  thisMonth: 1450.00,
  completedTrips: 12
};

export const RiderView: React.FC<RiderViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'TASKS' | 'PACKAGES' | 'EARNINGS' | 'HISTORY'>('TASKS');
  const [tasks, setTasks] = useState<RiderTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<RiderTask | null>(null);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [podData, setPodData] = useState({ photoDesc: '', signature: '' });
  const [verifying, setVerifying] = useState(false);
  const [isFullMapOpen, setIsFullMapOpen] = useState(false);
  const [vehiclePosition, setVehiclePosition] = useState({ lat: 40.7489, lng: -73.9680 });

  // Package tracking state
  const [packages, setPackages] = useState<PackageAssignment[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageAssignment | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanCode, setScanCode] = useState('');

  // Check if current user is actually a RIDER
  const isRider = currentUser?.role === 'RIDER';

  useEffect(() => {
    let unsubscribe: () => void;

    const loadTasks = async () => {
      try {
        const { firebaseService } = await import('../services/firebaseService');

        // Use real-time subscription
        unsubscribe = firebaseService.subscribeToCollection<RiderTask>(
          'riderTasks',
          (data) => setTasks(data),
          currentUser?.id ? [{ field: 'riderId', operator: '==', value: currentUser.id }] : []
        );
      } catch (error) {
        console.error('Firestore error, using mock data:', error);
        const data = await mockDataService.getRiderTasks(currentUser?.id);
        setTasks(data);
      }
    };

    const loadPackages = async () => {
      if (currentUser?.id) {
        try {
          const { firebaseService } = await import('../services/firebaseService');
          const [packageData, shipmentData] = await Promise.all([
            firebaseService.queryDocuments<PackageAssignment>('packageAssignments', []),
            firebaseService.queryDocuments<Shipment>('shipments', [])
          ]);

          // Filter packages for current rider
          const riderPackages = packageData.filter(p => p.riderId === currentUser.id);
          setPackages(riderPackages);
          setShipments(shipmentData);
        } catch (error) {
          console.error('Firestore error, using mock data:', error);
          const packageData = await mockDataService.getPackageAssignments(currentUser.id);
          setPackages(packageData);
          const shipmentData = await mockDataService.getShipments();
          setShipments(shipmentData);
        }
      }
    };

    loadTasks();
    loadPackages();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Filter tasks for the list view
  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const activeTasks = tasks.filter(t => t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  const handleStatusUpdate = async (id: string, newStatus: RiderTaskStatus) => {
    // Prevent non-riders from updating logic, just in case
    if (!isRider) return;

    try {
      const { firebaseService } = await import('../services/firebaseService');
      await firebaseService.updateDocument('riderTasks', id, { status: newStatus });

      // Notify Customer
      const task = tasks.find(t => t.id === id);
      if (task && task.shipmentId) {
        const shipment = shipments.find(s => s.id === task.shipmentId);
        if (shipment) {
          let title = '';
          let message = '';

          if (newStatus === 'IN_PROGRESS') {
            title = 'Rider on the way';
            message = `Rider is heading to ${task.type === 'PICKUP' ? 'pickup' : 'deliver'} your package.`;
          } else if (newStatus === 'COMPLETED') {
            title = task.type === 'PICKUP' ? 'Package Picked Up' : 'Package Delivered';
            message = task.type === 'PICKUP' ? 'Your package has been picked up.' : 'Your package has been delivered.';
          }

          if (title) {
            await firebaseService.addNotification({
              userId: shipment.customerId,
              title,
              message,
              type: 'INFO',
              read: false,
              relatedId: shipment.id
            });
          }

          // Sync Shipment Status
          let newShipmentStatus: ShipmentStatus | undefined;

          if (task.type === 'PICKUP') {
            if (newStatus === 'COMPLETED') newShipmentStatus = 'PICKED' as ShipmentStatus; // Use string literal if enum import is tricky, or import ShipmentStatus
          } else if (task.type === 'DELIVERY') {
            if (newStatus === 'IN_PROGRESS') newShipmentStatus = 'OUT_FOR_DELIVERY' as ShipmentStatus;
            if (newStatus === 'COMPLETED') newShipmentStatus = 'DELIVERED' as ShipmentStatus;
          }

          if (newShipmentStatus) {
            await firebaseService.updateShipmentStatus(shipment.id, newShipmentStatus);
          }

          // SMART ASSIGNMENT LOGIC
          // If a rider completes a PICKUP, check for other shipments in the same area
          if (task.type === 'PICKUP' && newStatus === 'COMPLETED') {
            const assignedCount = await firebaseService.assignRouteShipments(currentUser.id, shipment.id);
            if (assignedCount > 0) {
              // We can't easily use toast here without context, but we can rely on the notification created by the service
              // or we could trigger a local state update to show a message
              console.log(`Smart Assignment: ${assignedCount} new shipments assigned.`);
            }
          }
        }
      }

      // No need to manually refresh tasks as we have a subscription
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Fallback to mock data
      await mockDataService.updateTaskStatus(id, newStatus);
      const updatedTasks = await mockDataService.getRiderTasks(currentUser?.id);
      setTasks(updatedTasks);

      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask || !isRider) return;

    // Simulate AI Verification of POD
    setVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Fake network delay
    setVerifying(false);

    await handleStatusUpdate(selectedTask.id, 'COMPLETED');
    setIsPodModalOpen(false);
    setSelectedTask(null);
    setPodData({ photoDesc: '', signature: '' });
  };

  return (
    <div className="max-w-5xl mx-auto bg-slate-100/50 backdrop-blur-xl min-h-[calc(100vh-2rem)] rounded-3xl overflow-hidden shadow-2xl border border-white/50 relative">

      {/* Mobile App Header */}
      <div className="bg-white/95 backdrop-blur-md text-slate-800 p-4 sticky top-0 z-20 shadow-md border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-mono border border-slate-200">
            ID: {currentUser?.id || 'GUEST'}
          </div>
          <div className="flex items-center gap-4 py-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-indigo-300">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="font-bold text-sm">{currentUser?.name || 'User'}</h2>
              {!isRider ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Lock size={12} />
                  Read Only View
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Online
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'TASKS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('PACKAGES')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'PACKAGES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Packages
          </button>
          <button
            onClick={() => setActiveTab('EARNINGS')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'EARNINGS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Earnings
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="pb-20">
        {activeTab === 'TASKS' ? (
          <div className="p-4 space-y-6">

            {!isRider && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                <Lock size={16} />
                <span className="font-medium">Admin View Mode: Task actions are disabled.</span>
              </div>
            )}

            {/* Active Task Section */}
            {activeTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Current Task</h3>
                {activeTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
              </div>
            )}

            {/* Pending Section */}
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">New Assignments</h3>
                {pendingTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
              </div>
            )}

            {/* Completed Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Completed Today</h3>
              {completedTasks.length > 0 ? (
                completedTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))
              ) : (
                <p className="text-sm text-slate-400 italic text-center py-4">No completed tasks yet.</p>
              )}
            </div>

          </div>
        ) : activeTab === 'PACKAGES' ? (
          <div className="p-4 space-y-6">
            {!isRider && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                <Lock size={16} />
                <span className="font-medium">Admin View Mode: Package actions are disabled.</span>
              </div>
            )}

            {/* Scan Package Button */}
            {isRider && (
              <button
                onClick={() => setIsScanModalOpen(true)}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
              >
                <Scan size={20} />
                Scan Package
              </button>
            )}

            {/* Assigned Packages */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">My Packages</h3>
              {packages.length > 0 ? (
                packages.map(pkg => {
                  const shipment = shipments.find(s => s.id === pkg.shipmentId);
                  return (
                    <PackageCard
                      key={pkg.id}
                      packageAssignment={pkg}
                      shipment={shipment}
                      onClick={() => setSelectedPackage(pkg)}
                    />
                  );
                })
              ) : (
                <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl border border-white/60 text-center">
                  <Package className="mx-auto text-slate-300 mb-3" size={48} />
                  <p className="text-slate-500 font-medium">No packages assigned</p>
                  <p className="text-sm text-slate-400 mt-1">Packages will appear here when assigned to you</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'HISTORY' ? (
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Completed Shipments</h3>
            <RiderHistoryList shipments={shipments.filter(s =>
              // Filter for shipments assigned to this rider and are completed/delivered
              (s.riderId === currentUser?.id || tasks.some(t => t.shipmentId === s.id && t.riderId === currentUser?.id)) &&
              (s.currentStatus === 'DELIVERED' || s.currentStatus === 'PICKED')
            )} />
          </div>
        ) : (
          <EarningsView stats={MOCK_EARNINGS} />
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="absolute inset-0 bg-white z-30 animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 flex items-center justify-between sticky top-0">
            <button onClick={() => setSelectedTask(null)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full">
              <ChevronRight className="rotate-180" size={24} />
            </button>
            <h3 className="font-bold text-slate-800">Task Details</h3>
            <div className="w-10"></div> {/* Spacer */}
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
            {/* Status Badge */}
            <div className="flex justify-center mb-6">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm
                ${selectedTask.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  selectedTask.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-indigo-100 text-indigo-700'}`}>
                {selectedTask.status.replace('_', ' ')}
              </span>
            </div>

            {/* Main Info */}
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="text-indigo-600 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-slate-800 text-lg">{selectedTask.address}</p>
                    <p className="text-slate-500 text-sm">{selectedTask.distance} away</p>
                  </div>
                </div>

                {selectedTask.startCoordinates && selectedTask.endCoordinates && (
                  <div className="h-64 w-full mb-4 rounded-xl overflow-hidden border border-slate-200">
                    <RiderMap
                      start={selectedTask.startCoordinates}
                      end={selectedTask.endCoordinates}
                      vehicleLocation={
                        selectedTask.status === 'IN_PROGRESS'
                          ? { lat: 40.7489, lng: -73.9680 } // Simulated moving vehicle
                          : undefined
                      }
                      showLocationOverlay={selectedTask.status === 'IN_PROGRESS'}
                      currentAddress={selectedTask.status === 'IN_PROGRESS' ? "5th Avenue & E 42nd St, New York" : undefined}
                      destinationAddress={selectedTask.address}
                      estimatedTime={selectedTask.status === 'IN_PROGRESS' ? "12 mins" : undefined}
                      distance={selectedTask.distance}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <UserIcon className="text-slate-400" size={18} />
                  <span className="text-slate-700 font-medium">{selectedTask.customerName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Time Slot</p>
                  <p className="font-medium text-slate-700">{selectedTask.timeSlot}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Earnings</p>
                  <p className="font-bold text-emerald-600">${selectedTask.earnings.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-bold mb-2">Package Details</p>
                <div className="flex items-center gap-3">
                  <Package className="text-slate-400" size={20} />
                  <span className="text-slate-700">{selectedTask.packageDetails}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-slate-200 bg-white/90 backdrop-blur-md">
            {isRider ? (
              <>
                {selectedTask.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedTask(null)} // Decline just closes for demo
                      className="flex-1 py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedTask.id, 'ACCEPTED')}
                      className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                    >
                      Accept Task
                    </button>
                  </div>
                )}

                {selectedTask.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedTask.id, 'IN_PROGRESS')}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <Navigation size={20} />
                    Start Trip
                  </button>
                )}

                {selectedTask.status === 'IN_PROGRESS' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setIsFullMapOpen(true)}
                      className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <Navigation size={20} />
                      Open Navigation
                    </button>
                    <button
                      onClick={() => setIsPodModalOpen(true)}
                      className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      {selectedTask.type === 'PICKUP' ? 'Confirm Pickup' : 'Complete Delivery'}
                    </button>
                  </div>
                )}

                {selectedTask.status === 'COMPLETED' && (
                  <div className="text-center text-slate-500 font-medium py-2">
                    Task Completed
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                  <Lock size={14} />
                  Admin Mode: Action buttons disabled
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proof of Delivery Modal */}
      {isPodModalOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Proof of Delivery</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer Signature</label>
                <div className="h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <p className="text-xs">Sign here</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Photo</label>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 bg-slate-100 rounded-lg text-slate-600 font-medium flex items-center justify-center gap-2">
                    <Camera size={18} />
                    Take Photo
                  </button>
                  <button className="flex-1 py-3 bg-slate-100 rounded-lg text-slate-600 font-medium flex items-center justify-center gap-2">
                    <Upload size={18} />
                    Upload
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Describe photo (simulated AI input)"
                  className="w-full mt-2 p-2 text-sm border border-slate-200 rounded-lg"
                  value={podData.photoDesc}
                  onChange={(e) => setPodData({ ...podData, photoDesc: e.target.value })}
                />
              </div>
            </div>

            <button
              onClick={handleCompleteTask}
              disabled={verifying}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-70"
            >
              {verifying ? 'AI Verifying Evidence...' : 'Submit & Complete'}
            </button>
            <button
              onClick={() => setIsPodModalOpen(false)}
              className="w-full mt-3 py-3 text-slate-500 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Package Scan Modal */}
      {isScanModalOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Scan Package</h3>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center">
                <QrCode size={120} className="text-slate-400 mb-4" />
                <p className="text-sm text-slate-500 text-center">Position QR code within frame</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Or Enter Tracking ID</label>
                <input
                  type="text"
                  placeholder="TRK-XXXXXX"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <button
              onClick={() => {
                // Simulate package scan
                if (scanCode) {
                  alert(`Package ${scanCode} scanned successfully!`);
                  setScanCode('');
                  setIsScanModalOpen(false);
                }
              }}
              disabled={!scanCode}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Scan
            </button>
            <button
              onClick={() => {
                setScanCode('');
                setIsScanModalOpen(false);
              }}
              className="w-full mt-3 py-3 text-slate-500 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Navigation Map */}
      {isFullMapOpen && selectedTask && selectedTask.startCoordinates && selectedTask.endCoordinates && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          {/* Map Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 shadow-lg flex items-center justify-between">
            <button
              onClick={() => setIsFullMapOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
            <div className="text-center flex-1">
              <h3 className="font-bold text-lg">Navigation</h3>
              <p className="text-xs text-indigo-100">{selectedTask.type === 'PICKUP' ? 'To Pickup' : 'To Delivery'}</p>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Full Screen Map */}
          <div className="flex-1 relative">
            <RiderMap
              start={selectedTask.startCoordinates}
              end={selectedTask.endCoordinates}
              vehicleLocation={vehiclePosition}
              showLocationOverlay={true}
              currentAddress="5th Avenue & E 42nd St, New York, NY"
              destinationAddress={selectedTask.address}
              estimatedTime="12 mins"
              distance={selectedTask.distance}
            />
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-white border-t border-slate-200 p-4 flex gap-3">
            <button className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl flex items-center justify-center gap-2">
              <MapPin size={18} />
              Recenter
            </button>
            <button
              onClick={() => {
                setIsFullMapOpen(false);
                setIsPodModalOpen(true);
              }}
              className="flex-[2] py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle size={18} />
              Arrived
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

interface TaskCardProps {
  task: RiderTask;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const isPending = task.status === 'PENDING';

  return (
    <div
      onClick={onClick}
      className={`
        bg-white/80 backdrop-blur-sm p-4 rounded-xl border mb-3 cursor-pointer shadow-sm transition-all active:scale-[0.98] hover:shadow-md
        ${isPending ? 'border-amber-200 border-l-4 border-l-amber-400' : 'border-white/60 border-l-4 border-l-indigo-500'}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
          ${task.type === 'PICKUP' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
        `}>
          {task.type}
        </span>
        <span className="font-bold text-slate-800">${task.earnings.toFixed(2)}</span>
      </div>

      <h4 className="font-semibold text-slate-800 mb-1">{task.address}</h4>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1"><Calendar size={12} /> {task.timeSlot}</span>
        <span>{task.distance}</span>
      </div>
    </div>
  );
};

const EarningsView = ({ stats }: { stats: RiderEarnings }) => (
  <div className="p-4 space-y-6">
    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
      <p className="text-indigo-200 text-sm font-medium mb-1">Total Earnings (Today)</p>
      <h2 className="text-4xl font-bold flex items-start">
        <span className="text-2xl mt-1">$</span>
        {stats.today.toFixed(2)}
      </h2>
      <div className="mt-4 flex gap-4 text-sm opacity-90">
        <div>
          <span className="block font-bold">{stats.completedTrips}</span>
          <span className="text-indigo-200 text-xs">Trips</span>
        </div>
        <div className="w-px bg-indigo-400/50"></div>
        <div>
          <span className="block font-bold">4.5h</span>
          <span className="text-indigo-200 text-xs">Online</span>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm">
        <div className="bg-emerald-100 w-8 h-8 rounded-full flex items-center justify-center text-emerald-600 mb-2">
          <DollarSign size={16} />
        </div>
        <p className="text-slate-500 text-xs font-medium">This Week</p>
        <p className="text-xl font-bold text-slate-800">${stats.thisWeek}</p>
      </div>
      <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm">
        <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 mb-2">
          <Calendar size={16} />
        </div>
        <p className="text-slate-500 text-xs font-medium">This Month</p>
        <p className="text-xl font-bold text-slate-800">${stats.thisMonth}</p>
      </div>
    </div>

    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-4 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-4 text-sm">Recent Activity</h3>
      {/* Simple List Simulation */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex justify-between items-center py-3 border-b last:border-0 border-slate-100/60">
          <div>
            <p className="text-sm font-medium text-slate-700">Delivery to Downtown</p>
            <p className="text-xs text-slate-400">Today, 10:30 AM</p>
          </div>
          <span className="text-sm font-bold text-emerald-600">+$12.50</span>
        </div>
      ))}
    </div>
  </div>
);

interface PackageCardProps {
  packageAssignment: PackageAssignment;
  shipment?: Shipment;
  onClick: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ packageAssignment, shipment, onClick }) => {
  const getStatusColor = (status: PackageAssignment['status']) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PICKED_UP': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'IN_TRANSIT': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/60 mb-3 cursor-pointer shadow-sm transition-all active:scale-[0.98] hover:shadow-md border-l-4 border-l-indigo-500"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Tracking ID</p>
          <p className="font-bold text-slate-800 font-mono text-sm">{packageAssignment.shipmentId}</p>
        </div>
        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(packageAssignment.status)}`}>
          {packageAssignment.status.replace('_', ' ')}
        </span>
      </div>

      {shipment && (
        <>
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="text-indigo-600 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="text-sm font-semibold text-slate-800">{shipment.recipientName}</p>
              <p className="text-xs text-slate-500">{shipment.destination}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              ETA: {packageAssignment.estimatedDelivery}
            </span>
            <span className="flex items-center gap-1">
              <Truck size={12} />
              Vehicle: {packageAssignment.vehicleId}
            </span>
          </div>
        </>
      )}
    </div>
  );
};