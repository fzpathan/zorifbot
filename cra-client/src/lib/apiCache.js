// Simple in-memory cache for API responses
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + ttl);
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      // Expired or doesn't exist
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Get cache info for debugging
  getInfo() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton instance
const apiCache = new ApiCache();

// Enhanced fetch with caching
export async function cachedFetch(url, options = {}, cacheTTL) {
  // Prepend backend URL if it's a relative URL
  const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
  const cacheKey = `${fullUrl}_${JSON.stringify(options)}`;
  
  // Check cache first
  const cachedData = apiCache.get(cacheKey);
  if (cachedData && !options.force) {
    console.log(`Cache hit for: ${fullUrl}`);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(cachedData)
    });
  }

  console.log(`Cache miss for: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl, options);
    
    if (response.ok) {
      const data = await response.json();
      apiCache.set(cacheKey, data, cacheTTL);
      
      // Return a response-like object
      return {
        ok: true,
        status: response.status,
        json: () => Promise.resolve(data)
      };
    }
    
    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

// Utility to invalidate cache entries
export function invalidateCache(pattern) {
  const keys = Array.from(apiCache.cache.keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      apiCache.cache.delete(key);
      apiCache.timestamps.delete(key);
    }
  });
}

// Clear all cache
export function clearCache() {
  apiCache.clear();
}

export default apiCache;
