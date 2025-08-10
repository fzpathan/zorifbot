import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cachedFetch } from './apiCache';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriedBackend, setHasTriedBackend] = useState(false);

  // Fetch user from backend - no fallback
  const initializeUser = useCallback(async () => {
    if (hasTriedBackend && user) return; // Don't retry if already loaded
    
    setIsLoading(true);
    
    try {
      // Always get a new user from backend
      const response = await cachedFetch('/api/user', {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      }, 5 * 60 * 1000); // Cache for 5 minutes
      
      let userData;
      if (response.ok) {
        userData = await response.json();
      } else {
        throw new Error('Failed to get user from backend');
      }
      
      // Store user ID for future sessions
      localStorage.setItem('user-id', userData.id);
      setUser(userData);
      setHasTriedBackend(true);
      
      console.log('✅ User loaded from backend:', userData.id);
      
    } catch (error) {
      console.error('❌ Backend unavailable, cannot initialize user:', error.message);
      setHasTriedBackend(true);
      // Don't set any user - let the app handle the error state
    } finally {
      setIsLoading(false);
    }
  }, [hasTriedBackend, user]);

  // Initialize user on mount
  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

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

  // Retry backend connection
  const retryBackendConnection = useCallback(async () => {
    setHasTriedBackend(false);
    await initializeUser();
  }, [initializeUser]);

  const value = {
    user,
    isLoading,
    hasTriedBackend,
    updateUserPreferences,
    setSelectedCategory,
    removeSelectedCategory,
    retryBackendConnection,
    initializeUser,
    isBackendAvailable: hasTriedBackend && user !== null
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