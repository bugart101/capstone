
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Calendar, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppNotification } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onNotificationsUpdate: (updated: AppNotification[]) => void;
  onViewEvent: (eventId: string) => void;
  currentUserId: string;
  currentUserRole: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onNotificationsUpdate,
  onViewEvent,
  currentUserId,
  currentUserRole
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    const updated = notificationService.markAllAsRead(currentUserId, currentUserRole);
    onNotificationsUpdate(updated);
  };

  const handleClearAll = () => {
    const updated = notificationService.clearAll(currentUserId, currentUserRole);
    onNotificationsUpdate(updated);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      const updated = notificationService.markAsRead(notification.id, currentUserId, currentUserRole);
      onNotificationsUpdate(updated);
    }
    if (notification.relatedEventId) {
      onViewEvent(notification.relatedEventId);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE': return <CheckCircle2 size={16} className="text-green-600" />;
      case 'NEW_REQUEST': return <AlertCircle size={16} className="text-blue-600" />;
      case 'UPCOMING_EVENT': return <Calendar size={16} className="text-orange-600" />;
      default: return <Info size={16} className="text-gray-600" />;
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 text-white/90 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-primary animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 animate-fade-in origin-top-right overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700">Notifications</h3>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:text-primary-hover font-medium px-2 py-1 rounded hover:bg-primary-light transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group
                      ${!notification.read ? 'bg-blue-50/40' : 'bg-white'}
                    `}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-full h-fit flex-shrink-0 ${!notification.read ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className={`text-sm ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-snug mb-1.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">
                          {getTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
