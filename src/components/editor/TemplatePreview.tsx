// File: src/components/editor/TemplatePreview.tsx - Part 1

import React, { useState } from 'react'
import { Heart, Calendar, MapPin, Clock, Images, Eye, ChevronRight, Users, Send, Music, ChevronDown, ChevronUp } from 'lucide-react'

interface HeroContent {
  brideName?: string
  groomName?: string
  weddingDate?: string
  welcomeMessage?: string
  heroImageUrl?: string
}

interface PersonInfo {
  name?: string
  description?: string
  fatherName?: string
  motherName?: string
  photoUrl?: string
}

interface CoupleContent {
  brideInfo?: PersonInfo
  groomInfo?: PersonInfo
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
  caption?: string
  gallery_category: string
}

interface ContentData {
  hero?: HeroContent
  couple?: CoupleContent
}

interface StylesData {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  fontFamily: string
}

interface GallerySettings {
  selectedStyle: string
  customSettings?: Record<string, unknown>
}

// Add RSVP Config interface
interface RSVPConfig {
  isEnabled?: boolean;
  title?: string;
  subtitle?: string;
}

// Updated TemplatePreviewProps interface
interface TemplatePreviewProps {
  content: ContentData
  styles: StylesData
  events?: WeddingEvent[]
  galleryImages?: GalleryImage[]
  gallerySettings?: GallerySettings
  userTier?: 'free' | 'silver' | 'gold' | 'platinum'
  projectId?: string
  rsvpConfig?: RSVPConfig  // Added this line
}

// File: src/components/editor/TemplatePreview.tsx - Part 2

// Compact RSVP Preview Component - Replace the existing RSVPPreview in TemplatePreview.tsx

const RSVPPreview: React.FC<{
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  brideName?: string
  groomName?: string
  title?: string
  subtitle?: string
}> = ({ 
  primaryColor, 
  secondaryColor, 
  fontFamily, 
  brideName, 
  groomName, 
  title = "RSVP",
  subtitle = "Please let us know if you'll be joining us for our special day!"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="w-full px-6 py-16 bg-white border-b" style={{ fontFamily }}>
      <div className="max-w-md mx-auto">
        {/* Compact Header - Always Visible */}
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h2 
            className="text-2xl font-serif mb-3 text-gray-800"
          >
            {title}
          </h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {subtitle}
          </p>
          
          {/* Compact Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded border hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide form
              </>
            ) : (
              <>
                Click to respond
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Collapsible Form Section */}
        <div className={`transition-all duration-500 ease-in-out ${
          isExpanded 
            ? 'max-h-screen opacity-100 mt-4' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {/* Compact Form */}
            <div className="space-y-4">
              {/* Guest Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
                  disabled
                />
              </div>

              {/* Email & Phone - Compact Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              {/* Attendance Options - Compact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Will you be attending? *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    className="p-2 border-2 rounded text-center transition-all text-xs"
                    style={{ 
                      borderColor: primaryColor, 
                      backgroundColor: primaryColor + '10',
                      color: primaryColor 
                    }}
                    disabled
                  >
                    <Heart className="h-3 w-3 mx-auto mb-1" />
                    <span className="font-medium">Yes</span>
                  </button>
                  <button className="p-2 border-2 border-gray-200 rounded text-center transition-all text-xs text-gray-600" disabled>
                    <Calendar className="h-3 w-3 mx-auto mb-1" />
                    <span>No</span>
                  </button>
                  <button className="p-2 border-2 border-gray-200 rounded text-center transition-all text-xs text-gray-600" disabled>
                    <Clock className="h-3 w-3 mx-auto mb-1" />
                    <span>Maybe</span>
                  </button>
                </div>
              </div>

              {/* Guest Count & Dietary - Compact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50" disabled>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dietary
                  </label>
                  <input
                    type="text"
                    placeholder="Veg, etc."
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              {/* Fun Questions - Compact */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Music className="inline h-3 w-3 mr-1" />
                    Dance floor song?
                  </label>
                  <input
                    type="text"
                    placeholder="Your favorite song"
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Heart className="inline h-3 w-3 mr-1" />
                    Advice for newlyweds?
                  </label>
                  <textarea
                    placeholder="Share your wisdom..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              {/* Submit Button - Compact */}
              <div className="text-center pt-3">
                <button
                  className="px-6 py-2 rounded text-white font-medium text-sm shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                  disabled
                >
                  Submit RSVP
                </button>
              </div>
            </div>

            {/* Preview Badge - Smaller */}
            <div className="text-center mt-4 pt-3 border-t border-gray-100">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// File: src/components/editor/TemplatePreview.tsx - Part 3

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  content, 
  styles, 
  events = [], 
  galleryImages = [], 
  gallerySettings,
  userTier = 'free',
  projectId,
  rsvpConfig  // Added this parameter
}) => {
  
  // Helper function to check if RSVP should be shown
  const shouldShowRSVP = () => {
    return rsvpConfig?.isEnabled && 
           (userTier === 'gold' || userTier === 'platinum');
  };

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative w-full px-6 py-12 bg-gradient-to-br from-blue-50 to-purple-50 border-b" style={{ fontFamily: styles.fontFamily }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-6 mb-6">
              <div className="text-center">
                <h1 
                  className="text-2xl font-serif"
                  style={{ color: styles.primaryColor }}
                >
                  {content.hero?.brideName || 'Bride'}
                </h1>
              </div>
              <Heart className="h-6 w-6" style={{ color: styles.secondaryColor }} />
              <div className="text-center">
                <h1 
                  className="text-2xl font-serif"
                  style={{ color: styles.primaryColor }}
                >
                  {content.hero?.groomName || 'Groom'}
                </h1>
              </div>
            </div>
            
            {content.hero?.weddingDate && (
              <div className="flex items-center justify-center space-x-2 text-lg text-gray-700">
                <Calendar className="h-5 w-5" />
                <span>{new Date(content.hero.weddingDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}
            
            {content.hero?.welcomeMessage && (
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {content.hero.welcomeMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Events Section */}
      {events.length > 0 && (
        <section className="w-full px-6 py-8 border-b" style={{ fontFamily: styles.fontFamily }}>
          <div className="max-w-4xl mx-auto">
            <h2 
              className="text-2xl font-serif text-center mb-6"
              style={{ color: styles.primaryColor }}
            >
              Wedding Events
            </h2>
            <div className="space-y-6">
              {events.map((event, index) => (
                <div key={event.id || index} className="bg-white rounded-lg shadow-sm p-6 border">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: styles.secondaryColor + '20' }}
                      >
                        <Calendar className="h-5 w-5" style={{ color: styles.secondaryColor }} />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {event.eventName}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(event.eventDate).toLocaleDateString()} 
                            {event.eventTime && ` at ${event.eventTime}`}
                          </span>
                        </div>
                        {event.venueName && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.venueName}</span>
                          </div>
                        )}
                        {event.venueAddress && (
                          <div className="ml-6 text-gray-500">
                            {event.venueAddress}
                          </div>
                        )}
                      </div>
                      {event.eventDescription && (
                        <p className="mt-3 text-gray-700">
                          {event.eventDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section className="w-full px-6 py-8 bg-gray-50 border-b" style={{ fontFamily: styles.fontFamily }}>
          <div className="max-w-4xl mx-auto">
            <h2 
              className="text-2xl font-serif text-center mb-6"
              style={{ color: styles.primaryColor }}
            >
              <Images className="inline-block h-6 w-6 mr-2" />
              Photo Gallery
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.slice(0, 6).map((image, index) => (
                <div key={image.id || index} className="relative group">
                  <img
                    src={image.file_url}
                    alt={image.caption || `Gallery image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                  />
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
                      <p className="text-sm truncate">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {galleryImages.length > 6 && (
              <div className="text-center mt-6">
                <span className="text-gray-500 text-sm">
                  +{galleryImages.length - 6} more photos
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* RSVP Section - Add this here */}
      {shouldShowRSVP() && (
        <RSVPPreview
          primaryColor={styles.primaryColor}
          secondaryColor={styles.secondaryColor}
          fontFamily={styles.fontFamily}
          brideName={content.hero?.brideName}
          groomName={content.hero?.groomName}
          title={rsvpConfig?.title}
          subtitle={rsvpConfig?.subtitle}
        />
      )}

      {/* Couple Section */}
      <section className="w-full px-6 py-8 bg-white border-b" style={{ fontFamily: styles.fontFamily }}>
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-2xl font-serif text-center mb-8"
            style={{ color: styles.primaryColor }}
          >
            Meet the Couple
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bride */}
            <div className="text-center">
              <div className="mb-4">
                {content.couple?.brideInfo?.photoUrl ? (
                  <img
                    src={content.couple.brideInfo.photoUrl}
                    alt={content.couple.brideInfo.name || 'Bride'}
                    className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg"
                  />
                ) : (
                  <div 
                    className="w-32 h-32 rounded-full mx-auto flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: styles.secondaryColor + '20' }}
                  >
                    <Heart className="h-8 w-8" style={{ color: styles.secondaryColor }} />
                  </div>
                )}
              </div>
              <h3 
                className="text-xl font-serif mb-2"
                style={{ color: styles.primaryColor }}
              >
                {content.couple?.brideInfo?.name || content.hero?.brideName || 'Bride'}
              </h3>
              {content.couple?.brideInfo?.description && (
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  {content.couple.brideInfo.description}
                </p>
              )}
              <div className="text-xs text-gray-500 space-y-1">
                {content.couple?.brideInfo?.fatherName && (
                  <p>Father: {content.couple.brideInfo.fatherName}</p>
                )}
                {content.couple?.brideInfo?.motherName && (
                  <p>Mother: {content.couple.brideInfo.motherName}</p>
                )}
              </div>
            </div>

            {/* Groom */}
            <div className="text-center">
              <div className="mb-4">
                {content.couple?.groomInfo?.photoUrl ? (
                  <img
                    src={content.couple.groomInfo.photoUrl}
                    alt={content.couple.groomInfo.name || 'Groom'}
                    className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg"
                  />
                ) : (
                  <div 
                    className="w-32 h-32 rounded-full mx-auto flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: styles.secondaryColor + '20' }}
                  >
                    <Heart className="h-8 w-8" style={{ color: styles.secondaryColor }} />
                  </div>
                )}
              </div>
              <h3 
                className="text-xl font-serif mb-2"
                style={{ color: styles.primaryColor }}
              >
                {content.couple?.groomInfo?.name || content.hero?.groomName || 'Groom'}
              </h3>
              {content.couple?.groomInfo?.description && (
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  {content.couple.groomInfo.description}
                </p>
              )}
              <div className="text-xs text-gray-500 space-y-1">
                {content.couple?.groomInfo?.fatherName && (
                  <p>Father: {content.couple.groomInfo.fatherName}</p>
                )}
                {content.couple?.groomInfo?.motherName && (
                  <p>Mother: {content.couple.groomInfo.motherName}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="w-full px-6 py-6 bg-gray-100 text-center text-gray-500 text-sm">
        <p>© 2025 {content.hero?.brideName} & {content.hero?.groomName} • Created with Einvite</p>
      </section>
    </div>
  )
}

// Export both named and default exports to support both import styles
export { TemplatePreview }
export default TemplatePreview