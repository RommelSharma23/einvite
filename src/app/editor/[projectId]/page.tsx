// File: src/app/editor/[projectId]/page.tsx - Updated without Domain Editor

'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Type, 
  Palette,
  Calendar,
  Images,
  MessageCircle,
  Users
  // REMOVED: Globe import
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentEditor } from '@/components/editor/ContentEditor'
import { StyleEditor } from '@/components/editor/StyleEditor'
import { TemplatePreview } from '@/components/editor/TemplatePreview'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { EventsEditor } from '@/components/editor/EventsEditor'
import { GalleryEditor } from '@/components/editor/GalleryEditor'
import { WishesEditor } from '@/components/editor/WishesEditor'
import RSVPEditor from '@/components/editor/RSVPEditor'
// REMOVED: DomainEditor import
import type { WeddingProject } from '@/types'

// Custom user profile interface with subscription
interface UserProfile {
  id: string
  email: string
  full_name?: string
  current_subscription: 'free' | 'silver' | 'gold' | 'platinum'
}

// Type definitions
interface HeroContent {
  brideName: string
  groomName: string
  weddingDate: string
  welcomeMessage: string
  heroImageUrl: string
}

interface PersonInfo {
  name: string
  description: string
  fatherName: string
  motherName: string
  photoUrl: string
}

interface CoupleContent {
  brideInfo: PersonInfo
  groomInfo: PersonInfo
}

interface WeddingEvent {
  id: string
  eventName: string
  eventDate: string
  eventTime: string
  venueName: string
  venueAddress: string
  eventDescription: string
}

interface GalleryImage {
  id: string
  file_url: string
  file_name: string
  caption?: string
  display_order: number
  gallery_category: string
  section_type: string
}

interface ContentData {
  hero: HeroContent
  couple: CoupleContent
}

interface StylesData {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  fontFamily: string
}

interface ContentItem {
  section_type: string
  content_data: Record<string, unknown>
}

// Add RSVP Config interface
interface RSVPConfig {
  isEnabled: boolean;
  title: string;
  subtitle: string;
}

// Extended window interface for global functions
declare global {
  interface Window {
    refreshGalleryPreview?: () => void
  }
}

// Simple loading component
const SimpleLoading = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }
  
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
    </div>
  )
}

// Default content structure
const getDefaultContent = (): ContentData => ({
  hero: {
    brideName: '',
    groomName: '',
    weddingDate: '',
    welcomeMessage: '',
    heroImageUrl: ''
  },
  couple: {
    brideInfo: { 
      name: '', 
      description: '', 
      fatherName: '', 
      motherName: '',
      photoUrl: ''
    },
    groomInfo: { 
      name: '', 
      description: '', 
      fatherName: '', 
      motherName: '',
      photoUrl: ''
    }
  }
})

// Default styles
const getDefaultStyles = (): StylesData => ({
  primaryColor: '#2563eb',
  secondaryColor: '#7c3aed',
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, sans-serif'
})

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [project, setProject] = useState<WeddingProject | null>(null)
  const [content, setContent] = useState<ContentData>(getDefaultContent())
  const [styles, setStyles] = useState<StylesData>(getDefaultStyles())
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('content')

  // Add RSVP config state
  const [rsvpConfig, setRsvpConfig] = useState<RSVPConfig>({
    isEnabled: false,
    title: 'RSVP',
    subtitle: 'Please let us know if you\'ll be joining us for our special day!'
  })

  // Add subscription tier state
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'silver' | 'gold' | 'platinum'>('free')

  // REMOVED: Domain-related handlers

  const handleUpgrade = useCallback((targetTier: string) => {
    console.log(`Upgrade requested to: ${targetTier}`)
    // Redirect to upgrade page or show upgrade modal
    // Example: router.push(`/upgrade?plan=${targetTier}&project=${projectId}`)
    alert(`Upgrade to ${targetTier} plan to unlock this feature!`)
  }, [])

  // Function to refresh gallery images for preview - use useCallback for stability
  const refreshGalleryImages = useCallback(async () => {
    if (!projectId) return
    
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('project_id', projectId)
        .eq('section_type', 'gallery')
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error loading gallery images:', error)
        return
      }

      console.log('Gallery images loaded:', data?.length || 0)
      setGalleryImages(data || [])
    } catch (error) {
      console.error('Error in refreshGalleryImages:', error)
    }
  }, [projectId])

  // Make refreshGalleryImages available globally for components that need it
  useEffect(() => {
    window.refreshGalleryPreview = refreshGalleryImages
    return () => {
      delete window.refreshGalleryPreview
    }
  }, [refreshGalleryImages])

  // Load RSVP config when component mounts
  useEffect(() => {
    const loadRSVPConfig = async () => {
      if (!projectId) return;
      
      try {
        console.log('🔍 Loading RSVP config for project:', projectId);
        
        const { data, error } = await supabase
          .from('rsvp_config')
          .select('is_enabled, title, subtitle')
          .eq('project_id', projectId)
          .single();

        console.log('📊 RSVP config result:', { data, error });

        if (data) {
          const newConfig = {
            isEnabled: data.is_enabled,
            title: data.title || 'RSVP',
            subtitle: data.subtitle || 'Please let us know if you\'ll be joining us for our special day!'
          };
          console.log('✅ Setting RSVP config:', newConfig);
          setRsvpConfig(newConfig);
        } else {
          console.log('❌ No RSVP config found');
        }
      } catch (error) {
        console.error('💥 Error loading RSVP config:', error);
      }
    };

    loadRSVPConfig();
  }, [projectId]);

  // Load project subscription tier
  useEffect(() => {
    const loadProjectTier = async () => {
      if (!projectId) return;
      
      try {
        console.log('🔍 Loading project subscription tier for:', projectId);
        
        const { data, error } = await supabase
          .from('wedding_projects')
          .select('subscription_tier')
          .eq('id', projectId)
          .single();

        console.log('📊 Project tier result:', { data, error });

        if (data) {
          console.log('✅ Setting subscription tier:', data.subscription_tier);
          setSubscriptionTier(data.subscription_tier);
        }
      } catch (error) {
        console.error('💥 Error loading project tier:', error);
      }
    };

    loadProjectTier();
  }, [projectId]);

  // Main data loading effect
  useEffect(() => {
    const loadEditorData = async () => {
      if (!projectId) return
      
      try {
        setLoading(true)

        // Get current user
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
        if (userError || !authUser) {
          router.push('/auth/login')
          return
        }

        // Get user profile with subscription info
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id, email, full_name, current_subscription')
          .eq('id', authUser.id)
          .single()

        if (profileError) {
          console.error('Error loading user profile:', profileError)
        } else {
          // Create UserProfile object from the database data
          const userProfile: UserProfile = {
            id: profileData.id,
            email: profileData.email,
            full_name: profileData.full_name,
            current_subscription: profileData.current_subscription
          }
          setUser(userProfile)
          console.log('User subscription tier:', profileData.current_subscription)
        }

        // Get project details
        const { data: projectData, error: projectError } = await supabase
          .from('wedding_projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', authUser.id)
          .single()

        if (projectError || !projectData) {
          console.error('Project not found or unauthorized')
          router.push('/dashboard')
          return
        }

        setProject(projectData)

        // Load content
        const { data: contentData, error: contentError } = await supabase
          .from('wedding_content')
          .select('*')
          .eq('project_id', projectId)

        if (contentError) {
          console.error('Error loading content:', contentError)
        } else if (contentData && contentData.length > 0) {
          const processedContent: ContentData = getDefaultContent()
          let processedStyles: StylesData = getDefaultStyles()

          contentData.forEach((item: ContentItem) => {
            if (item.section_type === 'hero') {
              processedContent.hero = { ...processedContent.hero, ...item.content_data as Partial<HeroContent> }
            } else if (item.section_type === 'couple') {
              processedContent.couple = { ...processedContent.couple, ...item.content_data as Partial<CoupleContent> }
            } else if (item.section_type === 'styles') {
              processedStyles = { ...processedStyles, ...item.content_data as Partial<StylesData> }
            }
          })

          setContent(processedContent)
          setStyles(processedStyles)
        }

        // Load events
        const { data: eventsData, error: eventsError } = await supabase
          .from('wedding_events')
          .select('*')
          .eq('project_id', projectId)
          .order('display_order', { ascending: true })

        if (eventsError) {
          console.error('Error loading events:', eventsError)
        } else {
          const formattedEvents = eventsData?.map(event => ({
            id: event.id,
            eventName: event.event_name,
            eventDate: event.event_date,
            eventTime: event.event_time || '',
            venueName: event.venue_name || '',
            venueAddress: event.venue_address || '',
            eventDescription: event.event_description || ''
          })) || []
          setEvents(formattedEvents)
        }

        // Load gallery images
        await refreshGalleryImages()

      } catch (error) {
        console.error('Error loading editor data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEditorData()
  }, [projectId, router, refreshGalleryImages])

  // Helper functions for content updates
  const updateContent = (section: string, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof ContentData], [field]: value }
    }))
  }

  const updateNestedContent = (section: string, subsection: string, field: string, value: string) => {
    setContent(prev => {
      const sectionData = prev[section as keyof ContentData] as unknown as Record<string, unknown>;
      const subsectionData = sectionData[subsection] || {};
      
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [subsection]: { 
            ...subsectionData,
            [field]: value 
          }
        }
      };
    });
  }

  const updateEvents = (newEvents: WeddingEvent[]) => {
    setEvents(newEvents)
  }

  // Save content function
  const saveContent = async () => {
    if (!project) return
    
    try {
      setSaving(true)

      // Save content sections
      const contentSections = [
        { section_type: 'hero', content_data: content.hero },
        { section_type: 'couple', content_data: content.couple },
        { section_type: 'styles', content_data: styles }
      ]

      for (const section of contentSections) {
        const { error } = await supabase
          .from('wedding_content')
          .upsert({
            project_id: projectId,
            section_type: section.section_type,
            content_data: section.content_data,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'project_id,section_type'
          })

        if (error) {
          console.error(`Error saving ${section.section_type}:`, error)
          throw error
        }
      }

      // Save events
      // First, delete existing events
      await supabase
        .from('wedding_events')
        .delete()
        .eq('project_id', projectId)

      // Then insert new events
      if (events.length > 0) {
        const eventsData = events.map((event, index) => ({
          project_id: projectId,
          event_name: event.eventName,
          event_date: event.eventDate,
          event_time: event.eventTime,
          venue_name: event.venueName,
          venue_address: event.venueAddress,
          event_description: event.eventDescription,
          display_order: index
        }))

        const { error: eventsError } = await supabase
          .from('wedding_events')
          .insert(eventsData)

        if (eventsError) {
          console.error('Error saving events:', eventsError)
          throw eventsError
        }
      }

      console.log('Content saved successfully!')
    } catch (error) {
      console.error('Error saving content:', error)
    } finally {
      setSaving(false)
    }
  }

  // Publish project
  const publishProject = async () => {
    if (!project) return

    try {
      // Save first
      await saveContent()

      // Generate subdomain if it doesn't exist
      let subdomain = project.subdomain
      if (!subdomain) {
        const brideName = content.hero?.brideName?.toLowerCase().replace(/\s+/g, '-') || 'bride'
        const groomName = content.hero?.groomName?.toLowerCase().replace(/\s+/g, '-') || 'groom'
        const timestamp = Date.now().toString().slice(-6) // Last 6 digits
        subdomain = `${brideName}-${groomName}-${timestamp}`
      }

      // Then publish with subdomain
      const { error } = await supabase
        .from('wedding_projects')
        .update({
          is_published: true,
          subdomain: subdomain,
          published_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (error) throw error

      setProject({ ...project, is_published: true, subdomain })
      console.log('Project published successfully!', `URL: /${subdomain}`)
      
      // Show success message with URL
      alert(`Project published successfully! \nYour website is now live at: ${window.location.origin}/${subdomain}`)
    } catch (error) {
      console.error('Error publishing project:', error)
    }
  }

  // Handle navigation
  const handleBack = () => {
    router.push('/dashboard')
  }

  const handlePreview = () => {
    // Open preview in new tab (implement later)
    const previewUrl = `/preview/${projectId}`
    window.open(previewUrl, '_blank')
  }

  // Debug logging right before TemplatePreview
  console.log('🔍 Debug RSVP Preview Check:', {
    projectId: projectId,
    subscriptionTier: subscriptionTier,
    rsvpConfig: rsvpConfig,
    rsvpEnabled: rsvpConfig?.isEnabled,
    hasGoldOrPlatinum: subscriptionTier === 'gold' || subscriptionTier === 'platinum',
    shouldShowRSVP: rsvpConfig?.isEnabled && (subscriptionTier === 'gold' || subscriptionTier === 'platinum')
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <SimpleLoading size="lg" />
          <p className="ml-4 text-gray-600 mt-2">Loading editor...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <p className="text-gray-600 mt-2">The project you&apos;re looking for doesn&apos;t exist.</p>
          <button 
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <EditorHeader 
        project={project}
        saving={saving}
        onBack={handleBack}
        onSave={saveContent}
        onPreview={handlePreview}
        onPublish={publishProject}
      />

      {/* Main Content Area - Fixed Layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-full flex gap-6">
            {/* Editor Panel - Fixed Width */}
            <div className="w-80 flex flex-col bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Customize Your Website</h2>
                <p className="text-sm text-gray-600">Edit content and styling for your wedding website</p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                {/* UPDATED: Changed back to grid-cols-6 (removed domain tab) */}
                <TabsList className="grid w-full grid-cols-6 mx-4 mt-4">
                  <TabsTrigger value="content" className="flex flex-col items-center p-2 text-xs">
                    <Type className="h-3 w-3 mb-1" />
                    <span>Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex flex-col items-center p-2 text-xs">
                    <Calendar className="h-3 w-3 mb-1" />
                    <span>Events</span>
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="flex flex-col items-center p-2 text-xs">
                    <Images className="h-3 w-3 mb-1" />
                    <span>Gallery</span>
                  </TabsTrigger>
                  <TabsTrigger value="rsvp" className="flex flex-col items-center p-2 text-xs">
                    <Users className="h-3 w-3 mb-1" />
                    <span>RSVP</span>
                  </TabsTrigger>
                  <TabsTrigger value="wishes" className="flex flex-col items-center p-2 text-xs">
                    <MessageCircle className="h-3 w-3 mb-1" />
                    <span>Wishes</span>
                  </TabsTrigger>
                  {/* REMOVED: Domain Tab */}
                  <TabsTrigger value="style" className="flex flex-col items-center p-2 text-xs">
                    <Palette className="h-3 w-3 mb-1" />
                    <span>Style</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab Content - Scrollable */}
                <div className="flex-1 mt-4 overflow-y-auto">
                  <TabsContent value="content" className="mt-0 h-full">
                    <div className="space-y-4">
                      <ContentEditor 
                        projectId={projectId}
                        content={content}
                        onContentUpdate={updateContent}
                        onNestedContentUpdate={updateNestedContent}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="events" className="mt-0 h-full">
                    <div className="space-y-4">
                      <EventsEditor 
                        events={events}
                        onEventsUpdate={updateEvents}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="gallery" className="mt-0 h-full">
                    <div className="space-y-4">
                      <GalleryEditor 
                        projectId={projectId}
                        onGalleryUpdate={refreshGalleryImages}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="rsvp" className="mt-0 h-full">
                    <div className="space-y-4">
                      <RSVPEditor 
                        projectId={projectId}
                        subscriptionTier={user?.current_subscription || 'free'}
                        onUpgrade={handleUpgrade}
                        supabase={supabase}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="wishes" className="mt-0 h-full">
                    <div className="space-y-4">
                      <WishesEditor 
                        projectId={projectId}
                        userTier={user?.current_subscription || 'free'}
                        onUpgrade={handleUpgrade}
                      />
                    </div>
                  </TabsContent>

                  {/* REMOVED: Domain Tab Content */}

                  <TabsContent value="style" className="mt-0 h-full">
                    <div className="space-y-4">
                      <StyleEditor 
                        styles={styles}
                        onStyleUpdate={(field: string, value: string) => {
                          setStyles(prev => ({ ...prev, [field]: value }))
                        }}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Preview Panel - Flexible Width */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="h-12 flex items-center justify-between px-4 border-b bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
                <span className="text-xs text-green-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Real-time preview
                </span>
              </div>

              <div className="flex-1 overflow-auto">
                <TemplatePreview
                  content={content}
                  styles={styles}
                  events={events}
                  galleryImages={galleryImages}
                  userTier={subscriptionTier}
                  projectId={projectId}
                  rsvpConfig={rsvpConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}