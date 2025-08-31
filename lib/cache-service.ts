export interface CacheEntry<T> {
  value: T;
  expires: number | null;
  created: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 300000) { // 5 minutes default
    // Start periodic cleanup
    this.startCleanup(cleanupIntervalMs);
  }

  // Generate unique session ID
  generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session:${timestamp}:${random}`;
  }

  // Set cache entry with optional TTL
  set<T>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const expires = ttlMs ? now + ttlMs : null;
    
    this.cache.set(key, {
      value,
      expires,
      created: now
    });

    console.log(`Cache set: ${key} (TTL: ${ttlMs ? `${ttlMs}ms` : 'none'})`);
  }

  // Get cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      console.log(`Cache expired and removed: ${key}`);
      return null;
    }

    console.log(`Cache hit: ${key}`);
    return entry.value as T;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete specific key
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  // Clear all cache entries
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`Cache cleared: ${size} entries removed`);
  }

  // Get cache statistics
  getStats(): { size: number; expired: number; active: number } {
    let expired = 0;
    let active = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires && now > entry.expires) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      size: this.cache.size,
      expired,
      active
    };
  }

  // Generate cache key for campaign session
  generateCampaignKey(sessionId: string, agentId: string, step: string): string {
    return `${sessionId}:agent:${agentId}:${step}`;
  }

  // Cache campaign response
  setCampaignResponse(
    sessionId: string, 
    agentId: string, 
    response: any, 
    ttlMs: number = 900000 // 15 minutes default
  ): string {
    const key = this.generateCampaignKey(sessionId, agentId, 'response');
    this.set(key, response, ttlMs);
    return key;
  }

  // Get cached campaign response
  getCampaignResponse(sessionId: string, agentId: string): any | null {
    const key = this.generateCampaignKey(sessionId, agentId, 'response');
    return this.get(key);
  }

  // Cache streaming messages as they arrive
  setCampaignMessages(
    sessionId: string, 
    agentId: string, 
    messages: any[], 
    ttlMs: number = 1800000 // 30 minutes default
  ): string {
    const key = this.generateCampaignKey(sessionId, agentId, 'messages');
    this.set(key, messages, ttlMs);
    return key;
  }

  // Get cached streaming messages
  getCampaignMessages(sessionId: string, agentId: string): any[] | null {
    const key = this.generateCampaignKey(sessionId, agentId, 'messages');
    return this.get(key);
  }

  // Cache research results
  setResearchResults(
    sessionId: string, 
    research: any, 
    ttlMs: number = 3600000 // 1 hour default
  ): string {
    const key = `${sessionId}:research`;
    this.set(key, research, ttlMs);
    return key;
  }

  // Get cached research results
  getResearchResults(sessionId: string): any | null {
    const key = `${sessionId}:research`;
    return this.get(key);
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires && now > entry.expires) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`Cache cleanup: ${removed} expired entries removed`);
    }
  }

  // Start periodic cleanup
  private startCleanup(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  // Stop periodic cleanup
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Get all keys (for debugging)
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get entry info (for debugging)
  getEntryInfo(key: string): { exists: boolean; expired?: boolean; age?: number } {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { exists: false };
    }

    const now = Date.now();
    const expired = entry.expires ? now > entry.expires : false;
    const age = now - entry.created;

    return {
      exists: true,
      expired,
      age
    };
  }
}

// Global cache instance
export const cacheService = new CacheService();