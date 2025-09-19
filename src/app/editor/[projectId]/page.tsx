// File: src/app/editor/[projectId]/page.tsx - Updated without Domain Editor

'use client'


import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Monitor,
  Smartphone
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TemplatePreview } from '@/components/editor/TemplatePreview'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { type VenueLocation } from '@/components/editor/MapLocationEditor'
import { SetupWizard } from '@/components/editor/SetupWizard'
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

interface ScrollEffectsConfig {
  enabled: boolean
  animationType: 'disabled' | 'gentle' | 'normal' | 'energetic'
  backgroundPattern: 'none' | 'hearts' | 'floral' | 'geometric' | 'dots'
  parallaxIntensity: number
  showScrollProgress: boolean
  showScrollToTop: boolean
  staggerAnimations: boolean
  mobileAnimations: 'disabled' | 'reduced' | 'same'
}

interface SocialLinksConfig {
  isEnabled: boolean
  facebookUrl: string
  instagramUrl: string
  displayLocation: 'header' | 'footer' | 'section' | 'floating'
  callToAction: string
  iconStyle: 'colored' | 'monochrome' | 'outline'
  iconSize: 'small' | 'medium' | 'large'
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
  deadline?: string;
  confirmationMessage?: string;
  danceSongEnabled?: boolean;
  danceSongQuestion?: string;
  adviceEnabled?: boolean;
  adviceQuestion?: string;
  memoryEnabled?: boolean;
  memoryQuestion?: string;
}

// Add Background Music Config interface
interface BackgroundMusicConfig {
  id?: string
  projectId: string
  fileUrl: string
  fileName: string
  fileSize?: number
  duration?: number
  isPreset: boolean
  presetCategory?: string
  isEnabled: boolean
  volume: number
  autoPlay: boolean
  loopEnabled: boolean
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

// Default scroll effects
const getDefaultScrollEffects = (): ScrollEffectsConfig => ({
  enabled: true,
  animationType: 'normal',
  backgroundPattern: 'hearts',
  parallaxIntensity: 30,
  showScrollProgress: true,
  showScrollToTop: true,
  staggerAnimations: true,
  mobileAnimations: 'reduced'
})

// Default social links
const getDefaultSocialLinks = (): SocialLinksConfig => ({
  isEnabled: false,
  facebookUrl: '',
  instagramUrl: '',
  displayLocation: 'footer',
  callToAction: 'Follow Us',
  iconStyle: 'colored',
  iconSize: 'medium'
})

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [project, setProject] = useState<WeddingProject | null>(null)
  const [content, setContent] = useState<ContentData>(getDefaultContent())
  const [styles, setStyles] = useState<StylesData>(getDefaultStyles())
  const [scrollEffects, setScrollEffects] = useState<ScrollEffectsConfig>(getDefaultScrollEffects())
  const [socialLinks, setSocialLinks] = useState<SocialLinksConfig>(getDefaultSocialLinks())
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showWizard, setShowWizard] = useState(true)
  const [wizardMode, setWizardMode] = useState(true)

  // Preview mode state (desktop/mobile toggle)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  // Add RSVP config state
  const [rsvpConfig, setRsvpConfig] = useState<RSVPConfig>({
    isEnabled: false,
    title: 'RSVP',
    subtitle: 'Please let us know if you\'ll be joining us for our special day!',
    deadline: '',
    confirmationMessage: 'Thank you for your RSVP! We can\'t wait to celebrate with you.',
    danceSongEnabled: false,
    danceSongQuestion: 'What song will definitely get you on the dance floor?',
    adviceEnabled: false,
    adviceQuestion: 'Any advice for the newlyweds?',
    memoryEnabled: false,
    memoryQuestion: 'What\'s your favorite memory with the couple?'
  })

  // Add venue location state
  const [venueLocation, setVenueLocation] = useState<VenueLocation | null>(null)

  // Add background music state
  const [backgroundMusic, setBackgroundMusic] = useState<BackgroundMusicConfig | null>(null)

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
        .or('section_type.eq.gallery,section_type.like.gallery_%')
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

  // Auto-update hero images from gallery (support multiple for slider)
  useEffect(() => {
    const heroImages = galleryImages.filter(img => 
      img.gallery_category === 'hero' || 
      img.section_type === 'hero' ||
      img.section_type === 'gallery_hero'
    ).sort((a, b) => a.display_order - b.display_order)
    
    console.log('🖼️ Found hero images:', heroImages.length, heroImages.map(img => img.file_url))
    
    // Update content with hero images array
    const heroImageUrls = heroImages.map(img => img.file_url)
    const currentHeroUrls = content.hero?.heroImageUrls || []
    
    // Check if hero images have changed
    const hasChanged = JSON.stringify(heroImageUrls) !== JSON.stringify(currentHeroUrls)
    
    if (hasChanged) {
      console.log('✅ Auto-updating hero images from gallery:', heroImageUrls)
      setContent(prev => ({
        ...prev,
        hero: {
          ...prev.hero,
          heroImageUrl: heroImageUrls[0], // Keep single URL for backward compatibility
          heroImageUrls: heroImageUrls
        }
      }))
    }
  }, [galleryImages, content.hero?.heroImageUrls])

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
            subtitle: data.subtitle || 'Please let us know if you\'ll be joining us for our special day!',
            deadline: data.deadline_date || '',
            confirmationMessage: data.confirmation_message || 'Thank you for your RSVP! We can\'t wait to celebrate with you.',
            danceSongEnabled: data.dance_song_enabled || false,
            danceSongQuestion: data.dance_song_question || 'What song will definitely get you on the dance floor?',
            adviceEnabled: data.advice_enabled || false,
            adviceQuestion: data.advice_question || 'Any advice for the newlyweds?',
            memoryEnabled: data.memory_enabled || false,
            memoryQuestion: data.memory_question || 'What\'s your favorite memory with the couple?'
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

  // Function to save RSVP config to database
  const saveRSVPConfig = async (config: RSVPConfig) => {
    if (!projectId) {
      console.error('❌ No projectId available for saving RSVP config');
      return;
    }

    try {
      console.log('💾 Attempting to save RSVP config...');
      console.log('📋 Project ID:', projectId);
      console.log('📋 Config:', config);

      const configData = {
        project_id: projectId,
        is_enabled: config.isEnabled,
        title: config.title,
        subtitle: config.subtitle,
        deadline_date: config.deadline || null,
        confirmation_message: config.confirmationMessage,
        dance_song_enabled: config.danceSongEnabled,
        dance_song_question: config.danceSongQuestion,
        advice_enabled: config.adviceEnabled,
        advice_question: config.adviceQuestion,
        memory_enabled: config.memoryEnabled,
        memory_question: config.memoryQuestion,
        updated_at: new Date().toISOString()
      };

      console.log('📋 Database payload:', configData);

      // Use upsert to handle both insert and update cases
      const { data, error } = await supabase
        .from('rsvp_config')
        .upsert(configData, {
          onConflict: 'project_id'
        })
        .select();

      if (error) {
        console.error('❌ Database error saving RSVP config:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ RSVP config saved successfully to database');
      console.log('✅ Saved data:', data);

    } catch (error) {
      console.error('💥 Unexpected error saving RSVP config:', error);
      // Show user-friendly error
      alert('Failed to save RSVP configuration. Please try again.');
    }
  };

  // Function to save scroll effects config to database
  const saveScrollEffectsConfig = async (config: ScrollEffectsConfig) => {
    if (!projectId) {
      console.error('❌ No projectId available for saving scroll effects config');
      return;
    }

    try {
      console.log('💾 Attempting to save scroll effects config...');
      console.log('📋 Project ID:', projectId);
      console.log('📋 Config:', config);

      const { error: scrollEffectsError } = await supabase
        .from('scroll_effects')
        .upsert({
          project_id: projectId,
          enabled: config.enabled,
          animation_type: config.animationType,
          background_pattern: config.backgroundPattern,
          parallax_intensity: config.parallaxIntensity,
          show_scroll_progress: config.showScrollProgress,
          show_scroll_to_top: config.showScrollToTop,
          stagger_animations: config.staggerAnimations,
          mobile_animations: config.mobileAnimations,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'project_id'
        });

      if (scrollEffectsError) {
        console.error('❌ Error saving scroll effects:', scrollEffectsError);
        throw scrollEffectsError;
      } else {
        console.log('✅ Scroll effects saved successfully to database');
      }

    } catch (error) {
      console.error('💥 Unexpected error saving scroll effects:', error);
      // Show user-friendly error
      alert('Failed to save scroll effects configuration. Please try again.');
    }
  };

  // Function to save social links config to database
  const saveSocialLinksConfig = async (config: SocialLinksConfig) => {
    if (!projectId) {
      console.error('❌ No projectId available for saving social links config');
      return;
    }

    try {
      console.log('💾 Attempting to save social links config...');
      console.log('📋 Project ID:', projectId);
      console.log('📋 Config:', config);

      const { error: socialLinksError } = await supabase
        .from('social_links')
        .upsert({
          project_id: projectId,
          is_enabled: config.isEnabled,
          facebook_url: config.facebookUrl || null,
          instagram_url: config.instagramUrl || null,
          display_location: config.displayLocation,
          call_to_action: config.callToAction,
          icon_style: config.iconStyle,
          icon_size: config.iconSize,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'project_id'
        });

      if (socialLinksError) {
        console.error('❌ Error saving social links:', socialLinksError);
        throw socialLinksError;
      } else {
        console.log('✅ Social links saved successfully to database');
      }

    } catch (error) {
      console.error('💥 Unexpected error saving social links:', error);
      // Show user-friendly error
      alert('Failed to save social links configuration. Please try again.');
    }
  };

  // Function to save background music config to database
  const saveBackgroundMusicConfig = async (config: BackgroundMusicConfig | null) => {
    if (!projectId) {
      console.error('❌ No projectId available for saving background music config');
      return;
    }

    try {
      console.log('💾 Attempting to save background music config...');
      console.log('📋 Project ID:', projectId);
      console.log('📋 Config:', config);

      if (config === null) {
        // Delete existing background music
        const { error } = await supabase
          .from('background_music')
          .delete()
          .eq('project_id', projectId);

        if (error) {
          console.error('❌ Error deleting background music:', error);
          throw error;
        } else {
          console.log('✅ Background music deleted successfully');
        }
      } else {
        // Upsert background music config
        const { error: musicError } = await supabase
          .from('background_music')
          .upsert({
            project_id: projectId,
            file_url: config.fileUrl,
            file_name: config.fileName,
            file_size: config.fileSize || null,
            duration: config.duration || null,
            is_preset: config.isPreset,
            preset_category: config.presetCategory || null,
            is_enabled: config.isEnabled,
            volume: config.volume,
            auto_play: config.autoPlay,
            loop_enabled: config.loopEnabled,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'project_id'
          });

        if (musicError) {
          console.error('❌ Error saving background music:', musicError);
          throw musicError;
        } else {
          console.log('✅ Background music saved successfully to database');
        }
      }

    } catch (error) {
      console.error('💥 Unexpected error saving background music:', error);
      alert('Failed to save background music configuration. Please try again.');
    }
  };

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

        // Load scroll effects
        const { data: scrollEffectsData, error: scrollEffectsError } = await supabase
          .from('scroll_effects')
          .select('*')
          .eq('project_id', projectId)
          .single()

        if (scrollEffectsError && scrollEffectsError.code !== 'PGRST116') {
          console.error('Error loading scroll effects:', scrollEffectsError)
        } else if (scrollEffectsData) {
          setScrollEffects({
            enabled: scrollEffectsData.enabled,
            animationType: scrollEffectsData.animation_type,
            backgroundPattern: scrollEffectsData.background_pattern,
            parallaxIntensity: scrollEffectsData.parallax_intensity,
            showScrollProgress: scrollEffectsData.show_scroll_progress,
            showScrollToTop: scrollEffectsData.show_scroll_to_top,
            staggerAnimations: scrollEffectsData.stagger_animations,
            mobileAnimations: scrollEffectsData.mobile_animations
          })
        }

        // Load social links
        const { data: socialLinksData, error: socialLinksError } = await supabase
          .from('social_links')
          .select('*')
          .eq('project_id', projectId)
          .single()

        if (socialLinksError && socialLinksError.code !== 'PGRST116') {
          console.error('Error loading social links:', socialLinksError)
        } else if (socialLinksData) {
          setSocialLinks({
            isEnabled: socialLinksData.is_enabled,
            facebookUrl: socialLinksData.facebook_url || '',
            instagramUrl: socialLinksData.instagram_url || '',
            displayLocation: socialLinksData.display_location,
            callToAction: socialLinksData.call_to_action,
            iconStyle: socialLinksData.icon_style,
            iconSize: socialLinksData.icon_size
          })
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

        // Load venue location
        const { data: venueData, error: venueError } = await supabase
          .from('venue_locations')
          .select('*')
          .eq('project_id', projectId)
          .single()

        if (venueError) {
          console.log('No venue location found or error loading:', venueError)
        } else if (venueData) {
          const venue: VenueLocation = {
            venueName: venueData.venue_name,
            address: venueData.address,
            latitude: venueData.latitude,
            longitude: venueData.longitude,
            description: venueData.description,
            showDirections: venueData.show_directions
          }
          setVenueLocation(venue)
        }

        // Load background music
        const { data: musicData, error: musicError } = await supabase
          .from('background_music')
          .select('*')
          .eq('project_id', projectId)
          .single()

        if (musicError && musicError.code !== 'PGRST116') {
          console.error('Error loading background music:', musicError)
        } else if (musicData) {
          const musicConfig: BackgroundMusicConfig = {
            id: musicData.id,
            projectId: musicData.project_id,
            fileUrl: musicData.file_url,
            fileName: musicData.file_name,
            fileSize: musicData.file_size,
            duration: musicData.duration,
            isPreset: musicData.is_preset,
            presetCategory: musicData.preset_category,
            isEnabled: musicData.is_enabled,
            volume: musicData.volume,
            autoPlay: musicData.auto_play,
            loopEnabled: musicData.loop_enabled
          }
          setBackgroundMusic(musicConfig)
        }

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

      // Save venue location
      if (venueLocation) {
        console.log('🗺️ Saving venue location:', venueLocation)
        const { error: venueError } = await supabase
          .from('venue_locations')
          .upsert({
            project_id: projectId,
            venue_name: venueLocation.venueName,
            address: venueLocation.address,
            latitude: venueLocation.latitude,
            longitude: venueLocation.longitude,
            description: venueLocation.description,
            show_directions: venueLocation.showDirections,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'project_id'
          })

        if (venueError) {
          console.error('❌ Error saving venue location:', venueError)
          throw venueError
        } else {
          console.log('✅ Venue location saved successfully')
        }
      } else {
        // Delete venue location if null
        console.log('🗑️ Deleting venue location (set to null)')
        await supabase
          .from('venue_locations')
          .delete()
          .eq('project_id', projectId)
      }

      // Save scroll effects
      const { error: scrollEffectsError } = await supabase
        .from('scroll_effects')
        .upsert({
          project_id: projectId,
          enabled: scrollEffects.enabled,
          animation_type: scrollEffects.animationType,
          background_pattern: scrollEffects.backgroundPattern,
          parallax_intensity: scrollEffects.parallaxIntensity,
          show_scroll_progress: scrollEffects.showScrollProgress,
          show_scroll_to_top: scrollEffects.showScrollToTop,
          stagger_animations: scrollEffects.staggerAnimations,
          mobile_animations: scrollEffects.mobileAnimations,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'project_id'
        })

      if (scrollEffectsError) {
        console.error('❌ Error saving scroll effects:', scrollEffectsError)
        throw scrollEffectsError
      } else {
        console.log('✅ Scroll effects saved successfully')
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

  const handleWizardStepSelect = (tabValue: string) => {
    // Simple placeholder for step selection
    console.log('Step selected:', tabValue)
  }

  const handleWizardComplete = () => {
    setWizardMode(false)
    setShowWizard(false)
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
    <>
      {/* Global styles for mobile preview */}
      <style jsx global>{`
        .mobile-viewport .grid {
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
        }
        .mobile-viewport .lg\\:grid-cols-2 {
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
        }
        .mobile-viewport .md\\:grid-cols-2 {
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
        }
        .mobile-viewport .flex.lg\\:flex-row {
          flex-direction: column !important;
        }
        .mobile-viewport .md\\:flex-row {
          flex-direction: column !important;
        }
      `}</style>

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
        <div className="w-full px-2 sm:px-4 py-6">
          <div className="h-full flex gap-4">
            {/* Editor Panel - Increased Width */}
            <div className={`${wizardMode ? 'w-[500px]' : 'w-96'} flex flex-col bg-white rounded-lg shadow-sm border`}>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Setup Guide
                    </h2>
                    <p className="text-sm text-gray-600">
                      Follow the guided setup to create your wedding website
                    </p>
                  </div>
                </div>
              </div>

              {/* Setup Wizard Content */}
              <div className="flex-1 p-3 overflow-y-auto">
                  <SetupWizard
                    onStepSelect={handleWizardStepSelect}
                    onWizardComplete={handleWizardComplete}
                    currentContent={content}
                    currentStyles={styles}
                    scrollEffects={scrollEffects}
                    socialLinks={socialLinks}
                    events={events}
                    galleryImages={galleryImages}
                    venueLocation={venueLocation}
                    rsvpConfig={rsvpConfig}
                    backgroundMusic={backgroundMusic}
                    onContentUpdate={updateContent}
                    onNestedContentUpdate={updateNestedContent}
                    onStyleUpdate={(field: string, value: string) => {
                      setStyles(prev => ({ ...prev, [field]: value }))
                    }}
                    onScrollEffectsUpdate={async (newConfig) => {
                      console.log('📝 Editor: Receiving scroll effects update:', newConfig)
                      setScrollEffects(newConfig)
                      await saveScrollEffectsConfig(newConfig)
                    }}
                    onSocialLinksUpdate={async (newConfig) => {
                      console.log('📝 Editor: Receiving social links update:', newConfig)
                      setSocialLinks(newConfig)
                      await saveSocialLinksConfig(newConfig)
                    }}
                    onEventsUpdate={updateEvents}
                    onVenueUpdate={setVenueLocation}
                    onGalleryUpdate={refreshGalleryImages}
                    projectId={projectId}
                    onRSVPUpdate={async (config) => {
                      setRsvpConfig(config);
                      await saveRSVPConfig(config);
                    }}
                    onBackgroundMusicUpdate={async (config) => {
                      setBackgroundMusic(config)
                      await saveBackgroundMusicConfig(config)
                    }}
                    userTier={subscriptionTier}
                  />
              </div>
            </div>

            {/* Preview Panel - Flexible Width */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
              <div className="h-12 flex items-center justify-between px-4 border-b bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
                <span className="text-xs text-green-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Real-time preview
                </span>
              </div>

              {/* Desktop/Mobile Toggle */}
              <div className="px-4 py-3 border-b bg-gray-50/50">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      previewMode === 'desktop'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      previewMode === 'mobile'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </button>
                </div>
              </div>

              {/* Preview Container */}
              <div className="flex-1 overflow-auto bg-gray-100">
                {previewMode === 'desktop' ? (
                  /* Desktop Preview - Full Width */
                  <div className="w-full h-full">
                    <TemplatePreview
                      content={content}
                      styles={styles}
                      events={events}
                      galleryImages={galleryImages}
                      userTier={subscriptionTier}
                      projectId={projectId}
                      rsvpConfig={rsvpConfig}
                      venueLocation={venueLocation}
                      backgroundMusic={backgroundMusic}
                    />
                  </div>
                ) : (
                  /* Mobile Preview - iPhone Container with Internal Scrolling */
                  <div className="flex items-start justify-center py-4 h-full">
                    <div className="w-[393px] h-[852px] bg-white shadow-xl rounded-[2.5rem] overflow-hidden border-8 border-gray-800 relative">
                      {/* iPhone Notch */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-10"></div>

                      {/* Mobile Content Container - Scrollable */}
                      <div className="w-full h-full overflow-y-auto overflow-x-hidden mobile-viewport">
                        <TemplatePreview
                          content={content}
                          styles={styles}
                          events={events}
                          galleryImages={galleryImages}
                          userTier={subscriptionTier}
                          projectId={projectId}
                          rsvpConfig={rsvpConfig}
                          venueLocation={venueLocation}
                          backgroundMusic={backgroundMusic}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}