import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cachedFetch } from './apiCache';

const UserContext = createContext();

// Fallback user when backend is unavailable
const FALLBACK_USER = {
  id: 'offline-user-' + Date.now().toString(36),
  name: 'Offline User',
  preferences: {
    selectedCategory: null,
    modelPreference: 'phi4'
  },
  source: 'fallback',
  createdAt: new Date().toISOString()
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriedBackend, setHasTriedBackend] = useState(false);

  // Fetch user from backend with fallback
  const initializeUser = useCallback(async () => {
    if (hasTriedBackend && user) return; // Don't retry if already loaded
    
    setIsLoading(true);
    
    try {
      // Check if we have a stored user ID
      const storedUserId = localStorage.getItem('user-id');
      
      let userData;
      if (storedUserId) {
        // Try to fetch existing user
        try {
          const response = await cachedFetch(`/api/user/${storedUserId}`, {
            signal: AbortSignal.timeout(3000) // 3 second timeout
          }, 5 * 60 * 1000); // Cache for 5 minutes
          
          if (response.ok) {
            userData = await response.json();
          } else {
            throw new Error('User not found');
          }
        } catch (err) {
          console.warn('Failed to fetch existing user, getting new default user');
          // If existing user fetch fails, get a new default user
          const response = await cachedFetch('/api/user/default', {
            signal: AbortSignal.timeout(3000)
          }, 5 * 60 * 1000);
          
          if (response.ok) {
            userData = await response.json();
          } else {
            throw new Error('Failed to get default user');
          }
        }
      } else {
        // No stored user, get default from backend
        const response = await cachedFetch('/api/user/default', {
          signal: AbortSignal.timeout(3000)
        }, 5 * 60 * 1000);
        
        if (response.ok) {
          userData = await response.json();
        } else {
          throw new Error('Failed to get default user');
        }
      }
      
      // Store user ID for future sessions
      localStorage.setItem('user-id', userData.id);
      setUser(userData);
      setHasTriedBackend(true);
      
      console.log('✅ User loaded from backend:', userData.id);
      
    } catch (error) {
      console.warn('⚠️ Backend unavailable, using fallback user:', error.message);
      
      // Use fallback user when backend is unavailable
      const fallbackUser = {
        ...FALLBACK_USER,
        id: localStorage.getItem('user-id') || FALLBACK_USER.id
      };
      
      // Store fallback user ID
      localStorage.setItem('user-id', fallbackUser.id);
      setUser(fallbackUser);
      setHasTriedBackend(true);
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
    initializeUser
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