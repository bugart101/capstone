
export interface Equipment {
  id: string;
  name: string;
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
  createdAt: number;
}
