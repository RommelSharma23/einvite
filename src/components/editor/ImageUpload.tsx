// File: src/components/editor/ImageUpload.tsx

'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface ImageUploadProps {
  projectId: string
  sectionType: string // 'hero_image', 'bride_photo', 'groom_photo', 'gallery'
  currentImageUrl?: string
  onImageUploaded: (imageUrl: string, fileName: string) => void
  className?: string
  aspectRatio?: 'square' | 'portrait' | 'landscape'
  maxSize?: number // in MB
  recommendedDimensions?: string
}

export function ImageUpload({
  projectId,
  sectionType,
  currentImageUrl,
  onImageUploaded,
  className = '',
  aspectRatio = 'square',
  maxSize = 5,
  recommendedDimensions = '800x800px'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square h-32 w-32' // 128x128px
      case 'portrait': return 'aspect-[3/4] h-40 w-32' // Portrait for profile photos
      case 'landscape': return 'aspect-[16/9] h-32 w-56' // Landscape for hero images
      default: return 'aspect-square h-32 w-32'
    }
  }

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file'
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }

    // Check file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP files are allowed'
    }

    return null
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError('You must be logged in to upload images')
        return
      }

      // Delete old image if exists before uploading new one
      if (currentImageUrl) {
        await removeOldImage(currentImageUrl)
      }

      // Create organized file path: user_id/project_id/section_type/filename
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${user.id}/${projectId}/${sectionType}/${timestamp}.${fileExt}`

      console.log('Uploading file to path:', fileName)

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('wedding-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wedding-images')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)

      // Save to media_files table
      const { error: dbError } = await supabase
        .from('media_files')
        .insert({
          project_id: projectId,
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: 'image',
          file_size: file.size,
          section_type: sectionType
        })

      if (dbError) {
        console.error('Database error:', dbError)
        // Don't throw error as file is already uploaded
      }

      // Call callback with image URL
      onImageUploaded(publicUrl, file.name)

    } catch (error: unknown) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeOldImage = async (imageUrl: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Extract file path from URL
      const urlParts = imageUrl.split('/')
      const pathIndex = urlParts.findIndex(part => part === 'wedding-images')
      
      if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
        // Get the file path after 'wedding-images'
        const filePath = urlParts.slice(pathIndex + 1).join('/')
        
        console.log('Removing old image:', filePath)

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('wedding-images')
          .remove([filePath])

        if (storageError) {
          console.error('Error removing from storage:', storageError)
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('media_files')
          .delete()
          .eq('file_url', imageUrl)
          .eq('user_id', user.id)

        if (dbError) {
          console.error('Error removing from database:', dbError)
        }
      }
    } catch (error) {
      console.error('Error removing old image:', error)
    }
  }

  const removeImage = async () => {
    if (currentImageUrl) {
      await removeOldImage(currentImageUrl)
      // Clear the image
      onImageUploaded('', '')
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {currentImageUrl ? (
        // Show current image
        <div className="relative group">
          <div className={`${getAspectRatioClass()} w-full rounded-lg overflow-hidden border-2 border-gray-200`}>
            <img
              src={currentImageUrl}
              alt="Uploaded image"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="destructive"
              onClick={removeImage}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-xs"
            >
              Change Image
            </Button>
          </div>
        </div>
      ) : (
        // Show upload area
        <div
          className={`
            ${getAspectRatioClass()} w-full border-2 border-dashed rounded-lg 
            flex flex-col items-center justify-center cursor-pointer
            transition-colors hover:border-blue-400 hover:bg-blue-50
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 p-4 text-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span>
                <span> or drag and drop</span>
              </div>
              <div className="text-xs text-gray-500">
                <div>Recommended: {recommendedDimensions}</div>
                <div>PNG, JPG, WebP up to {maxSize}MB</div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
}