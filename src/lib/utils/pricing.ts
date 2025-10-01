// lib/utils/pricing.ts
import { Currency, UserRegion, PlanCode, PricingPlan } from '@/types/pricing'

/**
 * Format price with proper currency formatting
 */
export const formatPrice = (price: number, currency: Currency): string => {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
};

/**
 * Calculate savings amount and percentage
 */
export const calculateSavings = (originalPrice: number, currentPrice: number) => {
  const savings = originalPrice - currentPrice;
  const savingsPercentage = Math.round((savings / originalPrice) * 100);
  
  return {
    savings: savings > 0 ? savings : 0,
    savingsPercentage: savingsPercentage > 0 ? savingsPercentage : 0
  };
};

/**
 * Detect user region based on country code
 * You can enhance this with IP geolocation or browser locale
 */
export const detectUserRegion = (countryCode?: string): UserRegion => {
  if (countryCode === 'IN') {
    return 'india';
  }
  
  // Add more country-specific logic here
  // For example:
  // if (['US', 'CA', 'GB', 'AU', 'DE', 'FR'].includes(countryCode)) {
  //   return 'international';
  // }
  
  return 'international';
};

/**
 * Get plan by code from plans array
 */
export const getPlanByCode = (plans: PricingPlan[], planCode: PlanCode): PricingPlan | undefined => {
  return plans.find(plan => plan.plan_code === planCode);
};

/**
 * Check if a specific feature is included in a plan
 */
export const isPlanFeatureIncluded = (plan: PricingPlan, featureCode: string): boolean => {
  const feature = plan.features.find(f => f.feature_code === featureCode);
  return feature?.is_included || false;
};

/**
 * Get feature limit for a specific feature in a plan
 */
export const getPlanFeatureLimit = (plan: PricingPlan, featureCode: string): number | null => {
  const feature = plan.features.find(f => f.feature_code === featureCode);
  return feature?.feature_limit || null;
};

/**
 * Get pricing for specific region from a plan
 */
export const getPlanRegionalPricing = (plan: PricingPlan, region: UserRegion) => {
  return plan.pricing[region];
};

/**
 * Sort plans by display order
 */
export const sortPlansByOrder = (plans: PricingPlan[]): PricingPlan[] => {
  return [...plans].sort((a, b) => a.display_order - b.display_order);
};

/**
 * Sort features by display order and category
 */
export const sortFeaturesByOrder = (features: any[]): any[] => {
  return [...features].sort((a, b) => {
    // First sort by category priority
    const categoryOrder = { core: 1, engagement: 2, customization: 3, premium: 4 };
    const aCategoryOrder = categoryOrder[a.category as keyof typeof categoryOrder] || 5;
    const bCategoryOrder = categoryOrder[b.category as keyof typeof categoryOrder] || 5;
    
    if (aCategoryOrder !== bCategoryOrder) {
      return aCategoryOrder - bCategoryOrder;
    }
    
    // Then sort by display order
    return a.display_order - b.display_order;
  });
};

/**
 * Get recommended plan (marked as popular)
 */
export const getRecommendedPlan = (plans: PricingPlan[]): PricingPlan | undefined => {
  return plans.find(plan => plan.is_popular);
};

/**
 * Convert price to different currency (basic conversion)
 * Note: In production, you'd use real-time exchange rates
 */
export const convertPrice = (price: number, fromCurrency: Currency, toCurrency: Currency): number => {
  if (fromCurrency === toCurrency) return price;
  
  // Basic conversion rates (you should use real-time rates in production)
  const exchangeRates = {
    'INR_to_USD': 0.012,
    'USD_to_INR': 83.0
  };
  
  if (fromCurrency === 'INR' && toCurrency === 'USD') {
    return Math.round(price * exchangeRates.INR_to_USD);
  }
  
  if (fromCurrency === 'USD' && toCurrency === 'INR') {
    return Math.round(price * exchangeRates.USD_to_INR);
  }
  
  return price;
};

/**
 * Generate plan comparison data
 */
export const generatePlanComparison = (plans: PricingPlan[], region: UserRegion) => {
  return plans.map(plan => {
    const pricing = getPlanRegionalPricing(plan, region);
    const featuresByCategory = plan.features.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    }, {} as Record<string, typeof plan.features>);
    
    return {
      ...plan,
      currentPricing: pricing,
      featuresByCategory,
      totalFeatures: plan.features.length,
      includedFeatures: plan.features.filter(f => f.is_included).length
    };
  });
};