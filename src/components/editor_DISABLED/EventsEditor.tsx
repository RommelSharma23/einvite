// File: src/components/editor/EventsEditor.tsx

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Plus, Trash2 } from 'lucide-react'

interface WeddingEvent {
  id: string
  eventName: string
  eventDate: string
  eventTime: string
  venueName: string
  venueAddress: string
  eventDescription: string
}

interface EventsEditorProps {
  events: WeddingEvent[]
  onEventsUpdate: (events: WeddingEvent[]) => void
}

export function EventsEditor({ events, onEventsUpdate }: EventsEditorProps) {
  const addEvent = () => {
    const newEvent: WeddingEvent = {
      id: Date.now().toString(),
      eventName: '',
      eventDate: '',
      eventTime: '',
      venueName: '',
      venueAddress: '',
      eventDescription: ''
    }
    onEventsUpdate([...events, newEvent])
  }

  const updateEvent = (eventId: string, field: string, value: string) => {
    const updatedEvents = events.map(event =>
      event.id === eventId ? { ...event, [field]: value } : event
    )
    onEventsUpdate(updatedEvents)
  }

  const deleteEvent = (eventId: string) => {
    const updatedEvents = events.filter(event => event.id !== eventId)
    onEventsUpdate(updatedEvents)
  }

  // Pre-defined Indian wedding events
  const commonEvents = [
    { name: 'Haldi Ceremony', description: 'Traditional turmeric ceremony for good luck and purification' },
    { name: 'Mehendi Ceremony', description: 'Beautiful henna art application ceremony' },
    { name: 'Sangeet', description: 'Musical night with dance and celebration' },
    { name: 'Ring Ceremony', description: 'Exchange of rings between the couple' },
    { name: 'Wedding Ceremony', description: 'The main wedding rituals and vows' },
    { name: 'Reception', description: 'Celebration dinner with family and friends' }
  ]

  const addCommonEvent = (eventName: string, description: string) => {
    const newEvent: WeddingEvent = {
      id: Date.now().toString(),
      eventName,
      eventDate: '',
      eventTime: '',
      venueName: '',
      venueAddress: '',
      eventDescription: description
    }
    onEventsUpdate([...events, newEvent])
  }

  return (
    <div className="space-y-4">
      {/* Quick Add Common Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-orange-500" />
            <CardTitle className="text-base">Quick Add Events</CardTitle>
          </div>
          <CardDescription>
            Add common Indian wedding events with one click
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {commonEvents.map((event, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => addCommonEvent(event.name, event.description)}
                className="text-left justify-start h-auto py-2"
              >
                <Plus className="h-3 w-3 mr-2" />
                <span className="text-xs">{event.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {events.map((event, index) => (
        <Card key={event.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                <CardTitle className="text-base">
                  {event.eventName || `Event ${index + 1}`}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteEvent(event.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor={`event-name-${event.id}`}>Event Name</Label>
              <Input
                id={`event-name-${event.id}`}
                value={event.eventName}
                onChange={(e) => updateEvent(event.id, 'eventName', e.target.value)}
                placeholder="e.g., Mehendi Ceremony"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`event-date-${event.id}`}>Date</Label>
                <Input
                  id={`event-date-${event.id}`}
                  type="date"
                  value={event.eventDate}
                  onChange={(e) => updateEvent(event.id, 'eventDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`event-time-${event.id}`}>Time</Label>
                <Input
                  id={`event-time-${event.id}`}
                  type="time"
                  value={event.eventTime}
                  onChange={(e) => updateEvent(event.id, 'eventTime', e.target.value)}
                />
              </div>
            </div>

            {/* Venue Details */}
            <div className="space-y-2">
              <Label htmlFor={`venue-name-${event.id}`}>Venue Name</Label>
              <Input
                id={`venue-name-${event.id}`}
                value={event.venueName}
                onChange={(e) => updateEvent(event.id, 'venueName', e.target.value)}
                placeholder="e.g., Grand Ballroom"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`venue-address-${event.id}`}>Venue Address</Label>
              <Textarea
                id={`venue-address-${event.id}`}
                value={event.venueAddress}
                onChange={(e) => updateEvent(event.id, 'venueAddress', e.target.value)}
                placeholder="Complete venue address"
                rows={2}
              />
            </div>

            {/* Event Description */}
            <div className="space-y-2">
              <Label htmlFor={`event-description-${event.id}`}>Description</Label>
              <Textarea
                id={`event-description-${event.id}`}
                value={event.eventDescription}
                onChange={(e) => updateEvent(event.id, 'eventDescription', e.target.value)}
                placeholder="Describe this event..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Custom Event */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            onClick={addEvent}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Event
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}