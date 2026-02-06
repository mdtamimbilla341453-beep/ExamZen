
const SESSION_KEY = 'examzen_auth_session';
const USERS_KEY = 'examzen_users';

interface UserData {
  username: string;
  password: string; // In a real app, this should be hashed.
}

export const authService = {
  login: async (username: string, pass: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const usersRaw = localStorage.getItem(USERS_KEY);
      const users: UserData[] = usersRaw ? JSON.parse(usersRaw) : [];

      const user = users.find(u => u.username === username && u.password === pass);

      if (user) {
        localStorage.setItem(SESSION_KEY, 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  },

  signup: async (username: string, pass: string): Promise<boolean> => {
     // Simulate network delay
     await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const usersRaw = localStorage.getItem(USERS_KEY);
      const users: UserData[] = usersRaw ? JSON.parse(usersRaw) : [];

      // Check if user exists
      if (users.find(u => u.username === username)) {
        return false;
      }

      // Add new user
      users.push({ username, password: pass });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    // Force reload to clear React state if needed, or handled by parent state
    window.location.reload();
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem(SESSION_KEY) === 'true';
  }
};
