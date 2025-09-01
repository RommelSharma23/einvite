// File: src/app/[subdomain]/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { WeddingHeader } from '@/components/wedding/WeddingHeader'
import { WeddingHero } from '@/components/wedding/WeddingHero'
import { WeddingEvents } from '@/components/wedding/WeddingEvents'
import { WeddingGallery } from '@/components/wedding/WeddingGallery'
import { WeddingCouple } from '@/components/wedding/WeddingCouple'
import { WeddingWishes } from '@/components/wedding/WeddingWishes'
import { WeddingFooter } from '@/components/wedding/WeddingFooter'
import dynamic from 'next/dynamic'
import type { VenueLocation } from '@/components/wedding/WeddingMapLocation'

// Dynamically import the map component to prevent SSR issues
const WeddingMapLocation = dynamic(
  () => import('@/components/wedding/WeddingMapLocation').then(mod => ({ default: mod.WeddingMapLocation })),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-lg mb-6">
            <div className="h-8 w-8 animate-pulse bg-gray-300 rounded-full" />
          </div>
          <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mx-auto mb-4" />
          <div className="h-4 w-96 bg-gray-200 animate-pulse rounded mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }
)
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
  custom_domain?: string
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

// Enhanced Scroll Animation Hook with Elegant Effects
function useScrollAnimation() {
  const [activeSection, setActiveSection] = useState('hero')
  
  useEffect(() => {
    // Navigation observer
    const navObserverOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    }

    const navObserverCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    // Animation observer for scroll effects
    const animObserverOptions = {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1
    }

    const animObserverCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add different animations based on element class
          if (entry.target.classList.contains('fade-slide-up')) {
            entry.target.classList.add('animate-fade-slide-up')
          }
          if (entry.target.classList.contains('stagger-container')) {
            entry.target.classList.add('animate-stagger')
          }
          if (entry.target.classList.contains('float-up')) {
            entry.target.classList.add('animate-float-up')
          }
          if (entry.target.classList.contains('counter-animate')) {
            entry.target.classList.add('animate-counter')
          }
        }
      })
    }

    const navObserver = new IntersectionObserver(navObserverCallback, navObserverOptions)
    const animObserver = new IntersectionObserver(animObserverCallback, animObserverOptions)
    
    // Observe sections for navigation
    const sections = document.querySelectorAll('section[id]')
    sections.forEach((section) => navObserver.observe(section))

    // Observe elements for animations
    const animElements = document.querySelectorAll('.fade-slide-up, .stagger-container, .float-up, .counter-animate')
    animElements.forEach((element) => animObserver.observe(element))

    return () => {
      navObserver.disconnect()
      animObserver.disconnect()
    }
  }, [])

  return activeSection
}

// Parallax Effect Hook
function useParallax() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return offset
}

// Smooth Scroll Function
const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId)
  if (element) {
    const headerOffset = 80 // Account for fixed header
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    const offsetPosition = elementPosition - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

export default function PublishedWebsitePage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  
  const [project, setProject] = useState<WeddingProject | null>(null)
  const [projectOwner, setProjectOwner] = useState<UserProfile | null>(null)
  const [content, setContent] = useState<ContentData>({})
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [venueLocation, setVenueLocation] = useState<VenueLocation | null>(null)
  const [styles, setStyles] = useState<StylesData>({
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, sans-serif'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCustomDomain, setIsCustomDomain] = useState(false)
  const [currentDomain, setCurrentDomain] = useState('')

  // Modern scrolling hooks
  const activeSection = useScrollAnimation()
  const scrollOffset = useParallax()
  
  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Enhanced function to get project by custom domain or subdomain
  const getProjectByDomainOrSubdomain = async (domain: string, subdomainParam: string) => {
    try {
      console.log('Fetching project for:', { domain, subdomainParam })

      // Check if we're on a custom domain (not the main app domains)
      const isMainDomain = domain === 'einvite.onrender.com' || 
                          domain === 'localhost:3000' || 
                          domain === 'localhost' ||
                          domain.includes('einvite')

      // First, try to find by custom domain if not main domain
      if (!isMainDomain && domain) {
        console.log('Searching for custom domain:', domain)
        
        const { data: projectByDomain, error: domainError } = await supabase
          .from('wedding_projects')
          .select('*')
          .eq('custom_domain', domain)
          .eq('is_published', true)
          .single()

        if (!domainError && projectByDomain) {
          console.log('Found project by custom domain:', projectByDomain)
          setIsCustomDomain(true)
          return projectByDomain
        } else {
          console.log('No project found for custom domain:', domain, domainError?.message)
        }
      }

      // If not found by custom domain or is main domain, try subdomain
      if (subdomainParam) {
        console.log('Searching for subdomain:', subdomainParam)
        
        const { data: projectBySubdomain, error: subdomainError } = await supabase
          .from('wedding_projects')
          .select('*')
          .eq('subdomain', subdomainParam)
          .eq('is_published', true)
          .single()

        if (!subdomainError && projectBySubdomain) {
          console.log('Found project by subdomain:', projectBySubdomain)
          setIsCustomDomain(false)
          return projectBySubdomain
        } else {
          console.log('No project found for subdomain:', subdomainParam, subdomainError?.message)
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching project:', error)
      return null
    }
  }

  // Function to update page title and meta tags for custom domains
  const updatePageMetadata = (projectData: WeddingProject, contentData: ContentData, domain: string) => {
    if (typeof document === 'undefined') return

    const brideName = contentData.hero?.brideName || 'Bride'
    const groomName = contentData.hero?.groomName || 'Groom'
    const title = `${brideName} & ${groomName} - Wedding Invitation`

    // Update page title
    document.title = title

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', `Join us for the wedding celebration of ${brideName} and ${groomName}`)
    }

    // Update canonical URL for custom domains
    if (isCustomDomain) {
      let canonicalLink = document.querySelector('link[rel="canonical"]')
      if (!canonicalLink) {
        canonicalLink = document.createElement('link')
        canonicalLink.setAttribute('rel', 'canonical')
        document.head.appendChild(canonicalLink)
      }
      canonicalLink.setAttribute('href', `https://${domain}`)
    }
  }

  useEffect(() => {
    const loadPublishedWebsite = async () => {
      try {
        setLoading(true)

        // Get the current domain and subdomain
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : ''
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
        
        setCurrentDomain(currentDomain)

        console.log('Loading website for:', { 
          currentDomain, 
          subdomain, 
          currentPath,
          fullURL: typeof window !== 'undefined' ? window.location.href : ''
        })

        // Try to get project by domain first, then by subdomain
        const projectData = await getProjectByDomainOrSubdomain(currentDomain, subdomain)

        if (!projectData) {
          console.error('No project found for domain/subdomain')
          setError('Wedding website not found or not published yet. Please check the URL.')
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
          
          // Update page metadata after content is loaded
          updatePageMetadata(projectData, processedContent, currentDomain)
        }

        setEvents(eventsData || [])
        setGalleryImages(galleryData || [])

        // Load venue location
        console.log('🗺️ Loading venue location for project:', projectData.id)
        const { data: venueData, error: venueError } = await supabase
          .from('venue_locations')
          .select('*')
          .eq('project_id', projectData.id)
          .single()

        console.log('🗺️ Venue query result:', { venueData, venueError })

        if (venueError) {
          if (venueError.code === 'PGRST116') {
            console.log('📍 No venue location set for this project yet')
          } else {
            console.error('❌ Error loading venue location:', venueError)
          }
        } else if (venueData) {
          const venue: VenueLocation = {
            venueName: venueData.venue_name,
            address: venueData.address,
            latitude: venueData.latitude,
            longitude: venueData.longitude,
            description: venueData.description,
            showDirections: venueData.show_directions
          }
          console.log('✅ Venue location loaded:', venue)
          setVenueLocation(venue)
        }

        // Debug logging for RSVP
        console.log('RSVP Debug:', {
          projectId: projectData.id,
          projectTier: projectData.subscription_tier,
          ownerTier: ownerData?.current_subscription,
          shouldShowRSVP: ['gold', 'platinum'].includes(projectData.subscription_tier) || ['gold', 'platinum'].includes(ownerData?.current_subscription || 'free')
        })

        console.log('Custom Domain Status:', {
          isCustomDomain,
          currentDomain,
          projectCustomDomain: projectData.custom_domain
        })

      } catch (error) {
        console.error('Error loading published website:', error)
        setError('Failed to load wedding website. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    // Load website on component mount
    loadPublishedWebsite()
  }, [subdomain])

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 400)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Add modern scrolling CSS styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }

      /* Elegant Wedding Scroll Animations */
      @keyframes fadeSlideUp {
        from {
          opacity: 0;
          transform: translateY(40px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes floatUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes gentleScale {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes counterUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Animation Classes - Content always visible */
      .fade-slide-up {
        opacity: 1;
        transform: none;
      }

      .animate-fade-slide-up {
        animation: fadeSlideUp 0.8s ease-out forwards;
      }

      .float-up {
        opacity: 1;
        transform: none;
      }

      .animate-float-up {
        animation: floatUp 1s ease-out forwards;
      }

      .counter-animate {
        opacity: 1;
        transform: none;
      }

      .animate-counter {
        animation: counterUp 0.6s ease-out forwards;
      }

      /* Stagger Container - Content always visible */
      .stagger-container {
        opacity: 1;
      }

      .stagger-container > * {
        opacity: 1;
        transform: none;
      }

      /* Optional: Gentle stagger animation when triggered */
      .stagger-container.animate-stagger > * {
        animation: fadeSlideUp 0.8s ease-out forwards;
      }

      .stagger-container.animate-stagger > *:nth-child(1) { animation-delay: 0.1s; }
      .stagger-container.animate-stagger > *:nth-child(2) { animation-delay: 0.2s; }
      .stagger-container.animate-stagger > *:nth-child(3) { animation-delay: 0.3s; }
      .stagger-container.animate-stagger > *:nth-child(4) { animation-delay: 0.4s; }
      .stagger-container.animate-stagger > *:nth-child(5) { animation-delay: 0.5s; }
      .stagger-container.animate-stagger > *:nth-child(6) { animation-delay: 0.6s; }

      /* Gentle hover effects */
      .hover-float:hover {
        transform: translateY(-5px);
        transition: transform 0.3s ease;
      }

      /* Parallax elements */
      .parallax-bg {
        will-change: transform;
      }

      /* Scroll to top button */
      .scroll-to-top {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 50;
        background: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to));
        --tw-gradient-from: ${styles.primaryColor};
        --tw-gradient-to: ${styles.secondaryColor};
        color: white;
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transform: translateY(20px) scale(0.8);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .scroll-to-top.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .scroll-to-top:hover {
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
      }

      .scroll-to-top:active {
        transform: translateY(-2px) scale(0.95);
      }

      /* Modern card hover effects */
      .modern-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 16px;
        backdrop-filter: blur(10px);
      }

      .modern-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      }

      /* Progress bar for scroll */
      .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        width: var(--scroll-progress, 0%);
        height: 3px;
        background: linear-gradient(90deg, ${styles.primaryColor}, ${styles.secondaryColor});
        z-index: 100;
        transition: width 0.1s ease-out;
      }

      /* Stagger animation for child elements - only when in view */
      .stagger-children.animate-slide-in-up > * {
        opacity: 0;
        transform: translateY(30px);
        animation: slideInUp 0.8s ease-out forwards;
      }

      .stagger-children.animate-slide-in-up > *:nth-child(1) { animation-delay: 0.1s; }
      .stagger-children.animate-slide-in-up > *:nth-child(2) { animation-delay: 0.2s; }
      .stagger-children.animate-slide-in-up > *:nth-child(3) { animation-delay: 0.3s; }
      .stagger-children.animate-slide-in-up > *:nth-child(4) { animation-delay: 0.4s; }
      .stagger-children.animate-slide-in-up > *:nth-child(5) { animation-delay: 0.5s; }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
      }

      ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, ${styles.primaryColor}, ${styles.secondaryColor});
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, ${styles.secondaryColor}, ${styles.primaryColor});
      }

      /* Wedding Background Patterns */
      .wedding-pattern-bg {
        position: relative;
        overflow: hidden;
      }

      .wedding-pattern-bg::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          radial-gradient(circle at 25% 25%, ${styles.primaryColor}50 3px, transparent 3px),
          radial-gradient(circle at 75% 75%, ${styles.secondaryColor}40 2px, transparent 2px),
          radial-gradient(circle at 50% 50%, ${styles.primaryColor}20 1px, transparent 1px);
        background-size: 80px 80px, 120px 120px, 60px 60px;
        animation: patternFloat 20s ease-in-out infinite;
        z-index: 0;
      }

      .wedding-pattern-bg > * {
        position: relative;
        z-index: 1;
      }

      @keyframes patternFloat {
        0%, 100% { transform: translateX(0) translateY(0); }
        25% { transform: translateX(10px) translateY(-5px); }
        50% { transform: translateX(-5px) translateY(10px); }
        75% { transform: translateX(-10px) translateY(-5px); }
      }

      /* Floral Background Pattern */
      .floral-pattern-bg {
        position: relative;
      }

      .floral-pattern-bg::before {
        content: '✿ ❀ ❃ ❁ ✾ ✿ ❀ ❃ ❁ ✾ ✿ ❀ ❃ ❁ ✾';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, ${styles.primaryColor}40, ${styles.secondaryColor}40, ${styles.primaryColor}40);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-size: 3rem;
        line-height: 3;
        word-spacing: 4rem;
        white-space: pre-wrap;
        overflow: hidden;
        animation: floralFloat 25s linear infinite;
        z-index: 0;
        pointer-events: none;
      }

      .floral-pattern-bg > * {
        position: relative;
        z-index: 1;
      }

      @keyframes floralFloat {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      /* Hearts Background */
      .hearts-pattern-bg {
        position: relative;
      }

      .hearts-pattern-bg::after {
        content: '♥ ♡ ❤ ♥ ♡ ❤ ♥ ♡ ❤ ♥ ♡ ❤ ♥ ♡ ❤ ♥ ♡ ❤';
        position: absolute;
        top: 10%;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, ${styles.primaryColor}30, ${styles.secondaryColor}30, ${styles.primaryColor}30);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-size: 2rem;
        line-height: 2.5;
        word-spacing: 3rem;
        white-space: pre-wrap;
        animation: heartsFloat 30s ease-in-out infinite;
        z-index: 0;
        pointer-events: none;
      }

      .hearts-pattern-bg > * {
        position: relative;
        z-index: 1;
      }

      @keyframes heartsFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }

      /* Geometric Wedding Pattern */
      .geometric-pattern-bg {
        position: relative;
      }

      .geometric-pattern-bg::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          linear-gradient(45deg, ${styles.primaryColor}30 25%, transparent 25%),
          linear-gradient(-45deg, ${styles.secondaryColor}25 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, ${styles.primaryColor}15 75%),
          linear-gradient(-45deg, transparent 75%, ${styles.secondaryColor}20 75%);
        background-size: 60px 60px;
        background-position: 0 0, 0 30px, 30px -30px, -30px 0px;
        animation: geometricMove 15s ease-in-out infinite;
        z-index: 0;
      }

      .geometric-pattern-bg > * {
        position: relative;
        z-index: 1;
      }

      @keyframes geometricMove {
        0%, 100% { background-position: 0 0, 0 50px, 50px -50px, -50px 0px; }
        50% { background-position: 25px 25px, 25px 75px, 75px -25px, -25px 25px; }
      }
    `
    document.head.appendChild(style)

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [styles.primaryColor, styles.secondaryColor])

  // Update scroll progress
  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100
      document.documentElement.style.setProperty('--scroll-progress', `${scrollPercent}%`)
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollProgress)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

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
      {/* Scroll progress bar */}
      <div className="scroll-progress" />


      {/* Header Navigation */}
      <WeddingHeader
        brideName={content.hero?.brideName}
        groomName={content.hero?.groomName}
        primaryColor={styles.primaryColor}
        hasEvents={events.length > 0}
        hasVenue={!!venueLocation}
        hasGallery={galleryImages.length > 0}
        hasWishes={['gold', 'platinum'].includes(projectOwner.current_subscription)}
        hasRSVP={shouldShowRSVP}
        activeSection={activeSection}
        onNavigate={smoothScrollTo}
      />

      {/* Hero Section with Subtle Parallax */}
      <section id="hero" className="relative overflow-hidden hearts-pattern-bg">
        <div 
          className="parallax-bg"
          style={{
            transform: `translateY(${scrollOffset * 0.3}px)`,
          }}
        >
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
        </div>
      </section>

      {/* Events Section - Only render if events exist */}
      {events.length > 0 && (
        <section id="events" className="py-16 bg-white fade-slide-up wedding-pattern-bg">
          <div className="stagger-container">
            <WeddingEvents
              events={events}
              primaryColor={styles.primaryColor}
              secondaryColor={styles.secondaryColor}
              fontFamily={styles.fontFamily}
            />
          </div>
        </section>
      )}

      {/* Gallery Section - Only render if images exist */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-16 bg-gray-50 modern-card fade-slide-up floral-pattern-bg">
          <div className="stagger-container">
            <WeddingGallery
              images={galleryImages}
              primaryColor={styles.primaryColor}
              secondaryColor={styles.secondaryColor}
              fontFamily={styles.fontFamily}
              brideName={content.hero?.brideName}
              groomName={content.hero?.groomName}
            />
          </div>
        </section>
      )}

      {/* RSVP Section - Only render if Gold/Platinum tier */}
      {shouldShowRSVP && (
        <section id="rsvp" className="py-16 bg-gradient-to-br from-blue-50 to-purple-50 fade-slide-up wedding-pattern-bg">
          <div className="container mx-auto px-4">
            <div className="modern-card bg-white/80 backdrop-blur-sm p-8 rounded-2xl float-up hover-float">
              <RSVPForm 
                projectId={project.id}
                supabase={supabase}
                onSubmitSuccess={() => {
                  console.log('RSVP submitted successfully for project:', project.id)
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Couple Section */}
      <section id="couple" className="py-16 bg-white fade-slide-up hearts-pattern-bg">
        <div className="float-up hover-float">
          <WeddingCouple
            couple={content.couple || {}}
            primaryColor={styles.primaryColor}
            secondaryColor={styles.secondaryColor}
            fontFamily={styles.fontFamily}
          />
        </div>
      </section>

      {/* Guest Wishes Section - Only render if Gold/Platinum tier */}
      {['gold', 'platinum'].includes(projectOwner.current_subscription) && (
        <section id="wishes" className="py-16 bg-gradient-to-br from-purple-50 to-pink-50 fade-slide-up geometric-pattern-bg">
          <div className="modern-card bg-white/60 backdrop-blur-sm mx-4 rounded-2xl p-8 float-up hover-float">
            <WeddingWishes
              projectId={project.id}
              primaryColor={styles.primaryColor}
              secondaryColor={styles.secondaryColor}
              fontFamily={styles.fontFamily}
              brideName={content.hero?.brideName}
              groomName={content.hero?.groomName}
              userTier={projectOwner.current_subscription}
            />
          </div>
        </section>
      )}

      {/* Venue Location Section - Only render if venue exists */}
      {venueLocation && (
        <section id="venue" className="py-16 bg-white fade-slide-up wedding-pattern-bg">
          <div className="stagger-container">
            <WeddingMapLocation
              venue={venueLocation}
              primaryColor={styles.primaryColor}
              secondaryColor={styles.secondaryColor}
              fontFamily={styles.fontFamily}
              brideName={content.hero?.brideName}
              groomName={content.hero?.groomName}
            />
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="fade-slide-up floral-pattern-bg">
        <div className="counter-animate">
          <WeddingFooter
            brideName={content.hero?.brideName}
            groomName={content.hero?.groomName}
            primaryColor={styles.primaryColor}
            fontFamily={styles.fontFamily}
            viewCount={project.view_count}
          />
        </div>
      </div>

      {/* Modern Scroll to Top Button */}
      <div 
        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        role="button"
        aria-label="Scroll to top"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </div>

      {/* Schema.org structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": `${content.hero?.brideName} & ${content.hero?.groomName} Wedding`,
            "description": `Wedding celebration of ${content.hero?.brideName} and ${content.hero?.groomName}`,
            "startDate": content.hero?.weddingDate,
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "organizer": {
              "@type": "Person",
              "name": `${content.hero?.brideName} & ${content.hero?.groomName}`
            },
            "url": isCustomDomain ? `https://${currentDomain}` : `https://einvite.onrender.com/${subdomain}`
          })
        }}
      />
    </div>
  )
}