import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Edit, Trash2, 
  CheckCircle, Clock, AlertTriangle, ListFilter, Eye, FileText, Info, XCircle, RefreshCw, X
} from 'lucide-react';
import { EventRequest, EventStatus, Facility, User, Equipment } from '../types';
import { eventService } from '../services/eventService';
import { facilityService } from '../services/facilityService';
import { authService } from '../services/authService';
import { Modal } from './Modal';
import { EventForm } from './EventForm';

interface RequestPageProps {
  events: EventRequest[];
  onEventsUpdate: () => void;
  currentUser: User;
}

export const RequestPage: React.FC<RequestPageProps> = ({ events, onEventsUpdate, currentUser }) => {
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'status'>('newest');
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'All'>('All');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<EventRequest[]>([]);
  
  // Mobile Details Modal State
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  
  const [facilities, setFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    const loadFacilities = async () => {
      const data = await facilityService.getFacilities();
      setFacilities(data);
    };
    loadFacilities();
  }, []);

  useEffect(() => {
    let result = [...events];

    // Role-based filtering: User only sees their own, Admin sees all
    if (currentUser.role === 'USER') {
      result = result.filter(e => e.userId === currentUser.id);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.id.toLowerCase().includes(lowerQuery) ||
        e.eventTitle.toLowerCase().includes(lowerQuery)
      );
    }

    if (filterStatus !== 'All') {
      result = result.filter(e => e.status === filterStatus);
    }

    result.sort((a, b) => {
      if (sortOrder === 'newest') return b.createdAt - a.createdAt;
      if (sortOrder === 'oldest') return a.createdAt - b.createdAt;
      if (sortOrder === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

    setFilteredEvents(result);
    
    // Sync selected request if data updates
    if (selectedRequest) {
      const updatedSelected = result.find(e => e.id === selectedRequest.id);
      if (updatedSelected) {
        setSelectedRequest(updatedSelected);
      } else {
        const stillExists = events.find(e => e.id === selectedRequest.id);
        if (stillExists) setSelectedRequest(stillExists);
      }
    }
  }, [events, searchQuery, sortOrder, filterStatus, currentUser]);

  const handleStatusChange = async (newStatus: EventStatus) => {
    if (!selectedRequest) return;
    const updated = { ...selectedRequest, status: newStatus };
    await eventService.updateEvent(updated);
    onEventsUpdate(); 
  };

  const handleEquipmentStatusChange = async (equipmentId: string, currentStatus: string) => {
    if (!selectedRequest) return;
    
    // Toggle status
    const newStatus = currentStatus === 'Available' ? 'Unavailable' : 'Available';
    
    const updatedEquipment = selectedRequest.equipment.map(e => 
      e.id === equipmentId ? { ...e, status: newStatus } : e
    );
    
    const updatedRequest = { ...selectedRequest, equipment: updatedEquipment };
    
    // Update local state immediately for UI response
    setSelectedRequest(updatedRequest);
    
    // Persist to database
    await eventService.updateEvent(updatedRequest);
    onEventsUpdate();
  };

  const handleDeleteClick = () => {
    if (!selectedRequest) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRequest) return;
    await eventService.deleteEvent(selectedRequest.id);
    setSelectedRequest(null);
    setIsDeleteModalOpen(false);
    setIsMobileDetailOpen(false); // Close mobile modal if open
    onEventsUpdate();
  };

  const getFacilityEquipment = (facilityName: string) => {
    const facility = facilities.find(f => f.name === facilityName);
    return facility ? facility.equipment : [];
  };

  // Helper to get facility color
  const getFacilityColor = (facilityName: string) => {
    const facility = facilities.find(f => f.name === facilityName);
    return facility?.color || '#3b82f6'; // Default to blue
  };

  // Helper to format 24h time to 12h AM/PM
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const handleDownloadWord = () => {
    if (!selectedRequest) return;

    const equipmentList = selectedRequest.equipment.map(e => e.name).join(', ') || 'None';
    const formattedDate = new Date(selectedRequest.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const requestDate = new Date(selectedRequest.createdAt).toLocaleDateString();

    // COMPACT "SMALL" VERSION
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8" />
        <title>Facility Request Form</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 8.5in 11in;
            margin: 0.5in;
            mso-page-orientation: portrait;
          }
          body { font-family: 'Arial', sans-serif; font-size: 9pt; color: #000; }
          
          .container {
            border: 1px solid #000;
            padding: 10px;
          }
          
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
          .title { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
          .sub { font-size: 9pt; }
          
          .meta { text-align: right; font-size: 8pt; margin-bottom: 8px; color: #444; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          td { border: 1px solid #ccc; padding: 3px 5px; vertical-align: middle; }
          
          .label { background-color: #f2f2f2; font-weight: bold; width: 18%; font-size: 8pt; }
          .value { width: 32%; font-weight: bold; }
          .full { width: 80%; }
          
          .sig-table { border: none; margin-top: 15px; }
          .sig-table td { border: none; padding-top: 25px; text-align: center; vertical-align: bottom; }
          .line { border-top: 1px solid #000; margin: 0 5px; font-weight: bold; font-size: 9pt; }
          .role { font-size: 7pt; font-style: italic; margin-top: 2px; }

          .cut-line { margin-top: 10px; border-top: 1px dashed #999; text-align: center; font-size: 8pt; color: #999; padding-top: 2px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="sub">Divine World College of San Jose - General Services</div>
            <div class="title">Facility Request Form</div>
          </div>
          
          <div class="meta">
            Control No: ${selectedRequest.id.slice(0,8).toUpperCase()} | Date Filed: ${requestDate}
          </div>

          <table>
            <tr>
              <td class="label">Event Title</td>
              <td class="value" colspan="3" style="font-size: 11pt; color: #000;">${selectedRequest.eventTitle}</td>
            </tr>
            <tr>
              <td class="label">Requester</td>
              <td class="value">${selectedRequest.requesterName}</td>
              <td class="label">User ID</td>
              <td class="value">${currentUser.id.slice(0,6)}</td>
            </tr>
            <tr>
              <td class="label">Facility</td>
              <td class="value" colspan="3">${selectedRequest.facility}</td>
            </tr>
            <tr>
              <td class="label">Date</td>
              <td class="value">${formattedDate}</td>
              <td class="label">Time</td>
              <td class="value">${formatTime(selectedRequest.startTime)} - ${formatTime(selectedRequest.endTime)}</td>
            </tr>
            <tr>
              <td class="label" style="height: 35px; vertical-align: top;">Equipment</td>
              <td class="value" colspan="3" style="vertical-align: top; font-weight: normal;">${equipmentList}</td>
            </tr>
            <tr>
              <td class="label">Status</td>
              <td class="value" style="text-transform: uppercase;">${selectedRequest.status}</td>
              <td class="label">Remarks</td>
              <td class="value"></td>
            </tr>
          </table>

          <table class="sig-table">
            <tr>
              <td width="33%">
                <div class="line">${selectedRequest.requesterName}</div>
                <div class="role">Requested By</div>
              </td>
              <td width="33%">
                <div class="line">&nbsp;</div>
                <div class="role">Adviser / Department Head</div>
              </td>
              <td width="33%">
                <div class="line">&nbsp;</div>
                <div class="role">Dean of College / OSA / Principal</div>
              </td>
            </tr>
            <tr>
              <td width="33%">
                <div class="line">&nbsp;</div>
                <div class="role">CM Office / SC Director</div>
              </td>
              <td width="33%">
                <div class="line">&nbsp;</div>
                <div class="role">General Service Office</div>
              </td>
              <td width="33%">
                <div class="line">&nbsp;</div>
                <div class="role">VP for Administration</div>
              </td>
            </tr>
          </table>
          
          <div class="cut-line">- - - - - - - - - - - - - - - - - - - Cut Here - - - - - - - - - - - - - - - - - - -</div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([wordContent], { type: 'application/msword;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Sanitize filename for mobile compatibility
    const safeTitle = selectedRequest.eventTitle.replace(/[^a-z0-9]/gi, '_');
    link.setAttribute('download', `Request_${safeTitle}.doc`);
    
    document.body.appendChild(link);
    link.click();
    
    // Delay cleanup to ensure download triggers on mobile
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const getStatusBadge = (status: EventStatus, size: 'sm' | 'lg' = 'sm') => {
    const styles = {
      Pending: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
      Approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      Rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      Canceled: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
    };

    const dotColors = {
      Pending: 'bg-orange-500',
      Approved: 'bg-green-500',
      Rejected: 'bg-red-500',
      Canceled: 'bg-gray-500',
    };
    
    const className = styles[status] || styles.Pending;
    const dotClass = dotColors[status] || dotColors.Pending;

    return (
      <span className={`
        ${className} 
        ${size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'} 
        rounded-full font-bold border inline-flex items-center gap-1.5 transition-colors duration-200
      `}>
        <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
        {status}
      </span>
    );
  };

  const isAdmin = currentUser.role === 'ADMIN';

  // --------------------------------------------------------------------------
  // REUSABLE DETAILS RENDERER (Used in both Desktop Panel and Mobile Modal)
  // --------------------------------------------------------------------------
  const renderRequestDetails = (request: EventRequest, isMobileView: boolean) => {
    return (
      <>
        <div className={`p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900 transition-colors ${isMobileView ? 'sticky top-0 z-10' : ''}`}>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{request.eventTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">ID: {request.id.slice(0, 8)}</p>
          </div>
          <div>
            {getStatusBadge(request.status, 'lg')}
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800 transition-colors ${isMobileView ? 'pb-24' : ''} [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Event Details</h3>
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Requester</span>
                  <span className="block font-bold text-gray-900 dark:text-gray-100 text-lg">{request.requesterName}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Facility</span>
                  <span className="block font-bold text-gray-900 dark:text-gray-100 text-lg">{request.facility}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Date</span>
                  <span className="block font-bold text-gray-900 dark:text-gray-100 text-lg">{new Date(request.date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Time Slot</span>
                  <span className="block font-bold text-gray-900 dark:text-gray-100 text-lg">{request.timeSlot}</span>
                </div>
              </div>
              
              {(() => {
                const amenities = getFacilityEquipment(request.facility);
                if (amenities.length > 0) {
                  return (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800 mt-2 transition-colors">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-blue-800 dark:text-blue-300 mb-1.5">
                          <Info size={14} />
                          Facility Amenities (Included)
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-200 leading-relaxed flex flex-wrap gap-1">
                          {amenities.map((item, idx) => (
                            <span key={idx} className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                  );
                }
                return null;
              })()}

            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Timing</h3>
              <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg text-blue-900 dark:text-blue-200 transition-colors">
                <Clock className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={24} />
                <div>
                  <div className="text-sm font-semibold mb-0.5">Start Time</div>
                  <div className="text-xl font-bold">{formatTime(request.startTime)}</div>
                </div>
                <div className="h-10 w-px bg-blue-200 dark:bg-blue-700 mx-2"></div>
                <div>
                  <div className="text-sm font-semibold mb-0.5">End Time</div>
                  <div className="text-xl font-bold">{formatTime(request.endTime)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Requested Equipment</h3>
            {request.equipment.length > 0 ? (
              <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item Name</th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Availability</th>
                      {isAdmin && (
                          <th scope="col" className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {request.equipment.map((item) => {
                      const isAvailable = item.status === 'Available' || item.status === undefined;
                      return (
                        <tr key={item.id}>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">{item.name}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`flex items-center gap-1.5 ${isAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                              {isAvailable ? <CheckCircle size={18} /> : <XCircle size={18} />}
                              <span className="font-bold">{isAvailable ? 'Available' : 'Not Available'}</span>
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm">
                                <button
                                  onClick={() => handleEquipmentStatusChange(item.id, item.status || 'Available')}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-bold text-xs border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                  Change
                                </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No equipment requested.</p>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className={`p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center justify-between transition-colors ${isMobileView ? 'sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]' : ''}`}>
          
          {isAdmin ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full md:w-auto scrollbar-hide">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mr-2 flex-shrink-0">Set Status:</span>
              <div className="flex bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
                <button 
                  onClick={() => handleStatusChange('Pending')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${request.status === 'Pending' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Pending
                </button>
                <button 
                  onClick={() => handleStatusChange('Approved')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${request.status === 'Approved' ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Approved
                </button>
                <button 
                  onClick={() => handleStatusChange('Rejected')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${request.status === 'Rejected' ? 'bg-red-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Rejected
                </button>
                <button 
                  onClick={() => handleStatusChange('Canceled')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${request.status === 'Canceled' ? 'bg-gray-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Canceled
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* User only sees cancel if not already cancelled */}
              {request.status !== 'Canceled' && (
                <button 
                  onClick={() => handleStatusChange('Canceled')}
                  className="px-3 py-2 text-xs font-bold rounded-md transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                >
                  Cancel Request
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
              {isAdmin && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Edit size={16} /> Edit
                </button>
              )}
              
              <button 
                onClick={handleDownloadWord}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <FileText size={16} className="text-blue-600 dark:text-blue-400" /> Word
              </button>
              
              {isAdmin && (
                <button 
                  onClick={handleDeleteClick}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      
      {/* LEFT COLUMN: Request List */}
      <div className="lg:col-span-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full transition-colors">
        {/* List Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID or Title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-2 text-gray-500 dark:text-gray-400 pointer-events-none" size={14} />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary outline-none appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            <div className="relative">
              <ListFilter className="absolute left-2.5 top-2 text-gray-500 dark:text-gray-400 pointer-events-none" size={14} />
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary outline-none appearance-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <FileText size={40} className="mx-auto mb-2 opacity-20" />
              <p>No requests found.</p>
            </div>
          ) : (
            filteredEvents.map(event => {
              const facilityColor = getFacilityColor(event.facility);
              return (
                <div 
                  key={event.id}
                  onClick={() => {
                    setSelectedRequest(event);
                    // On mobile, open the modal
                    if (window.innerWidth < 1024) {
                       setIsMobileDetailOpen(true);
                    }
                  }}
                  style={{ borderLeft: `4px solid ${facilityColor}` }}
                  className={`
                    p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md group relative overflow-hidden
                    ${selectedRequest?.id === event.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span 
                      style={{ color: facilityColor }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-100 dark:bg-gray-700"
                    >
                      {event.facility}
                    </span>
                    {getStatusBadge(event.status)}
                  </div>
                  <h3 className="text-gray-900 dark:text-gray-100 font-bold text-base truncate mb-2">{event.eventTitle}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">#{event.id.slice(0,6)}</span>
                    <button className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      View <Eye size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Request Details (Desktop Only - hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex-col h-full overflow-hidden transition-colors">
        {selectedRequest ? (
          renderRequestDetails(selectedRequest, false)
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8">
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-full mb-4">
              <FileText size={48} className="text-gray-300 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">No Request Selected</h3>
            <p className="text-sm">Select a request from the list to view details and manage actions.</p>
          </div>
        )}
      </div>

      {/* MOBILE DETAILS MODAL */}
      <Modal 
         isOpen={isMobileDetailOpen} 
         onClose={() => setIsMobileDetailOpen(false)}
         title="Request Details"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col max-h-[85vh]">
           {selectedRequest && renderRequestDetails(selectedRequest, true)}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Request"
      >
        {selectedRequest && (
          <EventForm
            onEventCreated={() => {
              setIsEditModalOpen(false);
              onEventsUpdate();
            }}
            initialData={selectedRequest}
            onCancel={() => setIsEditModalOpen(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-6 text-gray-900 dark:text-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 rounded-full p-2">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Delete Request?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Are you sure you want to delete this request? This action cannot be undone.
              </p>
              {selectedRequest && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-sm">
                  <span className="font-bold">{selectedRequest.eventTitle}</span>
                  <br/>
                  <span className="text-gray-500 dark:text-gray-400">{selectedRequest.date}</span>
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
              Delete Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};