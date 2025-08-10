// File: src/components/editor/GalleryEditor.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from './ImageUpload'
import { MultiImageUpload } from './MultiImageUpload'
import { GalleryStyleSwitcher } from './GalleryStyleSwitcher'
import { supabase } from '@/lib/supabase'
import { 
  Images, 
  Heart, 
  Users, 
  Camera, 
  Trash2, 
  Edit3,
  Palette,
  Settings as SettingsIcon
} from 'lucide-react'

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  display_order: number
  gallery_category: string
  section_type: string
}

interface WeddingEvent {
  id: string
  event_name: string
  event_date: string
  venue_name?: string
  venue_address?: string
  event_description?: string
}

interface GalleryEditorProps {
  projectId: string
  onGalleryUpdate?: () => void
  // Gallery style props
  currentTier?: 'free' | 'silver' | 'gold' | 'platinum'
  selectedGalleryStyle?: string
  onGalleryStyleChange?: (styleId: string) => void
  onUpgrade?: (targetTier: 'free' | 'silver' | 'gold' | 'platinum') => void
  primaryColor?: string
  secondaryColor?: string
  brideName?: string
  groomName?: string
  events?: WeddingEvent[]
}

type GalleryCategory = 'pre_wedding' | 'engagement' | 'family' | 'couple'

const GALLERY_CATEGORIES = [
  { 
    id: 'pre_wedding' as GalleryCategory, 
    name: 'Pre-Wedding', 
    icon: Heart, 
    description: 'Pre-wedding photoshoot images',
    color: 'bg-pink-100 text-pink-800'
  },
  { 
    id: 'engagement' as GalleryCategory, 
    name: 'Engagement', 
    icon: Camera, 
    description: 'Engagement ceremony photos',
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    id: 'family' as GalleryCategory, 
    name: 'Family', 
    icon: Users, 
    description: 'Family photos and moments',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    id: 'couple' as GalleryCategory, 
    name: 'Couple', 
    icon: Heart, 
    description: 'Beautiful couple moments',
    color: 'bg-green-100 text-green-800'
  }
]

export function GalleryEditor({ 
  projectId, 
  onGalleryUpdate,
  currentTier = 'free',
  selectedGalleryStyle = 'grid',
  onGalleryStyleChange = () => {},
  onUpgrade = () => {},
  primaryColor = '#2563eb',
  secondaryColor = '#7c3aed',
  brideName,
  groomName,
  events = []
}: GalleryEditorProps) {
  const [galleryImages, setGalleryImages] = useState<Record<GalleryCategory, GalleryImage[]>>({
    pre_wedding: [],
    engagement: [],
    family: [],
    couple: []
  })
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('pre_wedding')
  const [activeTab, setActiveTab] = useState<'upload' | 'style'>('upload')
  const [loading, setLoading] = useState(true)
  const [editingCaption, setEditingCaption] = useState<string | null>(null)
  const [captionText, setCaptionText] = useState('')

  // Define loadGalleryImages before using it in useEffect
  const loadGalleryImages = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load all gallery images for this project
      const { data: images, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('project_id', projectId)
        .like('section_type', 'gallery_%')
        .order('display_order')

      if (error) {
        console.error('Error loading gallery images:', error)
        return
      }

      // Group images by category
      const groupedImages: Record<GalleryCategory, GalleryImage[]> = {
        pre_wedding: [],
        engagement: [],
        family: [],
        couple: []
      }

      images?.forEach((image) => {
        if (image.gallery_category && groupedImages[image.gallery_category as GalleryCategory]) {
          groupedImages[image.gallery_category as GalleryCategory].push(image)
        }
      })

      setGalleryImages(groupedImages)
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadGalleryImages()
  }, [loadGalleryImages])

  const handleMultiImageUpload = async () => {
    // Reload gallery images to show new uploads
    await loadGalleryImages()
    
    // Call the parent callback to refresh preview
    if (onGalleryUpdate) {
      onGalleryUpdate()
    }
  }

  const handleSingleImageUpload = async () => {
    // Reload gallery images and update preview
    await handleMultiImageUpload()
  }

  const updateCaption = async (imageId: string, newCaption: string) => {
    try {
      const { error } = await supabase
        .from('media_files')
        .update({ caption: newCaption })
        .eq('id', imageId)

      if (error) {
        console.error('Error updating caption:', error)
        return
      }

      // Update local state
      setGalleryImages(prev => ({
        ...prev,
        [activeCategory]: prev[activeCategory].map(img => 
          img.id === imageId ? { ...img, caption: newCaption } : img
        )
      }))

      setEditingCaption(null)
      setCaptionText('')

      // Update preview
      if (onGalleryUpdate) {
        onGalleryUpdate()
      }
    } catch (error) {
      console.error('Error updating caption:', error)
    }
  }

  const deleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      // Delete from database
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', imageId)

      if (error) {
        console.error('Error deleting image:', error)
        return
      }

      // Delete from storage (extract filename from URL)
      const urlParts = imageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      await supabase.storage
        .from('wedding-images')
        .remove([fileName])

      // Update local state
      setGalleryImages(prev => ({
        ...prev,
        [activeCategory]: prev[activeCategory].filter(img => img.id !== imageId)
      }))

      // Update preview
      if (onGalleryUpdate) {
        onGalleryUpdate()
      }

    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const getCategoryStats = () => {
    return GALLERY_CATEGORIES.map(category => ({
      ...category,
      count: galleryImages[category.id].length
    }))
  }

  // Get all images for style preview
  const getAllImages = () => {
    return Object.values(galleryImages).flat()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading gallery...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gallery Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Images className="h-5 w-5 mr-2 text-purple-500" />
            <CardTitle className="text-base">Photo Gallery</CardTitle>
          </div>
          <CardDescription>
            Upload and organize beautiful photos to showcase your love story
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getCategoryStats().map((category) => (
              <div 
                key={category.id}
                className="text-center p-4 border rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => setActiveCategory(category.id)}
              >
                <category.icon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <h3 className="font-medium text-sm">{category.name}</h3>
                <Badge variant="secondary" className="mt-1">
                  {category.count} photos
                </Badge>
              </div>
            ))}
          </div>
          
          {/* Total count */}
          <div className="text-center pt-2 border-t">
            <p className="text-sm text-gray-600">
              Total: {getAllImages().length} photos uploaded
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'style')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center">
            <Images className="h-4 w-4 mr-2" />
            Upload & Manage
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Gallery Style
          </TabsTrigger>
        </TabsList>

        {/* Upload & Manage Tab */}
        <TabsContent value="upload" className="space-y-4 mt-4">
          {/* Quick Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Upload</CardTitle>
              <CardDescription>
                Upload photos to {GALLERY_CATEGORIES.find(c => c.id === activeCategory)?.name} category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiImageUpload
                projectId={projectId}
                galleryCategory={activeCategory}
                onUploadComplete={handleMultiImageUpload}
                maxFiles={10}
                maxSizePerFile={5}
              />
            </CardContent>
          </Card>

          {/* Category Management */}
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as GalleryCategory)}>
            <TabsList className="grid w-full grid-cols-4">
              {GALLERY_CATEGORIES.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  <category.icon className="h-4 w-4 mr-1" />
                  {category.name}
                  {galleryImages[category.id].length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {galleryImages[category.id].length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {GALLERY_CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <category.icon className="h-5 w-5 mr-2" />
                        <CardTitle className="text-base">{category.name} Photos</CardTitle>
                      </div>
                      <Badge className={category.color}>
                        {galleryImages[category.id].length} photos
                      </Badge>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Multi-Image Upload Section */}
                    <div className="space-y-2">
                      <Label>Upload Multiple {category.name} Photos</Label>
                      <MultiImageUpload
                        projectId={projectId}
                        galleryCategory={category.id}
                        onUploadComplete={handleMultiImageUpload}
                        maxFiles={20}
                        maxSizePerFile={10}
                      />
                    </div>

                    {/* Single Image Upload (Alternative) */}
                    <div className="space-y-2">
                      <Label>Or Upload Single Photo</Label>
                      <div className="text-xs text-gray-500 mb-2">
                        Use this for single photo uploads with custom dimensions
                      </div>
                      <ImageUpload
                        projectId={projectId}
                        sectionType={`gallery_${category.id}`}
                        onImageUploaded={() => handleSingleImageUpload()}
                        aspectRatio="landscape"
                        maxSize={10}
                        recommendedDimensions="1200x800px"
                      />
                    </div>

                    {/* Images Grid */}
                    {galleryImages[category.id].length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {galleryImages[category.id].map((image, index) => (
                          <div key={image.id} className="relative group">
                            <div className="aspect-video rounded-lg overflow-hidden border relative">
                              <Image
                                src={image.file_url}
                                alt={image.caption || `${category.name} photo ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority={index < 4} // Optimize loading for first 4 images
                              />
                            </div>
                            
                            {/* Image Controls */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setEditingCaption(image.id)
                                    setCaptionText(image.caption || '')
                                  }}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0"
                                  onClick={() => deleteImage(image.id, image.file_url)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Caption */}
                            <div className="mt-2">
                              {editingCaption === image.id ? (
                                <div className="flex space-x-2">
                                  <Input
                                    value={captionText}
                                    onChange={(e) => setCaptionText(e.target.value)}
                                    placeholder="Add a caption..."
                                    className="text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => updateCaption(image.id, captionText)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingCaption(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <p 
                                  className="text-sm text-gray-600 cursor-pointer hover:text-gray-800"
                                  onClick={() => {
                                    setEditingCaption(image.id)
                                    setCaptionText(image.caption || '')
                                  }}
                                >
                                  {image.caption || 'Click to add caption...'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <category.icon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No {category.name} photos yet</h3>
                        <p className="text-gray-600">Upload your first {category.name.toLowerCase()} photo to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* Gallery Style Tab */}
        <TabsContent value="style" className="space-y-4 mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2 text-blue-500" />
                  <CardTitle className="text-base">Gallery Display Style</CardTitle>
                </div>
                <CardDescription>
                  Choose how your photos will be displayed to your wedding guests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GalleryStyleSwitcher
                  images={getAllImages()}
                  events={events}
                  currentTier={currentTier}
                  selectedStyle={selectedGalleryStyle}
                  onStyleChange={onGalleryStyleChange}
                  onUpgrade={onUpgrade}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  brideName={brideName}
                  groomName={groomName}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}