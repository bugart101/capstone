import { User } from '../types';
import { userService } from './userService';

const SESSION_KEY = 'greensync_session';

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));

    const users = await userService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid username or password');
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }
};