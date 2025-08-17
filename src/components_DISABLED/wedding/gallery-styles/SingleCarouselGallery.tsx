// File: src/components/wedding/gallery-styles/SingleCarouselGallery.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Share2, 
  X,
  MoreHorizontal
} from 'lucide-react'

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
}

interface SingleCarouselGalleryProps {
  images: GalleryImage[]
  primaryColor: string
  secondaryColor: string
  brideName?: string
  groomName?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  showCaptions?: boolean
  showCounter?: boolean
}

export function SingleCarouselGallery({
  images,
  primaryColor,
  secondaryColor,
  brideName = 'Bride',
  groomName = 'Groom',
  autoPlay = false,
  autoPlayInterval = 4000,
  showCaptions = true,
  showCounter = true
}: SingleCarouselGalleryProps) {
  // ALL HOOKS FIRST - NO EARLY RETURNS BEFORE THIS POINT
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [showModal, setShowModal] = useState(false)

  const goToPrevious = useCallback(() => {
    if (!images || images.length === 0) return
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    )
  }, [images])

  const goToNext = useCallback(() => {
    if (!images || images.length === 0) return
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    )
  }, [images])

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const closeModal = useCallback(() => {
    setShowModal(false)
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !images || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isPlaying, images, autoPlayInterval])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === ' ') {
        e.preventDefault()
        togglePlayPause()
      } else if (e.key === 'Escape' && showModal) {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [goToPrevious, goToNext, togglePlayPause, showModal, closeModal])

  // NOW SAFE TO DO EARLY RETURNS - ALL HOOKS ARE ABOVE
  if (!images || images.length === 0) {
    return null
  }

  const currentImage = images[currentImageIndex]

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index)
  }

  const openModal = () => {
    setShowModal(true)
    setIsPlaying(false) // Pause auto-play when modal opens
  }

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
        {/* Main Image Container */}
        <div className="relative aspect-[4/3] bg-gray-100">
          <Image
            src={currentImage.file_url}
            alt={currentImage.caption || `Wedding photo ${currentImageIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            priority={currentImageIndex === 0}
          />

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Next Button */}
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            {/* Category Badge */}
            <div 
              className="px-3 py-1 rounded-full text-sm font-medium text-white shadow-lg backdrop-blur-sm"
              style={{ backgroundColor: `${secondaryColor}dd` }}
            >
              {getCategoryDisplayName(currentImage.gallery_category)}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Auto-play Toggle */}
              {images.length > 1 && (
                <button
                  onClick={togglePlayPause}
                  className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
                  aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Share Button */}
              <button
                onClick={() => shareImage(currentImage)}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
                aria-label="Share image"
              >
                <Share2 className="h-4 w-4" />
              </button>

              {/* Full Screen Button */}
              <button
                onClick={openModal}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
                aria-label="View full size"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            {/* Caption */}
            {showCaptions && currentImage.caption && (
              <h3 className="text-white text-lg font-medium mb-2">
                {currentImage.caption}
              </h3>
            )}

            {/* Counter and Dots */}
            <div className="flex items-center justify-between">
              {/* Counter */}
              {showCounter && (
                <div className="text-white/80 text-sm font-medium">
                  {currentImageIndex + 1} of {images.length}
                </div>
              )}

              {/* Dot Indicators */}
              <div className="flex items-center space-x-2">
                {images.slice(0, 8).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-white scale-125'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
                {images.length > 8 && (
                  <div className="text-white/60 text-xs ml-2">
                    +{images.length - 8}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Strip (Optional for larger screens) */}
        <div className="hidden md:block p-4 bg-gray-50">
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
            {images.slice(0, 10).map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all duration-200 ${
                  index === currentImageIndex
                    ? 'ring-2 ring-offset-2 scale-105'
                    : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
                style={{ 
                  '--tw-ring-color': index === currentImageIndex ? primaryColor : undefined 
                } as React.CSSProperties}
              >
                <Image
                  src={image.file_url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
            {images.length > 10 && (
              <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500 font-medium">
                +{images.length - 10}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation in Modal */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Modal Image */}
            <div className="relative">
              <Image
                src={currentImage.file_url}
                alt={currentImage.caption || 'Wedding photo'}
                width={1200}
                height={800}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                priority
              />
              
              {/* Modal Caption */}
              {currentImage.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                  <h3 className="text-white text-xl font-medium mb-2">
                    {currentImage.caption}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">
                      {getCategoryDisplayName(currentImage.gallery_category)}
                    </span>
                    <span className="text-white/60 text-sm">
                      {currentImageIndex + 1} of {images.length}
                    </span>
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