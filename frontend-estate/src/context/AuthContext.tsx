import React, { useEffect, useState, createContext, useContext } from 'react';
import api from '../api';


interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'resident' | 'security';
  estateId?: string;
  subscription_active?: boolean;
}


interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  home_address: string;
  house_type: string;
  role: string;
  resident_type: string;
  estate: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const getCsrfToken = async () => {
    try {
      await api.get('/api/csrf-cookie/');
    } catch (error) {
      // console.error('Failed to fetch CSRF token:', error);
      throw new Error('Could not fetch CSRF token.');
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      await getCsrfToken();
  
      const response = await api.post('/api/auth/login/', { email, password });
      // console.log('Login response:', response.data);
  
      const { id, first_name, last_name, email: userEmail, role, estate, subscription_active } = response.data.user;
  
      const loggedInUser: User = {
        id: id.toString(),
        name: `${first_name} ${last_name}`,
        email: userEmail,
        role: role.toLowerCase() as 'admin' | 'resident' | 'security',
        estateId: estate?.toString() || undefined,
        subscription_active: subscription_active ?? true
      };
  
      setUser(loggedInUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      return loggedInUser;
  
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data) {
        const backendMessage = error.response.data.detail || JSON.stringify(error.response.data);
        throw new Error(backendMessage);
      } else {
        throw new Error('An unexpected error occurred.');
      }
    }
  };
  

  const register = async (userData: RegisterData) => {
    try {
      await getCsrfToken();

      await api.post('/api/auth/register/', userData);
      console.log('Registration successful');
    } catch (error: any) {
      if (error.response?.data) {
        const backendMessage = error.response.data.detail || JSON.stringify(error.response.data);
        throw new Error(backendMessage);
      } else {
        throw new Error('An unexpected error occurred.');
      }
    }
  };

  const logout = async () => {
    try {
      await getCsrfToken();
      await api.post('/api/auth/logout/');
    } catch (error) {
      // console.error('Logout error (possibly session expired):', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
