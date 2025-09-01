// File: src/hooks/useLeafletMap.ts
// Custom hook for Leaflet map functionality

import { useEffect, useState, useCallback } from 'react'
import { geocodeAddress, reverseGeocode, GeocodeResult } from '@/lib/mapConfig'

export interface MapLocation {
  latitude: number
  longitude: number
  address: string
  venueName: string
  description?: string
  showDirections: boolean
}

export interface UseLeafletMapProps {
  initialLocation?: MapLocation
  onLocationChange?: (location: MapLocation) => void
}

export const useLeafletMap = ({ initialLocation, onLocationChange }: UseLeafletMapProps = {}) => {
  const [location, setLocation] = useState<MapLocation | null>(initialLocation || null)
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Search for addresses
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await geocodeAddress(query.trim())
      setSearchResults(results)
    } catch (error) {
      console.error('Address search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchAddress(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchAddress])

  // Select a location from search results
  const selectLocation = useCallback(async (result: GeocodeResult, venueName: string = '') => {
    const newLocation: MapLocation = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
      venueName: venueName || result.display_name.split(',')[0],
      showDirections: true
    }

    setLocation(newLocation)
    onLocationChange?.(newLocation)
    setSearchResults([])
    setSearchQuery('')
  }, [onLocationChange])

  // Update location by coordinates (for map click/drag)
  const updateLocationByCoords = useCallback(async (lat: number, lng: number) => {
    try {
      const result = await reverseGeocode(lat, lng)
      
      if (result) {
        const newLocation: MapLocation = {
          latitude: lat,
          longitude: lng,
          address: result.display_name,
          venueName: location?.venueName || result.display_name.split(',')[0],
          description: location?.description,
          showDirections: location?.showDirections ?? true
        }

        setLocation(newLocation)
        onLocationChange?.(newLocation)
      }
    } catch (error) {
      console.error('Failed to update location:', error)
    }
  }, [location, onLocationChange])

  // Update location details
  const updateLocationDetails = useCallback((updates: Partial<MapLocation>) => {
    if (location) {
      const updatedLocation = { ...location, ...updates }
      setLocation(updatedLocation)
      onLocationChange?.(updatedLocation)
    }
  }, [location, onLocationChange])

  // Clear location
  const clearLocation = useCallback(() => {
    setLocation(null)
    onLocationChange?.(null as any)
    setSearchResults([])
    setSearchQuery('')
  }, [onLocationChange])

  return {
    // State
    location,
    searchResults,
    isSearching,
    searchQuery,

    // Actions
    setSearchQuery,
    selectLocation,
    updateLocationByCoords,
    updateLocationDetails,
    clearLocation,

    // Utilities
    hasLocation: !!location,
    isValidLocation: !!(location?.latitude && location?.longitude)
  }
}