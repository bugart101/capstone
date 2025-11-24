
import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addMonths, 
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { EventRequest } from '../types';

interface CalendarProps {
  events: EventRequest[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: EventRequest) => void;
  onDateClick: (date: Date) => void;
  onMoreClick: (date: Date, events: EventRequest[]) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  events, 
  currentDate, 
  onDateChange,
  onEventClick,
  onDateClick,
  onMoreClick
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const nextMonth = () => onDateChange(addMonths(currentDate, 1));
  const prevMonth = () => onDateChange(subMonths(currentDate, 1));
  const goToToday = () => onDateChange(new Date());

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    return events
      .filter(event => {
        if (event.dates && event.dates.length > 0) {
          return event.dates.includes(dayStr);
        }
        return event.date === dayStr;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-500';
      case 'Pending': return 'bg-orange-500';
      case 'Rejected': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Limit how many events show as text pills before the "More" button
  const MAX_VISIBLE_EVENTS_DESKTOP = 3;
  const MAX_VISIBLE_DOTS_MOBILE = 4;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 md:gap-4">
           <div className="flex items-center gap-2 text-primary">
               <CalIcon size={20} className="md:w-6 md:h-6" />
               <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {format(currentDate, 'MMMM yyyy')}
               </h2>
           </div>
           <button 
              onClick={goToToday}
              className="text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
           >
            Today
           </button>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {weekDays.map(day => (
          <div key={day} className="py-2 md:py-3 text-center text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-7 flex-grow auto-rows-fr bg-gray-200 dark:bg-gray-700 gap-px border-b border-gray-200 dark:border-gray-700">
        {calendarDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);
          
          return (
            <div 
              key={day.toString()} 
              onClick={() => onDateClick(day)}
              className={`
                min-h-[80px] md:min-h-[120px] p-1 md:p-1.5 transition-colors relative group cursor-pointer flex flex-col
                ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'}
                ${isDayToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span 
                  className={`
                    text-xs md:text-sm font-semibold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full
                    ${isDayToday ? 'bg-primary text-white shadow-md' : ''}
                  `}
                >
                  {format(day, 'd')}
                </span>
              </div>
              
              {/* MOBILE VIEW: Dots / Indicators */}
              <div 
                className="md:hidden flex-1 flex flex-col items-center justify-center gap-1"
                onClick={(e) => {
                   if (dayEvents.length > 0) {
                     e.stopPropagation();
                     onMoreClick(day, dayEvents);
                   }
                }}
              >
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center max-w-full px-0.5">
                    {dayEvents.slice(0, MAX_VISIBLE_DOTS_MOBILE).map(event => (
                      <div 
                        key={event.id} 
                        className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(event.status)}`} 
                      />
                    ))}
                    {dayEvents.length > MAX_VISIBLE_DOTS_MOBILE && (
                       <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 leading-none">+{dayEvents.length - MAX_VISIBLE_DOTS_MOBILE}</span>
                    )}
                  </div>
                )}
                {dayEvents.length > 0 && <div className="absolute inset-x-0 bottom-0 h-2/3 bg-transparent" />}
              </div>

              {/* DESKTOP VIEW: Text Pills & Compact List */}
              <div className="hidden md:flex flex-1 flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, MAX_VISIBLE_EVENTS_DESKTOP).map(event => (
                  <button
                    key={event.id}
                    title={`${formatTime(event.startTime)} - ${event.eventTitle}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`
                      w-full text-left text-[10px] px-1.5 py-0.5 rounded border truncate transition-all shadow-sm flex items-center gap-1.5
                      ${event.status === 'Approved' ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/50' : 
                        event.status === 'Pending' ? 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/50' : 
                        event.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/50' :
                        'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'}
                    `}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusColorClass(event.status)}`}></span>
                    <span className="font-bold flex-shrink-0">{formatTime(event.startTime)}</span>
                    <span className="opacity-90 truncate">{event.eventTitle}</span>
                  </button>
                ))}
                
                {/* Show More Button */}
                {dayEvents.length > MAX_VISIBLE_EVENTS_DESKTOP && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreClick(day, dayEvents);
                    }}
                    className="mt-auto w-full text-left text-[10px] font-bold text-gray-500 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 rounded px-1 py-0.5 transition-colors flex items-center gap-1"
                  >
                    <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-sm w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold">
                      {dayEvents.length - MAX_VISIBLE_EVENTS_DESKTOP}+
                    </span>
                    more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
