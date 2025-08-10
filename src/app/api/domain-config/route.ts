// File: src/app/api/domain-config/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateDomain } from '@/lib/domain-validation'
import { generateVerificationToken } from '@/lib/dns-verification'
import { redirectCache } from '@/lib/redirect-cache'
import { 
  CreateDomainRequest, 
  CreateDomainResponse,
  UpdateDomainRequest,
  UpdateDomainResponse,
  DomainConfig
} from '@/types/domain'

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
 * GET /api/domain-config?project_id=xxx
 * Get domain configuration for a project
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id is required' },
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

    // Check if user owns this project
    const { data: project, error: projectError } = await supabase
      .from('wedding_projects')
      .select('id, user_id, subdomain, title')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Get domain configuration
    const { data: domainConfig, error: domainError } = await supabase
      .from('domain_config')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle() // Use maybeSingle instead of single to handle no results

    if (domainError) {
      console.error('Error fetching domain config:', domainError)
      return NextResponse.json(
        { error: 'Failed to fetch domain configuration' },
        { status: 500 }
      )
    }

    // Return project info with domain config (if exists)
    return NextResponse.json({
      project: {
        id: project.id,
        subdomain: project.subdomain,
        title: project.title
      },
      domainConfig: domainConfig || null
    })

  } catch (error) {
    console.error('GET /api/domain-config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/domain-config
 * Create or update domain configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateDomainRequest = await request.json()
    const { project_id, custom_domain, redirect_enabled = true } = body

    // Validate required fields
    if (!project_id || !custom_domain) {
      return NextResponse.json(
        { error: 'project_id and custom_domain are required' },
        { status: 400 }
      )
    }

    // Validate domain format
    const domainValidation = validateDomain(custom_domain)
    if (!domainValidation.isValid) {
      return NextResponse.json(
        { error: domainValidation.error },
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

    // Check if user owns this project and has the right tier
    const { data: project, error: projectError } = await supabase
      .from('wedding_projects')
      .select(`
        id, 
        user_id, 
        subdomain,
        users!inner(current_subscription)
      `)
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Check subscription tier
    const userData = project.users as unknown as { current_subscription: string }
    const userTier = userData.current_subscription
    if (!['gold', 'platinum'].includes(userTier)) {
      return NextResponse.json(
        { error: 'Custom domains require Gold or Platinum subscription' },
        { status: 403 }
      )
    }

    // Check if domain is already taken by another project
    const { data: existingDomain, error: existingError } = await supabase
      .from('domain_config')
      .select('id, project_id')
      .eq('custom_domain', custom_domain)
      .neq('project_id', project_id)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing domain:', existingError)
      return NextResponse.json(
        { error: 'Failed to validate domain availability' },
        { status: 500 }
      )
    }

    if (existingDomain) {
      return NextResponse.json(
        { error: 'This domain is already in use by another project' },
        { status: 409 }
      )
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Check if domain config already exists for this project
    const { data: currentConfig } = await supabase
      .from('domain_config')
      .select('id')
      .eq('project_id', project_id)
      .maybeSingle()

    let domainConfig: DomainConfig

    if (currentConfig) {
      // Update existing configuration
      const { data: updatedConfig, error: updateError } = await supabase
        .from('domain_config')
        .update({
          custom_domain,
          verification_token: verificationToken,
          redirect_enabled,
          domain_status: 'pending',
          verification_attempts: 0,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          updated_at: new Date().toISOString()
        })
        .eq('id', currentConfig.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating domain config:', updateError)
        return NextResponse.json(
          { error: 'Failed to update domain configuration' },
          { status: 500 }
        )
      }

      domainConfig = updatedConfig

    } else {
      // Create new configuration
      const { data: newConfig, error: createError } = await supabase
        .from('domain_config')
        .insert({
          project_id,
          custom_domain,
          verification_token: verificationToken,
          redirect_enabled,
          domain_status: 'pending',
          verification_attempts: 0,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating domain config:', createError)
        return NextResponse.json(
          { error: 'Failed to create domain configuration' },
          { status: 500 }
        )
      }

      domainConfig = newConfig
    }

    // Clear cache for this project to force refresh
    if (project.subdomain) {
      redirectCache.invalidateProject(project.subdomain)
    }

    const response: CreateDomainResponse = {
      success: true,
      data: domainConfig
    }

    return NextResponse.json(response, { status: currentConfig ? 200 : 201 })

  } catch (error) {
    console.error('POST /api/domain-config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/domain-config
 * Update domain configuration settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body: UpdateDomainRequest = await request.json()
    const { domain_id, redirect_enabled, custom_domain } = body

    if (!domain_id) {
      return NextResponse.json(
        { error: 'domain_id is required' },
        { status: 400 }
      )
    }

    // If updating domain name, validate it
    if (custom_domain) {
      const domainValidation = validateDomain(custom_domain)
      if (!domainValidation.isValid) {
        return NextResponse.json(
          { error: domainValidation.error },
          { status: 400 }
        )
      }
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

    // Check if user owns this domain config
    const { data: domainConfig, error: configError } = await supabase
      .from('domain_config')
      .select(`
        id,
        project_id,
        custom_domain,
        wedding_projects!inner(user_id, subdomain)
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
    const weddingProject = domainConfig.wedding_projects as unknown as { user_id: string; subdomain: string }
    if (weddingProject.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: Partial<DomainConfig> = {
      updated_at: new Date().toISOString()
    }

    if (redirect_enabled !== undefined) {
      updateData.redirect_enabled = redirect_enabled
    }

    if (custom_domain && custom_domain !== domainConfig.custom_domain) {
      // Check if new domain is available
      const { data: existingDomain } = await supabase
        .from('domain_config')
        .select('id')
        .eq('custom_domain', custom_domain)
        .neq('id', domain_id)
        .maybeSingle()

      if (existingDomain) {
        return NextResponse.json(
          { error: 'This domain is already in use by another project' },
          { status: 409 }
        )
      }

      updateData.custom_domain = custom_domain
      updateData.verification_token = generateVerificationToken()
      updateData.domain_status = 'pending'
      updateData.verification_attempts = 0
      updateData.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Update the configuration
    const { data: updatedConfig, error: updateError } = await supabase
      .from('domain_config')
      .update(updateData)
      .eq('id', domain_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating domain config:', updateError)
      return NextResponse.json(
        { error: 'Failed to update domain configuration' },
        { status: 500 }
      )
    }

    // Invalidate cache
    if (weddingProject.subdomain) {
      redirectCache.invalidateProject(weddingProject.subdomain)
      
      // If domain changed, also invalidate the old domain
      if (custom_domain && custom_domain !== domainConfig.custom_domain) {
        redirectCache.invalidateDomain(domainConfig.custom_domain)
      }
    }

    const response: UpdateDomainResponse = {
      success: true,
      data: updatedConfig
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('PATCH /api/domain-config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/domain-config?domain_id=xxx
 * Delete domain configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domain_id')

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

    // Check if user owns this domain config
    const { data: domainConfig, error: configError } = await supabase
      .from('domain_config')
      .select(`
        id,
        custom_domain,
        wedding_projects!inner(user_id, subdomain)
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
    const weddingProject = domainConfig.wedding_projects as unknown as { user_id: string; subdomain: string }
    if (weddingProject.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete the configuration
    const { error: deleteError } = await supabase
      .from('domain_config')
      .delete()
      .eq('id', domainId)

    if (deleteError) {
      console.error('Error deleting domain config:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete domain configuration' },
        { status: 500 }
      )
    }

    // Clear cache
    if (weddingProject.subdomain) {
      redirectCache.invalidateProject(weddingProject.subdomain)
    }
    redirectCache.invalidateDomain(domainConfig.custom_domain)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/domain-config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}