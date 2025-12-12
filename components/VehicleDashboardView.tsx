
import React, { useState, useEffect } from 'react';
import { User, Vehicle, FleetStats } from '../types';
import { apiService } from '../services/apiService';
import { mockDataService } from '../services/mockDataService';
import { useToast } from './ui/ToastContext';
import { Truck, Activity, CheckCircle, Wrench, Users, Package, Map as MapIcon } from 'lucide-react';

export const VehicleDashboardView: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
    const { showToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
    const [newVehicleForm, setNewVehicleForm] = useState({ plateNumber: '', type: 'VAN', capacity: '' });

    useEffect(() => {
        const loadData = async () => {
            try {
                const { firebaseService } = await import('../services/firebaseService');

                const [vehicleList, userList] = await Promise.all([
                    firebaseService.queryDocuments<Vehicle>('vehicles', []),
                    firebaseService.queryDocuments<User>('users', [])
                ]);

                // Check if data is empty (fresh install), if so, load mock data
                if (vehicleList.length === 0) {
                    console.log('Firestore empty, seeding with mock data...');
                    const mockVehicles = await mockDataService.getVehicles();
                    setVehicles(mockVehicles);

                    const mockStats = await mockDataService.getFleetStats();
                    setFleetStats(mockStats);
                } else {
                    setVehicles(vehicleList);

                    // Calculate fleet stats from real data
                    const fleetStatistics = {
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
                    setFleetStats(fleetStatistics);
                }

                setUsers(userList);
            } catch (error) {
                console.error('Firestore error, using mock data:', error);
                const vehicleList = await mockDataService.getVehicles();
                setVehicles(vehicleList);

                const fleetStatistics = await mockDataService.getFleetStats();
                setFleetStats(fleetStatistics);

                const userList = await mockDataService.getUsers();
                setUsers(userList);
            }
        };
        loadData();
    }, []);

    const handleAddVehicle = () => {
        setShowAddVehicleModal(true);
    };

    const saveNewVehicle = async () => {
        console.log('Creating new vehicle:', newVehicleForm);
        try {
            const { firebaseService } = await import('../services/firebaseService');

            const newVehicleData: Omit<Vehicle, 'id'> = {
                plateNumber: newVehicleForm.plateNumber,
                type: newVehicleForm.type as any,
                capacity: newVehicleForm.capacity,
                status: 'AVAILABLE',
                lastMaintenance: new Date().toLocaleDateString()
            };

            // Add to Firestore
            const docId = await firebaseService.addDocument('vehicles', newVehicleData);

            // Update local state
            const newVehicle: Vehicle = {
                id: docId,
                ...newVehicleData
            };

            setVehicles([...vehicles, newVehicle]);
            setShowAddVehicleModal(false);
            setNewVehicleForm({ plateNumber: '', type: 'VAN', capacity: '' });

            // Re-fetch or update stats based on the new vehicle
            // Assuming apiService.getFleetStats() would fetch the updated stats from the backend
            // or we can manually update if the backend doesn't provide a direct way to get updated stats
            // For this change, we'll simulate an update based on the new vehicle
            const stats = await apiService.getFleetStats();
            setFleetStats({
                ...stats,
                totalVehicles: stats.totalVehicles + 1,
                availableVehicles: stats.availableVehicles + 1
            });
            showToast('Vehicle added successfully!', 'success');
        } catch (error) {
            console.error('Failed to save vehicle to Firestore, falling back to local state:', error);

            // Fallback: Add to local state only (Demo mode)
            const newVehicle: Vehicle = {
                id: `TEMP-${Date.now()}`,
                plateNumber: newVehicleForm.plateNumber,
                type: newVehicleForm.type as any,
                capacity: newVehicleForm.capacity,
                status: 'AVAILABLE',
                lastMaintenance: new Date().toLocaleDateString()
            };

            setVehicles([...vehicles, newVehicle]);

            // Update stats locally
            if (fleetStats) {
                setFleetStats({
                    ...fleetStats,
                    totalVehicles: fleetStats.totalVehicles + 1,
                    availableVehicles: fleetStats.availableVehicles + 1
                });
            }

            setShowAddVehicleModal(false);
            setNewVehicleForm({ plateNumber: '', type: 'VAN', capacity: '' });

            showToast('Vehicle added (Demo Mode - Local Only)', 'warning');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Fleet Management</h2>
                    <p className="text-slate-500">Vehicle status, assignments, and maintenance tracking.</p>
                </div>
                <button
                    onClick={handleAddVehicle}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-md hover:bg-indigo-700"
                >
                    + Add Vehicle
                </button>
            </div>

            {/* Fleet Statistics */}
            {fleetStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Truck className="text-indigo-600" size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{fleetStats.totalVehicles}</p>
                        <p className="text-sm text-slate-500 mt-1">Total Vehicles</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Activity className="text-blue-600" size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Active</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{fleetStats.activeVehicles}</p>
                        <p className="text-sm text-slate-500 mt-1">In Use</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <CheckCircle className="text-emerald-600" size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Ready</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{fleetStats.availableVehicles}</p>
                        <p className="text-sm text-slate-500 mt-1">Available</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Wrench className="text-amber-600" size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Service</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{fleetStats.inMaintenance}</p>
                        <p className="text-sm text-slate-500 mt-1">Maintenance</p>
                    </div>
                </div>
            )}

            {/* Performance Metrics */}
            {fleetStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-2xl text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <MapIcon size={24} />
                            <h3 className="font-bold text-lg">Distance Traveled</h3>
                        </div>
                        <p className="text-4xl font-bold mb-2">{fleetStats.totalDistance.toFixed(1)} km</p>
                        <p className="text-indigo-200 text-sm">Today's total fleet distance</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 rounded-2xl text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity size={24} />
                            <h3 className="font-bold text-lg">Fuel Efficiency</h3>
                        </div>
                        <p className="text-4xl font-bold mb-2">{fleetStats.fuelEfficiency.toFixed(1)} km/L</p>
                        <p className="text-emerald-200 text-sm">Average across all vehicles</p>
                    </div>
                </div>
            )}

            {/* Vehicle List */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Vehicle Fleet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map(vehicle => {
                        const driver = users.find(u => u.id === vehicle.currentDriverId);

                        return (
                            <div key={vehicle.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        {vehicle.type === 'VAN' ? <Truck size={24} /> : <Truck size={24} />}
                                    </div>
                                    <span className={`px - 2 py - 1 rounded - md text - xs font - bold
                     ${vehicle.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                                            vehicle.status === 'IN_USE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                        }
`}>
                                        {vehicle.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1">{vehicle.plateNumber}</h3>
                                <p className="text-sm text-slate-500 mb-3 capitalize">{vehicle.type.toLowerCase()} • {vehicle.capacity}</p>

                                {driver && (
                                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400 font-medium mb-1">Current Driver</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {driver.name.charAt(0)}
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">{driver.name}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Wrench size={12} /> Last Service</span>
                                        <span>{vehicle.lastMaintenance}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Package size={12} /> Capacity</span>
                                        <span>{vehicle.capacity}</span>
                                    </div>
                                </div>

                                {vehicle.status === 'AVAILABLE' && (
                                    <button className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                                        Assign to Rider
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Vehicle Modal */}
            {showAddVehicleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in slide-in-from-bottom-4">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Add New Vehicle</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Plate Number</label>
                                <input
                                    type="text"
                                    value={newVehicleForm.plateNumber}
                                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, plateNumber: e.target.value })}
                                    placeholder="ABC-1234"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                                <select
                                    value={newVehicleForm.type}
                                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, type: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="VAN">Van</option>
                                    <option value="TRUCK">Truck</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                                <input
                                    type="text"
                                    value={newVehicleForm.capacity}
                                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, capacity: e.target.value })}
                                    placeholder="e.g., 500kg or 20 packages"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                <p className="text-xs text-amber-700">
                                    <strong>Note:</strong> Vehicle will be marked as AVAILABLE and ready for assignment.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddVehicleModal(false);
                                    setNewVehicleForm({ plateNumber: '', type: 'VAN', capacity: '' });
                                }}
                                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveNewVehicle}
                                disabled={!newVehicleForm.plateNumber || !newVehicleForm.capacity}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Vehicle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
