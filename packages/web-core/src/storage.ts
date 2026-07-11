/**
 * Type-safe Storage utilities (localStorage & cookies) with SSR safety.
 */

// --- LOCAL STORAGE ---

export const safeLocalStorage = {
  /**
   * Check if localStorage is available (browser environment).
   */
  isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  },

  /**
   * Retrieve a parsed item from localStorage.
   */
  getItem<T>(key: string): T | null {
    if (!this.isAvailable()) return null;
    try {
      const value = window.localStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return null;
    }
  },

  /**
   * Write a serialized value to localStorage.
   */
  setItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.error(`Error writing localStorage key "${key}":`, e);
      return false;
    }
  },

  /**
   * Delete an item from localStorage.
   */
  removeItem(key: string): boolean {
    if (!this.isAvailable()) return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error deleting localStorage key "${key}":`, e);
      return false;
    }
  },

  /**
   * Clear all localStorage values.
   */
  clear(): boolean {
    if (!this.isAvailable()) return false;
    try {
      window.localStorage.clear();
      return true;
    } catch (e) {
      console.error("Error clearing localStorage:", e);
      return false;
    }
  },
};

// --- COOKIES ---

export interface CookieOptions {
  path?: string;
  domain?: domain;
  expires?: number | Date;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
}

type domain = string;

export const safeCookies = {
  /**
   * Check if document.cookie is available (browser environment).
   */
  isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.document !== "undefined"
    );
  },

  /**
   * Read a cookie value by name.
   */
  getItem(key: string): string | null {
    if (!this.isAvailable()) return null;
    try {
      const cookies = window.document.cookie.split("; ");
      for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name && value && decodeURIComponent(name) === key) {
          return decodeURIComponent(value);
        }
      }
      return null;
    } catch (e) {
      console.warn(`Error reading cookie "${key}":`, e);
      return null;
    }
  },

  /**
   * Set a cookie value with options.
   */
  setItem(key: string, value: string, options: CookieOptions = {}): boolean {
    if (!this.isAvailable()) return false;
    try {
      let cookieStr = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;

      const {
        path = "/",
        domain: cookieDomain,
        expires,
        secure = true,
        sameSite = "Lax",
      } = options;

      cookieStr += `; path=${path}`;

      if (cookieDomain) {
        cookieStr += `; domain=${cookieDomain}`;
      }

      if (expires) {
        if (typeof expires === "number") {
          const date = new Date();
          date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
          cookieStr += `; expires=${date.toUTCString()}`;
        } else {
          cookieStr += `; expires=${expires.toUTCString()}`;
        }
      }

      if (secure) {
        cookieStr += "; secure";
      }

      if (sameSite) {
        cookieStr += `; samesite=${sameSite.toLowerCase()}`;
      }

      window.document.cookie = cookieStr;
      return true;
    } catch (e) {
      console.error(`Error setting cookie "${key}":`, e);
      return false;
    }
  },

  /**
   * Delete a cookie.
   */
  removeItem(
    key: string,
    options: Pick<CookieOptions, "path" | "domain"> = {},
  ): boolean {
    return this.setItem(key, "", {
      ...options,
      expires: new Date(0),
    });
  },
};
