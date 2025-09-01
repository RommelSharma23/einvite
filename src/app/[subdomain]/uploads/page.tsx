// File: src/app/[subdomain]/uploads/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Camera, Upload, CheckCircle, AlertCircle, Heart, X } from 'lucide-react'
import { GuestUploadBucket, GuestUploadSession } from '@/types'

// Loading Component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading upload page...</p>
      </div>
    </div>
  )
}

// Error Component
function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">📸</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Not Available</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-sm text-gray-500">
          Please check with the couple or try again later.
        </p>
      </div>
    </div>
  )
}

export default function PhotoUploadPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  const uploadToken = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bucket, setBucket] = useState<GuestUploadBucket | null>(null)
  const [session, setSession] = useState<GuestUploadSession | null>(null)
  const [projectInfo, setProjectInfo] = useState<{
    brideName?: string
    groomName?: string
    weddingDate?: string
    heroImage?: string
  }>({})

  // Upload form state
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [uploadComplete, setUploadComplete] = useState(false)
  const [existingUploads, setExistingUploads] = useState<any[]>([])
  const [isResuming, setIsResuming] = useState(false)

  useEffect(() => {
    const loadUploadPage = async () => {
      try {
        setLoading(true)

        if (!uploadToken) {
          setError('Upload link is invalid. Please use the QR code or link provided by the couple.')
          return
        }

        // Get project by subdomain
        const { data: projectData, error: projectError } = await supabase
          .from('wedding_projects')
          .select('*')
          .eq('subdomain', subdomain)
          .eq('is_published', true)
          .single()

        if (projectError || !projectData) {
          setError('Wedding website not found.')
          return
        }

        // Get bucket by upload token (check if it exists first)
        console.log('Looking for bucket with token:', uploadToken)
        const { data: allBucketsWithToken, error: allBucketsError } = await supabase
          .from('guest_upload_buckets')
          .select('*')
          .eq('upload_token', uploadToken)

        console.log('All buckets with this token:', { allBucketsWithToken, allBucketsError })

        if (allBucketsError) {
          setError(`Database error: ${allBucketsError.message}`)
          return
        }

        if (!allBucketsWithToken || allBucketsWithToken.length === 0) {
          setError('Upload link is invalid. The token was not found in our database.')
          return
        }

        const bucketData = allBucketsWithToken[0]
        console.log('Found bucket:', bucketData)

        // Check if bucket is active
        if (!bucketData.is_active) {
          setError('Photo upload has been disabled.')
          return
        }

        // Check if bucket belongs to this project
        if (bucketData.project_id !== projectData.id) {
          setError('Upload link does not match this wedding website.')
          return
        }

        // Check expiration
        if (bucketData.expires_at && new Date(bucketData.expires_at) < new Date()) {
          setError('Photo upload has expired.')
          return
        }

        setBucket(bucketData)

        // Record QR scan if user came from QR code
        await recordQRScan(bucketData.id)

        // Load project content for couple names
        const { data: contentData } = await supabase
          .from('wedding_content')
          .select('content_data')
          .eq('project_id', projectData.id)
          .eq('section_type', 'hero')
          .single()

        if (contentData?.content_data) {
          console.log('Hero content_data:', contentData.content_data)
          console.log('Available keys:', Object.keys(contentData.content_data))
          const heroImage = contentData.content_data.heroImage || contentData.content_data.backgroundImage || contentData.content_data.image
          console.log('Final heroImage value:', heroImage)
          setProjectInfo({
            brideName: contentData.content_data.brideName,
            groomName: contentData.content_data.groomName,
            weddingDate: contentData.content_data.weddingDate,
            heroImage: heroImage
          })
        }

      } catch (error) {
        console.error('Error loading upload page:', error)
        setError('Failed to load upload page. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadUploadPage()
  }, [subdomain, uploadToken])

  const recordQRScan = async (bucketId: string) => {
    try {
      // Only record if it looks like they came from a QR scan
      // (has upload token and no referrer from internal pages)
      const referrer = document.referrer
      const isDirectAccess = !referrer || !referrer.includes(window.location.origin)
      
      if (uploadToken && isDirectAccess) {
        await fetch('/api/photo-upload/track-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucket_id: bucketId,
            user_agent: navigator.userAgent,
            referrer: referrer || '',
            scan_source: 'qr_code'
          })
        })
      }
    } catch (error) {
      // Scan tracking is optional - don't fail the page load
      console.log('QR scan tracking failed:', error)
    }
  }

  const createSession = async () => {
    if (!bucket || !guestName.trim() || !guestEmail.trim()) return

    try {
      const response = await fetch('/api/photo-upload/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket_id: bucket.id,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim()
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setSession(data.session)
        setExistingUploads(data.existing_uploads || [])
        setIsResuming(data.is_resuming || false)
        
        if (data.is_resuming) {
          console.log('Resuming existing session with', data.existing_uploads.length, 'existing uploads')
        }
      } else {
        alert('Error creating upload session: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create upload session')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'))
    if (validFiles.length !== files.length) {
      alert('Only image files are allowed.')
    }

    // Check file size limits
    const maxSize = bucket!.max_file_size_mb * 1024 * 1024
    const validSizedFiles = validFiles.filter(file => file.size <= maxSize)
    if (validSizedFiles.length !== validFiles.length) {
      alert(`Some files are too large. Maximum size: ${bucket!.max_file_size_mb}MB`)
    }

    // Check total limit
    const currentTotal = session!.total_images
    const newTotal = currentTotal + validSizedFiles.length
    if (newTotal > bucket!.max_images_per_guest) {
      const remaining = bucket!.max_images_per_guest - currentTotal
      alert(`You can only upload ${remaining} more image(s). Maximum ${bucket!.max_images_per_guest} images per guest.`)
      setSelectedFiles(validSizedFiles.slice(0, remaining))
      return
    }

    setSelectedFiles(validSizedFiles)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (!session || selectedFiles.length === 0) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('session_token', session.session_token)
      
      selectedFiles.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/photo-upload/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (response.ok) {
        setUploadComplete(true)
        setSelectedFiles([])
        // Update session info
        setSession({
          ...session,
          total_images: session.total_images + data.uploaded
        })
      } else {
        alert('Upload failed: ' + data.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen error={error} />
  }

  if (!bucket) {
    return <ErrorScreen error="Upload bucket not found" />
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: (!session && projectInfo.heroImage) 
          ? `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), url(${projectInfo.heroImage})`
          : 'linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 50%, #fdf2f8 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Blurred backdrop overlay - only show on name/email screen */}
      {!session && projectInfo.heroImage && (
        <div 
          className="absolute inset-0 backdrop-blur-sm bg-white/30"
          style={{ zIndex: 1 }}
        />
      )}
      
      {/* Content wrapper */}
      <div className="relative" style={{ zIndex: 2 }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Share Your Photos
            </h1>
            {projectInfo.brideName && projectInfo.groomName && (
              <p className="text-lg text-gray-600 mb-2">
                {projectInfo.brideName} & {projectInfo.groomName}'s Wedding
              </p>
            )}
            <p className="text-gray-500">
              Upload your favorite moments from their special day
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Bucket Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {bucket.bucket_name}
            </h2>
            {bucket.bucket_description && (
              <p className="text-gray-600">{bucket.bucket_description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{bucket.max_images_per_guest}</div>
              <div className="text-gray-600">Max photos per guest</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{bucket.max_file_size_mb}MB</div>
              <div className="text-gray-600">Max file size</div>
            </div>
          </div>
        </div>

        {!session ? (
          /* Guest Information Form */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-center">
              Let's get started! 👋
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
              <button
                onClick={createSession}
                disabled={!guestName.trim() || !guestEmail.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Start Uploading Photos
              </button>
            </div>
          </div>
        ) : (
          /* Upload Interface */
          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Welcome back, <strong>{session.guest_name}</strong>!</p>
                  <p className="text-xs text-gray-500">
                    {session.total_images}/{bucket.max_images_per_guest} photos uploaded
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Uploads Display */}
            {isResuming && existingUploads.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-800">Your Previously Uploaded Photos</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {existingUploads.map((upload, index) => (
                    <div key={upload.id} className="relative group">
                      <img
                        src={upload.thumbnail_url || upload.file_url}
                        alt={upload.original_filename}
                        className="w-full h-24 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          e.currentTarget.src = upload.file_url
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center px-2">
                          {upload.original_filename}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-blue-700 mt-3">
                  You can continue uploading more photos below (up to {bucket.max_images_per_guest - existingUploads.length} more).
                </p>
              </div>
            )}

            {uploadComplete && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-semibold text-green-800">Photos uploaded successfully!</p>
                    <p className="text-sm text-green-700">Thank you for sharing your memories.</p>
                  </div>
                </div>
              </div>
            )}

            {/* File Upload */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Upload Photos</h3>
              
              {session.total_images < bucket.max_images_per_guest && (
                <>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Choose photos to share from the wedding
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-input"
                    />
                    <label
                      htmlFor="file-input"
                      className="bg-blue-500 text-white py-2 px-6 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
                    >
                      Select Photos
                    </label>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Selected Photos ({selectedFiles.length})</h4>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative bg-gray-100 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={uploadFiles}
                        disabled={uploading}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 hover:from-green-600 hover:to-green-700 transition-all"
                      >
                        {uploading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 inline mr-2" />
                            Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {session.total_images >= bucket.max_images_per_guest && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="font-semibold text-yellow-800">Upload Limit Reached</p>
                  <p className="text-sm text-yellow-700">
                    You've uploaded the maximum of {bucket.max_images_per_guest} photos. Thank you for sharing!
                  </p>
                </div>
              )}
            </div>

            {/* Thank You Message */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl p-6 text-center">
              <Heart className="w-8 h-8 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">Thank You!</h3>
              <p className="text-pink-100">
                Your photos will help {projectInfo.brideName} & {projectInfo.groomName} relive their special day. ❤️
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}