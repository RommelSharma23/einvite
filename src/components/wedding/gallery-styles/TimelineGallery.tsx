// File: src/components/wedding/gallery-styles/TimelineGallery.tsx

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { 
  Calendar,
  Heart,
  MapPin,
  Clock,
  Users,
  Camera,
  Share2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles
} from 'lucide-react'

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
  uploaded_at?: string
}

interface WeddingEvent {
  id: string
  event_name: string
  event_date: string
  venue_name?: string
  venue_address?: string
  event_description?: string
}

interface TimelineSection {
  id: string
  title: string
  date: string
  category: string
  description?: string
  images: GalleryImage[]
  icon: React.ReactNode
  color: string
}

interface TimelineGalleryProps {
  images: GalleryImage[]
  events?: WeddingEvent[]
  primaryColor: string
  secondaryColor: string
  brideName?: string
  groomName?: string
  enableDownloadProtection?: boolean
  showCaptions?: boolean
  autoPlaySlideshow?: boolean
  slideshowInterval?: number
}

export function TimelineGallery({
  images,
  events = [],
  primaryColor,
  secondaryColor,
  brideName = 'Bride',
  groomName = 'Groom',
  enableDownloadProtection = true,
  showCaptions = true,
  autoPlaySlideshow = false,
  slideshowInterval = 4000
}: TimelineGalleryProps) {
  // ALL HOOKS FIRST
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [currentSection, setCurrentSection] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlaySlideshow)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const getCategoryDisplayName = useCallback((category: string) => {
    const categoryNames: Record<string, string> = {
      'pre_wedding': 'Pre-Wedding',
      'engagement': 'Engagement',
      'family': 'Family',
      'couple': 'Couple'
    }
    return categoryNames[category] || category
  }, [])

  const getCategoryIcon = useCallback((category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'pre_wedding': <Heart className="h-5 w-5" />,
      'engagement': <Sparkles className="h-5 w-5" />,
      'family': <Users className="h-5 w-5" />,
      'couple': <Camera className="h-5 w-5" />,
      'wedding': <Calendar className="h-5 w-5" />,
      'ceremony': <MapPin className="h-5 w-5" />
    }
    return icons[category] || <Camera className="h-5 w-5" />
  }, [])

  const getCategoryColor = useCallback((category: string, baseColor: string) => {
    const colorVariants: Record<string, string> = {
      'pre_wedding': '#f43f5e', // rose
      'engagement': '#a855f7', // purple
      'family': '#3b82f6',      // blue
      'couple': '#ef4444',      // red
      'wedding': baseColor,
      'ceremony': baseColor
    }
    return colorVariants[category] || baseColor
  }, [])

  // Create timeline sections from images and events
  const timelineSections = useMemo(() => {
    const sections: TimelineSection[] = []
    
    // Group images by category
    const imagesByCategory = images.reduce((acc, image) => {
      if (!acc[image.gallery_category]) {
        acc[image.gallery_category] = []
      }
      acc[image.gallery_category].push(image)
      return acc
    }, {} as Record<string, GalleryImage[]>)

    // Create sections from image categories
    Object.entries(imagesByCategory).forEach(([category, categoryImages]) => {
      if (categoryImages.length > 0) {
        // Try to find a matching event for this category
        const matchingEvent = events.find(event => 
          event.event_name.toLowerCase().includes(category.toLowerCase()) ||
          category.toLowerCase().includes(event.event_name.toLowerCase())
        )

        sections.push({
          id: `category-${category}`,
          title: getCategoryDisplayName(category),
          date: matchingEvent?.event_date || categoryImages[0]?.uploaded_at || new Date().toISOString(),
          category,
          description: matchingEvent?.event_description || `Beautiful ${getCategoryDisplayName(category).toLowerCase()} moments`,
          images: categoryImages.sort((a, b) => a.display_order - b.display_order),
          icon: getCategoryIcon(category),
          color: getCategoryColor(category, primaryColor)
        })
      }
    })

    // Add sections for events without images
    events.forEach(event => {
      const hasMatchingCategory = sections.some(section => 
        section.title.toLowerCase().includes(event.event_name.toLowerCase()) ||
        event.event_name.toLowerCase().includes(section.title.toLowerCase())
      )

      if (!hasMatchingCategory) {
        sections.push({
          id: `event-${event.id}`,
          title: event.event_name,
          date: event.event_date,
          category: 'ceremony',
          description: event.event_description || `${event.event_name} ceremony`,
          images: [],
          icon: getCategoryIcon('ceremony'),
          color: getCategoryColor('ceremony', secondaryColor)
        })
      }
    })

    // Sort sections by date
    return sections.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [images, events, getCategoryDisplayName, getCategoryIcon, getCategoryColor, primaryColor, secondaryColor])

  const allImages = useMemo(() => {
    return timelineSections.flatMap(section => section.images)
  }, [timelineSections])

  const openModal = useCallback((image: GalleryImage, sectionId: string) => {
    const imageIndex = allImages.findIndex(img => img.id === image.id)
    setSelectedImage(image)
    setSelectedImageIndex(imageIndex)
    setCurrentSection(sectionId)
    document.body.style.overflow = 'hidden'
  }, [allImages])

  const closeModal = useCallback(() => {
    setSelectedImage(null)
    setCurrentSection(null)
    document.body.style.overflow = 'unset'
  }, [])

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : allImages.length - 1
      setSelectedImageIndex(newIndex)
      setSelectedImage(allImages[newIndex])
    } else {
      const newIndex = selectedImageIndex < allImages.length - 1 ? selectedImageIndex + 1 : 0
      setSelectedImageIndex(newIndex)
      setSelectedImage(allImages[newIndex])
    }
  }, [selectedImageIndex, allImages])

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [])

  const handleImageLoad = useCallback((imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]))
  }, [])

  // Auto-play slideshow
  useEffect(() => {
    if (!isPlaying || allImages.length <= 1 || !selectedImage) return

    const interval = setInterval(() => {
      navigateImage('next')
    }, slideshowInterval)

    return () => clearInterval(interval)
  }, [isPlaying, allImages.length, selectedImage, navigateImage, slideshowInterval])

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
          case ' ':
            e.preventDefault()
            setIsPlaying(!isPlaying)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, closeModal, navigateImage, isPlaying])

  // NOW SAFE TO DO EARLY RETURNS
  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No timeline to display</h3>
        <p className="text-gray-500">Upload photos and add events to create your wedding timeline</p>
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

  return (
    <>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Calendar className="h-8 w-8" style={{ color: primaryColor }} />
            <h2 className="text-3xl font-serif" style={{ color: primaryColor }}>
              Our Wedding Timeline
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Follow our beautiful journey from engagement to wedding day through these cherished moments and memories
          </p>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-500">
            <span>{timelineSections.length} Milestones</span>
            <span>•</span>
            <span>{allImages.length} Photos</span>
            <span>•</span>
            <span>{events.length} Events</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div 
            className="absolute left-8 top-0 bottom-0 w-1 rounded-full"
            style={{ backgroundColor: `${primaryColor}40` }}
          />

          {/* Timeline Sections */}
          <div className="space-y-12">
            {timelineSections.map((section, sectionIndex) => (
              <div key={section.id} className="relative pl-20">
                {/* Timeline Node */}
                <div 
                  className="absolute left-4 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: section.color, top: '1rem' }}
                >
                  <div className="text-white">
                    {section.icon}
                  </div>
                </div>

                {/* Section Content */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Section Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 
                          className="text-xl font-semibold mb-2"
                          style={{ color: section.color }}
                        >
                          {section.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(section.date)}
                          </div>
                          {section.images.length > 0 && (
                            <div className="flex items-center">
                              <Camera className="h-4 w-4 mr-1" />
                              {section.images.length} photos
                            </div>
                          )}
                        </div>
                        {section.description && (
                          <p className="text-gray-600 mt-2">{section.description}</p>
                        )}
                      </div>
                      
                      {section.images.length > 0 && (
                        <button
                          onClick={() => setExpandedSection(
                            expandedSection === section.id ? null : section.id
                          )}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          {expandedSection === section.id ? 'Show Less' : 'View All'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Images */}
                  {section.images.length > 0 && (
                    <div className="p-6">
                      <div className={`grid gap-4 ${
                        expandedSection === section.id 
                          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
                          : 'grid-cols-1 sm:grid-cols-2'
                      }`}>
                        {(expandedSection === section.id 
                          ? section.images 
                          : section.images.slice(0, 4)
                        ).map((image, imageIndex) => {
                          const isLoaded = loadedImages.has(image.id)
                          
                          return (
                            <div
                              key={image.id}
                              className="relative group cursor-pointer overflow-hidden rounded-lg aspect-video bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300"
                              onClick={() => openModal(image, section.id)}
                            >
                              <Image
                                src={image.file_url}
                                alt={image.caption || `${section.title} photo ${imageIndex + 1}`}
                                fill
                                className={`object-cover transition-all duration-300 group-hover:scale-105 ${
                                  isLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                onLoad={() => handleImageLoad(image.id)}
                                loading="lazy"
                              />

                              {/* Loading placeholder */}
                              {!isLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                    <Camera className="h-5 w-5 text-white" />
                                  </div>
                                </div>
                              </div>

                              {/* Caption */}
                              {showCaptions && image.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                  <p className="text-white text-sm font-medium line-clamp-2">
                                    {image.caption}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        
                        {/* Show more indicator */}
                        {expandedSection !== section.id && section.images.length > 4 && (
                          <div 
                            className="aspect-video rounded-lg border-2 border-dashed flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                            style={{ borderColor: `${section.color}60` }}
                            onClick={() => setExpandedSection(section.id)}
                          >
                            <div className="text-center">
                              <Sparkles className="h-6 w-6 mx-auto mb-2" style={{ color: section.color }} />
                              <p className="text-sm font-medium" style={{ color: section.color }}>
                                +{section.images.length - 4} more photos
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Empty Section Message */}
                  {section.images.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No photos yet for this milestone</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline End */}
          <div className="relative pl-20 pt-8">
            <div 
              className="absolute left-6 w-4 h-4 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-red-400" />
              <p className="text-gray-600 font-medium">
                Our Beautiful Journey Continues...
              </p>
            </div>
          </div>
        </div>
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
            {allImages.length > 1 && (
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

            {/* Top Controls */}
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

              {allImages.length > 1 && (
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                  title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedImageIndex(0)
                  setSelectedImage(allImages[0])
                }}
                className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                title="Restart timeline"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>

            {/* Main Image */}
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
                  {selectedImage.caption}
                </h3>
              )}
              
              <div className="flex items-center justify-between text-white/80">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                    {getCategoryDisplayName(selectedImage.gallery_category)}
                  </span>
                  <span>{selectedImageIndex + 1} of {allImages.length}</span>
                  {isPlaying && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-200 rounded-full text-xs flex items-center">
                      <Play className="h-3 w-3 mr-1" />
                      Playing
                    </span>
                  )}
                </div>
                
                <div className="text-xs space-y-1">
                  <div>← → Navigate • Space: Play/Pause</div>
                  <div>Esc: Close • Timeline Story Mode</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}