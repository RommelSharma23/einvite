// hooks/usePricing.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  PricingPlan, 
  UserRegion, 
  PlanCode,
  PromotionalPricing 
} from '@/types/pricing'
import { 
  getAllPricingPlans,
  getPricingForRegion,
  getPlanByCode,
  getActivePromotions,
  applyPromotionalCode
} from '@/lib/services/pricingService'
import { detectUserRegion } from '@/lib/utils/pricing'

/**
 * Hook for fetching all pricing plans
 */
export function usePricingPlans(userCountry?: string) {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [region, setRegion] = useState<UserRegion>('india')

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true)
        setError(null)

        const detectedRegion = detectUserRegion(userCountry)
        setRegion(detectedRegion)

        const pricingPlans = await getPricingForRegion(detectedRegion)
        setPlans(pricingPlans)
      } catch (err) {
        setError('Failed to load pricing plans')
        console.error('Error loading pricing plans:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [userCountry])

  return {
    plans,
    loading,
    error,
    region
  }
}

/**
 * Hook for fetching a specific plan
 */
export function usePlan(planCode: PlanCode, region: UserRegion) {
  const [plan, setPlan] = useState<PricingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlan() {
      try {
        setLoading(true)
        setError(null)
        
        const planData = await getPlanByCode(planCode, region)
        setPlan(planData)
      } catch (err) {
        setError('Failed to load plan details')
        console.error('Error loading plan:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadPlan()
  }, [planCode, region])

  return { plan, loading, error }
}

/**
 * Hook for managing promotional codes
 */
export function usePromotionalCode() {
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string
    discountedPrice: number
    originalPrice: number
  } | null>(null)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyPromo = useCallback(async (
    promoCode: string,
    planId: string,
    region: UserRegion,
    originalPrice: number
  ) => {
    try {
      setApplying(true)
      setError(null)
      
      const result = await applyPromotionalCode(promoCode, planId, region)
      
      if (result.success && result.discountedPrice !== undefined) {
        setAppliedPromo({
          code: promoCode,
          discountedPrice: result.discountedPrice,
          originalPrice
        })
        return true
      } else {
        setError(result.error || 'Failed to apply promotional code')
        return false
      }
    } catch (err) {
      setError('Failed to apply promotional code')
      console.error('Error applying promo code:', err)
      return false
    } finally {
      setApplying(false)
    }
  }, [])

  const removePromo = useCallback(() => {
    setAppliedPromo(null)
    setError(null)
  }, [])

  return {
    appliedPromo,
    applying,
    error,
    applyPromo,
    removePromo
  }
}

/**
 * Hook for fetching active promotions
 */
export function useActivePromotions() {
  const [promotions, setPromotions] = useState<PromotionalPricing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPromotions() {
      try {
        setLoading(true)
        const activePromotions = await getActivePromotions()
        setPromotions(activePromotions)
      } catch (err) {
        console.error('Error loading promotions:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadPromotions()
  }, [])

  return { promotions, loading }
}

/**
 * Hook for user region detection
 */
export function useUserRegion(initialCountry?: string) {
  const [region, setRegion] = useState<UserRegion>(() =>
    detectUserRegion(initialCountry)
  )

  return {
    region
  }
}

/**
 * Hook for pricing comparison between plans
 */
export function usePricingComparison(region: UserRegion) {
  const { plans, loading, error } = usePricingPlans()

  const comparison = plans.map(plan => {
    const pricing = plan.pricing[region]
    const featuresByCategory = plan.features.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = []
      }
      acc[feature.category].push(feature)
      return acc
    }, {} as Record<string, typeof plan.features>)

    return {
      ...plan,
      currentPricing: pricing,
      featuresByCategory,
      totalFeatures: plan.features.length,
      includedFeatures: plan.features.filter(f => f.is_included).length,
      savings: pricing.savings || 0,
      savingsPercentage: pricing.savings_percentage || 0
    }
  })

  return {
    comparison,
    loading,
    error,
    totalPlans: plans.length,
    popularPlan: plans.find(p => p.is_popular)
  }
}