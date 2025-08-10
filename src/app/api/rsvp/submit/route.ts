// src/app/api/rsvp/submit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase'; // Import both clients

interface RSVPSubmissionData {
  projectId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  attendanceStatus: 'attending' | 'not_attending' | 'maybe';
  guestCount: number;
  dietaryRestrictions?: string;
  danceSong?: string;
  adviceNewlyweds?: string;
  favoriteMemory?: string;
}

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  // Increase limit for development
  const maxRequests = process.env.NODE_ENV === 'development' ? 50 : 5; // 50 for dev, 5 for prod

  const userLimit = rateLimitStore.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Increment count
  userLimit.count++;
  rateLimitStore.set(ip, userLimit);
  return true;
}

// Input validation
function validateRSVPData(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Type guard to ensure data is an object
  if (!data || typeof data !== 'object') {
    errors.push('Invalid request data');
    return { isValid: false, errors };
  }

  const submissionData = data as Record<string, unknown>;

  // Required fields
  if (!submissionData.projectId || typeof submissionData.projectId !== 'string') {
    errors.push('Project ID is required');
  }

  if (!submissionData.guestName || typeof submissionData.guestName !== 'string' || submissionData.guestName.toString().trim().length === 0) {
    errors.push('Guest name is required');
  }

  if (!submissionData.attendanceStatus || !['attending', 'not_attending', 'maybe'].includes(submissionData.attendanceStatus as string)) {
    errors.push('Valid attendance status is required');
  }

  if (!submissionData.guestCount || typeof submissionData.guestCount !== 'number' || submissionData.guestCount < 1 || submissionData.guestCount > 10) {
    errors.push('Guest count must be between 1 and 10');
  }

  // Optional field validation
  if (submissionData.guestEmail && (typeof submissionData.guestEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submissionData.guestEmail.toString().trim()))) {
    errors.push('Invalid email format');
  }

  if (submissionData.guestPhone && typeof submissionData.guestPhone !== 'string') {
    errors.push('Invalid phone number format');
  }

  // Text field length limits
  const textFields = [
    { field: 'guestName', limit: 100 },
    { field: 'guestEmail', limit: 255 },
    { field: 'guestPhone', limit: 20 },
    { field: 'dietaryRestrictions', limit: 500 },
    { field: 'danceSong', limit: 200 },
    { field: 'adviceNewlyweds', limit: 1000 },
    { field: 'favoriteMemory', limit: 1000 }
  ];

  textFields.forEach(({ field, limit }) => {
    if (submissionData[field] && typeof submissionData[field] === 'string' && (submissionData[field] as string).length > limit) {
      errors.push(`${field} must be less than ${limit} characters`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Type definitions for the database function response
interface RSVPConfigData {
  id?: string;
  project_id?: string;
  is_enabled?: boolean;
  title?: string;
  subtitle?: string;
  deadline_date?: string | null;
  confirmation_message?: string;
  dance_song_enabled?: boolean;
  dance_song_question?: string;
  advice_enabled?: boolean;
  advice_question?: string;
  memory_enabled?: boolean;
  memory_question?: string;
  created_at?: string;
  updated_at?: string;
  // Allow for additional fields that might be added later
  [key: string]: string | boolean | number | null | undefined;
}

interface DatabaseFunctionResponse {
  is_allowed: boolean;
  config_data: RSVPConfigData | null;
  error_message: string | null;
}

// Updated RSVP permissions check using the new database function
async function checkRSVPPermissions(projectId: string): Promise<{ 
  allowed: boolean; 
  message?: string;
  config?: RSVPConfigData;
}> {
  try {
    console.log('🔍 Checking RSVP permissions for project:', projectId);

    const { data, error } = await supabase
      .rpc('check_rsvp_allowed', { project_uuid: projectId });

    if (error) {
      console.error('💥 Error calling check_rsvp_allowed:', error);
      return { allowed: false, message: 'Unable to verify RSVP permissions' };
    }

    console.log('📊 Database function response:', data);

    const result = data?.[0] as DatabaseFunctionResponse;
    if (!result) {
      console.log('❌ No result from database function');
      return { allowed: false, message: 'Unable to verify RSVP permissions' };
    }

    console.log('📋 RSVP check result:', {
      isAllowed: result.is_allowed,
      errorMessage: result.error_message,
      hasConfig: !!result.config_data
    });

    // Return the result with flexible config data
    if (result.is_allowed) {
      return {
        allowed: true,
        config: result.config_data || {}
      };
    } else {
      return {
        allowed: false,
        message: result.error_message || 'RSVP not allowed',
        config: result.config_data || {}
      };
    }

  } catch (error) {
    console.error('💥 Unexpected error checking RSVP permissions:', error);
    return { allowed: false, message: 'Unable to verify RSVP permissions' };
  }
}

// Helper function to safely access config values
function getConfigValue<T>(config: RSVPConfigData | undefined, key: keyof RSVPConfigData, defaultValue: T): T {
  if (!config || config[key] === undefined || config[key] === null) {
    return defaultValue;
  }
  return config[key] as T;
}

// Check for duplicate submissions
async function checkDuplicateSubmission(projectId: string, guestName: string, guestEmail?: string): Promise<boolean> {
  try {
    const query = supabase
      .from('rsvp_responses')
      .select('id')
      .eq('project_id', projectId)
      .eq('guest_name', guestName.trim());

    // Also check by email if provided
    if (guestEmail && guestEmail.trim()) {
      const { data: emailCheck } = await supabase
        .from('rsvp_responses')
        .select('id')
        .eq('project_id', projectId)
        .eq('guest_email', guestEmail.trim().toLowerCase())
        .limit(1);

      if (emailCheck && emailCheck.length > 0) {
        return true; // Duplicate found by email
      }
    }

    const { data, error } = await query.limit(1);
    
    if (error) {
      console.error('Error checking duplicates:', error);
      return false; // Allow submission if we can't check
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking duplicate submission:', error);
    return false; // Allow submission if we can't check
  }
}

export async function GET() {
  return NextResponse.json({ message: 'RSVP API route is working!' });
}

export async function POST(request: NextRequest) {
  console.log('=== RSVP API POST REQUEST ===');
  
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';

    console.log('🌐 Client IP:', clientIP);

    // Check rate limit (disabled for development)
    if (process.env.NODE_ENV === 'production' && !checkRateLimit(clientIP)) {
      console.log('⏰ Rate limit exceeded');
      return NextResponse.json({
        success: false,
        message: 'Too many RSVP submissions. Please try again later.'
      }, { status: 429 });
    }

    // Parse request body
    const submissionData: RSVPSubmissionData = await request.json();
    console.log('📥 Submission data:', {
      projectId: submissionData.projectId,
      guestName: submissionData.guestName,
      attendanceStatus: submissionData.attendanceStatus
    });

    // Validate input data
    const validation = validateRSVPData(submissionData);
    if (!validation.isValid) {
      console.log('❌ Validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        message: 'Invalid submission data',
        error: validation.errors.join(', ')
      }, { status: 400 });
    }

    console.log('✅ Validation passed');

    // Check RSVP permissions using the new database function
    const permissionCheck = await checkRSVPPermissions(submissionData.projectId);
    
    if (!permissionCheck.allowed) {
      console.log('❌ Permission denied:', permissionCheck.message);
      return NextResponse.json({
        success: false,
        message: permissionCheck.message || 'RSVP not allowed'
      }, { status: 403 });
    }

    console.log('✅ Permissions granted');
    console.log('📋 RSVP Config loaded:', getConfigValue(permissionCheck.config, 'title', 'RSVP'));

    // Check for duplicate submissions
    const isDuplicate = await checkDuplicateSubmission(
      submissionData.projectId,
      submissionData.guestName,
      submissionData.guestEmail
    );

    if (isDuplicate) {
      console.log('⚠️ Duplicate submission detected');
      return NextResponse.json({
        success: false,
        message: 'An RSVP response has already been submitted with this name or email address.'
      }, { status: 409 });
    }

    console.log('✅ No duplicates found');

    // Prepare data for database insertion
    const dbData = {
      project_id: submissionData.projectId,
      guest_name: submissionData.guestName.trim(),
      guest_email: submissionData.guestEmail?.trim().toLowerCase() || null,
      guest_phone: submissionData.guestPhone?.trim() || null,
      attendance_status: submissionData.attendanceStatus,
      guest_count: submissionData.guestCount,
      dietary_restrictions: submissionData.dietaryRestrictions?.trim() || null,
      dance_song: submissionData.danceSong?.trim() || null,
      advice_newlyweds: submissionData.adviceNewlyweds?.trim() || null,
      favorite_memory: submissionData.favoriteMemory?.trim() || null,
      ip_address: clientIP
      // Remove submitted_at to let database handle it with DEFAULT NOW()
    };

    console.log('💾 Inserting RSVP data...');

    // Use admin client if available, otherwise use regular client
    const clientToUse = supabaseAdmin || supabase;
    
    if (!supabaseAdmin) {
      console.warn('⚠️ Using regular supabase client - admin client not available');
    }

    // Insert RSVP response
    const { data, error } = await clientToUse
      .from('rsvp_responses')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('💥 Database error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to save RSVP response',
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ RSVP saved successfully!', data.id);

    return NextResponse.json({
      success: true,
      message: 'RSVP response submitted successfully',
      data: {
        id: data.id,
        guestName: data.guest_name,
        attendanceStatus: data.attendance_status,
        submittedAt: data.submitted_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Unexpected error in RSVP submission:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: 'An unexpected error occurred while processing your RSVP'
    }, { status: 500 });
  }
}