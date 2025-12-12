import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { User } from '../types';
import { Warehouse, Search, Plus, Edit2, Trash2, X, Mail, Phone, Loader2, Download, MapPin, Users, TrendingUp } from 'lucide-react';

export const HubManagersView: React.FC = () => {
    const [hubManagers, setHubManagers] = useState<User[]>([]);
    const [filteredHubManagers, setFilteredHubManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedManager, setSelectedManager] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        assignedHub: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
    });

    // Real-time Firebase listener for hub managers
    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'HUB_MANAGER'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const managersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setHubManagers(managersData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching hub managers:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter hub managers
    useEffect(() => {
        let filtered = hubManagers;

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(manager =>
                manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                manager.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                manager.phone?.includes(searchQuery)
            );
        }

        // Apply status filter
        if (selectedStatus !== 'ALL') {
            filtered = filtered.filter(manager =>
                selectedStatus === 'ACTIVE' ? manager.status !== 'INACTIVE' : manager.status === 'INACTIVE'
            );
        }

        setFilteredHubManagers(filtered);
    }, [hubManagers, searchQuery, selectedStatus]);

    // Add hub manager
    const handleAddManager = async () => {
        try {
            await addDoc(collection(db, 'users'), {
                ...formData,
                role: 'HUB_MANAGER',
                createdAt: new Date().toISOString()
            });
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error adding hub manager:', error);
            alert('Failed to add hub manager');
        }
    };

    // Update hub manager
    const handleUpdateManager = async () => {
        if (!selectedManager) return;
        try {
            await updateDoc(doc(db, 'users', selectedManager.id), {
                ...formData,
                updatedAt: new Date().toISOString()
            });
            setShowEditModal(false);
            setSelectedManager(null);
            resetForm();
        } catch (error) {
            console.error('Error updating hub manager:', error);
            alert('Failed to update hub manager');
        }
    };

    // Delete hub manager
    const handleDeleteManager = async (managerId: string) => {
        if (!confirm('Are you sure you want to delete this hub manager?')) return;
        try {
            await deleteDoc(doc(db, 'users', managerId));
        } catch (error) {
            console.error('Error deleting hub manager:', error);
            alert('Failed to delete hub manager');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            assignedHub: '',
            status: 'ACTIVE'
        });
    };

    const openEditModal = (manager: User) => {
        setSelectedManager(manager);
        setFormData({
            name: manager.name,
            email: manager.email,
            phone: manager.phone || '',
            assignedHub: (manager as any).assignedHub || '',
            status: (manager.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
        });
        setShowEditModal(true);
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Assigned Hub', 'Status'];
        const rows = filteredHubManagers.map(manager => [
            manager.name,
            manager.email,
            manager.phone || '',
            (manager as any).assignedHub || 'N/A',
            manager.status || 'ACTIVE'
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hub_managers.csv';
        a.click();
    };

    const getStatusBadgeColor = (status?: string) => {
        return status === 'INACTIVE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
    };

    // Calculate metrics
    const totalManagers = hubManagers.length;
    const activeManagers = hubManagers.filter(m => m.status !== 'INACTIVE').length;
    const assignedHubs = new Set(hubManagers.map(m => (m as any).assignedHub).filter(Boolean)).size;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Warehouse className="text-green-600" size={32} />
                        Hub Managers
                    </h1>
                    <p className="text-slate-500 mt-1">Manage hub managers and hub assignments</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Hub Manager
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Total Managers</p>
                            <p className="text-3xl font-bold mt-1">{totalManagers}</p>
                        </div>
                        <Users size={32} className="opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Active Managers</p>
                            <p className="text-3xl font-bold mt-1">{activeManagers}</p>
                        </div>
                        <TrendingUp size={32} className="opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Assigned Hubs</p>
                            <p className="text-3xl font-bold mt-1">{assignedHubs}</p>
                        </div>
                        <Warehouse size={32} className="opacity-80" />
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
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

            {/* Hub Managers Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-green-600" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Hub</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredHubManagers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            No hub managers found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHubManagers.map((manager) => (
                                        <tr key={manager.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-800">{manager.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Mail size={16} />
                                                    {manager.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone size={16} />
                                                    {manager.phone || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-green-600" />
                                                    <span className="text-slate-800">{(manager as any).assignedHub || 'Not Assigned'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(manager.status)}`}>
                                                    {manager.status || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(manager)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteManager(manager.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Hub Manager Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Add New Hub Manager</h2>
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
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Hub</label>
                                <input
                                    type="text"
                                    value={formData.assignedHub}
                                    onChange={(e) => setFormData({ ...formData, assignedHub: e.target.value })}
                                    placeholder="e.g., Hub A, Central Hub"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                onClick={handleAddManager}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Add Manager
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Hub Manager Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Edit Hub Manager</h2>
                            <button onClick={() => { setShowEditModal(false); setSelectedManager(null); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-lg">
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
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Hub</label>
                                <input
                                    type="text"
                                    value={formData.assignedHub}
                                    onChange={(e) => setFormData({ ...formData, assignedHub: e.target.value })}
                                    placeholder="e.g., Hub A, Central Hub"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedManager(null); resetForm(); }}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateManager}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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

export default HubManagersView;
