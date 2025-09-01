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

// Photo Upload Types
export interface GuestUploadBucket {
  id: string
  project_id: string
  bucket_name: string
  bucket_description?: string
  upload_token: string
  is_active: boolean
  max_images_per_guest: number
  max_file_size_mb: number
  storage_path: string
  total_sessions: number
  total_uploads: number
  total_scans: number
  created_at: string
  updated_at: string
  expires_at?: string
  last_scanned_at?: string
  last_upload_at?: string
}

export interface QRCodeConfig {
  id: string
  bucket_id: string
  project_id: string
  qr_size: number
  error_correction_level: 'L' | 'M' | 'Q' | 'H'
  margin: number
  foreground_color: string
  background_color: string
  logo_enabled: boolean
  logo_url?: string
  logo_size: number
  logo_excavate: boolean
  design_style: 'classic' | 'modern' | 'rounded' | 'dots'
  border_enabled: boolean
  border_color: string
  border_width: number
  corner_style: 'square' | 'rounded' | 'extra-rounded'
  shadow_enabled: boolean
  content_title?: string
  content_subtitle: string
  content_instructions: string
  show_couple_names: boolean
  show_wedding_date: boolean
  show_upload_instructions: boolean
  color_theme: 'default' | 'gold_elegant' | 'rose_gold' | 'silver_classic' | 'royal_blue' | 'emerald_green'
  font_style: 'sans' | 'serif' | 'modern' | 'script'
  print_format: 'A4' | 'A5' | 'letter' | 'custom'
  print_orientation: 'portrait' | 'landscape'
  cards_per_page: 1 | 2 | 4 | 6 | 8 | 9 | 12
  include_cutting_guides: boolean
  bleed_area: string
  qr_code_image_url?: string
  print_ready_pdf_url?: string
  generation_count: number
  last_generated_at?: string
  created_at: string
  updated_at: string
}

export interface GuestUploadSession {
  id: string
  bucket_id: string
  project_id: string
  guest_name: string
  guest_email: string
  session_token: string
  ip_address?: string
  user_agent?: string
  device_info: {
    device_type: string
    browser_name: string
    browser_version: string
    os_name: string
    os_version: string
    screen_resolution: string
    is_mobile: boolean
    is_tablet: boolean
  }
  total_images: number
  total_size_bytes: number
  upload_duration_seconds: number
  session_status: 'active' | 'completed' | 'expired' | 'blocked'
  created_at: string
  last_upload_at: string
  completed_at?: string
  expires_at: string
}

export interface GuestUpload {
  id: string
  session_id: string
  original_filename: string
  stored_filename: string
  file_url: string
  file_size: number
  file_type: string
  mime_type: string
  thumbnail_url?: string
  compressed_url?: string
  image_metadata: Record<string, unknown>
  upload_order: number
  is_approved: boolean
  moderation_notes?: string
  uploaded_at: string
  processed_at?: string
}

export interface QRCodeScan {
  id: string
  bucket_id: string
  project_id: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  device_type: string
  browser_name?: string
  browser_version?: string
  os_name?: string
  os_version?: string
  country_code?: string
  country_name?: string
  city?: string
  timezone?: string
  scan_source: 'direct' | 'social_share' | 'email' | 'whatsapp' | 'other'
  session_token?: string
  converted_to_upload: boolean
  conversion_time_seconds?: number
  scanned_at: string
  scan_metadata: Record<string, unknown>
}

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