// lib/services/pricingService.ts
import { supabase } from '@/lib/supabase'
import { 
  PricingPlan, 
  RegionalPricingData, 
  UserRegion, 
  PlanCode,
  PromotionalPricing 
} from '@/types/pricing'
import { 
  formatPrice, 
  calculateSavings, 
  sortPlansByOrder, 
  sortFeaturesByOrder 
} from '@/lib/utils/pricing'

/**
 * Fetch all pricing plans with features and regional pricing
 */
export async function getAllPricingPlans(): Promise<RegionalPricingData[]> {
  try {
    const { data, error } = await supabase
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
        ),
        plan_features!inner (
          is_included,
          feature_limit,
          display_order,
          features_master (
            feature_code,
            feature_name,
            description,
            category,
            icon_name
          )
        )
      `)
      .eq('is_active', true)
      .eq('plan_pricing.is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching pricing plans:', error);
      throw error;
    }

    // Process and group data by region
    const indiaPlans: PricingPlan[] = [];
    const internationalPlans: PricingPlan[] = [];

    // Group plans by ID to avoid duplicates
    const planMap = new Map<string, any>();
    
    data?.forEach(plan => {
      const planKey = plan.id;
      
      if (!planMap.has(planKey)) {
        planMap.set(planKey, {
          id: plan.id,
          plan_code: plan.plan_code,
          name: plan.name,
          description: plan.description,
          tagline: plan.tagline,
          is_popular: plan.is_popular,
          display_order: plan.display_order,
          pricing: {},
          features: [],
          regions: new Set()
        });
      }
      
      const planData = planMap.get(planKey);
      
      // Process pricing for each region
      plan.plan_pricing.forEach((pricing: any) => {
        const { savings, savingsPercentage } = pricing.original_price 
          ? calculateSavings(pricing.original_price, pricing.base_price)
          : { savings: 0, savingsPercentage: 0 };
        
        planData.pricing[pricing.region] = {
          price: pricing.base_price,
          original_price: pricing.original_price,
          currency: pricing.currency,
          formatted: formatPrice(pricing.base_price, pricing.currency),
          original_formatted: pricing.original_price 
            ? formatPrice(pricing.original_price, pricing.currency) 
            : undefined,
          is_sale: pricing.is_sale || false,
          sale_label: pricing.sale_label,
          savings: savings > 0 ? savings : undefined,
          savings_percentage: savingsPercentage > 0 ? savingsPercentage : undefined
        };
        planData.regions.add(pricing.region);
      });
      
      // Process features (avoid duplicates)
      plan.plan_features.forEach((planFeature: any) => {
        const existingFeature = planData.features.find(
          (f: any) => f.feature_code === planFeature.features_master.feature_code
        );
        
        if (!existingFeature) {
          planData.features.push({
            feature_code: planFeature.features_master.feature_code,
            feature_name: planFeature.features_master.feature_name,
            description: planFeature.features_master.description,
            category: planFeature.features_master.category,
            icon_name: planFeature.features_master.icon_name,
            is_included: planFeature.is_included,
            feature_limit: planFeature.feature_limit,
            display_order: planFeature.display_order
          });
        }
      });
    });

    // Convert map to arrays and separate by region
    planMap.forEach(plan => {
      // Sort features by display order
      plan.features = sortFeaturesByOrder(plan.features);
      
      // Create separate plan objects for each region
      if (plan.regions.has('india')) {
        indiaPlans.push({
          ...plan,
          pricing: { 
            india: plan.pricing.india, 
            international: plan.pricing.international 
          }
        });
      }
      
      if (plan.regions.has('international')) {
        internationalPlans.push({
          ...plan,
          pricing: { 
            india: plan.pricing.india, 
            international: plan.pricing.international 
          }
        });
      }
    });

    // Sort plans by display order
    const sortedIndiaPlans = sortPlansByOrder(indiaPlans);
    const sortedInternationalPlans = sortPlansByOrder(internationalPlans);

    return [
      { region: 'india', plans: sortedIndiaPlans },
      { region: 'international', plans: sortedInternationalPlans }
    ];

  } catch (error) {
    console.error('Error in getAllPricingPlans:', error);
    return [];
  }
}

/**
 * Get pricing plans for a specific region
 */
export async function getPricingForRegion(region: UserRegion): Promise<PricingPlan[]> {
  try {
    const allPricing = await getAllPricingPlans();
    const regionalPricing = allPricing.find(rp => rp.region === region);
    return regionalPricing?.plans || [];
  } catch (error) {
    console.error(`Error getting pricing for region ${region}:`, error);
    return [];
  }
}

/**
 * Get a specific plan by code and region
 */
export async function getPlanByCode(planCode: PlanCode, region: UserRegion): Promise<PricingPlan | null> {
  try {
    const plans = await getPricingForRegion(region);
    return plans.find(plan => plan.plan_code === planCode) || null;
  } catch (error) {
    console.error(`Error getting plan ${planCode} for region ${region}:`, error);
    return null;
  }
}

/**
 * Get all available features
 */
export async function getAllFeatures() {
  try {
    const { data, error } = await supabase
      .from('features_master')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching features:', error);
    return [];
  }
}

/**
 * Get active promotional pricing
 */
export async function getActivePromotions(): Promise<PromotionalPricing[]> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('promotional_pricing')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }
}

/**
 * Apply promotional code to pricing
 */
export async function applyPromotionalCode(
  promoCode: string, 
  planId: string, 
  region: UserRegion
): Promise<{ success: boolean; discountedPrice?: number; error?: string }> {
  try {
    const now = new Date().toISOString();
    
    // Find the promotional code
    const { data: promo, error: promoError } = await supabase
      .from('promotional_pricing')
      .select(`
        *,
        plan_pricing!inner (
          plan_id,
          region,
          base_price
        )
      `)
      .eq('promo_code', promoCode.toUpperCase())
      .eq('is_active', true)
      .eq('plan_pricing.plan_id', planId)
      .eq('plan_pricing.region', region)
      .lte('start_date', now)
      .gte('end_date', now)
      .single();

    if (promoError || !promo) {
      return { success: false, error: 'Invalid or expired promotional code' };
    }

    // Check usage limits
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return { success: false, error: 'Promotional code has reached its usage limit' };
    }

    // Calculate discounted price
    const basePrice = promo.plan_pricing.base_price;
    let discountedPrice = basePrice;

    if (promo.discount_type === 'percentage') {
      discountedPrice = basePrice * (1 - promo.discount_value / 100);
    } else if (promo.discount_type === 'fixed_amount') {
      discountedPrice = basePrice - promo.discount_value;
    }

    // Ensure price doesn't go below 0
    discountedPrice = Math.max(0, discountedPrice);

    return { 
      success: true, 
      discountedPrice: Math.round(discountedPrice) 
    };

  } catch (error) {
    console.error('Error applying promotional code:', error);
    return { success: false, error: 'Failed to apply promotional code' };
  }
}

/**
 * Update promotional code usage
 */
export async function updatePromotionalUsage(promoCode: string): Promise<boolean> {
  try {
    // First get the current usage count
    const { data: currentPromo, error: fetchError } = await supabase
      .from('promotional_pricing')
      .select('current_uses')
      .eq('promo_code', promoCode.toUpperCase())
      .single();

    if (fetchError || !currentPromo) {
      console.error('Error fetching current promo usage:', fetchError);
      return false;
    }

    // Then update with incremented value
    const { error } = await supabase
      .from('promotional_pricing')
      .update({
        current_uses: currentPromo.current_uses + 1,
        updated_at: new Date().toISOString()
      })
      .eq('promo_code', promoCode.toUpperCase());

    return !error;
  } catch (error) {
    console.error('Error updating promotional usage:', error);
    return false;
  }
}