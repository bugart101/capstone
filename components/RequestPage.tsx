
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Edit, Trash2, 
  CheckCircle, Clock, AlertTriangle, ListFilter, Eye, FileText, Info
} from 'lucide-react';
import { EventRequest, EventStatus, Facility, User } from '../types';
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

  const handleDeleteClick = () => {
    if (!selectedRequest) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRequest) return;
    await eventService.deleteEvent(selectedRequest.id);
    setSelectedRequest(null);
    setIsDeleteModalOpen(false);
    onEventsUpdate();
  };

  const getFacilityEquipment = (facilityName: string) => {
    const facility = facilities.find(f => f.name === facilityName);
    return facility ? facility.equipment : [];
  };

  const handleDownloadWord = () => {
    if (!selectedRequest) return;

    const equipmentList = selectedRequest.equipment.map(e => e.name).join(', ') || 'None';

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8" />
        <title>Request Form</title>
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
            size: 21cm 29.7cm;
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-page-orientation: portrait;
          }
          body { font-family: 'Arial', sans-serif; font-size: 11pt; }
          table { border-collapse: collapse; width: 100%; }
          td { vertical-align: top; }
          
          .header-title { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
          .req-id { text-align: right; font-weight: bold; font-size: 10pt; margin-bottom: 5px; }
          
          .box-container { 
            border: 1.5pt solid windowtext; 
            padding: 20px; 
            height: 300px;
          }
          .box-title { 
            font-size: 12pt; 
            font-weight: bold; 
            text-align: center; 
            margin-bottom: 15px; 
          }
          
          .label { font-weight: bold; width: 140px; padding: 4px 0; }
          .value { padding: 4px 0; }
          
          .sig-block { 
            border-top: 1pt solid windowtext; 
            margin-top: 50px; 
            padding-top: 5px; 
            font-weight: bold; 
            font-size: 10pt; 
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <p class="header-title">DIVINE WORLD COLLEGE OF SAN JOSE</p>
          <p class="req-id">Request ID: ${selectedRequest.id.slice(0,8)}</p>
          
          <div class="box-container">
            <p class="box-title">Request all information</p>
            <table>
              <tr><td class="label">Requester Name:</td><td class="value">${selectedRequest.requesterName}</td></tr>
              <tr><td class="label">Event Title:</td><td class="value">${selectedRequest.eventTitle}</td></tr>
              <tr><td class="label">Facility:</td><td class="value">${selectedRequest.facility}</td></tr>
              <tr><td class="label">Date of Use:</td><td class="value">${selectedRequest.date}</td></tr>
              <tr><td class="label">Time Slot:</td><td class="value">${selectedRequest.timeSlot}</td></tr>
              <tr><td class="label">Time:</td><td class="value">${selectedRequest.startTime} - ${selectedRequest.endTime}</td></tr>
              <tr><td class="label">Status:</td><td class="value">${selectedRequest.status}</td></tr>
              <tr><td class="label">Equipment:</td><td class="value">${equipmentList}</td></tr>
            </table>
          </div>
          
          <br/><br/>
          
          <table style="width: 100%;">
            <tr>
              <td width="30%"><div class="sig-block">Adviser/Department Head</div></td>
              <td width="5%"></td>
              <td width="30%"><div class="sig-block">Dean of College/OSA/Principal</div></td>
              <td width="5%"></td>
              <td width="30%"><div class="sig-block">CM Office/SC Director</div></td>
            </tr>
          </table>
          
          <br/>
          
          <table style="width: 100%;">
             <tr>
               <td width="15%"></td>
               <td width="30%"><div class="sig-block">General Services Office</div></td>
               <td width="10%"></td>
               <td width="30%"><div class="sig-block">VP for Administration</div></td>
               <td width="15%"></td>
             </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([wordContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Request_${selectedRequest.eventTitle.replace(/\s+/g, '_')}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: EventStatus, size: 'sm' | 'lg' = 'sm') => {
    const styles = {
      Pending: 'bg-orange-100 text-orange-800 border-orange-200',
      Approved: 'bg-green-100 text-green-800 border-green-200',
      Rejected: 'bg-red-100 text-red-800 border-red-200',
      Canceled: 'bg-gray-100 text-gray-800 border-gray-200',
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      
      {/* LEFT COLUMN: Request List */}
      <div className="lg:col-span-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
        {/* List Header */}
        <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID or Title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-2 text-gray-500 pointer-events-none" size={14} />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:ring-1 focus:ring-primary outline-none appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            <div className="relative">
              <ListFilter className="absolute left-2.5 top-2 text-gray-500 pointer-events-none" size={14} />
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:ring-1 focus:ring-primary outline-none appearance-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FileText size={40} className="mx-auto mb-2 opacity-20" />
              <p>No requests found.</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => setSelectedRequest(event)}
                className={`
                  p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md group
                  ${selectedRequest?.id === event.id 
                    ? 'bg-green-50 border-green-500 ring-1 ring-green-500' 
                    : 'bg-white border-gray-200 hover:border-green-300'}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{event.facility}</span>
                  {getStatusBadge(event.status)}
                </div>
                <h3 className="text-gray-900 font-bold text-base truncate mb-2">{event.eventTitle}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1 rounded">#{event.id.slice(0,6)}</span>
                  <button className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View <Eye size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Request Details */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
        {selectedRequest ? (
          <>
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.eventTitle}</h2>
                <p className="text-sm text-gray-500 font-mono mt-1">ID: {selectedRequest.id}</p>
              </div>
              <div>
                {getStatusBadge(selectedRequest.status, 'lg')}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Event Details</h3>
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <span className="block text-xs text-gray-500">Requester</span>
                      <span className="font-medium text-gray-900">{selectedRequest.requesterName}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Facility</span>
                      <span className="font-medium text-gray-900">{selectedRequest.facility}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Date</span>
                      <span className="font-medium text-gray-900">{new Date(selectedRequest.date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Time Slot</span>
                      <span className="font-medium text-gray-900">{selectedRequest.timeSlot}</span>
                    </div>
                  </div>
                  
                  {(() => {
                    const amenities = getFacilityEquipment(selectedRequest.facility);
                    if (amenities.length > 0) {
                      return (
                         <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-2">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1.5">
                             <Info size={12} />
                             Facility Amenities (Included)
                           </div>
                           <div className="text-xs text-blue-700 leading-relaxed flex flex-wrap gap-1">
                             {amenities.map((item, idx) => (
                               <span key={idx} className="bg-white px-1.5 py-0.5 rounded border border-blue-200">
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
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Timing</h3>
                  <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-lg text-blue-900">
                    <Clock className="text-blue-600" />
                    <div>
                      <div className="text-sm font-semibold">Start Time</div>
                      <div className="text-lg font-bold">{selectedRequest.startTime}</div>
                    </div>
                    <div className="h-8 w-px bg-blue-200 mx-2"></div>
                    <div>
                      <div className="text-sm font-semibold">End Time</div>
                      <div className="text-lg font-bold">{selectedRequest.endTime}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Requested Equipment</h3>
                {selectedRequest.equipment.length > 0 ? (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedRequest.equipment.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle size={14} /> Available
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No equipment requested.</p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3 items-center justify-between">
              
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700 mr-2">Set Status:</span>
                  <div className="flex bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                    <button 
                      onClick={() => handleStatusChange('Pending')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${selectedRequest.status === 'Pending' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      Pending
                    </button>
                    <button 
                      onClick={() => handleStatusChange('Approved')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${selectedRequest.status === 'Approved' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      Approved
                    </button>
                    <button 
                      onClick={() => handleStatusChange('Rejected')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${selectedRequest.status === 'Rejected' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      Rejected
                    </button>
                    <button 
                      onClick={() => handleStatusChange('Canceled')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${selectedRequest.status === 'Canceled' ? 'bg-gray-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      Canceled
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* User only sees cancel if not already cancelled */}
                  {selectedRequest.status !== 'Canceled' && (
                    <button 
                      onClick={() => handleStatusChange('Canceled')}
                      className="px-3 py-2 text-xs font-bold rounded-md transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                 {isAdmin && (
                   <button 
                     onClick={() => setIsEditModalOpen(true)}
                     className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
                   >
                     <Edit size={16} /> Edit
                   </button>
                 )}
                 
                 <button 
                   onClick={handleDownloadWord}
                   className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
                 >
                   <FileText size={16} className="text-blue-600" /> Word
                 </button>
                 
                 {isAdmin && (
                   <button 
                     onClick={handleDeleteClick}
                     className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-bold hover:bg-red-100 transition-colors shadow-sm"
                   >
                     <Trash2 size={16} /> Delete
                   </button>
                 )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <FileText size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-600">No Request Selected</h3>
            <p className="text-sm">Select a request from the list to view details and manage actions.</p>
          </div>
        )}
      </div>

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
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">Delete Request?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Are you sure you want to delete this request? This action cannot be undone.
              </p>
              {selectedRequest && (
                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                  <span className="font-bold">{selectedRequest.eventTitle}</span>
                  <br/>
                  <span className="text-gray-500">{selectedRequest.date}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-bold text-sm transition-colors"
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
