import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { User, Shipment } from '../types';
import { Users, Search, Plus, Edit2, Trash2, X, Mail, Phone, Loader2, Download, Package, TrendingUp, DollarSign } from 'lucide-react';

export const CustomersView: React.FC = () => {
    const [customers, setCustomers] = useState<User[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<User[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
    });

    // Real-time Firebase listener for customers
    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'CUSTOMER'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const customersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setCustomers(customersData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching customers:', error);
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

    // Filter customers
    useEffect(() => {
        let filtered = customers;

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(customer =>
                customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.phone?.includes(searchQuery)
            );
        }

        // Apply status filter
        if (selectedStatus !== 'ALL') {
            filtered = filtered.filter(customer =>
                selectedStatus === 'ACTIVE' ? customer.status !== 'INACTIVE' : customer.status === 'INACTIVE'
            );
        }

        setFilteredCustomers(filtered);
    }, [customers, searchQuery, selectedStatus]);

    // Get customer statistics
    const getCustomerStats = (customerId: string) => {
        const customerShipments = shipments.filter(s => s.customerId === customerId);
        const totalOrders = customerShipments.length;
        const lastOrder = customerShipments.length > 0
            ? new Date(Math.max(...customerShipments.map(s => new Date(s.createdAt || '').getTime()))).toLocaleDateString()
            : 'Never';

        return { totalOrders, lastOrder };
    };

    // Add customer
    const handleAddCustomer = async () => {
        try {
            await addDoc(collection(db, 'users'), {
                ...formData,
                role: 'CUSTOMER',
                createdAt: new Date().toISOString()
            });
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('Failed to add customer');
        }
    };

    // Update customer
    const handleUpdateCustomer = async () => {
        if (!selectedCustomer) return;
        try {
            await updateDoc(doc(db, 'users', selectedCustomer.id), {
                ...formData,
                updatedAt: new Date().toISOString()
            });
            setShowEditModal(false);
            setSelectedCustomer(null);
            resetForm();
        } catch (error) {
            console.error('Error updating customer:', error);
            alert('Failed to update customer');
        }
    };

    // Delete customer
    const handleDeleteCustomer = async (customerId: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await deleteDoc(doc(db, 'users', customerId));
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Failed to delete customer');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            status: 'ACTIVE'
        });
    };

    const openEditModal = (customer: User) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email,
            phone: customer.phone || '',
            status: (customer.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
        });
        setShowEditModal(true);
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Total Orders', 'Last Order', 'Status'];
        const rows = filteredCustomers.map(customer => {
            const stats = getCustomerStats(customer.id);
            return [
                customer.name,
                customer.email,
                customer.phone || '',
                stats.totalOrders,
                stats.lastOrder,
                customer.status || 'ACTIVE'
            ];
        });

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customers.csv';
        a.click();
    };

    const getStatusBadgeColor = (status?: string) => {
        return status === 'INACTIVE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
    };

    // Calculate metrics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status !== 'INACTIVE').length;
    const totalOrders = shipments.length;
    const avgOrdersPerCustomer = totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(1) : '0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Users className="text-orange-600" size={32} />
                        Customers
                    </h1>
                    <p className="text-slate-500 mt-1">Manage customer accounts and track engagement</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Customer
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Total Customers</p>
                            <p className="text-3xl font-bold mt-1">{totalCustomers}</p>
                        </div>
                        <Users size={32} className="opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Active Customers</p>
                            <p className="text-3xl font-bold mt-1">{activeCustomers}</p>
                        </div>
                        <TrendingUp size={32} className="opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Orders</p>
                            <p className="text-3xl font-bold mt-1">{totalOrders}</p>
                        </div>
                        <Package size={32} className="opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Avg Orders/Customer</p>
                            <p className="text-3xl font-bold mt-1">{avgOrdersPerCustomer}</p>
                        </div>
                        <DollarSign size={32} className="opacity-80" />
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
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

            {/* Customers Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-orange-600" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Orders</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                            No customers found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer) => {
                                        const stats = getCustomerStats(customer.id);
                                        return (
                                            <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-slate-800">{customer.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Mail size={16} />
                                                        {customer.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Phone size={16} />
                                                        {customer.phone || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Package size={16} className="text-blue-600" />
                                                        <span className="font-medium text-slate-800">{stats.totalOrders}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                    {stats.lastOrder}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(customer.status)}`}>
                                                        {customer.status || 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(customer)}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCustomer(customer.id)}
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

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Add New Customer</h2>
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
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                                onClick={handleAddCustomer}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                Add Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Customer Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Edit Customer</h2>
                            <button onClick={() => { setShowEditModal(false); setSelectedCustomer(null); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-lg">
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
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedCustomer(null); resetForm(); }}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateCustomer}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
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

export default CustomersView;
