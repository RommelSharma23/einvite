'use client'

import { useState } from 'react'
import { Facebook, Instagram, Eye, Link, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface SocialLinksConfig {
  isEnabled: boolean
  facebookUrl: string
  instagramUrl: string
  displayLocation: 'header' | 'footer' | 'section' | 'floating'
  callToAction: string
  iconStyle: 'colored' | 'monochrome' | 'outline'
  iconSize: 'small' | 'medium' | 'large'
}

interface SocialLinksEditorProps {
  config: SocialLinksConfig
  onChange: (config: SocialLinksConfig) => void
  primaryColor: string
  secondaryColor: string
  showInputsWhenDisabled?: boolean
}

export function SocialLinksEditor({
  config,
  onChange,
  primaryColor,
  secondaryColor,
  showInputsWhenDisabled = false
}: SocialLinksEditorProps) {

  const updateConfig = (updates: Partial<SocialLinksConfig>) => {
    onChange({ ...config, ...updates })
  }

  // Validate URLs
  const validateUrl = (url: string, platform: string) => {
    if (!url) return true

    const urlPattern = /^https?:\/\/.+/
    if (!urlPattern.test(url)) return false

    if (platform === 'facebook') {
      return url.includes('facebook.com') || url.includes('fb.com')
    }
    if (platform === 'instagram') {
      return url.includes('instagram.com')
    }
    return true
  }

  const locationOptions = [
    { value: 'footer', label: 'Footer', description: 'Bottom of the page' },
    { value: 'section', label: 'Dedicated Section', description: 'Own section between content' },
    { value: 'floating', label: 'Floating Sidebar', description: 'Stays on screen while scrolling' }
  ]


  return (
    <div className="space-y-4">
      {/* Header with Enable Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4" style={{ color: primaryColor }} />
            <h3 className="font-medium">Social Media</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {config.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <Button
              variant={config.isEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => updateConfig({ isEnabled: !config.isEnabled })}
              className="min-w-[80px]"
            >
              {config.isEnabled ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {showInputsWhenDisabled && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  {config.isEnabled ? '✅ Social media links are enabled' : '⚪ Enable social media links'}
                </p>
                <p className="text-xs text-blue-700">
                  {config.isEnabled
                    ? 'Your social media links will appear on your wedding website.'
                    : 'Toggle the switch above to display your social media links on your wedding website.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {(config.isEnabled || showInputsWhenDisabled) && (
        <div className="space-y-4">

          {/* Social Media URLs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Social Media Links</Label>

            {/* Facebook */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                <Label className="text-sm">Facebook</Label>
              </div>
              <Input
                placeholder="https://facebook.com/yourpage"
                value={config.facebookUrl}
                onChange={(e) => updateConfig({ facebookUrl: e.target.value })}
                className={!validateUrl(config.facebookUrl, 'facebook') && config.facebookUrl ? 'border-red-300' : ''}
              />
              {!validateUrl(config.facebookUrl, 'facebook') && config.facebookUrl && (
                <p className="text-xs text-red-500">Please enter a valid Facebook URL</p>
              )}
            </div>

            {/* Instagram */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-600" />
                <Label className="text-sm">Instagram</Label>
              </div>
              <Input
                placeholder="https://instagram.com/yourusername"
                value={config.instagramUrl}
                onChange={(e) => updateConfig({ instagramUrl: e.target.value })}
                className={!validateUrl(config.instagramUrl, 'instagram') && config.instagramUrl ? 'border-red-300' : ''}
              />
              {!validateUrl(config.instagramUrl, 'instagram') && config.instagramUrl && (
                <p className="text-xs text-red-500">Please enter a valid Instagram URL</p>
              )}
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Call to Action</Label>
            <Input
              placeholder="Follow Us"
              value={config.callToAction}
              onChange={(e) => updateConfig({ callToAction: e.target.value })}
              maxLength={50}
            />
            <p className="text-xs text-gray-500">Text shown above social icons</p>
          </div>

          {/* Display Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Display Location</Label>
            <div className="grid grid-cols-1 gap-2">
              {locationOptions.map((option) => (
                <button
                  key={option.value}
                  className={`p-3 rounded-lg border text-left transition-all hover:border-gray-300 ${
                    config.displayLocation === option.value
                      ? 'border-2 bg-gray-50'
                      : 'border-gray-200'
                  }`}
                  style={{
                    borderColor: config.displayLocation === option.value ? primaryColor : undefined
                  }}
                  onClick={() => updateConfig({ displayLocation: option.value as any })}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{
                      backgroundColor: config.displayLocation === option.value ? primaryColor : '#d1d5db'
                    }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>


          {/* Preview */}
          {(config.facebookUrl || config.instagramUrl) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-medium mb-3" style={{ color: primaryColor }}>
                    {config.callToAction || 'Follow Us'}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {config.facebookUrl && (
                      <div
                        className="flex items-center justify-center rounded-full transition-transform hover:scale-110"
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: '#1877f2'
                        }}
                      >
                        <Facebook
                          className="h-6 w-6"
                          style={{ color: 'white' }}
                        />
                      </div>
                    )}
                    {config.instagramUrl && (
                      <div
                        className="flex items-center justify-center rounded-full transition-transform hover:scale-110"
                        style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)'
                        }}
                      >
                        <Instagram
                          className="h-6 w-6"
                          style={{ color: 'white' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}