-- =================================================================
-- GUEST PHOTO UPLOAD & QR CODE DATABASE SCHEMA
-- =================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. GUEST UPLOAD BUCKETS (Basic Configuration)
-- =================================================================

CREATE TABLE guest_upload_buckets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES wedding_projects(id) ON DELETE CASCADE,
  
  -- Bucket Configuration
  bucket_name VARCHAR(100) NOT NULL, -- "Reception Photos", "Ceremony Memories"
  bucket_description TEXT,
  upload_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Upload Settings
  is_active BOOLEAN DEFAULT TRUE,
  max_images_per_guest INTEGER DEFAULT 30,
  max_file_size_mb INTEGER DEFAULT 10,
  
  -- Storage Configuration
  storage_path VARCHAR(255) NOT NULL, -- project-id/bucket-name/
  
  -- Usage Statistics
  total_sessions INTEGER DEFAULT 0,
  total_uploads INTEGER DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Auto-disable after wedding
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  last_upload_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_max_images CHECK (max_images_per_guest > 0 AND max_images_per_guest <= 100),
  CONSTRAINT valid_file_size CHECK (max_file_size_mb > 0 AND max_file_size_mb <= 50)
);

-- Indexes for performance
CREATE INDEX idx_upload_buckets_project_id ON guest_upload_buckets(project_id);
CREATE INDEX idx_upload_buckets_token ON guest_upload_buckets(upload_token);
CREATE INDEX idx_upload_buckets_active ON guest_upload_buckets(is_active, expires_at);
CREATE INDEX idx_upload_buckets_created_at ON guest_upload_buckets(created_at DESC);

-- =================================================================
-- 2. QR CODE CONFIGURATIONS (Separate Table)
-- =================================================================

CREATE TABLE qr_code_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id UUID NOT NULL REFERENCES guest_upload_buckets(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES wedding_projects(id) ON DELETE CASCADE,
  
  -- QR Code Basic Settings
  qr_size INTEGER DEFAULT 300 CHECK (qr_size >= 100 AND qr_size <= 1000),
  error_correction_level VARCHAR(1) DEFAULT 'M' CHECK (error_correction_level IN ('L', 'M', 'Q', 'H')),
  margin INTEGER DEFAULT 4 CHECK (margin >= 0 AND margin <= 10),
  
  -- Colors
  foreground_color VARCHAR(7) DEFAULT '#000000', -- Hex color
  background_color VARCHAR(7) DEFAULT '#FFFFFF', -- Hex color
  
  -- Logo Configuration
  logo_enabled BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  logo_size INTEGER DEFAULT 60 CHECK (logo_size >= 20 AND logo_size <= 200),
  logo_excavate BOOLEAN DEFAULT TRUE, -- Remove QR modules behind logo
  
  -- Design Style
  design_style VARCHAR(20) DEFAULT 'classic' CHECK (design_style IN ('classic', 'modern', 'rounded', 'dots')),
  border_enabled BOOLEAN DEFAULT FALSE,
  border_color VARCHAR(7) DEFAULT '#D4AF37',
  border_width INTEGER DEFAULT 2 CHECK (border_width >= 1 AND border_width <= 10),
  corner_style VARCHAR(10) DEFAULT 'square' CHECK (corner_style IN ('square', 'rounded', 'extra-rounded')),
  shadow_enabled BOOLEAN DEFAULT FALSE,
  
  -- Content Settings
  content_title VARCHAR(100),
  content_subtitle VARCHAR(100) DEFAULT 'Share Your Memories',
  content_instructions TEXT DEFAULT 'Scan to upload photos from our special day!',
  show_couple_names BOOLEAN DEFAULT TRUE,
  show_wedding_date BOOLEAN DEFAULT TRUE,
  show_upload_instructions BOOLEAN DEFAULT TRUE,
  
  -- Branding & Theme
  color_theme VARCHAR(20) DEFAULT 'default' CHECK (color_theme IN ('default', 'gold_elegant', 'rose_gold', 'silver_classic', 'royal_blue', 'emerald_green')),
  font_style VARCHAR(10) DEFAULT 'sans' CHECK (font_style IN ('sans', 'serif', 'modern', 'script')),
  
  -- Print Configuration
  print_format VARCHAR(10) DEFAULT 'A4' CHECK (print_format IN ('A4', 'A5', 'letter', 'custom')),
  print_orientation VARCHAR(10) DEFAULT 'portrait' CHECK (print_orientation IN ('portrait', 'landscape')),
  cards_per_page INTEGER DEFAULT 4 CHECK (cards_per_page IN (1, 2, 4, 6, 8, 9, 12)),
  include_cutting_guides BOOLEAN DEFAULT TRUE,
  bleed_area VARCHAR(10) DEFAULT '3mm',
  
  -- Generated Assets
  qr_code_image_url TEXT, -- URL to generated QR code PNG
  print_ready_pdf_url TEXT, -- URL to print-ready PDF
  
  -- Metadata
  generation_count INTEGER DEFAULT 0, -- How many times QR was generated
  last_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one config per bucket
  CONSTRAINT unique_bucket_qr_config UNIQUE (bucket_id)
);

-- Indexes for QR configs
CREATE INDEX idx_qr_configs_bucket_id ON qr_code_configs(bucket_id);
CREATE INDEX idx_qr_configs_project_id ON qr_code_configs(project_id);
CREATE INDEX idx_qr_configs_theme ON qr_code_configs(color_theme);
CREATE INDEX idx_qr_configs_generated ON qr_code_configs(last_generated_at DESC);

-- =================================================================
-- 3. GUEST UPLOAD SESSIONS (Guest Details - No Redundancy)
-- =================================================================

CREATE TABLE guest_upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id UUID NOT NULL REFERENCES guest_upload_buckets(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES wedding_projects(id) ON DELETE CASCADE,
  
  -- Guest Information (Stored Once Per Session)
  guest_name VARCHAR(100) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  session_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Session Metadata
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{
    "device_type": "unknown",
    "browser_name": "unknown",
    "browser_version": "",
    "os_name": "unknown",
    "os_version": "",
    "screen_resolution": "",
    "is_mobile": false,
    "is_tablet": false
  }'::jsonb,
  
  -- Upload Statistics for this Session
  total_images INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  upload_duration_seconds INTEGER DEFAULT 0,
  
  -- Session Status
  session_status VARCHAR(20) DEFAULT 'active' CHECK (session_status IN ('active', 'completed', 'expired', 'blocked')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_upload_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'), -- Session expires in 24 hours
  
  -- Constraints
  CONSTRAINT valid_email_format CHECK (guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_guest_name CHECK (LENGTH(TRIM(guest_name)) >= 2)
);

-- Indexes for performance
CREATE INDEX idx_guest_sessions_bucket_id ON guest_upload_sessions(bucket_id);
CREATE INDEX idx_guest_sessions_project_id ON guest_upload_sessions(project_id);
CREATE INDEX idx_guest_sessions_token ON guest_upload_sessions(session_token);
CREATE INDEX idx_guest_sessions_created_at ON guest_upload_sessions(created_at DESC);
CREATE INDEX idx_guest_sessions_status ON guest_upload_sessions(session_status, expires_at);

-- =================================================================
-- 4. GUEST UPLOADS (Individual File Records)
-- =================================================================

CREATE TABLE guest_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES guest_upload_sessions(id) ON DELETE CASCADE,
  
  -- File Details
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Optional Processed Versions
  thumbnail_url TEXT, -- Generated thumbnail
  compressed_url TEXT, -- Compressed version
  
  -- File Metadata
  image_metadata JSONB DEFAULT '{}', -- EXIF data, dimensions, etc.
  
  -- Organization
  upload_order INTEGER NOT NULL DEFAULT 1, -- Order within the session
  
  -- Moderation (Simple)
  is_approved BOOLEAN DEFAULT TRUE,
  moderation_notes TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE, -- When thumbnails/compression completed
  
  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size > 0),
  CONSTRAINT valid_upload_order CHECK (upload_order > 0),
  CONSTRAINT valid_file_type CHECK (file_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'))
);

-- Indexes for performance
CREATE INDEX idx_guest_uploads_session_id ON guest_uploads(session_id);
CREATE INDEX idx_guest_uploads_uploaded_at ON guest_uploads(uploaded_at DESC);
CREATE INDEX idx_guest_uploads_approved ON guest_uploads(is_approved);
CREATE INDEX idx_guest_uploads_order ON guest_uploads(session_id, upload_order);

-- =================================================================
-- 5. QR CODE SCAN TRACKING (Analytics)
-- =================================================================

CREATE TABLE qr_code_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id UUID NOT NULL REFERENCES guest_upload_buckets(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES wedding_projects(id) ON DELETE CASCADE,
  
  -- Scan Details
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Device/Browser Information
  device_type VARCHAR(20) DEFAULT 'unknown', -- mobile, tablet, desktop, unknown
  browser_name VARCHAR(50),
  browser_version VARCHAR(20),
  os_name VARCHAR(50),
  os_version VARCHAR(20),
  
  -- Location Information (if available)
  country_code CHAR(2),
  country_name VARCHAR(100),
  city VARCHAR(100),
  timezone VARCHAR(50),
  
  -- Scan Source
  scan_source VARCHAR(20) DEFAULT 'direct' CHECK (scan_source IN ('direct', 'social_share', 'email', 'whatsapp', 'other')),
  
  -- Conversion Tracking
  session_token VARCHAR(64), -- Links to guest_upload_sessions if scan converts to upload
  converted_to_upload BOOLEAN DEFAULT FALSE,
  conversion_time_seconds INTEGER, -- Time from scan to first upload
  
  -- Timestamps
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional Metadata
  scan_metadata JSONB DEFAULT '{}' -- Additional tracking data
);

-- Indexes for analytics
CREATE INDEX idx_qr_scans_bucket_id ON qr_code_scans(bucket_id);
CREATE INDEX idx_qr_scans_project_id ON qr_code_scans(project_id);
CREATE INDEX idx_qr_scans_date ON qr_code_scans(scanned_at DESC);
CREATE INDEX idx_qr_scans_device_type ON qr_code_scans(device_type);
CREATE INDEX idx_qr_scans_conversion ON qr_code_scans(converted_to_upload, conversion_time_seconds);
CREATE INDEX idx_qr_scans_location ON qr_code_scans(country_code, city);

-- =================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE guest_upload_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_scans ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- RLS Policies for guest_upload_buckets
-- =================================================================

-- Project owners can manage all buckets for their projects
CREATE POLICY "Project owners can manage upload buckets" ON guest_upload_buckets
  FOR ALL USING (
    project_id IN (
      SELECT id FROM wedding_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Public read access for active buckets (for upload page)
CREATE POLICY "Public read access to active buckets" ON guest_upload_buckets
  FOR SELECT USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- =================================================================
-- RLS Policies for qr_code_configs
-- =================================================================

-- Project owners can manage QR configs for their projects
CREATE POLICY "Project owners can manage QR configs" ON qr_code_configs
  FOR ALL USING (
    project_id IN (
      SELECT id FROM wedding_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Public read access for QR configs (needed for QR generation)
CREATE POLICY "Public read access to QR configs" ON qr_code_configs
  FOR SELECT USING (
    bucket_id IN (
      SELECT id FROM guest_upload_buckets 
      WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- =================================================================
-- RLS Policies for guest_upload_buckets
-- =================================================================

-- Project owners can manage all buckets for their projects
CREATE POLICY "Project owners can manage upload buckets" ON guest_upload_buckets
  FOR ALL USING (
    project_id IN (
      SELECT id FROM wedding_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Public read access for active buckets (for upload page)
CREATE POLICY "Public read access to active buckets" ON guest_upload_buckets
  FOR SELECT USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- =================================================================
-- RLS Policies for guest_upload_sessions
-- =================================================================

-- Project owners can view all sessions for their projects
CREATE POLICY "Project owners can view guest sessions" ON guest_upload_sessions
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM wedding_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Anonymous users can create sessions for active buckets
CREATE POLICY "Anonymous users can create upload sessions" ON guest_upload_sessions
  FOR INSERT WITH CHECK (
    bucket_id IN (
      SELECT id FROM guest_upload_buckets 
      WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Session owners can update their own sessions
CREATE POLICY "Session owners can update sessions" ON guest_upload_sessions
  FOR UPDATE USING (
    session_token = current_setting('app.current_session_token', true)
  );

-- =================================================================
-- RLS Policies for guest_uploads
-- =================================================================

-- Project owners can view all uploads for their projects
CREATE POLICY "Project owners can view guest uploads" ON guest_uploads
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM guest_upload_sessions s
      JOIN wedding_projects wp ON s.project_id = wp.id
      WHERE wp.user_id = auth.uid()
    )
  );

-- Anonymous users can insert uploads to their own sessions
CREATE POLICY "Anonymous users can upload to their sessions" ON guest_uploads
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM guest_upload_sessions 
      WHERE session_token = current_setting('app.current_session_token', true)
      AND session_status = 'active'
      AND expires_at > NOW()
    )
  );

-- Public read access for approved uploads (for gallery display)
CREATE POLICY "Public read access to approved uploads" ON guest_uploads
  FOR SELECT USING (
    is_approved = true
    AND session_id IN (
      SELECT s.id FROM guest_upload_sessions s
      JOIN wedding_projects wp ON s.project_id = wp.id
      WHERE wp.is_published = true
    )
  );

-- =================================================================
-- RLS Policies for qr_code_scans
-- =================================================================

-- Project owners can view scan analytics for their projects
CREATE POLICY "Project owners can view QR scan analytics" ON qr_code_scans
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM wedding_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Anonymous users can insert scan records
CREATE POLICY "Anonymous users can record QR scans" ON qr_code_scans
  FOR INSERT WITH CHECK (
    bucket_id IN (
      SELECT id FROM guest_upload_buckets 
      WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- =================================================================
-- 7. USEFUL VIEWS FOR COMMON QUERIES
-- =================================================================

-- View: Complete bucket information with QR config
CREATE VIEW v_bucket_with_qr_config AS
SELECT 
  b.*,
  q.qr_size,
  q.foreground_color,
  q.background_color,
  q.logo_enabled,
  q.logo_url,
  q.design_style,
  q.color_theme,
  q.qr_code_image_url as qr_image,
  q.print_ready_pdf_url,
  q.last_generated_at
FROM guest_upload_buckets b
LEFT JOIN qr_code_configs q ON b.id = q.bucket_id;

-- View: Guest upload statistics per project
CREATE VIEW v_project_upload_stats AS
SELECT 
  b.project_id,
  COUNT(DISTINCT b.id) as total_buckets,
  COUNT(DISTINCT s.id) as total_guest_sessions,
  COUNT(DISTINCT s.guest_email) as unique_guests,
  SUM(s.total_images) as total_uploaded_images,
  SUM(s.total_size_bytes) as total_storage_bytes,
  SUM(b.total_scans) as total_qr_scans,
  ROUND(
    AVG(CASE WHEN b.total_scans > 0 THEN (b.total_sessions::float / b.total_scans) * 100 ELSE 0 END), 2
  ) as avg_scan_to_session_rate
FROM guest_upload_buckets b
LEFT JOIN guest_upload_sessions s ON b.id = s.bucket_id
GROUP BY b.project_id;

-- View: QR code performance analytics
CREATE VIEW v_qr_analytics AS
SELECT 
  b.id as bucket_id,
  b.bucket_name,
  b.total_scans,
  b.total_sessions,
  b.total_uploads,
  ROUND((b.total_sessions::float / NULLIF(b.total_scans, 0)) * 100, 2) as scan_to_session_rate,
  ROUND((b.total_uploads::float / NULLIF(b.total_sessions, 0)), 2) as avg_uploads_per_session,
  DATE_TRUNC('day', b.created_at) as created_date,
  DATE_TRUNC('day', b.last_scanned_at) as last_scan_date
FROM guest_upload_buckets b;

-- =================================================================
-- 8. FUNCTIONS FOR COMMON OPERATIONS
-- =================================================================

-- Function: Update bucket statistics when new session is created
CREATE OR REPLACE FUNCTION update_bucket_session_stats()
RETURNS TRIGGER AS $
BEGIN
  UPDATE guest_upload_buckets 
  SET 
    total_sessions = total_sessions + 1,
    last_upload_at = NEW.created_at
  WHERE id = NEW.bucket_id;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function: Update session statistics when new upload is added
CREATE OR REPLACE FUNCTION update_session_upload_stats()
RETURNS TRIGGER AS $
BEGIN
  UPDATE guest_upload_sessions 
  SET 
    total_images = total_images + 1,
    total_size_bytes = total_size_bytes + NEW.file_size,
    last_upload_at = NEW.uploaded_at
  WHERE id = NEW.session_id;
  
  UPDATE guest_upload_buckets 
  SET 
    total_uploads = total_uploads + 1,
    last_upload_at = NEW.uploaded_at
  WHERE id = (
    SELECT bucket_id FROM guest_upload_sessions WHERE id = NEW.session_id
  );
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function: Record QR code scan
CREATE OR REPLACE FUNCTION record_qr_scan(
  p_bucket_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_type VARCHAR(20) DEFAULT 'unknown'
)
RETURNS UUID AS $
DECLARE
  scan_id UUID;
  project_id_var UUID;
BEGIN
  -- Get project_id from bucket
  SELECT project_id INTO project_id_var 
  FROM guest_upload_buckets 
  WHERE id = p_bucket_id;
  
  -- Insert scan record
  INSERT INTO qr_code_scans (
    bucket_id, 
    project_id, 
    ip_address, 
    user_agent, 
    device_type
  ) VALUES (
    p_bucket_id, 
    project_id_var, 
    p_ip_address, 
    p_user_agent, 
    p_device_type
  ) RETURNING id INTO scan_id;
  
  -- Update bucket scan count
  UPDATE guest_upload_buckets 
  SET 
    total_scans = total_scans + 1,
    last_scanned_at = NOW()
  WHERE id = p_bucket_id;
  
  RETURN scan_id;
END;
$ LANGUAGE plpgsql;

-- =================================================================
-- 9. TRIGGERS
-- =================================================================

-- Trigger: Update bucket stats when session is created
CREATE TRIGGER tr_update_bucket_session_stats
  AFTER INSERT ON guest_upload_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_bucket_session_stats();

-- Trigger: Update session and bucket stats when upload is added
CREATE TRIGGER tr_update_session_upload_stats
  AFTER INSERT ON guest_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_session_upload_stats();

-- =================================================================
-- 10. SAMPLE DATA INSERTION (Optional - for testing)
-- =================================================================

/*
-- Example: Create a bucket with QR config
INSERT INTO guest_upload_buckets (
  project_id, bucket_name, bucket_description, storage_path
) VALUES (
  'your-project-uuid', 
  'Reception Photos', 
  'Share your favorite moments from our reception!',
  'your-project-uuid/reception-photos'
);

-- Example: Create QR config for the bucket
INSERT INTO qr_code_configs (
  bucket_id, project_id, qr_size, foreground_color, background_color,
  content_title, color_theme, design_style
) VALUES (
  'bucket-uuid', 
  'your-project-uuid', 
  300, 
  '#D4AF37', 
  '#FFFFFF',
  'Reception Photos',
  'gold_elegant',
  'rounded'
);
*/