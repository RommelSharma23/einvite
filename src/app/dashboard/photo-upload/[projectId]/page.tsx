// File: src/app/dashboard/photo-upload/[projectId]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import PhotoUploadManager from '@/components/dashboard/PhotoUploadManager'

interface WeddingProject {
  id: string
  title: string
  subdomain?: string
  subscription_tier: string
  user_id: string
}

interface ProjectContent {
  brideName?: string
  groomName?: string
  weddingDate?: string
}

export default function PhotoUploadPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string
  
  const [project, setProject] = useState<WeddingProject | null>(null)
  const [projectContent, setProjectContent] = useState<ProjectContent>({})
  const [userTier, setUserTier] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Load user profile for tier
        const { data: userProfileData } = await supabase
          .from('users')
          .select('current_subscription')
          .eq('id', user.id)
          .single()

        if (userProfileData) {
          setUserTier(userProfileData.current_subscription)
        }

        // Load project
        const { data: projectData, error: projectError } = await supabase
          .from('wedding_projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id) // Ensure user owns the project
          .single()

        if (projectError || !projectData) {
          setError('Project not found or you do not have access to it.')
          return
        }

        setProject(projectData)

        // Load project content for bride/groom names and wedding date
        const { data: contentData } = await supabase
          .from('wedding_content')
          .select('content_data')
          .eq('project_id', projectId)
          .eq('section_type', 'hero')
          .single()

        if (contentData?.content_data) {
          setProjectContent({
            brideName: contentData.content_data.brideName,
            groomName: contentData.content_data.groomName,
            weddingDate: contentData.content_data.weddingDate
          })
        }

      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load project data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadData()
    }
  }, [projectId, router])

  const handleBack = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return <Loading size="lg" text="Loading photo upload manager..." fullScreen />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Photo Upload Manager</h1>
                  <p className="text-sm text-gray-600">
                    {project.title}
                    {projectContent.brideName && projectContent.groomName && (
                      <span> • {projectContent.brideName} & {projectContent.groomName}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PhotoUploadManager
          projectId={project.id}
          weddingDate={projectContent.weddingDate}
          userTier={userTier}
          brideName={projectContent.brideName}
          groomName={projectContent.groomName}
          subdomain={project.subdomain}
        />
      </div>
    </div>
  )
}