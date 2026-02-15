// Browser localStorage wrapper to replace window.storage API
export const storage = {
  async get(key: string): Promise<{ value: string } | null> {
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage delete error:', error);
    }
  }
};

// Declare global interface for TypeScript
declare global {
  interface Window {
    storage: typeof storage;
  }
}

// Initialize window.storage
if (typeof window !== 'undefined') {
  window.storage = storage;
}
