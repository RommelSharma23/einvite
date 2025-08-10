// File: src/components/editor/GalleryStyleSelector.tsx

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Grid3X3, 
  ChevronRight, 
  MoreHorizontal, 
  Calendar,
  Camera,
  Lock,
  Crown,
  Sparkles
} from 'lucide-react'

interface GalleryStyle {
  id: string
  name: string
  description: string
  tier: 'free' | 'silver' | 'gold' | 'platinum'
  icon: React.ReactNode
  preview: string
  features: string[]
}

interface GalleryStyleSelectorProps {
  currentTier: 'free' | 'silver' | 'gold' | 'platinum'
  selectedStyle: string
  onStyleChange: (styleId: string) => void
  onUpgrade: (targetTier: string) => void
}

const GALLERY_STYLES: GalleryStyle[] = [
  {
    id: 'grid',
    name: 'Grid Layout',
    description: 'Clean, organized photo grid',
    tier: 'free',
    icon: <Grid3X3 className="h-5 w-5" />,
    preview: '⊞ ⊞ ⊞\n⊞ ⊞ ⊞',
    features: ['Responsive grid', 'Category filtering', 'Click to expand']
  },
  {
    id: 'single-carousel',
    name: 'Single Carousel',
    description: 'One image at a time with navigation',
    tier: 'silver',
    icon: <ChevronRight className="h-5 w-5" />,
    preview: '← [📷] →',
    features: ['Navigation arrows', 'Auto-play option', 'Smooth transitions']
  },
  {
    id: 'multi-carousel',
    name: 'Multi-Image Carousel',
    description: '2-4 images visible with sliding',
    tier: 'silver',
    icon: <MoreHorizontal className="h-5 w-5" />,
    preview: '[📷] [📷] [📷]',
    features: ['Multiple images', 'Touch/swipe support', 'Responsive sizing']
  },
  {
    id: 'masonry',
    name: 'Masonry Layout',
    description: 'Pinterest-style flowing layout',
    tier: 'gold',
    icon: <Sparkles className="h-5 w-5" />,
    preview: '⬛ ⬜\n⬜ ⬛⬛\n⬛ ⬜',
    features: ['Artistic layout', 'Different image sizes', 'Optimal space usage']
  },
  {
    id: 'lightbox',
    name: 'Lightbox Gallery',
    description: 'Thumbnails with full-screen view',
    tier: 'gold',
    icon: <Camera className="h-5 w-5" />,
    preview: '□ □ □\n□ □ □',
    features: ['Thumbnail grid', 'Full-screen modal', 'Smooth zoom']
  },
  {
    id: 'timeline',
    name: 'Timeline Gallery',
    description: 'Story-based chronological layout',
    tier: 'platinum',
    icon: <Calendar className="h-5 w-5" />,
    preview: '📅—📷—📷\n   |    |\n  📷  📷',
    features: ['Chronological order', 'Event sections', 'Story narrative']
  }
]

const TIER_INFO = {
  free: { name: 'Free', color: 'bg-gray-100 text-gray-800', icon: null },
  silver: { name: 'Silver', color: 'bg-gray-100 text-gray-800', icon: null },
  gold: { name: 'Gold', color: 'bg-yellow-100 text-yellow-800', icon: <Crown className="h-3 w-3" /> },
  platinum: { name: 'Platinum', color: 'bg-purple-100 text-purple-800', icon: <Sparkles className="h-3 w-3" /> }
}

const TIER_HIERARCHY = ['free', 'silver', 'gold', 'platinum']

export function GalleryStyleSelector({
  currentTier,
  selectedStyle,
  onStyleChange,
  onUpgrade
}: GalleryStyleSelectorProps) {
  const [previewStyle, setPreviewStyle] = useState<string | null>(null)

  const getCurrentTierIndex = () => TIER_HIERARCHY.indexOf(currentTier)
  const getStyleTierIndex = (style: GalleryStyle) => TIER_HIERARCHY.indexOf(style.tier)
  
  const isStyleAvailable = (style: GalleryStyle) => {
    return getStyleTierIndex(style) <= getCurrentTierIndex()
  }

  const getAvailableStyles = () => {
    return GALLERY_STYLES.filter(style => isStyleAvailable(style))
  }

  const getLockedStyles = () => {
    return GALLERY_STYLES.filter(style => !isStyleAvailable(style))
  }

  const handleStyleSelect = (styleId: string, style: GalleryStyle) => {
    if (isStyleAvailable(style)) {
      onStyleChange(styleId)
    } else {
      // Show upgrade prompt
      onUpgrade(style.tier)
    }
  }

  const getTierUpgradeMessage = (targetTier: string) => {
    const messages = {
      silver: 'Upgrade to Silver for ₹499 to unlock carousel galleries',
      gold: 'Upgrade to Gold for ₹999 to unlock creative layouts',
      platinum: 'Upgrade to Platinum for ₹1999 to unlock premium galleries'
    }
    return messages[targetTier as keyof typeof messages]
  }

  return (
    <div className="space-y-6">
      {/* Current Tier Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Gallery Styles</CardTitle>
            <Badge className={TIER_INFO[currentTier].color}>
              {TIER_INFO[currentTier].icon}
              <span className="ml-1">{TIER_INFO[currentTier].name} Plan</span>
            </Badge>
          </div>
          <CardDescription>
            Choose how your photos will be displayed to guests
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Available Styles */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-900">Available Styles ({getAvailableStyles().length})</h4>
        
        <div className="grid gap-3">
          {getAvailableStyles().map((style) => (
            <div
              key={style.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-400 ${
                selectedStyle === style.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleStyleSelect(style.id, style)}
              onMouseEnter={() => setPreviewStyle(style.id)}
              onMouseLeave={() => setPreviewStyle(null)}
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${
                  selectedStyle === style.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-medium text-gray-900">{style.name}</h5>
                    {selectedStyle === style.id && (
                      <Badge variant="default" className="text-xs">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{style.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {style.features.slice(0, 2).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {style.features.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{style.features.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="text-right">
                  <div className="text-xs font-mono text-gray-400 whitespace-pre-line leading-tight">
                    {style.preview}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Locked Styles */}
      {getLockedStyles().length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-900">
              Unlock More Styles ({getLockedStyles().length})
            </h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpgrade(getLockedStyles()[0].tier)}
            >
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </div>
          
          <div className="grid gap-3">
            {getLockedStyles().map((style) => (
              <div
                key={style.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative overflow-hidden"
              >
                {/* Lock Overlay */}
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {TIER_INFO[style.tier as keyof typeof TIER_INFO].name} Plan
                    </p>
                    <Button 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => onUpgrade(style.tier)}
                    >
                      Upgrade
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3 opacity-60">
                  {/* Icon */}
                  <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-medium text-gray-900">{style.name}</h5>
                      <Badge className={TIER_INFO[style.tier as keyof typeof TIER_INFO].color}>
                        {TIER_INFO[style.tier as keyof typeof TIER_INFO].name}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{style.description}</p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {style.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="text-right">
                    <div className="text-xs font-mono text-gray-400 whitespace-pre-line leading-tight">
                      {style.preview}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Prompt */}
      {getLockedStyles().length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Crown className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  Unlock More Gallery Styles
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  {getTierUpgradeMessage(getLockedStyles()[0].tier)}
                </p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => onUpgrade(getLockedStyles()[0].tier)}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}