import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection and data...')

    // Test 1: Check if pricing_plans table exists and has data (use specific fields to avoid permission issues)
    const { data: plans, error: plansError } = await supabase
      .from('pricing_plans')
      .select(`
        id,
        plan_code,
        name,
        description,
        tagline,
        is_popular,
        display_order,
        is_active
      `)
      .eq('is_active', true)

    console.log('📊 Pricing plans:', plans)
    if (plansError) console.error('❌ Plans error:', plansError)

    // Test 2: Check if plan_pricing table exists and has data
    const { data: pricing, error: pricingError } = await supabase
      .from('plan_pricing')
      .select('*')
      .eq('is_active', true)

    console.log('💰 Plan pricing:', pricing)
    if (pricingError) console.error('❌ Pricing error:', pricingError)

    // Test 3: Check the full query used by the pricing service
    const { data: fullData, error: fullError } = await supabase
      .from('pricing_plans')
      .select(`
        id,
        plan_code,
        name,
        description,
        tagline,
        is_popular,
        display_order,
        plan_pricing!inner (
          region,
          base_price,
          original_price,
          currency,
          is_sale,
          sale_label
        )
      `)
      .eq('is_active', true)
      .eq('plan_pricing.is_active', true)
      .order('display_order')

    console.log('🔗 Full query result:', fullData)
    if (fullError) console.error('❌ Full query error:', fullError)

    return NextResponse.json({
      success: true,
      data: {
        plans: plans || [],
        pricing: pricing || [],
        fullQuery: fullData || [],
        errors: {
          plansError: plansError?.message || null,
          pricingError: pricingError?.message || null,
          fullError: fullError?.message || null
        }
      },
      message: 'Database test completed',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Test API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Database test failed',
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}