// File: src/hooks/useUserProfile.ts

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  profile_image_url?: string
  current_subscription: 'free' | 'silver' | 'gold' | 'platinum'
  subscription_expires_at?: string
  total_projects: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useUserProfile(userId?: string) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
    } else {
      setUserProfile(null)
      setLoading(false)
    }
  }, [userId])

  const fetchUserProfile = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        // If user profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          const { data: authUser } = await supabase.auth.getUser()
          
          if (authUser.user) {
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert([
                {
                  id: authUser.user.id,
                  email: authUser.user.email!,
                  full_name: authUser.user.user_metadata?.full_name || '',
                  phone: authUser.user.user_metadata?.phone || '',
                  current_subscription: 'free',
                  total_projects: 0,
                  is_active: true
                }
              ])
              .select()
              .single()

            if (createError) throw createError
            setUserProfile(newProfile)
          }
        } else {
          throw profileError
        }
      } else {
        setUserProfile(data)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId || !userProfile) return null

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      setUserProfile(data)
      return data
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      return null
    }
  }

  return {
    userProfile,
    loading,
    error,
    updateProfile,
    // Convenience properties
    isAuthenticated: !!userId,
    subscription: userProfile?.current_subscription || 'free',
    canUpgrade: userProfile?.current_subscription !== 'platinum'
  }
}