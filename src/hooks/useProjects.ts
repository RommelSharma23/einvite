// File: src/hooks/useProjects.ts

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

// User profile interface
interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  current_subscription: 'free' | 'silver' | 'gold' | 'platinum'
  total_projects: number
  is_active: boolean
  profile_image_url?: string
  created_at?: string
  updated_at?: string
}

interface WeddingProject {
  id: string
  user_id: string
  title: string
  subdomain?: string
  custom_domain?: string
  template_id: string
  is_published: boolean
  subscription_tier: 'free' | 'silver' | 'gold' | 'platinum'
  project_status: 'draft' | 'published' | 'expired' | 'archived'
  view_count: number
  created_at: string
  updated_at: string
  published_at?: string
  expires_at?: string
  template?: {
    id: string
    name: string
    preview_image_url?: string
  }
}

interface CreateProjectData {
  title: string
  templateId: string
  subscriptionTier?: 'silver' | 'gold' | 'platinum'
}

export function useProjects() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<WeddingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get current user on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        if (currentUser) {
          await fetchProjects(currentUser.id)
        } else {
          setProjects([])
        }
      } catch (err) {
        console.error('Error initializing user:', err)
        setUser(null)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [])

  const fetchProjects = async (userId?: string) => {
    const userIdToUse = userId || user?.id
    if (!userIdToUse) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: projectsError } = await supabase
        .from('wedding_projects')
        .select(`
          *,
          template:templates(
            id,
            name,
            preview_image_url
          )
        `)
        .eq('user_id', userIdToUse)
        .order('updated_at', { ascending: false })

      if (projectsError) throw projectsError

      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: CreateProjectData): Promise<WeddingProject | null> => {
    if (!user) {
      setError('User must be authenticated to create projects')
      return null
    }

    try {
      setError(null)

      // Generate subdomain
      const subdomain = `${projectData.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30)}-${Date.now()}`

      const { data, error: createError } = await supabase
        .from('wedding_projects')
        .insert([
          {
            user_id: user.id,
            title: projectData.title,
            template_id: projectData.templateId,
            subdomain: subdomain,
            subscription_tier: projectData.subscriptionTier || 'free',
            project_status: 'draft',
            is_published: false,
            view_count: 0
          }
        ])
        .select(`
          *,
          template:templates(
            id,
            name,
            preview_image_url
          )
        `)
        .single()

      if (createError) throw createError

      // Update local state
      setProjects(prev => [data, ...prev])

      // Update user's total projects count
      await supabase
        .from('users')
        .update({ total_projects: projects.length + 1 })
        .eq('id', user.id)

      return data
    } catch (err) {
      console.error('Error creating project:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project')
      return null
    }
  }

  const updateProject = async (
    projectId: string, 
    updates: Partial<WeddingProject>
  ): Promise<WeddingProject | null> => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('wedding_projects')
        .update(updates)
        .eq('id', projectId)
        .eq('user_id', user?.id) // Ensure user owns the project
        .select(`
          *,
          template:templates(
            id,
            name,
            preview_image_url
          )
        `)
        .single()

      if (updateError) throw updateError

      // Update local state
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId ? data : project
        )
      )

      return data
    } catch (err) {
      console.error('Error updating project:', err)
      setError(err instanceof Error ? err.message : 'Failed to update project')
      return null
    }
  }

  const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('wedding_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user?.id) // Ensure user owns the project

      if (deleteError) throw deleteError

      // Update local state
      setProjects(prev => prev.filter(project => project.id !== projectId))

      // Update user's total projects count
      if (user) {
        await supabase
          .from('users')
          .update({ total_projects: Math.max(0, projects.length - 1) })
          .eq('id', user.id)
      }

      return true
    } catch (err) {
      console.error('Error deleting project:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      return false
    }
  }

  const publishProject = async (projectId: string): Promise<boolean> => {
    return await updateProject(projectId, {
      is_published: true,
      project_status: 'published',
      published_at: new Date().toISOString()
    }) !== null
  }

  const refreshProjects = async () => {
    if (user) {
      await fetchProjects(user.id)
    }
  }

  return {
    user, // Added user to return values
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    publishProject,
    refreshProjects,
    // Computed values
    publishedProjects: projects.filter(p => p.is_published),
    draftProjects: projects.filter(p => !p.is_published),
    totalViews: projects.reduce((sum, p) => sum + p.view_count, 0)
  }
}