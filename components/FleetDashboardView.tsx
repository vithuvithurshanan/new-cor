import React, { useState, useEffect } from 'react';
import { RiderView } from './RiderView';
import { TrackingView } from './TrackingView';
import { User, Vehicle, FleetStats, PackageAssignment, Shipment, RiderTask } from '../types';
import { mockDataService } from '../services/mockDataService';
import { LayoutDashboard, Map, Bike, Users, Activity, CheckCircle, Package, MapPin, DollarSign, TrendingUp } from 'lucide-react';

interface FleetDashboardViewProps {
    currentUser?: User;
}

type FleetTab = 'OVERVIEW' | 'RIDER_APP' | 'TRACKING' | 'RIDERS';

export const FleetDashboardView: React.FC<FleetDashboardViewProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<FleetTab>('OVERVIEW');

    // Data states
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
    const [packages, setPackages] = useState<PackageAssignment[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [riders, setRiders] = useState<User[]>([]);
    const [tasks, setTasks] = useState<RiderTask[]>([]);

    useEffect(() => {
        const loadData = async () => {
            // Load all fleet data
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

            // Load package assignments (mock data for now)
            const packageList: PackageAssignment[] = [];
            setPackages(packageList);
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
        <div className="space-y-6 animate-fade-in">
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
                                <tr key={rider.id} className="hover:bg-slate-50/50 transition-colors">
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
