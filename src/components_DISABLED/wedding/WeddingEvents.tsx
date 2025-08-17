// File: src/components/wedding/WeddingEvents.tsx

'use client'

import { Calendar, Clock, MapPin } from 'lucide-react'

interface WeddingEvent {
  id: string
  event_name: string
  event_date: string
  venue_name?: string
  venue_address?: string
  event_description?: string
}

interface WeddingEventsProps {
  events: WeddingEvent[]
  primaryColor: string
  secondaryColor: string
  fontFamily: string
}

export function WeddingEvents({
  events,
  primaryColor,
  secondaryColor,
  fontFamily
}: WeddingEventsProps) {
  // Don't render if no events
  if (!events || events.length === 0) {
    return null
  }

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatEventTime = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <section 
      id="events" 
      className="py-16 px-6" 
      style={{ 
        backgroundColor: `${secondaryColor}08`,
        fontFamily: fontFamily
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <h2 
          className="text-3xl md:text-4xl font-serif text-center mb-12"
          style={{ color: primaryColor }}
        >
          Wedding Events
        </h2>
        
        {/* Events Grid */}
        <div className="grid gap-8">
          {events.map((event, index) => (
            <div 
              key={event.id}
              className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-l-4 hover:shadow-xl transition-shadow duration-300"
              style={{ 
                borderLeftColor: index % 2 === 0 ? primaryColor : secondaryColor 
              }}
            >
              <div className="grid md:grid-cols-3 gap-6">
                {/* Event Details */}
                <div className="md:col-span-2">
                  <h3 
                    className="text-2xl md:text-3xl font-semibold mb-3"
                    style={{ color: primaryColor }}
                  >
                    {event.event_name}
                  </h3>
                  
                  {/* Event Description */}
                  {event.event_description && (
                    <p className="text-gray-600 mb-4 leading-relaxed text-lg">
                      {event.event_description}
                    </p>
                  )}
                  
                  {/* Venue Name */}
                  {event.venue_name && (
                    <div className="flex items-center mb-2">
                      <MapPin 
                        className="h-5 w-5 mr-2 flex-shrink-0" 
                        style={{ color: secondaryColor }} 
                      />
                      <span className="font-medium text-lg">{event.venue_name}</span>
                    </div>
                  )}
                  
                  {/* Venue Address */}
                  {event.venue_address && (
                    <p className="text-gray-600 ml-7 text-sm leading-relaxed">
                      {event.venue_address}
                    </p>
                  )}
                </div>
                
                {/* Date & Time Card */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-center">
                    <Calendar 
                      className="h-8 w-8 mx-auto mb-3" 
                      style={{ color: primaryColor }} 
                    />
                    
                    {/* Event Date */}
                    {event.event_date && (
                      <div className="mb-3">
                        <p className="font-semibold text-gray-900 text-sm md:text-base leading-tight">
                          {formatEventDate(event.event_date)}
                        </p>
                      </div>
                    )}
                    
                    {/* Event Time */}
                    {event.event_date && (
                      <div className="flex items-center justify-center">
                        <Clock 
                          className="h-4 w-4 mr-2" 
                          style={{ color: secondaryColor }} 
                        />
                        <span 
                          className="text-lg font-medium"
                          style={{ color: primaryColor }}
                        >
                          {formatEventTime(event.event_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Event Count Summary */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            {events.length} special {events.length === 1 ? 'event' : 'events'} to celebrate our love
          </p>
        </div>
      </div>
    </section>
  )
}