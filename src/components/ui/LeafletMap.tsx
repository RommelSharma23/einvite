// File: src/components/ui/LeafletMap.tsx
// Client-side Leaflet Map wrapper component

'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamically import map components to avoid SSR issues
const DynamicMapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const DynamicTileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const DynamicMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const DynamicPopup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// Loading component
const MapLoader = ({ height = '400px' }: { height?: string }) => (
  <div 
    className="flex items-center justify-center bg-gray-100 rounded-lg"
    style={{ height }}
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-gray-600 text-sm">Loading map...</p>
    </div>
  </div>
)

export interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
  markers?: Array<{
    position: [number, number]
    popup?: React.ReactNode
    draggable?: boolean
    onDragEnd?: (lat: number, lng: number) => void
  }>
  onClick?: (lat: number, lng: number) => void
  children?: React.ReactNode
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [40.7128, -74.0060],
  zoom = 13,
  height = '400px',
  className = '',
  markers = [],
  onClick,
  children
}) => {
  const [isClient, setIsClient] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Import Leaflet and set up default icon
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        try {
          // Fix for default marker icons in webpack
          delete (L.Icon.Default.prototype as any)._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          })
          setLeafletLoaded(true)
        } catch (error) {
          console.error('Leaflet initialization error:', error)
          // Set loaded to true anyway to prevent infinite loading
          setLeafletLoaded(true)
        }
      }).catch((error) => {
        console.error('Failed to load Leaflet:', error)
        setLeafletLoaded(true)
      })
    }
  }, [])

  if (!isClient || !leafletLoaded) {
    return <MapLoader height={height} />
  }

  const handleMapClick = (e: any) => {
    if (onClick) {
      onClick(e.latlng.lat, e.latlng.lng)
    }
  }

  const handleMarkerDragEnd = (index: number) => (e: any) => {
    const marker = markers[index]
    if (marker.onDragEnd) {
      const { lat, lng } = e.target.getLatLng()
      marker.onDragEnd(lat, lng)
    }
  }

  try {
    return (
      <div className={`rounded-lg overflow-hidden border ${className}`} style={{ height }}>
        <DynamicMapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          eventHandlers={{
            click: handleMapClick
          }}
        >
          <DynamicTileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {markers.map((marker, index) => (
            <DynamicMarker
              key={index}
              position={marker.position}
              draggable={marker.draggable}
              eventHandlers={marker.draggable ? {
                dragend: handleMarkerDragEnd(index)
              } : {}}
            >
              {marker.popup && (
                <DynamicPopup>{marker.popup}</DynamicPopup>
              )}
            </DynamicMarker>
          ))}
          
          {children}
        </DynamicMapContainer>
      </div>
    )
  } catch (error) {
    console.error('LeafletMap render error:', error)
    return (
      <div 
        className={`rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center ${className}`} 
        style={{ height }}
      >
        <div className="text-center text-gray-600">
          <p className="text-sm">Map temporarily unavailable</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}

export default LeafletMap