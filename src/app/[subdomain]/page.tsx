// File: src/app/[subdomain]/page.tsx
'use client'
// Add these exports at the very top to disable static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0



import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { WeddingHeader } from '@/components/wedding/WeddingHeader'
import { WeddingHero } from '@/components/wedding/WeddingHero'
import { WeddingEvents } from '@/components/wedding/WeddingEvents'
import { WeddingGallery } from '@/components/wedding/WeddingGallery'
import { WeddingCouple } from '@/components/wedding/WeddingCouple'
import { WeddingWishes } from '@/components/wedding/WeddingWishes'
import { WeddingFooter } from '@/components/wedding/WeddingFooter'
import RSVPForm from '@/components/website/RSVPForm'

interface ContentData {
  hero?: {
    brideName?: string
    groomName?: string
    weddingDate?: string
    welcomeMessage?: string
    heroImageUrl?: string
  }
  couple?: {
    brideInfo?: {
      name?: string
      description?: string
      fatherName?: string
      motherName?: string
      photoUrl?: string
    }
    groomInfo?: {
      name?: string
      description?: string
      fatherName?: string
      motherName?: string
      photoUrl?: string
    }
  }
}

interface WeddingEvent {
  id: string
  event_name: string
  event_date: string
  venue_name: string
  venue_address: string
  event_description: string
}

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  gallery_category: string
  display_order: number
}

interface StylesData {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  fontFamily: string
}

interface WeddingProject {
  id: string
  title: string
  subdomain?: string
  is_published: boolean
  view_count: number
  user_id: string
  subscription_tier: string
}

interface UserProfile {
  id: string
  email: string
  current_subscription: 'free' | 'silver' | 'gold' | 'platinum'
}

// Loading Component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading wedding website...</p>
      </div>
    </div>
  )
}

// Error Component
function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">💒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Wedding Website Not Found</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-sm text-gray-500">
          Please check the URL or contact the couple for the correct link.
        </p>
      </div>
    </div>
  )
}

export default function PublishedWebsitePage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  
  const [project, setProject] = useState<WeddingProject | null>(null)
  const [projectOwner, setProjectOwner] = useState<UserProfile | null>(null)
  const [content, setContent] = useState<ContentData>({})
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [styles, setStyles] = useState<StylesData>({
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, sans-serif'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPublishedWebsite = async () => {
      try {
        setLoading(true)

        // Find project by subdomain (only published ones)
        const { data: projectData, error: projectError } = await supabase
          .from('wedding_projects')
          .select('*')
          .eq('subdomain', subdomain)
          .eq('is_published', true)
          .single()

        if (projectError || !projectData) {
          console.error('Project not found:', projectError)
          setError('Wedding website not found or not published yet')
          return
        }

        console.log('Loaded project:', projectData)
        setProject(projectData)

        // Get project owner's subscription tier
        const { data: ownerData, error: ownerError } = await supabase
          .from('users')
          .select('id, email, current_subscription')
          .eq('id', projectData.user_id)
          .single()

        if (ownerError) {
          console.error('Error fetching project owner:', ownerError)
          // Set default tier if owner fetch fails
          setProjectOwner({
            id: projectData.user_id,
            email: '',
            current_subscription: 'free'
          })
        } else {
          console.log('Project owner:', ownerData)
          setProjectOwner(ownerData)
        }

        // Increment view count for published websites
        await supabase
          .from('wedding_projects')
          .update({ view_count: (projectData.view_count || 0) + 1 })
          .eq('id', projectData.id)

        // Load content
        const { data: contentData, error: contentError } = await supabase
          .from('wedding_content')
          .select('*')
          .eq('project_id', projectData.id)

        if (contentError) {
          console.error('Content error:', contentError)
        }

        // Load events
        const { data: eventsData, error: eventsError } = await supabase
          .from('wedding_events')
          .select('*')
          .eq('project_id', projectData.id)
          .order('display_order')

        if (eventsError) {
          console.error('Events error:', eventsError)
        }

        // Load gallery images
        const { data: galleryData, error: galleryError } = await supabase
          .from('media_files')
          .select('*')
          .eq('project_id', projectData.id)
          .like('section_type', 'gallery_%')
          .order('display_order')

        if (galleryError) {
          console.error('Gallery error:', galleryError)
        }

        // Process content
        if (contentData && contentData.length > 0) {
          const processedContent: ContentData = {}
          contentData.forEach((item) => {
            if (item.section_type === 'styles') {
              setStyles(prev => ({ ...prev, ...item.content_data }))
            } else {
              processedContent[item.section_type as keyof ContentData] = item.content_data
            }
          })
          setContent(processedContent)
        }

        setEvents(eventsData || [])
        setGalleryImages(galleryData || [])

        // Debug logging for RSVP
        console.log('RSVP Debug:', {
          projectId: projectData.id,
          projectTier: projectData.subscription_tier,
          ownerTier: ownerData?.current_subscription,
          shouldShowRSVP: ['gold', 'platinum'].includes(projectData.subscription_tier) || ['gold', 'platinum'].includes(ownerData?.current_subscription || 'free')
        })

      } catch (error) {
        console.error('Error loading published website:', error)
        setError('Failed to load wedding website')
      } finally {
        setLoading(false)
      }
    }

    if (subdomain) {
      loadPublishedWebsite()
    }
  }, [subdomain])

  // Show loading screen
  if (loading) {
    return <LoadingScreen />
  }

  // Show error screen
  if (error) {
    return <ErrorScreen error={error} />
  }

  // Show 404 if project not found
  if (!project || !projectOwner) {
    return <ErrorScreen error="Wedding website not found" />
  }

  // Check if RSVP should be shown - check both project tier and owner tier
  const shouldShowRSVP = ['gold', 'platinum'].includes(project.subscription_tier) || 
                        ['gold', 'platinum'].includes(projectOwner.current_subscription)

  console.log('Final RSVP decision:', {
    shouldShowRSVP,
    projectTier: project.subscription_tier,
    ownerTier: projectOwner.current_subscription
  })

  // Main website render
  return (
    <div className="min-h-screen" style={{ fontFamily: styles.fontFamily }}>
      {/* Header Navigation */}
      <WeddingHeader
        brideName={content.hero?.brideName}
        groomName={content.hero?.groomName}
        primaryColor={styles.primaryColor}
        hasEvents={events.length > 0}
        hasGallery={galleryImages.length > 0}
        hasWishes={['gold', 'platinum'].includes(projectOwner.current_subscription)}
        hasRSVP={shouldShowRSVP}
      />

      {/* Hero Section */}
      <WeddingHero
        brideName={content.hero?.brideName}
        groomName={content.hero?.groomName}
        weddingDate={content.hero?.weddingDate}
        welcomeMessage={content.hero?.welcomeMessage}
        heroImageUrl={content.hero?.heroImageUrl}
        primaryColor={styles.primaryColor}
        secondaryColor={styles.secondaryColor}
        fontFamily={styles.fontFamily}
      />

      {/* Events Section - Only render if events exist */}
      {events.length > 0 && (
        <WeddingEvents
          events={events}
          primaryColor={styles.primaryColor}
          secondaryColor={styles.secondaryColor}
          fontFamily={styles.fontFamily}
        />
      )}

      {/* Gallery Section - Only render if images exist */}
      {galleryImages.length > 0 && (
        <WeddingGallery
          images={galleryImages}
          primaryColor={styles.primaryColor}
          secondaryColor={styles.secondaryColor}
          fontFamily={styles.fontFamily}
          brideName={content.hero?.brideName}
          groomName={content.hero?.groomName}
        />
      )}

      {/* RSVP Section - Only render if Gold/Platinum tier */}
      {shouldShowRSVP && (
        <section id="rsvp" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <RSVPForm 
              projectId={project.id}
              supabase={supabase}
              onSubmitSuccess={() => {
                // Optional: Add analytics, notifications, etc.
                console.log('RSVP submitted successfully for project:', project.id)
                
                // Optional: Show a success toast or redirect
                // You could add a toast notification here
              }}
            />
          </div>
        </section>
      )}

      {/* Couple Section */}
      <section id="couple" className="py-16 bg-white">
        <WeddingCouple
          couple={content.couple || {}}
          primaryColor={styles.primaryColor}
          secondaryColor={styles.secondaryColor}
          fontFamily={styles.fontFamily}
        />
      </section>

      {/* Guest Wishes Section - Only render if Gold/Platinum tier */}
      {['gold', 'platinum'].includes(projectOwner.current_subscription) && (
        <WeddingWishes
          projectId={project.id}
          primaryColor={styles.primaryColor}
          secondaryColor={styles.secondaryColor}
          fontFamily={styles.fontFamily}
          brideName={content.hero?.brideName}
          groomName={content.hero?.groomName}
          userTier={projectOwner.current_subscription}
        />
      )}

      {/* Footer */}
      <WeddingFooter
        brideName={content.hero?.brideName}
        groomName={content.hero?.groomName}
        primaryColor={styles.primaryColor}
        fontFamily={styles.fontFamily}
        viewCount={project.view_count}
      />
    </div>
  )
}