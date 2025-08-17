// File: src/components/wedding/gallery-styles/CollageGallery.tsx

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
  RotateCcw,
  Filter,
  Palette,
  Sparkles,
  Grid3X3,
  Circle,
  Square
} from 'lucide-react'

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
}

interface CollageItem {
  image: GalleryImage
  position: { x: number; y: number; width: number; height: number }
  rotation: number
  zIndex: number
  borderRadius: number
}

interface CollageTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  maxImages: number
  layout: 'heart' | 'circle' | 'mosaic' | 'scattered' | 'geometric' | 'spiral'
}

interface CollageGalleryProps {
  images: GalleryImage[]
  primaryColor: string
  secondaryColor: string
  brideName?: string
  groomName?: string
  enableDownloadProtection?: boolean
  showCaptions?: boolean
  defaultTemplate?: string
}

const COLLAGE_TEMPLATES: CollageTemplate[] = [
  {
    id: 'heart',
    name: 'Heart Shape',
    description: 'Romantic heart-shaped photo arrangement',
    icon: <Heart className="h-4 w-4" />,
    maxImages: 12,
    layout: 'heart'
  },
  {
    id: 'circle',
    name: 'Circle Mandala',
    description: 'Circular mandala pattern with overlapping photos',
    icon: <Circle className="h-4 w-4" />,
    maxImages: 16,
    layout: 'circle'
  },
  {
    id: 'mosaic',
    name: 'Mosaic Grid',
    description: 'Artistic mosaic with varied sizes',
    icon: <Grid3X3 className="h-4 w-4" />,
    maxImages: 20,
    layout: 'mosaic'
  },
  {
    id: 'scattered',
    name: 'Scattered Art',
    description: 'Organic scattered layout with natural flow',
    icon: <Sparkles className="h-4 w-4" />,
    maxImages: 15,
    layout: 'scattered'
  },
  {
    id: 'geometric',
    name: 'Geometric',
    description: 'Modern geometric pattern arrangement',
    icon: <Square className="h-4 w-4" />,
    maxImages: 18,
    layout: 'geometric'
  }
]

export function CollageGallery({
  images,
  primaryColor,
  secondaryColor,
  brideName = 'Bride',
  groomName = 'Groom',
  enableDownloadProtection = true,
  showCaptions = true,
  defaultTemplate = 'heart'
}: CollageGalleryProps) {
  // ALL HOOKS FIRST
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>(images)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentTemplate, setCurrentTemplate] = useState<string>(defaultTemplate)
  const [collageItems, setCollageItems] = useState<CollageItem[]>([])
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)

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

  // Generate heart shape positions
  const generateHeartLayout = useCallback((imageCount: number): CollageItem['position'][] => {
    const positions: CollageItem['position'][] = []
    const centerX = 350
    const centerY = 250
    const scale = 0.8

    for (let i = 0; i < Math.min(imageCount, 12); i++) {
      const t = (i / Math.max(imageCount - 1, 1)) * 2 * Math.PI
      // Heart equation: x = 16sin³(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
      const x = centerX + scale * 16 * Math.pow(Math.sin(t), 3)
      const y = centerY - scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
      
      const size = 80 + Math.random() * 40 // 80-120px
      positions.push({
        x: x - size / 2,
        y: y - size / 2,
        width: size,
        height: size
      })
    }
    return positions
  }, [])

  // Generate circle layout positions
  const generateCircleLayout = useCallback((imageCount: number): CollageItem['position'][] => {
    const positions: CollageItem['position'][] = []
    const centerX = 350
    const centerY = 250
    const maxRadius = 200

    for (let i = 0; i < Math.min(imageCount, 16); i++) {
      const ring = Math.floor(i / 8) // 0 or 1
      const radius = ring === 0 ? maxRadius * 0.5 : maxRadius
      const angleStep = (2 * Math.PI) / (ring === 0 ? 8 : 8)
      const angle = (i % 8) * angleStep
      
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      const size = ring === 0 ? 100 : 80
      
      positions.push({
        x: x - size / 2,
        y: y - size / 2,
        width: size,
        height: size
      })
    }
    return positions
  }, [])

  // Generate mosaic layout positions
  const generateMosaicLayout = useCallback((imageCount: number): CollageItem['position'][] => {
    const positions: CollageItem['position'][] = []
    const containerWidth = 700
    const containerHeight = 500
    const gridCols = 5
    const gridRows = 4

    for (let i = 0; i < Math.min(imageCount, 20); i++) {
      const col = i % gridCols
      const row = Math.floor(i / gridCols)
      const cellWidth = containerWidth / gridCols
      const cellHeight = containerHeight / gridRows
      
      // Add some randomness to create mosaic effect
      const sizeVariation = 0.3 + Math.random() * 0.7 // 0.3 to 1.0
      const width = cellWidth * sizeVariation
      const height = cellHeight * sizeVariation
      
      const x = col * cellWidth + (cellWidth - width) / 2 + (Math.random() - 0.5) * 20
      const y = row * cellHeight + (cellHeight - height) / 2 + (Math.random() - 0.5) * 20
      
      positions.push({ x, y, width, height })
    }
    return positions
  }, [])

  // Generate scattered layout positions
  const generateScatteredLayout = useCallback((imageCount: number): CollageItem['position'][] => {
    const positions: CollageItem['position'][] = []
    const containerWidth = 700
    const containerHeight = 500

    for (let i = 0; i < Math.min(imageCount, 15); i++) {
      const size = 60 + Math.random() * 80 // 60-140px
      const x = Math.random() * (containerWidth - size)
      const y = Math.random() * (containerHeight - size)
      
      positions.push({ x, y, width: size, height: size })
    }
    return positions
  }, [])

  // Generate geometric layout positions
  const generateGeometricLayout = useCallback((imageCount: number): CollageItem['position'][] => {
    const positions: CollageItem['position'][] = []
    const centerX = 350
    const centerY = 250

    for (let i = 0; i < Math.min(imageCount, 18); i++) {
      const layer = Math.floor(i / 6)
      const angleStep = (2 * Math.PI) / 6
      const angle = (i % 6) * angleStep + layer * Math.PI / 6 // Offset each layer
      const radius = 60 + layer * 80
      
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      const size = 70 + layer * 10
      
      positions.push({
        x: x - size / 2,
        y: y - size / 2,
        width: size,
        height: size
      })
    }
    return positions
  }, [])

  // Generate collage layout based on template
  const generateCollageLayout = useCallback((template: string, imagesToUse: GalleryImage[]): CollageItem[] => {
    let positions: CollageItem['position'][] = []
    
    switch (template) {
      case 'heart':
        positions = generateHeartLayout(imagesToUse.length)
        break
      case 'circle':
        positions = generateCircleLayout(imagesToUse.length)
        break
      case 'mosaic':
        positions = generateMosaicLayout(imagesToUse.length)
        break
      case 'scattered':
        positions = generateScatteredLayout(imagesToUse.length)
        break
      case 'geometric':
        positions = generateGeometricLayout(imagesToUse.length)
        break
      default:
        positions = generateHeartLayout(imagesToUse.length)
    }

    return imagesToUse.slice(0, positions.length).map((image, index) => ({
      image,
      position: positions[index],
      rotation: (Math.random() - 0.5) * 20, // -10 to 10 degrees
      zIndex: Math.floor(Math.random() * 100),
      borderRadius: template === 'circle' ? 50 : Math.random() * 20
    }))
  }, [generateHeartLayout, generateCircleLayout, generateMosaicLayout, generateScatteredLayout, generateGeometricLayout])

  const filterImages = useCallback((category: string) => {
    const filtered = category === 'all' 
      ? images 
      : images.filter(img => img.gallery_category === category)
    
    setFilteredImages(filtered)
    
    if (filtered.length > 0) {
      setIsGenerating(true)
      setTimeout(() => {
        setCollageItems(generateCollageLayout(currentTemplate, filtered))
        setIsGenerating(false)
      }, 300)
    } else {
      setCollageItems([])
    }
  }, [images, currentTemplate, generateCollageLayout])

  const changeTemplate = useCallback((templateId: string) => {
    setCurrentTemplate(templateId)
    setIsGenerating(true)
    
    setTimeout(() => {
      setCollageItems(generateCollageLayout(templateId, filteredImages))
      setIsGenerating(false)
    }, 300)
  }, [filteredImages, generateCollageLayout])

  const regenerateCollage = useCallback(() => {
    if (filteredImages.length > 0) {
      setIsGenerating(true)
      setTimeout(() => {
        setCollageItems(generateCollageLayout(currentTemplate, filteredImages))
        setIsGenerating(false)
      }, 300)
    }
  }, [filteredImages, currentTemplate, generateCollageLayout])

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

  // Initialize collage
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
          case 'r':
          case 'R':
            if (!selectedImage) regenerateCollage()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, closeModal, navigateImage, regenerateCollage])

  // NOW SAFE TO DO EARLY RETURNS
  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12">
        <Palette className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No images for collage</h3>
        <p className="text-gray-500">Upload some photos to create your artistic collage</p>
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

  const currentTemplateData = COLLAGE_TEMPLATES.find(t => t.id === currentTemplate)

  return (
    <>
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Palette className="h-6 w-6" style={{ color: primaryColor }} />
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center">
                Artistic Collage
                <Sparkles className="h-4 w-4 ml-2" style={{ color: secondaryColor }} />
              </h3>
              <p className="text-sm text-gray-600">
                {filteredImages.length} photos • {currentTemplateData?.name} style
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

            {/* Regenerate Button */}
            <button
              onClick={regenerateCollage}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Regenerate collage"
            >
              <RotateCcw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="text-sm">Regenerate</span>
            </button>
          </div>
        </div>

        {/* Template Selector */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Collage Templates</h4>
          <div className="flex flex-wrap gap-3">
            {COLLAGE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => changeTemplate(template.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all ${
                  currentTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                title={template.description}
              >
                <div className={currentTemplate === template.id ? 'text-blue-600' : 'text-gray-600'}>
                  {template.icon}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500">Max {template.maxImages} photos</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Collage Container */}
        <div 
          className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden"
          style={{
            height: '600px',
            backgroundImage: `radial-gradient(circle at 30% 30%, ${primaryColor}08 0%, transparent 50%), 
                              radial-gradient(circle at 70% 70%, ${secondaryColor}08 0%, transparent 50%)`
          }}
        >
          {/* Loading Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">Creating your artistic collage...</p>
              </div>
            </div>
          )}

          {/* Collage Items */}
          <div className="relative w-full h-full p-8">
            {collageItems.map((item, index) => {
              const isLoaded = loadedImages.has(item.image.id)
              
              return (
                <div
                  key={item.image.id}
                  className="absolute cursor-pointer transition-all duration-300 hover:scale-105 hover:z-50 group"
                  style={{
                    left: `${item.position.x}px`,
                    top: `${item.position.y}px`,
                    width: `${item.position.width}px`,
                    height: `${item.position.height}px`,
                    transform: `rotate(${item.rotation}deg)`,
                    zIndex: item.zIndex
                  }}
                  onClick={() => openModal(item.image)}
                >
                  {/* Frame/Border */}
                  <div
                    className="relative w-full h-full bg-white shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                    style={{
                      borderRadius: `${item.borderRadius}px`,
                      border: '4px solid white',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {/* Image */}
                    <div 
                      className="w-full h-full overflow-hidden relative"
                      style={{ borderRadius: `${Math.max(0, item.borderRadius - 4)}px` }}
                    >
                      <Image
                        src={item.image.file_url}
                        alt={item.image.caption || `Collage photo ${index + 1}`}
                        fill
                        className={`object-cover transition-all duration-500 ${
                          isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        sizes={`${item.position.width}px`}
                        onLoad={() => handleImageLoad(item.image.id)}
                        loading="lazy"
                      />

                      {/* Loading placeholder */}
                      {!isLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Heart className="h-5 w-5 text-white drop-shadow-lg" />
                        </div>
                      </div>

                      {/* Category Indicator */}
                      <div className="absolute top-1 right-1">
                        <div 
                          className="w-2 h-2 rounded-full shadow-sm"
                          style={{ backgroundColor: secondaryColor }}
                          title={getCategoryDisplayName(item.image.gallery_category)}
                        />
                      </div>
                    </div>

                    {/* Caption (for larger items) */}
                    {showCaptions && item.image.caption && item.position.width > 100 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-xs font-medium line-clamp-1">
                          {item.image.caption}
                        </p>
                      </div>
                    )}
                  </div>

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

            {/* Template-specific decorative elements */}
            {currentTemplate === 'heart' && (
              <>
                <div className="absolute top-4 right-8 opacity-20">
                  <Heart className="h-8 w-8 text-red-400 transform rotate-12" />
                </div>
                <div className="absolute bottom-8 left-12 opacity-15">
                  <Heart className="h-6 w-6 text-pink-400 transform -rotate-12" />
                </div>
              </>
            )}

            {currentTemplate === 'circle' && (
              <>
                <div className="absolute top-8 left-8 opacity-20">
                  <Circle className="h-6 w-6 text-blue-400" />
                </div>
                <div className="absolute bottom-12 right-12 opacity-15">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
              </>
            )}
          </div>

          {/* Template Info Overlay */}
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
            <div className="flex items-center space-x-2 text-sm">
              {currentTemplateData?.icon}
              <span className="font-medium">{currentTemplateData?.name}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">{collageItems.length} photos</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
            <span>🎨 Click photos to view full size</span>
            <span>•</span>
            <span>🔄 Press &apos;R&apos; to regenerate</span>
            <span>•</span>
            <span>✨ Try different templates above</span>
          </div>
        </div>

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <Palette className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No photos in {selectedCategory === 'all' ? 'gallery' : getCategoryDisplayName(selectedCategory)}
            </h3>
            <p className="text-gray-500">
              {selectedCategory === 'all' 
                ? 'Upload some photos to create your artistic collage!'
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
                onClick={regenerateCollage}
                className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                title="Regenerate collage"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative">
              <Image
                src={selectedImage.file_url}
                alt={selectedImage.caption || 'Collage photo'}
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
                <h3 className="text-white text-xl font-medium mb-2">
                  🎨 {selectedImage.caption}
                </h3>
              )}
              
              <div className="flex items-center justify-between text-white/80">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs flex items-center">
                    <Palette className="h-3 w-3 mr-1" />
                    {getCategoryDisplayName(selectedImage.gallery_category)}
                  </span>
                  <span>{selectedImageIndex + 1} of {filteredImages.length}</span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded-full text-xs flex items-center">
                    {currentTemplateData?.icon}
                    <span className="ml-1">{currentTemplateData?.name}</span>
                  </span>
                </div>
                
                <div className="text-xs flex items-center">
                  <Sparkles className="h-4 w-4 text-yellow-400 mr-1" />
                  Artistic Collage Style
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}