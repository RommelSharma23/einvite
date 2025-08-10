// File: einvite/src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types'

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Debug logging (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment Variables Check:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Found' : '❌ Missing')
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing')
  
  if (supabaseUrl) {
    console.log('- URL value:', supabaseUrl)
  }
  if (supabaseAnonKey) {
    console.log('- Anon key length:', supabaseAnonKey.length)
  }
}

// Validation with helpful error messages
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing from environment variables')
  console.error('Make sure your .env.local file exists and contains:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=https://qjlcbryoqlcpxtowpijx.supabase.co')
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables')
  console.error('Make sure your .env.local file exists and contains:')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here')
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL format:', supabaseUrl)
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
}

// Validate key format (should be a JWT)
if (!supabaseAnonKey.startsWith('eyJ')) {
  console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format. Should start with "eyJ"')
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format')
}

console.log('✅ Supabase environment variables validated successfully')

// Create the main Supabase client for client-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Create admin client for server-side operations (only if service key is available)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Export a function to test the connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection test passed')
    return true
  } catch (error) {
    console.error('❌ Supabase connection test error:', error)
    return false
  }
}