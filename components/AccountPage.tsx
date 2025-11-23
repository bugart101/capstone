
import React, { useState, useEffect } from 'react';
import { User, ThemePreferences } from '../types';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { themeService } from '../services/themeService';
import { Modal } from './Modal';
import { UserForm } from './UserForm';
import { Plus, Search, Shield, User as UserIcon, Edit, Trash2, AlertTriangle, Mail, Moon, Sun, Palette, Check } from 'lucide-react';

const PRESET_THEME_COLORS = [
  { name: 'Green', value: '#2e7d32' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Dark Gray', value: '#374151' },
];

export const AccountPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Theme State
  const [themePrefs, setThemePrefs] = useState<ThemePreferences>(themeService.getPreferences());

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    
    if (user?.role === 'ADMIN') {
      loadUsers();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await userService.getUsers();
    setUsers(data);
    setIsLoading(false);
  };

  const handleCreate = () => {
    setSelectedUser(undefined);
    setIsFormModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      await userService.deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(undefined);
      loadUsers();
    }
  };

  const handleFormSaved = () => {
    setIsFormModalOpen(false);
    loadUsers();
  };

  // Theme Handlers
  const toggleDarkMode = () => {
    const newMode = themePrefs.mode === 'light' ? 'dark' : 'light';
    const newPrefs = { ...themePrefs, mode: newMode };
    setThemePrefs(newPrefs);
    themeService.savePreferences(newPrefs);
  };

  const changePrimaryColor = (color: string) => {
    const newPrefs = { ...themePrefs, primaryColor: color };
    setThemePrefs(newPrefs);
    themeService.savePreferences(newPrefs);
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderThemeSettings = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Palette className="text-primary" size={20} />
        System Appearance
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dark Mode Toggle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Theme Mode</label>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-fit">
            <button
              onClick={() => themePrefs.mode !== 'light' && toggleDarkMode()}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${themePrefs.mode === 'light' ? 'bg-white shadow text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
            >
              <Sun size={16} /> Light
            </button>
            <button
              onClick={() => themePrefs.mode !== 'dark' && toggleDarkMode()}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${themePrefs.mode === 'dark' ? 'bg-gray-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Moon size={16} /> Dark
            </button>
          </div>
        </div>

        {/* Color Picker */}
        <div>
           <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">System Color</label>
           <div className="flex flex-wrap gap-3">
             {PRESET_THEME_COLORS.map(color => (
               <button
                 key={color.value}
                 onClick={() => changePrimaryColor(color.value)}
                 className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${themePrefs.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-gray-800' : ''}`}
                 style={{ backgroundColor: color.value }}
                 title={color.name}
               >
                 {themePrefs.primaryColor === color.value && <Check size={14} className="text-white" />}
               </button>
             ))}
             {/* Custom Color Input Wrapper */}
             <div className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer hover:scale-110 transition-transform border border-gray-300 dark:border-gray-600 group">
                <input 
                  type="color" 
                  value={themePrefs.primaryColor}
                  onChange={(e) => changePrimaryColor(e.target.value)}
                  className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                />
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  // RENDER FOR NON-ADMIN (USER) - Edit Profile
  if (currentUser && currentUser.role !== 'ADMIN') {
     return (
       <div className="max-w-4xl mx-auto space-y-8">
         {renderThemeSettings()}
         <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
           <UserForm 
             onUserSaved={() => {
               const updated = authService.getCurrentUser();
               setCurrentUser(updated);
             }}
             initialData={currentUser}
             onCancel={() => {}}
             isSelfEdit={true}
           />
         </div>
       </div>
     );
  }

  // RENDER FOR ADMIN
  return (
    <div className="space-y-8">
      
      {/* Theme Settings */}
      {renderThemeSettings()}

      {/* User Management Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Accounts</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system access credentials.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-md font-bold shadow-sm transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          Register User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                      {user.role === 'ADMIN' ? <Shield size={20} /> : <UserIcon size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{user.fullName}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6 flex-grow">
                   <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <UserIcon size={14} className="text-gray-400 dark:text-gray-500" />
                      <span>@{user.username}</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail size={14} className="text-gray-400 dark:text-gray-500" />
                      <span className="truncate">{user.email}</span>
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <button 
                    onClick={() => handleEdit(user)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(user)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-700 border border-red-200 dark:border-red-900/50 rounded text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed">
               <UserIcon size={48} className="mx-auto mb-3 opacity-20" />
               <p>No users found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* User Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedUser ? 'Edit User' : 'New User'}
      >
        <UserForm 
          onUserSaved={handleFormSaved}
          initialData={selectedUser}
          onCancel={() => setIsFormModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
      >
         <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Confirm User Deletion</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Are you sure you want to delete this user? This action will remove their access to the system immediately.
              </p>
              {selectedUser && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-sm">
                  <div className="font-bold text-gray-900 dark:text-gray-200">{selectedUser.fullName}</div>
                  <div className="text-gray-500 dark:text-gray-400">@{selectedUser.username}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold text-sm transition-colors shadow-sm"
            >
              Delete User
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
