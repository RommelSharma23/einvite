import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'india'

    console.log('🔍 Simple pricing API called for region:', region)

    // Step 1: Get basic plan data without complex joins
    const { data: plans, error: plansError } = await supabase
      .from('pricing_plans')
      .select(`
        id,
        plan_code,
        name,
        description,
        tagline,
        is_popular,
        display_order
      `)
      .eq('is_active', true)
      .order('display_order')

    if (plansError) {
      console.error('❌ Plans error:', plansError)
      throw new Error(`Plans query failed: ${plansError.message}`)
    }

    if (!plans || plans.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No pricing plans found',
        timestamp: new Date().toISOString()
      })
    }

    console.log(`📊 Found ${plans.length} plans`)

    // Step 2: Get pricing data for the specific region
    const planIds = plans.map(p => p.id)
    const { data: pricing, error: pricingError } = await supabase
      .from('plan_pricing')
      .select('*')
      .in('plan_id', planIds)
      .eq('region', region)
      .eq('is_active', true)

    if (pricingError) {
      console.error('❌ Pricing error:', pricingError)
      throw new Error(`Pricing query failed: ${pricingError.message}`)
    }

    console.log(`💰 Found ${pricing?.length || 0} pricing records for ${region}`)

    // Step 3: Combine the data
    const result = plans.map(plan => {
      const planPricing = pricing?.find(p => p.plan_id === plan.id)

      if (!planPricing) {
        console.warn(`⚠️ No pricing found for plan ${plan.plan_code} in region ${region}`)
        return null
      }

      // Calculate savings if there's an original price
      const savings = planPricing.original_price && planPricing.base_price
        ? planPricing.original_price - planPricing.base_price
        : 0
      const savingsPercentage = planPricing.original_price && savings > 0
        ? Math.round((savings / planPricing.original_price) * 100)
        : 0

      // Format prices based on currency
      const formatPrice = (price: number, currency: string) => {
        if (currency === 'INR') {
          return `₹${price.toLocaleString('en-IN')}`
        } else {
          return `$${price}`
        }
      }

      return {
        id: plan.id,
        plan_code: plan.plan_code,
        name: plan.name,
        description: plan.description,
        tagline: plan.tagline,
        is_popular: plan.is_popular,
        pricing: {
          [region]: {
            price: planPricing.base_price,
            original_price: planPricing.original_price,
            currency: planPricing.currency,
            formatted: formatPrice(planPricing.base_price, planPricing.currency),
            original_formatted: planPricing.original_price
              ? formatPrice(planPricing.original_price, planPricing.currency)
              : undefined,
            is_sale: planPricing.is_sale || false,
            sale_label: planPricing.sale_label,
            savings_percentage: savingsPercentage > 0 ? savingsPercentage : undefined
          }
        },
        features: [
          { feature_name: 'Beautiful Templates', description: 'Access to premium templates', is_included: true },
          { feature_name: 'Custom Subdomain', description: 'yourname.einvite.com', is_included: true },
          { feature_name: 'RSVP Management', description: 'Collect guest responses', is_included: true },
          { feature_name: 'Photo Gallery', description: 'Share your memories', is_included: true },
          { feature_name: 'Mobile Responsive', description: 'Works on all devices', is_included: true },
          { feature_name: 'Guest Messaging', description: 'Collect wishes and messages', is_included: true }
        ]
      }
    }).filter(Boolean) // Remove null entries

    console.log(`✅ Successfully processed ${result.length} plans for ${region}`)

    return NextResponse.json({
      success: true,
      data: {
        region,
        plans: result
      },
      meta: {
        total_plans: result.length,
        region: region,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Simple pricing API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pricing data',
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}