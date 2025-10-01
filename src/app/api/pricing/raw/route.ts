import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'india'

    console.log('🔍 Raw pricing API - testing direct queries')

    // Test 1: Direct plan_pricing query (this should work since you have data)
    const { data: pricingData, error: pricingError } = await supabase
      .from('plan_pricing')
      .select('*')
      .eq('region', region)
      .eq('is_active', true)

    console.log('💰 Pricing data:', pricingData)
    if (pricingError) {
      console.error('❌ Pricing error:', pricingError)
      return NextResponse.json({
        success: false,
        error: 'Pricing query failed',
        details: pricingError.message,
        step: 'plan_pricing_query'
      }, { status: 500 })
    }

    // Test 2: Try basic pricing_plans query
    const { data: plansData, error: plansError } = await supabase
      .from('pricing_plans')
      .select('id, plan_code, name, description, tagline, is_popular, display_order')
      .eq('is_active', true)
      .order('display_order')

    console.log('📊 Plans data:', plansData)
    if (plansError) {
      console.error('❌ Plans error:', plansError)
      return NextResponse.json({
        success: false,
        error: 'Plans query failed',
        details: plansError.message,
        step: 'pricing_plans_query'
      }, { status: 500 })
    }

    // Test 3: Get plan features
    const planIds = plansData?.map(p => p.id) || []
    const { data: featuresData, error: featuresError } = await supabase
      .from('plan_features')
      .select(`
        plan_id,
        is_included,
        feature_limit,
        display_order,
        features_master (
          feature_code,
          feature_name,
          description,
          category
        )
      `)
      .in('plan_id', planIds)
      .order('display_order')

    console.log('🎯 Features data:', featuresData)
    if (featuresError) {
      console.error('⚠️ Features error (non-critical):', featuresError)
      // Don't fail the API, just continue without features
    }

    // If both work, create the response with your actual data
    const result = pricingData?.map(pricing => {
      const plan = plansData?.find(p => p.id === pricing.plan_id)

      // Get features for this plan
      const planFeatures = featuresData?.filter(f => f.plan_id === pricing.plan_id) || []
      const features = planFeatures.map(pf => ({
        feature_code: pf.features_master?.feature_code || 'unknown',
        feature_name: pf.features_master?.feature_name || 'Feature',
        description: pf.features_master?.description || '',
        category: pf.features_master?.category || 'general',
        is_included: pf.is_included,
        feature_limit: pf.feature_limit,
        display_order: pf.display_order
      })).sort((a, b) => a.display_order - b.display_order)

      return {
        id: pricing.plan_id,
        plan_code: plan?.plan_code || 'unknown',
        name: plan?.name || 'Unknown Plan',
        description: plan?.description || 'Beautiful wedding website',
        tagline: plan?.tagline || 'Perfect for your special day',
        is_popular: plan?.is_popular || false,
        pricing: {
          [region]: {
            price: parseFloat(pricing.base_price),
            original_price: pricing.original_price ? parseFloat(pricing.original_price) : undefined,
            currency: pricing.currency,
            formatted: pricing.currency === 'INR'
              ? `₹${parseFloat(pricing.base_price).toLocaleString('en-IN')}`
              : `$${pricing.base_price}`,
            original_formatted: pricing.original_price && pricing.currency === 'INR'
              ? `₹${parseFloat(pricing.original_price).toLocaleString('en-IN')}`
              : pricing.original_price ? `$${pricing.original_price}` : undefined,
            is_sale: pricing.is_sale,
            sale_label: pricing.sale_label,
            savings_percentage: pricing.original_price ?
              Math.round(((parseFloat(pricing.original_price) - parseFloat(pricing.base_price)) / parseFloat(pricing.original_price)) * 100) : undefined
          }
        },
        features: features.length > 0 ? features : [
          { feature_name: 'Beautiful Templates', description: 'Access to premium templates', is_included: true },
          { feature_name: 'Custom Subdomain', description: 'yourname.einvite.com', is_included: true },
          { feature_name: 'RSVP Management', description: 'Collect guest responses', is_included: true },
          { feature_name: 'Photo Gallery', description: 'Share your memories', is_included: true },
          { feature_name: 'Guest Messages', description: 'Collect wishes', is_included: true },
          { feature_name: 'Mobile Responsive', description: 'Works on all devices', is_included: true }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        region,
        plans: result || []
      },
      debug: {
        pricing_count: pricingData?.length || 0,
        plans_count: plansData?.length || 0,
        features_count: featuresData?.length || 0,
        has_features_error: !!featuresError
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Raw pricing API error:', error)
    return NextResponse.json({
      success: false,
      error: 'API failed',
      details: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}