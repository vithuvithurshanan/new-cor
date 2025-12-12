import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { User, UserRole } from '../types';
import { Users, Search, Plus, Edit2, Trash2, X, Mail, Phone, Shield, Loader2, Download, Filter } from 'lucide-react';

export const AllUsersView: React.FC<{ roleFilter?: UserRole }> = ({ roleFilter }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'CUSTOMER' as UserRole,
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
    });

    // Real-time Firebase listener
    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching users:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter users
    useEffect(() => {
        let filtered = users;

        // Apply role filter from props
        if (roleFilter) {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.phone?.includes(searchQuery)
            );
        }

        // Apply role filter
        if (selectedRole !== 'ALL') {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        // Apply status filter
        if (selectedStatus !== 'ALL') {
            filtered = filtered.filter(user =>
                selectedStatus === 'ACTIVE' ? user.status !== 'INACTIVE' : user.status === 'INACTIVE'
            );
        }

        setFilteredUsers(filtered);
    }, [users, searchQuery, selectedRole, selectedStatus, roleFilter]);

    // Add user
    const handleAddUser = async () => {
        try {
            await addDoc(collection(db, 'users'), {
                ...formData,
                createdAt: new Date().toISOString()
            });
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Failed to add user');
        }
    };

    // Update user
    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        try {
            await updateDoc(doc(db, 'users', selectedUser.id), {
                ...formData,
                updatedAt: new Date().toISOString()
            });
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user');
        }
    };

    // Delete user
    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await deleteDoc(doc(db, 'users', userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: 'CUSTOMER',
            status: 'ACTIVE'
        });
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            status: (user.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
        });
        setShowEditModal(true);
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Role', 'Status'];
        const rows = filteredUsers.map(user => [
            user.name,
            user.email,
            user.phone || '',
            user.role,
            user.status || 'ACTIVE'
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        a.click();
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700';
            case 'RIDER': return 'bg-blue-100 text-blue-700';
            case 'HUB_MANAGER': return 'bg-green-100 text-green-700';
            case 'CUSTOMER': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusBadgeColor = (status?: string) => {
        return status === 'INACTIVE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Users className="text-indigo-600" size={32} />
                        {roleFilter ? `${roleFilter.charAt(0) + roleFilter.slice(1).toLowerCase().replace('_', ' ')}s` : 'All Users'}
                    </h1>
                    <p className="text-slate-500 mt-1">Manage and monitor user accounts</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Add User
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm">Total Users</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{filteredUsers.length}</p>
                        </div>
                        <Users className="text-indigo-600" size={32} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm">Active Users</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {filteredUsers.filter(u => u.status !== 'INACTIVE').length}
                            </p>
                        </div>
                        <Shield className="text-green-600" size={32} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm">Customers</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">
                                {users.filter(u => u.role === 'CUSTOMER').length}
                            </p>
                        </div>
                        <Users className="text-orange-600" size={32} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm">Riders</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {users.filter(u => u.role === 'RIDER').length}
                            </p>
                        </div>
                        <Users className="text-blue-600" size={32} />
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
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    {!roleFilter && (
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'ALL')}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="CUSTOMER">Customer</option>
                            <option value="RIDER">Rider</option>
                            <option value="HUB_MANAGER">Hub Manager</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    )}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-800">{user.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Mail size={16} />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone size={16} />
                                                    {user.phone || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                                                    {user.status || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
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

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Add New User</h2>
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
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="CUSTOMER">Customer</option>
                                    <option value="RIDER">Rider</option>
                                    <option value="HUB_MANAGER">Hub Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                                onClick={handleAddUser}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Add User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Edit User</h2>
                            <button onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-lg">
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
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="CUSTOMER">Customer</option>
                                    <option value="RIDER">Rider</option>
                                    <option value="HUB_MANAGER">Hub Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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

export default AllUsersView;
