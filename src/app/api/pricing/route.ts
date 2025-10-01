// app/api/pricing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAllPricingPlans, getPricingForRegion } from '@/lib/services/pricingService'
import { UserRegion } from '@/types/pricing'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') as UserRegion | null
    const include_features = searchParams.get('include_features') === 'true'
    
    console.log('🔍 Pricing API called with params:', { region, include_features })

    if (region && ['india', 'international'].includes(region)) {
      // Get pricing for specific region
      console.log(`📍 Fetching pricing for region: ${region}`)
      const plans = await getPricingForRegion(region)
      
      console.log(`✅ Found ${plans.length} plans for ${region}`)
      
      return NextResponse.json({
        success: true,
        data: { 
          region, 
          plans: include_features ? plans : plans.map(plan => ({
            ...plan,
            features: plan.features.length // Just return feature count if not requested
          }))
        },
        meta: {
          total_plans: plans.length,
          region: region,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      // Get all pricing data for both regions
      console.log('🌍 Fetching all pricing data')
      const allPricing = await getAllPricingPlans()
      
      const totalPlans = allPricing.reduce((sum, regional) => sum + regional.plans.length, 0)
      console.log(`✅ Found ${totalPlans} total plans across all regions`)
      
      return NextResponse.json({
        success: true,
        data: include_features ? allPricing : allPricing.map(regional => ({
          ...regional,
          plans: regional.plans.map(plan => ({
            ...plan,
            features: plan.features.length
          }))
        })),
        meta: {
          total_regions: allPricing.length,
          total_plans: totalPlans,
          regions: allPricing.map(r => r.region),
          timestamp: new Date().toISOString()
        }
      })
    }
  } catch (error) {
    console.error('❌ Error in pricing API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pricing data',
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