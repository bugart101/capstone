
import React, { useState, useEffect } from 'react';
import { Facility } from '../types';
import { facilityService } from '../services/facilityService';
import { Modal } from './Modal';
import { Building2, Plus, Trash2, AlertTriangle, Search, MapPin, Edit, Save, X, Package, Check } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Zinc', value: '#71717a' },
];

export const FacilityPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State (Add/Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [facilityName, setFacilityName] = useState('');
  const [facilityColor, setFacilityColor] = useState(PRESET_COLORS[0].value);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    setIsLoading(true);
    const data = await facilityService.getFacilities();
    setFacilities(data);
    setIsLoading(false);
  };

  const openAddModal = () => {
    setEditingFacility(null);
    setFacilityName('');
    setFacilityColor(PRESET_COLORS[0].value);
    setEquipmentList([]);
    setEquipmentInput('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (facility: Facility) => {
    setEditingFacility(facility);
    setFacilityName(facility.name);
    setFacilityColor(facility.color || PRESET_COLORS[0].value);
    setEquipmentList([...facility.equipment]); // Copy array
    setEquipmentInput('');
    setIsFormModalOpen(true);
  };

  const handleAddEquipment = () => {
    if (equipmentInput.trim()) {
      setEquipmentList([...equipmentList, equipmentInput.trim()]);
      setEquipmentInput('');
    }
  };

  const handleRemoveEquipment = (index: number) => {
    const newList = [...equipmentList];
    newList.splice(index, 1);
    setEquipmentList(newList);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityName.trim()) return;

    setIsSubmitting(true);
    
    if (editingFacility) {
      // Update existing
      await facilityService.updateFacility({
        ...editingFacility,
        name: facilityName.trim(),
        color: facilityColor,
        equipment: equipmentList
      });
    } else {
      // Add new
      await facilityService.addFacility(facilityName.trim(), equipmentList, facilityColor);
    }

    setIsFormModalOpen(false);
    setIsSubmitting(false);
    loadFacilities();
  };

  const handleDeleteClick = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedFacility) {
      await facilityService.deleteFacility(selectedFacility.id);
      setIsDeleteModalOpen(false);
      setSelectedFacility(null);
      loadFacilities();
    }
  };

  const filteredFacilities = facilities.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Facility Management</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage facilities, equipment, and color coding.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-md font-bold shadow-sm transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          Add Facility
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={18} />
        <input 
          type="text"
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.length > 0 ? (
            filteredFacilities.map(facility => (
              <div 
                key={facility.id} 
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex flex-col group hover:shadow-md transition-all h-full relative overflow-hidden"
                style={{ borderLeft: `5px solid ${facility.color || '#3b82f6'}` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${facility.color || '#3b82f6'}20`, color: facility.color || '#3b82f6' }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{facility.name}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> On Campus
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(facility)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(facility)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-700 flex-grow">
                   <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Available Equipment</h4>
                   {facility.equipment && facility.equipment.length > 0 ? (
                     <div className="flex flex-wrap gap-1.5">
                        {facility.equipment.slice(0, 4).map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded border border-gray-200 dark:border-gray-600">
                            {item}
                          </span>
                        ))}
                        {facility.equipment.length > 4 && (
                          <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 text-xs rounded border border-gray-100 dark:border-gray-600">
                             +{facility.equipment.length - 4} more
                          </span>
                        )}
                     </div>
                   ) : (
                     <p className="text-xs text-gray-400 dark:text-gray-600 italic">No equipment listed</p>
                   )}
                </div>
              </div>
            ))
          ) : (
             <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed transition-colors">
               <Building2 size={48} className="mx-auto mb-3 opacity-20" />
               <p>No facilities found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingFacility ? 'Edit Facility' : 'Add New Facility'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-6 text-gray-900 dark:text-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Facility Name</label>
            <input
              type="text"
              autoFocus
              required
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              placeholder="e.g., Science Lab 101"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Color Label</label>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setFacilityColor(color.value)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all
                    ${facilityColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110' : 'hover:scale-110'}
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {facilityColor === color.value && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Equipment List</label>
             <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEquipment())}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Add amenity (e.g., Projector)"
                />
                <button
                  type="button"
                  onClick={handleAddEquipment}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
                >
                  Add
                </button>
             </div>
             
             <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700 p-2 min-h-[100px] max-h-[200px] overflow-y-auto">
               {equipmentList.length > 0 ? (
                 <ul className="space-y-1.5">
                   {equipmentList.map((item, idx) => (
                     <li key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                       <span className="text-sm text-gray-800 dark:text-gray-200">{item}</span>
                       <button
                         type="button"
                         onClick={() => handleRemoveEquipment(idx)}
                         className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                       >
                         <X size={14} />
                       </button>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 text-xs italic">
                    <Package size={24} className="mb-1 opacity-20" />
                    No equipment added yet.
                 </div>
               )}
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
             <button 
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              <Save size={16} />
              {isSubmitting ? 'Saving...' : (editingFacility ? 'Save Changes' : 'Create Facility')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Facility"
      >
         <div className="space-y-6 text-gray-900 dark:text-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 rounded-full p-2">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Confirm Deletion</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Are you sure you want to delete this facility?
              </p>
              {selectedFacility && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-800 dark:text-gray-200">
                  {selectedFacility.name}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold text-sm transition-colors shadow-sm"
            >
              Delete Facility
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
