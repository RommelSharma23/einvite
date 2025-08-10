// File: src/lib/dns-verification-client.ts

import { 
  DNSVerificationResult, 
  DNSRecord
} from '@/types/domain'

/**
 * Client-side DNS verification utilities
 * Uses browser-compatible methods and API calls
 */

/**
 * Generate verification token (browser-safe)
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
 * Client-side domain verification via API call
 * This calls the server-side verification endpoint
 */
export async function verifyDomainOwnership(
  domain: string, 
  expectedToken: string
): Promise<DNSVerificationResult> {
  try {
    const response = await fetch('/api/dns-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        token: expectedToken
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return result as DNSVerificationResult

  } catch (error) {
    return {
      success: false,
      found: false,
      records: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Check domain connectivity via API
 */
export async function checkDomainConnectivity(domain: string): Promise<DNSVerificationResult> {
  try {
    const response = await fetch('/api/dns-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        checkConnectivity: true
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return result as DNSVerificationResult

  } catch (error) {
    return {
      success: false,
      found: false,
      records: [],
      error: error instanceof Error ? error.message : 'Connectivity check failed'
    }
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
  try {
    const response = await fetch('/api/dns-propagation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        token
      })
    })

    if (!response.ok) {
      // Return default values if API fails
      return {
        propagated: false,
        estimatedTimeRemaining: 15,
        serversChecked: 0,
        serversFound: 0
      }
    }

    return await response.json()

  } catch (error) {
    console.error('Error checking DNS propagation:', error)
    return {
      propagated: false,
      estimatedTimeRemaining: 15,
      serversChecked: 0,
      serversFound: 0
    }
  }
}

/**
 * Validate domain format for DNS setup
 */
export function validateDomainForDNS(domain: string): {
  isValid: boolean
  error?: string
  warnings?: string[]
} {
  const warnings: string[] = []
  
  // Clean domain
  const cleanDomain = domain
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')

  // Basic validation
  if (!cleanDomain) {
    return { isValid: false, error: 'Domain is required' }
  }

  // Format validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.([a-zA-Z]{2,}\.)*[a-zA-Z]{2,}$/
  if (!domainRegex.test(cleanDomain)) {
    return { isValid: false, error: 'Invalid domain format' }
  }

  // Length validation
  if (cleanDomain.length < 4 || cleanDomain.length > 253) {
    return { 
      isValid: false, 
      error: 'Domain must be between 4-253 characters long' 
    }
  }

  // Check for common issues
  if (cleanDomain.includes('einvite')) {
    warnings.push('Domain contains "einvite" which might confuse guests')
  }

  if (cleanDomain.includes('localhost') || cleanDomain.includes('127.0.0.1')) {
    return { isValid: false, error: 'Localhost domains are not allowed' }
  }

  // Check for IP addresses
  if (/^\d+\.\d+\.\d+\.\d+/.test(cleanDomain)) {
    return { isValid: false, error: 'IP addresses are not allowed as domains' }
  }

  return { 
    isValid: true, 
    warnings: warnings.length > 0 ? warnings : undefined 
  }
}

/**
 * Get verification status text for UI
 */
export function getVerificationStatusText(status: string): {
  text: string
  color: string
  icon: string
} {
  switch (status) {
    case 'verified':
      return {
        text: 'Domain Verified',
        color: 'text-green-600',
        icon: 'check-circle'
      }
    case 'pending':
      return {
        text: 'Verification Pending',
        color: 'text-yellow-600',
        icon: 'clock'
      }
    case 'failed':
      return {
        text: 'Verification Failed',
        color: 'text-red-600',
        icon: 'x-circle'
      }
    case 'expired':
      return {
        text: 'Verification Expired',
        color: 'text-gray-600',
        icon: 'alert-triangle'
      }
    default:
      return {
        text: 'Not Configured',
        color: 'text-gray-400',
        icon: 'circle'
      }
  }
}

/**
 * Format time remaining for UI display
 */
export function formatTimeRemaining(minutes: number): string {
  if (minutes <= 0) return 'Ready to verify'
  if (minutes < 60) return `${Math.round(minutes)} minutes`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Get DNS provider specific instructions
 */
export function getProviderInstructions(provider: string): {
  name: string
  steps: string[]
  notes?: string[]
} {
  const providers: Record<string, {
    name: string
    steps: string[]
    notes?: string[]
  }> = {
    godaddy: {
      name: 'GoDaddy',
      steps: [
        'Log in to your GoDaddy account',
        'Go to "My Products" and find your domain',
        'Click "DNS" next to your domain',
        'Scroll to "Records" section',
        'Click "Add" button',
        'Select "TXT" from dropdown',
        'Enter the record details above',
        'Click "Save"'
      ],
      notes: [
        'Don\'t include your domain name in the "Name" field',
        'Make sure there are no extra spaces in the value',
        'Changes may take 5-30 minutes to take effect'
      ]
    },
    namecheap: {
      name: 'Namecheap',
      steps: [
        'Log in to your Namecheap account',
        'Go to "Domain List" and click "Manage"',
        'Go to "Advanced DNS" tab',
        'Click "Add New Record"',
        'Select "TXT Record" from dropdown',
        'Enter the record details above',
        'Click the green checkmark to save'
      ],
      notes: [
        'Use "@" for the host if you want the root domain',
        'TTL can be left as "Automatic"'
      ]
    },
    cloudflare: {
      name: 'Cloudflare',
      steps: [
        'Log in to your Cloudflare account',
        'Select your domain',
        'Go to "DNS" tab',
        'Click "Add record"',
        'Select "TXT" as type',
        'Enter the record details above',
        'Click "Save"'
      ],
      notes: [
        'Make sure the proxy is turned OFF (gray cloud)',
        'Changes are usually instant with Cloudflare'
      ]
    },
    google: {
      name: 'Google Domains',
      steps: [
        'Log in to Google Domains',
        'Select your domain',
        'Go to "DNS" in the left menu',
        'Scroll to "Custom records"',
        'Click "Manage custom records"',
        'Click "Create new record"',
        'Enter the record details above',
        'Click "Save"'
      ]
    }
  }

  return providers[provider] || {
    name: 'Your DNS Provider',
    steps: [
      'Log in to your domain provider',
      'Find DNS management or DNS records section',
      'Add a new TXT record',
      'Enter the record details shown above',
      'Save the record'
    ],
    notes: [
      'The exact steps may vary depending on your provider',
      'Look for "DNS", "DNS Records", or "Advanced DNS" sections',
      'Contact your provider\'s support if you need help'
    ]
  }
}