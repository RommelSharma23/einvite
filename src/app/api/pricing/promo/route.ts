// app/api/pricing/promo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { 
  applyPromotionalCode, 
  updatePromotionalUsage,
  getActivePromotions 
} from '@/lib/services/pricingService'
import { UserRegion } from '@/types/pricing'

// POST - Apply promotional code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { promoCode, planId, region } = body

    console.log('🎟️ Applying promo code:', { promoCode: promoCode?.toUpperCase(), planId, region })

    // Validate required fields
    if (!promoCode || !planId || !region) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: promoCode, planId, region',
          received: { promoCode: !!promoCode, planId: !!planId, region: !!region },
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

    // Validate promo code format (basic validation)
    const cleanPromoCode = promoCode.trim().toUpperCase()
    if (cleanPromoCode.length < 3 || cleanPromoCode.length > 20) {
      console.log('❌ Invalid promo code format:', cleanPromoCode)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid promotional code format',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.log(`🔍 Validating promo code: ${cleanPromoCode}`)
    const result = await applyPromotionalCode(cleanPromoCode, planId, region as UserRegion)
    
    if (result.success && result.discountedPrice !== undefined) {
      console.log(`✅ Promo code applied successfully. Discounted price: ${result.discountedPrice}`)
      
      return NextResponse.json({
        success: true,
        data: {
          discountedPrice: result.discountedPrice,
          promoCode: cleanPromoCode,
          planId,
          region
        },
        message: 'Promotional code applied successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ Failed to apply promo code:', result.error)
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to apply promotional code',
          promoCode: cleanPromoCode,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ Error in promo application API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to apply promotional code',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PATCH - Update promotional code usage (after successful payment)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { promoCode, action = 'increment' } = body

    console.log('🔄 Updating promo usage:', { promoCode: promoCode?.toUpperCase(), action })

    if (!promoCode) {
      console.log('❌ Missing promoCode')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing promoCode',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const cleanPromoCode = promoCode.trim().toUpperCase()

    if (action === 'increment') {
      console.log(`📈 Incrementing usage for: ${cleanPromoCode}`)
      const success = await updatePromotionalUsage(cleanPromoCode)
      
      if (success) {
        console.log(`✅ Usage updated for: ${cleanPromoCode}`)
        return NextResponse.json({
          success: true,
          message: 'Promotional code usage updated successfully',
          promoCode: cleanPromoCode,
          timestamp: new Date().toISOString()
        })
      } else {
        console.log(`❌ Failed to update usage for: ${cleanPromoCode}`)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to update promotional code usage',
            promoCode: cleanPromoCode,
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action. Only "increment" is supported',
          received: action,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ Error updating promo usage:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update promotional code usage',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET - Get active promotional codes (public information only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDetails = searchParams.get('include_details') === 'true'
    
    console.log('🎟️ Fetching active promotions')

    const promotions = await getActivePromotions()
    
    console.log(`✅ Found ${promotions.length} active promotions`)

    // Filter sensitive information for public API
    const publicPromotions = promotions.map(promo => ({
      promo_code: promo.promo_code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      end_date: promo.end_date,
      is_active: promo.is_active,
      ...(includeDetails && {
        max_uses: promo.max_uses,
        current_uses: promo.current_uses,
        remaining_uses: promo.max_uses ? promo.max_uses - promo.current_uses : null
      })
    }))

    return NextResponse.json({
      success: true,
      data: publicPromotions,
      meta: {
        total_promotions: promotions.length,
        include_details: includeDetails,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error fetching promotions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch promotional codes',
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}