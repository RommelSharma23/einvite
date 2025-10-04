'use client'

import { useState, useEffect } from 'react'
import { Check, Crown, Heart, Star } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loading } from '@/components/ui/loading'

interface PricingPlan {
  id: string
  plan_code: string
  name: string
  description: string
  tagline: string
  is_popular: boolean
  pricing: {
    india: {
      price: number
      original_price?: number
      currency: string
      formatted: string
      original_formatted?: string
      is_sale: boolean
      savings_percentage?: number
    }
    international: {
      price: number
      original_price?: number
      currency: string
      formatted: string
      original_formatted?: string
      is_sale: boolean
      savings_percentage?: number
    }
  }
  features: Array<{
    feature_name: string
    description: string
    is_included: boolean
    feature_limit?: number
  }>
}

// Fallback pricing data
const fallbackPlans: PricingPlan[] = [
  {
    id: '1',
    plan_code: 'silver',
    name: 'Silver',
    description: 'Perfect for intimate celebrations',
    tagline: 'Great for small weddings',
    is_popular: false,
    pricing: {
      india: {
        price: 999,
        currency: 'INR',
        formatted: '₹999',
        is_sale: false
      },
      international: {
        price: 12,
        currency: 'USD',
        formatted: '$12',
        is_sale: false
      }
    },
    features: [
      { feature_name: 'Beautiful Templates', description: 'Access to premium templates', is_included: true },
      { feature_name: 'Custom Domain', description: 'yourname.ecardvite.com', is_included: true },
      { feature_name: 'RSVP Management', description: 'Collect guest responses', is_included: true },
      { feature_name: 'Photo Gallery', description: 'Share your memories', is_included: true },
      { feature_name: 'Guest Limit', description: 'Up to 50 guests', is_included: true, feature_limit: 50 }
    ]
  },
  {
    id: '2',
    plan_code: 'gold',
    name: 'Gold',
    description: 'Perfect for most weddings',
    tagline: 'Most popular choice',
    is_popular: true,
    pricing: {
      india: {
        price: 1999,
        original_price: 2999,
        currency: 'INR',
        formatted: '₹1,999',
        original_formatted: '₹2,999',
        is_sale: true,
        savings_percentage: 33
      },
      international: {
        price: 24,
        original_price: 36,
        currency: 'USD',
        formatted: '$24',
        original_formatted: '$36',
        is_sale: true,
        savings_percentage: 33
      }
    },
    features: [
      { feature_name: 'Everything in Silver', description: 'All Silver features included', is_included: true },
      { feature_name: 'Photo Sharing via QR', description: 'Let guests upload photos', is_included: true },
      { feature_name: 'Advanced RSVP', description: 'Meal preferences, +1s', is_included: true },
      { feature_name: 'Interactive Maps', description: 'Venue directions', is_included: true },
      { feature_name: 'Guest Limit', description: 'Up to 150 guests', is_included: true, feature_limit: 150 },
      { feature_name: 'Background Music', description: 'Add ambiance', is_included: true }
    ]
  },
  {
    id: '3',
    plan_code: 'platinum',
    name: 'Platinum',
    description: 'For grand celebrations',
    tagline: 'Ultimate wedding experience',
    is_popular: false,
    pricing: {
      india: {
        price: 3999,
        currency: 'INR',
        formatted: '₹3,999',
        is_sale: false
      },
      international: {
        price: 48,
        currency: 'USD',
        formatted: '$48',
        is_sale: false
      }
    },
    features: [
      { feature_name: 'Everything in Gold', description: 'All Gold features included', is_included: true },
      { feature_name: 'Custom Domain', description: 'Use your own domain', is_included: true },
      { feature_name: 'Priority Support', description: '24/7 dedicated support', is_included: true },
      { feature_name: 'Advanced Analytics', description: 'Detailed visitor insights', is_included: true },
      { feature_name: 'Guest Limit', description: 'Unlimited guests', is_included: true },
      { feature_name: 'White-label', description: 'Remove ECardVite branding', is_included: true }
    ]
  }
]

export function Pricing() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState<'india' | 'international'>('india')
  const [currency, setCurrency] = useState<string>('INR')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true)
        setError(null)

        // Step 1: Auto-detect user's region
        console.log('🌍 Auto-detecting user region...')
        const regionResponse = await fetch('/api/detect-region')
        let detectedRegion = 'india'
        let detectedCurrency = 'INR'

        if (regionResponse.ok) {
          const regionData = await regionResponse.json()
          if (regionData.success) {
            detectedRegion = regionData.region
            detectedCurrency = regionData.currency
            setRegion(detectedRegion)
            setCurrency(detectedCurrency)
            console.log(`✅ Detected region: ${detectedRegion} (${detectedCurrency})`)
          }
        } else {
          console.warn('⚠️ Region detection failed, using default (India)')
        }

        // Step 2: Fetch pricing for detected region
        console.log(`💰 Fetching pricing for region: ${detectedRegion}`)
        const response = await fetch(`/api/pricing/raw?region=${detectedRegion}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Pricing API response:', data)

        if (data.success && data.data?.plans && data.data.plans.length > 0) {
          setPlans(data.data.plans)
          console.log(`Loaded ${data.data.plans.length} plans`)
        } else {
          console.warn('No pricing data received, using fallback')
          setPlans(fallbackPlans)
        }
      } catch (error) {
        console.error('Error fetching pricing:', error)
        setError('Failed to load live pricing. Showing default plans.')
        setPlans(fallbackPlans)
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [])

  const getPlanIcon = (planCode: string) => {
    switch (planCode) {
      case 'silver':
        return <Heart className="w-6 h-6" />
      case 'gold':
        return <Star className="w-6 h-6" />
      case 'platinum':
        return <Crown className="w-6 h-6" />
      default:
        return <Heart className="w-6 h-6" />
    }
  }

  const getPlanColor = (planCode: string) => {
    switch (planCode) {
      case 'silver':
        return 'from-gray-400 to-gray-600'
      case 'gold':
        return 'from-yellow-400 to-yellow-600'
      case 'platinum':
        return 'from-purple-500 to-purple-700'
      default:
        return 'from-blue-500 to-blue-700'
    }
  }

  if (loading) {
    return (
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="text-gray-600">Loading pricing plans...</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Display */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-yellow-800 mb-2">{error}</p>
            <button
              onClick={() => window.open('/api/pricing/test-data', '_blank')}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              🔍 Test Database Connection
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Perfect
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {" "}Wedding Plan
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            From intimate gatherings to grand celebrations, we have the perfect plan for your special day.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const currentPricing = plan.pricing[region]
            const planColor = getPlanColor(plan.plan_code)

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.is_popular
                    ? 'border-purple-500 shadow-purple-100 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-semibold">
                    Most Popular ⭐
                  </div>
                )}

                <CardHeader className={`text-center ${plan.is_popular ? 'pt-12' : 'pt-8'}`}>
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${planColor} flex items-center justify-center mx-auto mb-4 text-white`}>
                    {getPlanIcon(plan.plan_code)}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 text-sm">{plan.tagline}</p>

                  <div className="mt-4">
                    {currentPricing.is_sale && currentPricing.original_formatted && (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg text-gray-500 line-through">{currentPricing.original_formatted}</span>
                        {currentPricing.savings_percentage && (
                          <Badge className="bg-red-500 text-white">
                            {currentPricing.savings_percentage}% OFF
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="text-4xl font-bold text-gray-900">
                      {currentPricing.formatted}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">One-time payment</p>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-8">
                  <a href="/auth/register">
                    <Button
                      className={`w-full mb-6 ${
                        plan.is_popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                          : ''
                      }`}
                      variant={plan.is_popular ? 'default' : 'outline'}
                    >
                      {plan.is_popular ? 'Get Started' : 'Choose Plan'}
                    </Button>
                  </a>

                  <div className="space-y-3">
                    <p className="font-semibold text-gray-900 text-sm mb-3">What&apos;s included:</p>
                    {plan.features.slice(0, 8).map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`mt-0.5 ${feature.is_included ? 'text-green-500' : 'text-gray-400'}`}>
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm ${feature.is_included ? 'text-gray-900' : 'text-gray-400'}`}>
                            {feature.feature_name}
                            {feature.feature_limit && (
                              <span className="text-purple-600 font-medium">
                                {" "}({feature.feature_limit})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                    {plan.features.length > 8 && (
                      <p className="text-xs text-gray-500 mt-2">
                        +{plan.features.length - 8} more features included
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom Section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-200">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Need Something Custom?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Planning a large celebration or need custom features? Contact our team for a personalized solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
              <Button variant="ghost" size="lg">
                Compare All Features
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}