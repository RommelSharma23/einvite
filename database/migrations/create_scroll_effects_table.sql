-- Create scroll_effects table for wedding project animation settings
-- This table stores all scroll animation and visual effect configurations

CREATE TABLE IF NOT EXISTS scroll_effects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES wedding_projects(id) ON DELETE CASCADE,

    -- Basic settings
    enabled BOOLEAN DEFAULT true,
    animation_type VARCHAR(20) DEFAULT 'normal' CHECK (animation_type IN ('disabled', 'gentle', 'normal', 'energetic')),
    background_pattern VARCHAR(20) DEFAULT 'hearts' CHECK (background_pattern IN ('none', 'hearts', 'floral', 'geometric', 'dots')),

    -- Advanced settings
    parallax_intensity INTEGER DEFAULT 30 CHECK (parallax_intensity >= 0 AND parallax_intensity <= 100),
    show_scroll_progress BOOLEAN DEFAULT true,
    show_scroll_to_top BOOLEAN DEFAULT true,
    stagger_animations BOOLEAN DEFAULT true,
    mobile_animations VARCHAR(20) DEFAULT 'reduced' CHECK (mobile_animations IN ('disabled', 'reduced', 'same')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one config per project
    UNIQUE(project_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scroll_effects_project_id ON scroll_effects(project_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_scroll_effects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scroll_effects_updated_at
    BEFORE UPDATE ON scroll_effects
    FOR EACH ROW
    EXECUTE FUNCTION update_scroll_effects_updated_at();

-- Insert default scroll effects for existing projects
INSERT INTO scroll_effects (project_id, enabled, animation_type, background_pattern)
SELECT
    id as project_id,
    true as enabled,
    'normal' as animation_type,
    'hearts' as background_pattern
FROM wedding_projects
WHERE id NOT IN (SELECT project_id FROM scroll_effects);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON scroll_effects TO authenticated;
GRANT USAGE ON SEQUENCE scroll_effects_id_seq TO authenticated;