// File: src/app/dashboard/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Edit3, 
  Eye, 
  Calendar, 
  Crown,
  ExternalLink,
  Trash2,
  BarChart3,
  QrCode
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import QRCodeGenerator from '@/components/dashboard/QRCodeGenerator'

interface WeddingProject {
  id: string
  title: string
  subdomain?: string
  custom_domain?: string
  is_published: boolean
  subscription_tier: string
  view_count: number
  created_at: string
  updated_at: string
  published_at?: string
  template?: {
    name: string
  }
}

interface User {
  id: string
  email?: string
  user_metadata: {
    full_name?: string
  }
}

interface UserProfile {
  current_subscription: 'free' | 'silver' | 'gold' | 'platinum'
}

interface ProjectContent {
  [projectId: string]: {
    brideName?: string
    groomName?: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<WeddingProject[]>([])
  const [projectsContent, setProjectsContent] = useState<ProjectContent>({})
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalViews: 0,
    publishedProjects: 0
  })

  // QR Code Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<WeddingProject | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Check authentication
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }
        setUser(authUser as User)

        // Load user profile
        const { data: userProfileData, error: userError } = await supabase
          .from('users')
          .select('current_subscription')
          .eq('id', authUser.id)
          .single()

        if (userProfileData && !userError) {
          setUserProfile(userProfileData)
        }

        // Load user's projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('wedding_projects')
          .select(`
            *,
            template:templates(name)
          `)
          .eq('user_id', authUser.id)
          .order('updated_at', { ascending: false })

        if (projectsError) {
          console.error('Error loading projects:', projectsError)
          return
        }

        setProjects(projectsData || [])

        // Load hero content for projects to get bride/groom names
        if (projectsData && projectsData.length > 0) {
          const { data: contentData, error: contentError } = await supabase
            .from('wedding_content')
            .select('project_id, content_data')
            .eq('section_type', 'hero')
            .in('project_id', projectsData.map(p => p.id))

          if (contentData && !contentError) {
            const contentMap: ProjectContent = {}
            contentData.forEach(item => {
              contentMap[item.project_id] = {
                brideName: item.content_data?.brideName,
                groomName: item.content_data?.groomName
              }
            })
            setProjectsContent(contentMap)
          }
        }

        // Calculate stats
        const totalProjects = projectsData?.length || 0
        const publishedProjects = projectsData?.filter(p => p.is_published).length || 0
        const totalViews = projectsData?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0

        setStats({
          totalProjects,
          publishedProjects,
          totalViews
        })

      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const createNewProject = () => {
    router.push('/templates')
  }

  const editProject = (projectId: string) => {
    router.push(`/editor/${projectId}`)
  }

  const previewProject = (project: WeddingProject) => {
    if (project.is_published && project.subdomain) {
      // Open published website
      const publishedUrl = `/${project.subdomain}`
      window.open(publishedUrl, '_blank')
    } else {
      // Open preview for unpublished projects
      const previewUrl = `/preview/${project.id}`
      window.open(previewUrl, '_blank')
    }
  }

  const viewRSVP = (projectId: string) => {
    router.push(`/dashboard/rsvp/${projectId}`)
  }

  const openQRCodeModal = (project: WeddingProject) => {
    setSelectedProject(project)
    setQrModalOpen(true)
  }

  const closeQRCodeModal = () => {
    setQrModalOpen(false)
    setSelectedProject(null)
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const { error } = await supabase
        .from('wedding_projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      // Refresh projects list
      setProjects(projects.filter(p => p.id !== projectId))
      
      // Update stats
      const newTotalProjects = stats.totalProjects - 1
      const deletedProject = projects.find(p => p.id === projectId)
      const newPublishedProjects = deletedProject?.is_published 
        ? stats.publishedProjects - 1 
        : stats.publishedProjects
      const newTotalViews = stats.totalViews - (deletedProject?.view_count || 0)

      setStats({
        totalProjects: newTotalProjects,
        publishedProjects: newPublishedProjects,
        totalViews: newTotalViews
      })

    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      const firstName = user.user_metadata.full_name.split(' ')[0]
      return firstName
    }
    return user?.email?.split('@')[0] || 'there'
  }

  // Check if RSVP feature should be shown
  const shouldShowRSVP = (project: WeddingProject) => {
    const projectTierEligible = ['silver', 'gold', 'platinum'].includes(project.subscription_tier)
    const userTierEligible = userProfile && ['silver', 'gold', 'platinum'].includes(userProfile.current_subscription)
    return projectTierEligible || userTierEligible
  }

  // Check if QR code feature should be shown
  const shouldShowQRCode = (project: WeddingProject) => {
    if (!project.is_published) return false
    const projectTierEligible = ['silver', 'gold', 'platinum'].includes(project.subscription_tier)
    const userTierEligible = userProfile && ['silver', 'gold', 'platinum'].includes(userProfile.current_subscription)
    return projectTierEligible || userTierEligible
  }

  // Get website URL for QR code
  const getWebsiteUrl = (project: WeddingProject) => {
    if (project.custom_domain) {
      return `https://${project.custom_domain}`
    } else if (project.subdomain) {
      return `${window.location.origin}/${project.subdomain}`
    }
    return ''
  }

  if (loading) {
    return <Loading size="lg" text="Loading dashboard..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {getUserName()}! 👋
              </p>
            </div>
            <Button onClick={createNewProject}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Website
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {getUserName()}! 👋
                </h2>
                <p className="text-blue-100">
                  Ready to create beautiful wedding websites? Let&apos;s get started!
                </p>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {userProfile?.current_subscription || 'Free'} Plan
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold">{stats.totalProjects}</p>
                  <p className="text-xs text-gray-500">0 remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                  <p className="text-xs text-gray-500">Across all websites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ExternalLink className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold">{stats.publishedProjects}</p>
                  <p className="text-xs text-gray-500">Live websites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Crown className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Plan</p>
                  <p className="text-2xl font-bold">{userProfile?.current_subscription || 'Free'}</p>
                  <p className="text-xs text-gray-500">₹0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={createNewProject}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Create New Website</h3>
              <p className="text-sm text-gray-600">Choose from beautiful templates</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Edit3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Manage Projects</h3>
              <p className="text-sm text-gray-600">Edit your existing websites</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Crown className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Upgrade Plan</h3>
              <p className="text-sm text-gray-600">Unlock premium features</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>Manage and edit your wedding websites</CardDescription>
              </div>
              <Button variant="outline" onClick={createNewProject}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Edit3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-4">Create your first wedding website to get started</p>
                <Button onClick={createNewProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Website
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>👁 {project.view_count || 0} views</span>
                          <span>📅 {formatDate(project.updated_at)}</span>
                          {project.subdomain && (
                            <span className="text-blue-600">{project.subdomain}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={project.is_published ? 'success' : 'secondary'}>
                        {project.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editProject(project.id)}
                          title="Edit Project"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewProject(project)}
                          title="Preview Project"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {shouldShowRSVP(project) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewRSVP(project.id)}
                            title="View RSVP Dashboard"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        )}
                        {shouldShowQRCode(project) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openQRCodeModal(project)}
                            title="Generate QR Code"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProject(project.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Generator Modal */}
      {selectedProject && (
        <QRCodeGenerator
          isOpen={qrModalOpen}
          onClose={closeQRCodeModal}
          websiteUrl={getWebsiteUrl(selectedProject)}
          projectTitle={selectedProject.title}
          userTier={userProfile?.current_subscription || 'free'}
          brideName={projectsContent[selectedProject.id]?.brideName}
          groomName={projectsContent[selectedProject.id]?.groomName}
        />
      )}
    </div>
  )
}