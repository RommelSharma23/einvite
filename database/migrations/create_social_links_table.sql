-- Create social_links table for wedding project social media links
-- This table stores social media configurations and display settings

CREATE TABLE IF NOT EXISTS social_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES wedding_projects(id) ON DELETE CASCADE,

    -- Social media links
    facebook_url VARCHAR(500),
    instagram_url VARCHAR(500),

    -- Display settings
    is_enabled BOOLEAN DEFAULT false,
    display_location VARCHAR(20) DEFAULT 'footer' CHECK (display_location IN ('header', 'footer', 'section', 'floating')),
    call_to_action TEXT DEFAULT 'Follow Us',

    -- Style settings
    icon_style VARCHAR(20) DEFAULT 'colored' CHECK (icon_style IN ('colored', 'monochrome', 'outline')),
    icon_size VARCHAR(10) DEFAULT 'medium' CHECK (icon_size IN ('small', 'medium', 'large')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one config per project
    UNIQUE(project_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_links_project_id ON social_links(project_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_social_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_links_updated_at
    BEFORE UPDATE ON social_links
    FOR EACH ROW
    EXECUTE FUNCTION update_social_links_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON social_links TO authenticated;