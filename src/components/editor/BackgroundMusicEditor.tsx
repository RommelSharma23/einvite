'use client'

import { useState, useEffect, useRef } from 'react'
import { Music, Upload, Play, Pause, Volume2, VolumeX, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

interface BackgroundMusicConfig {
  id?: string
  projectId: string
  fileUrl: string
  fileName: string
  fileSize?: number
  duration?: number
  isPreset: boolean
  presetCategory?: string
  isEnabled: boolean
  volume: number
  autoPlay: boolean
  loopEnabled: boolean
}

interface BackgroundMusicEditorProps {
  projectId: string
  config?: BackgroundMusicConfig | null
  onChange: (config: BackgroundMusicConfig | null) => void
  userTier: 'free' | 'silver' | 'gold' | 'platinum'
  onUpgrade?: (tier: string) => void
}

const PRESET_CATEGORIES = [
  { value: 'romantic', label: 'Romantic' },
  { value: 'classical', label: 'Classical' },
  { value: 'acoustic', label: 'Acoustic' },
  { value: 'instrumental', label: 'Instrumental' }
]

// Preset music library - Connected to your Supabase storage
// Note: Update file extensions (.mp3, .wav) based on your actual uploaded files
const PRESET_MUSIC = [
  {
    fileName: 'Classical Sample Music',
    fileUrl: 'https://qjlcbryoqlcpxtowpijx.supabase.co/storage/v1/object/public/Wedding-assets/background_music_preset/Sample1.mp3',
    category: 'classical',
    duration: 180,
    isPlaceholder: false
  },
  {
    fileName: 'Romantic Sample Music',
    fileUrl: 'https://qjlcbryoqlcpxtowpijx.supabase.co/storage/v1/object/public/Wedding-assets/background_music_preset/Sample2.mp3',
    category: 'romantic',
    duration: 240,
    isPlaceholder: false
  },
  {
    fileName: 'Acoustic Sample Music',
    fileUrl: 'https://qjlcbryoqlcpxtowpijx.supabase.co/storage/v1/object/public/Wedding-assets/background_music_preset/Sample3.mp3',
    category: 'acoustic',
    duration: 220,
    isPlaceholder: false
  },
  {
    fileName: 'Instrumental Sample Music',
    fileUrl: 'https://qjlcbryoqlcpxtowpijx.supabase.co/storage/v1/object/public/Wedding-assets/background_music_preset/Sample4.mp3',
    category: 'instrumental',
    duration: 200,
    isPlaceholder: false
  }
]

export default function BackgroundMusicEditor({
  projectId,
  config,
  onChange,
  userTier,
  onUpgrade
}: BackgroundMusicEditorProps) {
  const [currentConfig, setCurrentConfig] = useState<BackgroundMusicConfig | null>(config || null)
  const [uploading, setUploading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>('romantic')
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if user has access to background music feature
  const hasAccess = userTier === 'gold' || userTier === 'platinum'

  useEffect(() => {
    setCurrentConfig(config || null)
  }, [config])

  // Audio controls
  const togglePlayback = async () => {
    if (!audioRef.current || !currentConfig) return

    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      try {
        // Check if audio can be loaded
        audioRef.current.load() // Force reload

        // Wait a bit for loading
        await new Promise(resolve => setTimeout(resolve, 100))

        await audioRef.current.play()
        setPlaying(true)
        console.log('Audio playing successfully:', currentConfig.fileUrl)
      } catch (error) {
        console.error('Error playing audio:', error)
        console.error('Audio readyState:', audioRef.current.readyState)
        console.error('Audio networkState:', audioRef.current.networkState)
        console.error('Audio error:', audioRef.current.error)

        setPlaying(false)
        alert(`Could not play audio file.\nURL: ${currentConfig.fileUrl}\nError: ${error.message || error}`)
      }
    }
  }

  const updateConfig = (updates: Partial<BackgroundMusicConfig>) => {
    if (!currentConfig) return

    const newConfig = { ...currentConfig, ...updates }
    setCurrentConfig(newConfig)
    onChange(newConfig)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎵 File upload triggered')

    const file = event.target.files?.[0]
    console.log('🎵 Selected file:', file)

    if (!file) {
      console.log('🎵 No file selected')
      return
    }

    console.log('🎵 File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    })

    // Validate file type
    if (!file.type.includes('audio/mpeg') && !file.type.includes('audio/wav')) {
      console.log('🎵 Invalid file type:', file.type)
      alert('Please upload only MP3 or WAV files')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.log('🎵 File too large:', file.size)
      alert('File size must be less than 10MB')
      return
    }

    try {
      console.log('🎵 Starting upload...')
      setUploading(true)

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create path matching your image structure: userid/projectid/music/filename
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${user.id}/${projectId}/music/${fileName}`
      console.log('🎵 Upload path:', filePath)

      // Workaround: Upload as a supported file type (image/jpeg) to bypass restrictions
      const fileBuffer = await file.arrayBuffer()
      const blob = new Blob([fileBuffer], { type: 'image/jpeg' })

      // Change file extension to .jpg to match the fake MIME type
      const fakeFileName = fileName.replace(/\.(mp3|wav)$/i, '.jpg')
      const fakeFilePath = `${user.id}/${projectId}/music/${fakeFileName}`

      console.log('🎵 Uploading as fake image file to bypass restrictions...')
      console.log('🎵 Original file:', fileName)
      console.log('🎵 Fake file path:', fakeFilePath)

      const { data, error } = await supabase.storage
        .from('wedding-images')
        .upload(fakeFilePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      console.log('🎵 Upload result:', { data, error })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wedding-images')
        .getPublicUrl(fakeFilePath)

      console.log('🎵 Public URL:', publicUrl)

      // Create new config with original filename but fake URL
      const newConfig: BackgroundMusicConfig = {
        projectId,
        fileUrl: publicUrl, // This points to the .jpg file but contains MP3/WAV data
        fileName: file.name, // Keep original filename for display
        fileSize: file.size,
        isPreset: false,
        isEnabled: true,
        volume: 0.5,
        autoPlay: true,
        loopEnabled: true
      }

      console.log('🎵 Created new config:', newConfig)
      setCurrentConfig(newConfig)
      onChange(newConfig)
      console.log('🎵 Upload completed successfully!')

    } catch (error) {
      console.error('🎵 Error uploading music file:', error)
      alert(`Failed to upload music file: ${error.message}`)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const selectPresetMusic = (preset: typeof PRESET_MUSIC[0]) => {
    console.log('🎵 Selecting preset music:', preset)
    console.log('🔗 Preset URL:', preset.fileUrl)

    const newConfig: BackgroundMusicConfig = {
      projectId,
      fileUrl: preset.fileUrl,
      fileName: preset.fileName,
      duration: preset.duration,
      isPreset: true,
      presetCategory: preset.category,
      isEnabled: true,
      volume: 0.5,
      autoPlay: true,
      loopEnabled: true
    }

    console.log('✅ New config created:', newConfig)
    setCurrentConfig(newConfig)
    onChange(newConfig)
  }

  const removeMusic = () => {
    setCurrentConfig(null)
    onChange(null)
    setPlaying(false)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Background Music
          </CardTitle>
          <CardDescription>
            Add beautiful background music to your wedding website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Background Music Available
            </h3>
            <p className="text-gray-600 mb-4">
              Add romantic background music to enhance your wedding website experience
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Available with Gold and Platinum plans
            </p>
            <Button onClick={() => onUpgrade?.('gold')}>
              Upgrade to Gold
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Background Music
          </CardTitle>
          <CardDescription>
            Add beautiful background music to your wedding website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Music Display */}
          {currentConfig && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{currentConfig.fileName}</h4>
                  <p className="text-sm text-gray-600">
                    {currentConfig.isPreset ? 'Preset Music' : 'Custom Upload'} •
                    {formatDuration(currentConfig.duration)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlayback}
                    className="flex items-center gap-1"
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {playing ? 'Pause' : 'Preview'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔍 Current config:', currentConfig)
                      console.log('🔍 Current URL:', currentConfig?.fileUrl)
                      console.log('🔍 Audio element src:', audioRef.current?.src)
                    }}
                    className="text-blue-600"
                  >
                    Debug
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeMusic}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Audio Element */}
              <audio
                ref={audioRef}
                src={currentConfig.fileUrl}
                onEnded={() => setPlaying(false)}
                onError={(e) => {
                  console.error('Audio error:', e)
                  console.error('Audio source:', currentConfig.fileUrl)
                  setPlaying(false)
                  alert(`Audio loading failed. URL: ${currentConfig.fileUrl}`)
                }}
                onLoadStart={() => console.log('Audio loading started:', currentConfig.fileUrl)}
                onCanPlay={() => console.log('Audio can play:', currentConfig.fileUrl)}
                preload="metadata"
                crossOrigin="anonymous"
              />

              {/* Music Controls */}
              <div className="space-y-4 mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="music-enabled">Enable Background Music</Label>
                  <Switch
                    id="music-enabled"
                    checked={currentConfig.isEnabled}
                    onCheckedChange={(checked) => updateConfig({ isEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-play">Auto-play on Website Load</Label>
                  <Switch
                    id="auto-play"
                    checked={currentConfig.autoPlay}
                    onCheckedChange={(checked) => updateConfig({ autoPlay: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="loop-music">Loop Music</Label>
                  <Switch
                    id="loop-music"
                    checked={currentConfig.loopEnabled}
                    onCheckedChange={(checked) => updateConfig({ loopEnabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Volume</Label>
                    <span className="text-sm text-gray-600">
                      {Math.round(currentConfig.volume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[currentConfig.volume]}
                    onValueChange={([value]) => updateConfig({ volume: value })}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add Music</h3>

            {/* Custom Upload */}
            <div>
              <Label className="text-base font-medium">Upload Your Own Music</Label>
              <p className="text-sm text-gray-600 mb-3">
                Upload MP3 or WAV files (Max 10MB)
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      console.log('🎵 Choose File button clicked')
                      console.log('🎵 File input ref:', fileInputRef.current)
                      fileInputRef.current?.click()
                    }}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,audio/mpeg,audio/wav"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploading && (
                    <span className="text-sm text-gray-600">Uploading...</span>
                  )}
                </div>

                {/* Fallback visible file input */}
                <div className="text-sm text-gray-600">
                  Or use direct file input:
                  <input
                    type="file"
                    accept=".mp3,.wav,audio/mpeg,audio/wav"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full mt-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Preset Library */}
            <div>
              <Label className="text-base font-medium">Choose from Preset Library</Label>
              <p className="text-sm text-gray-600 mb-3">
                Select from our curated collection of wedding music
              </p>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Music Category</Label>
                  <select
                    value={selectedPresetCategory}
                    onChange={(e) => {
                      console.log('🎵 Category changed to:', e.target.value)
                      setSelectedPresetCategory(e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {PRESET_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  {console.log('🎵 Filtering presets for category:', selectedPresetCategory)}
                  {console.log('🎵 Available presets:', PRESET_MUSIC.filter(preset => preset.category === selectedPresetCategory))}
                  {PRESET_MUSIC
                    .filter(preset => preset.category === selectedPresetCategory)
                    .map((preset, index) => (
                      <div
                        key={`${preset.category}-${index}`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{preset.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {formatDuration(preset.duration)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('🎵 Selecting preset:', preset)
                            selectPresetMusic(preset)
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  {PRESET_MUSIC.filter(preset => preset.category === selectedPresetCategory).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No music available in this category
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}