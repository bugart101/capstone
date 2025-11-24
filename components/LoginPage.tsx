
import React, { useState } from 'react';
import { Lock, User as UserIcon, ArrowRight, Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.login(username, password);
      // Simulate a small delay for the smooth UX feel
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 transition-colors duration-300 p-4 sm:p-6">
      
      {/* Container */}
      <div className="w-full max-w-sm sm:max-w-md animate-fade-in-up">
        
        {/* Card - Rounded */}
        <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 w-full rounded-2xl">
          
          {/* Header */}
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary text-white mb-4 sm:mb-6 rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <Building2 size={24} className="sm:hidden" strokeWidth={1.5} />
              <Building2 size={32} className="hidden sm:block" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-1 sm:mb-2">
              Facility Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <UserIcon size={18} className="sm:hidden" />
                  <UserIcon size={20} className="hidden sm:block" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm rounded-lg sm:rounded-xl"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} className="sm:hidden" />
                  <Lock size={20} className="hidden sm:block" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 sm:pl-11 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm rounded-lg sm:rounded-xl"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} className="sm:hidden" /> : <Eye size={18} className="sm:hidden" />}
                  {showPassword ? <EyeOff size={20} className="hidden sm:block" /> : <Eye size={20} className="hidden sm:block" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold animate-fade-in rounded-lg flex items-center justify-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold py-3 sm:py-3.5 transition-all duration-200 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Verifying...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">Sign In</span>
                  <ArrowRight size={18} className="sm:hidden" />
                  <ArrowRight size={20} className="hidden sm:block" />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} Facility Management System
            </p>
        </div>
      </div>
    </div>
  );
};
