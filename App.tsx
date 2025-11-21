
import React, { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { EventForm } from './components/EventForm';
import { Modal } from './components/Modal';
import { RequestPage } from './components/RequestPage';
import { AccountPage } from './components/AccountPage';
import { FacilityPage } from './components/FacilityPage';
import { LoginPage } from './components/LoginPage';
import { EventRequest, ViewState, Facility, User } from './types';
import { eventService } from './services/eventService';
import { facilityService } from './services/facilityService';
import { authService } from './services/authService';
import { Calendar as CalendarIcon, Clock, MapPin, User as UserIcon, Package, Menu, Home, ListChecks, UserCircle, Building2, Info, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventRequest[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventRequest | null>(null);
  const [selectedDateForForm, setSelectedDateForForm] = useState<Date>(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  
  // Check auth on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadData();
    }
  }, []);

  const loadData = async () => {
    const [eventData, facilityData] = await Promise.all([
      eventService.getEvents(),
      facilityService.getFacilities()
    ]);
    setEvents(eventData);
    setFacilities(facilityData);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadData();
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentView(ViewState.HOME);
  };

  const handleEventCreated = () => {
    loadData();
  };

  const handleDateClick = (date: Date) => {
    setSelectedDateForForm(date);
    const formElement = document.getElementById('event-form-section');
    if (formElement && window.innerWidth < 768) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (view: ViewState) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const getFacilityEquipment = (facilityName: string): string[] => {
    const facility = facilities.find(f => f.name === facilityName);
    return facility ? facility.equipment : [];
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.role === 'ADMIN';

  const renderContent = () => {
    switch (currentView) {
      case ViewState.HOME:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left Column: Calendar */}
            <div className="lg:col-span-2 min-h-[600px]">
              <Calendar 
                events={events}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onEventClick={setSelectedEvent}
                onDateClick={handleDateClick}
              />
            </div>

            {/* Right Column: Form */}
            <div id="event-form-section" className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                <EventForm 
                  onEventCreated={handleEventCreated} 
                  initialDate={selectedDateForForm}
                />
              </div>
            </div>
          </div>
        );
      case ViewState.REQUEST:
        return <RequestPage events={events} onEventsUpdate={loadData} currentUser={currentUser} />;
      case ViewState.ACCOUNT:
        return <AccountPage />;
      case ViewState.FACILITY:
        // Protect facility route logic, though UI is hidden
        return isAdmin ? <FacilityPage /> : <div className="p-4 text-red-500">Access Denied</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-gray-900 bg-gray-50">
      {/* Header */}
      <header className="bg-primary shadow-md z-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 text-white cursor-pointer"
            onClick={() => setCurrentView(ViewState.HOME)}
          >
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <CalendarIcon size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-wide">Admin Scheduler</h1>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
             <ul className="flex items-center gap-6">
               <li>
                 <button 
                   onClick={() => setCurrentView(ViewState.HOME)}
                   className={`text-white/90 hover:text-white font-medium text-sm transition-colors relative group flex items-center gap-2 ${currentView === ViewState.HOME ? 'text-white font-bold' : ''}`}
                 >
                   <Home size={18} /> Home
                   <span className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all ${currentView === ViewState.HOME ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                 </button>
               </li>
               <li>
                 <button 
                   onClick={() => setCurrentView(ViewState.REQUEST)}
                   className={`text-white/90 hover:text-white font-medium text-sm transition-colors relative group flex items-center gap-2 ${currentView === ViewState.REQUEST ? 'text-white font-bold' : ''}`}
                 >
                   <ListChecks size={18} /> Request
                   <span className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all ${currentView === ViewState.REQUEST ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                 </button>
               </li>
               <li>
                 <button 
                   onClick={() => setCurrentView(ViewState.ACCOUNT)}
                   className={`text-white/90 hover:text-white font-medium text-sm transition-colors relative group flex items-center gap-2 ${currentView === ViewState.ACCOUNT ? 'text-white font-bold' : ''}`}
                 >
                   <UserCircle size={18} /> Account
                   <span className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all ${currentView === ViewState.ACCOUNT ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                 </button>
               </li>
               {isAdmin && (
                 <li>
                   <button 
                     onClick={() => setCurrentView(ViewState.FACILITY)}
                     className={`text-white/90 hover:text-white font-medium text-sm transition-colors relative group flex items-center gap-2 ${currentView === ViewState.FACILITY ? 'text-white font-bold' : ''}`}
                   >
                     <Building2 size={18} /> Facility
                     <span className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all ${currentView === ViewState.FACILITY ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                   </button>
                 </li>
               )}
             </ul>
             <div className="pl-6 border-l border-white/20 flex items-center gap-4">
                <span className="text-white/80 text-xs font-semibold flex items-center gap-1">
                  <UserIcon size={12} /> {currentUser.username}
                </span>
                <button 
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-all border border-white/20 shadow-sm flex items-center gap-2"
                >
                  <LogOut size={14} /> Logout
                </button>
             </div>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white p-2 hover:bg-white/10 rounded transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-primary border-t border-white/10 px-4 pt-2 pb-4 space-y-1 absolute w-full shadow-xl z-30 animate-fade-in">
            <button
              onClick={() => handleNavClick(ViewState.HOME)}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2 ${currentView === ViewState.HOME ? 'bg-white/10' : ''}`}
            >
              <Home size={18} /> Home
            </button>
            <button
              onClick={() => handleNavClick(ViewState.REQUEST)}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2 ${currentView === ViewState.REQUEST ? 'bg-white/10' : ''}`}
            >
              <ListChecks size={18} /> Request
            </button>
            <button
              onClick={() => handleNavClick(ViewState.ACCOUNT)}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2 ${currentView === ViewState.ACCOUNT ? 'bg-white/10' : ''}`}
            >
              <UserCircle size={18} /> Account
            </button>
            {isAdmin && (
              <button
                onClick={() => handleNavClick(ViewState.FACILITY)}
                className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2 ${currentView === ViewState.FACILITY ? 'bg-white/10' : ''}`}
              >
                <Building2 size={18} /> Facility
              </button>
            )}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between px-3">
              <span className="text-white/80 text-sm font-medium">{currentUser.username}</span>
              <button 
                onClick={handleLogout}
                className="text-white font-bold flex items-center gap-2 bg-white/10 px-3 py-1 rounded"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-700 text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} Admin Scheduler. All rights reserved.</p>
        </div>
      </footer>

      {/* Event Details Modal (Only for Calendar View Details) */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Event Details"
      >
        {selectedEvent && (
          <div className="space-y-5">
            <div className="border-b border-gray-100 pb-4">
               <h3 className="text-xl font-bold text-primary mb-1">{selectedEvent.eventTitle}</h3>
               <p className="text-sm text-gray-600 flex items-center gap-2">
                 <span className={`
                   px-2 py-0.5 rounded-full text-xs font-bold
                   ${selectedEvent.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                     selectedEvent.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                     selectedEvent.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                     'bg-gray-100 text-gray-800'}
                 `}>
                   {selectedEvent.status}
                 </span>
                 <span className="text-gray-500">ID: {selectedEvent.id.slice(0, 8)}</span>
               </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-3">
                <UserIcon className="text-gray-500 mt-0.5" size={18} />
                <div>
                  <span className="block text-xs text-gray-700 uppercase font-bold tracking-wide">Requester</span>
                  <span className="text-gray-900 font-semibold text-base">{selectedEvent.requesterName}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarIcon className="text-gray-500 mt-0.5" size={18} />
                <div>
                  <span className="block text-xs text-gray-700 uppercase font-bold tracking-wide">Date</span>
                  <span className="text-gray-900 font-semibold text-base">{new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="text-gray-500 mt-0.5" size={18} />
                <div>
                  <span className="block text-xs text-gray-700 uppercase font-bold tracking-wide">Time</span>
                  <span className="text-gray-900 font-semibold text-base">{selectedEvent.startTime} - {selectedEvent.endTime} <span className="text-gray-600 font-normal">({selectedEvent.timeSlot})</span></span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="text-gray-500 mt-0.5" size={18} />
                <div>
                  <span className="block text-xs text-gray-700 uppercase font-bold tracking-wide">Facility</span>
                  <span className="text-gray-900 font-semibold text-base">{selectedEvent.facility}</span>
                  
                  {/* Facility Equipment Display */}
                  {(() => {
                    const facilityEquipment = getFacilityEquipment(selectedEvent.facility);
                    if (facilityEquipment.length > 0) {
                      return (
                        <div className="mt-2 bg-blue-50 p-2 rounded border border-blue-100">
                          <div className="text-xs font-bold text-blue-800 flex items-center gap-1 mb-1">
                             <Info size={10} /> Facility Amenities:
                          </div>
                          <div className="text-xs text-blue-700 leading-relaxed">
                             {facilityEquipment.join(', ')}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              
              {selectedEvent.equipment.length > 0 && (
                <div className="flex items-start gap-3 pt-2">
                  <Package className="text-gray-500 mt-0.5" size={18} />
                  <div className="flex-1">
                    <span className="block text-xs text-gray-700 uppercase font-bold tracking-wide mb-1">Requested Equipment</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.equipment.map(eq => (
                        <span key={eq.id} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded border border-gray-200">
                          {eq.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-md text-sm font-bold transition-colors border border-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default App;
