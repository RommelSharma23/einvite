// File: src/components/dashboard/PhotoGalleryModal.tsx

'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Download, 
  User, 
  Calendar,
  Image as ImageIcon,
  Users,
  HardDrive,
  Loader,
  Check,
  ZoomIn
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface GalleryPhoto {
  id: string
  original_filename: string
  stored_filename: string
  file_url: string
  thumbnail_url?: string
  file_size: number
  uploaded_at: string
  upload_order: number
}

interface GuestGallery {
  guest_name: string
  guest_email: string
  session_id: string
  total_images: number
  photos: GalleryPhoto[]
}

interface GalleryStats {
  total_guests: number
  total_images: number
  total_size_bytes: number
  total_size_mb: number
}

interface PhotoGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  bucketId: string
  bucketName: string
}

export default function PhotoGalleryModal({
  isOpen,
  onClose,
  bucketId,
  bucketName
}: PhotoGalleryModalProps) {
  const [loading, setLoading] = useState(false)
  const [guests, setGuests] = useState<GuestGallery[]>([])
  const [stats, setStats] = useState<GalleryStats>({
    total_guests: 0,
    total_images: 0,
    total_size_bytes: 0,
    total_size_mb: 0
  })
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadGallery()
    } else {
      // Reset state when modal closes
      setGuests([])
      setSelectedPhotos(new Set())
      setLightboxPhoto(null)
    }
  }, [isOpen, bucketId])

  const loadGallery = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/photo-upload/gallery/${bucketId}`)
      const data = await response.json()

      if (response.ok) {
        setGuests(data.guests || [])
        setStats(data.stats || {
          total_guests: 0,
          total_images: 0,
          total_size_bytes: 0,
          total_size_mb: 0
        })
      } else {
        console.error('Gallery load error:', data.error)
      }
    } catch (error) {
      console.error('Failed to load gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos)
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId)
    } else {
      newSelection.add(photoId)
    }
    setSelectedPhotos(newSelection)
  }

  const selectAllPhotos = () => {
    const allPhotoIds = new Set<string>()
    guests.forEach(guest => {
      guest.photos.forEach(photo => {
        allPhotoIds.add(photo.id)
      })
    })
    setSelectedPhotos(allPhotoIds)
  }

  const clearSelection = () => {
    setSelectedPhotos(new Set())
  }

  const downloadSelected = async () => {
    if (selectedPhotos.size === 0) return
    
    try {
      setDownloading(true)
      
      const response = await fetch('/api/photo-upload/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId,
          downloadType: 'selected',
          photoIds: Array.from(selectedPhotos)
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${bucketName}-selected-photos.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download photos')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download photos')
    } finally {
      setDownloading(false)
    }
  }


  const downloadGuestPhotos = async (sessionId: string, guestName: string) => {
    try {
      setDownloading(true)
      
      const response = await fetch('/api/photo-upload/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId,
          downloadType: 'guest',
          sessionId
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const sanitizedName = guestName.replace(/[^a-z0-9]/gi, '-')
        a.download = `${bucketName}-${sanitizedName}-photos.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download guest photos')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download guest photos')
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${Math.round(bytes / (1024 * 1024) * 10) / 10} MB`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{bucketName} Gallery</h2>
                <p className="text-sm text-gray-600">
                  {stats.total_images} photos from {stats.total_guests} guests • {formatFileSize(stats.total_size_bytes)}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats and Actions */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="grid grid-cols-3 gap-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{stats.total_guests} Guests</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{stats.total_images} Photos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">{stats.total_size_mb} MB</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedPhotos.size > 0 && (
                  <>
                    <Badge variant="secondary">
                      {selectedPhotos.size} selected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadSelected}
                      disabled={downloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                    >
                      Clear
                    </Button>
                  </>
                )}
                <Button
                  onClick={selectedPhotos.size === stats.total_images ? clearSelection : selectAllPhotos}
                  variant="outline"
                  size="sm"
                >
                  {selectedPhotos.size === stats.total_images ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </div>

          {/* Gallery Content */}
          <div className="p-6 max-h-[calc(90vh-240px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading photos...</span>
              </div>
            ) : guests.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Photos Yet</h3>
                <p className="text-gray-600">Guests haven't uploaded any photos to this bucket.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {guests.map((guest, guestIndex) => (
                  <div key={guest.session_id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Guest Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{guest.guest_name}</h3>
                            <p className="text-sm text-gray-600">{guest.guest_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {guest.total_images} photos
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadGuestPhotos(guest.session_id, guest.guest_name)}
                            disabled={downloading}
                            className="shrink-0"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Photos Grid */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {guest.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative group cursor-pointer"
                          >
                            <div
                              className={`relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                                selectedPhotos.has(photo.id)
                                  ? 'border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => togglePhotoSelection(photo.id)}
                            >
                              <img
                                src={photo.thumbnail_url || photo.file_url}
                                alt={photo.original_filename}
                                className="w-full h-24 object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = photo.file_url
                                }}
                              />
                              
                              {/* Selection Overlay */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                {selectedPhotos.has(photo.id) ? (
                                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <ZoomIn className="w-6 h-6 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Photo Info */}
                            <div className="mt-1 text-xs text-gray-500 truncate">
                              <p className="truncate">{photo.original_filename}</p>
                              <div className="flex justify-between">
                                <span>{formatFileSize(photo.file_size)}</span>
                                <span>{formatDate(photo.uploaded_at)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxPhoto.file_url}
              alt={lightboxPhoto.original_filename}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="ghost"
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}