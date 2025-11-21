import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  parseISO,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { EventRequest } from '../types';

interface CalendarProps {
  events: EventRequest[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: EventRequest) => void;
  onDateClick: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  events, 
  currentDate, 
  onDateChange,
  onEventClick,
  onDateClick
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
    return events.filter(event => isSameDay(parseISO(event.date), day));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-primary">
               <CalIcon size={24} />
               <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {format(currentDate, 'MMMM yyyy')}
               </h2>
           </div>
           <button 
              onClick={goToToday}
              className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
           >
            Today
           </button>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-7 flex-grow auto-rows-fr">
        {calendarDays.map((day, dayIdx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);

          return (
            <div 
              key={day.toString()} 
              onClick={() => onDateClick(day)}
              className={`
                min-h-[100px] border-b border-r border-gray-50 p-2 transition-colors relative group cursor-pointer
                ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-500' : 'bg-white text-gray-900'}
                ${isDayToday ? 'bg-blue-50/30' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span 
                  className={`
                    text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                    ${isDayToday ? 'bg-primary text-white shadow-md' : ''}
                  `}
                >
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <button
                    key={event.id}
                    title={`${event.startTime} - ${event.eventTitle}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className="w-full text-left text-xs px-2 py-1 rounded bg-green-50 border border-green-200 text-green-900 truncate hover:bg-green-100 hover:border-green-300 transition-colors flex items-center gap-1 group-hover/event:shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                    <span className="font-bold truncate">{event.startTime}</span>
                    <span className="truncate font-medium">- {event.eventTitle}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-600 pl-2 font-semibold">
                    + {dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};