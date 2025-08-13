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
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
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
    description: 'Elegant traditional design with golden accents',
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
  },
  {
    id: '2',
    name: 'Modern Minimalist',
    description: 'Clean, contemporary design with subtle animations',
    preview_image_url: undefined,
    category: 'modern',
    configuration: {
      colors: ['#2563EB', '#F8FAFC', '#1E293B'],
      sections: ['hero', 'couple', 'events', 'venue', 'memories']
    },
    tier_required: 'silver',
    is_active: true,
    popularity_score: 88,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Floral Romance',
    description: 'Beautiful floral patterns with romantic touch',
    preview_image_url: undefined,
    category: 'rustic',
    configuration: {
      colors: ['#F472B6', '#FEF3F2', '#1F2937'],
      sections: ['hero', 'couple', 'events', 'venue', 'memories', 'wishes']
    },
    tier_required: 'gold',
    is_active: true,
    popularity_score: 92,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Destination Bliss',
    description: 'Perfect for beach and destination weddings',
    preview_image_url: undefined,
    category: 'destination',
    configuration: {
      colors: ['#0EA5E9', '#F0F9FF', '#164E63'],
      sections: ['hero', 'couple', 'events', 'venue', 'memories', 'rsvp']
    },
    tier_required: 'platinum',
    is_active: true,
    popularity_score: 85,
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

    setFilteredTemplates(filtered)
  }, [templates, selectedCategory, searchQuery])

  const createProject = async (template: Template) => {
    if (!user || !userProfile) return null

    try {
      // Generate subdomain
      const subdomain = `${template.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30)}-${Date.now()}`

      const { data, error } = await supabase
        .from('wedding_projects')
        .insert([
          {
            user_id: user.id,
            title: `My ${template.name} Wedding`,
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

  const handleCreateProject = async (template: Template) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!userProfile) {
      console.error('User profile not loaded')
      return
    }

    // Check if user can access this template tier
    if (!canAccessFeature(userProfile.current_subscription, template.tier_required)) {
      router.push('/dashboard/settings?upgrade=true')
      return
    }

    setCreatingProject(template.id)

    try {
      const project = await createProject(template)

      if (project) {
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
              {user && (
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    Back to Dashboard
                  </Link>
                </Button>
              )}
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
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => {
              const canAccess = canUserAccessTemplate(template)
              const isCreating = creatingProject === template.id

              return (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Template Preview */}
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {template.preview_image_url ? (
                      <Image
                        src={template.preview_image_url}
                        alt={template.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-template.jpg'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                        <Sparkles className="h-12 w-12 text-blue-500" />
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
                        <Badge variant="destructive">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 capitalize">
                        {template.category}
                      </div>
                      
                      {canAccess ? (
                        <Button
                          onClick={() => handleCreateProject(template)}
                          disabled={isCreating}
                          size="sm"
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
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/dashboard/settings?upgrade=true')}
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
      </div>
    </div>
  )
}