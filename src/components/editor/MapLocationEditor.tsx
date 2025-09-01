// File: src/components/editor/MapLocationEditor.tsx
// Map Location Editor for Wedding Venue Selection

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { LeafletMap } from '@/components/ui/LeafletMap'
import { useLeafletMap } from '@/hooks/useLeafletMap'
import { 
  MapPin, 
  Search, 
  Navigation, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'

export interface VenueLocation {
  venueName: string
  address: string
  latitude: number
  longitude: number
  description?: string
  showDirections: boolean
}

interface MapLocationEditorProps {
  venue?: VenueLocation | null
  onVenueUpdate: (venue: VenueLocation | null) => void
}

export function MapLocationEditor({ venue, onVenueUpdate }: MapLocationEditorProps) {
  const [tempVenueName, setTempVenueName] = useState('')
  const [tempDescription, setTempDescription] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  
  const {
    location,
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    selectLocation,
    updateLocationByCoords,
    updateLocationDetails,
    clearLocation,
    hasLocation,
    isValidLocation
  } = useLeafletMap({
    initialLocation: venue ? {
      latitude: venue.latitude,
      longitude: venue.longitude,
      address: venue.address,
      venueName: venue.venueName,
      description: venue.description,
      showDirections: venue.showDirections
    } : undefined,
    onLocationChange: (loc) => {
      if (loc) {
        const venueData: VenueLocation = {
          venueName: loc.venueName,
          address: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
          description: loc.description,
          showDirections: loc.showDirections
        }
        onVenueUpdate(venueData)
      } else {
        onVenueUpdate(null)
      }
    }
  })

  // Handle mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update temp fields when location changes
  useEffect(() => {
    if (location) {
      setTempVenueName(location.venueName)
      setTempDescription(location.description || '')
    }
  }, [location])

  const handleVenueNameUpdate = () => {
    if (location && tempVenueName.trim()) {
      updateLocationDetails({ venueName: tempVenueName.trim() })
    }
  }

  const handleDescriptionUpdate = () => {
    if (location) {
      updateLocationDetails({ description: tempDescription.trim() })
    }
  }

  const handleDirectionsToggle = (enabled: boolean) => {
    if (location) {
      updateLocationDetails({ showDirections: enabled })
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    updateLocationByCoords(lat, lng)
  }

  const handleMarkerDrag = (lat: number, lng: number) => {
    updateLocationByCoords(lat, lng)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Wedding Venue Location
          </CardTitle>
          <CardDescription>
            Add your wedding venue location so guests can easily find you. Search for an address or click on the map.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Address Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find Your Venue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for venue address (e.g., Grand Palace Hotel, Mumbai)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm text-gray-600 font-medium">Search Results:</p>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => selectLocation(result)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{result.display_name.split(',')[0]}</p>
                      <p className="text-xs text-gray-600 mt-1">{result.display_name}</p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600 ml-2 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Map Location</CardTitle>
          <CardDescription>
            {hasLocation 
              ? "Drag the marker or click on the map to adjust the location" 
              : "Click on the map to set your venue location"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMounted ? (
            <LeafletMap
              center={location ? [location.latitude, location.longitude] : [40.7128, -74.0060]}
              zoom={location ? 15 : 13}
              height="400px"
              onClick={handleMapClick}
              markers={location ? [{
                position: [location.latitude, location.longitude],
                draggable: true,
                onDragEnd: handleMarkerDrag,
                popup: (
                  <div className="text-center">
                    <strong className="text-blue-600">{location.venueName}</strong>
                    <br />
                    <span className="text-sm text-gray-600">{location.address}</span>
                  </div>
                )
              }] : []}
              className="border-2 border-gray-200"
            />
          ) : (
            <div 
              className="border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50"
              style={{ height: '400px' }}
            >
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p>Loading map...</p>
              </div>
            </div>
          )}
          
          {hasLocation && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-green-800 font-medium text-sm">Location Set Successfully!</span>
              </div>
              <p className="text-green-700 text-xs mt-1">
                Coordinates: {location!.latitude.toFixed(6)}, {location!.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Venue Details */}
      {hasLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Venue Details</CardTitle>
            <CardDescription>
              Customize how your venue appears on the wedding website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Venue Name */}
            <div className="space-y-2">
              <Label htmlFor="venueName">Venue Name</Label>
              <div className="flex space-x-2">
                <Input
                  id="venueName"
                  value={tempVenueName}
                  onChange={(e) => setTempVenueName(e.target.value)}
                  placeholder="Enter venue name"
                />
                <Button 
                  onClick={handleVenueNameUpdate}
                  size="sm"
                  disabled={!tempVenueName.trim() || tempVenueName === location?.venueName}
                >
                  Update
                </Button>
              </div>
            </div>

            {/* Address Display */}
            <div className="space-y-2">
              <Label>Address</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{location!.address}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <div className="space-y-2">
                <Textarea
                  id="description"
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  placeholder="Add a description about the venue..."
                  rows={3}
                />
                <Button 
                  onClick={handleDescriptionUpdate}
                  size="sm"
                  variant="outline"
                  disabled={tempDescription === (location?.description || '')}
                >
                  Update Description
                </Button>
              </div>
            </div>

            {/* Show Directions Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Show "Get Directions" Button</Label>
                <p className="text-xs text-gray-600">
                  Allow guests to get directions to your venue
                </p>
              </div>
              <Switch
                checked={location!.showDirections}
                onCheckedChange={handleDirectionsToggle}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={clearLocation}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Location
              </Button>
              
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Navigation className="h-3 w-3 mr-1" />
                Ready for Wedding Website
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!hasLocation && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <h3 className="font-medium mb-2">No venue location set</h3>
              <p className="text-sm">
                Search for your venue address above or click on the map to set a location
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}