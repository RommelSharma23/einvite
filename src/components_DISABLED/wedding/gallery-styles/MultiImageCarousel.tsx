// File: src/components/wedding/gallery-styles/MultiImageCarousel.tsx

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  X,
  Heart,
  Images as ImagesIcon
} from 'lucide-react'

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
}

interface MultiImageCarouselProps {
  images: GalleryImage[]
  primaryColor: string
  secondaryColor: string
  brideName?: string
  groomName?: string
  imagesPerView?: number
  showCaptions?: boolean
  autoSlide?: boolean
  slideInterval?: number
}

export function MultiImageCarousel({
  images,
  primaryColor,
  secondaryColor,
  brideName = 'Bride',
  groomName = 'Groom',
  imagesPerView = 3,
  showCaptions = true,
  autoSlide = false,
  slideInterval = 5000
}: MultiImageCarouselProps) {
  // ALL HOOKS FIRST
  const [currentStartIndex, setCurrentStartIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [isAutoSliding, setIsAutoSliding] = useState(autoSlide)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const getResponsiveImagesPerView = useCallback(() => {
    if (typeof window === 'undefined') return imagesPerView
    
    const width = window.innerWidth
    if (width < 640) return 1 // Mobile: 1 image
    if (width < 768) return 2 // Tablet: 2 images  
    if (width < 1024) return Math.min(3, imagesPerView) // Small desktop: max 3
    return imagesPerView // Large desktop: as specified
  }, [imagesPerView])

  const [visibleCount, setVisibleCount] = useState(getResponsiveImagesPerView())

  const goToPrevious = useCallback(() => {
    if (!images || images.length === 0) return
    setCurrentStartIndex((prevIndex) => 
      prevIndex === 0 ? Math.max(0, images.length - visibleCount) : Math.max(0, prevIndex - 1)
    )
  }, [images, visibleCount])

  const goToNext = useCallback(() => {
    if (!images || images.length === 0) return
    setCurrentStartIndex((prevIndex) => 
      prevIndex >= images.length - visibleCount ? 0 : prevIndex + 1
    )
  }, [images, visibleCount])

  const openModal = useCallback((image: GalleryImage) => {
    setSelectedImage(image)
    setIsAutoSliding(false) // Pause auto-sliding when modal opens
  }, [])

  const closeModal = useCallback(() => {
    setSelectedImage(null)
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getResponsiveImagesPerView())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getResponsiveImagesPerView])

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoSliding || !images || images.length <= visibleCount) return

    const interval = setInterval(() => {
      setCurrentStartIndex((prevIndex) => 
        prevIndex >= images.length - visibleCount ? 0 : prevIndex + 1
      )
    }, slideInterval)

    return () => clearInterval(interval)
  }, [isAutoSliding, images, visibleCount, slideInterval])

  // Touch/drag handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setDragStart(e.touches[0].clientX)
    }

    const handleTouchMove = (e: TouchEvent) => {
      setDragEnd(e.touches[0].clientX)
    }

    const handleTouchEnd = () => {
      if (!dragStart || !dragEnd) return
      
      const dragDistance = dragStart - dragEnd
      const threshold = 50

      if (Math.abs(dragDistance) > threshold) {
        if (dragDistance > 0) {
          goToNext()
        } else {
          goToPrevious()
        }
      }

      setDragStart(null)
      setDragEnd(null)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('touchstart', handleTouchStart)
      container.addEventListener('touchmove', handleTouchMove)
      container.addEventListener('touchend', handleTouchEnd)

      return () => {
        container.removeEventListener('touchstart', handleTouchStart)
        container.removeEventListener('touchmove', handleTouchMove)
        container.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [dragStart, dragEnd, goToNext, goToPrevious])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage) {
        if (e.key === 'Escape') {
          closeModal()
        }
        return
      }

      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, goToPrevious, goToNext, closeModal])

  // Early return after all hooks
  if (!images || images.length === 0) {
    return null
  }

  const canGoPrevious = currentStartIndex > 0
  const canGoNext = currentStartIndex < images.length - visibleCount
  const visibleImages = images.slice(currentStartIndex, currentStartIndex + visibleCount)

  const shareImage = async (image: GalleryImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${brideName} & ${groomName} Wedding Photo`,
          text: image.caption || 'Beautiful wedding moment',
          url: image.file_url
        })
      } catch {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(image.file_url)
        alert('Image URL copied to clipboard!')
      } catch {
        console.error('Failed to copy URL')
      }
    }
  }

  const getCategoryDisplayName = (category: string) => {
    const categoryNames: Record<string, string> = {
      'pre_wedding': 'Pre-Wedding',
      'engagement': 'Engagement',
      'family': 'Family',
      'couple': 'Couple'
    }
    return categoryNames[category] || category
  }

  return (
    <>
      <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <ImagesIcon className="h-5 w-5" style={{ color: primaryColor }} />
            <h3 className="font-semibold text-gray-900">Our Beautiful Moments</h3>
          </div>
          <div className="text-sm text-gray-500">
            {currentStartIndex + 1}-{Math.min(currentStartIndex + visibleCount, images.length)} of {images.length}
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative" ref={containerRef}>
          {/* Images Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {visibleImages.map((image, index) => (
              <div
                key={image.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square bg-gray-100"
                onClick={() => openModal(image)}
              >
                <Image
                  src={image.file_url}
                  alt={image.caption || `Wedding photo ${currentStartIndex + index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-lg"
                      style={{ backgroundColor: `${secondaryColor}dd` }}
                    >
                      {getCategoryDisplayName(image.gallery_category)}
                    </span>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      shareImage(image)
                    }}
                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    aria-label="Share image"
                  >
                    <Share2 className="h-3 w-3" />
                  </button>

                  {/* Caption */}
                  {showCaptions && image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-medium line-clamp-2">
                        {image.caption}
                      </p>
                    </div>
                  )}
                </div>

                {/* Love Icon for Special Photos */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Heart className="h-4 w-4 text-white drop-shadow-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          {images.length > visibleCount && (
            <>
              {/* Previous Button */}
              <button
                onClick={goToPrevious}
                disabled={!canGoPrevious}
                className={`absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all duration-200 ${
                  canGoPrevious
                    ? 'bg-white shadow-lg hover:shadow-xl text-gray-700 hover:text-gray-900'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                style={{ 
                  boxShadow: canGoPrevious ? `0 4px 20px ${primaryColor}20` : undefined 
                }}
                aria-label="Previous images"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Next Button */}
              <button
                onClick={goToNext}
                disabled={!canGoNext}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all duration-200 ${
                  canGoNext
                    ? 'bg-white shadow-lg hover:shadow-xl text-gray-700 hover:text-gray-900'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                style={{ 
                  boxShadow: canGoNext ? `0 4px 20px ${primaryColor}20` : undefined 
                }}
                aria-label="Next images"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Progress Indicator */}
        {images.length > visibleCount && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-center space-x-1">
              {Array.from({ length: Math.ceil(images.length / visibleCount) }).map((_, index) => {
                const isActive = Math.floor(currentStartIndex / visibleCount) === index
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentStartIndex(index * visibleCount)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      isActive ? 'scale-125' : 'hover:scale-110'
                    }`}
                    style={{ 
                      backgroundColor: isActive ? primaryColor : `${primaryColor}40` 
                    }}
                    aria-label={`Go to page ${index + 1}`}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                {images.length} photos
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">
                {new Set(images.map(img => img.gallery_category)).size} categories
              </span>
            </div>
            
            {images.length > visibleCount && (
              <button
                onClick={() => setIsAutoSliding(!isAutoSliding)}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="text-xs">
                  {isAutoSliding ? 'Pause' : 'Play'} slideshow
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Share Button */}
            <button
              onClick={() => shareImage(selectedImage)}
              className="absolute top-4 left-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>

            {/* Modal Image */}
            <div className="relative">
              <Image
                src={selectedImage.file_url}
                alt={selectedImage.caption || 'Wedding photo'}
                width={1200}
                height={800}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                priority
              />
              
              {/* Modal Caption */}
              {selectedImage.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                  <h3 className="text-white text-xl font-medium mb-2">
                    {selectedImage.caption}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">
                      {getCategoryDisplayName(selectedImage.gallery_category)}
                    </span>
                    <Heart className="h-4 w-4 text-red-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}