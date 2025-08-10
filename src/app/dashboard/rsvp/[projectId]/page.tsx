// File: src/app/dashboard/rsvp/[projectId]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import RSVPDashboard from '@/components/dashboard/RSVPDashboard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings, ExternalLink } from 'lucide-react'

interface WeddingProject {
  id: string
  title: string
  subdomain?: string
  custom_domain?: string
  user_id: string
  subscription_tier: 'free' | 'silver' | 'gold' | 'platinum'
  is_published: boolean
}

interface UserProfile {
  id: string
  current_subscription: 'free' | 'silver' | 'gold' | 'platinum'
}

interface ContentData {
  hero?: {
    brideName?: string
    groomName?: string
  }
}

export default function RSVPDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [project, setProject] = useState<WeddingProject | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [content, setContent] = useState<ContentData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle auth state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthLoading(false)
    }
    
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const loadProject = async () => {
      if (!user || authLoading) return

      try {
        setLoading(true)

        // Load user profile to get current subscription
        const { data: userProfileData, error: userError } = await supabase
          .from('users')
          .select('id, current_subscription')
          .eq('id', user.id)
          .single()

        if (userError || !userProfileData) {
          console.error('Error loading user profile:', userError)
          setError('Failed to load user profile')
          return
        }

        setUserProfile(userProfileData)

        // Load project and verify ownership
        const { data: projectData, error: projectError } = await supabase
          .from('wedding_projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id) // Ensure user owns this project
          .single()

        if (projectError || !projectData) {
          console.error('Project not found or access denied:', projectError)
          setError('Project not found or you do not have access to this project')
          return
        }

        setProject(projectData)

        // Load project content for bride/groom names
        const { data: contentData, error: contentError } = await supabase
          .from('wedding_content')
          .select('*')
          .eq('project_id', projectId)
          .eq('section_type', 'hero')
          .single()

        if (contentData && !contentError) {
          setContent({ hero: contentData.content_data as { brideName?: string; groomName?: string } })
        }

      } catch (error) {
        console.error('Error loading project:', error)
        setError('Failed to load project data')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId, user, authLoading])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handleGoToEditor = () => {
    router.push(`/editor/${projectId}`)
  }

  const handleViewWebsite = () => {
    if (project?.subdomain) {
      window.open(`/${project.subdomain}`, '_blank')
    } else if (project?.custom_domain) {
      window.open(`https://${project.custom_domain}`, '_blank')
    }
  }

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RSVP dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <Button onClick={handleBackToDashboard} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!project || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
          <p className="text-gray-600 mb-6">
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <div className="text-gray-300">•</div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{project.title}</h1>
                <p className="text-sm text-gray-600">RSVP Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToEditor}
              >
                <Settings className="h-4 w-4 mr-1" />
                Edit Website
              </Button>
              {project.is_published && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewWebsite}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Live Site
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RSVP Dashboard Component */}
      <RSVPDashboard
        projectId={projectId}
        supabase={supabase}
        userTier={userProfile.current_subscription}
        brideName={content.hero?.brideName}
        groomName={content.hero?.groomName}
        onUpgrade={handleUpgrade}
      />
    </div>
  )
}