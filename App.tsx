
import React, { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { EventForm } from './components/EventForm';
import { Modal } from './components/Modal';
import { RequestPage } from './components/RequestPage';
import { AccountPage } from './components/AccountPage';
import { FacilityPage } from './components/FacilityPage';
import { LoginPage } from './components/LoginPage';
import { NotificationCenter } from './components/NotificationCenter';
import { EventRequest, ViewState, Facility, User, AppNotification } from './types';
import { eventService } from './services/eventService';
import { facilityService } from './services/facilityService';
import { authService } from './services/authService';
import { notificationService } from './services/notificationService';
import { themeService } from './services/themeService';
import { Calendar as CalendarIcon, Clock, MapPin, User as UserIcon, Package, Menu, Home, ListChecks, UserCircle, Building2, Info, LogOut, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventRequest[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventRequest | null>(null);
  const [selectedDateForForm, setSelectedDateForForm] = useState<Date>(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  
  // Day View Modal State (for calendar overflow)
  const [dayViewData, setDayViewData] = useState<{date: Date, events: EventRequest[]} | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Initialize Theme
  useEffect(() => {
    themeService.init();
  }, []);

  // Check auth on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadData(user);
    }
  }, []);

  // Poll for updates (simulate realtime) every 60 seconds
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      loadData(currentUser);
    }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadData = async (user = currentUser) => {
    if (!user) return;
    
    const [eventData, facilityData] = await Promise.all([
      eventService.getEvents(),
      facilityService.getFacilities()
    ]);
    setEvents(eventData);
    setFacilities(facilityData);

    // Run notification scan
    const updatedNotifications = notificationService.scanForUpdates(eventData, user);
    setNotifications(updatedNotifications);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadData(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentView(ViewState.HOME);
    setNotifications([]);
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

  const handleMoreClick = (date: Date, events: EventRequest[]) => {
    setDayViewData({ date, events });
  };

  const handleNavClick = (view: ViewState) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleNotificationViewEvent = (eventId: string) => {
    // Find event, switch view, open modal
    const event = events.find(e => e.id === eventId);
    if (event) {
      // Decide which view is best. If it's the future, maybe Request view or Home view?
      // Let's go to Home view and open details modal
      setCurrentView(ViewState.HOME);
      setSelectedEvent(event);
      // If date is different, move calendar
      setCurrentDate(new Date(event.date));
    }
  };

  const getFacilityEquipment = (facilityName: string): string[] => {
    const facility = facilities.find(f => f.name === facilityName);
    return facility ? facility.equipment : [];
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
                onMoreClick={handleMoreClick}
              />
            </div>

            {/* Right Column: Form */}
            <div id="event-form-section" className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
                <EventForm 
                  onEventCreated={handleEventCreated} 
                  initialDate={selectedDateForForm}
                />
              </div>
            </div>
          </div>
        );
      case ViewState.REQUEST:
        return <RequestPage events={events} onEventsUpdate={() => loadData()} currentUser={currentUser} />;
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
    <div className="min-h-screen flex flex-col text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
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
            <h1 className="text-xl font-bold tracking-wide hidden md:block">Facility Management System</h1>
            <h1 className="text-lg font-bold tracking-wide md:hidden">FMS</h1>
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
             <div className="pl-6 border-l border-white/20 flex items-center gap-3">
                
                {/* Notification Center */}
                <NotificationCenter 
                  notifications={notifications} 
                  onNotificationsUpdate={setNotifications}
                  onViewEvent={handleNotificationViewEvent}
                  currentUserId={currentUser.id}
                  currentUserRole={currentUser.role}
                />

                <span className="text-white/80 text-xs font-semibold flex items-center gap-1">
                  <UserIcon size={12} /> {currentUser.username}
                </span>
                <button 
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-md text-sm font-bold transition-all border border-white/20 shadow-sm"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
             </div>
          </nav>

          {/* Mobile Actions (Menu + Notification) */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationCenter 
              notifications={notifications} 
              onNotificationsUpdate={setNotifications}
              onViewEvent={handleNotificationViewEvent}
              currentUserId={currentUser.id}
              currentUserRole={currentUser.role}
            />
            <button 
              className="text-white p-2 hover:bg-white/10 rounded transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          </div>
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
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-700 dark:text-gray-400 text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} Facility Management System. All rights reserved.</p>
        </div>
      </footer>

      {/* Day View Modal (Overflow) */}
      <Modal
         isOpen={!!dayViewData}
         onClose={() => setDayViewData(null)}
         title={dayViewData ? `Events for ${dayViewData.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'})}` : ''}
      >
         <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {dayViewData?.events.map(event => (
               <div 
                 key={event.id}
                 onClick={() => {
                    setDayViewData(null);
                    setSelectedEvent(event);
                 }}
                 className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between group transition-colors bg-white dark:bg-gray-800"
               >
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className={`
                           px-2 py-0.5 text-xs font-bold rounded-full border
                           ${event.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 
                             event.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                             event.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                             'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'}
                        `}>
                           {event.status}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                     </div>
                     <div className="font-semibold text-gray-800 dark:text-gray-200">{event.eventTitle}</div>
                     <div className="text-xs text-gray-500 dark:text-gray-400">{event.facility} • {event.requesterName}</div>
                  </div>
                  <div className="text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors">
                     <ChevronRight size={20} />
                  </div>
               </div>
            ))}
         </div>
         <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button 
              onClick={() => setDayViewData(null)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm font-bold transition-colors"
            >
              Close
            </button>
         </div>
      </Modal>

      {/* Event Details Modal (Only for Calendar View Details) */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Event Details"
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
               <h3 className="text-2xl font-bold text-primary mb-2 leading-tight">{selectedEvent.eventTitle}</h3>
               <div className="flex items-center gap-2">
                 <span className={`
                   px-3 py-1 rounded-full text-sm font-bold border
                   ${selectedEvent.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 
                     selectedEvent.status === 'Pending' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                     selectedEvent.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                     'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}
                 `}>
                   {selectedEvent.status}
                 </span>
                 <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">#{selectedEvent.id.slice(0, 6)}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start gap-4">
                <UserIcon className="text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0" size={22} />
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">Requester</span>
                  <span className="block text-gray-900 dark:text-gray-100 font-bold text-lg">{selectedEvent.requesterName}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CalendarIcon className="text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0" size={22} />
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">Date</span>
                  <span className="block text-gray-900 dark:text-gray-100 font-bold text-lg">
                    {new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0" size={22} />
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">Time</span>
                  <span className="block text-gray-900 dark:text-gray-100 font-bold text-lg">
                    {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                  </span>
                  <span className="block text-gray-600 dark:text-gray-300 font-medium text-base mt-0.5">{selectedEvent.timeSlot}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0" size={22} />
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">Facility</span>
                  <span className="block text-gray-900 dark:text-gray-100 font-bold text-lg">{selectedEvent.facility}</span>
                  
                  {/* Facility Equipment Display */}
                  {(() => {
                    const facilityEquipment = getFacilityEquipment(selectedEvent.facility);
                    if (facilityEquipment.length > 0) {
                      return (
                        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                          <div className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-1.5">
                             <Info size={14} /> Facility Amenities:
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-200 leading-relaxed">
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
                <div className="flex items-start gap-4 pt-2">
                  <Package className="text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0" size={22} />
                  <div className="flex-1">
                    <span className="block text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-2">Requested Equipment</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.equipment.map(eq => (
                        <span key={eq.id} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md border border-gray-200 dark:border-gray-600 shadow-sm">
                          {eq.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-6 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-base font-bold transition-colors border border-gray-200 dark:border-gray-600"
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
