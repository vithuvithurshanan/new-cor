
import React, { useState } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { useToast } from './ui/ToastContext';
import { User as UserIcon, Mail, Phone, Shield, Bell, MapPin, Truck, Award, CreditCard, LogOut, Edit2, Save, X, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User | null;
  onUserUpdate?: (updatedUser: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { showToast } = useToast();
  const [editForm, setEditForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (!currentUser) return null;

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      await apiService.updateUserProfile(currentUser.id, {
        name: editForm.name,
        phone: editForm.phone
      });

      // Update parent component's user state
      if (onUserUpdate) {
        const updatedUser: User = {
          ...currentUser,
          name: editForm.name,
          phone: editForm.phone
        };
        onUserUpdate(updatedUser);
      }

      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile. Please try again.', 'error');
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      // Import Firebase auth functions
      const { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user || !user.email) {
        setPasswordError('User not authenticated');
        return;
      }

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordForm.newPassword);

      // Success
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully!', 'success');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError('Please log out and log in again before changing password');
      } else {
        setPasswordError(error.message || 'Failed to change password');
      }
      showToast('Failed to change password. Please check your current password.', 'error');
    }
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
                className="p-2.5 bg-white text-slate-600 shadow-sm border border-slate-200 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md rounded-full transition-all cursor-pointer relative z-10"
                title="Edit Profile"
              >
                <Edit2 size={18} />
              </button>
            ) : (
              <div className="flex gap-2 relative z-10">
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2.5 bg-white text-red-500 shadow-sm border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:shadow-md rounded-full transition-all cursor-pointer"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={handleSave}
                  className="p-2.5 bg-white text-emerald-600 shadow-sm border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md rounded-full transition-all cursor-pointer"
                  title="Save Changes"
                >
                  <Save size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col md:flex-row gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Mail size={16} />
              <span className={isEditing ? "text-slate-400 italic" : ""}>{editForm.email}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Settings */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-indigo-600" /> Security
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/50 text-slate-600 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Lock size={16} />
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Lock className="text-indigo-600" size={24} />
                Change Password
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setPasswordSuccess(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-4">
                <CheckCircle size={20} />
                Password changed successfully!
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800"
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                    {passwordError}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                    }}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};