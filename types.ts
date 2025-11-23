
export interface Equipment {
  id: string;
  name: string;
  status: 'Available' | 'Unavailable';
}

export type EventStatus = 'Pending' | 'Approved' | 'Rejected' | 'Canceled';

export interface EventRequest {
  id: string;
  userId: string; // Link request to specific user
  requesterName: string;
  eventTitle: string;
  facility: string;
  date: string; // ISO Date string YYYY-MM-DD
  timeSlot: string; // e.g., "Morning", "Afternoon" or specific range
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  equipment: Equipment[];
  status: EventStatus;
  createdAt: number;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: EventRequest[];
}

export enum ViewState {
  HOME = 'HOME',
  REQUEST = 'REQUEST',
  ACCOUNT = 'ACCOUNT',
  FACILITY = 'FACILITY'
}

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  username: string;
  password?: string; // Optional for display/interface purposes, in real app handle securely
  email: string;
  role: UserRole;
  createdAt: number;
}

export interface Facility {
  id: string;
  name: string;
  equipment: string[]; // List of available equipment names
  color: string; // Hex code for visual identification
  createdAt: number;
}

export type NotificationType = 'STATUS_CHANGE' | 'NEW_REQUEST' | 'UPCOMING_EVENT' | 'INFO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  relatedEventId?: string;
  recipientId: string; // ID of the user who should receive this, or 'ROLE:ADMIN'
}

export interface ThemePreferences {
  mode: 'light' | 'dark';
  primaryColor: string;
}