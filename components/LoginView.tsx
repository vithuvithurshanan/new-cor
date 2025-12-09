
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { sendOtp, verifyOtp, signInWithEmail, signUpWithEmail } from '../services/authService';
import { Box, Lock, Phone, Mail, User as UserIcon, ArrowRight, Loader2, ShieldCheck, Bike, Warehouse, LayoutDashboard, Plane, Cloud, MapPin } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return setError('Email and password are required');
    setLoading(true);
    setError('');
    try {
      const user = await signInWithEmail(identifier, password);
      onLogin(user);
    } catch (err: any) {
      console.error('Login failed', err);
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return setError('Email and password are required');
    setLoading(true);
    setError('');
    try {
      const user = await signUpWithEmail(identifier, password, role, undefined);
      onLogin(user);
    } catch (err: any) {
      console.error('Signup failed', err);
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    CUSTOMER: { icon: UserIcon, label: 'Customer', placeholder: 'Phone or Email' },
    RIDER: { icon: Bike, label: 'Rider / Driver', placeholder: 'Rider ID' },
    ADMIN: { icon: LayoutDashboard, label: 'Admin', placeholder: 'Admin Email' },
    HUB_MANAGER: { icon: Warehouse, label: 'Hub Manager', placeholder: 'Manager ID' },
    HUB_STAFF: { icon: Warehouse, label: 'Staff', placeholder: 'Staff ID' },
    FINANCE: { icon: LayoutDashboard, label: 'Finance', placeholder: 'Email' },
    SUPPORT: { icon: LayoutDashboard, label: 'Support', placeholder: 'Email' },
  };

  const currentRoleConfig = roleConfig[role as keyof typeof roleConfig] || roleConfig.CUSTOMER;

  const styles = `
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
      100% { transform: translateY(0px); }
    }
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
    @keyframes drift {
      0% { transform: translateX(-10vw) translateY(0) rotate(0deg); opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { transform: translateX(110vw) translateY(-20px) rotate(10deg); opacity: 0; }
    }
    .animate-drift {
      animation: drift linear infinite;
    }
    @keyframes drift-reverse {
      0% { transform: translateX(110vw) translateY(0); opacity: 0; }
      10% { opacity: 0.6; }
      90% { opacity: 0.6; }
      100% { transform: translateX(-10vw) translateY(20px); opacity: 0; }
    }
    .animate-drift-reverse {
      animation: drift-reverse linear infinite;
    }
  `;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 flex flex-col justify-center items-center p-4">
      <style>{styles}</style>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-0 text-white/10 animate-drift" style={{ animationDuration: '25s' }}>
          <Cloud size={120} />
        </div>
        <div className="absolute top-1/3 left-0 text-white/5 animate-drift" style={{ animationDuration: '35s', animationDelay: '5s' }}>
          <Cloud size={180} />
        </div>
        <div className="absolute bottom-20 right-0 text-white/10 animate-drift-reverse" style={{ animationDuration: '28s' }}>
          <Cloud size={140} />
        </div>

        {/* Flying Objects */}
        <div className="absolute top-1/4 -left-20 text-indigo-200/20 animate-drift" style={{ animationDuration: '15s', animationDelay: '2s' }}>
          <Plane size={64} />
        </div>
        <div className="absolute bottom-1/3 -right-20 text-purple-200/20 animate-drift-reverse" style={{ animationDuration: '20s', animationDelay: '1s' }}>
          <Box size={48} />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8 relative z-10 animate-float">
        <div className="bg-white/20 backdrop-blur-md border border-white/30 p-3 rounded-2xl text-white shadow-xl">
          <Box size={32} strokeWidth={3} />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">CourierOS</h1>
      </div>

      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-float" style={{ animationDelay: '-3s' }}>

        {/* Header */}
        <div className="bg-white/10 p-6 text-center border-b border-white/10">
          <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
          <p className="text-indigo-100 text-sm">Secure Logistics Portal</p>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b border-white/10 bg-black/5">
          <button
            onClick={() => { setRole('CUSTOMER'); setStep('LOGIN'); setError(''); setIdentifier('alice@example.com'); }}
            className={`flex-1 py-4 text-sm font-medium transition-all ${role === 'CUSTOMER' ? 'text-white bg-white/10 shadow-[inset_0_-2px_0_rgba(255,255,255,0.5)]' : 'text-indigo-100 hover:bg-white/5 hover:text-white'}`}
          >
            Customer
          </button>
          <button
            onClick={() => { setRole('RIDER'); setStep('LOGIN'); setError(''); setIdentifier('R-4421'); }}
            className={`flex-1 py-4 text-sm font-medium transition-all ${role === 'RIDER' ? 'text-white bg-white/10 shadow-[inset_0_-2px_0_rgba(255,255,255,0.5)]' : 'text-indigo-100 hover:bg-white/5 hover:text-white'}`}
          >
            Rider
          </button>
          <button
            onClick={() => { setRole('ADMIN'); setStep('LOGIN'); setError(''); setIdentifier('admin@courieros.com'); }}
            className={`flex-1 py-4 text-sm font-medium transition-all ${role === 'ADMIN' ? 'text-white bg-white/10 shadow-[inset_0_-2px_0_rgba(255,255,255,0.5)]' : 'text-indigo-100 hover:bg-white/5 hover:text-white'}`}
          >
            Admin
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
          {step === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div>
                <label className="block text-sm font-medium text-indigo-50 mb-2 drop-shadow-sm">Email Login</label>
                <div className="relative group">
                  <div className="absolute left-3 top-3.5 text-indigo-200 group-focus-within:text-white transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-transparent outline-none transition-all text-white placeholder:text-indigo-200/70"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-50 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full pr-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/40 outline-none transition-all text-white placeholder:text-indigo-200/70"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-white text-indigo-600 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('SIGNUP'); setError(''); }}
                  className="flex-1 border border-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/5 transition-all"
                >
                  Create Account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div>
                <label className="block text-sm font-medium text-indigo-50 mb-2">Full Name</label>
                <input type="text" className="w-full pr-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/40 outline-none transition-all text-white placeholder:text-indigo-200/70" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-50 mb-2">Address</label>
                <input type="text" className="w-full pr-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/40 outline-none transition-all text-white placeholder:text-indigo-200/70" placeholder="Street, City, State" />
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-50 mb-2">Email</label>
                <input type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full pr-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/40 outline-none transition-all text-white placeholder:text-indigo-200/70" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-50 mb-2">Phone</label>
                <input type="text" className="w-full pr-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/40 outline-none transition-all text-white placeholder:text-indigo-200/70" placeholder="+1 555 555 5555" />
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-50 mb-2">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pr-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/40 outline-none transition-all text-white placeholder:text-indigo-200/70" placeholder="Choose a password" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-50 mb-2">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full pr-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/40 outline-none transition-all text-white">
                  <option value="CUSTOMER">Customer</option>
                  <option value="RIDER">Rider</option>
                  <option value="HUB_MANAGER">Hub Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-white text-indigo-600 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-50 hover:scale-[1.02] transition-all">{loading ? <Loader2 className="animate-spin" /> : 'Create Account'}</button>
                <button type="button" onClick={() => { setStep('LOGIN'); setError(''); }} className="flex-1 border border-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/5 transition-all">Back to Login</button>
              </div>
            </form>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 text-red-100 text-sm rounded-xl flex items-center gap-2 animate-in fade-in backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.8)]"></span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-black/10 p-4 border-t border-white/5 text-center backdrop-blur-sm">
          <p className="text-xs text-indigo-200/80">
            Demo Mode: Use <span className="font-mono font-bold text-white">1234</span> as OTP.
          </p>
        </div>
      </div>

      <p className="mt-8 text-indigo-200/60 text-sm font-medium tracking-wide">© 2024 CourierOS Inc. Secure Logistics.</p>
    </div >
  );
};
