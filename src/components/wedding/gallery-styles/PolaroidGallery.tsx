// File: src/components/wedding/gallery-styles/PolaroidGallery.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Download,
  Heart,
  Shuffle,
  RotateCw,
  Filter,
  Camera,
  Sparkles
} from 'lucide-react'

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
}

interface PolaroidProps {
  image: GalleryImage
  rotation: number
  zIndex: number
  position: { x: number; y: number }
}

interface PolaroidGalleryProps {
  images: GalleryImage[]
  primaryColor: string
  secondaryColor: string
  brideName?: string
  groomName?: string
  enableDownloadProtection?: boolean
  showCaptions?: boolean
  enableDragging?: boolean
  polaroidStyle?: 'classic' | 'modern' | 'vintage'
}

const POLAROID_ROTATIONS = [-15, -10, -5, 0, 5, 10, 15, -8, 8, -12, 12, -3, 3]
const POLAROID_POSITIONS = [
  { x: 0, y: 0 }, { x: 20, y: 15 }, { x: -15, y: 30 }, { x: 35, y: -10 },
  { x: -25, y: 20 }, { x: 15, y: -15 }, { x: -10, y: 35 }, { x: 30, y: 25 },
  { x: -20, y: -20 }, { x: 25, y: 10 }, { x: -30, y: -5 }, { x: 10, y: 40 }
]

export function PolaroidGallery({
  images,
  primaryColor,
  secondaryColor,
  brideName = 'Bride',
  groomName = 'Groom',
  enableDownloadProtection = true,
  showCaptions = true,
  enableDragging = true,
  polaroidStyle = 'classic'
}: PolaroidGalleryProps) {
  // ALL HOOKS FIRST
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>(images)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [polaroidProps, setPolaroidProps] = useState<Record<string, PolaroidProps>>({})
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isShuffling, setIsShuffling] = useState(false)
  const [draggedImage, setDraggedImage] = useState<string | null>(null)

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

  // Generate random polaroid properties
  const generatePolaroidProps = useCallback((imageList: GalleryImage[]): Record<string, PolaroidProps> => {
    const props: Record<string, PolaroidProps> = {}
    
    imageList.forEach((image, index) => {
      props[image.id] = {
        image,
        rotation: POLAROID_ROTATIONS[index % POLAROID_ROTATIONS.length] + (Math.random() - 0.5) * 6,
        zIndex: index,
        position: {
          x: POLAROID_POSITIONS[index % POLAROID_POSITIONS.length].x + (Math.random() - 0.5) * 20,
          y: POLAROID_POSITIONS[index % POLAROID_POSITIONS.length].y + (Math.random() - 0.5) * 20
        }
      }
    })
    
    return props
  }, [])

  const filterImages = useCallback((category: string) => {
    const filtered = category === 'all' 
      ? images 
      : images.filter(img => img.gallery_category === category)
    
    setFilteredImages(filtered)
    setPolaroidProps(generatePolaroidProps(filtered))
  }, [images, generatePolaroidProps])

  const shufflePolaroids = useCallback(() => {
    setIsShuffling(true)
    
    // Generate new random properties
    setTimeout(() => {
      setPolaroidProps(generatePolaroidProps(filteredImages))
      setIsShuffling(false)
    }, 300)
  }, [filteredImages, generatePolaroidProps])

  const openModal = useCallback((image: GalleryImage) => {
    const index = filteredImages.findIndex(img => img.id === image.id)
    setSelectedImage(image)
    setSelectedImageIndex(index)
    document.body.style.overflow = 'hidden'
  }, [filteredImages])

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

  const handleImageLoad = useCallback((imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]))
  }, [])

  const handleDragStart = useCallback((imageId: string) => {
    if (enableDragging) {
      setDraggedImage(imageId)
    }
  }, [enableDragging])

  const handleDragEnd = useCallback(() => {
    setDraggedImage(null)
  }, [])

  const getPolaroidStyle = useCallback((style: string) => {
    const styles = {
      classic: {
        borderColor: '#f8f9fa',
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: '12px 12px 40px 12px'
      },
      modern: {
        borderColor: '#ffffff',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: '8px 8px 32px 8px'
      },
      vintage: {
        borderColor: '#fef7ed',
        shadowColor: 'rgba(139, 69, 19, 0.3)',
        borderWidth: '16px 16px 48px 16px'
      }
    }
    return styles[style as keyof typeof styles] || styles.classic
  }, [])

  // Initialize polaroid props
  useEffect(() => {
    filterImages(selectedCategory)
  }, [filterImages, selectedCategory])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage) {
        switch (e.key) {
          case 'Escape':
            closeModal()
            break
          case 'ArrowLeft':
            navigateImage('prev')
            break
          case 'ArrowRight':
            navigateImage('next')
            break
          case 's':
          case 'S':
            if (!selectedImage) shufflePolaroids()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, closeModal, navigateImage, shufflePolaroids])

  // NOW SAFE TO DO EARLY RETURNS
  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No polaroids to display</h3>
        <p className="text-gray-500">Upload some photos to create your polaroid gallery</p>
      </div>
    )
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

  const styleConfig = getPolaroidStyle(polaroidStyle)

  return (
    <>
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Camera className="h-6 w-6" style={{ color: primaryColor }} />
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center">
                Polaroid Memories
                <Sparkles className="h-4 w-4 ml-2" style={{ color: secondaryColor }} />
              </h3>
              <p className="text-sm text-gray-600">
                {filteredImages.length} polaroid photos
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

            {/* Shuffle Button */}
            <button
              onClick={shufflePolaroids}
              disabled={isShuffling}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Shuffle polaroids"
            >
              <Shuffle className={`h-4 w-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span className="text-sm">Shuffle</span>
            </button>
          </div>
        </div>

        {/* Polaroid Container */}
        <div 
          className="relative min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${primaryColor}08 0%, transparent 50%), 
                              radial-gradient(circle at 80% 80%, ${secondaryColor}08 0%, transparent 50%)`
          }}
        >
          {/* Polaroids */}
          <div className="relative">
            {Object.values(polaroidProps).map((polaroid, index) => {
              const isLoaded = loadedImages.has(polaroid.image.id)
              const isDragged = draggedImage === polaroid.image.id
              
              return (
                <div
                  key={polaroid.image.id}
                  className={`absolute cursor-pointer transition-all duration-500 ${
                    isShuffling ? 'scale-95 opacity-75' : 'hover:scale-105 hover:z-50'
                  } ${isDragged ? 'z-50 scale-110' : ''}`}
                  style={{
                    transform: `translate(${polaroid.position.x}px, ${polaroid.position.y}px) rotate(${polaroid.rotation}deg)`,
                    zIndex: isDragged ? 1000 : polaroid.zIndex + 10,
                    left: `${(index % 4) * 25}%`,
                    top: `${Math.floor(index / 4) * 200}px`
                  }}
                  onClick={() => openModal(polaroid.image)}
                  draggable={enableDragging}
                  onDragStart={() => handleDragStart(polaroid.image.id)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Polaroid Frame */}
                  <div
                    className={`bg-white shadow-lg transition-shadow duration-300 ${
                      isDragged ? 'shadow-2xl' : 'hover:shadow-xl'
                    }`}
                    style={{
                      border: styleConfig.borderWidth,
                      borderColor: styleConfig.borderColor,
                      boxShadow: `0 4px 20px ${styleConfig.shadowColor}`,
                      width: '200px',
                      height: '240px'
                    }}
                  >
                    {/* Photo Area */}
                    <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                      <Image
                        src={polaroid.image.file_url}
                        alt={polaroid.image.caption || `Polaroid photo ${index + 1}`}
                        fill
                        className={`object-cover transition-all duration-500 ${
                          isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        sizes="200px"
                        onLoad={() => handleImageLoad(polaroid.image.id)}
                        loading="lazy"
                      />

                      {/* Loading placeholder */}
                      {!isLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-2 right-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: secondaryColor }}
                          title={getCategoryDisplayName(polaroid.image.gallery_category)}
                        />
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <Heart className="h-6 w-6 text-white drop-shadow-lg" />
                        </div>
                      </div>
                    </div>

                    {/* Caption Area */}
                    <div className="h-12 flex items-center justify-center px-2">
                      {showCaptions && polaroid.image.caption ? (
                        <p 
                          className="text-center text-xs leading-tight font-handwriting text-gray-700 line-clamp-2"
                          style={{ fontFamily: "'Kalam', cursive" }}
                        >
                          {polaroid.image.caption}
                        </p>
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Heart className="h-3 w-3" />
                          <span className="text-xs font-handwriting" style={{ fontFamily: "'Kalam', cursive" }}>
                            Beautiful moment
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tape Effect (Random) */}
                  {index % 3 === 0 && (
                    <div
                      className="absolute -top-1 -right-1 w-8 h-6 bg-yellow-200 opacity-60 rotate-45"
                      style={{
                        background: 'linear-gradient(45deg, #fef3c7, #fde68a)',
                        borderRadius: '2px'
                      }}
                    />
                  )}

                  {/* Paper Clip Effect (Random) */}
                  {index % 5 === 0 && (
                    <div className="absolute -top-2 left-4">
                      <div 
                        className="w-4 h-6 border-2 rounded-full opacity-70"
                        style={{ 
                          borderColor: '#94a3b8',
                          background: 'linear-gradient(45deg, #e2e8f0, #cbd5e1)'
                        }}
                      />
                    </div>
                  )}

                  {/* Download Protection Overlay */}
                  {enableDownloadProtection && (
                    <div 
                      className="absolute inset-0 pointer-events-none select-none"
                      style={{
                        background: 'transparent',
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Scattered Decorative Elements */}
          <div className="absolute top-4 right-8 opacity-30">
            <Heart className="h-6 w-6 text-red-400 transform rotate-12" />
          </div>
          <div className="absolute bottom-8 left-12 opacity-20">
            <Sparkles className="h-5 w-5 text-pink-400 transform -rotate-12" />
          </div>
          <div className="absolute top-1/2 right-12 opacity-25">
            <RotateCw className="h-4 w-4 text-blue-400 transform rotate-45" />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
            <span>📸 Click to view full size</span>
            <span>•</span>
            {enableDragging && (
              <>
                <span>🖱️ Drag to rearrange</span>
                <span>•</span>
              </>
            )}
            <span>🔀 Press &apos;S&apos; to shuffle</span>
          </div>
        </div>

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No polaroids in {selectedCategory === 'all' ? 'gallery' : getCategoryDisplayName(selectedCategory)}
            </h3>
            <p className="text-gray-500">
              {selectedCategory === 'all' 
                ? 'Upload some photos to create your polaroid collection!'
                : 'Try selecting a different category or upload photos to this category.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <div className="relative max-w-6xl max-h-full w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation */}
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

            {/* Action Buttons */}
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
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

              <button
                onClick={shufflePolaroids}
                className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                title="Shuffle polaroids"
              >
                <Shuffle className="h-5 w-5" />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative">
              <Image
                src={selectedImage.file_url}
                alt={selectedImage.caption || 'Polaroid photo'}
                width={1200}
                height={800}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                priority
                style={{
                  userSelect: enableDownloadProtection ? 'none' : 'auto',
                  WebkitUserSelect: enableDownloadProtection ? 'none' : 'auto'
                }}
                onContextMenu={enableDownloadProtection ? (e) => e.preventDefault() : undefined}
                onDragStart={enableDownloadProtection ? (e) => e.preventDefault() : undefined}
              />
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              {selectedImage.caption && (
                <h3 
                  className="text-white text-xl font-medium mb-2"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  📸 {selectedImage.caption}
                </h3>
              )}
              
              <div className="flex items-center justify-between text-white/80">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs flex items-center">
                    <Camera className="h-3 w-3 mr-1" />
                    {getCategoryDisplayName(selectedImage.gallery_category)}
                  </span>
                  <span>{selectedImageIndex + 1} of {filteredImages.length}</span>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-xs">
                    Polaroid Style
                  </span>
                </div>
                
                <div className="text-xs">
                  <Heart className="h-4 w-4 text-red-400 inline mr-1" />
                  Captured with love
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Google Fonts for handwriting effect */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap');
        .font-handwriting {
          font-family: 'Kalam', cursive;
        }
      `}</style>
    </>
  )
}