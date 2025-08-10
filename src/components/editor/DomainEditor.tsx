// File: src/components/editor/DomainEditor.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  Crown, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Copy,
  ExternalLink,
  RefreshCw,
  Settings,
  Info,
  Loader2
} from 'lucide-react'
import { 
  DomainEditorState,
  DomainValidationResult
} from '@/types/domain'
import { validateDomain, getDomainValidationRules } from '@/lib/domain-validation'
import { getDNSInstructions } from '@/lib/dns-verification-client'

// Simple Alert component (since @/components/ui/alert is missing)
const Alert = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    {children}
  </div>
)

const AlertDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm ${className}`}>
    {children}
  </div>
)

// Simple Switch component (since @/components/ui/switch is missing)
const Switch = ({ 
  checked, 
  onCheckedChange, 
  disabled = false 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
      ${checked ? 'bg-blue-600' : 'bg-gray-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}
      `}
    />
  </button>
)

interface DomainEditorProps {
  projectId: string
  userTier: 'free' | 'silver' | 'gold' | 'platinum'
  currentSubdomain?: string
  onUpgrade: (targetTier: string) => void
  onDomainVerified?: (domain: string) => void
}

const DNS_PROVIDERS = [
  { id: 'godaddy', name: 'GoDaddy', popular: true },
  { id: 'namecheap', name: 'Namecheap', popular: true },
  { id: 'cloudflare', name: 'Cloudflare', popular: true },
  { id: 'google', name: 'Google Domains', popular: true },
  { id: 'hostgator', name: 'HostGator', popular: false },
  { id: 'bluehost', name: 'Bluehost', popular: false },
  { id: 'others', name: 'Others', popular: false }
]

export function DomainEditor({ 
  projectId, 
  userTier, 
  currentSubdomain,
  onUpgrade,
  onDomainVerified 
}: DomainEditorProps) {
  const [state, setState] = useState<DomainEditorState>({
    isLoading: true,
    isSaving: false,
    isVerifying: false,
    domainConfig: null,
    validationError: null,
    verificationLogs: [],
    showInstructions: false,
    selectedProvider: null
  })

  const [domainInput, setDomainInput] = useState('')
  const [redirectEnabled, setRedirectEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('setup')

  // Check if feature is available for user tier
  const isFeatureAvailable = useCallback(() => {
    return ['gold', 'platinum'].includes(userTier)
  }, [userTier])

  // Load domain configuration
  const loadDomainConfig = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const response = await fetch(`/api/domain-config?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load domain configuration')
      }

      const data = await response.json()
      
      setState(prev => ({ 
        ...prev, 
        domainConfig: data.domainConfig,
        isLoading: false 
      }))

      if (data.domainConfig) {
        setDomainInput(data.domainConfig.custom_domain)
        setRedirectEnabled(data.domainConfig.redirect_enabled)
        
        if (data.domainConfig.domain_status === 'verified') {
          setActiveTab('status')
        }
      }

    } catch (error) {
      console.error('Error loading domain config:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        validationError: 'Failed to load domain configuration'
      }))
    }
  }, [projectId])

  // Get auth token (implement based on your auth system)
  const getAuthToken = async (): Promise<string> => {
    // This would get the current user's auth token
    // Implementation depends on your auth setup
    return 'your-auth-token'
  }

  useEffect(() => {
    if (isFeatureAvailable()) {
      loadDomainConfig()
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [isFeatureAvailable, loadDomainConfig])

  // Validate domain input
  const validateDomainInput = useCallback((domain: string): DomainValidationResult => {
    if (!domain.trim()) {
      return { isValid: false, error: 'Domain is required' }
    }
    return validateDomain(domain.trim())
  }, [])

  // Save domain configuration
  const saveDomainConfig = async () => {
    const validation = validateDomainInput(domainInput)
    if (!validation.isValid) {
      setState(prev => ({ ...prev, validationError: validation.error || 'Invalid domain' }))
      return
    }

    setState(prev => ({ ...prev, isSaving: true, validationError: null }))

    try {
      const response = await fetch('/api/domain-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          project_id: projectId,
          custom_domain: domainInput.trim(),
          redirect_enabled: redirectEnabled
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save domain configuration')
      }

      const data = await response.json()
      
      setState(prev => ({ 
        ...prev, 
        domainConfig: data.data,
        isSaving: false,
        showInstructions: true
      }))

      setActiveTab('verify')

    } catch (error) {
      console.error('Error saving domain config:', error)
      setState(prev => ({ 
        ...prev, 
        isSaving: false,
        validationError: error instanceof Error ? error.message : 'Failed to save domain'
      }))
    }
  }

  // Verify domain
  const verifyDomain = async (forceRecheck = false) => {
    if (!state.domainConfig) return

    setState(prev => ({ ...prev, isVerifying: true }))

    try {
      const response = await fetch('/api/verify-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          domain_id: state.domainConfig.id,
          force_recheck: forceRecheck
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Verification failed')
      }

      const data = await response.json()
      
      // Reload configuration to get updated status
      await loadDomainConfig()
      
      if (data.success) {
        setActiveTab('status')
        onDomainVerified?.(state.domainConfig.custom_domain)
      }

    } catch (error) {
      console.error('Error verifying domain:', error)
      setState(prev => ({ 
        ...prev, 
        validationError: error instanceof Error ? error.message : 'Verification failed'
      }))
    } finally {
      setState(prev => ({ ...prev, isVerifying: false }))
    }
  }

  // Update redirect setting
  const updateRedirectSetting = async (enabled: boolean) => {
    if (!state.domainConfig) return

    try {
      const response = await fetch('/api/domain-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          domain_id: state.domainConfig.id,
          redirect_enabled: enabled
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update redirect setting')
      }

      setRedirectEnabled(enabled)
      setState(prev => ({ 
        ...prev, 
        domainConfig: prev.domainConfig ? { 
          ...prev.domainConfig, 
          redirect_enabled: enabled 
        } : null
      }))

    } catch (error) {
      console.error('Error updating redirect setting:', error)
    }
  }

  // Copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Get DNS instructions
  const getDNSSetupInstructions = () => {
    if (!state.domainConfig) return null
    
    return getDNSInstructions(
      state.domainConfig.custom_domain,
      state.domainConfig.verification_token
    )
  }

  // Get domain status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Failed
        </Badge>
      case 'expired':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>
      default:
        return null
    }
  }

  // Feature not available for current tier
  if (!isFeatureAvailable()) {
    return (
      <div className="space-y-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-900 mb-1">
                  Custom Domain Feature Locked
                </h4>
                <p className="text-sm text-amber-700 mb-3">
                  Custom domains are available for Gold and Platinum plans. Upgrade to use your own domain name for your wedding website.
                </p>
                <div className="bg-white p-4 rounded-lg mb-4 text-left">
                  <h4 className="font-semibold text-gray-800 mb-2">Features included:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Your own domain (e.g., johnandjane.com)</li>
                    <li>• Automatic SSL certificates</li>
                    <li>• Professional branding</li>
                    <li>• SEO benefits</li>
                    <li>• Easy setup with DNS verification</li>
                  </ul>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => onUpgrade('gold')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Gold - ₹999
                  </Button>
                  <Button
                    onClick={() => onUpgrade('platinum')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Platinum - ₹1999
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading domain settings...</span>
      </div>
    )
  }

  const dnsInstructions = getDNSSetupInstructions()
  const domainRules = getDomainValidationRules()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-500" />
              <CardTitle className="text-base">Custom Domain</CardTitle>
            </div>
            <Badge variant="gold">
              <Crown className="h-3 w-3 mr-1" />
              Gold Feature
            </Badge>
          </div>
          <CardDescription>
            Use your own domain name for your wedding website
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="verify">Verify</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Domain Configuration</CardTitle>
              <CardDescription>
                Enter your custom domain name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Your Domain</Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="johnandjane.com"
                  value={domainInput}
                  onChange={(e) => {
                    setDomainInput(e.target.value)
                    setState(prev => ({ ...prev, validationError: null }))
                  }}
                  className={state.validationError ? 'border-red-500' : ''}
                />
                {state.validationError && (
                  <p className="text-sm text-red-600">{state.validationError}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Redirect Subdomain</Label>
                  <p className="text-sm text-gray-600">
                    Automatically redirect {currentSubdomain && `einvite.com/${currentSubdomain}`} to your custom domain
                  </p>
                </div>
                <Switch
                  checked={redirectEnabled}
                  onCheckedChange={setRedirectEnabled}
                />
              </div>

              <Button 
                onClick={saveDomainConfig}
                disabled={state.isSaving || !domainInput.trim()}
                className="w-full"
              >
                {state.isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Domain Configuration'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Domain Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Domain Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Rules:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {domainRules.rules.map((rule, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2 text-green-600">Valid examples:</h4>
                  <div className="flex flex-wrap gap-2">
                    {domainRules.examples.valid.map((example, index) => (
                      <Badge key={index} variant="outline" className="text-green-600 border-green-200">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verify Tab */}
        <TabsContent value="verify" className="space-y-4">
          {state.domainConfig && dnsInstructions ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">DNS Verification</CardTitle>
                  <CardDescription>
                    Add this DNS record to verify domain ownership
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You need to add a DNS TXT record to verify that you own this domain.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="font-medium">Record Type</Label>
                        <div className="flex items-center justify-between mt-1">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {dnsInstructions.recordType}
                          </code>
                        </div>
                      </div>
                      <div>
                        <Label className="font-medium">Name</Label>
                        <div className="flex items-center justify-between mt-1">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                            {dnsInstructions.recordName}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(dnsInstructions.recordName)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="font-medium">Value</Label>
                        <div className="flex items-center justify-between mt-1">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                            {dnsInstructions.recordValue}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(dnsInstructions.recordValue)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-medium">Popular DNS Providers</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {DNS_PROVIDERS.filter(p => p.popular).map((provider) => (
                        <Button
                          key={provider.id}
                          variant="outline"
                          size="sm"
                          onClick={() => setState(prev => ({ ...prev, selectedProvider: provider.id }))}
                          className={state.selectedProvider === provider.id ? 'bg-blue-50 border-blue-300' : ''}
                        >
                          {provider.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={() => verifyDomain()}
                    disabled={state.isVerifying}
                    className="w-full"
                  >
                    {state.isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Domain
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Setup Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="text-sm space-y-2">
                    {dnsInstructions.instructions.map((instruction: string, index: number) => (
                      <li key={index} className="flex">
                        <span className="font-medium mr-2 text-blue-600">{index + 1}.</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">
                  Please configure your domain first in the Setup tab.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          {state.domainConfig ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Domain Status
                    {getStatusBadge(state.domainConfig.domain_status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Domain</Label>
                      <p className="text-sm text-gray-600">{state.domainConfig.custom_domain}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Verification Attempts</Label>
                      <p className="text-sm text-gray-600">
                        {state.domainConfig.verification_attempts} / {state.domainConfig.max_verification_attempts}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Redirect Enabled</Label>
                      <div className="flex items-center mt-1">
                        <Switch
                          checked={redirectEnabled}
                          onCheckedChange={updateRedirectSetting}
                          disabled={state.domainConfig.domain_status !== 'verified'}
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          {redirectEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Verified</Label>
                      <p className="text-sm text-gray-600">
                        {state.domainConfig.last_verified_at 
                          ? new Date(state.domainConfig.last_verified_at).toLocaleString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>

                  {state.domainConfig.domain_status === 'verified' && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Your domain is verified and active! Your wedding website is now accessible at{' '}
                        <a 
                          href={`https://${state.domainConfig.custom_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline inline-flex items-center"
                        >
                          {state.domainConfig.custom_domain}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => verifyDomain(true)}
                      disabled={state.isVerifying}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-verify
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('setup')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Domain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">
                  No domain configured yet. Please set up your domain first.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}