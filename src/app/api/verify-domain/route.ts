// File: src/app/api/verify-domain/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { redirectCache } from '@/lib/redirect-cache'
import { 
  VerifyDomainRequest, 
  VerifyDomainResponse,
  DNSVerificationResult 
} from '@/types/domain'

/**
 * Server-side domain verification using fetch to DNS API
 */
async function verifyDomainOwnershipServer(domain: string, token: string): Promise<DNSVerificationResult> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dns-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain, token })
    })

    if (!response.ok) {
      throw new Error(`DNS check failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    return {
      success: false,
      found: false,
      records: [],
      error: error instanceof Error ? error.message : 'DNS verification failed'
    }
  }
}

/**
 * Create authenticated Supabase client
 */
function createAuthenticatedSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  if (token) {
    supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // Not needed for this use case
    })
  }
  
  return supabase
}

/**
 * POST /api/verify-domain
 * Verify domain ownership via DNS TXT record
 */
export async function POST(request: NextRequest) {
  try {
    const body: VerifyDomainRequest = await request.json()
    const { domain_id, force_recheck = false } = body

    if (!domain_id) {
      return NextResponse.json(
        { error: 'domain_id is required' },
        { status: 400 }
      )
    }

    const supabase = createAuthenticatedSupabaseClient(request)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get domain configuration with project info
    const { data: domainConfig, error: configError } = await supabase
      .from('domain_config')
      .select(`
        id,
        custom_domain,
        verification_token,
        domain_status,
        verification_attempts,
        max_verification_attempts,
        expires_at,
        wedding_projects!inner(
          id,
          user_id,
          subdomain,
          is_published
        )
      `)
      .eq('id', domain_id)
      .single()

    if (configError || !domainConfig) {
      return NextResponse.json(
        { error: 'Domain configuration not found' },
        { status: 404 }
      )
    }

    // Check ownership
    const weddingProject = domainConfig.wedding_projects as unknown as {
      id: string
      user_id: string
      subdomain: string
      is_published: boolean
    }

    if (weddingProject.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if domain is already verified and not forcing recheck
    if (domainConfig.domain_status === 'verified' && !force_recheck) {
      return NextResponse.json({
        success: true,
        verification_result: {
          success: true,
          found: true,
          records: [],
          responseTime: 0
        },
        domain_status: 'verified',
        message: 'Domain is already verified'
      })
    }

    // Check if verification has expired
    if (domainConfig.expires_at && new Date(domainConfig.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Domain verification has expired. Please reconfigure your domain.' },
        { status: 410 }
      )
    }

    // Check if max verification attempts reached
    if (domainConfig.verification_attempts >= domainConfig.max_verification_attempts) {
      return NextResponse.json(
        { error: 'Maximum verification attempts reached. Please wait before trying again.' },
        { status: 429 }
      )
    }

    console.log(`Verifying domain: ${domainConfig.custom_domain}`)
    console.log(`Verification token: ${domainConfig.verification_token}`)

    // Perform DNS verification
    const verificationResult: DNSVerificationResult = await verifyDomainOwnershipServer(
      domainConfig.custom_domain,
      domainConfig.verification_token
    )

    console.log('Verification result:', verificationResult)

    // Determine new status
    let newStatus: 'verified' | 'failed' | 'pending' = 'pending'
    let errorMessage: string | null = null

    if (verificationResult.success) {
      newStatus = 'verified'
      console.log(`✅ Domain ${domainConfig.custom_domain} verified successfully!`)
    } else {
      newStatus = 'failed'
      errorMessage = verificationResult.error || 'Verification failed'
      console.log(`❌ Domain ${domainConfig.custom_domain} verification failed: ${errorMessage}`)
    }

    // Update domain status in database
    const updateResult = await supabase.rpc('update_domain_verification_status', {
      domain_id_param: domain_id,
      new_status: newStatus,
      error_msg: errorMessage,
      dns_records: verificationResult.records || []
    })

    if (updateResult.error) {
      console.error('Error updating verification status:', updateResult.error)
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      )
    }

    // If verified successfully, update cache and setup redirect
    if (newStatus === 'verified') {
      // Update redirect cache
      if (weddingProject.subdomain && weddingProject.is_published) {
        redirectCache.setRedirect(
          weddingProject.subdomain,
          domainConfig.custom_domain,
          true
        )
        console.log(`✅ Cache updated for subdomain: ${weddingProject.subdomain} → ${domainConfig.custom_domain}`)
      }

      // Send success notification (could be email, webhook, etc.)
      await sendVerificationSuccessNotification(
        supabase,
        user.id,
        domainConfig.custom_domain,
        weddingProject.subdomain
      )
    }

    // Prepare response
    const response: VerifyDomainResponse = {
      success: newStatus === 'verified',
      verification_result: verificationResult,
      domain_status: newStatus
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('POST /api/verify-domain error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/verify-domain?domain_id=xxx&check_connectivity=true
 * Check domain verification status or test connectivity
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domain_id')
    const checkConnectivity = searchParams.get('check_connectivity') === 'true'

    if (!domainId) {
      return NextResponse.json(
        { error: 'domain_id is required' },
        { status: 400 }
      )
    }

    const supabase = createAuthenticatedSupabaseClient(request)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get domain configuration
    const { data: domainConfig, error: configError } = await supabase
      .from('domain_config')
      .select(`
        id,
        custom_domain,
        verification_token,
        domain_status,
        verification_attempts,
        last_verified_at,
        expires_at,
        wedding_projects!inner(user_id)
      `)
      .eq('id', domainId)
      .single()

    if (configError || !domainConfig) {
      return NextResponse.json(
        { error: 'Domain configuration not found' },
        { status: 404 }
      )
    }

    // Check ownership
    const weddingProject = domainConfig.wedding_projects as unknown as { user_id: string }
    if (weddingProject.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // If checking connectivity, test domain resolution
    if (checkConnectivity) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dns-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            domain: domainConfig.custom_domain, 
            checkConnectivity: true 
          })
        })

        const connectivityResult = await response.json()
        
        return NextResponse.json({
          domain: domainConfig.custom_domain,
          connectivity: connectivityResult,
          domain_status: domainConfig.domain_status,
          last_verified_at: domainConfig.last_verified_at
        })
      } catch (error) {
        return NextResponse.json({
          domain: domainConfig.custom_domain,
          connectivity: {
            success: false,
            found: false,
            records: [],
            error: 'Connectivity check failed'
          },
          domain_status: domainConfig.domain_status,
          last_verified_at: domainConfig.last_verified_at
        })
      }
    }

    // Get verification logs for this domain
    const { data: verificationLogs, error: logsError } = await supabase
      .from('domain_verification_logs')
      .select('*')
      .eq('domain_config_id', domainId)
      .order('checked_at', { ascending: false })
      .limit(10)

    if (logsError) {
      console.error('Error fetching verification logs:', logsError)
    }

    // Return domain status with logs
    return NextResponse.json({
      domain_config: {
        id: domainConfig.id,
        custom_domain: domainConfig.custom_domain,
        verification_token: domainConfig.verification_token,
        domain_status: domainConfig.domain_status,
        verification_attempts: domainConfig.verification_attempts,
        last_verified_at: domainConfig.last_verified_at,
        expires_at: domainConfig.expires_at
      },
      verification_logs: verificationLogs || []
    })

  } catch (error) {
    console.error('GET /api/verify-domain error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Send notification when domain is verified successfully
 */
async function sendVerificationSuccessNotification(
  supabase: ReturnType<typeof createAuthenticatedSupabaseClient>,
  userId: string,
  customDomain: string,
  subdomain: string
): Promise<void> {
  try {
    // Get user email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user for notification:', userError)
      return
    }

    // Log notification (in real app, you'd send email/webhook here)
    console.log('🎉 DOMAIN VERIFIED NOTIFICATION:')
    console.log(`  User: ${user.full_name} (${user.email})`)
    console.log(`  Domain: ${customDomain}`)
    console.log(`  Subdomain: ${subdomain}`)
    console.log(`  Website URL: https://${customDomain}`)

    // In a real implementation, you would:
    // 1. Send email notification
    // 2. Create in-app notification
    // 3. Send webhook to external services
    // 4. Update analytics

    // Example: Insert notification record
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'domain_verified',
        title: 'Custom Domain Verified!',
        message: `Your custom domain ${customDomain} has been verified and is now live.`,
        data: {
          custom_domain: customDomain,
          subdomain: subdomain,
          website_url: `https://${customDomain}`
        },
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Error sending verification notification:', error)
    // Don't throw - this is non-critical
  }
}