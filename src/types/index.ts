// File: src/types/index.ts

// Re-export Supabase User type
export type { User } from '@supabase/supabase-js'

export interface Template {
  id: string
  name: string
  description?: string
  preview_image_url?: string
  category: string
  configuration: {
    colors?: string[]
    sections?: string[]
    [key: string]: unknown
  }
  tier_required: 'free' | 'silver' | 'gold' | 'platinum'
  is_active: boolean
  popularity_score: number
  created_at: string
  updated_at: string
}

// Make sure UserProfile is exported
export interface UserProfile {
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

export interface WeddingProject {
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
  template?: Template
}

export interface WeddingContent {
  id?: string
  project_id: string
  section_type: string
  content_data: Record<string, unknown>
  display_order: number
  is_visible: boolean
  updated_at?: string
}

export interface WeddingEvent {
  id?: string
  project_id: string
  event_name: string
  event_date: string
  venue_name: string
  venue_address: string
  event_description: string
  event_image_url?: string
  display_order: number
  created_at?: string
}

export interface MediaFile {
  id: string
  project_id: string
  user_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size?: number
  section_type: string
  display_order: number
  is_compressed: boolean
  uploaded_at: string
}

export interface TemplateStyles {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  fontFamily: string
  fontSize: string
}

export type SubscriptionTier = 'free' | 'silver' | 'gold' | 'platinum'

// Database type for Supabase (if needed)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id'>>
      }
      wedding_projects: {
        Row: WeddingProject
        Insert: Omit<WeddingProject, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WeddingProject, 'id'>>
      }
      templates: {
        Row: Template
        Insert: Omit<Template, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Template, 'id'>>
      }
      // Add other tables as needed
    }
  }
}