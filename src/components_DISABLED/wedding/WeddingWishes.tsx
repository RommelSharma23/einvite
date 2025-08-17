// File: src/components/wedding/WeddingWishes.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Heart, MessageCircle, Send, AlertCircle, CheckCircle, Clock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

interface GuestWish {
  id: string
  guest_name: string
  message: string
  guest_email?: string
  status: 'pending' | 'approved' | 'rejected'
  is_featured: boolean
  submitted_at: string
}

interface WishesConfig {
  is_enabled: boolean
  display_layout: 'grid' | 'masonry'
  welcome_message: string
  max_message_length: number
  require_email: boolean
}

interface WeddingWishesProps {
  projectId: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  brideName?: string
  groomName?: string
  userTier: 'free' | 'silver' | 'gold' | 'platinum'
}

export function WeddingWishes({
  projectId,
  primaryColor,
  secondaryColor,
  fontFamily,
  brideName = 'Bride',
  groomName = 'Groom',
  userTier
}: WeddingWishesProps) {
  const [wishes, setWishes] = useState<GuestWish[]>([])
  const [config, setConfig] = useState<WishesConfig>({
    is_enabled: true,
    display_layout: 'grid',
    welcome_message: 'Share your wishes and blessings for the happy couple!',
    max_message_length: 500,
    require_email: false
  })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    guestName: '',
    message: '',
    guestEmail: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | 'rate_limit' | null
    message: string
  }>({ type: null, message: '' })

  const WISHES_PER_PAGE = 15

  // Check if feature is available for user tier
  const isFeatureAvailable = useCallback(() => {
    const available = ['gold', 'platinum'].includes(userTier)
    console.log('WeddingWishes - Feature available check:', { userTier, available })
    return available
  }, [userTier])

  // Load wishes configuration
  const loadConfig = useCallback(async () => {
    try {
      console.log('Loading wishes config for project:', projectId)
      
      const { data, error } = await supabase
        .from('wishes_config')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading wishes config:', error)
        return
      }

      if (data) {
        console.log('Wishes config loaded:', data)
        setConfig({
          is_enabled: data.is_enabled,
          display_layout: data.display_layout,
          welcome_message: data.welcome_message,
          max_message_length: data.max_message_length,
          require_email: data.require_email
        })
      } else {
        console.log('No wishes config found, using defaults')
      }
    } catch (error) {
      console.error('Error loading config:', error)
    }
  }, [projectId])

  // Load wishes with pagination
  const loadWishes = useCallback(async (pageNumber = 1, append = false) => {
    try {
      console.log('Loading wishes - page:', pageNumber, 'append:', append)
      
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const startIndex = (pageNumber - 1) * WISHES_PER_PAGE
      const endIndex = startIndex + WISHES_PER_PAGE - 1

      const { data, error, count } = await supabase
        .from('guest_wishes')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('submitted_at', { ascending: false })
        .range(startIndex, endIndex)

      if (error) {
        console.error('Error loading wishes:', error)
        return
      }

      const newWishes = data || []
      console.log('Wishes loaded:', newWishes.length, 'total count:', count)
      
      if (append) {
        setWishes(prev => [...prev, ...newWishes])
      } else {
        setWishes(newWishes)
      }

      // Check if there are more wishes to load
      const totalLoaded = append ? wishes.length + newWishes.length : newWishes.length
      setHasMore(count ? totalLoaded < count : false)

    } catch (error) {
      console.error('Error loading wishes:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [projectId, wishes.length])

  // Submit wish using API
  const submitWish = async () => {
    console.log('Submitting wish:', formData)
    
    // Validation
    if (!formData.guestName.trim() || !formData.message.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in your name and message'
      })
      return
    }

    if (config.require_email && !formData.guestEmail.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Email is required'
      })
      return
    }

    if (formData.message.length > config.max_message_length) {
      setSubmitStatus({
        type: 'error',
        message: `Message must be less than ${config.max_message_length} characters`
      })
      return
    }

    // Email validation if provided
    if (formData.guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail)) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter a valid email address'
      })
      return
    }

    setSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      // Submit using API
      const response = await fetch('/api/wishes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          guestName: formData.guestName.trim(),
          message: formData.message.trim(),
          guestEmail: formData.guestEmail.trim() || null
        })
      })

      const result = await response.json()
      console.log('Submit response:', result)

      if (!response.ok) {
        if (response.status === 429) {
          setSubmitStatus({
            type: 'rate_limit',
            message: result.message || 'Too many submissions. Please wait before submitting another wish.'
          })
        } else {
          setSubmitStatus({
            type: 'error',
            message: result.error || 'Failed to submit your message'
          })
        }
        return
      }

      // Success
      setSubmitStatus({
        type: 'success',
        message: result.message
      })

      // Add to wishes list if approved immediately
      if (result.status === 'approved' && result.wish) {
        setWishes(prev => [result.wish, ...prev])
      }

      // Clear form
      setFormData({ guestName: '', message: '', guestEmail: '' })

    } catch (error) {
      console.error('Error submitting wish:', error)
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit your message. Please try again.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Load more wishes
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadWishes(nextPage, true)
    }
  }

  // Initialize
  useEffect(() => {
    console.log('WeddingWishes component initializing:', {
      projectId,
      userTier,
      isFeatureAvailable: isFeatureAvailable()
    })
    
    if (!isFeatureAvailable()) {
      console.log('Feature not available for tier:', userTier)
      return
    }
    
    loadConfig()
    loadWishes()
  }, [loadConfig, loadWishes, isFeatureAvailable])

  // Debug log for render conditions
  console.log('WeddingWishes render check:', {
    userTier,
    isFeatureAvailable: isFeatureAvailable(),
    configEnabled: config.is_enabled,
    wishesCount: wishes.length,
    loading
  })

  // Don't render if feature not available for tier
  if (!isFeatureAvailable()) {
    console.log('Not rendering - feature not available for tier:', userTier)
    return null
  }

  // Don't render if disabled in config
  if (!config.is_enabled) {
    console.log('Not rendering - wishes disabled in config')
    return null
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <section 
      id="wishes" 
      className="py-16 px-6"
      style={{ 
        fontFamily,
        backgroundColor: '#fafafa'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Heart 
              className="h-8 w-8 mr-3" 
              style={{ color: primaryColor }}
            />
            <h2 
              className="text-3xl md:text-4xl font-serif"
              style={{ color: primaryColor }}
            >
              Guest Wishes
            </h2>
          </div>
          <p 
            className="text-lg mb-8 max-w-2xl mx-auto"
            style={{ color: secondaryColor }}
          >
            {config.welcome_message}
          </p>
        </div>

        {/* Wish Submission Form */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <Input
                      value={formData.guestName}
                      onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                      placeholder="Enter your name"
                      maxLength={100}
                    />
                  </div>
                  {config.require_email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.guestEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                        placeholder="your@email.com"
                        leftIcon={<Mail className="h-4 w-4" />}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder={`Share your wishes for ${brideName} & ${groomName}...`}
                    rows={4}
                    maxLength={config.max_message_length}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.message.length}/{config.max_message_length}
                  </div>
                </div>

                {/* Status Messages */}
                {submitStatus.type && (
                  <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                    submitStatus.type === 'success' 
                      ? 'bg-green-50 text-green-700' 
                      : submitStatus.type === 'rate_limit'
                      ? 'bg-orange-50 text-orange-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {submitStatus.type === 'success' && <CheckCircle className="h-4 w-4" />}
                    {submitStatus.type === 'rate_limit' && <Clock className="h-4 w-4" />}
                    {submitStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
                    <span className="text-sm">{submitStatus.message}</span>
                  </div>
                )}

                <Button
                  onClick={submitWish}
                  disabled={submitting}
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Wishes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wishes Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading wishes...</span>
          </div>
        ) : wishes.length > 0 ? (
          <>
            <div className={`${
              config.display_layout === 'masonry' 
                ? 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6' 
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            }`}>
              {wishes.map((wish) => (
                <Card 
                  key={wish.id} 
                  className={`shadow-md hover:shadow-lg transition-shadow ${
                    wish.is_featured ? 'border-2' : ''
                  } ${config.display_layout === 'masonry' ? 'break-inside-avoid mb-6' : ''}`}
                  style={{
                    ...(wish.is_featured && { 
                      borderColor: primaryColor
                    })
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        {wish.guest_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {wish.guest_name}
                          </h4>
                          {wish.is_featured && (
                            <Heart 
                              className="h-4 w-4 fill-current" 
                              style={{ color: primaryColor }}
                            />
                          )}
                        </div>
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {wish.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(wish.submitted_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Loading more...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Load More Wishes
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No wishes yet
            </h3>
            <p className="text-gray-600">
              Be the first to share your blessings for {brideName} & {groomName}!
            </p>
          </div>
        )}
      </div>
    </section>
  )
}