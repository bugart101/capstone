import { User } from '../types';

const STORAGE_KEY = 'greensync_users';

const seedAdminUser = () => {
  const users = localStorage.getItem(STORAGE_KEY);
  if (!users) {
    const admin: User = {
      id: 'admin-1',
      fullName: 'System Admin',
      username: 'admin',
      password: '123',
      email: 'admin@school.edu',
      role: 'ADMIN',
      createdAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([admin]));
  }
};

export const userService = {
  getUsers: async (): Promise<User[]> => {
    seedAdminUser();
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const users = await userService.getUsers();
    
    if (users.some(u => u.username === user.username)) {
      throw new Error('Username already exists');
    }

    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return newUser;
  },

  updateUser: async (user: User): Promise<User> => {
    const users = await userService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index === -1) throw new Error('User not found');
    
    users[index] = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return user;
  },

  deleteUser: async (id: string): Promise<void> => {
    const users = await userService.getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};