// File: src/lib/mapConfig.ts
// Leaflet Map Configuration for Wedding Website

// OpenStreetMap tile layer configuration
export const MAP_CONFIG = {
  // Default map center (you can change this to your preferred location)
  defaultCenter: [40.7128, -74.0060] as [number, number],
  
  defaultZoom: 13,
  
  // OpenStreetMap tile layer
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  
  // Nominatim API for geocoding (address search)
  nominatim: {
    baseUrl: 'https://nominatim.openstreetmap.org',
    searchParams: {
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'in,us,gb,ca,au' // Add more country codes as needed
    }
  },

  // Custom marker styles
  markerStyles: {
    wedding: {
      iconUrl: '/icons/wedding-marker.png', // We'll create this later
      iconSize: [40, 40] as [number, number],
      iconAnchor: [20, 40] as [number, number],
      popupAnchor: [0, -40] as [number, number]
    },
    default: {
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      iconSize: [25, 41] as [number, number],
      iconAnchor: [12, 41] as [number, number],
      popupAnchor: [1, -34] as [number, number],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      shadowSize: [41, 41] as [number, number]
    }
  }
}

// Geocoding function using Nominatim
export interface GeocodeResult {
  display_name: string
  lat: string
  lon: string
  address: {
    house_number?: string
    road?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
  }
}

export const geocodeAddress = async (query: string): Promise<GeocodeResult[]> => {
  try {
    const params = new URLSearchParams({
      q: query,
      ...MAP_CONFIG.nominatim.searchParams
    })
    
    const response = await fetch(`${MAP_CONFIG.nominatim.baseUrl}/search?${params}`)
    
    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }
    
    const results = await response.json()
    return results
  } catch (error) {
    console.error('Geocoding error:', error)
    return []
  }
}

// Reverse geocoding (get address from coordinates)
export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult | null> => {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1'
    })
    
    const response = await fetch(`${MAP_CONFIG.nominatim.baseUrl}/reverse?${params}`)
    
    if (!response.ok) {
      throw new Error('Reverse geocoding request failed')
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

// Format address from geocode result
export const formatAddress = (result: GeocodeResult): string => {
  const parts = []
  
  if (result.address.house_number) parts.push(result.address.house_number)
  if (result.address.road) parts.push(result.address.road)
  if (result.address.city) parts.push(result.address.city)
  if (result.address.state) parts.push(result.address.state)
  if (result.address.country) parts.push(result.address.country)
  if (result.address.postcode) parts.push(result.address.postcode)
  
  return parts.join(', ')
}

// Generate directions URL for different platforms
export const getDirectionsUrl = (lat: number, lng: number, address?: string) => {
  const coords = `${lat},${lng}`
  const destination = address ? encodeURIComponent(address) : coords
  
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
    apple: `http://maps.apple.com/?daddr=${coords}`,
    openstreetmap: `https://www.openstreetmap.org/directions?to=${coords}`
  }
}