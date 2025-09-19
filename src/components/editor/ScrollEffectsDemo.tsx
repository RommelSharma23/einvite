// ScrollEffectsDemo.tsx
'use client'

import { useState } from 'react'
import { ScrollEffectsEditor } from './ScrollEffectsEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Code, Palette } from 'lucide-react'

interface ScrollEffectsConfig {
  enabled: boolean
  animationType: 'disabled' | 'gentle' | 'normal' | 'energetic'
  backgroundPattern: 'none' | 'hearts' | 'floral' | 'geometric' | 'dots'
  parallaxIntensity: number
  showScrollProgress: boolean
  showScrollToTop: boolean
  staggerAnimations: boolean
  mobileAnimations: 'disabled' | 'reduced' | 'same'
}

export function ScrollEffectsDemo() {
  const [config, setConfig] = useState<ScrollEffectsConfig>({
    enabled: true,
    animationType: 'normal',
    backgroundPattern: 'hearts',
    parallaxIntensity: 30,
    showScrollProgress: true,
    showScrollToTop: true,
    staggerAnimations: true,
    mobileAnimations: 'reduced'
  })

  const [showPreview, setShowPreview] = useState(false)

  const primaryColor = '#3b82f6'
  const secondaryColor = '#8b5cf6'

  const handleConfigChange = (newConfig: ScrollEffectsConfig) => {
    setConfig(newConfig)
    console.log('Scroll effects config updated:', newConfig)
  }

  const handlePreview = () => {
    setShowPreview(true)
    // In real implementation, this would open a preview modal or new tab
    console.log('Opening preview with config:', config)

    // Demo: Show preview for 3 seconds
    setTimeout(() => {
      setShowPreview(false)
    }, 3000)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Demo Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-blue-500" />
            Scroll Effects Configuration Demo
          </CardTitle>
          <p className="text-gray-600">
            This is a demo of the configurable scrolling effects system. Users can customize animations,
            patterns, and scroll behaviors with live preview functionality.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline">✨ Live Preview</Badge>
            <Badge variant="outline">🎬 Sample Animations</Badge>
            <Badge variant="outline">📱 Mobile Responsive</Badge>
            <Badge variant="outline">⚡ Real-time Updates</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preview Window */}
      {showPreview && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Preview Mode Active</h3>
              <p className="text-gray-600 mb-4">
                In the real implementation, this would show your wedding website with the selected effects.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Animation:</strong><br />
                  <Badge variant="outline">{config.animationType}</Badge>
                </div>
                <div>
                  <strong>Pattern:</strong><br />
                  <Badge variant="outline">{config.backgroundPattern}</Badge>
                </div>
                <div>
                  <strong>Parallax:</strong><br />
                  <Badge variant="outline">{config.parallaxIntensity}%</Badge>
                </div>
                <div>
                  <strong>Mobile:</strong><br />
                  <Badge variant="outline">{config.mobileAnimations}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Editor */}
      <ScrollEffectsEditor
        config={config}
        onChange={handleConfigChange}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        onPreview={handlePreview}
      />

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Implementation Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">🗄️ Database Integration</h4>
              <p className="text-sm text-gray-600">
                The scroll effects config should be stored in a <code>scroll_effects</code> table
                linked to each wedding project.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">🎨 Editor Integration</h4>
              <p className="text-sm text-gray-600">
                This component can be added to the wedding editor as a new tab called "Effects & Animations"
                or integrated into the existing styling section.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">📱 Published Page Integration</h4>
              <p className="text-sm text-gray-600">
                The published wedding page should load these settings and dynamically apply the
                chosen animations, patterns, and scroll behaviors.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">⚡ Performance Considerations</h4>
              <p className="text-sm text-gray-600">
                Animations are optimized for performance and include mobile-specific settings
                to ensure smooth scrolling on all devices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Config Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}