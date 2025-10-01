// app/api/pricing/[planCode]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPlanByCode } from '@/lib/services/pricingService'
import { PlanCode, UserRegion } from '@/types/pricing'

interface RouteParams {
  params: {
    planCode: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { searchParams } = new URL(request.url)
    const region = (searchParams.get('region') as UserRegion) || 'india'
    const planCode = params.planCode.toLowerCase() as PlanCode
    
    console.log('🔍 Plan API called:', { planCode, region })

    // Validate plan code
    if (!['silver', 'gold', 'platinum'].includes(planCode)) {
      console.log('❌ Invalid plan code:', planCode)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid plan code. Must be one of: silver, gold, platinum',
          received: planCode,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate region
    if (!['india', 'international'].includes(region)) {
      console.log('❌ Invalid region:', region)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid region. Must be one of: india, international',
          received: region,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.log(`📍 Fetching ${planCode} plan for ${region}`)
    const plan = await getPlanByCode(planCode, region)
    
    if (!plan) {
      console.log('❌ Plan not found:', { planCode, region })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Plan not found',
          planCode,
          region,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    console.log(`✅ Found plan: ${plan.name}`)
    
    // Get current pricing for the region
    const currentPricing = plan.pricing[region]
    
    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        currentPricing, // Include current region pricing for convenience
        features_count: plan.features.length,
        included_features_count: plan.features.filter(f => f.is_included).length
      },
      meta: {
        plan_code: planCode,
        region: region,
        currency: currentPricing.currency,
        is_sale: currentPricing.is_sale,
        savings_percentage: currentPricing.savings_percentage || 0,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error in plan API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch plan data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// OPTIONS method for CORS support
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}