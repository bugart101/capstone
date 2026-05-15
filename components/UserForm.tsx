
import React, { useState, useEffect, FormEvent } from 'react';
import { User, UserRole } from '../types';
import { Save, CheckCircle2, AlertCircle, User as UserIcon, Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

interface UserFormProps {
  onUserSaved: () => void;
  initialData?: User;
  onCancel: () => void;
  isSelfEdit?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ onUserSaved, initialData, onCancel, isSelfEdit = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName);
      setUsername(initialData.username);
      setEmail(initialData.email);
      setRole(initialData.role);
      // Pre-fill password if available
      if (initialData.password) {
        setPassword(initialData.password);
        setConfirmPassword(initialData.password);
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic Validation
    if (!initialData && !password) {
       setErrorMsg("Password is required for new users.");
       return;
    }
    if (password && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      if (initialData) {
        // Update
        const updatedUser = await userService.updateUser({
          ...initialData,
          fullName,
          username,
          email,
          role: isSelfEdit ? initialData.role : role, // Prevent changing own role if self-edit
          // Only update password if provided
          password: password || initialData.password 
        });
        
        // If updating self, update session
        if (currentUser && currentUser.id === updatedUser.id) {
           localStorage.setItem('greensync_session', JSON.stringify(updatedUser));
        }

        setSuccessMsg("Account updated successfully.");
      } else {
        // Create
        await userService.createUser({
          fullName,
          username,
          email,
          role,
          password
        });
        setSuccessMsg("User registered successfully.");
      }

      setTimeout(() => {
        onUserSaved();
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const canEditRole = currentUser?.role === 'ADMIN' && !isSelfEdit;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-gray-900 dark:text-gray-100">
      <div className="bg-primary/5 dark:bg-primary/10 -mx-6 -mt-6 p-6 border-b border-primary/10 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserIcon className="text-primary" size={20} />
          {initialData ? (isSelfEdit ? 'Edit Your Profile' : 'Edit User Account') : 'Register New User'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSelfEdit ? 'Keep your personal information up to date.' : 'Configure system access and permissions.'}
        </p>
      </div>

      <div className="space-y-4 px-1">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Full Name</label>
          <div className="relative">
             <UserIcon className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={16} />
             <input
               type="text"
               required
               value={fullName}
               onChange={(e) => setFullName(e.target.value)}
               className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
               placeholder="John Doe"
             />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Email Address</label>
          <div className="relative">
             <Mail className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={16} />
             <input
               type="email"
               required
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
               placeholder="john@example.com"
             />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Username */}
           <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="jdoe"
            />
          </div>

          {/* Role - Only Admin can change */}
          {canEditRole && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={16} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="USER" className="dark:bg-gray-700">User</option>
                  <option value="ADMIN" className="dark:bg-gray-700">Admin</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Passwords */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Password {initialData && <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">(Leave blank to keep)</span>}
                </label>
                <div className="relative">
                   <Lock className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={16} />
                   <input
                     type={showPassword ? "text" : "password"}
                     required={!initialData}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full pl-9 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                     placeholder="••••••••"
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                   >
                     {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Confirm Password</label>
                <div className="relative">
                   <Lock className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={16} />
                   <input
                     type={showConfirmPassword ? "text" : "password"}
                     required={!initialData || !!password}
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     className="w-full pl-9 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                     placeholder="••••••••"
                   />
                   <button
                     type="button"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                   >
                     {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                </div>
              </div>
           </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-md flex items-center gap-2 animate-fade-in font-medium border border-red-100 dark:border-red-800/50">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm rounded-md flex items-center gap-2 animate-fade-in font-medium border border-green-100 dark:border-green-800/50">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      <div className="pt-2 flex gap-3">
        {onCancel && !isSelfEdit && (
           <button
             type="button"
             onClick={onCancel}
             className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2.5 rounded-md shadow-sm transition-all"
           >
             Cancel
           </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-md shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${isSelfEdit ? 'w-full' : ''}`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={18} />
              {initialData ? 'Save Changes' : 'Create Account'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
