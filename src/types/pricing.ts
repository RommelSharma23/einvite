// types/pricing.ts

export interface PricingFeature {
  feature_code: string;
  feature_name: string;
  description: string;
  category: string;
  icon_name: string;
  is_included: boolean;
  feature_limit?: number;
  display_order: number;
}

export interface RegionalPricing {
  price: number;
  original_price?: number;
  currency: string;
  formatted: string;
  original_formatted?: string;
  is_sale: boolean;
  sale_label?: string;
  savings?: number;
  savings_percentage?: number;
}

export interface PricingPlan {
  id: string;
  plan_code: string;
  name: string;
  description: string;
  tagline: string;
  is_popular: boolean;
  display_order: number;
  pricing: {
    india: RegionalPricing;
    international: RegionalPricing;
  };
  features: PricingFeature[];
}

export interface RegionalPricingData {
  region: 'india' | 'international';
  plans: PricingPlan[];
}

export interface PromotionalPricing {
  id: string;
  promo_code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_uses?: number;
  current_uses: number;
}

export type UserRegion = 'india' | 'international';
export type PlanCode = 'silver' | 'gold' | 'platinum';
export type Currency = 'INR' | 'USD';