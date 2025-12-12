import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { User, Shipment } from '../types';
import { Bike, Search, Plus, Edit2, Trash2, X, Mail, Phone, Loader2, Download, Package, Star, TrendingUp, CheckCircle } from 'lucide-react';

export const RidersView: React.FC = () => {
    const [riders, setRiders] = useState<User[]>([]);
    const [filteredRiders, setFilteredRiders] = useState<User[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRider, setSelectedRider] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        vehicle: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
    });

    // Real-time Firebase listener for riders
    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'RIDER'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ridersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setRiders(ridersData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching riders:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch shipments for statistics
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'shipments'), (snapshot) => {
            const shipmentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Shipment[];
            setShipments(shipmentsData);
        });

        return () => unsubscribe();
    }, []);

    // Filter riders
    useEffect(() => {
        let filtered = riders;

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(rider =>
                rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rider.phone?.includes(searchQuery)
            );
        }

        // Apply status filter
        if (selectedStatus !== 'ALL') {
            filtered = filtered.filter(rider =>
                selectedStatus === 'ACTIVE' ? rider.status !== 'INACTIVE' : rider.status === 'INACTIVE'
            );
        }

        setFilteredRiders(filtered);
    }, [riders, searchQuery, selectedStatus]);

    // Get rider statistics
    const getRiderStats = (riderId: string) => {
        const riderShipments = shipments.filter(s => s.riderId === riderId);
        const totalDeliveries = riderShipments.filter(s => s.status === 'DELIVERED').length;
        const inProgress = riderShipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'PICKUP_ASSIGNED').length;
        const successRate = riderShipments.length > 0
            ? ((totalDeliveries / riderShipments.length) * 100).toFixed(1)
            : '0';

        return { totalDeliveries, inProgress, successRate };
    };

    // Add rider
    const handleAddRider = async () => {
        try {
            await addDoc(collection(db, 'users'), {
                ...formData,
                role: 'RIDER',
                createdAt: new Date().toISOString()
            });
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error adding rider:', error);
            alert('Failed to add rider');
        }
    };

    // Update rider
    const handleUpdateRider = async () => {
        if (!selectedRider) return;
        try {
            await updateDoc(doc(db, 'users', selectedRider.id), {
                ...formData,
                updatedAt: new Date().toISOString()
            });
            setShowEditModal(false);
            setSelectedRider(null);
            resetForm();
        } catch (error) {
            console.error('Error updating rider:', error);
            alert('Failed to update rider');
        }
    };

    // Delete rider
    const handleDeleteRider = async (riderId: string) => {
        if (!confirm('Are you sure you want to delete this rider?')) return;
        try {
            await deleteDoc(doc(db, 'users', riderId));
        } catch (error) {
            console.error('Error deleting rider:', error);
            alert('Failed to delete rider');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            vehicle: '',
            status: 'ACTIVE'
        });
    };

    const openEditModal = (rider: User) => {
        setSelectedRider(rider);
        setFormData({
            name: rider.name,
            email: rider.email,
            phone: rider.phone || '',
            vehicle: (rider as any).vehicle || '',
            status: (rider.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
        });
        setShowEditModal(true);
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Vehicle', 'Total Deliveries', 'In Progress', 'Success Rate', 'Status'];
        const rows = filteredRiders.map(rider => {
            const stats = getRiderStats(rider.id);
            return [
                rider.name,
                rider.email,
                rider.phone || '',
                (rider as any).vehicle || 'N/A',
                stats.totalDeliveries,
                stats.inProgress,
                `${stats.successRate}%`,
                rider.status || 'ACTIVE'
            ];
        });

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'riders.csv';
        a.click();
    };

    const getStatusBadgeColor = (status?: string) => {
        return status === 'INACTIVE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
    };

    // Calculate metrics
    const totalRiders = riders.length;
    const activeRiders = riders.filter(r => r.status !== 'INACTIVE').length;
    const totalDeliveries = shipments.filter(s => s.status === 'DELIVERED').length;
    const avgDeliveriesPerRider = totalRiders > 0 ? (totalDeliveries / totalRiders).toFixed(1) : '0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Bike className="text-blue-600" size={32} />
                        Riders
                    </h1>
                    <p className="text-slate-500 mt-1">Manage riders and track performance</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Rider
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Riders</p>
                            <p className="text-3xl font-bold mt-1">{totalRiders}</p>
                        </div>
                        <Bike size={32} className="opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Active Riders</p>
                            <p className="text-3xl font-bold mt-1">{activeRiders}</p>
                        </div>
                        <TrendingUp size={32} className="opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Total Deliveries</p>
                            <p className="text-3xl font-bold mt-1">{totalDeliveries}</p>
                        </div>
                        <CheckCircle size={32} className="opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Avg Deliveries/Rider</p>
                            <p className="text-3xl font-bold mt-1">{avgDeliveriesPerRider}</p>
                        </div>
                        <Star size={32} className="opacity-80" />
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <Download size={20} />
                        Export
                    </button>
                </div>
            </div>

            {/* Riders Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deliveries</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">In Progress</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Success Rate</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredRiders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                                            No riders found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRiders.map((rider) => {
                                        const stats = getRiderStats(rider.id);
                                        return (
                                            <tr key={rider.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-slate-800">{rider.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Mail size={16} />
                                                        {rider.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Phone size={16} />
                                                        {rider.phone || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Bike size={16} className="text-blue-600" />
                                                        <span className="text-slate-800">{(rider as any).vehicle || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Package size={16} className="text-green-600" />
                                                        <span className="font-medium text-slate-800">{stats.totalDeliveries}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                        {stats.inProgress}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Star size={16} className="text-yellow-500" />
                                                        <span className="font-medium text-slate-800">{stats.successRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(rider.status)}`}>
                                                        {rider.status || 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(rider)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRider(rider.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Rider Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Add New Rider</h2>
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                                <input
                                    type="text"
                                    value={formData.vehicle}
                                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                    placeholder="e.g., Bike, Scooter, Van"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowAddModal(false); resetForm(); }}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRider}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add Rider
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Rider Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Edit Rider</h2>
                            <button onClick={() => { setShowEditModal(false); setSelectedRider(null); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                                <input
                                    type="text"
                                    value={formData.vehicle}
                                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                    placeholder="e.g., Bike, Scooter, Van"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedRider(null); resetForm(); }}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateRider}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RidersView;
