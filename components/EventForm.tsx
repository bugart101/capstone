
import React, { useState, FormEvent, useEffect } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon, User, MapPin, CheckCircle2, Save, AlertCircle, X, Info, PackagePlus, AlertTriangle } from 'lucide-react';
import { EventRequest, Equipment, Facility, User as AppUser } from '../types';
import { eventService } from '../services/eventService';
import { facilityService } from '../services/facilityService';
import { authService } from '../services/authService';
import { Modal } from './Modal';

interface EventFormProps {
  onEventCreated: () => void;
  initialDate?: Date;
  initialData?: EventRequest; // For editing
  onCancel?: () => void;
}

const COMMON_REQUESTABLES = [
  "Microphone", "Sound System", "Extension Cord", 
  "Projector Screen", "Whiteboard", "Extra Chairs", 
  "Long Table", "Podium", "Electric Fan"
];

export const EventForm: React.FC<EventFormProps> = ({ onEventCreated, initialDate, initialData, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Conflict Warning State
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  const [availableFacilities, setAvailableFacilities] = useState<Facility[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Form State
  const [requesterName, setRequesterName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [facility, setFacility] = useState('');
  
  // Date Management
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState('');

  const [timeSlot, setTimeSlot] = useState('Morning');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Equipment State
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [equipmentInput, setEquipmentInput] = useState('');

  // Helper to format JS Date to YYYY-MM-DD Local Time (Fixes -1 day bug)
  const formatDateToLocalInput = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to convert HH:mm to minutes for comparison
  const getMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const resetConflictState = () => {
    setConflictWarning(null);
    setIsConflictModalOpen(false);
  };

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
      if (!initialData && data.length > 0 && !facility) {
        setFacility(data[0].name);
      }
    };
    fetchFacilities();
  }, []);

  // Load initial data if editing or date clicked
  useEffect(() => {
    if (initialData) {
      // Edit Mode
      setRequesterName(initialData.requesterName);
      setEventTitle(initialData.eventTitle);
      setFacility(initialData.facility);
      setTimeSlot(initialData.timeSlot);
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      setEquipmentList(initialData.equipment);
      
      if (initialData.dates && initialData.dates.length > 0) {
        setSelectedDates(initialData.dates);
      } else {
        setSelectedDates([initialData.date]);
      }
    } else if (initialDate) {
      // Create Mode (from Calendar Click)
      const localDateStr = formatDateToLocalInput(initialDate);
      setDateInput(localDateStr);
      setSelectedDates([localDateStr]);
    }
  }, [initialDate, initialData]);

  // Update facility if options load after initialData set
  useEffect(() => {
    if (!facility && availableFacilities.length > 0 && !initialData) {
        setFacility(availableFacilities[0].name);
    }
  }, [availableFacilities]);

  // AUTOMATIC TIME SLOT CALCULATION
  useEffect(() => {
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startTotalMinutes = startH * 60 + startM;
      const endTotalMinutes = endH * 60 + endM;
      const duration = endTotalMinutes - startTotalMinutes;

      let calculatedSlot = 'Morning';
      if (duration >= 300) { 
        calculatedSlot = 'All Day';
      } else if (startH < 12) {
        calculatedSlot = 'Morning';
      } else if (startH >= 12 && startH < 17) {
        calculatedSlot = 'Afternoon';
      } else {
        calculatedSlot = 'Evening';
      }
      setTimeSlot(calculatedSlot);
    }
  }, [startTime, endTime]);

  const handleAddDate = () => {
    if (!dateInput) return;
    if (!selectedDates.includes(dateInput)) {
      const newDates = [...selectedDates, dateInput].sort();
      setSelectedDates(newDates);
      resetConflictState();
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setSelectedDates(selectedDates.filter(d => d !== dateToRemove));
    resetConflictState();
  };

  const addItemToList = (name: string) => {
    const newItem: Equipment = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: name,
      status: 'Available'
    };
    setEquipmentList(prev => [...prev, newItem]);
  };

  const addEquipmentItem = () => {
    if (!equipmentInput.trim()) return;
    addItemToList(equipmentInput.trim());
    setEquipmentInput('');
  };

  const handleAddEquipmentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addEquipmentItem();
  };
  
  const handleQuickAdd = (itemName: string) => {
    addItemToList(itemName);
  };

  const handleEquipmentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      addEquipmentItem();
    }
  };

  const handleRemoveEquipment = (id: string) => {
    setEquipmentList(equipmentList.filter(item => item.id !== id));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!eventTitle.trim()) newErrors.eventTitle = 'Event title is required';
    if (!requesterName.trim()) newErrors.requesterName = 'Requester name is required';
    
    if (selectedDates.length === 0) {
      newErrors.date = 'At least one date is required';
    }

    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';

    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (endTotal <= startTotal) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkConflicts = async (): Promise<string | null> => {
    const existingEvents = await eventService.getEvents();
    const newStart = getMinutes(startTime);
    const newEnd = getMinutes(endTime);

    const candidates = existingEvents.filter(e => 
      e.facility === facility && 
      e.status !== 'Rejected' && 
      e.status !== 'Canceled' &&
      (!initialData || e.id !== initialData.id)
    );

    for (const existing of candidates) {
      const hasDateOverlap = existing.dates.some(d => selectedDates.includes(d));
      
      if (hasDateOverlap) {
        const exStart = getMinutes(existing.startTime);
        const exEnd = getMinutes(existing.endTime);

        if (newStart < exEnd && newEnd > exStart) {
          const conflictDate = existing.dates.find(d => selectedDates.includes(d));
          return `Conflict detected! "${existing.eventTitle}" is already booked at ${existing.facility} on ${conflictDate} (${existing.startTime} - ${existing.endTime}).`;
        }
      }
    }
    return null;
  };

  const executeSubmission = async () => {
    if (!currentUser) return;
    setIsLoading(true);

    const eventPayload = {
      requesterName, 
      eventTitle,
      facility: facility || (availableFacilities[0]?.name || 'Default Room'),
      date: selectedDates[0],
      dates: selectedDates,
      timeSlot,
      startTime,
      endTime,
      equipment: equipmentList
    };

    try {
      if (initialData) {
        await eventService.updateEvent({
          ...initialData,
          ...eventPayload
        });
        setSuccessMsg('Request updated successfully!');
      } else {
        await eventService.createEvent({
          userId: currentUser.id,
          ...eventPayload
        });
        setSuccessMsg('Request submitted successfully!');
        
        // Reset Form
        setEventTitle('');
        setEquipmentList([]);
        setEquipmentInput('');
        setStartTime('09:00');
        setEndTime('10:00');
        setSelectedDates([]);
        resetConflictState();
      }

      setTimeout(() => {
        onEventCreated();
        setSuccessMsg(null);
      }, 1500);
      
    } catch (error) {
      console.error("Failed to save event", error);
      setSuccessMsg(null); 
    } finally {
      setIsLoading(false);
      setIsConflictModalOpen(false); // Close modal if open
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMsg(null);

    try {
      // 1. Check for Conflicts
      const conflictMsg = await checkConflicts();
      
      if (conflictMsg) {
         setConflictWarning(conflictMsg);
         setIsConflictModalOpen(true);
         setIsLoading(false);
         // STOP: Do not execute submission. User must fix conflict.
         return;
      }

      // 2. If no conflict, proceed
      await executeSubmission();
      
    } catch (error) {
      console.error("Failed to check conflict", error);
      setIsLoading(false);
    }
  };

  const selectedFacilityData = availableFacilities.find(f => f.name === facility);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 text-gray-900 dark:text-gray-100" noValidate>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            {initialData ? <Save className="text-primary" size={20} /> : <Plus className="text-primary" size={20} />}
            {initialData ? 'Edit Request' : 'New Request'}
          </h2>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Event Title</label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => {
                  setEventTitle(e.target.value);
                  if (errors.eventTitle) setErrors({...errors, eventTitle: ''});
                }}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${errors.eventTitle ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="e.g., Weekly Team Sync"
              />
              {errors.eventTitle && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.eventTitle}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Requester Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={16} />
                <input
                  type="text"
                  required
                  value={requesterName}
                  readOnly={!!currentUser && !initialData} 
                  onChange={(e) => {
                    setRequesterName(e.target.value);
                    if (errors.requesterName) setErrors({...errors, requesterName: ''});
                  }}
                  className={`w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${!!currentUser && !initialData ? 'bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300' : ''} ${errors.requesterName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Your Full Name"
                />
              </div>
              {errors.requesterName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.requesterName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Facility</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={16} />
                <select
                  value={facility}
                  onChange={(e) => {
                    setFacility(e.target.value);
                    resetConflictState();
                  }}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Date(s) of Use
              </label>
              
              <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <CalendarIcon className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={16} />
                      <input
                        type="date"
                        value={dateInput}
                        onChange={(e) => {
                          setDateInput(e.target.value);
                          if (errors.date) setErrors({...errors, date: ''});
                          resetConflictState();
                        }}
                        className={`w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.date ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDate}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-sm transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Selected Dates List */}
                  {selectedDates.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-100 dark:border-gray-700">
                      {selectedDates.map(date => (
                        <span key={date} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 animate-fade-in">
                          {date}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveDate(date)}
                            className="hover:text-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic pl-1">No dates selected.</p>
                  )}
              </div>
              
              {errors.date && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Start</label>
              <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    if (errors.startTime) setErrors({...errors, startTime: ''});
                    if (errors.endTime) setErrors({...errors, endTime: ''});
                    resetConflictState();
                  }}
                  className={`w-full px-2 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.startTime ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">End</label>
              <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    if (errors.endTime) setErrors({...errors, endTime: ''});
                    resetConflictState();
                  }}
                  className={`w-full px-2 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.endTime ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Slot</label>
              <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Equipment</label>
          
          {selectedFacilityData && selectedFacilityData.equipment.length > 0 && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
              <div className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-2">
                  <Info size={14} /> Included in {selectedFacilityData.name}:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedFacilityData.equipment.map((item, idx) => (
                  <span key={idx} className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700 text-xs text-blue-900 dark:text-blue-200 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              onKeyDown={handleEquipmentKeyDown}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Type specific item (e.g. Laser Pointer)..."
            />
            <button
              type="button"
              onClick={handleAddEquipmentClick}
              className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors active:bg-gray-300"
            >
              Add
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Quick Add:</p>
            <div className="flex flex-wrap gap-2">
                {COMMON_REQUESTABLES.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleQuickAdd(item)}
                    className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <PackagePlus size={12} /> {item}
                  </button>
                ))}
            </div>
          </div>
          
          {equipmentList.length > 0 && (
            <ul className="space-y-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
              {equipmentList.map((item) => (
                <li key={item.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded shadow-sm text-sm">
                  <span className="text-gray-900 dark:text-gray-200 font-medium">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEquipment(item.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {equipmentList.length > 0 && (
              <div className="mt-2 text-right">
                  <button type="button" onClick={() => setEquipmentList([])} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline font-medium">Clear all</button>
              </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2.5 rounded-md shadow-sm transition-all"
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
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm rounded-md flex items-center gap-2 animate-fade-in font-medium">
              <CheckCircle2 size={16} />
              {successMsg}
            </div>
          )}
      </form>

      {/* Conflict Warning Popup Modal */}
      <Modal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        title="Schedule Conflict Detected"
      >
        <div className="text-gray-900 dark:text-gray-100">
           <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-4">
              <div className="bg-red-100 dark:bg-red-800 rounded-full p-2 flex-shrink-0">
                 <AlertTriangle className="text-red-600 dark:text-red-200" size={24} />
              </div>
              <div>
                 <h4 className="font-bold text-lg text-red-800 dark:text-red-200 mb-1">Time Slot Unavailable</h4>
                 <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                   {conflictWarning}
                 </p>
              </div>
           </div>

           <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 px-1">
             The facility is already booked for this time. You must choose a different time or date to proceed.
           </p>

           <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => setIsConflictModalOpen(false)}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md font-bold text-sm transition-colors"
              >
                Back to Edit
              </button>
           </div>
        </div>
      </Modal>
    </>
  );
};
