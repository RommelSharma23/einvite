// File: src/components/editor/GalleryStyleSwitcher.tsx

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown,
  Lock,
  Eye,
  Camera,
  Grid3X3, 
  ChevronRight, 
  MoreHorizontal, 
  Calendar,
  Sparkles
} from 'lucide-react'

type UserTier = 'free' | 'silver' | 'gold' | 'platinum'

interface GalleryStyle {
  id: string
  name: string
  description: string
  tier: UserTier
  icon: React.ReactNode
  preview: string
  features: string[]
}

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
}

interface WeddingEvent {
  id: string
  event_name: string
  event_date: string
  venue_name?: string
  venue_address?: string
  event_description?: string
}

interface GalleryStyleSwitcherProps {
  images: GalleryImage[]
  events?: WeddingEvent[]
  currentTier: UserTier
  selectedStyle: string
  onStyleChange: (styleId: string) => void
  onUpgrade: (targetTier: UserTier) => void
  primaryColor: string
  secondaryColor: string
  brideName?: string
  groomName?: string
  isPreviewMode?: boolean
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

function isStyleAvailable(styleId: string, userTier: UserTier): boolean {
  const style = GALLERY_STYLES.find(s => s.id === styleId)
  if (!style) return false
  
  const userIndex = TIER_HIERARCHY.indexOf(userTier)
  const requiredIndex = TIER_HIERARCHY.indexOf(style.tier)
  
  return userIndex >= requiredIndex
}

function getAvailableStyles(userTier: UserTier): GalleryStyle[] {
  return GALLERY_STYLES.filter(style => isStyleAvailable(style.id, userTier))
}

function getLockedStyles(userTier: UserTier): GalleryStyle[] {
  return GALLERY_STYLES.filter(style => !isStyleAvailable(style.id, userTier))
}

function getTierUpgradeMessage(targetTier: UserTier): string {
  const messages = {
    free: '',
    silver: 'Upgrade to Silver for ₹499 to unlock carousel galleries',
    gold: 'Upgrade to Gold for ₹999 to unlock creative layouts',
    platinum: 'Upgrade to Platinum for ₹1999 to unlock premium galleries'
  }
  return messages[targetTier]
}

export function GalleryStyleSwitcher({
  images,
  currentTier,
  selectedStyle,
  onStyleChange,
  onUpgrade,
  primaryColor,
  isPreviewMode = false
}: GalleryStyleSwitcherProps) {
  const [showAllStyles, setShowAllStyles] = useState(false)

  const handleStyleSelect = (styleId: string, style: GalleryStyle) => {
    if (isStyleAvailable(styleId, currentTier)) {
      onStyleChange(styleId)
    } else {
      onUpgrade(style.tier)
    }
  }

  const renderGalleryPreview = () => {
    if (images.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Camera className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Upload photos to preview gallery styles</p>
          </div>
        </div>
      )
    }

    // Simple preview based on selected style
    const renderStylePreview = () => {
      switch (selectedStyle) {
        case 'grid':
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
              {images.slice(0, 6).map((image) => (
                <div key={image.id} className="aspect-square rounded-lg overflow-hidden border-2 border-white shadow-sm">
                  <img
                    src={image.file_url}
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )
        
        case 'single-carousel':
          return (
            <div className="p-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
                <img
                  src={images[0]?.file_url}
                  alt="Gallery preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-between p-4">
                  <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          )
        
        default:
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
              {images.slice(0, 6).map((image) => (
                <div key={image.id} className="aspect-square rounded-lg overflow-hidden border-2 border-white shadow-sm">
                  <img
                    src={image.file_url}
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )
      }
    }

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-600">Live Preview</span>
          </div>
        </div>
        
        <div className="h-96 bg-gray-50 rounded-lg overflow-hidden">
          {renderStylePreview()}
        </div>
      </div>
    )
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

      {/* Live Preview */}
      {!isPreviewMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Preview</CardTitle>
            <CardDescription>
              See how your gallery will look with the selected style
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderGalleryPreview()}
          </CardContent>
        </Card>
      )}

      {/* Available Styles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-gray-900">
            Available Styles ({getAvailableStyles(currentTier).length})
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllStyles(!showAllStyles)}
          >
            {showAllStyles ? 'Show Less' : 'Show All'}
          </Button>
        </div>
        
        <div className="grid gap-3">
          {(showAllStyles ? getAvailableStyles(currentTier) : getAvailableStyles(currentTier).slice(0, 3)).map((style) => (
            <div
              key={style.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-400 ${
                selectedStyle === style.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleStyleSelect(style.id, style)}
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
                    <Badge className={TIER_INFO[style.tier].color}>
                      {TIER_INFO[style.tier].name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{style.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {style.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {style.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{style.features.length - 3} more
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
      {getLockedStyles(currentTier).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-900">
              Unlock More Styles ({getLockedStyles(currentTier).length})
            </h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpgrade(getLockedStyles(currentTier)[0].tier)}
            >
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </div>
          
          <div className="grid gap-3">
            {getLockedStyles(currentTier).slice(0, 3).map((style) => (
              <div
                key={style.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative overflow-hidden"
              >
                {/* Lock Overlay */}
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {TIER_INFO[style.tier].name} Plan
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
                      <Badge className={TIER_INFO[style.tier].color}>
                        {TIER_INFO[style.tier].name}
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
      {getLockedStyles(currentTier).length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Crown className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  Unlock More Gallery Styles
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  {getTierUpgradeMessage(getLockedStyles(currentTier)[0].tier)}
                </p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => onUpgrade(getLockedStyles(currentTier)[0].tier)}
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