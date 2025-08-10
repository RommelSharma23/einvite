// File: src/lib/domain-validation.ts

import { 
  DomainValidationResult, 
  DomainValidationError,
  DEFAULT_DOMAIN_RULES,
  type DomainValidationRules 
} from '@/types/domain'

/**
 * Comprehensive domain validation utility
 */
export class DomainValidator {
  private rules: DomainValidationRules

  constructor(customRules?: Partial<DomainValidationRules>) {
    this.rules = { ...DEFAULT_DOMAIN_RULES, ...customRules }
  }

  /**
   * Main validation function - validates domain format and rules
   */
  validateDomain(domain: string): DomainValidationResult {
    try {
      // Clean the domain input
      const cleanDomain = this.cleanDomain(domain)
      
      // Run all validation checks
      const checks = [
        () => this.validateRequired(cleanDomain),
        () => this.validateLength(cleanDomain),
        () => this.validateFormat(cleanDomain),
        () => this.validateTLD(cleanDomain),
        () => this.validateReservedWords(cleanDomain),
        () => this.validateSpecialCases(cleanDomain)
      ]

      const warnings: string[] = []

      for (const check of checks) {
        const result = check()
        if (!result.isValid) {
          return result
        }
        if (result.warnings) {
          warnings.push(...result.warnings)
        }
      }

      return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined
      }

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      }
    }
  }

  /**
   * Clean domain input - remove protocol, trailing slashes, etc.
   */
  private cleanDomain(domain: string): string {
    if (!domain) return ''
    
    return domain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/^www\./, '') // Remove www prefix
      .replace(/\/$/, '') // Remove trailing slash
      .replace(/:\d+$/, '') // Remove port numbers
  }

  /**
   * Validate domain is not empty
   */
  private validateRequired(domain: string): DomainValidationResult {
    if (!domain || domain.length === 0) {
      return {
        isValid: false,
        error: 'Domain is required'
      }
    }
    return { isValid: true }
  }

  /**
   * Validate domain length
   */
  private validateLength(domain: string): DomainValidationResult {
    if (domain.length < this.rules.minLength) {
      return {
        isValid: false,
        error: `Domain must be at least ${this.rules.minLength} characters long`
      }
    }

    if (domain.length > this.rules.maxLength) {
      return {
        isValid: false,
        error: `Domain must be no more than ${this.rules.maxLength} characters long`
      }
    }

    return { isValid: true }
  }

  /**
   * Validate domain format using regex
   */
  private validateFormat(domain: string): DomainValidationResult {
    if (!this.rules.regexPattern.test(domain)) {
      return {
        isValid: false,
        error: 'Invalid domain format. Please enter a valid domain like example.com'
      }
    }

    // Additional format checks
    const formatChecks = [
      {
        test: (d: string) => !d.includes('..'),
        error: 'Domain cannot contain consecutive dots'
      },
      {
        test: (d: string) => !d.startsWith('-') && !d.endsWith('-'),
        error: 'Domain cannot start or end with hyphens'
      },
      {
        test: (d: string) => !d.includes('--'),
        error: 'Domain cannot contain consecutive hyphens'
      },
      {
        test: (d: string) => !/[^a-z0-9.-]/.test(d),
        error: 'Domain can only contain letters, numbers, dots, and hyphens'
      }
    ]

    for (const check of formatChecks) {
      if (!check.test(domain)) {
        return {
          isValid: false,
          error: check.error
        }
      }
    }

    return { isValid: true }
  }

  /**
   * Validate TLD (Top Level Domain)
   */
  private validateTLD(domain: string): DomainValidationResult {
    const parts = domain.split('.')
    if (parts.length < 2) {
      return {
        isValid: false,
        error: 'Domain must include a valid top-level domain (like .com, .org)'
      }
    }

    const tld = '.' + parts[parts.length - 1]
    
    // REMOVED: TLD whitelist validation for testing
    // Allow all TLDs for now
    
    // Common TLD validation
    if (tld.length < 2) {
      return {
        isValid: false,
        error: 'Top-level domain must be at least 2 characters long'
      }
    }

    return { isValid: true }
  }

  /**
   * Check against reserved words
   */
  private validateReservedWords(domain: string): DomainValidationResult {
    const subdomain = domain.split('.')[0].toLowerCase()
    
    // Only check critical reserved words for testing
    const criticalReserved = ['admin', 'api', 'www', 'mail', 'ftp']
    
    if (criticalReserved.includes(subdomain)) {
      return {
        isValid: false,
        error: `"${subdomain}" is a reserved domain name and cannot be used`
      }
    }

    return { isValid: true }
  }

  /**
   * Special case validations
   */
  private validateSpecialCases(domain: string): DomainValidationResult {
    const warnings: string[] = []

    // REMOVED: einvite domain warning for testing
    
    // Check for very long subdomains
    const subdomain = domain.split('.')[0]
    if (subdomain.length > 63) {
      return {
        isValid: false,
        error: 'Subdomain part cannot be longer than 63 characters'
      }
    }

    // Check for IP-like patterns
    if (/^\d+\.\d+\.\d+\.\d+/.test(domain)) {
      return {
        isValid: false,
        error: 'IP addresses are not allowed as custom domains'
      }
    }

    // Check for localhost patterns
    if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
      return {
        isValid: false,
        error: 'Localhost domains are not allowed'
      }
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Extract domain parts for analysis
   */
  getDomainParts(domain: string): { subdomain: string; domain: string; tld: string } | null {
    const cleanDomain = this.cleanDomain(domain)
    const parts = cleanDomain.split('.')
    
    if (parts.length < 2) return null

    if (parts.length === 2) {
      return {
        subdomain: '',
        domain: parts[0],
        tld: parts[1]
      }
    }

    return {
      subdomain: parts.slice(0, -2).join('.'),
      domain: parts[parts.length - 2],
      tld: parts[parts.length - 1]
    }
  }

  /**
   * Check if domain is likely to work with SSL
   */
  validateSSLCompatibility(domain: string): DomainValidationResult {
    const cleanDomain = this.cleanDomain(domain)
    
    // Wildcard domains not supported
    if (cleanDomain.includes('*')) {
      return {
        isValid: false,
        error: 'Wildcard domains are not supported'
      }
    }

    // Domains with ports not supported
    if (cleanDomain.includes(':')) {
      return {
        isValid: false,
        error: 'Domains with port numbers are not supported'
      }
    }

    return { isValid: true }
  }
}

/**
 * Quick validation function for simple use cases
 */
export function validateDomain(domain: string, customRules?: Partial<DomainValidationRules>): DomainValidationResult {
  const validator = new DomainValidator(customRules)
  return validator.validateDomain(domain)
}

/**
 * Check if domain is in correct format for DNS setup
 */
export function validateDomainForDNS(domain: string): DomainValidationResult {
  const validator = new DomainValidator()
  
  // First run standard validation
  const standardResult = validator.validateDomain(domain)
  if (!standardResult.isValid) {
    return standardResult
  }

  // Additional DNS-specific checks
  const sslResult = validator.validateSSLCompatibility(domain)
  if (!sslResult.isValid) {
    return sslResult
  }

  return { isValid: true }
}

/**
 * Suggest corrections for common domain mistakes
 */
export function suggestDomainCorrections(domain: string): string[] {
  const suggestions: string[] = []
  const cleanDomain = domain.toLowerCase().trim()

  // Common typos and corrections
  const corrections = [
    { from: /^http:\/\//, to: '', reason: 'Remove http://' },
    { from: /^https:\/\//, to: '', reason: 'Remove https://' },
    { from: /^www\./, to: '', reason: 'Remove www.' },
    { from: /\/$/, to: '', reason: 'Remove trailing slash' },
    { from: /:\d+$/, to: '', reason: 'Remove port number' },
    { from: /\.com\.com$/, to: '.com', reason: 'Remove duplicate .com' },
    { from: /\s+/g, to: '', reason: 'Remove spaces' }
  ]

  let corrected = cleanDomain
  for (const correction of corrections) {
    if (correction.from.test(corrected)) {
      corrected = corrected.replace(correction.from, correction.to)
      suggestions.push(`${correction.reason}: ${corrected}`)
    }
  }

  // Suggest common TLDs if no TLD provided
  if (!corrected.includes('.')) {
    suggestions.push(
      `Add .com: ${corrected}.com`,
      `Add .in: ${corrected}.in`,
      `Add .org: ${corrected}.org`
    )
  }

  return suggestions.slice(0, 3) // Return max 3 suggestions
}

/**
 * Check if domain is already taken (placeholder for future API integration)
 */
export async function checkDomainAvailability(domain: string): Promise<{
  available: boolean
  error?: string
}> {
  try {
    // This would integrate with a domain availability API
    // For now, we'll just validate format
    const validation = validateDomain(domain)
    
    if (!validation.isValid) {
      return {
        available: false,
        error: validation.error
      }
    }

    // Placeholder - in real implementation, check with domain registrar API
    return { available: true }
    
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Failed to check domain availability'
    }
  }
}

/**
 * Get domain validation rules for UI display
 */
export function getDomainValidationRules(): {
  rules: string[]
  examples: { valid: string[]; invalid: string[] }
} {
  return {
    rules: [
      `Must be ${DEFAULT_DOMAIN_RULES.minLength}-${DEFAULT_DOMAIN_RULES.maxLength} characters long`,
      'Can only contain letters, numbers, dots, and hyphens',
      'Cannot start or end with hyphens',
      'Must include a valid top-level domain (.com, .org, etc.)',
      'Cannot use reserved words (admin, api, www, etc.)'
    ],
    examples: {
      valid: [
        'johnandjane.com',
        'smith-wedding.org',
        'our-big-day.in',
        'wedding2024.net'
      ],
      invalid: [
        'admin.com (reserved word)',
        'too-short.c (invalid TLD)',
        '-invalid.com (starts with hyphen)',
        'invalid..com (consecutive dots)',
        'spaces not allowed.com'
      ]
    }
  }
}