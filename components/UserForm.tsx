
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
      // Don't prefill password for security/simplicity
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
    <form onSubmit={handleSubmit} className="space-y-6 text-gray-900">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <UserIcon className="text-primary" size={20} />
          {initialData ? (isSelfEdit ? 'Edit Your Profile' : 'Edit User') : 'Register New User'}
        </h2>
        <p className="text-sm text-gray-500">
          {isSelfEdit ? 'Update your personal information.' : 'Manage user account details.'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Full Name</label>
          <div className="relative">
             <UserIcon className="absolute left-3 top-2.5 text-gray-500" size={16} />
             <input
               type="text"
               required
               value={fullName}
               onChange={(e) => setFullName(e.target.value)}
               className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900 placeholder-gray-400"
               placeholder="John Doe"
             />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Email Address</label>
          <div className="relative">
             <Mail className="absolute left-3 top-2.5 text-gray-500" size={16} />
             <input
               type="email"
               required
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900 placeholder-gray-400"
               placeholder="john@example.com"
             />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Username */}
           <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900 placeholder-gray-400"
              placeholder="jdoe"
            />
          </div>

          {/* Role - Only Admin can change */}
          {canEditRole && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Passwords */}
        <div className="border-t border-gray-200 pt-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Password {initialData && <span className="text-gray-400 font-normal text-xs">(Leave blank to keep)</span>}
                </label>
                <div className="relative">
                   <Lock className="absolute left-3 top-2.5 text-gray-500" size={16} />
                   <input
                     type={showPassword ? "text" : "password"}
                     required={!initialData}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900"
                     placeholder="••••••••"
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 focus:outline-none"
                   >
                     {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Confirm Password</label>
                <div className="relative">
                   <Lock className="absolute left-3 top-2.5 text-gray-500" size={16} />
                   <input
                     type={showConfirmPassword ? "text" : "password"}
                     required={!initialData || !!password}
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900"
                     placeholder="••••••••"
                   />
                   <button
                     type="button"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 focus:outline-none"
                   >
                     {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                </div>
              </div>
           </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-800 text-sm rounded-md flex items-center gap-2 animate-fade-in font-medium border border-red-100">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-50 text-green-800 text-sm rounded-md flex items-center gap-2 animate-fade-in font-medium border border-green-100">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      <div className="pt-2 flex gap-3">
        {onCancel && !isSelfEdit && (
           <button
             type="button"
             onClick={onCancel}
             className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 rounded-md shadow-sm transition-all"
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
