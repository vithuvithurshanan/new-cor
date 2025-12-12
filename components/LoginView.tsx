
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { sendOtp, verifyOtp, signInWithEmail, signUpWithEmail, signInWithGoogle } from '../services/authService';
import { Box, Lock, Phone, Mail, User as UserIcon, ArrowRight, Loader2, ShieldCheck, Bike, Warehouse, LayoutDashboard, Plane, Cloud, MapPin, Eye, EyeOff } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    if (!username.trim()) return setError('Username is required');
    setLoading(true);
    setError('');
    try {
      const user = await signUpWithEmail(identifier, password, role, username.trim());
      onLogin(user);
    } catch (err: any) {
      console.error('Signup failed', err);
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      onLogin(user);
    } catch (err: any) {
      console.error('Google sign-in failed', err);
      // Error message is already formatted by authService
      setError(err.message);
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex flex-col justify-center items-center p-4">
      <style>{styles}</style>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-0 text-indigo-200/40 animate-drift" style={{ animationDuration: '25s' }}>
          <Cloud size={120} />
        </div>
        <div className="absolute top-1/3 left-0 text-indigo-200/30 animate-drift" style={{ animationDuration: '35s', animationDelay: '5s' }}>
          <Cloud size={180} />
        </div>
        <div className="absolute bottom-20 right-0 text-indigo-200/40 animate-drift-reverse" style={{ animationDuration: '28s' }}>
          <Cloud size={140} />
        </div>

        {/* Flying Objects */}
        <div className="absolute top-1/4 -left-20 text-indigo-300/40 animate-drift" style={{ animationDuration: '15s', animationDelay: '2s' }}>
          <Plane size={64} />
        </div>
        <div className="absolute bottom-1/3 -right-20 text-purple-300/40 animate-drift-reverse" style={{ animationDuration: '20s', animationDelay: '1s' }}>
          <Box size={48} />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8 relative z-10 animate-float">
        <div className="bg-white/80 backdrop-blur-md border border-white/60 p-3 rounded-2xl text-indigo-600 shadow-xl shadow-indigo-100">
          <Box size={32} strokeWidth={3} />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight drop-shadow-sm">CourierOS</h1>
      </div>

      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-indigo-100 overflow-hidden relative z-10 animate-float" style={{ animationDelay: '-3s' }}>

        {/* Header */}
        <div className="bg-white/50 p-6 text-center border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome Back</h2>
          <p className="text-slate-500 text-sm">Secure Logistics Portal</p>
        </div>

        {/* Role Tabs - Only show during signup */}
        {step === 'SIGNUP' && (
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={() => { setRole('CUSTOMER'); setError(''); }}
              className={`flex-1 py-4 text-sm font-medium transition-all ${role === 'CUSTOMER' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}`}
            >
              Customer
            </button>
            <button
              onClick={() => { setRole('RIDER'); setError(''); }}
              className={`flex-1 py-4 text-sm font-medium transition-all ${role === 'RIDER' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}`}
            >
              Rider
            </button>
            <button
              onClick={() => { setRole('ADMIN'); setError(''); }}
              className={`flex-1 py-4 text-sm font-medium transition-all ${role === 'ADMIN' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}`}
            >
              Admin
            </button>
          </div>
        )}

        {/* Form */}
        <div className="p-8">
          {step === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Login</label>
                <div className="relative group">
                  <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('SIGNUP'); setError(''); }}
                  className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all"
                >
                  Create Account
                </button>
              </div>

              {/* Google Sign-In */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                <div className="relative group">
                  <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <UserIcon size={20} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    placeholder="Choose your username"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 placeholder:text-slate-400" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input type="text" className="w-full pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 placeholder:text-slate-400" placeholder="+1 555 555 5555" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    placeholder="Choose a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800">
                  <option value="CUSTOMER">Customer</option>
                  <option value="RIDER">Rider</option>
                  <option value="HUB_MANAGER">Hub Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-[1.02] transition-all">{loading ? <Loader2 className="animate-spin" /> : 'Create Account'}</button>
                <button type="button" onClick={() => { setStep('LOGIN'); setError(''); }} className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all">Back to Login</button>
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
        <div className="bg-slate-50/50 p-4 border-t border-slate-200 text-center backdrop-blur-sm">
          <p className="text-xs text-slate-500">
            Demo Mode: Use <span className="font-mono font-bold text-slate-800">1234</span> as OTP.
          </p>
        </div>
      </div>

      <p className="mt-8 text-slate-400 text-sm font-medium tracking-wide">© 2024 CourierOS Inc. Secure Logistics.</p>
    </div >
  );
};
