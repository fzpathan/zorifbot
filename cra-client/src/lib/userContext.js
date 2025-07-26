import { createContext, useContext, useState, useCallback } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    id: 'default-user-123', // Default user ID for testing
    name: 'Test User',
    preferences: {
      selectedCategory: null, // Only one category allowed
      modelPreference: 'phi4'
    }
  });

  const updateUserPreferences = useCallback((updates) => {
    setUser(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...updates
      }
    }));
  }, []);

  const setSelectedCategory = useCallback((category) => {
    setUser(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        selectedCategory: category
      }
    }));
  }, []);

  const removeSelectedCategory = useCallback(() => {
    setUser(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        selectedCategory: null
      }
    }));
  }, []);

  const value = {
    user,
    updateUserPreferences,
    setSelectedCategory,
    removeSelectedCategory
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 