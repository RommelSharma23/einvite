// File: src/app/api/dns-check/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { promises as dns } from 'dns'
import { DNSVerificationResult, DNSRecord } from '@/types/domain'

/**
 * DNS verification utility class for server-side use
 */
class ServerDNSVerifier {
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
 * POST /api/dns-check
 * Check DNS records for domain verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, token, checkConnectivity = false } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    const verifier = new ServerDNSVerifier()

    if (checkConnectivity) {
      // Check domain connectivity
      const result = await verifier.checkDomainConnectivity(domain)
      return NextResponse.json(result)
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required for verification' },
        { status: 400 }
      )
    }

    // Verify domain ownership
    const result = await verifier.verifyDomainOwnership(domain, token)
    return NextResponse.json(result)

  } catch (error) {
    console.error('DNS check API error:', error)
    return NextResponse.json(
      { 
        success: false,
        found: false,
        records: [],
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}