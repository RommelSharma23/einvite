// File: src/lib/auth.ts (Fixed version)

import { supabase } from './supabase'
import type { UserProfile } from '@/types'

export interface AuthResponse {
  success: boolean
  user?: UserProfile
  error?: string
}

export interface SignUpData {
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface SignInData {
  email: string
  password: string
}

// Get current authenticated user - FIXED VERSION
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    // First get the auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return null
    }
    
    if (!authUser) {
      console.log('No authenticated user found')
      return null
    }

    console.log('Auth user found:', authUser.id, authUser.email)

    // Try to get user profile from our custom users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      
      // If user doesn't exist in our users table, create it
      if (profileError.code === 'PGRST116') { // No rows returned
        console.log('User profile not found, creating...')
        
        const newUserProfile = {
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || null,
          phone: authUser.user_metadata?.phone || null,
          current_subscription: 'free' as const,
          total_projects: 0,
          is_active: true
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert(newUserProfile)
          .select()
          .single()

        if (createError) {
          console.error('Error creating user profile:', createError)
          return null
        }

        console.log('User profile created successfully')
        return createdProfile
      }
      
      return null
    }

    if (!userProfile) {
      console.error('No user profile found and no error')
      return null
    }

    console.log('User profile found:', userProfile.email)
    return userProfile
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

// Sign up new user - UPDATED VERSION
export async function signUp({ email, password, fullName, phone }: SignUpData): Promise<AuthResponse> {
  try {
    console.log('Attempting to sign up user:', email)
    
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user account' }
    }

    console.log('Auth user created:', authData.user.id)

    // Create user profile in our custom users table
    const userProfile = {
      id: authData.user.id,
      email: authData.user.email!,
      full_name: fullName,
      phone: phone || null,
      current_subscription: 'free' as const,
      total_projects: 0,
      is_active: true
    }

    const { data: newProfile, error: profileError } = await supabase
      .from('users')
      .insert(userProfile)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't delete the auth user here as it might cause issues
      return { success: false, error: 'Failed to create user profile' }
    }

    console.log('User profile created successfully')

    return { 
      success: true, 
      user: newProfile
    }
  } catch (error) {
    console.error('Signup error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

// Sign in existing user - UPDATED VERSION
export async function signIn({ email, password }: SignInData): Promise<AuthResponse> {
  try {
    console.log('Attempting to sign in user:', email)
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Sign in error:', authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to sign in' }
    }

    console.log('Auth sign in successful:', authData.user.id)

    // Get user profile (this will create one if it doesn't exist)
    const userProfile = await getCurrentUser()

    if (!userProfile) {
      return { success: false, error: 'Failed to fetch user profile' }
    }

    return { success: true, user: userProfile }
  } catch (error) {
    console.error('Sign in error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

// Sign out user
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

// Reset password
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

// Update password
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

// Update user profile - FIXED VERSION
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'profile_image_url'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

// Check if user has access to feature based on subscription
export function hasFeatureAccess(userTier: string, requiredTier: string): boolean {
  const tierHierarchy = ['free', 'silver', 'gold', 'platinum']
  const userLevel = tierHierarchy.indexOf(userTier)
  const requiredLevel = tierHierarchy.indexOf(requiredTier)
  
  return userLevel >= requiredLevel
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  
  return { valid: true }
}

// Format phone number for India
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Add +91 prefix if not present and number is 10 digits
  if (digits.length === 10) {
    return `+91${digits}`
  }
  
  // If already has country code, return as is
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`
  }
  
  return phone // Return original if format is unclear
}