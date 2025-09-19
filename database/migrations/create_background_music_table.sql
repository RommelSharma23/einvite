-- Create background_music table for wedding website background music
CREATE TABLE background_music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES wedding_projects(id) ON DELETE CASCADE,

  -- Music file info
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  duration INTEGER, -- in seconds

  -- Source type
  is_preset BOOLEAN DEFAULT FALSE,
  preset_category TEXT, -- 'romantic', 'classical', 'modern', etc.

  -- Configuration
  is_enabled BOOLEAN DEFAULT TRUE,
  volume REAL DEFAULT 0.5, -- 0.0 to 1.0
  auto_play BOOLEAN DEFAULT TRUE,
  loop_enabled BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one music per project
  UNIQUE(project_id)
);

-- Add indexes for better performance
CREATE INDEX idx_background_music_project_id ON background_music(project_id);
CREATE INDEX idx_background_music_is_preset ON background_music(is_preset);
CREATE INDEX idx_background_music_preset_category ON background_music(preset_category);

-- Add RLS (Row Level Security) policies
ALTER TABLE background_music ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access music for their own projects
CREATE POLICY "Users can manage background music for their own projects" ON background_music
  FOR ALL USING (
    project_id IN (
      SELECT id FROM wedding_projects
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow read access to published projects (for public viewing)
CREATE POLICY "Public can read music for published projects" ON background_music
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM wedding_projects
      WHERE is_published = true
    )
  );