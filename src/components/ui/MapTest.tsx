// File: src/components/ui/MapTest.tsx
// Simple test component to verify Leaflet setup

'use client'

import { useState } from 'react'
import { LeafletMap } from './LeafletMap'
import { Button } from './button'

export const MapTest = () => {
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060])
  const [markers, setMarkers] = useState<Array<{
    position: [number, number]
    popup: React.ReactNode
    draggable: boolean
  }>>([])

  const handleMapClick = (lat: number, lng: number) => {
    const newMarker = {
      position: [lat, lng] as [number, number],
      popup: (
        <div>
          <strong>Wedding Venue</strong><br />
          Lat: {lat.toFixed(4)}<br />
          Lng: {lng.toFixed(4)}
        </div>
      ),
      draggable: true
    }
    setMarkers([newMarker])
  }

  const clearMarkers = () => {
    setMarkers([])
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Map Test - Click to add venue marker</h2>
        <Button onClick={clearMarkers} variant="outline" size="sm">
          Clear Markers
        </Button>
      </div>
      
      <LeafletMap
        center={center}
        zoom={13}
        height="400px"
        markers={markers}
        onClick={handleMapClick}
        className="border-2 border-blue-200"
      />
      
      {markers.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800">✅ Leaflet Setup Successful!</h3>
          <p className="text-green-700 text-sm mt-1">
            You can click on the map and drag markers. Ready for wedding venue integration!
          </p>
          <p className="text-xs text-green-600 mt-2">
            Marker: {markers[0]?.position[0].toFixed(4)}, {markers[0]?.position[1].toFixed(4)}
          </p>
        </div>
      )}
    </div>
  )
}

export default MapTest