// File: src/components/wedding/gallery-styles/MasonryGallery.tsx

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { 
  X, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  Heart,
  Download,
  MoreVertical,
  Filter,
  Grid3X3
} from 'lucide-react'

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
}

interface MasonryGalleryProps {
  images: GalleryImage[]
  primaryColor: string
  secondaryColor: string
  brideName?: string
  groomName?: string
  enableDownloadProtection?: boolean
  showCaptions?: boolean
  columns?: {
    mobile: number
    tablet: number
    desktop: number
  }
}

const DEFAULT_COLUMNS = {
  mobile: 2,
  tablet: 3,
  desktop: 4
}

export function MasonryGallery({
  images,
  primaryColor,
  secondaryColor,
  brideName = 'Bride',
  groomName = 'Groom',
  enableDownloadProtection = true,
  showCaptions = true,
  columns = DEFAULT_COLUMNS
}: MasonryGalleryProps) {
  // ALL HOOKS FIRST
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>(images)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [masonryColumns, setMasonryColumns] = useState<GalleryImage[][]>([])
  const [imageHeights, setImageHeights] = useState<Record<string, number>>({})
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

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

  const getColumnCount = useCallback(() => {
    if (typeof window === 'undefined') return columns.desktop
    
    const width = window.innerWidth
    if (width < 640) return columns.mobile
    if (width < 1024) return columns.tablet
    return columns.desktop
  }, [columns])

  const [currentColumns, setCurrentColumns] = useState(getColumnCount())

  // Generate random heights for masonry effect
  const generateImageHeight = useCallback((imageId: string) => {
    if (imageHeights[imageId]) return imageHeights[imageId]
    
    // Generate heights between 200-400px for variety
    const heights = [200, 250, 300, 350, 400]
    const randomHeight = heights[Math.floor(Math.random() * heights.length)]
    
    setImageHeights(prev => ({
      ...prev,
      [imageId]: randomHeight
    }))
    
    return randomHeight
  }, [imageHeights])

  const distributeMasonryImages = useCallback((imagesToDistribute: GalleryImage[]) => {
    const numColumns = currentColumns
    const columns: GalleryImage[][] = Array.from({ length: numColumns }, () => [])
    const columnHeights = new Array(numColumns).fill(0)

    imagesToDistribute.forEach((image) => {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      
      // Add image to shortest column
      columns[shortestColumnIndex].push(image)
      
      // Update column height (add image height + gap)
      const imageHeight = generateImageHeight(image.id)
      columnHeights[shortestColumnIndex] += imageHeight + 16 // 16px gap
    })

    return columns
  }, [currentColumns, generateImageHeight])

  const filterImages = useCallback((category: string) => {
    const filtered = category === 'all' 
      ? images 
      : images.filter(img => img.gallery_category === category)
    
    setFilteredImages(filtered)
    setMasonryColumns(distributeMasonryImages(filtered))
  }, [images, distributeMasonryImages])

  const openModal = useCallback((image: GalleryImage, index: number) => {
    setSelectedImage(image)
    setSelectedImageIndex(index)
    document.body.style.overflow = 'hidden'
  }, [])

  const closeModal = useCallback(() => {
    setSelectedImage(null)
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
  }, [selectedImageIndex, filteredImages])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newColumnCount = getColumnCount()
      if (newColumnCount !== currentColumns) {
        setCurrentColumns(newColumnCount)
        setMasonryColumns(distributeMasonryImages(filteredImages))
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getColumnCount, currentColumns, distributeMasonryImages, filteredImages])

  // Initialize masonry layout
  useEffect(() => {
    filterImages(selectedCategory)
  }, [filterImages, selectedCategory])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage) {
        if (e.key === 'Escape') {
          closeModal()
        } else if (e.key === 'ArrowLeft') {
          navigateImage('prev')
        } else if (e.key === 'ArrowRight') {
          navigateImage('next')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, closeModal, navigateImage])

  // Handle image load
  const handleImageLoad = useCallback((imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]))
  }, [])

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
            <Grid3X3 className="h-6 w-6" style={{ color: primaryColor }} />
            <div>
              <h3 className="font-semibold text-gray-900">Our Beautiful Moments</h3>
              <p className="text-sm text-gray-600">
                {filteredImages.length} photos
                {selectedCategory !== 'all' && ` in ${getCategoryDisplayName(selectedCategory)}`}
              </p>
            </div>
          </div>
          
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
                <option value="all">All Photos ({images.length})</option>
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
        </div>

        {/* Masonry Grid */}
        <div 
          ref={containerRef}
          className="flex gap-4"
          style={{
            minHeight: '600px'
          }}
        >
          {masonryColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex-1 space-y-4">
              {column.map((image, imageIndex) => {
                const globalIndex = filteredImages.findIndex(img => img.id === image.id)
                const imageHeight = imageHeights[image.id] || 300
                const isLoaded = loadedImages.has(image.id)
                
                return (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-gray-100"
                    style={{ height: `${imageHeight}px` }}
                    onClick={() => openModal(image, globalIndex)}
                  >
                    {/* Image */}
                    <Image
                      src={image.file_url}
                      alt={image.caption || `Wedding photo ${imageIndex + 1}`}
                      fill
                      className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      onLoad={() => handleImageLoad(image.id)}
                      loading="lazy"
                    />

                    {/* Loading placeholder */}
                    {!isLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur-sm"
                          style={{ backgroundColor: `${secondaryColor}dd` }}
                        >
                          {getCategoryDisplayName(image.gallery_category)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            shareImage(image)
                          }}
                          className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
                          title="Share photo"
                        >
                          <Share2 className="h-3 w-3" />
                        </button>
                        
                        {!enableDownloadProtection && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadImage(image)
                            }}
                            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
                            title="Download photo"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openModal(image, globalIndex)
                          }}
                          className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
                          title="View full size"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Caption */}
                      {showCaptions && image.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white text-sm font-medium line-clamp-2 backdrop-blur-sm bg-black/30 rounded px-3 py-2">
                            {image.caption}
                          </p>
                        </div>
                      )}

                      {/* Love Icon */}
                      <div className="absolute bottom-3 right-3">
                        <Heart className="h-4 w-4 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Download Protection Overlay */}
                    {enableDownloadProtection && (
                      <div 
                        className="absolute inset-0 pointer-events-none select-none"
                        style={{
                          background: 'transparent',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none'
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <Grid3X3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
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
      </div>

      {/* Full Screen Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation */}
            {filteredImages.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
              <button
                onClick={() => shareImage(selectedImage)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                title="Share photo"
              >
                <Share2 className="h-5 w-5" />
              </button>
              
              {!enableDownloadProtection && (
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                  title="Download photo"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Modal Image */}
            <div className="relative">
              <Image
                src={selectedImage.file_url}
                alt={selectedImage.caption || 'Wedding photo'}
                width={1200}
                height={800}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                priority
                style={{
                  userSelect: enableDownloadProtection ? 'none' : 'auto',
                  WebkitUserSelect: enableDownloadProtection ? 'none' : 'auto',
                  pointerEvents: enableDownloadProtection ? 'none' : 'auto'
                }}
                onContextMenu={enableDownloadProtection ? (e) => e.preventDefault() : undefined}
                onDragStart={enableDownloadProtection ? (e) => e.preventDefault() : undefined}
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
                    <div className="flex items-center space-x-4">
                      <span className="text-white/60 text-sm">
                        {selectedImageIndex + 1} of {filteredImages.length}
                      </span>
                      {enableDownloadProtection && (
                        <span className="text-white/60 text-xs bg-white/20 px-2 py-1 rounded">
                          Protected
                        </span>
                      )}
                    </div>
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