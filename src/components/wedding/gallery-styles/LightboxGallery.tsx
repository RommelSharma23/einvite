// File: src/components/wedding/gallery-styles/LightboxGallery.tsx

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Download,
  ZoomIn,
  Grid3X3,
  Filter,
  Heart,
  Camera,
  Info
} from 'lucide-react'

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
}

interface LightboxGalleryProps {
  images: GalleryImage[]
  primaryColor: string
  secondaryColor: string
  brideName?: string
  groomName?: string
  enableDownloadProtection?: boolean
  showCaptions?: boolean
  thumbnailSize?: 'small' | 'medium' | 'large'
  enableZoom?: boolean
}

const THUMBNAIL_SIZES = {
  small: 'h-24 w-24',    // 96x96px
  medium: 'h-32 w-32',   // 128x128px
  large: 'h-40 w-40'     // 160x160px
}

export function LightboxGallery({
  images,
  primaryColor,
  secondaryColor,
  brideName = 'Bride',
  groomName = 'Groom',
  enableDownloadProtection = true,
  showCaptions = true,
  thumbnailSize = 'medium',
  enableZoom = true
}: LightboxGalleryProps) {
  // ALL HOOKS FIRST
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>(images)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isZoomed, setIsZoomed] = useState(false)
  const [showImageInfo, setShowImageInfo] = useState(false)
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set())
  const modalImageRef = useRef<HTMLImageElement>(null)

  const getCategories = useCallback(() => {
    const categories = [...new Set(images.map(img => img.gallery_category))]
    return categories.filter(Boolean)
  }, [images])

  const getCategoryDisplayName = useCallback((category: string) => {
    const categoryNames: Record<string, string> = {
      'pre_wedding': 'Pre-Wedding',
      'engagement': 'Engagement',
      'family': 'Family',
      'couple': 'Couple'
    }
    return categoryNames[category] || category
  }, [])

  const filterImages = useCallback((category: string) => {
    const filtered = category === 'all' 
      ? images 
      : images.filter(img => img.gallery_category === category)
    
    setFilteredImages(filtered)
    
    // Reset selection if current image is no longer in filtered results
    if (selectedImage && !filtered.find(img => img.id === selectedImage.id)) {
      setSelectedImage(null)
    }
  }, [images, selectedImage])

  const openLightbox = useCallback((image: GalleryImage, index: number) => {
    setSelectedImage(image)
    setSelectedImageIndex(index)
    setIsZoomed(false)
    setShowImageInfo(false)
    document.body.style.overflow = 'hidden'
  }, [])

  const closeLightbox = useCallback(() => {
    setSelectedImage(null)
    setIsZoomed(false)
    setShowImageInfo(false)
    document.body.style.overflow = 'unset'
  }, [])

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : filteredImages.length - 1
      setSelectedImageIndex(newIndex)
      setSelectedImage(filteredImages[newIndex])
    } else {
      const newIndex = selectedImageIndex < filteredImages.length - 1 ? selectedImageIndex + 1 : 0
      setSelectedImageIndex(newIndex)
      setSelectedImage(filteredImages[newIndex])
    }
    setIsZoomed(false) // Reset zoom when navigating
    setShowImageInfo(false)
  }, [selectedImageIndex, filteredImages])

  const toggleZoom = useCallback(() => {
    if (enableZoom) {
      setIsZoomed(!isZoomed)
    }
  }, [enableZoom, isZoomed])

  const handleThumbnailLoad = useCallback((imageId: string) => {
    setLoadedThumbnails(prev => new Set([...prev, imageId]))
  }, [])

  // Filter images when category changes
  useEffect(() => {
    filterImages(selectedCategory)
  }, [filterImages, selectedCategory])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage) {
        switch (e.key) {
          case 'Escape':
            closeLightbox()
            break
          case 'ArrowLeft':
            navigateImage('prev')
            break
          case 'ArrowRight':
            navigateImage('next')
            break
          case ' ':
            e.preventDefault()
            toggleZoom()
            break
          case 'i':
          case 'I':
            setShowImageInfo(!showImageInfo)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, closeLightbox, navigateImage, toggleZoom, showImageInfo])

  // NOW SAFE TO DO EARLY RETURNS
  if (!images || images.length === 0) {
    return null
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

  const downloadImage = async (image: GalleryImage) => {
    if (enableDownloadProtection) {
      alert('Download protection is enabled for this gallery.')
      return
    }

    try {
      const response = await fetch(image.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = image.file_name || 'wedding-photo.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
      alert('Failed to download image')
    }
  }

  return (
    <>
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Camera className="h-6 w-6" style={{ color: primaryColor }} />
            <div>
              <h3 className="font-semibold text-gray-900">Photo Gallery</h3>
              <p className="text-sm text-gray-600">
                {filteredImages.length} photos
                {selectedCategory !== 'all' && ` in ${getCategoryDisplayName(selectedCategory)}`}
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Category Filter */}
            {getCategories().length > 1 && (
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ 
                    '--tw-ring-color': primaryColor,
                    borderColor: selectedCategory !== 'all' ? primaryColor : undefined
                  } as React.CSSProperties}
                >
                  <option value="all">All Photos</option>
                  {getCategories().map((category) => {
                    const categoryImages = images.filter(img => img.gallery_category === category)
                    return (
                      <option key={category} value={category}>
                        {getCategoryDisplayName(category)} ({categoryImages.length})
                      </option>
                    )
                  })}
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}

            {/* View Toggle */}
            <button
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredImages.map((image, index) => {
            const isLoaded = loadedThumbnails.has(image.id)
            
            return (
              <div
                key={image.id}
                className={`${THUMBNAIL_SIZES[thumbnailSize]} relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 bg-gray-100`}
                onClick={() => openLightbox(image, index)}
              >
                {/* Thumbnail Image */}
                <Image
                  src={image.file_url}
                  alt={image.caption || `Wedding photo ${index + 1}`}
                  fill
                  className={`object-cover transition-all duration-300 group-hover:scale-110 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  sizes={`${parseInt(THUMBNAIL_SIZES[thumbnailSize].split('-')[1]) * 4}px`}
                  onLoad={() => handleThumbnailLoad(image.id)}
                  loading="lazy"
                />

                {/* Loading placeholder */}
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                </div>

                {/* Category Indicator */}
                <div className="absolute top-1 left-1">
                  <div 
                    className="w-2 h-2 rounded-full shadow-sm"
                    style={{ backgroundColor: secondaryColor }}
                    title={getCategoryDisplayName(image.gallery_category)}
                  />
                </div>

                {/* Caption Indicator */}
                {showCaptions && image.caption && (
                  <div className="absolute bottom-1 right-1">
                    <Info className="h-3 w-3 text-white drop-shadow-lg" />
                  </div>
                )}

                {/* Selection Border */}
                {selectedImage?.id === image.id && (
                  <div 
                    className="absolute inset-0 border-2 rounded-lg"
                    style={{ borderColor: primaryColor }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No photos in {selectedCategory === 'all' ? 'gallery' : getCategoryDisplayName(selectedCategory)}
            </h3>
            <p className="text-gray-500">
              {selectedCategory === 'all' 
                ? 'Upload some beautiful photos to get started!'
                : 'Try selecting a different category or upload photos to this category.'
              }
            </p>
          </div>
        )}

        {/* Gallery Statistics */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
            <span>{filteredImages.length} Photos</span>
            <span>•</span>
            <span>{getCategories().length} Categories</span>
            <span>•</span>
            <span>Click to view full size</span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Background Click to Close */}
          <div 
            className="absolute inset-0" 
            onClick={closeLightbox}
          />

          {/* Modal Container */}
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            {filteredImages.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Top Action Bar */}
            <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
              <button
                onClick={() => shareImage(selectedImage)}
                className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                title="Share photo"
              >
                <Share2 className="h-5 w-5" />
              </button>
              
              {!enableDownloadProtection && (
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                  title="Download photo"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}

              {enableZoom && (
                <button
                  onClick={toggleZoom}
                  className={`p-2 backdrop-blur-sm rounded-full text-white transition-colors ${
                    isZoomed ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={isZoomed ? 'Zoom out' : 'Zoom in'}
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              )}

              <button
                onClick={() => setShowImageInfo(!showImageInfo)}
                className={`p-2 backdrop-blur-sm rounded-full text-white transition-colors ${
                  showImageInfo ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'
                }`}
                title="Image info"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>

            {/* Main Image */}
            <div className={`relative transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}>
              <Image
                ref={modalImageRef}
                src={selectedImage.file_url}
                alt={selectedImage.caption || 'Wedding photo'}
                width={1200}
                height={800}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                priority
                onClick={toggleZoom}
                style={{
                  userSelect: enableDownloadProtection ? 'none' : 'auto',
                  WebkitUserSelect: enableDownloadProtection ? 'none' : 'auto',
                  pointerEvents: 'auto'
                }}
                onContextMenu={enableDownloadProtection ? (e) => e.preventDefault() : undefined}
                onDragStart={enableDownloadProtection ? (e) => e.preventDefault() : undefined}
              />
            </div>

            {/* Bottom Info Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
              {/* Image Caption */}
              {showCaptions && selectedImage.caption && (
                <div className="px-6 pt-8 pb-4">
                  <h3 className="text-white text-xl font-medium mb-2">
                    {selectedImage.caption}
                  </h3>
                </div>
              )}

              {/* Image Info Bar */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between text-white/80">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                      {getCategoryDisplayName(selectedImage.gallery_category)}
                    </span>
                    <span>{selectedImageIndex + 1} of {filteredImages.length}</span>
                    {enableDownloadProtection && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-200 rounded-full text-xs">
                        Protected
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-400" />
                    {enableZoom && (
                      <span className="text-xs">
                        Press Space to {isZoomed ? 'zoom out' : 'zoom in'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Extended Info Panel */}
              {showImageInfo && (
                <div className="px-6 pb-4 border-t border-white/20 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
                    <div>
                      <span className="text-white/80">File name:</span><br />
                      {selectedImage.file_name}
                    </div>
                    <div>
                      <span className="text-white/80">Category:</span><br />
                      {getCategoryDisplayName(selectedImage.gallery_category)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="absolute bottom-4 right-4 text-white/60 text-xs space-y-1">
              <div>← → Navigate</div>
              <div>Space: Zoom</div>
              <div>Esc: Close</div>
              <div>I: Info</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}