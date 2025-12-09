import React, { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Mail, Phone, Shield, Bell, MapPin, Truck, Award, CreditCard, LogOut, Edit2, Save, X, CheckCircle } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || ''
  });
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  if (!currentUser) return null;

  const handleSave = () => {
    // In a real app, this would call an API
    setIsEditing(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-1 gap-8 pb-12 relative-7xl  animate-fade-in">
      {/* Header Profile Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-indigo-200 ring-4 ring-white">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              currentUser.name.charAt(0)
            )}
          </div>
          <div className="absolute bottom-1 right-1 bg-emerald-500 w-6 h-6 rounded-full border-2 border-white shadow-sm" title="Active"></div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2 w-full">
          <div className="flex justify-between items-start w-full">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-3xl font-bold text-slate-800 bg-white/50 border border-slate-300 rounded-lg px-2 py-1 w-full md:w-auto"
                />
              ) : (
                <h1 className="text-3xl font-bold text-slate-800">{editForm.name}</h1>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
                  {currentUser.role.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wide">
                  {currentUser.status}
                </span>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              >
                <Edit2 size={20} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={handleSave}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                >
                  <Save size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col md:flex-row gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Mail size={16} />
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-white/50 border border-slate-300 rounded px-2 py-0.5"
                />
              ) : editForm.email}
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Phone size={16} />
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="bg-white/50 border border-slate-300 rounded px-2 py-0.5"
                />
              ) : editForm.phone}
            </div>
          </div>
        </div>
      </div>

      {showSaveSuccess && (
        <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle size={20} />
          Profile updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Settings */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-indigo-600" /> Security
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/50 text-slate-600 text-sm font-medium transition-colors">
                Change Password
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/50 text-slate-600 text-sm font-medium transition-colors">
                Two-Factor Authentication
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/50 text-slate-600 text-sm font-medium transition-colors">
                Login History
              </button>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bell size={18} className="text-indigo-600" /> Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Email Notifications</span>
                <div className="w-10 h-6 bg-indigo-600 rounded-full relative cursor-pointer shadow-sm">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">SMS Alerts</span>
                <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Role Specific Data */}
        <div className="md:col-span-2 space-y-6">
          {currentUser.role === 'CUSTOMER' && (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin size={18} className="text-indigo-600" /> Address Book
                </h3>
                <button className="text-indigo-600 text-sm font-medium hover:underline">+ Add New</button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/60 rounded-xl border border-white/80 shadow-sm flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Home</span>
                    <p className="font-medium text-slate-800 mt-1">123 Innovation Drive</p>
                    <p className="text-sm text-slate-500">New York, NY 10001</p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><div className="w-1 h-1 bg-current rounded-full shadow-[6px_0_0_currentcolor,-6px_0_0_currentcolor]"></div></button>
                </div>

                <div className="p-4 bg-white/60 rounded-xl border border-white/80 shadow-sm flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Office</span>
                    <p className="font-medium text-slate-800 mt-1">456 Corporate Blvd</p>
                    <p className="text-sm text-slate-500">San Francisco, CA 94016</p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><div className="w-1 h-1 bg-current rounded-full shadow-[6px_0_0_currentcolor,-6px_0_0_currentcolor]"></div></button>
                </div>
              </div>
            </div>
          )}

          {currentUser.role === 'RIDER' && (
            <>
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Truck size={18} className="text-indigo-600" /> Vehicle Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/60 rounded-xl border border-white/80 text-center">
                    <p className="text-xs text-slate-500 uppercase font-bold">Vehicle Type</p>
                    <p className="text-lg font-bold text-slate-800">Delivery Van</p>
                  </div>
                  <div className="p-4 bg-white/60 rounded-xl border border-white/80 text-center">
                    <p className="text-xs text-slate-500 uppercase font-bold">Plate Number</p>
                    <p className="text-lg font-bold text-slate-800 font-mono">XYZ-8821</p>
                  </div>
                  <div className="p-4 bg-white/60 rounded-xl border border-white/80 text-center">
                    <p className="text-xs text-slate-500 uppercase font-bold">Capacity</p>
                    <p className="text-lg font-bold text-slate-800">800 kg</p>
                  </div>
                  <div className="p-4 bg-white/60 rounded-xl border border-white/80 text-center">
                    <p className="text-xs text-slate-500 uppercase font-bold">Maintenance</p>
                    <p className="text-lg font-bold text-emerald-600">Good</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Award size={18} className="text-amber-500" /> Performance
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-slate-800">4.9</div>
                    <div className="text-xs text-slate-500">Average Rating</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-slate-800">1,240</div>
                    <div className="text-xs text-slate-500">Trips Completed</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-slate-800">98%</div>
                    <div className="text-xs text-slate-500">On-Time Rate</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-600" /> Payment Methods
            </h3>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-white shadow-lg">
              <div className="w-12 h-8 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-red-500/80 mr-[-8px]"></div>
                <div className="w-4 h-4 rounded-full bg-yellow-500/80"></div>
              </div>
              <div className="flex-1">
                <p className="font-mono text-sm tracking-wider">•••• •••• •••• 4242</p>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>DEBIT</span>
                  <span>12/25</span>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 text-center text-sm text-indigo-600 font-medium hover:underline">Manage Payment Options</button>
          </div>
        </div>
      </div>
    </div>
  );
};