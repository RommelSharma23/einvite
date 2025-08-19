// File: src/lib/galleryConfig.ts

import React from 'react'
import { 
  Grid3X3, 
  ChevronRight, 
  MoreHorizontal, 
  Camera,
  Calendar,
  Sparkles,
  Heart,
  Palette,
  Crown
} from 'lucide-react'

// Import all gallery components
import { WeddingGallery } from '@/components/wedding/WeddingGallery'
import { SingleCarouselGallery } from '@/components/wedding/gallery-styles/SingleCarouselGallery'
import { MultiImageCarousel } from '@/components/wedding/gallery-styles/MultiImageCarousel'
import { MasonryGallery } from '@/components/wedding/gallery-styles/MasonryGallery'
import { LightboxGallery } from '@/components/wedding/gallery-styles/LightboxGallery'
import { TimelineGallery } from '@/components/wedding/gallery-styles/TimelineGallery'
import { PolaroidGallery } from '@/components/wedding/gallery-styles/PolaroidGallery'
import { CollageGallery } from '@/components/wedding/gallery-styles/CollageGallery'

export interface GalleryStyle {
  id: string
  name: string
  description: string
  tier: 'free' | 'silver' | 'gold' | 'platinum'
  icon: React.ReactNode
  preview: string
  features: string[]
  component: React.ComponentType<GalleryComponentProps>
  props?: Record<string, unknown>
  category: 'basic' | 'carousel' | 'creative' | 'premium'
}

// Base props that all gallery components should accept
export interface GalleryComponentProps {
  images: Array<{
    id: string
    file_url: string
    file_name: string
    caption?: string
    gallery_category: string
    display_order: number
  }>
  events?: Array<{
    id: string
    event_name: string
    event_date: string
    venue_name?: string
    venue_address?: string
    event_description?: string
  }>
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  brideName?: string
  groomName?: string
  [key: string]: unknown // Allow additional props
}

export interface TierInfo {
  name: string
  color: string
  icon: React.ReactNode | null
  maxStyles: number
  price: number
  currency: string
}

export const GALLERY_STYLES: GalleryStyle[] = [
  // FREE TIER - Basic
  {
    id: 'grid',
    name: 'Grid Layout',
    description: 'Clean, organized photo grid with category filtering',
    tier: 'free',
    icon: React.createElement(Grid3X3, { className: 'h-5 w-5' }),
    preview: '⊞ ⊞ ⊞\n⊞ ⊞ ⊞',
    features: ['Responsive grid', 'Category filtering', 'Click to expand', 'Mobile optimized'],
    component: WeddingGallery,
    category: 'basic'
  },
  
  // SILVER TIER - Carousel Styles
  {
    id: 'single-carousel',
    name: 'Single Carousel',
    description: 'One image at a time with smooth navigation',
    tier: 'silver',
    icon: React.createElement(ChevronRight, { className: 'h-5 w-5' }),
    preview: '← [📷] →',
    features: ['Navigation arrows', 'Auto-play option', 'Smooth transitions', 'Touch support'],
    component: SingleCarouselGallery,
    props: { autoPlay: false, showCounter: true },
    category: 'carousel'
  },
  {
    id: 'multi-carousel',
    name: 'Multi-Image Carousel',
    description: '2-4 images visible with sliding navigation',
    tier: 'silver',
    icon: React.createElement(MoreHorizontal, { className: 'h-5 w-5' }),
    preview: '[📷] [📷] [📷]',
    features: ['Multiple images', 'Touch/swipe support', 'Responsive sizing', 'Smooth sliding'],
    component: MultiImageCarousel,
    props: { imagesPerView: 3, autoSlide: false },
    category: 'carousel'
  },
  
  // GOLD TIER - Creative Layouts
  {
    id: 'masonry',
    name: 'Masonry Layout',
    description: 'Pinterest-style flowing layout with varied sizes',
    tier: 'gold',
    icon: React.createElement(Sparkles, { className: 'h-5 w-5' }),
    preview: '⬛ ⬜\n⬜ ⬛⬛\n⬛ ⬜',
    features: ['Artistic layout', 'Different image sizes', 'Optimal space usage', 'Download protection'],
    component: MasonryGallery,
    props: { enableDownloadProtection: true, columns: { mobile: 2, tablet: 3, desktop: 4 } },
    category: 'creative'
  },
  {
    id: 'lightbox',
    name: 'Lightbox Gallery',
    description: 'Thumbnails with professional full-screen view',
    tier: 'gold',
    icon: React.createElement(Camera, { className: 'h-5 w-5' }),
    preview: '□ □ □\n□ □ □',
    features: ['Thumbnail grid', 'Full-screen modal', 'Smooth zoom', 'Photo captions'],
    component: LightboxGallery,
    props: { enableDownloadProtection: true, enableZoom: true, thumbnailSize: 'medium' },
    category: 'creative'
  },
  
  // PLATINUM TIER - Premium Artistic
  {
    id: 'timeline',
    name: 'Timeline Gallery',
    description: 'Story-based chronological layout with events',
    tier: 'platinum',
    icon: React.createElement(Calendar, { className: 'h-5 w-5' }),
    preview: '📅—📷—📷\n   |    |\n  📷  📷',
    features: ['Chronological order', 'Event sections', 'Story narrative', 'Auto-play slideshow'],
    component: TimelineGallery,
    props: { enableDownloadProtection: true, autoPlaySlideshow: false },
    category: 'premium'
  },
  {
    id: 'polaroid',
    name: 'Polaroid Style',
    description: 'Authentic polaroid photos with rotation effects',
    tier: 'platinum',
    icon: React.createElement(Heart, { className: 'h-5 w-5' }),
    preview: '📸📸📸\n 📸📸\n📸📸📸',
    features: ['Polaroid frames', 'Drag & rearrange', 'Shuffle animation', 'Handwritten captions'],
    component: PolaroidGallery,
    props: { enableDownloadProtection: true, enableDragging: true, polaroidStyle: 'classic' },
    category: 'premium'
  },
  {
    id: 'collage',
    name: 'Artistic Collage',
    description: 'Creative collages with multiple artistic templates',
    tier: 'platinum',
    icon: React.createElement(Palette, { className: 'h-5 w-5' }),
    preview: '🎨🖼️🎭\n🖼️🎨🖼️\n🎭🖼️🎨',
    features: ['5 artistic templates', 'Heart & circle layouts', 'Template switching', 'Smart positioning'],
    component: CollageGallery,
    props: { enableDownloadProtection: true, defaultTemplate: 'heart' },
    category: 'premium'
  }
]

export const TIER_INFO: Record<string, TierInfo> = {
  free: { 
    name: 'Free', 
    color: 'bg-gray-100 text-gray-800', 
    icon: null, 
    maxStyles: 1,
    price: 0,
    currency: 'INR'
  },
  silver: { 
    name: 'Silver', 
    color: 'bg-gray-100 text-gray-800', 
    icon: null, 
    maxStyles: 3,
    price: 499,
    currency: 'INR'
  },
  gold: { 
    name: 'Gold', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: React.createElement(Crown, { className: 'h-3 w-3' }), 
    maxStyles: 5,
    price: 999,
    currency: 'INR'
  },
  platinum: { 
    name: 'Platinum', 
    color: 'bg-purple-100 text-purple-800', 
    icon: React.createElement(Sparkles, { className: 'h-3 w-3' }), 
    maxStyles: 8,
    price: 1999,
    currency: 'INR'
  }
}

export const TIER_HIERARCHY = ['free', 'silver', 'gold', 'platinum'] as const

export type UserTier = typeof TIER_HIERARCHY[number]

// Helper Functions
export const getAvailableStyles = (userTier: UserTier): GalleryStyle[] => {
  const tierIndex = TIER_HIERARCHY.indexOf(userTier)
  return GALLERY_STYLES.filter(style => {
    const styleTierIndex = TIER_HIERARCHY.indexOf(style.tier)
    return styleTierIndex <= tierIndex
  })
}

export const getLockedStyles = (userTier: UserTier): GalleryStyle[] => {
  const tierIndex = TIER_HIERARCHY.indexOf(userTier)
  return GALLERY_STYLES.filter(style => {
    const styleTierIndex = TIER_HIERARCHY.indexOf(style.tier)
    return styleTierIndex > tierIndex
  })
}

export const getStylesByCategory = (category: GalleryStyle['category']): GalleryStyle[] => {
  return GALLERY_STYLES.filter(style => style.category === category)
}

export const getStylesByTier = (tier: UserTier): GalleryStyle[] => {
  return GALLERY_STYLES.filter(style => style.tier === tier)
}

export const getStyleById = (styleId: string): GalleryStyle | undefined => {
  return GALLERY_STYLES.find(style => style.id === styleId)
}

export const isStyleAvailable = (styleId: string, userTier: UserTier): boolean => {
  const style = getStyleById(styleId)
  if (!style) return false
  
  const userTierIndex = TIER_HIERARCHY.indexOf(userTier)
  const styleTierIndex = TIER_HIERARCHY.indexOf(style.tier)
  return styleTierIndex <= userTierIndex
}

export const getNextTierForStyle = (styleId: string): UserTier | null => {
  const style = getStyleById(styleId)
  return style ? style.tier : null
}

export const getTierUpgradeMessage = (targetTier: UserTier): string => {
  const messages = {
    free: 'Start with our free basic gallery',
    silver: 'Upgrade to Silver for ₹499 to unlock carousel galleries',
    gold: 'Upgrade to Gold for ₹999 to unlock creative layouts with captions',
    platinum: 'Upgrade to Platinum for ₹1999 to unlock premium artistic galleries'
  }
  return messages[targetTier]
}

export const formatPrice = (price: number, currency: string = 'INR'): string => {
  if (price === 0) return 'Free'
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(price)
}

// Gallery Style Categories for UI Organization
export const GALLERY_CATEGORIES = {
  basic: {
    name: 'Basic',
    description: 'Simple and clean gallery layouts',
    icon: React.createElement(Grid3X3, { className: 'h-4 w-4' })
  },
  carousel: {
    name: 'Carousel',
    description: 'Sliding photo carousels with navigation',
    icon: React.createElement(ChevronRight, { className: 'h-4 w-4' })
  },
  creative: {
    name: 'Creative',
    description: 'Artistic layouts with advanced features',
    icon: React.createElement(Sparkles, { className: 'h-4 w-4' })
  },
  premium: {
    name: 'Premium',
    description: 'Exclusive artistic galleries with premium features',
    icon: React.createElement(Crown, { className: 'h-4 w-4' })
  }
} as const

// Default gallery style for each tier
export const DEFAULT_GALLERY_STYLES: Record<UserTier, string> = {
  free: 'grid',
  silver: 'single-carousel',
  gold: 'masonry',
  platinum: 'timeline'
}

// Recommended gallery styles for different use cases
export const RECOMMENDED_STYLES = {
  mobile: ['grid', 'single-carousel', 'lightbox'],
  desktop: ['masonry', 'multi-carousel', 'timeline'],
  events: ['timeline', 'collage'],
  portraits: ['polaroid', 'lightbox', 'masonry'],
  landscapes: ['grid', 'masonry', 'multi-carousel']
}

// Exported configuration object
const galleryConfig = {
  GALLERY_STYLES,
  TIER_INFO,
  TIER_HIERARCHY,
  getAvailableStyles,
  getLockedStyles,
  getStyleById,
  isStyleAvailable,
  getTierUpgradeMessage,
  formatPrice
}

export default galleryConfig