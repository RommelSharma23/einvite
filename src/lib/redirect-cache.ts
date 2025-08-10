// File: src/lib/redirect-cache.ts

import { 
  RedirectCacheEntry, 
  CacheOptions, 
  CacheStats,
  type DomainConfig 
} from '@/types/domain'

/**
 * High-performance in-memory cache for domain redirects
 * Optimized for fast lookups during redirect checks
 */
export class RedirectCache {
  private cache = new Map<string, RedirectCacheEntry>()
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 }
  private cleanupInterval: NodeJS.Timeout | null = null
  private options: CacheOptions

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 1000, // 1000 entries max
      enableCleanup: options.enableCleanup !== false // enabled by default
    }

    // Start cleanup interval if enabled
    if (this.options.enableCleanup) {
      this.startCleanupInterval()
    }
  }

  /**
   * Get redirect information for a subdomain
   */
  get(subdomain: string): RedirectCacheEntry | null {
    const entry = this.cache.get(subdomain)
    
    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(subdomain)
      this.stats.misses++
      this.updateStats()
      return null
    }

    this.stats.hits++
    this.updateHitRate()
    return entry
  }

  /**
   * Set redirect information for a subdomain
   */
  set(subdomain: string, customDomain: string | null, shouldRedirect: boolean = true): void {
    // Enforce max size limit
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest()
    }

    const entry: RedirectCacheEntry = {
      subdomain,
      customDomain,
      shouldRedirect: shouldRedirect && customDomain !== null,
      timestamp: Date.now(),
      ttl: this.options.ttl
    }

    this.cache.set(subdomain, entry)
    this.updateStats()
  }

  /**
   * Set multiple entries at once (bulk operation)
   */
  setMany(entries: Array<{
    subdomain: string
    customDomain: string | null
    shouldRedirect?: boolean
  }>): void {
    for (const entry of entries) {
      this.set(entry.subdomain, entry.customDomain, entry.shouldRedirect)
    }
  }

  /**
   * Remove entry from cache
   */
  delete(subdomain: string): boolean {
    const deleted = this.cache.delete(subdomain)
    if (deleted) {
      this.updateStats()
    }
    return deleted
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.updateStats()
  }

  /**
   * Check if subdomain should redirect
   */
  shouldRedirect(subdomain: string): boolean {
    const entry = this.get(subdomain)
    return entry?.shouldRedirect || false
  }

  /**
   * Get redirect URL for subdomain
   */
  getRedirectUrl(subdomain: string): string | null {
    const entry = this.get(subdomain)
    if (entry?.shouldRedirect && entry.customDomain) {
      return `https://${entry.customDomain}`
    }
    return null
  }

  /**
   * Warm cache with active domain configurations
   */
  async warmCache(domainConfigs: DomainConfig[]): Promise<void> {
    console.log(`Warming cache with ${domainConfigs.length} domain configurations`)
    
    const entries = domainConfigs
      .filter(config => config.domain_status === 'verified')
      .map(config => ({
        subdomain: '', // Will be filled from project data
        customDomain: config.custom_domain,
        shouldRedirect: config.redirect_enabled
      }))

    this.setMany(entries)
    console.log(`Cache warmed with ${entries.length} verified domains`)
  }

  /**
   * Invalidate cache entries for a specific domain
   */
  invalidateDomain(customDomain: string): number {
    let invalidatedCount = 0
    
    for (const [subdomain, entry] of this.cache.entries()) {
      if (entry.customDomain === customDomain) {
        this.cache.delete(subdomain)
        invalidatedCount++
      }
    }
    
    this.updateStats()
    console.log(`Invalidated ${invalidatedCount} cache entries for domain: ${customDomain}`)
    return invalidatedCount
  }

  /**
   * Invalidate cache entries for a specific project
   */
  invalidateProject(projectSubdomain: string): boolean {
    const deleted = this.cache.delete(projectSubdomain)
    if (deleted) {
      this.updateStats()
      console.log(`Invalidated cache entry for subdomain: ${projectSubdomain}`)
    }
    return deleted
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get cache size and memory usage estimate
   */
  getMemoryUsage(): {
    entryCount: number
    estimatedSizeBytes: number
    maxSize: number
    utilizationPercent: number
  } {
    const entryCount = this.cache.size
    const estimatedSizeBytes = entryCount * 200 // Rough estimate: 200 bytes per entry
    const utilizationPercent = (entryCount / this.options.maxSize) * 100

    return {
      entryCount,
      estimatedSizeBytes,
      maxSize: this.options.maxSize,
      utilizationPercent: Math.round(utilizationPercent * 100) / 100
    }
  }

  /**
   * Export cache data for debugging
   */
  exportCache(): Array<RedirectCacheEntry & { subdomain: string }> {
    return Array.from(this.cache.entries()).map(([subdomain, entry]) => ({
      ...entry,
      subdomain
    }))
  }

  /**
   * Import cache data (for testing or migration)
   */
  importCache(entries: Array<RedirectCacheEntry & { subdomain: string }>): void {
    this.clear()
    
    for (const entry of entries) {
      if (!this.isExpired(entry)) {
        this.cache.set(entry.subdomain, entry)
      }
    }
    
    this.updateStats()
  }

  /**
   * Check if entry has expired
   */
  private isExpired(entry: RedirectCacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Evict oldest entry to make room for new ones
   */
  private evictOldest(): void {
    let oldestTimestamp = Date.now()
    let oldestKey = ''

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      console.log(`Evicted oldest cache entry: ${oldestKey}`)
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): number {
    let cleanedCount = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`)
      this.updateStats()
    }

    return cleanedCount
  }

  /**
   * Start periodic cleanup interval
   */
  private startCleanupInterval(): void {
    // Clean up every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired()
    }, 2 * 60 * 1000)
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size
    this.updateHitRate()
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  /**
   * Destroy cache and clean up resources
   */
  destroy(): void {
    this.stopCleanupInterval()
    this.clear()
  }
}

/**
 * Global cache instance (singleton pattern)
 */
let globalCache: RedirectCache | null = null

/**
 * Get or create global cache instance
 */
export function getRedirectCache(options?: Partial<CacheOptions>): RedirectCache {
  if (!globalCache) {
    globalCache = new RedirectCache(options)
  }
  return globalCache
}

/**
 * Reset global cache (for testing)
 */
export function resetGlobalCache(): void {
  if (globalCache) {
    globalCache.destroy()
    globalCache = null
  }
}

/**
 * Quick utility functions using global cache
 */
export const redirectCache = {
  /**
   * Check if subdomain should redirect
   */
  shouldRedirect: (subdomain: string): boolean => {
    return getRedirectCache().shouldRedirect(subdomain)
  },

  /**
   * Get redirect URL for subdomain
   */
  getRedirectUrl: (subdomain: string): string | null => {
    return getRedirectCache().getRedirectUrl(subdomain)
  },

  /**
   * Set redirect configuration
   */
  setRedirect: (subdomain: string, customDomain: string | null, enabled = true): void => {
    getRedirectCache().set(subdomain, customDomain, enabled)
  },

  /**
   * Remove redirect configuration
   */
  removeRedirect: (subdomain: string): boolean => {
    return getRedirectCache().delete(subdomain)
  },

  /**
   * Get cache statistics
   */
  getStats: (): CacheStats => {
    return getRedirectCache().getStats()
  },

  /**
   * Clear all redirects
   */
  clear: (): void => {
    getRedirectCache().clear()
  },

  /**
   * Invalidate domain
   */
  invalidateDomain: (customDomain: string): number => {
    return getRedirectCache().invalidateDomain(customDomain)
  },

  /**
   * Invalidate project
   */
  invalidateProject: (projectSubdomain: string): boolean => {
    return getRedirectCache().invalidateProject(projectSubdomain)
  }
}

// Supabase client type for cache warming
interface SupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string | boolean) => {
        eq: (column: string, value: string | boolean) => Promise<{
          data: Array<{
            custom_domain: string
            redirect_enabled: boolean
            wedding_projects?: { subdomain: string }
          }> | null
          error: Error | null
        }>
      }
    }
  }
}

/**
 * Cache warming utility for application startup
 */
export async function warmRedirectCache(supabase: SupabaseClient): Promise<void> {
  try {
    console.log('Warming redirect cache on startup...')
    
    // Fetch active domain configurations
    const { data: domainConfigs, error } = await supabase
      .from('domain_config')
      .select(`
        *,
        wedding_projects!inner(subdomain, is_published)
      `)
      .eq('domain_status', 'verified')
      .eq('wedding_projects.is_published', true)

    if (error) {
      console.error('Error loading domain configs for cache warming:', error)
      return
    }

    const cache = getRedirectCache()
    
    // Set cache entries
    for (const config of domainConfigs || []) {
      if (config.wedding_projects?.subdomain) {
        cache.set(
          config.wedding_projects.subdomain,
          config.custom_domain,
          config.redirect_enabled
        )
      }
    }

    const stats = cache.getStats()
    console.log(`Cache warmed successfully: ${stats.size} entries loaded`)
    
  } catch (error) {
    console.error('Failed to warm redirect cache:', error)
  }
}

/**
 * Debug utility to log cache status
 */
export function logCacheStatus(): void {
  const cache = getRedirectCache()
  const stats = cache.getStats()
  const memory = cache.getMemoryUsage()
  
  console.log('=== Redirect Cache Status ===')
  console.log(`Entries: ${stats.size}/${memory.maxSize} (${memory.utilizationPercent}%)`)
  console.log(`Hit Rate: ${stats.hitRate.toFixed(2)}% (${stats.hits} hits, ${stats.misses} misses)`)
  console.log(`Memory Usage: ~${(memory.estimatedSizeBytes / 1024).toFixed(1)} KB`)
  console.log('==============================')
}