// ScrollEffectsEditor.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  Eye,
  EyeOff,
  Zap,
  Waves,
  Heart,
  Flower,
  Square,
  Circle,
  ArrowUp,
  BarChart3,
  Sparkles,
  RotateCcw,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ScrollEffectsConfig {
  enabled: boolean
  animationType: 'disabled' | 'gentle' | 'normal' | 'energetic'
  backgroundPattern: 'none' | 'hearts' | 'floral' | 'geometric' | 'dots'
  parallaxIntensity: number // 0-100
  showScrollProgress: boolean
  showScrollToTop: boolean
  staggerAnimations: boolean
  mobileAnimations: 'disabled' | 'reduced' | 'same'
}

interface ScrollEffectsEditorProps {
  config: ScrollEffectsConfig
  onChange: (config: ScrollEffectsConfig) => void
  primaryColor: string
  secondaryColor: string
}

export function ScrollEffectsEditor({
  config,
  onChange,
  primaryColor,
  secondaryColor
}: ScrollEffectsEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const animationTypes = [
    {
      value: 'disabled',
      label: 'No Animations',
      description: 'Static website with no scroll effects',
      icon: EyeOff,
      duration: 0
    },
    {
      value: 'gentle',
      label: 'Gentle & Elegant',
      description: 'Subtle animations perfect for formal weddings',
      icon: Flower,
      duration: 1200
    },
    {
      value: 'normal',
      label: 'Balanced',
      description: 'Perfect balance of beauty and performance',
      icon: Sparkles,
      duration: 800
    },
    {
      value: 'energetic',
      label: 'Dynamic & Fun',
      description: 'Lively animations for modern celebrations',
      icon: Zap,
      duration: 500
    }
  ]

  const backgroundPatterns = [
    {
      value: 'none',
      label: 'Clean Background',
      description: 'Minimal design with solid colors',
      icon: Square,
      preview: 'bg-gray-100'
    },
    {
      value: 'hearts',
      label: 'Romantic Hearts',
      description: 'Floating hearts perfect for love stories',
      icon: Heart,
      preview: 'bg-gradient-to-br from-pink-50 to-red-50'
    },
    {
      value: 'floral',
      label: 'Floral Garden',
      description: 'Beautiful flowers for garden weddings',
      icon: Flower,
      preview: 'bg-gradient-to-br from-green-50 to-yellow-50'
    },
    {
      value: 'geometric',
      label: 'Modern Geometric',
      description: 'Contemporary patterns for modern couples',
      icon: Square,
      preview: 'bg-gradient-to-br from-blue-50 to-purple-50'
    },
    {
      value: 'dots',
      label: 'Wedding Confetti',
      description: 'Celebratory dots like wedding confetti',
      icon: Circle,
      preview: 'bg-gradient-to-br from-yellow-50 to-orange-50'
    }
  ]

  // Live preview animation demo
  const playPreviewAnimation = () => {
    setIsPlaying(true)

    // Trigger sample animations based on current config
    const elements = document.querySelectorAll('.preview-element')
    elements.forEach((el, index) => {
      const element = el as HTMLElement
      element.style.transition = `all ${animationTypes.find(t => t.value === config.animationType)?.duration || 800}ms ease-out`
      element.style.transitionDelay = config.staggerAnimations ? `${index * 100}ms` : '0ms'
      element.style.transform = 'translateY(-20px) scale(1.05)'
      element.style.opacity = '0.8'

      setTimeout(() => {
        element.style.transform = 'translateY(0) scale(1)'
        element.style.opacity = '1'
      }, 100)
    })

    setTimeout(() => {
      setIsPlaying(false)
    }, 1500)
  }

  const updateConfig = (updates: Partial<ScrollEffectsConfig>) => {
    onChange({ ...config, ...updates })
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4" style={{ color: primaryColor }} />
          <h3 className="font-medium">Scroll Effects</h3>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => updateConfig({ enabled })}
        />
      </div>

      {config.enabled && (
        <div className="space-y-4">
          {/* Animation Style - Compact */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Animation Style</Label>
            <div className="grid grid-cols-2 gap-2">
              {animationTypes.map((type) => (
                <button
                  key={type.value}
                  className={`p-3 rounded-lg border text-left transition-all hover:border-gray-300 ${
                    config.animationType === type.value
                      ? 'border-2 bg-gray-50'
                      : 'border-gray-200'
                  }`}
                  style={{
                    borderColor: config.animationType === type.value ? primaryColor : undefined
                  }}
                  onClick={() => updateConfig({ animationType: type.value as any })}
                >
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" style={{
                      color: config.animationType === type.value ? primaryColor : '#6b7280'
                    }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-500 truncate">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Background Pattern - Button Grid */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Background Pattern</Label>
            <div className="grid grid-cols-2 gap-2">
              {backgroundPatterns.map((pattern) => (
                <button
                  key={pattern.value}
                  className={`p-2 rounded-lg border text-left transition-all hover:border-gray-300 ${
                    config.backgroundPattern === pattern.value
                      ? 'border-2 bg-gray-50'
                      : 'border-gray-200'
                  }`}
                  style={{
                    borderColor: config.backgroundPattern === pattern.value ? primaryColor : undefined
                  }}
                  onClick={() => updateConfig({ backgroundPattern: pattern.value as any })}
                >
                  <div className="flex items-center gap-2">
                    <pattern.icon className="h-4 w-4" style={{
                      color: config.backgroundPattern === pattern.value ? primaryColor : '#6b7280'
                    }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs">{pattern.label}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Parallax Intensity - Compact */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Parallax Intensity</Label>
              <span className="text-xs text-gray-500">{config.parallaxIntensity}%</span>
            </div>
            <Slider
              value={[config.parallaxIntensity]}
              onValueChange={(values) => updateConfig({ parallaxIntensity: values[0] })}
              max={100}
              min={0}
              step={10}
            />
          </div>

          {/* Quick Options - Compact */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Progress Bar</Label>
              <Switch
                checked={config.showScrollProgress}
                onCheckedChange={(checked) => updateConfig({ showScrollProgress: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Back to Top</Label>
              <Switch
                checked={config.showScrollToTop}
                onCheckedChange={(checked) => updateConfig({ showScrollToTop: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Stagger Animations</Label>
              <Switch
                checked={config.staggerAnimations}
                onCheckedChange={(checked) => updateConfig({ staggerAnimations: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Mobile Animations</Label>
              <Select
                value={config.mobileAnimations}
                onValueChange={(value: any) => updateConfig({ mobileAnimations: value })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Off</SelectItem>
                  <SelectItem value="reduced">Reduced</SelectItem>
                  <SelectItem value="same">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}