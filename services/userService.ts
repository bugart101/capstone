import { User } from '../types';

const USERS_KEY = 'scheduler_users';

const getLocalUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const setLocalUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Seed default admin if not exists
if (!localStorage.getItem(USERS_KEY)) {
  const defaultAdmin: User = {
    id: '1',
    fullName: 'System Admin',
    username: 'admin',
    password: '123',
    email: 'admin@school.edu',
    role: 'ADMIN',
    createdAt: Date.now()
  };
  setLocalUsers([defaultAdmin]);
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    return getLocalUsers();
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    await new Promise(r => setTimeout(r, 500));
    const users = getLocalUsers();
    
    // Simple duplicate check
    if (users.some(u => u.username === user.username)) {
        throw new Error("Username already exists");
    }

    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    users.push(newUser);
    setLocalUsers(users);
    return newUser;
  },

  updateUser: async (user: User): Promise<User> => {
    await new Promise(r => setTimeout(r, 500));
    const users = getLocalUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      setLocalUsers(users);
      return user;
    }
    throw new Error('User not found');
  },

  deleteUser: async (id: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 500));
    const users = getLocalUsers();
    const filtered = users.filter(u => u.id !== id);
    setLocalUsers(filtered);
  }
};