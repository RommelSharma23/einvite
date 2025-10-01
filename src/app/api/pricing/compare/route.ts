// app/api/pricing/compare/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPricingForRegion } from '@/lib/services/pricingService'
import { UserRegion, PlanCode } from '@/types/pricing'
import { generatePlanComparison } from '@/lib/utils/pricing'

// GET - Compare pricing plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = (searchParams.get('region') as UserRegion) || 'india'
    const plans = searchParams.get('plans')?.split(',') as PlanCode[] | undefined
    const format = searchParams.get('format') || 'detailed' // 'detailed' or 'summary'
    
    console.log('🔍 Plan comparison requested:', { region, plans, format })

    // Validate region
    if (!['india', 'international'].includes(region)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid region. Must be one of: india, international',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Get all plans for the region
    let allPlans = await getPricingForRegion(region)
    
    // Filter to specific plans if requested
    if (plans && plans.length > 0) {
      const validPlans = plans.filter(plan => 
        ['silver', 'gold', 'platinum'].includes(plan)
      )
      
      if (validPlans.length !== plans.length) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid plan codes. Must be one of: silver, gold, platinum',
            received: plans,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
      
      allPlans = allPlans.filter(plan => validPlans.includes(plan.plan_code as PlanCode))
      console.log(`📋 Filtered to ${allPlans.length} specific plans`)
    }

    console.log(`✅ Comparing ${allPlans.length} plans for ${region}`)

    // Generate comparison data
    const comparison = generatePlanComparison(allPlans, region)

    // Get all unique features across all plans for comparison matrix
    const allFeatures = Array.from(
      new Set(
        allPlans.flatMap(plan => 
          plan.features.map(f => f.feature_code)
        )
      )
    )

    // Create feature comparison matrix
    const featureMatrix = allFeatures.map(featureCode => {
      const featureInfo = allPlans
        .flatMap(p => p.features)
        .find(f => f.feature_code === featureCode)

      const planSupport = allPlans.reduce((acc, plan) => {
        const planFeature = plan.features.find(f => f.feature_code === featureCode)
        acc[plan.plan_code] = {
          included: planFeature?.is_included || false,
          limit: planFeature?.feature_limit || null
        }
        return acc
      }, {} as Record<string, { included: boolean; limit: number | null }>)

      return {
        feature_code: featureCode,
        feature_name: featureInfo?.feature_name || featureCode,
        description: featureInfo?.description,
        category: featureInfo?.category,
        plan_support: planSupport
      }
    })

    // Group features by category for better organization
    const featuresByCategory = featureMatrix.reduce((acc, feature) => {
      const category = feature.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(feature)
      return acc
    }, {} as Record<string, typeof featureMatrix>)

    if (format === 'summary') {
      // Return simplified comparison
      const summary = comparison.map(plan => ({
        plan_code: plan.plan_code,
        name: plan.name,
        price: plan.currentPricing.formatted,
        original_price: plan.currentPricing.original_formatted,
        is_sale: plan.currentPricing.is_sale,
        savings_percentage: plan.currentPricing.savings_percentage,
        is_popular: plan.is_popular,
        total_features: plan.totalFeatures,
        included_features: plan.includedFeatures
      }))

      return NextResponse.json({
        success: true,
        data: {
          region,
          format: 'summary',
          plans: summary,
          total_plans: summary.length
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      })
    }

    // Return detailed comparison
    return NextResponse.json({
      success: true,
      data: {
        region,
        format: 'detailed',
        plans: comparison,
        feature_matrix: featureMatrix,
        features_by_category: featuresByCategory,
        summary: {
          total_plans: allPlans.length,
          total_features: allFeatures.length,
          categories: Object.keys(featuresByCategory),
          popular_plan: comparison.find(p => p.is_popular)?.plan_code
        }
      },
      meta: {
        filters: {
          region,
          plans: plans || 'all',
          format
        },
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error in plan comparison API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate plan comparison',
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