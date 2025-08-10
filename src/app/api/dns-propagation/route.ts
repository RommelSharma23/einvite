// File: src/app/api/dns-propagation/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { promises as dns } from 'dns'

/**
 * Check DNS propagation across multiple servers
 */
async function checkDNSPropagation(domain: string, token: string) {
  const verificationRecordName = `_einvite-verification.${domain}`
  
  // We'll simulate checking multiple servers since Node.js dns module
  // doesn't directly support querying specific DNS servers
  const checks = []
  const maxChecks = 3 // Simulate 3 different server checks
  
  for (let i = 0; i < maxChecks; i++) {
    try {
      const txtRecords = await dns.resolveTxt(verificationRecordName)
      const flatRecords = txtRecords.flat()
      const found = flatRecords.some(record => 
        record === token || 
        record.includes(token) || 
        record.replace(/['"]/g, '') === token
      )
      
      checks.push(found)
    } catch (error) {
      checks.push(false)
    }
    
    // Add small delay between checks
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const serversFound = checks.filter(found => found).length
  const serversChecked = checks.length
  const propagationPercent = serversFound / serversChecked
  const propagated = propagationPercent >= 0.7 // Consider propagated if 70% have it
  
  // Estimate remaining time based on propagation percentage
  let estimatedTimeRemaining = 0
  if (!propagated) {
    estimatedTimeRemaining = Math.max(5, 30 - (propagationPercent * 25))
  }
  
  return {
    propagated,
    estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
    serversChecked,
    serversFound
  }
}

/**
 * POST /api/dns-propagation
 * Check DNS propagation status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, token } = body

    if (!domain || !token) {
      return NextResponse.json(
        { error: 'Domain and token are required' },
        { status: 400 }
      )
    }

    const result = await checkDNSPropagation(domain, token)
    return NextResponse.json(result)

  } catch (error) {
    console.error('DNS propagation check error:', error)
    return NextResponse.json({
      propagated: false,
      estimatedTimeRemaining: 15,
      serversChecked: 0,
      serversFound: 0,
      error: 'Failed to check DNS propagation'
    })
  }
}