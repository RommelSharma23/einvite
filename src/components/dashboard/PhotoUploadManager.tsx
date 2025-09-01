// File: src/components/dashboard/PhotoUploadManager.tsx

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Plus, 
  QrCode, 
  Users, 
  Upload, 
  Settings, 
  Eye,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { GuestUploadBucket } from '@/types'
import PhotoUploadQRGenerator from './PhotoUploadQRGenerator'
import PhotoGalleryModal from './PhotoGalleryModal'

interface PhotoUploadManagerProps {
  projectId: string
  weddingDate?: string
  userTier: string
  brideName?: string
  groomName?: string
  subdomain?: string
}

export default function PhotoUploadManager({ 
  projectId, 
  weddingDate, 
  userTier,
  brideName,
  groomName,
  subdomain 
}: PhotoUploadManagerProps) {
  const [buckets, setBuckets] = useState<GuestUploadBucket[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedBucket, setSelectedBucket] = useState<GuestUploadBucket | null>(null)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [galleryBucket, setGalleryBucket] = useState<GuestUploadBucket | null>(null)
  const [newBucket, setNewBucket] = useState({
    bucket_name: '',
    bucket_description: '',
    max_images_per_guest: 30,
    max_file_size_mb: 10
  })

  // Check if feature should be enabled (day after wedding)
  const isFeatureEnabled = () => {
    if (!weddingDate) return true // If no wedding date set, allow creation
    const wedding = new Date(weddingDate)
    const dayAfterWedding = new Date(wedding)
    dayAfterWedding.setDate(wedding.getDate() + 1)
    return new Date() >= dayAfterWedding
  }

  const loadBuckets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/photo-upload/buckets?projectId=${projectId}`)
      const data = await response.json()
      
      if (response.ok) {
        setBuckets(data.buckets || [])
      } else {
        console.error('Error loading buckets:', data.error)
      }
    } catch (error) {
      console.error('Error loading buckets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  useEffect(() => {
    getCurrentUser()
    loadBuckets()
  }, [projectId])

  const createBucket = async () => {
    if (creating || !currentUserId) return // Prevent double-clicks and ensure user is loaded
    
    try {
      setCreating(true)
      console.log('Creating bucket with data:', {
        project_id: projectId,
        user_id: currentUserId,
        ...newBucket
      })
      
      const response = await fetch('/api/photo-upload/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          user_id: currentUserId,
          ...newBucket
        })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok) {
        console.log('Bucket created successfully:', data.bucket)
        setBuckets([data.bucket, ...buckets])
        setNewBucket({
          bucket_name: '',
          bucket_description: '',
          max_images_per_guest: 30,
          max_file_size_mb: 10
        })
        setShowCreateForm(false)
        // Show success message
        alert('Bucket created successfully!')
      } else {
        console.error('API Error:', data)
        alert('Error creating bucket: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Network/Parse Error:', error)
      alert('Failed to create bucket: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const deleteBucket = async (bucketId: string) => {
    if (!confirm('Are you sure you want to delete this bucket? All uploaded photos will be lost.')) {
      return
    }

    try {
      const response = await fetch(`/api/photo-upload/buckets/${bucketId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBuckets(buckets.filter(b => b.id !== bucketId))
      } else {
        const data = await response.json()
        alert('Error deleting bucket: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting bucket:', error)
      alert('Failed to delete bucket')
    }
  }

  const getUploadUrl = (bucket: GuestUploadBucket) => {
    return `/${subdomain}/uploads?token=${bucket.upload_token}`
  }

  const openUploadPage = (bucket: GuestUploadBucket) => {
    const url = getUploadUrl(bucket)
    window.open(url, '_blank')
  }

  const openQRModal = (bucket: GuestUploadBucket) => {
    setSelectedBucket(bucket)
    setShowQRModal(true)
  }

  const closeQRModal = () => {
    setShowQRModal(false)
    setSelectedBucket(null)
  }

  const openGalleryModal = (bucket: GuestUploadBucket) => {
    setGalleryBucket(bucket)
    setShowGalleryModal(true)
  }

  const closeGalleryModal = () => {
    setShowGalleryModal(false)
    setGalleryBucket(null)
  }

  if (!isFeatureEnabled()) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <CardTitle>Guest Photo Upload</CardTitle>
          </div>
          <CardDescription>
            Photo upload feature will be available the day after your wedding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              This feature will be enabled on{' '}
              {weddingDate && new Date(new Date(weddingDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              Guests will be able to upload photos from your special day using QR codes
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Guest Photo Upload</CardTitle>
              <CardDescription>
                Let guests share their photos from your wedding
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Bucket
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <h3 className="font-semibold mb-4">Create New Photo Bucket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bucket Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., Reception Photos, Ceremony Memories"
                  value={newBucket.bucket_name}
                  onChange={(e) => setNewBucket({...newBucket, bucket_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  placeholder="Tell guests what kind of photos to share..."
                  value={newBucket.bucket_description}
                  onChange={(e) => setNewBucket({...newBucket, bucket_description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Images per Guest</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full p-2 border rounded-md"
                    value={newBucket.max_images_per_guest}
                    onChange={(e) => setNewBucket({...newBucket, max_images_per_guest: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max File Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="w-full p-2 border rounded-md"
                    value={newBucket.max_file_size_mb}
                    onChange={(e) => setNewBucket({...newBucket, max_file_size_mb: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={createBucket} 
                  disabled={!newBucket.bucket_name.trim() || creating || !currentUserId}
                  type="button"
                >
                  {creating ? 'Creating...' : 'Create Bucket'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading photo buckets...</p>
          </div>
        ) : buckets.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Photo Buckets Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first photo bucket to start collecting guest photos
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Bucket
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {buckets.map((bucket) => (
              <div key={bucket.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Camera className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{bucket.bucket_name}</h3>
                      <p className="text-sm text-gray-600">{bucket.bucket_description}</p>
                    </div>
                  </div>
                  <Badge variant={bucket.is_active ? 'success' : 'secondary'}>
                    {bucket.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-blue-600 mb-1">
                      <Users className="h-4 w-4 mr-1" />
                    </div>
                    <p className="font-semibold">{bucket.total_sessions}</p>
                    <p className="text-gray-500">Sessions</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-green-600 mb-1">
                      <Upload className="h-4 w-4 mr-1" />
                    </div>
                    <p className="font-semibold">{bucket.total_uploads}</p>
                    <p className="text-gray-500">Photos</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-purple-600 mb-1">
                      <QrCode className="h-4 w-4 mr-1" />
                    </div>
                    <p className="font-semibold">{bucket.total_scans}</p>
                    <p className="text-gray-500">QR Scans</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-orange-600 mb-1">
                      <Settings className="h-4 w-4 mr-1" />
                    </div>
                    <p className="font-semibold">{bucket.max_images_per_guest}</p>
                    <p className="text-gray-500">Max/Guest</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm text-gray-500">
                    Created: {new Date(bucket.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUploadPage(bucket)}
                      title="Open Upload Page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openQRModal(bucket)}
                      title="Generate QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGalleryModal(bucket)}
                      title="View Uploads"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBucket(bucket.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete Bucket"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Upload URL:</strong>{' '}
                  <code className="bg-gray-200 px-1 rounded text-xs">
                    {window.location.origin}{getUploadUrl(bucket)}
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

      {/* QR Code Generator Modal */}
      {selectedBucket && (
        <PhotoUploadQRGenerator
          isOpen={showQRModal}
          onClose={closeQRModal}
          uploadUrl={`${window.location.origin}${getUploadUrl(selectedBucket)}`}
          bucketName={selectedBucket.bucket_name}
          bucketDescription={selectedBucket.bucket_description}
          brideName={brideName}
          groomName={groomName}
        />
      )}

      {/* Photo Gallery Modal */}
      {galleryBucket && (
        <PhotoGalleryModal
          isOpen={showGalleryModal}
          onClose={closeGalleryModal}
          bucketId={galleryBucket.id}
          bucketName={galleryBucket.bucket_name}
        />
      )}
    </>
  )
}