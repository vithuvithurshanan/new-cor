import React, { useState, useEffect } from 'react';
import { RiderView } from './RiderView';
import { RiderHistoryList } from './RiderHistoryList';
import { TrackingView } from './TrackingView';
import { User, Vehicle, FleetStats, PackageAssignment, Shipment, RiderTask } from '../types';
import { mockDataService } from '../services/mockDataService';
import { LayoutDashboard, Map, Bike, Users, Activity, CheckCircle, Package, MapPin, DollarSign, TrendingUp, X, Navigation, Phone, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

interface FleetDashboardViewProps {
    currentUser?: User;
    initialTab?: FleetTab;
}

type FleetTab = 'OVERVIEW' | 'RIDER_APP' | 'TRACKING' | 'RIDERS';

export const FleetDashboardView: React.FC<FleetDashboardViewProps> = ({ currentUser, initialTab = 'OVERVIEW' }) => {
    const [activeTab, setActiveTab] = useState<FleetTab>(initialTab);

    // Data states
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
    const [packages, setPackages] = useState<PackageAssignment[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [riders, setRiders] = useState<User[]>([]);
    const [tasks, setTasks] = useState<RiderTask[]>([]);

    // Modal State
    const [selectedRider, setSelectedRider] = useState<User | null>(null);
    const [showRiderModal, setShowRiderModal] = useState(false);

    const handleRiderClick = (rider: User) => {
        setSelectedRider(rider);
        setShowRiderModal(true);
    };


    useEffect(() => {
        const loadData = async () => {
            try {
                const { firebaseService } = await import('../services/firebaseService');

                // Load all fleet data from Firestore
                const [vehicleList, shipmentList, userList, taskList] = await Promise.all([
                    firebaseService.queryDocuments<Vehicle>('vehicles', []),
                    firebaseService.queryDocuments<Shipment>('shipments', []),
                    firebaseService.queryDocuments<User>('users', []),
                    firebaseService.queryDocuments<RiderTask>('riderTasks', [])
                ]);

                // Check if data is empty (fresh install), if so, load mock data
                if (vehicleList.length === 0 && shipmentList.length === 0) {
                    console.log('Firestore empty, seeding Fleet Dashboard with mock data...');
                    const mockVehicles = await mockDataService.getVehicles();
                    setVehicles(mockVehicles);

                    const mockShipments = await mockDataService.getShipments();
                    setShipments(mockShipments);

                    const mockTasks = await mockDataService.getRiderTasks();
                    setTasks(mockTasks);

                    const mockStats = await mockDataService.getFleetStats();
                    setFleetStats(mockStats);

                    const mockUsers = await mockDataService.getUsers();
                    const riderList = mockUsers.filter(u => u.role === 'RIDER');
                    setRiders(riderList);
                } else {
                    setVehicles(vehicleList);
                    setShipments(shipmentList);
                    setTasks(taskList);

                    const riderList = userList.filter(u => u.role === 'RIDER');
                    setRiders(riderList);

                    // Calculate fleet stats from real data
                    const stats = {
                        totalVehicles: vehicleList.length,
                        availableVehicles: vehicleList.filter(v => v.status === 'AVAILABLE').length,
                        inUseVehicles: vehicleList.filter(v => v.status === 'IN_USE').length,
                        maintenanceVehicles: vehicleList.filter(v => v.status === 'MAINTENANCE').length,
                        totalCapacity: vehicleList.reduce((sum, v) => sum + (parseInt(v.capacity) || 0), 0),
                        utilizationRate: vehicleList.length > 0
                            ? (vehicleList.filter(v => v.status === 'IN_USE').length / vehicleList.length) * 100
                            : 0,
                        // Default values for missing stats in real data calculation
                        activeVehicles: vehicleList.filter(v => v.status === 'IN_USE').length,
                        inMaintenance: vehicleList.filter(v => v.status === 'MAINTENANCE').length,
                        totalDistance: 124.5, // Mock value for now
                        fuelEfficiency: 8.2 // Mock value for now
                    };
                    setFleetStats(stats);
                }

                // Load package assignments (empty for now)
                const packageList: PackageAssignment[] = [];
                setPackages(packageList);
            } catch (error) {
                console.error('Firestore error, using mock data:', error);
                // Fallback to mock data
                const vehicleList = await mockDataService.getVehicles();
                setVehicles(vehicleList);

                const stats = await mockDataService.getFleetStats();
                setFleetStats(stats);

                const shipmentList = await mockDataService.getShipments();
                setShipments(shipmentList);

                const userList = await mockDataService.getUsers();
                const riderList = userList.filter(u => u.role === 'RIDER');
                setRiders(riderList);

                const taskList = await mockDataService.getRiderTasks();
                setTasks(taskList);

                const packageList: PackageAssignment[] = [];
                setPackages(packageList);
            }
        };
        loadData();
    }, []);

    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Fleet Overview</h2>
                <p className="text-slate-500">Real-time fleet operations and performance metrics.</p>
            </div>

            {/* Fleet Statistics */}
            {fleetStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Vehicles"
                        value={fleetStats.totalVehicles}
                        icon={Activity}
                        color="indigo"
                        subtitle="Fleet size"
                    />
                    <StatCard
                        title="Active Now"
                        value={fleetStats.activeVehicles}
                        icon={Activity}
                        color="blue"
                        subtitle="In use"
                    />
                    <StatCard
                        title="Total Riders"
                        value={riders.length}
                        icon={Users}
                        color="emerald"
                        subtitle="Active riders"
                    />
                    <StatCard
                        title="Active Tasks"
                        value={tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED').length}
                        icon={Package}
                        color="purple"
                        subtitle="In progress"
                    />
                </div>
            )}

            {/* Performance Metrics */}
            {fleetStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-2xl text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Map size={24} />
                            <h3 className="font-bold text-lg">Distance Traveled</h3>
                        </div>
                        <p className="text-4xl font-bold mb-2">{fleetStats.totalDistance.toFixed(1)} km</p>
                        <p className="text-indigo-200 text-sm">Today's total fleet distance</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 rounded-2xl text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp size={24} />
                            <h3 className="font-bold text-lg">Fuel Efficiency</h3>
                        </div>
                        <p className="text-4xl font-bold mb-2">{fleetStats.fuelEfficiency.toFixed(1)} km/L</p>
                        <p className="text-emerald-200 text-sm">Average across all vehicles</p>
                    </div>
                </div>
            )}

            {/* Active Deliveries Summary */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Active Deliveries</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="text-blue-600" size={20} />
                            <span className="text-sm font-medium text-slate-600">In Transit</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">
                            {shipments.filter(s => s.currentStatus === 'IN_TRANSIT').length}
                        </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Bike className="text-purple-600" size={20} />
                            <span className="text-sm font-medium text-slate-600">Out for Delivery</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">
                            {shipments.filter(s => s.currentStatus === 'OUT_FOR_DELIVERY').length}
                        </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="text-emerald-600" size={20} />
                            <span className="text-sm font-medium text-slate-600">Delivered Today</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">
                            {shipments.filter(s => s.currentStatus === 'DELIVERED').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Rider Status Overview */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Rider Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <Users className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Riders</p>
                            <p className="text-xl font-bold text-slate-800">{riders.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Activity className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Active Now</p>
                            <p className="text-xl font-bold text-slate-800">
                                {riders.filter(r => r.status === 'ACTIVE').length}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Package className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Active Tasks</p>
                            <p className="text-xl font-bold text-slate-800">
                                {tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED').length}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <CheckCircle className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Completed Today</p>
                            <p className="text-xl font-bold text-slate-800">
                                {tasks.filter(t => t.status === 'COMPLETED').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRiderApp = () => (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Rider Application</h2>
                <p className="text-slate-500">Embedded rider interface for task management.</p>
            </div>
            <RiderView currentUser={currentUser} />
        </div>
    );

    const renderTracking = () => (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Package Tracking</h2>
                <p className="text-slate-500">Monitor all packages across the fleet in real-time.</p>
            </div>
            <TrackingView currentUser={currentUser} />
        </div>
    );

    const renderRiders = () => (
        <div className="max-w-4xl  mx-auto grid grid-cols-1 lg:grid-cols-1 gap-8 pb-12 relative-7xl  animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Rider Management</h2>
                    <p className="text-slate-500">Monitor rider performance, tasks, and assignments.</p>
                </div>
            </div>

            {/* Rider Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Users className="text-indigo-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{riders.length}</p>
                    <p className="text-sm text-slate-500 mt-1">Total Riders</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Activity className="text-emerald-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Online</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">
                        {riders.filter(r => r.status === 'ACTIVE').length}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Active Riders</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="text-blue-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Tasks</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">
                        {tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED').length}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Active Tasks</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <CheckCircle className="text-purple-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Done</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">
                        {tasks.filter(t => t.status === 'COMPLETED').length}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Completed Today</p>
                </div>
            </div>

            {/* Rider List */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rider</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Active Tasks</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Completed</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vehicle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {riders.map(rider => {
                            const riderTasks = tasks.filter(t => t.id.includes(rider.id.slice(-2)));
                            const activeTasks = riderTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED');
                            const completedTasks = riderTasks.filter(t => t.status === 'COMPLETED');
                            const assignedVehicle = vehicles.find(v => v.currentDriverId === rider.id);

                            return (
                                <tr
                                    key={rider.id}
                                    onClick={() => handleRiderClick(rider)}
                                    className="hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-transparent hover:border-indigo-100"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                {rider.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{rider.name}</p>
                                                <p className="text-xs text-slate-500">{rider.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-xs font-medium w-fit
                                            ${rider.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}
                                        `}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${rider.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                            {rider.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-800 font-medium">{activeTasks.length}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-800 font-medium">{completedTasks.length}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {assignedVehicle ? (
                                            <span className="text-sm text-slate-600 font-mono">{assignedVehicle.plateNumber}</span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Not assigned</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'OVERVIEW': return renderOverview();
            case 'RIDER_APP': return renderRiderApp();
            case 'TRACKING': return renderTracking();
            case 'RIDERS': return renderRiders();
            default: return renderOverview();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            {/* Top Navigation for Fleet Dashboard */}
            <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-4">
                <TabButton
                    active={activeTab === 'OVERVIEW'}
                    onClick={() => setActiveTab('OVERVIEW')}
                    icon={LayoutDashboard}
                    label="Overview"
                />
                <TabButton
                    active={activeTab === 'RIDER_APP'}
                    onClick={() => setActiveTab('RIDER_APP')}
                    icon={Bike}
                    label="Rider App"
                />
                <TabButton
                    active={activeTab === 'TRACKING'}
                    onClick={() => setActiveTab('TRACKING')}
                    icon={Map}
                    label="Package Tracking"
                />
                <TabButton
                    active={activeTab === 'RIDERS'}
                    onClick={() => setActiveTab('RIDERS')}
                    icon={Users}
                    label="Riders"
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {renderContent()}
            </div>

            {/* Rider Detail Modal */}
            {showRiderModal && selectedRider && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-sm">
                                    {selectedRider.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedRider.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span className={`flex items-center gap-1.5 font-medium ${selectedRider.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            <span className={`w-2 h-2 rounded-full ${selectedRider.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                            {selectedRider.status}
                                        </span>
                                        <span>•</span>
                                        <span>{selectedRider.email}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowRiderModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Left Panel: Task Details */}
                            <div className="w-full lg:w-1/3 p-6 overflow-y-auto border-r border-slate-100 bg-white">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Current Activity</h4>

                                {(() => {
                                    const activeTask = tasks.find(t => t.id.includes(selectedRider.id.slice(-2)) && (t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED'));

                                    if (activeTask) {
                                        return (
                                            <div className="space-y-6">
                                                <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                                            <Package size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-indigo-900">Order #{activeTask.id.slice(0, 8)}</p>
                                                            <p className="text-xs text-indigo-700 font-medium">{activeTask.type} Task</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <MapPin size={16} className="text-indigo-400 mt-1" />
                                                            <div>
                                                                <p className="text-xs text-slate-500 uppercase font-bold">Destination</p>
                                                                <p className="text-sm text-slate-700 font-medium">{activeTask.address}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <Users size={16} className="text-indigo-400 mt-1" />
                                                            <div>
                                                                <p className="text-xs text-slate-500 uppercase font-bold">Customer</p>
                                                                <p className="text-sm text-slate-700 font-medium">{activeTask.customerName}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <Clock size={16} className="text-indigo-400 mt-1" />
                                                            <div>
                                                                <p className="text-xs text-slate-500 uppercase font-bold">Time Slot</p>
                                                                <p className="text-sm text-slate-700 font-medium">{activeTask.timeSlot}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h5 className="font-bold text-slate-800 mb-3">Assigned Vehicle</h5>
                                                    {(() => {
                                                        const vehicle = vehicles.find(v => v.currentDriverId === selectedRider.id);
                                                        if (vehicle) {
                                                            return (
                                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                        {vehicle.type === 'BIKE' ? <Bike size={20} className="text-slate-600" /> : <Activity size={20} className="text-slate-600" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-800">{vehicle.plateNumber}</p>
                                                                        <p className="text-xs text-slate-500 capitalize">{vehicle.type.toLowerCase()}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return <p className="text-sm text-slate-500 italic">No vehicle assigned.</p>;
                                                    })()}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                                                        <Phone size={16} /> Call Rider
                                                    </button>
                                                    <button className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                                                        Message
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <Bike size={48} className="mx-auto text-slate-300 mb-3" />
                                            <p className="text-slate-500 font-medium">No active tasks</p>
                                            <p className="text-xs text-slate-400">Rider is currently idle.</p>
                                        </div>
                                    );
                                })()}

                                {/* History Section */}
                                <div className="mt-8">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent History</h4>
                                    <RiderHistoryList shipments={shipments.filter(s =>
                                        (s.riderId === selectedRider.id || tasks.some(t => t.shipmentId === s.id && t.riderId === selectedRider.id)) &&
                                        (s.currentStatus === 'DELIVERED' || s.currentStatus === 'PICKED')
                                    ).slice(0, 5)} />
                                </div>
                            </div>

                            {/* Right Panel: Map */}
                            <div className="flex-1 bg-slate-100 relative">
                                {(() => {
                                    // Mock coordinates for demo if no real data
                                    const riderLat = 40.7128 + (Math.random() * 0.01 - 0.005);
                                    const riderLng = -74.0060 + (Math.random() * 0.01 - 0.005);

                                    return (
                                        <MapContainer
                                            center={[riderLat, riderLng]}
                                            zoom={14}
                                            className="w-full h-full"
                                            zoomControl={false}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />

                                            {/* Rider Marker */}
                                            <Marker position={[riderLat, riderLng]}>
                                                <Popup>
                                                    <div className="text-center">
                                                        <p className="font-bold">{selectedRider.name}</p>
                                                        <p className="text-xs text-slate-500">Current Location</p>
                                                    </div>
                                                </Popup>
                                            </Marker>

                                            {/* Task Marker if exists */}
                                            {(() => {
                                                const activeTask = tasks.find(t => t.id.includes(selectedRider.id.slice(-2)) && (t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED'));
                                                if (activeTask && activeTask.endCoordinates) {
                                                    return (
                                                        <Marker position={[activeTask.endCoordinates.lat, activeTask.endCoordinates.lng]}>
                                                            <Popup>
                                                                <div className="text-center">
                                                                    <p className="font-bold">Destination</p>
                                                                    <p className="text-xs text-slate-500">{activeTask.address}</p>
                                                                </div>
                                                            </Popup>
                                                        </Marker>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </MapContainer>
                                    );
                                })()}

                                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-lg shadow-lg border border-white/60 text-xs text-slate-500 z-[1000]">
                                    Live GPS Tracking Active
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-components
const TabButton = ({ active, onClick, icon: Icon, label }: {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${active
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-500 hover:bg-slate-100'
            }`}
    >
        <Icon size={18} />
        {label}
    </button>
);

const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    subtitle: string;
}) => {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-100 text-indigo-600',
        blue: 'bg-blue-100 text-blue-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
        purple: 'bg-purple-100 text-purple-600',
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Icon size={24} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase">{subtitle}</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{title}</p>
        </div>
    );
};
