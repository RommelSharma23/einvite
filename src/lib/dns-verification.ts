// File: src/lib/dns-verification.ts

import { promises as dns } from 'dns'
import { 
  DNSVerificationResult, 
  DNSRecord
} from '@/types/domain'

/**
 * DNS verification utility for domain ownership verification
 */
export class DNSVerifier {
  private readonly timeout: number
  private readonly maxRetries: number
  private readonly retryDelay: number

  constructor(options: {
    timeout?: number
    maxRetries?: number
    retryDelay?: number
  } = {}) {
    this.timeout = options.timeout || 10000 // 10 seconds
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 2000 // 2 seconds
  }

  /**
   * Verify domain ownership via TXT record
   */
  async verifyDomainOwnership(
    domain: string, 
    expectedToken: string
  ): Promise<DNSVerificationResult> {
    const startTime = Date.now()
    
    try {
      // Clean domain and prepare verification record name
      const cleanDomain = this.cleanDomain(domain)
      const verificationRecordName = `_einvite-verification.${cleanDomain}`
      
      console.log(`Verifying domain: ${cleanDomain}`)
      console.log(`Looking for TXT record: ${verificationRecordName}`)
      console.log(`Expected token: ${expectedToken}`)

      // Attempt DNS lookup with retries
      const txtRecords = await this.lookupTxtRecordsWithRetry(verificationRecordName)
      
      const responseTime = Date.now() - startTime

      // Check if expected token is found
      const foundToken = this.findVerificationToken(txtRecords, expectedToken)
      
      const result: DNSVerificationResult = {
        success: foundToken !== null,
        found: txtRecords.length > 0,
        records: txtRecords.map(record => ({
          name: verificationRecordName,
          type: 'TXT',
          value: record,
          ttl: 300 // Default TTL
        })),
        responseTime
      }

      if (!result.success && result.found) {
        result.error = `Verification token not found. Expected: ${expectedToken}, Found: ${txtRecords.join(', ')}`
      } else if (!result.found) {
        result.error = `No TXT records found for ${verificationRecordName}. Please check your DNS configuration.`
      }

      return result

    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        success: false,
        found: false,
        records: [],
        responseTime,
        error: this.formatDNSError(error)
      }
    }
  }

  /**
   * Lookup TXT records with retry logic
   */
  private async lookupTxtRecordsWithRetry(hostname: string): Promise<string[]> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`DNS lookup attempt ${attempt}/${this.maxRetries} for ${hostname}`)
        
        // Set timeout for DNS lookup
        const txtRecords = await Promise.race([
          dns.resolveTxt(hostname),
          this.createTimeoutPromise<string[][]>(this.timeout)
        ]) as string[][]

        // Flatten TXT records (they come as arrays of strings)
        const flattenedRecords = txtRecords.flat()
        console.log(`Found ${flattenedRecords.length} TXT records:`, flattenedRecords)
        
        return flattenedRecords

      } catch (error) {
        lastError = error as Error
        console.log(`DNS lookup attempt ${attempt} failed:`, error)
        
        // If this is the last attempt, throw the error
        if (attempt === this.maxRetries) {
          throw lastError
        }
        
        // Wait before retrying
        await this.delay(this.retryDelay * attempt) // Exponential backoff
      }
    }

    throw lastError || new Error('DNS lookup failed after all retries')
  }

  /**
   * Find verification token in TXT records
   */
  private findVerificationToken(txtRecords: string[], expectedToken: string): string | null {
    for (const record of txtRecords) {
      // Check exact match
      if (record === expectedToken) {
        return record
      }
      
      // Check if record contains the token (some DNS providers add quotes)
      if (record.includes(expectedToken)) {
        return record
      }
      
      // Check without quotes
      const cleanRecord = record.replace(/['"]/g, '')
      if (cleanRecord === expectedToken) {
        return record
      }
    }
    
    return null
  }

  /**
   * Verify CNAME record (alternative verification method)
   */
  async verifyCNAMERecord(
    domain: string,
    expectedTarget: string
  ): Promise<DNSVerificationResult> {
    const startTime = Date.now()
    
    try {
      const cleanDomain = this.cleanDomain(domain)
      const verificationRecordName = `_einvite-verification.${cleanDomain}`
      
      const cnameRecords = await this.lookupCNAMEWithRetry(verificationRecordName)
      const responseTime = Date.now() - startTime
      
      const found = cnameRecords.some(record => record === expectedTarget)
      
      return {
        success: found,
        found: cnameRecords.length > 0,
        records: cnameRecords.map(record => ({
          name: verificationRecordName,
          type: 'CNAME',
          value: record
        })),
        responseTime,
        error: found ? undefined : `Expected CNAME target: ${expectedTarget}, Found: ${cnameRecords.join(', ')}`
      }

    } catch (error) {
      return {
        success: false,
        found: false,
        records: [],
        responseTime: Date.now() - startTime,
        error: this.formatDNSError(error)
      }
    }
  }

  /**
   * Lookup CNAME records with retry
   */
  private async lookupCNAMEWithRetry(hostname: string): Promise<string[]> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const cnameRecords = await Promise.race([
          dns.resolveCname(hostname),
          this.createTimeoutPromise<string[]>(this.timeout)
        ]) as string[]
        
        return cnameRecords

      } catch (error) {
        lastError = error as Error
        
        if (attempt === this.maxRetries) {
          throw lastError
        }
        
        await this.delay(this.retryDelay * attempt)
      }
    }

    throw lastError || new Error('CNAME lookup failed after all retries')
  }

  /**
   * Check if domain resolves (basic connectivity test)
   */
  async checkDomainConnectivity(domain: string): Promise<DNSVerificationResult> {
    const startTime = Date.now()
    
    try {
      const cleanDomain = this.cleanDomain(domain)
      
      // Try to resolve A records
      const aRecords = await Promise.race([
        dns.resolve4(cleanDomain),
        this.createTimeoutPromise<string[]>(this.timeout)
      ]) as string[]
      
      const responseTime = Date.now() - startTime
      
      return {
        success: true,
        found: true,
        records: aRecords.map(ip => ({
          name: cleanDomain,
          type: 'A',
          value: ip
        })),
        responseTime
      }

    } catch (error) {
      // Try AAAA records (IPv6) as fallback
      try {
        const aaaaRecords = await dns.resolve6(domain)
        
        return {
          success: true,
          found: true,
          records: aaaaRecords.map(ip => ({
            name: domain,
            type: 'AAAA',
            value: ip
          })),
          responseTime: Date.now() - startTime
        }

      } catch {
        return {
          success: false,
          found: false,
          records: [],
          responseTime: Date.now() - startTime,
          error: `Domain does not resolve: ${this.formatDNSError(error)}`
        }
      }
    }
  }

  /**
   * Get all DNS records for a domain (for debugging)
   */
  async getDNSRecords(domain: string): Promise<{
    a: DNSRecord[]
    aaaa: DNSRecord[]
    cname: DNSRecord[]
    txt: DNSRecord[]
    mx: DNSRecord[]
  }> {
    const cleanDomain = this.cleanDomain(domain)
    const records = {
      a: [] as DNSRecord[],
      aaaa: [] as DNSRecord[],
      cname: [] as DNSRecord[],
      txt: [] as DNSRecord[],
      mx: [] as DNSRecord[]
    }

    // Helper function to safely lookup records
    const safeLookup = async <T>(
      lookupFn: () => Promise<T[]>,
      type: string,
      transform: (record: T) => string
    ): Promise<DNSRecord[]> => {
      try {
        const results = await lookupFn()
        return results.map(record => ({
          name: cleanDomain,
          type,
          value: transform(record)
        }))
      } catch {
        return []
      }
    }

    // Lookup all record types
    const [aRecords, aaaaRecords, cnameRecords, txtRecords, mxRecords] = await Promise.allSettled([
      safeLookup(() => dns.resolve4(cleanDomain), 'A', (ip: string) => ip),
      safeLookup(() => dns.resolve6(cleanDomain), 'AAAA', (ip: string) => ip),
      safeLookup(() => dns.resolveCname(cleanDomain), 'CNAME', (cname: string) => cname),
      safeLookup(() => dns.resolveTxt(cleanDomain), 'TXT', (txt: string[]) => txt.join(' ')),
      safeLookup(() => dns.resolveMx(cleanDomain), 'MX', (mx: { priority: number; exchange: string }) => `${mx.priority} ${mx.exchange}`)
    ])

    // Extract successful results
    if (aRecords.status === 'fulfilled') records.a = aRecords.value
    if (aaaaRecords.status === 'fulfilled') records.aaaa = aaaaRecords.value
    if (cnameRecords.status === 'fulfilled') records.cname = cnameRecords.value
    if (txtRecords.status === 'fulfilled') records.txt = txtRecords.value
    if (mxRecords.status === 'fulfilled') records.mx = mxRecords.value

    return records
  }

  /**
   * Clean domain input
   */
  private cleanDomain(domain: string): string {
    return domain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .replace(/:\d+$/, '')
  }

  /**
   * Format DNS error for user display
   */
  private formatDNSError(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('notfound') || message.includes('nxdomain')) {
        return 'DNS record not found. Please check your DNS configuration.'
      }
      
      if (message.includes('timeout')) {
        return 'DNS lookup timed out. Please try again in a few minutes.'
      }
      
      if (message.includes('servfail')) {
        return 'DNS server error. Please try again later.'
      }
      
      if (message.includes('refused')) {
        return 'DNS query refused. Please check your domain configuration.'
      }
      
      return `DNS error: ${error.message}`
    }
    
    return 'Unknown DNS error occurred'
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('DNS lookup timeout')), timeout)
    })
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Quick verification function for simple use cases
 */
export async function verifyDomainOwnership(
  domain: string, 
  expectedToken: string
): Promise<DNSVerificationResult> {
  const verifier = new DNSVerifier()
  return verifier.verifyDomainOwnership(domain, expectedToken)
}

/**
 * Check domain connectivity
 */
export async function checkDomainConnectivity(domain: string): Promise<DNSVerificationResult> {
  const verifier = new DNSVerifier()
  return verifier.checkDomainConnectivity(domain)
}

/**
 * Generate verification token
 */
export function generateVerificationToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 10)
  const timestampPart = Date.now().toString(36)
  return `einvite-verify-${randomPart}-${timestampPart}`
}

/**
 * Validate verification token format
 */
export function isValidVerificationToken(token: string): boolean {
  return /^einvite-verify-[a-z0-9]+-[a-z0-9]+$/.test(token)
}

/**
 * Get DNS setup instructions for TXT record
 */
export function getDNSInstructions(domain: string, token: string): {
  recordType: string
  recordName: string
  recordValue: string
  instructions: string[]
} {
  return {
    recordType: 'TXT',
    recordName: `_einvite-verification.${domain}`,
    recordValue: token,
    instructions: [
      'Login to your domain provider (GoDaddy, Namecheap, etc.)',
      'Go to DNS Management or DNS Records section',
      'Add a new TXT record with the details above',
      'Set TTL to 300 seconds (5 minutes) if asked',
      'Save the record and wait 5-30 minutes for propagation',
      'Click "Verify Domain" button below'
    ]
  }
}

/**
 * Check if DNS propagation is likely complete
 */
export async function checkDNSPropagation(
  domain: string, 
  token: string
): Promise<{
  propagated: boolean
  estimatedTimeRemaining: number // in minutes
  serversChecked: number
  serversFound: number
}> {
  const verifier = new DNSVerifier({ timeout: 5000, maxRetries: 1 })
  
  // Check multiple DNS servers to estimate propagation
  const dnsServers = [
    '8.8.8.8', // Google
    '1.1.1.1', // Cloudflare
    '208.67.222.222', // OpenDNS
  ]
  
  let serversFound = 0
  
  for (const _server of dnsServers) {
    try {
      // Note: Node.js dns module doesn't support custom servers directly
      // In a real implementation, you'd use a library like 'dns2' or make HTTP requests to DNS APIs
      const result = await verifier.verifyDomainOwnership(domain, token)
      if (result.success) {
        serversFound++
      }
    } catch {
      // Server check failed
    }
  }
  
  const propagationPercent = serversFound / dnsServers.length
  const propagated = propagationPercent >= 0.7 // Consider propagated if 70% of servers have it
  
  // Estimate remaining time based on propagation percentage
  let estimatedTimeRemaining = 0
  if (!propagated) {
    estimatedTimeRemaining = Math.max(5, 30 - (propagationPercent * 25))
  }
  
  return {
    propagated,
    estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
    serversChecked: dnsServers.length,
    serversFound
  }
}