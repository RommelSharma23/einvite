// app/api/pricing/features/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAllFeatures } from '@/lib/services/pricingService'

// GET - Get all available features
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const planCode = searchParams.get('plan')
    
    console.log('🔍 Fetching features with filters:', { category, planCode })

    const allFeatures = await getAllFeatures()
    
    console.log(`✅ Found ${allFeatures.length} total features`)

    // Filter by category if specified
    let filteredFeatures = allFeatures
    if (category) {
      filteredFeatures = allFeatures.filter(feature => 
        feature.category.toLowerCase() === category.toLowerCase()
      )
      console.log(`📋 Filtered to ${filteredFeatures.length} features in category: ${category}`)
    }

    // Group features by category for better organization
    const featuresByCategory = filteredFeatures.reduce((acc, feature) => {
      const cat = feature.category
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(feature)
      return acc
    }, {} as Record<string, typeof filteredFeatures>)

    // Get unique categories
    const categories = Object.keys(featuresByCategory).sort()

    // If plan code is specified, we could add plan-specific feature information
    // This would require additional database queries to get plan_features mapping
    if (planCode) {
      console.log(`🎯 Plan-specific features requested for: ${planCode}`)
      // TODO: Add plan-specific feature inclusion information
      // This would require joining with plan_features table
    }

    return NextResponse.json({
      success: true,
      data: {
        features: filteredFeatures,
        featuresByCategory,
        categories,
        totalFeatures: filteredFeatures.length
      },
      meta: {
        filters: {
          category,
          planCode
        },
        totalCategories: categories.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error fetching features:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch features',
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