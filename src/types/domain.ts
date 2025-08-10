// File: src/types/domain.ts

export interface DomainConfig {
  id: string
  project_id: string
  custom_domain: string
  domain_status: 'pending' | 'verified' | 'failed' | 'expired'
  verification_token: string
  verification_method: 'txt' | 'cname' | 'file'
  redirect_enabled: boolean
  last_verified_at: string | null
  verification_attempts: number
  max_verification_attempts: number
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface DomainVerificationLog {
  id: string
  domain_config_id: string
  verification_attempt: number
  verification_result: 'success' | 'failed' | 'timeout' | 'error'
  error_message: string | null
  dns_records_found: DNSRecord[] | null
  response_time_ms: number | null
  checked_at: string
}

export interface DNSRecord {
  name: string
  type: string
  value: string
  ttl?: number
}

export interface DomainConfigWithProject {
  domain_id: string
  custom_domain: string
  domain_status: 'pending' | 'verified' | 'failed' | 'expired'
  verification_token: string
  redirect_enabled: boolean
  last_verified_at: string | null
  verification_attempts: number
  expires_at: string | null
  project_subdomain: string
  project_title: string
  user_tier: 'free' | 'silver' | 'gold' | 'platinum'
}

export interface DomainValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export interface DNSVerificationResult {
  success: boolean
  found: boolean
  records: DNSRecord[]
  error?: string
  responseTime?: number
}

export interface RedirectCacheEntry {
  subdomain: string
  customDomain: string | null
  shouldRedirect: boolean
  timestamp: number
  ttl: number
}

// API Request/Response types
export interface CreateDomainRequest {
  project_id: string
  custom_domain: string
  redirect_enabled?: boolean
}

export interface CreateDomainResponse {
  success: boolean
  data?: DomainConfig
  error?: string
}

export interface VerifyDomainRequest {
  domain_id: string
  force_recheck?: boolean
}

export interface VerifyDomainResponse {
  success: boolean
  verification_result: DNSVerificationResult
  domain_status: 'pending' | 'verified' | 'failed'
  error?: string
}

export interface UpdateDomainRequest {
  domain_id: string
  redirect_enabled?: boolean
  custom_domain?: string
}

export interface UpdateDomainResponse {
  success: boolean
  data?: DomainConfig
  error?: string
}

export interface GetRedirectResponse {
  shouldRedirect: boolean
  redirectUrl: string | null
  fromCache: boolean
}

// DNS Provider specific types
export interface DNSProvider {
  id: string
  name: string
  website: string
  instructions: DNSInstructions
  logoUrl?: string
  popular: boolean
}

export interface DNSInstructions {
  steps: DNSStep[]
  notes?: string[]
  troubleshooting?: string[]
}

export interface DNSStep {
  step: number
  title: string
  description: string
  screenshot?: string
  code?: string
}

// Domain validation rules
export interface DomainValidationRules {
  minLength: number
  maxLength: number
  allowedTLDs: string[]
  reservedWords: string[]
  regexPattern: RegExp
}

// Error types
export class DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class DNSVerificationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DNS_VERIFICATION_ERROR', details)
    this.name = 'DNSVerificationError'
  }
}

export class DomainValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DOMAIN_VALIDATION_ERROR', details)
    this.name = 'DomainValidationError'
  }
}

// Cache types
export interface CacheOptions {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum number of entries
  enableCleanup: boolean // Whether to run periodic cleanup
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

// DNS verification status
export type VerificationStatus = 
  | 'not_started'
  | 'checking'
  | 'verified'
  | 'failed'
  | 'expired'
  | 'rate_limited'

// UI State types for components
export interface DomainEditorState {
  isLoading: boolean
  isSaving: boolean
  isVerifying: boolean
  domainConfig: DomainConfig | null
  validationError: string | null
  verificationLogs: DomainVerificationLog[]
  showInstructions: boolean
  selectedProvider: string | null
}

export interface DomainSetupWizardStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
  optional: boolean
}

// Constants as types
export const DOMAIN_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed',
  EXPIRED: 'expired'
} as const

export const VERIFICATION_METHOD = {
  TXT: 'txt',
  CNAME: 'cname',
  FILE: 'file'
} as const

export const VERIFICATION_RESULT = {
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  ERROR: 'error'
} as const

// Type guards
export function isDomainConfig(obj: unknown): obj is DomainConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as DomainConfig).id === 'string' &&
    typeof (obj as DomainConfig).custom_domain === 'string' &&
    ['pending', 'verified', 'failed', 'expired'].includes((obj as DomainConfig).domain_status)
  )
}

export function isValidDomainStatus(status: string): status is DomainConfig['domain_status'] {
  return ['pending', 'verified', 'failed', 'expired'].includes(status)
}

export function isValidVerificationMethod(method: string): method is DomainConfig['verification_method'] {
  return ['txt', 'cname', 'file'].includes(method)
}

// Utility types
export type DomainConfigUpdate = Partial<Pick<DomainConfig, 'custom_domain' | 'redirect_enabled'>>
export type DomainConfigCreate = Pick<DomainConfig, 'project_id' | 'custom_domain'> & 
  Partial<Pick<DomainConfig, 'redirect_enabled' | 'verification_method'>>

// Export default domain validation rules
export const DEFAULT_DOMAIN_RULES: DomainValidationRules = {
  minLength: 4,
  maxLength: 253,
  allowedTLDs: ['.com', '.in', '.org', '.net', '.co', '.io', '.me', '.info', '.biz'],
  reservedWords: ['admin', 'api', 'www', 'mail', 'ftp', 'einvite', 'supabase', 'localhost'],
  regexPattern: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.([a-zA-Z]{2,}\.)*[a-zA-Z]{2,}$/
}

// Cache configuration
export const CACHE_CONFIG: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000, // 1000 entries
  enableCleanup: true
}