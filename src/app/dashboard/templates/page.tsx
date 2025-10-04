// File: src/app/templates/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  Filter,
  Eye,
  ArrowRight,
  Star,
  Crown,
  Sparkles,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Template, UserProfile, User } from '@/types'

// Simple loading component
const SimpleLoading = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }
  
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-purple-600 ${sizeClasses[size]}`} />
    </div>
  )
}

// Helper function to check if user can access feature
const canAccessFeature = (
  userTier: 'free' | 'silver' | 'gold' | 'platinum',
  requiredTier: 'free' | 'silver' | 'gold' | 'platinum'
): boolean => {
  const tierLevels = {
    free: 0,
    silver: 1,
    gold: 2,
    platinum: 3
  }
  
  return tierLevels[userTier] >= tierLevels[requiredTier]
}

// Template categories configuration
const TEMPLATE_CATEGORIES = {
  traditional: { name: 'Traditional', icon: '👑' },
  modern: { name: 'Modern', icon: '✨' },
  rustic: { name: 'Rustic', icon: '🌿' },
  destination: { name: 'Destination', icon: '🏖️' },
  minimalist: { name: 'Minimalist', icon: '⚪' }
} as const

// Mock templates data (fallback if database is empty)
const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Royal Traditional',
    description: 'Elegant traditional design with golden accents, perfect for classic Indian weddings',
    preview_image_url: undefined,
    category: 'traditional',
    configuration: {
      colors: ['#D4AF37', '#8B0000', '#FFF'],
      sections: ['hero', 'couple', 'events', 'venue', 'wishes']
    },
    tier_required: 'free',
    is_active: true,
    popularity_score: 95,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export default function TemplatesPage() {
  const router = useRouter()
  
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [creatingProject, setCreatingProject] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectSubdomain, setProjectSubdomain] = useState('')
  const [titleError, setTitleError] = useState('')
  const [subdomainError, setSubdomainError] = useState('')

  const categories = [
    { id: 'all', name: 'All Templates', icon: '🎨' },
    ...Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => ({
      id: key,
      name: category.name,
      icon: category.icon
    }))
  ]

  // Check authentication and load user data
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        setUser(authUser)

        if (authUser) {
          // Get user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (profile) {
            setUserProfile(profile)
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
      }
    }

    checkUser()
  }, [])

  useEffect(() => {
    // Load templates from Supabase database
    const loadTemplates = async () => {
      try {
        setLoading(true)
        
        // Fetch templates from database
        const { data: templatesData, error } = await supabase
          .from('templates')
          .select('*')
          .eq('is_active', true)
          .order('popularity_score', { ascending: false })

        if (error) {
          console.error('Error loading templates:', error)
          // Fallback to mock data if database fails
          setTemplates(mockTemplates)
          setFilteredTemplates(mockTemplates)
        } else {
          // Use database templates if available, otherwise fallback to mock
          const templates = templatesData && templatesData.length > 0 ? templatesData : mockTemplates
          setTemplates(templates)
          setFilteredTemplates(templates)
        }
      } catch (error) {
        console.error('Error loading templates:', error)
        // Fallback to mock data on any error
        setTemplates(mockTemplates)
        setFilteredTemplates(mockTemplates)
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [])

  useEffect(() => {
    let filtered = templates

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort templates: eligible templates first, then by popularity
    filtered = filtered.sort((a, b) => {
      const canAccessA = userProfile ? canAccessFeature(userProfile.current_subscription, a.tier_required) : a.tier_required === 'free'
      const canAccessB = userProfile ? canAccessFeature(userProfile.current_subscription, b.tier_required) : b.tier_required === 'free'
      
      // If access status is different, prioritize accessible ones
      if (canAccessA && !canAccessB) return -1
      if (!canAccessA && canAccessB) return 1
      
      // If same access status, sort by popularity
      return b.popularity_score - a.popularity_score
    })

    setFilteredTemplates(filtered)
  }, [templates, selectedCategory, searchQuery, userProfile])

  const createProject = async (template: Template, title: string, subdomain: string) => {
    if (!user || !userProfile) return null

    try {
      const { data, error } = await supabase
        .from('wedding_projects')
        .insert([
          {
            user_id: user.id,
            title: title,
            template_id: template.id,
            subdomain: subdomain,
            subscription_tier: userProfile.current_subscription || 'free',
            project_status: 'draft',
            is_published: false,
            view_count: 0
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating project:', error)
      return null
    }
  }

  const handleCreateProject = async () => {
    if (!selectedTemplate) return

    const isTitleValid = validateTitle(projectTitle)
    const isSubdomainValid = validateSubdomain(projectSubdomain)

    if (!isTitleValid || !isSubdomainValid) {
      return
    }

    setCreatingProject(selectedTemplate.id)

    try {
      const project = await createProject(selectedTemplate, projectTitle, projectSubdomain)

      if (project) {
        closeModal()
        router.push(`/editor/${project.id}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setCreatingProject(null)
    }
  }

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'silver': return 'secondary'
      case 'gold': return 'default'
      case 'platinum': return 'default'
      default: return 'default'
    }
  }

  const canUserAccessTemplate = (template: Template) => {
    if (!userProfile) return template.tier_required === 'free'
    return canAccessFeature(userProfile.current_subscription, template.tier_required)
  }

  const validateTitle = (title: string) => {
    if (!title.trim()) {
      setTitleError('Title is required')
      return false
    }
    if (title.length > 255) {
      setTitleError('Title must be 255 characters or less')
      return false
    }
    setTitleError('')
    return true
  }

  const validateSubdomain = (subdomain: string) => {
    if (!subdomain.trim()) {
      setSubdomainError('Subdomain is required')
      return false
    }
    if (subdomain.length > 100) {
      setSubdomainError('Subdomain must be 100 characters or less')
      return false
    }
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      setSubdomainError('Subdomain can only contain lowercase letters, numbers, and hyphens')
      return false
    }
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      setSubdomainError('Subdomain cannot start or end with a hyphen')
      return false
    }
    setSubdomainError('')
    return true
  }

  const openModal = (template: Template) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!userProfile) {
      console.error('User or profile not loaded')
      return
    }

    if (!canAccessFeature(userProfile.current_subscription, template.tier_required)) {
      router.push('/dashboard/settings?upgrade=true')
      return
    }

    setSelectedTemplate(template)
    setProjectTitle(`My ${template.name} Wedding`)
    setProjectSubdomain(`${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 30)}-${Date.now()}`)
    setTitleError('')
    setSubdomainError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedTemplate(null)
    setProjectTitle('')
    setProjectSubdomain('')
    setTitleError('')
    setSubdomainError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SimpleLoading size="lg" />
        <p className="ml-4 text-gray-600">Loading beautiful templates...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Choose Your Template</h1>
                <p className="mt-2 text-gray-600">
                  Select from our collection of beautiful, professionally designed wedding templates
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length > 0 ? (
          <div>
            {/* Available Templates Section */}
            {filteredTemplates.some(t => canUserAccessTemplate(t)) && (
              <div className="mb-12">
                <div className="flex items-center mb-6">
                  <div className="h-px bg-purple-200 flex-1"></div>
                  <div className="px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
                    <span className="text-purple-700 font-medium text-sm">✨ Available for You</span>
                  </div>
                  <div className="h-px bg-purple-200 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredTemplates
                    .filter(template => canUserAccessTemplate(template))
                    .map((template) => {
                      const canAccess = canUserAccessTemplate(template)
                      const isCreating = creatingProject === template.id

                      return (
                        <Card key={template.id} className="group hover:shadow-lg transition-shadow overflow-hidden border-purple-200 bg-purple-50/30">
                          {/* Template Preview */}
                          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                            {template.preview_image_url ? (
                              <Image
                                src={template.preview_image_url}
                                alt={template.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/placeholder-template.jpg'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                                <Sparkles className="h-12 w-12 text-purple-500" />
                              </div>
                            )}
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                            </div>

                            {/* Available Badge */}
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-purple-500 hover:bg-purple-600">
                                ✓ Available
                              </Badge>
                            </div>

                            {/* Popularity Badge */}
                            {template.popularity_score > 90 && (
                              <div className="absolute top-3 right-3">
                                <Badge variant="destructive">
                                  <Star className="w-3 h-3 mr-1" />
                                  Popular
                                </Badge>
                              </div>
                            )}
                          </div>

                          <CardHeader>
                            <CardTitle className="text-lg text-purple-800">{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500 capitalize">
                                {template.category}
                              </div>
                              
                              <Button
                                onClick={() => openModal(template)}
                                disabled={isCreating}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                {isCreating ? (
                                  <>
                                    <SimpleLoading size="sm" />
                                    <span className="ml-2">Creating...</span>
                                  </>
                                ) : (
                                  <>
                                    Use Template
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Locked Templates Section */}
            {filteredTemplates.some(t => !canUserAccessTemplate(t)) && (
              <div>
                <div className="flex items-center mb-6">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                    <span className="text-gray-600 font-medium text-sm">🔒 Premium Templates</span>
                  </div>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredTemplates
                    .filter(template => !canUserAccessTemplate(template))
                    .map((template) => {
                      const canAccess = canUserAccessTemplate(template)
                      const isCreating = creatingProject === template.id

                      return (
                        <Card key={template.id} className="group hover:shadow-lg transition-shadow overflow-hidden opacity-75 border-gray-200">
                          {/* Template Preview */}
                          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                            {template.preview_image_url ? (
                              <Image
                                src={template.preview_image_url}
                                alt={template.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300 grayscale group-hover:grayscale-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/placeholder-template.jpg'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                <Sparkles className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Lock Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                              <div className="text-center text-white">
                                <Crown className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm font-medium">Premium</p>
                              </div>
                            </div>

                            {/* Tier Badge */}
                            <div className="absolute top-3 right-3">
                              <Badge variant={getTierBadgeVariant(template.tier_required)}>
                                <Crown className="w-3 h-3 mr-1" />
                                {template.tier_required}
                              </Badge>
                            </div>

                            {/* Popularity Badge */}
                            {template.popularity_score > 90 && (
                              <div className="absolute top-3 left-3">
                                <Badge variant="secondary" className="bg-gray-600">
                                  <Star className="w-3 h-3 mr-1" />
                                  Popular
                                </Badge>
                              </div>
                            )}
                          </div>

                          <CardHeader>
                            <CardTitle className="text-lg text-gray-600">{template.name}</CardTitle>
                            <CardDescription className="text-gray-500">{template.description}</CardDescription>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-400 capitalize">
                                {template.category}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/dashboard/settings?upgrade=true')}
                                className="border-amber-300 text-amber-600 hover:bg-amber-50"
                              >
                                <Crown className="mr-2 h-4 w-4" />
                                Upgrade to {template.tier_required}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No templates found</h3>
            <p className="mt-2 text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Coming Soon Section */}
        <div className="mt-16 mb-8">
          <div className="flex items-center mb-8">
            <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent flex-1"></div>
            <div className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <span className="text-white font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Coming Soon
              </span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Modern Minimalist', category: 'modern', icon: '✨' },
              { name: 'Floral Romance', category: 'rustic', icon: '🌸' },
              { name: 'Destination Bliss', category: 'destination', icon: '🏖️' }
            ].map((template, idx) => (
              <Card key={idx} className="group relative overflow-hidden border-2 border-dashed border-gray-300">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4 opacity-20">{template.icon}</div>
                      <Sparkles className="h-12 w-12 text-gray-300 mx-auto animate-pulse" />
                    </div>
                  </div>

                  {/* Coming Soon Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                      Coming Soon
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg text-gray-600">{template.name}</CardTitle>
                  <CardDescription>New template arriving soon</CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400 capitalize flex items-center gap-1">
                      <span>{template.icon}</span>
                      <span>{template.category}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="opacity-50 cursor-not-allowed"
                    >
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm">
              More beautiful templates are on the way! Check back soon for new designs.
            </p>
          </div>
        </div>
      </div>

      {/* Project Creation Modal */}
      {showModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                  <p className="text-sm text-gray-600 mt-1">Using template: {selectedTemplate.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Project Title */}
                <div>
                  <Label htmlFor="projectTitle" className="text-sm font-medium text-gray-700">
                    Project Title *
                  </Label>
                  <Input
                    id="projectTitle"
                    value={projectTitle}
                    onChange={(e) => {
                      setProjectTitle(e.target.value)
                      if (titleError) validateTitle(e.target.value)
                    }}
                    placeholder="My Beautiful Wedding"
                    className={`mt-1 ${titleError ? 'border-red-500' : ''}`}
                    maxLength={255}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {titleError && (
                      <p className="text-sm text-red-600">{titleError}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                      {projectTitle.length}/255 characters
                    </p>
                  </div>
                </div>

                {/* Subdomain */}
                <div>
                  <Label htmlFor="projectSubdomain" className="text-sm font-medium text-gray-700">
                    Subdomain *
                  </Label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <Input
                      id="projectSubdomain"
                      value={projectSubdomain}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        setProjectSubdomain(value)
                        if (subdomainError) validateSubdomain(value)
                      }}
                      placeholder="my-beautiful-wedding"
                      className={`${subdomainError ? 'border-red-500' : ''}`}
                      maxLength={100}
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      .einvite.com
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {subdomainError && (
                      <p className="text-sm text-red-600">{subdomainError}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                      {projectSubdomain.length}/100 characters
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  disabled={creatingProject === selectedTemplate.id}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={creatingProject === selectedTemplate.id}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {creatingProject === selectedTemplate.id ? (
                    <>
                      <SimpleLoading size="sm" />
                      <span className="ml-2">Creating...</span>
                    </>
                  ) : (
                    <>
                      Create Project
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}