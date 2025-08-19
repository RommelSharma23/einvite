// File: src/components/editor/MultiImageUpload.tsx

'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
  id?: string
}

interface MultiImageUploadProps {
  projectId: string
  galleryCategory: string
  onUploadComplete: (uploadedImages: Array<{ url: string; fileName: string }>) => void
  maxFiles?: number
  maxSizePerFile?: number // in MB
  className?: string
}

export function MultiImageUpload({
  projectId,
  galleryCategory,
  onUploadComplete,
  maxFiles = 10,
  maxSizePerFile = 5,
  className = ''
}: MultiImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select only image files'
    }

    // Check file size
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `File size must be less than ${maxSizePerFile}MB`
    }

    // Check file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP files are allowed'
    }

    return null
  }

  const uploadSingleFile = async (file: File): Promise<{ url: string; fileName: string; id: string } | null> => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('You must be logged in to upload images')
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${user.id}/${projectId}/gallery/${galleryCategory}/${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('wedding-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wedding-images')
        .getPublicUrl(fileName)

      // Get next display order for this category (proper way)
      const { data: existingImages } = await supabase
        .from('media_files')
        .select('display_order')
        .eq('project_id', projectId)
        .eq('gallery_category', galleryCategory)
        .order('display_order', { ascending: false })
        .limit(1)

      const nextDisplayOrder = existingImages && existingImages.length > 0 
        ? (existingImages[0].display_order || 0) + 1 
        : 1

      // Save to media_files table
      const { data: dbData, error: dbError } = await supabase
        .from('media_files')
        .insert({
          project_id: projectId,
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: 'image',
          file_size: file.size,
          section_type: `gallery_${galleryCategory}`,
          gallery_category: galleryCategory,
          caption: '',
          display_order: nextDisplayOrder
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // Don't throw error as file is already uploaded
      }

      return {
        url: publicUrl,
        fileName: file.name,
        id: dbData?.id || ''
      }

    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return
    
    // Validate files first
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      alert(`Some files were skipped:\n${errors.join('\n')}`)
    }

    if (validFiles.length === 0) return

    // Check max files limit
    if (validFiles.length > maxFiles) {
      alert(`You can only upload ${maxFiles} files at once. Only the first ${maxFiles} files will be uploaded.`)
      validFiles.splice(maxFiles)
    }

    setIsUploading(true)

    // Initialize upload queue
    const initialQueue: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))

    setUploadQueue(initialQueue)

    // Upload files sequentially for better reliability
    const uploadedImages: Array<{ url: string; fileName: string }> = []
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      
      try {
        // Update progress
        setUploadQueue(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 50 } : item
        ))

        const result = await uploadSingleFile(file)
        
        if (result) {
          // Mark as completed
          setUploadQueue(prev => prev.map((item, index) => 
            index === i ? { 
              ...item, 
              progress: 100, 
              status: 'completed',
              url: result.url,
              id: result.id
            } : item
          ))

          uploadedImages.push({
            url: result.url,
            fileName: result.fileName
          })
        }

      } catch (error) {
        // Mark as error
        setUploadQueue(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : item
        ))
      }
    }

    setIsUploading(false)

    // Call callback with successful uploads
    if (uploadedImages.length > 0) {
      onUploadComplete(uploadedImages)
    }

    // Clear queue after a delay
    setTimeout(() => {
      setUploadQueue([])
    }, 3000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files || [])
    processFiles(files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFromQueue = (index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index))
  }

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-gray-100 rounded-full">
            <Upload className="h-8 w-8 text-gray-600" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? 'Uploading...' : 'Upload Multiple Photos'}
            </p>
            <p className="text-sm text-gray-600">
              Drag and drop up to {maxFiles} images, or click to browse
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Supports: JPEG, PNG, WebP</p>
            <p>Max size: {maxSizePerFile}MB per file</p>
          </div>

          {!isUploading && (
            <Button variant="outline" className="mt-4">
              <ImageIcon className="h-4 w-4 mr-2" />
              Choose Photos
            </Button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Upload Progress</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {uploadQueue.map((upload, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(upload.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.file.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          upload.status === 'completed' ? 'bg-green-500' :
                          upload.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {upload.status === 'completed' ? 'Done' :
                       upload.status === 'error' ? 'Failed' : 
                       `${upload.progress}%`}
                    </span>
                  </div>
                  {upload.error && (
                    <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                  )}
                </div>

                {(upload.status === 'completed' || upload.status === 'error') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => removeFromQueue(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {uploadQueue.length > 0 && !isUploading && (
        <div className="text-sm text-gray-600 text-center">
          {uploadQueue.filter(u => u.status === 'completed').length} of {uploadQueue.length} images uploaded successfully
        </div>
      )}
    </div>
  )
}