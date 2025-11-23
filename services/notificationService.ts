
import { AppNotification, EventRequest, User } from '../types';
import { differenceInMinutes } from 'date-fns';

const NOTIFICATION_KEY = 'greensync_notifications';
const SNAPSHOT_KEY = 'greensync_event_snapshot';

interface EventSnapshot {
  [id: string]: EventRequest;
}

// Safe ID generator for mobile/non-secure contexts where crypto.randomUUID might fail
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const notificationService = {
  // Helper to get all notifications from storage
  getAllRaw: (): AppNotification[] => {
    const data = localStorage.getItem(NOTIFICATION_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Get notifications filtered for a specific user
  getNotifications: (userId: string, role: string): AppNotification[] => {
    const all = notificationService.getAllRaw();
    return all.filter(n => 
      n.recipientId === userId || 
      (role === 'ADMIN' && n.recipientId === 'ROLE:ADMIN')
    );
  },

  // Save full list of notifications
  saveNotifications: (notifications: AppNotification[]) => {
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
  },

  // Mark specific notification as read (returns filtered list for UI)
  markAsRead: (id: string, userId: string, role: string) => {
    const list = notificationService.getAllRaw();
    const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
    notificationService.saveNotifications(updated);
    return notificationService.getNotifications(userId, role);
  },

  // Mark all visible notifications as read
  markAllAsRead: (userId: string, role: string) => {
    const list = notificationService.getAllRaw();
    const updated = list.map(n => {
      // Only mark read if it belongs to this user
      if (n.recipientId === userId || (role === 'ADMIN' && n.recipientId === 'ROLE:ADMIN')) {
        return { ...n, read: true };
      }
      return n;
    });
    notificationService.saveNotifications(updated);
    return notificationService.getNotifications(userId, role);
  },

  // Clear user's notifications
  clearAll: (userId: string, role: string) => {
    const list = notificationService.getAllRaw();
    // Keep notifications that DO NOT belong to this user
    const kept = list.filter(n => 
      !(n.recipientId === userId || (role === 'ADMIN' && n.recipientId === 'ROLE:ADMIN'))
    );
    notificationService.saveNotifications(kept);
    return [];
  },

  // Core Logic: Scan for updates and generate targeted notifications
  scanForUpdates: (currentEvents: EventRequest[], currentUser: User): AppNotification[] => {
    const existingNotifications = notificationService.getAllRaw();
    const newNotifications: AppNotification[] = [];
    
    // 1. Load Snapshot
    const snapshotJson = localStorage.getItem(SNAPSHOT_KEY);
    const snapshot: EventSnapshot = snapshotJson ? JSON.parse(snapshotJson) : {};
    
    // 2. Iterate through current events to find changes
    currentEvents.forEach(event => {
      const oldVersion = snapshot[event.id];

      // CHECK: Status Changes
      // Notification goes to the EVENT OWNER
      if (oldVersion && oldVersion.status !== event.status) {
        newNotifications.push({
          id: generateId(),
          type: 'STATUS_CHANGE',
          title: 'Request Updated',
          message: `Your request "${event.eventTitle}" is now ${event.status}.`,
          timestamp: Date.now(),
          read: false,
          relatedEventId: event.id,
          recipientId: event.userId // Target the creator
        });
      }

      // CHECK: New Requests
      // Notification goes to ADMINS
      if (!oldVersion && event.status === 'Pending') {
        newNotifications.push({
          id: generateId(),
          type: 'NEW_REQUEST',
          title: 'New Request Received',
          message: `${event.requesterName} requested "${event.eventTitle}".`,
          timestamp: Date.now(),
          read: false,
          relatedEventId: event.id,
          recipientId: 'ROLE:ADMIN' // Target all admins
        });
      }

      // CHECK: Upcoming Events
      // Notification goes to EVENT OWNER (and maybe admins)
      if (event.status === 'Approved') {
        const hasBeenAlerted = existingNotifications.some(n => 
          n.relatedEventId === event.id && 
          n.type === 'UPCOMING_EVENT' &&
          (Date.now() - n.timestamp) < 24 * 60 * 60 * 1000 // Alerted in last 24h
        );

        if (!hasBeenAlerted) {
          const eventDateStr = event.date;
          const startTimeStr = event.startTime;
          const [year, month, day] = eventDateStr.split('-').map(Number);
          const [hours, minutes] = startTimeStr.split(':').map(Number);
          const eventStart = new Date(year, month - 1, day, hours, minutes);
          const now = new Date();
          const diffMinutes = differenceInMinutes(eventStart, now);
          
          if (diffMinutes >= 0 && diffMinutes <= 60) {
             // Notify Owner
             newNotifications.push({
               id: generateId(),
               type: 'UPCOMING_EVENT',
               title: 'Event Starting Soon',
               message: `"${event.eventTitle}" starts in ${diffMinutes} minutes at ${event.facility}.`,
               timestamp: Date.now(),
               read: false,
               relatedEventId: event.id,
               recipientId: event.userId
             });
             
             // Also Notify Admin
             newNotifications.push({
                id: generateId(),
                type: 'UPCOMING_EVENT',
                title: 'Event Starting Soon',
                message: `"${event.eventTitle}" starts in ${diffMinutes} minutes.`,
                timestamp: Date.now(),
                read: false,
                relatedEventId: event.id,
                recipientId: 'ROLE:ADMIN'
             });
          }
        }
      }
    });

    // 3. Update Snapshot
    const newSnapshot: EventSnapshot = {};
    currentEvents.forEach(e => newSnapshot[e.id] = e);
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(newSnapshot));

    // 4. Combine, Save, and Return filtered for Current User
    if (newNotifications.length > 0) {
      const updatedList = [...newNotifications, ...existingNotifications];
      const trimmedList = updatedList.slice(0, 100); // Keep last 100 global notifications
      notificationService.saveNotifications(trimmedList);
      
      // Return only what the current user should see
      return trimmedList.filter(n => 
        n.recipientId === currentUser.id || 
        (currentUser.role === 'ADMIN' && n.recipientId === 'ROLE:ADMIN')
      );
    }

    // Return existing filtered
    return existingNotifications.filter(n => 
        n.recipientId === currentUser.id || 
        (currentUser.role === 'ADMIN' && n.recipientId === 'ROLE:ADMIN')
    );
  }
};
