// File: src/components/wedding/WeddingGallery.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Images, X, ChevronLeft, ChevronRight, Share2 } from 'lucide-react'

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
}

interface WeddingGalleryProps {
  images: GalleryImage[]
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  brideName?: string
  groomName?: string
}

export function WeddingGallery({
  images,
  primaryColor,
  secondaryColor,
  fontFamily,
  brideName = 'Bride',
  groomName = 'Groom'
}: WeddingGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const getCategoryDisplayName = (category: string) => {
    const categoryNames: Record<string, string> = {
      'pre_wedding': 'Pre-Wedding',
      'engagement': 'Engagement',
      'family': 'Family',
      'couple': 'Couple'
    }
    return categoryNames[category] || category
  }

  const getUniqueCategories = () => {
    const categories = [...new Set(images.map(img => img.gallery_category))]
    return categories.filter(Boolean)
  }

  const getFilteredImages = useCallback(() => {
    if (selectedCategory === 'all') {
      return images
    }
    return images.filter(img => img.gallery_category === selectedCategory)
  }, [images, selectedCategory])

  const groupedImages = images.reduce((acc, image) => {
    if (!acc[image.gallery_category]) {
      acc[image.gallery_category] = []
    }
    acc[image.gallery_category].push(image)
    return acc
  }, {} as Record<string, GalleryImage[]>)

  const openImageModal = (image: GalleryImage, index: number) => {
    setSelectedImage(image)
    setModalImageIndex(index)
    document.body.style.overflow = 'hidden' // Prevent body scroll
  }

  const closeImageModal = () => {
    setSelectedImage(null)
    document.body.style.overflow = 'unset' // Re-enable body scroll
  }

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    const filteredImages = getFilteredImages()
    if (direction === 'prev') {
      const newIndex = modalImageIndex > 0 ? modalImageIndex - 1 : filteredImages.length - 1
      setModalImageIndex(newIndex)
      setSelectedImage(filteredImages[newIndex])
    } else {
      const newIndex = modalImageIndex < filteredImages.length - 1 ? modalImageIndex + 1 : 0
      setModalImageIndex(newIndex)
      setSelectedImage(filteredImages[newIndex])
    }
  }, [getFilteredImages, modalImageIndex])

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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage) {
        if (e.key === 'Escape') {
          closeImageModal()
        } else if (e.key === 'ArrowLeft') {
          navigateImage('prev')
        } else if (e.key === 'ArrowRight') {
          navigateImage('next')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, navigateImage])

  // Don't render if no images
  if (!images || images.length === 0) {
    return null
  }

  return (
    <>
      <section 
        id="gallery" 
        className="py-16 px-6 bg-white"
        style={{ fontFamily: fontFamily }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-serif mb-4"
              style={{ color: primaryColor }}
            >
              <Images className="inline-block h-8 w-8 mr-3" />
              Our Beautiful Moments
            </h2>
            <p className="text-gray-600 text-lg">
              {images.length} cherished memories across {getUniqueCategories().length} categories
            </p>
          </div>

          {/* Category Filter */}
          {getUniqueCategories().length > 1 && (
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{ 
                  backgroundColor: selectedCategory === 'all' ? primaryColor : undefined 
                }}
              >
                All Photos ({images.length})
              </button>
              {getUniqueCategories().map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${
                    selectedCategory === category
                      ? 'text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{ 
                    backgroundColor: selectedCategory === category ? secondaryColor : undefined 
                  }}
                >
                  {getCategoryDisplayName(category)} ({groupedImages[category]?.length || 0})
                </button>
              ))}
            </div>
          )}

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getFilteredImages().map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => openImageModal(image, index)}
              >
                <Image
                  src={image.file_url}
                  alt={image.caption || `Gallery photo ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {image.caption && (
                      <p className="text-white text-sm font-medium mb-1 line-clamp-2">
                        {image.caption}
                      </p>
                    )}
                    <p className="text-white/80 text-xs">
                      {getCategoryDisplayName(image.gallery_category)}
                    </p>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-lg"
                    style={{ backgroundColor: `${secondaryColor}cc` }}
                  >
                    {getCategoryDisplayName(image.gallery_category)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {getFilteredImages().length === 0 && selectedCategory !== 'all' && (
            <div className="text-center py-12">
              <Images className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No photos in this category</h3>
              <p className="text-gray-500">Check back later for more beautiful moments!</p>
            </div>
          )}
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            {getFilteredImages().length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Share Button */}
            <button
              onClick={() => shareImage(selectedImage)}
              className="absolute top-4 left-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>

            {/* Image */}
            <div className="relative">
              <div className="relative max-w-full max-h-[80vh] flex items-center justify-center">
                <Image
                  src={selectedImage.file_url}
                  alt={selectedImage.caption || 'Gallery photo'}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  priority
                />
              </div>
              
              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                {selectedImage.caption && (
                  <h3 className="text-white text-lg font-medium mb-2">
                    {selectedImage.caption}
                  </h3>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">
                    {getCategoryDisplayName(selectedImage.gallery_category)}
                  </span>
                  <span className="text-white/60 text-sm">
                    {modalImageIndex + 1} of {getFilteredImages().length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}