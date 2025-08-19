// File: src/app/preview/[projectId]/page.tsx

'use client'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Heart, Calendar, MapPin, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

interface StylesData {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  fontFamily: string
}

export default function PreviewPage() {
  const params = useParams()
  const projectId = params.projectId as string
  
  const [content, setContent] = useState<ContentData>({})
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [styles, setStyles] = useState<StylesData>({
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, sans-serif'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Load content
        const { data: contentData, error: contentError } = await supabase
          .from('wedding_content')
          .select('*')
          .eq('project_id', projectId)

        if (contentError) {
          console.error('Content error:', contentError)
        }

        // Load events
        const { data: eventsData, error: eventsError } = await supabase
          .from('wedding_events')
          .select('*')
          .eq('project_id', projectId)
          .order('display_order')

        if (eventsError) {
          console.error('Events error:', eventsError)
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

      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load wedding website')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadData()
    }
  }, [projectId])

  // Calculate countdown
  const getTimeLeft = () => {
    if (!content.hero?.weddingDate) return null
    
    const weddingDate = new Date(content.hero.weddingDate).getTime()
    const now = new Date().getTime()
    const difference = weddingDate - now

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      return { days, hours, minutes }
    }
    return null
  }

  const timeLeft = getTimeLeft()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading wedding website...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: styles.fontFamily }}>
      {/* Preview Banner */}
      <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-center">
        <p className="text-sm text-yellow-800">
          🔍 Preview Mode - This is how your published website will look
        </p>
      </div>

      {/* Hero Section */}
      <section 
        className="min-h-screen flex items-center justify-center text-center px-6 relative"
        style={{
          background: content.hero?.heroImageUrl 
            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${content.hero.heroImageUrl})`
            : `linear-gradient(135deg, ${styles.primaryColor}15, ${styles.secondaryColor}15)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 
            className={`text-4xl md:text-6xl font-serif mb-6 ${content.hero?.heroImageUrl ? 'text-white drop-shadow-lg' : ''}`}
            style={{ 
              color: content.hero?.heroImageUrl ? 'white' : styles.primaryColor,
              textShadow: content.hero?.heroImageUrl ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            {content.hero?.brideName || 'Bride Name'}
            <span 
              className="mx-4 text-3xl md:text-5xl" 
              style={{ 
                color: content.hero?.heroImageUrl ? 'white' : styles.secondaryColor,
                textShadow: content.hero?.heroImageUrl ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
              }}
            >
              &
            </span>
            {content.hero?.groomName || 'Groom Name'}
          </h1>
          
          {content.hero?.weddingDate && (
            <p 
              className={`text-xl md:text-2xl mb-8 ${content.hero?.heroImageUrl ? 'text-white drop-shadow-lg' : ''}`}
              style={{ 
                color: content.hero?.heroImageUrl ? 'white' : styles.primaryColor,
                textShadow: content.hero?.heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
              }}
            >
              {new Date(content.hero.weddingDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}

          {content.hero?.welcomeMessage && (
            <p 
              className={`text-lg mb-8 max-w-2xl mx-auto ${content.hero?.heroImageUrl ? 'text-gray-100' : 'text-gray-600'}`}
              style={{
                textShadow: content.hero?.heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
              }}
            >
              {content.hero.welcomeMessage}
            </p>
          )}

          {/* Countdown Timer */}
          {timeLeft && (
            <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-lg inline-block ${content.hero?.heroImageUrl ? 'bg-white/20 border border-white/30' : 'bg-white bg-opacity-90'}`}>
              <h3 
                className={`text-lg font-semibold mb-4 ${content.hero?.heroImageUrl ? 'text-white' : ''}`}
                style={{ 
                  color: content.hero?.heroImageUrl ? 'white' : styles.primaryColor,
                  textShadow: content.hero?.heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                }}
              >
                Our Big Day In
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div 
                    className={`text-3xl font-bold ${content.hero?.heroImageUrl ? 'text-white' : ''}`}
                    style={{ 
                      color: content.hero?.heroImageUrl ? 'white' : styles.primaryColor,
                      textShadow: content.hero?.heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                    }}
                  >
                    {timeLeft.days}
                  </div>
                  <div className={`text-sm ${content.hero?.heroImageUrl ? 'text-gray-100' : 'text-gray-600'}`}>Days</div>
                </div>
                <div className="text-center">
                  <div 
                    className={`text-3xl font-bold ${content.hero?.heroImageUrl ? 'text-white' : ''}`}
                    style={{ 
                      color: content.hero?.heroImageUrl ? 'white' : styles.primaryColor,
                      textShadow: content.hero?.heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                    }}
                  >
                    {timeLeft.hours}
                  </div>
                  <div className={`text-sm ${content.hero?.heroImageUrl ? 'text-gray-100' : 'text-gray-600'}`}>Hours</div>
                </div>
                <div className="text-center">
                  <div 
                    className={`text-3xl font-bold ${content.hero?.heroImageUrl ? 'text-white' : ''}`}
                    style={{ 
                      color: content.hero?.heroImageUrl ? 'white' : styles.primaryColor,
                      textShadow: content.hero?.heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                    }}
                  >
                    {timeLeft.minutes}
                  </div>
                  <div className={`text-sm ${content.hero?.heroImageUrl ? 'text-gray-100' : 'text-gray-600'}`}>Minutes</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Events Section */}
      {events.length > 0 && (
        <section className="py-16 px-6" style={{ backgroundColor: `${styles.secondaryColor}08` }}>
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-serif text-center mb-12"
              style={{ color: styles.primaryColor }}
            >
              Wedding Events
            </h2>
            
            <div className="grid gap-8">
              {events.map((event, index) => (
                <div 
                  key={event.id}
                  className="bg-white rounded-2xl shadow-lg p-8 border-l-4"
                  style={{ borderLeftColor: index % 2 === 0 ? styles.primaryColor : styles.secondaryColor }}
                >
                  <h3 
                    className="text-2xl font-semibold mb-3"
                    style={{ color: styles.primaryColor }}
                  >
                    {event.event_name}
                  </h3>
                  
                  {event.event_description && (
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {event.event_description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {event.event_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                    )}
                    {event.venue_name && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.venue_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Couple Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 
            className="text-3xl md:text-4xl font-serif text-center mb-12"
            style={{ color: styles.primaryColor }}
          >
            Meet the Couple
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Bride */}
            <div className="text-center">
              <div className="mb-6">
                {content.couple?.brideInfo?.photoUrl ? (
                  <div className="w-48 h-48 rounded-full mx-auto overflow-hidden shadow-lg border-4 border-white">
                    <img
                      src={content.couple.brideInfo.photoUrl}
                      alt="Bride"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-48 h-48 rounded-full mx-auto flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${styles.primaryColor}15` }}
                  >
                    <Heart className="h-16 w-16" style={{ color: styles.primaryColor }} />
                  </div>
                )}
              </div>
              <h3 
                className="text-2xl font-semibold mb-4"
                style={{ color: styles.primaryColor }}
              >
                {content.couple?.brideInfo?.name || 'Bride Name'}
              </h3>
              {content.couple?.brideInfo?.description && (
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {content.couple.brideInfo.description}
                </p>
              )}
            </div>

            {/* Groom */}
            <div className="text-center">
              <div className="mb-6">
                {content.couple?.groomInfo?.photoUrl ? (
                  <div className="w-48 h-48 rounded-full mx-auto overflow-hidden shadow-lg border-4 border-white">
                    <img
                      src={content.couple.groomInfo.photoUrl}
                      alt="Groom"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-48 h-48 rounded-full mx-auto flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${styles.secondaryColor}15` }}
                  >
                    <Heart className="h-16 w-16" style={{ color: styles.secondaryColor }} />
                  </div>
                )}
              </div>
              <h3 
                className="text-2xl font-semibold mb-4"
                style={{ color: styles.primaryColor }}
              >
                {content.couple?.groomInfo?.name || 'Groom Name'}
              </h3>
              {content.couple?.groomInfo?.description && (
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {content.couple.groomInfo.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ backgroundColor: styles.primaryColor }}>
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-serif text-white mb-4">
            {content.hero?.brideName || 'Bride'} & {content.hero?.groomName || 'Groom'}
          </h3>
          <p className="text-white/80">
            Thank you for being part of our special day! 💕
          </p>
        </div>
      </footer>
    </div>
  )
}