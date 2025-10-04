// File: src/components/wedding/WeddingMapLocation.tsx
// Wedding Venue Map Display Component

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeafletMap } from '@/components/ui/LeafletMap'
import { getDirectionsUrl } from '@/lib/mapConfig'
import {
  MapPin,
  Navigation,
  ExternalLink,
  Clock,
  Phone,
  Globe
} from 'lucide-react'
import { useScrollAnimation, useIconAnimation } from '@/hooks/useScrollAnimation'

export interface VenueLocation {
  venueName: string
  address: string
  latitude: number
  longitude: number
  description?: string
  showDirections: boolean
}

interface WeddingMapLocationProps {
  venue: VenueLocation
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  brideName?: string
  groomName?: string
}

export function WeddingMapLocation({
  venue,
  primaryColor,
  secondaryColor,
  fontFamily,
  brideName = 'Bride',
  groomName = 'Groom'
}: WeddingMapLocationProps) {
  const iconAnimation = useIconAnimation({ duration: 1000, delay: 100 })
  const headerAnimation = useScrollAnimation({ duration: 1000, delay: 200 })

  const [directionsDropdown, setDirectionsDropdown] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!venue || !venue.latitude || !venue.longitude) {
    return null
  }

  if (!isMounted) {
    return (
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-lg mb-6">
            <MapPin 
              className="h-8 w-8" 
              style={{ color: primaryColor }}
            />
          </div>
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ 
              fontFamily,
              color: primaryColor 
            }}
          >
            Wedding Venue
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Loading venue information...
          </p>
        </div>
      </div>
    )
  }

  const directionsUrls = getDirectionsUrl(venue.latitude, venue.longitude, venue.address)

  const handleDirectionsClick = () => {
    // Direct Google Maps link - works on both Android and iOS
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}&destination_place_id=&travelmode=driving`
    window.open(googleMapsUrl, '_blank')
  }

  const handleShareLocation = async () => {
    const shareData = {
      title: `${brideName} & ${groomName} Wedding Venue`,
      text: `Join us at ${venue.venueName} for our special day!`,
      url: directionsUrls.google
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(
          `${venue.venueName}\n${venue.address}\n${directionsUrls.google}`
        )
        // You could add a toast notification here
        alert('Venue details copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy venue details')
      }
    }
  }

  return (
    <div className="container mx-auto px-4">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div ref={iconAnimation.ref} className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-lg mb-6" style={iconAnimation.style}>
          <MapPin
            className="h-8 w-8"
            style={{ color: primaryColor }}
          />
        </div>
        <div ref={headerAnimation.ref}>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              fontFamily,
              color: primaryColor,
              ...headerAnimation.style
            }}
          >
            Wedding Venue
          </h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join us at our beautiful venue for the celebration of {brideName} & {groomName}'s wedding
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Venue Information Card */}
        <Card className="h-full">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Venue Name */}
              <div>
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ color: primaryColor, fontFamily }}
                >
                  {venue.venueName}
                </h3>
                <div className="flex items-start space-x-2 text-gray-600">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <p className="text-sm leading-relaxed">{venue.address}</p>
                </div>
              </div>

              {/* Description */}
              {venue.description && (
                <div className="border-l-4 pl-4" style={{ borderColor: `${secondaryColor}40` }}>
                  <p className="text-gray-700 leading-relaxed">{venue.description}</p>
                </div>
              )}

              {/* Coordinates Badge */}
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
                </Badge>
              </div>

              {/* Action Buttons */}
              {venue.showDirections && (
                <div className="space-y-3">
                  <Button
                    onClick={handleDirectionsClick}
                    className="w-full"
                    style={{ 
                      backgroundColor: primaryColor,
                      color: 'white'
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleShareLocation}
                    className="w-full"
                    style={{ 
                      borderColor: primaryColor,
                      color: primaryColor
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Share Location
                  </Button>
                </div>
              )}

              {/* Travel Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium text-sm mb-1">Travel Tips</p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      We recommend arriving 15-30 minutes early. Check traffic conditions before traveling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Map */}
        <Card className="h-full">
          <CardContent className="p-0">
            <div className="relative">
              <LeafletMap
                center={[venue.latitude, venue.longitude]}
                zoom={16}
                height="500px"
                markers={[{
                  position: [venue.latitude, venue.longitude],
                  draggable: false,
                  popup: (
                    <div className="text-center p-2">
                      <div className="flex items-center justify-center mb-2">
                        <MapPin 
                          className="h-5 w-5 mr-1" 
                          style={{ color: primaryColor }}
                        />
                        <strong style={{ color: primaryColor }}>
                          {venue.venueName}
                        </strong>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{venue.address}</p>
                      {venue.showDirections && (
                        <Button
                          size="sm"
                          onClick={handleDirectionsClick}
                          style={{ 
                            backgroundColor: primaryColor,
                            color: 'white'
                          }}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Directions
                        </Button>
                      )}
                    </div>
                  )
                }]}
                className="rounded-lg"
              />

              {/* Map Overlay Info */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm" style={{ color: primaryColor }}>
                        {venue.venueName}
                      </p>
                      <p className="text-xs text-gray-600">Click marker for more details</p>
                    </div>
                    {venue.showDirections && (
                      <Button
                        size="sm"
                        onClick={handleDirectionsClick}
                        style={{ 
                          backgroundColor: primaryColor,
                          color: 'white'
                        }}
                      >
                        <Navigation className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}