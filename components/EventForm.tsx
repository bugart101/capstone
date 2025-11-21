
import React, { useState, FormEvent, useEffect } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon, Clock, User, MapPin, CheckCircle2, Save } from 'lucide-react';
import { EventRequest, Equipment, Facility, User as AppUser } from '../types';
import { eventService } from '../services/eventService';
import { facilityService } from '../services/facilityService';
import { authService } from '../services/authService';

interface EventFormProps {
  onEventCreated: () => void;
  initialDate?: Date;
  initialData?: EventRequest; // For editing
  onCancel?: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({ onEventCreated, initialDate, initialData, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [availableFacilities, setAvailableFacilities] = useState<Facility[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Form State
  const [requesterName, setRequesterName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [facility, setFacility] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('Morning');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  
  // Equipment State
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [equipmentInput, setEquipmentInput] = useState('');

  // Load User
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (user && !initialData) {
      setRequesterName(user.fullName);
    }
  }, [initialData]);

  // Load facilities on mount
  useEffect(() => {
    const fetchFacilities = async () => {
      const data = await facilityService.getFacilities();
      setAvailableFacilities(data);
      // If creating new and no facility selected, select first one
      if (!initialData && data.length > 0 && !facility) {
        setFacility(data[0].name);
      }
    };
    fetchFacilities();
  }, []);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setRequesterName(initialData.requesterName);
      setEventTitle(initialData.eventTitle);
      setFacility(initialData.facility);
      setDate(initialData.date);
      setTimeSlot(initialData.timeSlot);
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      setEquipmentList(initialData.equipment);
    } else if (initialDate) {
      setDate(initialDate.toISOString().split('T')[0]);
    }
  }, [initialDate, initialData]);

  // Update facility if options load after initialData set (rare but possible)
  useEffect(() => {
    if (!facility && availableFacilities.length > 0 && !initialData) {
        setFacility(availableFacilities[0].name);
    }
  }, [availableFacilities]);


  const handleAddEquipment = () => {
    if (!equipmentInput.trim()) return;
    const newItem: Equipment = {
      id: crypto.randomUUID(),
      name: equipmentInput.trim()
    };
    setEquipmentList([...equipmentList, newItem]);
    setEquipmentInput('');
  };

  const handleRemoveEquipment = (id: string) => {
    setEquipmentList(equipmentList.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setSuccessMsg(null);

    try {
      if (initialData) {
        // Update Mode
        await eventService.updateEvent({
          ...initialData,
          requesterName, // Allow name update or keep as is?
          eventTitle,
          facility,
          date,
          timeSlot,
          startTime,
          endTime,
          equipment: equipmentList
        });
        setSuccessMsg('Event updated successfully!');
      } else {
        // Create Mode
        await eventService.createEvent({
          userId: currentUser.id,
          requesterName: requesterName || currentUser.fullName,
          eventTitle,
          facility: facility || (availableFacilities[0]?.name || 'Default Room'),
          date,
          timeSlot,
          startTime,
          endTime,
          equipment: equipmentList
        });
        setSuccessMsg('Event requested successfully!');
        // Reset Form only on create
        // setRequesterName(''); // Keep requester name
        setEventTitle('');
        setEquipmentList([]);
        setEquipmentInput('');
      }

      setTimeout(() => {
        onEventCreated();
        setSuccessMsg(null);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to save event", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-gray-900">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          {initialData ? <Save className="text-primary" size={20} /> : <Plus className="text-primary" size={20} />}
          {initialData ? 'Edit Request' : 'New Request'}
        </h2>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Event Title</label>
            <input
              type="text"
              required
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow bg-white text-gray-900 placeholder-gray-500"
              placeholder="e.g., Weekly Team Sync"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Requester Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="text"
                required
                value={requesterName}
                readOnly={!!currentUser && !initialData} // Lock if creating new, allow edit if admin editing
                onChange={(e) => setRequesterName(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-gray-900 placeholder-gray-500 ${!!currentUser && !initialData ? 'bg-gray-50 text-gray-600' : ''}`}
                placeholder="Your Full Name"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Facility</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <select
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-gray-900"
              >
                {availableFacilities.length > 0 ? (
                  availableFacilities.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))
                ) : (
                  <option value="">Loading facilities...</option>
                )}
              </select>
            </div>
          </div>
          
          <div>
             <label className="block text-sm font-semibold text-gray-800 mb-1">Date of Use</label>
             <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-gray-900"
                />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
             <label className="block text-sm font-semibold text-gray-800 mb-1">Start</label>
             <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm bg-white text-gray-900"
             />
          </div>
          <div className="col-span-1">
             <label className="block text-sm font-semibold text-gray-800 mb-1">End</label>
             <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm bg-white text-gray-900"
             />
          </div>
          <div className="col-span-1">
             <label className="block text-sm font-semibold text-gray-800 mb-1">Slot</label>
             <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm bg-white text-gray-900"
             >
               <option>Morning</option>
               <option>Afternoon</option>
               <option>Evening</option>
               <option>All Day</option>
             </select>
          </div>
        </div>
      </div>

      {/* Equipment Section */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-sm font-semibold text-gray-800 mb-2">Equipment Needed</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={equipmentInput}
            onChange={(e) => setEquipmentInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEquipment())}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm bg-white text-gray-900 placeholder-gray-500"
            placeholder="Add item (e.g., Projector)..."
          />
          <button
            type="button"
            onClick={handleAddEquipment}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-sm transition-colors"
          >
            Add
          </button>
        </div>
        
        {equipmentList.length > 0 && (
          <ul className="space-y-2 bg-gray-50 p-3 rounded-md border border-gray-100">
            {equipmentList.map((item) => (
              <li key={item.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm text-sm">
                <span className="text-gray-900 font-medium">{item.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEquipment(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {equipmentList.length > 0 && (
            <div className="mt-2 text-right">
                 <button type="button" onClick={() => setEquipmentList([])} className="text-xs text-gray-600 hover:text-gray-800 underline font-medium">Clear all</button>
            </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 flex gap-3">
        {onCancel && (
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
          className={`flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-md shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${!onCancel ? 'w-full' : ''}`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              {initialData ? 'Save Changes' : 'Submit Request'}
            </>
          )}
        </button>
      </div>
      {successMsg && (
          <div className="mt-3 p-3 bg-green-50 text-green-800 text-sm rounded-md flex items-center gap-2 animate-fade-in font-medium">
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}
    </form>
  );
};
