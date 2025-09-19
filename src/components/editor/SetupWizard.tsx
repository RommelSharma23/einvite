'use client'

import React, { useState, useEffect } from 'react'
import { Check, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Users, Calendar, Images, MapPin, Palette, MessageCircle, Upload, X, Eye, Edit3, Save, Cancel, Search, Target, Plus, Grid3X3, LayoutGrid, Camera, Star, Heart, Trash2, RotateCw, Crop, Download, Crown, Music, MessageSquare, Waves, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeafletMap } from '@/components/ui/LeafletMap'
import { useLeafletMap } from '@/hooks/useLeafletMap'
import { MultiImageUpload } from './MultiImageUpload'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { ScrollEffectsEditor } from './ScrollEffectsEditor'
import { SocialLinksEditor } from './SocialLinksEditor'
import BackgroundMusicEditor from './BackgroundMusicEditor'

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  tabValue: string
  isCompleted: boolean
  isOptional?: boolean
  estimatedTime: string
}

interface SetupWizardProps {
  onStepSelect: (tabValue: string) => void
  onWizardComplete: () => void
  currentContent: any
  currentStyles: any
  scrollEffects: any
  socialLinks: any
  events: any[]
  galleryImages: any[]
  venueLocation: any
  rsvpConfig: any
  backgroundMusic: any
  onContentUpdate: (section: string, field: string, value: string) => void
  onNestedContentUpdate: (section: string, subsection: string, field: string, value: string) => void
  onStyleUpdate: (field: string, value: string) => void
  onScrollEffectsUpdate: (config: any) => void
  onSocialLinksUpdate: (config: any) => void
  onEventsUpdate: (events: any[]) => void
  onVenueUpdate: (venue: any) => void
  onGalleryUpdate: () => void
  projectId: string
  onRSVPUpdate: (config: any) => void
  onBackgroundMusicUpdate: (config: any) => void
  userTier: string
}

export function SetupWizard({
  onStepSelect,
  onWizardComplete,
  currentContent,
  currentStyles,
  scrollEffects,
  socialLinks,
  events,
  galleryImages,
  venueLocation,
  rsvpConfig,
  backgroundMusic,
  onContentUpdate,
  onNestedContentUpdate,
  onStyleUpdate,
  onScrollEffectsUpdate,
  onSocialLinksUpdate,
  onEventsUpdate,
  onVenueUpdate,
  onGalleryUpdate,
  projectId,
  onRSVPUpdate,
  onBackgroundMusicUpdate,
  userTier
}: SetupWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showWizard, setShowWizard] = useState(true)
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  // Gallery state
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [galleryLayout, setGalleryLayout] = useState<'grid' | 'masonry' | 'slideshow'>('grid')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [dragActive, setDragActive] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({
    // Collapse all sections by default
    hero: true,
    couple: true,
    bride: true,
    groom: true,
    pre_wedding: true,
    engagement: true,
    family: true
  })
  // Map stored gallery style to UI display style
  const getUIGalleryStyle = (storedStyle: string) => {
    const styleMap: {[key: string]: string} = {
      'grid': 'grid',
      'single-carousel': 'slideshow',
      'multi-carousel': 'slideshow',
      'masonry': 'masonry',
      'timeline': 'timeline'
    }
    return styleMap[storedStyle] || 'grid'
  }
  
  const [selectedGalleryStyle, setSelectedGalleryStyle] = useState<string>(
    getUIGalleryStyle(currentStyles?.galleryStyle || 'grid')
  )
  const [galleryPreferences, setGalleryPreferences] = useState({
    allowDownload: false,
    showCaptions: true,
    autoPlay: false
  })

  // Map integration for venue step
  const {
    location: mapLocation,
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    selectLocation,
    updateLocationByCoords,
    clearLocation,
    hasLocation,
  } = useLeafletMap({
    initialLocation: venueLocation ? {
      latitude: venueLocation.latitude,
      longitude: venueLocation.longitude,
      address: venueLocation.address,
      venueName: venueLocation.venueName,
      description: venueLocation.description,
      showDirections: venueLocation.showDirections
    } : undefined,
    onLocationChange: (loc) => {
      if (loc) {
        onVenueUpdate({
          venueName: loc.venueName,
          address: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
          description: loc.description,
          showDirections: loc.showDirections
        })
      } else {
        onVenueUpdate(null)
      }
    }
  })

  // Handle mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Sync UI state when currentStyles changes
  useEffect(() => {
    if (currentStyles?.galleryStyle) {
      setSelectedGalleryStyle(getUIGalleryStyle(currentStyles.galleryStyle))
    }
  }, [currentStyles?.galleryStyle])

  // Toggle section collapse
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Expand/Collapse all sections
  const toggleAllSections = (collapsed: boolean) => {
    setCollapsedSections(prev => {
      const newState: {[key: string]: boolean} = {}
      Object.keys(prev).forEach(key => {
        newState[key] = collapsed
      })
      return newState
    })
  }

  // Define wizard steps
  const steps: WizardStep[] = [
    {
      id: 'content',
      title: 'Basic Wedding Details',
      description: 'Add your names, wedding date, and welcome message',
      icon: <Users className="h-5 w-5" />,
      tabValue: 'content',
      isCompleted: false,
      estimatedTime: '3 min'
    },
    {
      id: 'style',
      title: 'Choose Your Style',
      description: 'Pick colors and fonts that match your wedding theme',
      icon: <Palette className="h-5 w-5" />,
      tabValue: 'style',
      isCompleted: false,
      estimatedTime: '2 min'
    },
    {
      id: 'effects',
      title: 'Animation & Effects',
      description: 'Add beautiful scroll animations and visual effects',
      icon: <Waves className="h-5 w-5" />,
      tabValue: 'effects',
      isCompleted: false,
      isOptional: true,
      estimatedTime: '2 min'
    },
    {
      id: 'socials',
      title: 'Social Media',
      description: 'Connect your Facebook and Instagram for guests to follow',
      icon: <Link className="h-5 w-5" />,
      tabValue: 'socials',
      isCompleted: false,
      isOptional: true,
      estimatedTime: '2 min'
    },
    {
      id: 'events',
      title: 'Add Wedding Events',
      description: 'Include ceremony, reception, and other celebrations',
      icon: <Calendar className="h-5 w-5" />,
      tabValue: 'events',
      isCompleted: false,
      estimatedTime: '5 min'
    },
    {
      id: 'venue',
      title: 'Venue & Location',
      description: 'Help guests find your wedding location with maps',
      icon: <MapPin className="h-5 w-5" />,
      tabValue: 'venue',
      isCompleted: false,
      isOptional: true,
      estimatedTime: '3 min'
    },
    {
      id: 'gallery',
      title: 'Photo Gallery',
      description: 'Upload engagement photos and memories to share',
      icon: <Images className="h-5 w-5" />,
      tabValue: 'gallery',
      isCompleted: false,
      isOptional: true,
      estimatedTime: '10 min'
    },
    {
      id: 'rsvp',
      title: 'RSVP Setup',
      description: 'Let guests respond to your invitation online',
      icon: <Users className="h-5 w-5" />,
      tabValue: 'rsvp',
      isCompleted: false,
      isOptional: true,
      estimatedTime: '2 min'
    },
    {
      id: 'wishes',
      title: 'Guest Messages',
      description: 'Allow guests to leave wishes and messages',
      icon: <MessageCircle className="h-5 w-5" />,
      tabValue: 'wishes',
      isCompleted: false,
      isOptional: true,
      estimatedTime: '2 min'
    },
    {
      id: 'music',
      title: 'Background Music',
      description: 'Add beautiful music to enhance your website experience',
      icon: <Music className="h-5 w-5" />,
      tabValue: 'music',
      isCompleted: false,
      isOptional: true,
      estimatedTime: '3 min'
    }
  ]

  // Check completion status
  const checkStepCompletion = (stepId: string): boolean => {
    switch (stepId) {
      case 'content':
        return !!(currentContent?.hero?.brideName && currentContent?.hero?.groomName && currentContent?.hero?.weddingDate)
      case 'style':
        return !!(currentStyles?.primaryColor && currentStyles?.fontFamily)
      case 'effects':
        return true // Always mark as complete since it's optional with default settings
      case 'socials':
        return true // Always mark as complete since it's optional
      case 'events':
        return events && events.length > 0
      case 'venue':
        return !!(venueLocation?.venueName && venueLocation?.address)
      case 'gallery':
        return galleryImages && galleryImages.length > 0
      case 'rsvp':
        return !!(rsvpConfig?.isEnabled)
      case 'wishes':
        return true // Always mark as complete since it's optional
      case 'music':
        return !!(backgroundMusic?.fileUrl && backgroundMusic?.isEnabled)
      default:
        return false
    }
  }

  // Update completion status
  useEffect(() => {
    steps.forEach((step, index) => {
      steps[index].isCompleted = checkStepCompletion(step.id)
    })
  }, [currentContent, currentStyles, scrollEffects, events, galleryImages, venueLocation, rsvpConfig, backgroundMusic])

  const completedSteps = steps.filter(step => step.isCompleted).length
  const totalSteps = steps.length
  const progress = (completedSteps / totalSteps) * 100

  const currentStep = steps[currentStepIndex]

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      onStepSelect(steps[currentStepIndex + 1].tabValue)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
      onStepSelect(steps[currentStepIndex - 1].tabValue)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStepIndex(stepIndex)
    onStepSelect(steps[stepIndex].tabValue)
  }

  const handleSkipWizard = () => {
    setShowWizard(false)
    onWizardComplete()
  }

  // Render step-specific form
  const renderStepForm = () => {
    const currentStep = steps[currentStepIndex]
    
    switch (currentStep.id) {
      case 'content':
        return (
          <div className="space-y-6">
            {/* Basic Wedding Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 text-sm border-b pb-2">Basic Wedding Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="brideName" className="text-sm font-medium">Bride's Name</Label>
                  <Input
                    id="brideName"
                    value={currentContent?.hero?.brideName || ''}
                    onChange={(e) => onContentUpdate('hero', 'brideName', e.target.value)}
                    placeholder="Full name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groomName" className="text-sm font-medium">Groom's Name</Label>
                  <Input
                    id="groomName"
                    value={currentContent?.hero?.groomName || ''}
                    onChange={(e) => onContentUpdate('hero', 'groomName', e.target.value)}
                    placeholder="Full name"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weddingDate" className="text-sm font-medium">Wedding Date</Label>
                <Input
                  id="weddingDate"
                  type="date"
                  value={currentContent?.hero?.weddingDate || ''}
                  onChange={(e) => onContentUpdate('hero', 'weddingDate', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage" className="text-sm font-medium">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  value={currentContent?.hero?.welcomeMessage || ''}
                  onChange={(e) => onContentUpdate('hero', 'welcomeMessage', e.target.value)}
                  placeholder="A heartfelt message for your guests..."
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>

            {/* Bride Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 text-sm border-b pb-2">About the Bride</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bride's Photo for "Meet the Couple" Section</Label>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="text-center mb-3">
                      <Camera className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs font-medium text-gray-900">Upload Bride's Photo</p>
                      <p className="text-xs text-gray-500">Single photo • 800x1000px recommended</p>
                      <p className="text-xs text-pink-600 mt-1">
                        💡 <strong>Best photos:</strong> Professional portrait, engagement shoot, or beautiful candid shot that represents the bride well
                      </p>
                    </div>
                    <MultiImageUpload
                      projectId={projectId}
                      galleryCategory="bride_photo"
                      onUploadComplete={(uploadedImages) => {
                        if (uploadedImages.length > 0) {
                          onNestedContentUpdate('couple', 'brideInfo', 'photoUrl', uploadedImages[0].url)
                          onGalleryUpdate()
                        }
                      }}
                      maxFiles={1}
                      maxSizePerFile={5}
                      className="w-full"
                    />
                  </div>
                  {currentContent?.couple?.brideInfo?.photoUrl && (
                    <div className="mt-2 flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img 
                          src={currentContent.couple.brideInfo.photoUrl} 
                          alt="Bride" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-green-800">Photo uploaded successfully</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bride's Description</Label>
                  <Textarea
                    value={currentContent?.couple?.brideInfo?.description || ''}
                    onChange={(e) => onNestedContentUpdate('couple', 'brideInfo', 'description', e.target.value)}
                    placeholder="Tell your guests about the bride..."
                    className="w-full"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Father's Name</Label>
                    <Input
                      value={currentContent?.couple?.brideInfo?.fatherName || ''}
                      onChange={(e) => onNestedContentUpdate('couple', 'brideInfo', 'fatherName', e.target.value)}
                      placeholder="Father's name"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Mother's Name</Label>
                    <Input
                      value={currentContent?.couple?.brideInfo?.motherName || ''}
                      onChange={(e) => onNestedContentUpdate('couple', 'brideInfo', 'motherName', e.target.value)}
                      placeholder="Mother's name"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Groom Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 text-sm border-b pb-2">About the Groom</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Groom's Photo for "Meet the Couple" Section</Label>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="text-center mb-3">
                      <Camera className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs font-medium text-gray-900">Upload Groom's Photo</p>
                      <p className="text-xs text-gray-500">Single photo • 800x1000px recommended</p>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 <strong>Best photos:</strong> Professional portrait, engagement shoot, or handsome candid shot that represents the groom well
                      </p>
                    </div>
                    <MultiImageUpload
                      projectId={projectId}
                      galleryCategory="groom_photo"
                      onUploadComplete={(uploadedImages) => {
                        if (uploadedImages.length > 0) {
                          onNestedContentUpdate('couple', 'groomInfo', 'photoUrl', uploadedImages[0].url)
                          onGalleryUpdate()
                        }
                      }}
                      maxFiles={1}
                      maxSizePerFile={5}
                      className="w-full"
                    />
                  </div>
                  {currentContent?.couple?.groomInfo?.photoUrl && (
                    <div className="mt-2 flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img 
                          src={currentContent.couple.groomInfo.photoUrl} 
                          alt="Groom" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-green-800">Photo uploaded successfully</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Groom's Description</Label>
                  <Textarea
                    value={currentContent?.couple?.groomInfo?.description || ''}
                    onChange={(e) => onNestedContentUpdate('couple', 'groomInfo', 'description', e.target.value)}
                    placeholder="Tell your guests about the groom..."
                    className="w-full"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Father's Name</Label>
                    <Input
                      value={currentContent?.couple?.groomInfo?.fatherName || ''}
                      onChange={(e) => onNestedContentUpdate('couple', 'groomInfo', 'fatherName', e.target.value)}
                      placeholder="Father's name"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Mother's Name</Label>
                    <Input
                      value={currentContent?.couple?.groomInfo?.motherName || ''}
                      onChange={(e) => onNestedContentUpdate('couple', 'groomInfo', 'motherName', e.target.value)}
                      placeholder="Mother's name"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'style':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor" className="text-sm font-medium">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={currentStyles?.primaryColor || '#2563eb'}
                  onChange={(e) => onStyleUpdate('primaryColor', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={currentStyles?.primaryColor || '#2563eb'}
                  onChange={(e) => onStyleUpdate('primaryColor', e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor" className="text-sm font-medium">Secondary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={currentStyles?.secondaryColor || '#7c3aed'}
                  onChange={(e) => onStyleUpdate('secondaryColor', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={currentStyles?.secondaryColor || '#7c3aed'}
                  onChange={(e) => onStyleUpdate('secondaryColor', e.target.value)}
                  placeholder="#7c3aed"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fontFamily" className="text-sm font-medium">Font Style</Label>
              <Select value={currentStyles?.fontFamily || 'Inter, sans-serif'} onValueChange={(value) => onStyleUpdate('fontFamily', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter, sans-serif">Inter (Modern)</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia (Classic)</SelectItem>
                  <SelectItem value="Playfair Display, serif">Playfair Display (Elegant)</SelectItem>
                  <SelectItem value="Poppins, sans-serif">Poppins (Friendly)</SelectItem>
                  <SelectItem value="Cormorant Garamond, serif">Cormorant Garamond (Romantic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'effects':
        return (
          <div className="space-y-4">
            <ScrollEffectsEditor
              config={scrollEffects}
              onChange={onScrollEffectsUpdate}
              primaryColor={currentStyles?.primaryColor || '#2563eb'}
              secondaryColor={currentStyles?.secondaryColor || '#7c3aed'}
            />
          </div>
        )

      case 'socials':
        return (
          <div className="space-y-4">
            <SocialLinksEditor
              config={socialLinks}
              onChange={onSocialLinksUpdate}
              primaryColor={currentStyles?.primaryColor || '#2563eb'}
              secondaryColor={currentStyles?.secondaryColor || '#7c3aed'}
              showInputsWhenDisabled={true}
            />
          </div>
        )

      case 'events':
        return (
          <div className="space-y-4">
            {events && events.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 text-sm border-b pb-2">Your Wedding Events</h4>
                {events.map((event, index) => (
                  <div key={event.id || index} className="p-3 border rounded-lg bg-gray-50">
                    {editingEventIndex === index ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-medium">Event Name</Label>
                            <Input
                              value={editingEvent?.eventName || ''}
                              onChange={(e) => setEditingEvent({
                                ...editingEvent,
                                eventName: e.target.value
                              })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium">Venue Name</Label>
                            <Input
                              value={editingEvent?.venueName || ''}
                              onChange={(e) => setEditingEvent({
                                ...editingEvent,
                                venueName: e.target.value
                              })}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-medium">Date</Label>
                            <Input
                              type="date"
                              value={editingEvent?.eventDate || ''}
                              onChange={(e) => setEditingEvent({
                                ...editingEvent,
                                eventDate: e.target.value
                              })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium">Time</Label>
                            <Input
                              type="time"
                              value={editingEvent?.eventTime || ''}
                              onChange={(e) => setEditingEvent({
                                ...editingEvent,
                                eventTime: e.target.value
                              })}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Venue Address</Label>
                          <Input
                            value={editingEvent?.venueAddress || ''}
                            onChange={(e) => setEditingEvent({
                              ...editingEvent,
                              venueAddress: e.target.value
                            })}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Description</Label>
                          <Textarea
                            value={editingEvent?.eventDescription || ''}
                            onChange={(e) => setEditingEvent({
                              ...editingEvent,
                              eventDescription: e.target.value
                            })}
                            className="text-sm"
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingEventIndex(null)
                              setEditingEvent(null)
                            }}
                            className="text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const updatedEvents = [...events]
                              updatedEvents[index] = editingEvent
                              onEventsUpdate(updatedEvents)
                              setEditingEventIndex(null)
                              setEditingEvent(null)
                            }}
                            className="text-xs"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{event.eventName}</p>
                          <p className="text-xs text-gray-600">{event.eventDate} {event.eventTime}</p>
                          <p className="text-xs text-gray-500">{event.venueName}</p>
                          {event.venueAddress && (
                            <p className="text-xs text-gray-500">{event.venueAddress}</p>
                          )}
                          {event.eventDescription && (
                            <p className="text-xs text-gray-600 mt-1">{event.eventDescription}</p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingEventIndex(index)
                              setEditingEvent({ ...event })
                            }}
                            className="text-blue-500 hover:text-blue-700 text-xs p-1"
                            title="Edit event"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const newEvents = events.filter((_, i) => i !== index)
                              onEventsUpdate(newEvents)
                            }}
                            className="text-red-500 hover:text-red-700 text-xs p-1"
                            title="Remove event"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <Calendar className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No events added yet</p>
              </div>
            )}

            {/* Add Event Form */}
            {editingEventIndex === null && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-gray-900 text-sm">Add New Event</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Event Name</Label>
                  <Input
                    placeholder="e.g., Ceremony, Reception"
                    className="w-full"
                    id="newEventName"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Venue Name</Label>
                  <Input
                    placeholder="e.g., St. Mary's Church"
                    className="w-full"
                    id="newVenueName"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date</Label>
                  <Input
                    type="date"
                    className="w-full"
                    id="newEventDate"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Time</Label>
                  <Input
                    type="time"
                    className="w-full"
                    id="newEventTime"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Venue Address</Label>
                <Input
                  placeholder="Full address for guests"
                  className="w-full"
                  id="newVenueAddress"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Event Description (Optional)</Label>
                <Textarea
                  placeholder="Additional details about this event..."
                  className="w-full"
                  rows={2}
                  id="newEventDescription"
                />
              </div>
              <Button 
                onClick={() => {
                  const eventNameEl = document.getElementById('newEventName') as HTMLInputElement
                  const venueNameEl = document.getElementById('newVenueName') as HTMLInputElement
                  const eventDateEl = document.getElementById('newEventDate') as HTMLInputElement
                  const eventTimeEl = document.getElementById('newEventTime') as HTMLInputElement
                  const venueAddressEl = document.getElementById('newVenueAddress') as HTMLInputElement
                  const eventDescriptionEl = document.getElementById('newEventDescription') as HTMLTextAreaElement

                  if (eventNameEl.value && eventDateEl.value) {
                    const newEvent = {
                      id: Date.now().toString(),
                      eventName: eventNameEl.value,
                      eventDate: eventDateEl.value,
                      eventTime: eventTimeEl.value,
                      venueName: venueNameEl.value,
                      venueAddress: venueAddressEl.value,
                      eventDescription: eventDescriptionEl.value
                    }
                    
                    onEventsUpdate([...events, newEvent])
                    
                    // Clear form
                    eventNameEl.value = ''
                    venueNameEl.value = ''
                    eventDateEl.value = ''
                    eventTimeEl.value = ''
                    venueAddressEl.value = ''
                    eventDescriptionEl.value = ''
                  }
                }}
                className="w-full"
                size="sm"
              >
                Add Event
              </Button>
              </div>
            )}

            {editingEventIndex !== null && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 Finish editing the current event before adding a new one.
                </p>
              </div>
            )}
          </div>
        )

      case 'venue':
        return (
          <div className="space-y-4">
            {/* Address Search */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm border-b pb-2">Find Your Venue</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for venue address (e.g., Grand Palace Hotel, Mumbai)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-600 font-medium">Search Results:</p>
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => selectLocation(result)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-xs">{result.display_name.split(',')[0]}</p>
                          <p className="text-xs text-gray-600 mt-1 truncate">{result.display_name}</p>
                        </div>
                        <Target className="h-3 w-3 text-green-600 ml-2 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Map */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 text-sm">Interactive Map</h4>
                {hasLocation && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    <Target className="h-2 w-2 mr-1" />
                    Location Set
                  </Badge>
                )}
              </div>
              
              {isMounted ? (
                <ErrorBoundary
                  fallback={
                    <div 
                      className="border-2 border-gray-300 rounded-lg flex items-center justify-center bg-yellow-50"
                      style={{ height: '300px' }}
                    >
                      <div className="text-center text-gray-600">
                        <MapPin className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                        <p className="text-sm font-medium">Map temporarily unavailable</p>
                        <p className="text-xs text-gray-500 mt-1">Your venue information is still saved</p>
                      </div>
                    </div>
                  }
                >
                  <LeafletMap
                    center={mapLocation ? [mapLocation.latitude, mapLocation.longitude] : [40.7128, -74.0060]}
                    zoom={mapLocation ? 15 : 10}
                    height="300px"
                    onClick={(lat, lng) => updateLocationByCoords(lat, lng)}
                    markers={mapLocation ? [{
                      position: [mapLocation.latitude, mapLocation.longitude],
                      draggable: true,
                      onDragEnd: (lat, lng) => updateLocationByCoords(lat, lng),
                      popup: (
                        <div className="text-center">
                          <strong className="text-blue-600">{mapLocation.venueName}</strong>
                          <br />
                          <span className="text-sm text-gray-600">{mapLocation.address}</span>
                        </div>
                      )
                    }] : []}
                    className="border-2 border-gray-200 rounded-lg"
                  />
                </ErrorBoundary>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
                  style={{ height: '300px' }}
                >
                  <div className="text-center text-gray-500">
                    <MapPin className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm">Loading interactive map...</p>
                  </div>
                </div>
              )}

              {hasLocation && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium text-sm">Location Set Successfully!</span>
                  </div>
                  <p className="text-green-700 text-xs mt-1">
                    Coordinates: {mapLocation!.latitude.toFixed(6)}, {mapLocation!.longitude.toFixed(6)}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-600">
                {hasLocation 
                  ? "💡 Drag the marker or click on the map to adjust the location" 
                  : "💡 Click on the map to set your venue location"
                }
              </p>
            </div>

            {/* Venue Details */}
            {hasLocation && (
              <div className="space-y-3 border-t pt-3">
                <h4 className="font-medium text-gray-900 text-sm">Venue Details</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Venue Name</Label>
                    <Input
                      value={mapLocation?.venueName || ''}
                      onChange={(e) => {
                        if (mapLocation) {
                          onVenueUpdate({
                            ...mapLocation,
                            venueName: e.target.value
                          })
                        }
                      }}
                      placeholder="Enter venue name"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Address</Label>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{mapLocation!.address}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Description (Optional)</Label>
                    <Textarea
                      value={mapLocation?.description || ''}
                      onChange={(e) => {
                        if (mapLocation) {
                          onVenueUpdate({
                            ...mapLocation,
                            description: e.target.value
                          })
                        }
                      }}
                      placeholder="Add a description about the venue..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showDirections"
                      checked={mapLocation?.showDirections || false}
                      onChange={(e) => {
                        if (mapLocation) {
                          onVenueUpdate({
                            ...mapLocation,
                            showDirections: e.target.checked
                          })
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="showDirections" className="text-sm">
                      Show "Get Directions" button for guests
                    </Label>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearLocation}
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear Location
                    </Button>
                    
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                      <MapPin className="h-2 w-2 mr-1" />
                      Ready for Website
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {!hasLocation && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  🗺️ Search for your venue above or click on the map to set the location for your wedding website!
                </p>
              </div>
            )}
          </div>
        )

      case 'gallery':
        // Define photo sections like advanced editor
        const photoSections = [
          { 
            id: 'hero', 
            name: 'Hero Image', 
            description: 'Main background photo for your website',
            icon: Images,
            color: 'bg-blue-100 text-blue-800',
            maxPhotos: 1,
            recommended: '1920x1080px'
          },
          { 
            id: 'couple', 
            name: 'Couple Photos', 
            description: 'Individual photos of bride and groom for the "Meet the Couple" section',
            icon: Heart,
            color: 'bg-pink-100 text-pink-800',
            maxPhotos: 2,
            recommended: '800x1000px'
          },
          { 
            id: 'bride', 
            name: 'Bride Photos', 
            description: 'Beautiful photos of the bride - solo portraits and moments',
            icon: Heart,
            color: 'bg-rose-100 text-rose-800',
            maxPhotos: 8,
            recommended: '1000x1200px'
          },
          { 
            id: 'groom', 
            name: 'Groom Photos', 
            description: 'Handsome photos of the groom - solo portraits and moments',
            icon: Heart,
            color: 'bg-blue-100 text-blue-800',
            maxPhotos: 8,
            recommended: '1000x1200px'
          },
          { 
            id: 'pre_wedding', 
            name: 'Pre-Wedding', 
            description: 'Pre-wedding photoshoot images',
            icon: Camera,
            color: 'bg-purple-100 text-purple-800',
            maxPhotos: 20,
            recommended: '1200x800px'
          },
          { 
            id: 'engagement', 
            name: 'Engagement', 
            description: 'Engagement ceremony photos',
            icon: Star,
            color: 'bg-yellow-100 text-yellow-800',
            maxPhotos: 15,
            recommended: '1200x800px'
          },
          { 
            id: 'family', 
            name: 'Family', 
            description: 'Family photos and moments',
            icon: Users,
            color: 'bg-green-100 text-green-800',
            maxPhotos: 10,
            recommended: '1000x800px'
          }
        ]

        const handleSectionUpload = async (sectionId: string, uploadedImages: Array<{ url: string; fileName: string }>) => {
          console.log(`Successfully uploaded ${uploadedImages.length} files to ${sectionId}`)
          // Refresh gallery data to show new images
          onGalleryUpdate()
        }

        // Get images by section
        const getImagesBySection = (sectionId: string) => {
          if (sectionId === 'hero') {
            return galleryImages.filter(img => 
              img.section_type === 'hero' || 
              img.gallery_category === 'hero' ||
              img.section_type === 'gallery_hero'
            )
          }
          if (sectionId === 'couple') {
            return galleryImages.filter(img => 
              img.section_type === 'couple' || 
              img.gallery_category === 'couple' ||
              img.section_type === 'gallery_couple'
            )
          }
          return galleryImages.filter(img => 
            img.gallery_category === sectionId ||
            img.section_type === `gallery_${sectionId}`
          )
        }

        return (
          <div className="space-y-4">
            {/* Header with Overview */}
            <div className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Photo Gallery Setup</h4>
                  <p className="text-xs text-gray-600">
                    Upload photos for different sections • {galleryImages.length} photos total
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllSections(false)}
                    className="text-xs"
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllSections(true)}
                    className="text-xs"
                  >
                    Collapse All
                  </Button>
                </div>
              </div>
            </div>


            {/* Photo Sections */}
            <div className="space-y-4">
              {photoSections.map((section) => {
                const sectionImages = getImagesBySection(section.id)
                const SectionIcon = section.icon
                const isCollapsed = collapsedSections[section.id] || false

                return (
                  <div key={section.id} className="border rounded-lg overflow-hidden">
                    {/* Section Header - Always Visible */}
                    <div 
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <SectionIcon className="h-4 w-4 text-gray-600" />
                        <div>
                          <h5 className="font-medium text-sm">{section.name}</h5>
                          <p className="text-xs text-gray-600">{section.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={section.color}>
                          {sectionImages.length}/{section.maxPhotos}
                        </Badge>
                        {sectionImages.length >= section.maxPhotos && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <Check className="h-2 w-2 mr-1" />
                            Complete
                          </Badge>
                        )}
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Section Content - Collapsible */}
                    {!isCollapsed && (
                      <div className="p-4 space-y-3">

                    {/* Upload Area for Section */}
                    {sectionImages.length < section.maxPhotos && (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <div className="text-center mb-3">
                          <Upload className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs font-medium text-gray-900">
                            Upload {section.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {section.maxPhotos === 1 ? 'Single photo' : `Up to ${section.maxPhotos} photos`} • {section.recommended}
                          </p>
                          {section.id === 'couple' && (
                            <p className="text-xs text-blue-600 mt-1">
                              💡 Upload one photo each for bride and groom to display in the "Meet the Couple" section
                            </p>
                          )}
                          {section.id === 'bride' && (
                            <p className="text-xs text-rose-600 mt-1">
                              💄 <strong>What to include:</strong> Solo bride portraits, getting ready moments, bridal outfits, henna ceremony, and special bride-focused shots. First photo may appear in "Meet the Couple" if no specific couple photo is uploaded.
                            </p>
                          )}
                          {section.id === 'groom' && (
                            <p className="text-xs text-blue-600 mt-1">
                              👔 <strong>What to include:</strong> Solo groom portraits, getting ready moments, traditional outfits, sangeet performance, and special groom-focused shots. First photo may appear in "Meet the Couple" if no specific couple photo is uploaded.
                            </p>
                          )}
                        </div>
                        <MultiImageUpload
                          projectId={projectId}
                          galleryCategory={section.id}
                          onUploadComplete={(uploadedImages) => handleSectionUpload(section.id, uploadedImages)}
                          maxFiles={section.maxPhotos - sectionImages.length}
                          maxSizePerFile={5}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Current Images in Section */}
                    {sectionImages.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-gray-600">
                            Current {section.name} ({sectionImages.length})
                          </Label>
                          {sectionImages.length < section.maxPhotos && (
                            <div className="mt-2">
                              <MultiImageUpload
                                projectId={projectId}
                                galleryCategory={section.id}
                                onUploadComplete={(uploadedImages) => handleSectionUpload(section.id, uploadedImages)}
                                maxFiles={section.maxPhotos - sectionImages.length}
                                maxSizePerFile={5}
                                className="w-full text-xs"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className={`grid gap-2 ${
                          section.maxPhotos === 1 ? 'grid-cols-1' :
                          section.maxPhotos === 2 ? 'grid-cols-2' : 'grid-cols-3'
                        }`}>
                          {sectionImages.map((image, index) => (
                            <div key={image.id || index} className="relative group">
                              <img
                                src={image.file_url}
                                alt={`${section.name} ${index + 1}`}
                                className={`w-full object-cover rounded-lg ${
                                  section.maxPhotos === 1 ? 'h-24' :
                                  section.maxPhotos === 2 ? 'h-20' : 'h-16'
                                }`}
                              />
                              
                              {/* Image Actions */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:text-white p-1"
                                    onClick={() => window.open(image.file_url, '_blank')}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:text-red-300 p-1"
                                    onClick={() => {
                                      // Delete functionality
                                      onGalleryUpdate()
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Image Info */}
                              <div className="absolute bottom-1 left-1 right-1">
                                <div className="bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded text-center">
                                  {section.name} {index + 1}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section Status */}
                    <div className="text-xs text-gray-500">
                      {sectionImages.length === 0 && (
                        <span>No {section.name.toLowerCase()} uploaded yet</span>
                      )}
                      {sectionImages.length > 0 && sectionImages.length < section.maxPhotos && (
                        <span>{section.maxPhotos - sectionImages.length} more photos can be added</span>
                      )}
                      {sectionImages.length >= section.maxPhotos && (
                        <span className="text-green-600">✓ Section complete</span>
                      )}
                    </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Gallery Style Selection */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Gallery Style</h4>
                    <p className="text-xs text-gray-600">Choose how your photos will be displayed on the website</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedGalleryStyle === 'grid' 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedGalleryStyle('grid')
                      onStyleUpdate('galleryStyle', 'grid')
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Grid3X3 className={`h-3 w-3 ${
                        selectedGalleryStyle === 'grid' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <span className={`text-xs font-medium ${
                        selectedGalleryStyle === 'grid' ? 'text-blue-900' : 'text-gray-900'
                      }`}>Grid Layout</span>
                    </div>
                    <p className="text-xs text-gray-600">Clean, organized grid</p>
                    {selectedGalleryStyle === 'grid' && (
                      <div className="mt-2">
                        <Check className="h-3 w-3 text-blue-600" />
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedGalleryStyle === 'masonry' 
                        ? 'bg-purple-50 border-purple-200' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedGalleryStyle('masonry')
                      onStyleUpdate('galleryStyle', 'masonry')
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <LayoutGrid className={`h-3 w-3 ${
                        selectedGalleryStyle === 'masonry' ? 'text-purple-600' : 'text-gray-600'
                      }`} />
                      <span className={`text-xs font-medium ${
                        selectedGalleryStyle === 'masonry' ? 'text-purple-900' : 'text-gray-900'
                      }`}>Masonry</span>
                    </div>
                    <p className="text-xs text-gray-600">Pinterest-style layout</p>
                    {selectedGalleryStyle === 'masonry' && (
                      <div className="mt-2">
                        <Check className="h-3 w-3 text-purple-600" />
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedGalleryStyle === 'slideshow' 
                        ? 'bg-green-50 border-green-200' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedGalleryStyle('slideshow')
                      onStyleUpdate('galleryStyle', 'single-carousel')
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Images className={`h-3 w-3 ${
                        selectedGalleryStyle === 'slideshow' ? 'text-green-600' : 'text-gray-600'
                      }`} />
                      <span className={`text-xs font-medium ${
                        selectedGalleryStyle === 'slideshow' ? 'text-green-900' : 'text-gray-900'
                      }`}>Slideshow</span>
                    </div>
                    <p className="text-xs text-gray-600">Full-screen carousel</p>
                    {selectedGalleryStyle === 'slideshow' && (
                      <div className="mt-2">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      userTier === 'gold' || userTier === 'platinum'
                        ? selectedGalleryStyle === 'timeline'
                          ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                          : 'border-gray-200 hover:bg-gray-50'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (userTier === 'gold' || userTier === 'platinum') {
                        setSelectedGalleryStyle('timeline')
                        onStyleUpdate('galleryStyle', 'timeline')
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Crown className={`h-3 w-3 ${
                        selectedGalleryStyle === 'timeline' && (userTier === 'gold' || userTier === 'platinum')
                          ? 'text-amber-600' 
                          : 'text-amber-600'
                      }`} />
                      <span className={`text-xs font-medium ${
                        selectedGalleryStyle === 'timeline' && (userTier === 'gold' || userTier === 'platinum')
                          ? 'text-amber-900' 
                          : 'text-gray-900'
                      }`}>Timeline</span>
                    </div>
                    <p className={`text-xs ${
                      userTier === 'gold' || userTier === 'platinum'
                        ? 'text-gray-600'
                        : 'text-amber-600'
                    }`}>
                      {userTier === 'gold' || userTier === 'platinum' 
                        ? 'Event-based timeline' 
                        : 'Premium feature'
                      }
                    </p>
                    {selectedGalleryStyle === 'timeline' && (userTier === 'gold' || userTier === 'platinum') && (
                      <div className="mt-2">
                        <Check className="h-3 w-3 text-amber-600" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-blue-900">
                      Currently Selected: {selectedGalleryStyle.charAt(0).toUpperCase() + selectedGalleryStyle.slice(1)} Layout
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {selectedGalleryStyle === 'grid' && '📱'}
                      {selectedGalleryStyle === 'masonry' && '🧱'}
                      {selectedGalleryStyle === 'slideshow' && '🎞️'}
                      {selectedGalleryStyle === 'timeline' && '📅'}
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-800">
                    🎨 <strong>Gallery Style Tips:</strong> Grid layout works best for mixed photo sizes • 
                    Masonry is perfect for vertical photos • Slideshow highlights individual moments • 
                    Timeline organizes by events (Premium)
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Questions */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 text-sm">Gallery Preferences</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Allow guests to download photos?</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="rounded" 
                        checked={galleryPreferences.allowDownload}
                        onChange={(e) => setGalleryPreferences({
                          ...galleryPreferences,
                          allowDownload: e.target.checked
                        })}
                      />
                      <span className="text-xs text-gray-600">
                        {galleryPreferences.allowDownload ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Show photo captions?</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="rounded" 
                        checked={galleryPreferences.showCaptions}
                        onChange={(e) => setGalleryPreferences({
                          ...galleryPreferences,
                          showCaptions: e.target.checked
                        })}
                      />
                      <span className="text-xs text-gray-600">
                        {galleryPreferences.showCaptions ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Auto-play slideshow?</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="rounded" 
                        checked={galleryPreferences.autoPlay}
                        onChange={(e) => setGalleryPreferences({
                          ...galleryPreferences,
                          autoPlay: e.target.checked
                        })}
                      />
                      <span className="text-xs text-gray-600">
                        {galleryPreferences.autoPlay ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Overall Progress</span>
                <span className="text-xs text-gray-600">
                  {photoSections.filter(s => getImagesBySection(s.id).length > 0).length}/{photoSections.length} sections started
                </span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(photoSections.filter(s => getImagesBySection(s.id).length > 0).length / photoSections.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                📸 <strong>Upload Guide:</strong> Start with Hero Image for website background • 
                Add Couple Photos (1 for bride, 1 for groom) for the "Meet the Couple" section • 
                Upload individual Bride & Groom Photos for solo portraits and special moments •
                Include Pre-Wedding and Engagement photos to share your love story • 
                Family photos add warmth to your gallery!
              </p>
            </div>
          </div>
        )

      case 'rsvp':
        return (
          <div className="space-y-4">
            {/* Subscription Check */}
            {userTier === 'free' || userTier === 'silver' ? (
              <div className="space-y-4">
                <div className="text-center p-6 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50">
                  <Users className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-amber-800 mb-2 font-medium">RSVP Feature Locked</p>
                  <p className="text-xs text-amber-700">Upgrade to Gold or Platinum to enable guest RSVP collection</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 text-sm">RSVP Features Include:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Guest response collection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Meal preference selection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Plus-one management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>RSVP deadline tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Guest list management</span>
                    </li>
                  </ul>
                </div>

                <Button className="w-full" onClick={() => {/* Handle upgrade */}}>
                  Upgrade to Enable RSVP
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* RSVP Enable/Disable */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Enable RSVP Form</h4>
                    <p className="text-sm text-gray-600">Allow guests to RSVP for your wedding</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rsvpConfig?.isEnabled || false}
                      onChange={(e) => onRSVPUpdate({
                        ...rsvpConfig,
                        isEnabled: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {rsvpConfig?.isEnabled && (
                  <div className="space-y-4 border-t pt-4">
                    {/* RSVP Configuration */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">RSVP Section Title</Label>
                        <Input
                          value={rsvpConfig?.title || 'RSVP'}
                          onChange={(e) => onRSVPUpdate({
                            ...rsvpConfig,
                            title: e.target.value
                          })}
                          placeholder="e.g., RSVP, Please Respond"
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">RSVP Message</Label>
                        <Textarea
                          value={rsvpConfig?.subtitle || ''}
                          onChange={(e) => onRSVPUpdate({
                            ...rsvpConfig,
                            subtitle: e.target.value
                          })}
                          placeholder="Please let us know if you'll be joining us for our special day!"
                          className="w-full"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          <Calendar className="inline w-4 h-4 mr-1" />
                          RSVP Deadline (Optional)
                        </Label>
                        <Input
                          type="date"
                          value={rsvpConfig?.deadline || ''}
                          onChange={(e) => onRSVPUpdate({
                            ...rsvpConfig,
                            deadline: e.target.value
                          })}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty for no deadline. Guests won't be able to RSVP after this date.
                        </p>
                      </div>

                      {/* Confirmation Message */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          <MessageSquare className="inline w-4 h-4 mr-1" />
                          Thank You Message
                        </Label>
                        <Textarea
                          value={rsvpConfig?.confirmationMessage || 'Thank you for your RSVP! We can\'t wait to celebrate with you.'}
                          onChange={(e) => onRSVPUpdate({
                            ...rsvpConfig,
                            confirmationMessage: e.target.value
                          })}
                          placeholder="Thank you for your RSVP! We can't wait to celebrate with you."
                          className="w-full"
                          rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This message will be shown to guests after they submit their RSVP.
                        </p>
                      </div>


                      {/* Optional Questions */}
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-800">
                          Optional Questions
                        </h4>

                        {/* Dance Song Question */}
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                              <Music className="w-4 h-4 mr-2" />
                              Dance Song Question
                            </Label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rsvpConfig?.danceSongEnabled || false}
                                onChange={(e) => onRSVPUpdate({
                                  ...rsvpConfig,
                                  danceSongEnabled: e.target.checked
                                })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                          {rsvpConfig?.danceSongEnabled && (
                            <Input
                              value={rsvpConfig?.danceSongQuestion || 'What song will definitely get you on the dance floor?'}
                              onChange={(e) => onRSVPUpdate({
                                ...rsvpConfig,
                                danceSongQuestion: e.target.value
                              })}
                              placeholder="What song will definitely get you on the dance floor?"
                              className="w-full"
                            />
                          )}
                        </div>

                        {/* Advice Question */}
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                              <Heart className="w-4 h-4 mr-2" />
                              Advice Question
                            </Label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rsvpConfig?.adviceEnabled || false}
                                onChange={(e) => onRSVPUpdate({
                                  ...rsvpConfig,
                                  adviceEnabled: e.target.checked
                                })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                          {rsvpConfig?.adviceEnabled && (
                            <Input
                              value={rsvpConfig?.adviceQuestion || 'Any advice for the newlyweds?'}
                              onChange={(e) => onRSVPUpdate({
                                ...rsvpConfig,
                                adviceQuestion: e.target.value
                              })}
                              placeholder="Any advice for the newlyweds?"
                              className="w-full"
                            />
                          )}
                        </div>

                        {/* Memory Question */}
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="flex items-center text-sm font-medium text-gray-700">
                              <Star className="w-4 h-4 mr-2" />
                              Memory Question
                            </Label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rsvpConfig?.memoryEnabled || false}
                                onChange={(e) => onRSVPUpdate({
                                  ...rsvpConfig,
                                  memoryEnabled: e.target.checked
                                })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                          {rsvpConfig?.memoryEnabled && (
                            <Input
                              value={rsvpConfig?.memoryQuestion || 'What\'s your favorite memory with the couple?'}
                              onChange={(e) => onRSVPUpdate({
                                ...rsvpConfig,
                                memoryQuestion: e.target.value
                              })}
                              placeholder="What's your favorite memory with the couple?"
                              className="w-full"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-800">
                        ✅ RSVP is configured! Guests will be able to respond directly on your wedding website.
                      </p>
                    </div>
                  </div>
                )}

                {!rsvpConfig?.isEnabled && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">
                      💡 Enable RSVP to collect guest responses directly on your wedding website.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'wishes':
        return (
          <div className="space-y-4">
            {/* Subscription Check for Advanced Features */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 text-sm">Enable Guest Messages</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableWishes"
                    defaultChecked={true}
                    className="rounded"
                  />
                  <Label htmlFor="enableWishes" className="text-sm">Enabled</Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Section Title</Label>
                  <Input
                    defaultValue="Leave a Message"
                    placeholder="e.g., Wedding Wishes, Messages for the Couple"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Instructions for Guests</Label>
                  <Textarea
                    defaultValue="Share your wishes and blessings for the happy couple!"
                    placeholder="Instructions that guests will see..."
                    className="w-full"
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Message Options</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requireName"
                        defaultChecked={true}
                        className="rounded"
                      />
                      <Label htmlFor="requireName" className="text-sm">Require guest name</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowAnonymous"
                        defaultChecked={false}
                        className="rounded"
                      />
                      <Label htmlFor="allowAnonymous" className="text-sm">Allow anonymous messages</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="moderateMessages"
                        defaultChecked={userTier === 'gold' || userTier === 'platinum'}
                        disabled={userTier === 'free' || userTier === 'silver'}
                        className="rounded"
                      />
                      <Label htmlFor="moderateMessages" className="text-sm">
                        Moderate messages before displaying
                        {(userTier === 'free' || userTier === 'silver') && (
                          <span className="text-amber-600 ml-1">(Premium feature)</span>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Character Limit</Label>
                  <Select defaultValue="500">
                    <SelectTrigger>
                      <SelectValue placeholder="Choose character limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="200">200 characters</SelectItem>
                      <SelectItem value="500">500 characters</SelectItem>
                      <SelectItem value="1000">1000 characters</SelectItem>
                      <SelectItem value="unlimited">No limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-800">
                  💌 Guests will be able to leave heartfelt messages and wishes on your wedding website.
                </p>
              </div>

              {(userTier === 'free' || userTier === 'silver') && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-xs text-amber-800">
                    ⭐ Upgrade to Gold or Platinum for message moderation and advanced guest message features.
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'music':
        return (
          <div className="space-y-4">
            <BackgroundMusicEditor
              projectId={projectId}
              config={backgroundMusic}
              onChange={onBackgroundMusicUpdate}
              userTier={userTier}
              onUpgrade={(tier) => {
                // Handle upgrade - could show modal or redirect
                alert(`Upgrade to ${tier} plan to unlock this feature!`)
              }}
            />
          </div>
        )

      default:
        return <div>Form not available for this step</div>
    }
  }

  if (!showWizard) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Setup Your Wedding Website</h2>
            <p className="text-xs text-gray-600">Follow these steps to create your perfect wedding website</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkipWizard} className="text-xs">
            Skip Wizard
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{completedSteps} of {totalSteps} completed</span>
            <span className="text-green-600 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps Overview */}
        <div className="grid grid-cols-3 gap-1.5">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              className={`p-1.5 rounded-lg text-left transition-all duration-200 ${
                index === currentStepIndex
                  ? 'bg-blue-50 border-2 border-blue-200'
                  : step.isCompleted
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <div className={`p-0.5 rounded ${
                  step.isCompleted 
                    ? 'bg-green-100 text-green-600'
                    : index === currentStepIndex
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {step.isCompleted ? <Check className="h-2.5 w-2.5" /> : 
                   React.cloneElement(step.icon as React.ReactElement, { className: "h-2.5 w-2.5" })
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium truncate leading-tight">{step.title}</p>
                  {step.isOptional && (
                    <Badge variant="secondary" className="text-[8px] mt-0.5 px-1 py-0">Optional</Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Step Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                {React.cloneElement(currentStep.icon as React.ReactElement, { className: "h-4 w-4" })}
              </div>
              <div>
                <CardTitle className="text-sm">{currentStep.title}</CardTitle>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span className="truncate max-w-[200px]">{currentStep.description}</span>
                  <Badge variant="outline" className="text-[10px] px-1">
                    ~{currentStep.estimatedTime}
                  </Badge>
                  {currentStep.isOptional && (
                    <Badge variant="secondary" className="text-[10px] px-1">Optional</Badge>
                  )}
                </div>
              </div>
            </div>
            {currentStep.isCompleted && (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Complete</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>

            {currentStepIndex === steps.length - 1 ? (
              <Button
                onClick={handleSkipWizard}
                className="flex items-center"
                size="sm"
              >
                Finish Setup
                <Check className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center"
                size="sm"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Form Content */}
      <Card>
        <CardContent className="pt-4">
          {renderStepForm()}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-medium text-blue-900 mb-1 text-sm">💡 Quick Tip</h4>
        <p className="text-xs text-blue-800">
          {currentStep.id === 'content' && "Start with the basics - your names and wedding date. You can always come back and add more details later!"}
          {currentStep.id === 'style' && "Choose colors that match your wedding theme or personal style. Don't worry, you can change these anytime."}
          {currentStep.id === 'events' && "Add your main events like ceremony and reception. Include times and locations to help guests plan."}
          {currentStep.id === 'venue' && "Adding a map helps guests find your venue easily. This step is optional but highly recommended."}
          {currentStep.id === 'gallery' && "Share your story with engagement photos or memories. This makes your website more personal and engaging."}
          {currentStep.id === 'rsvp' && "Enable RSVP to track guest responses digitally. This feature requires Gold or Platinum subscription."}
          {currentStep.id === 'music' && "Add beautiful background music to enhance your guests' experience. Choose from presets or upload your own. Requires Gold or Platinum subscription."}
        </p>
      </div>
    </div>
  )
}