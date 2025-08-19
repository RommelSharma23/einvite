// File: src/components/editor/StyleEditor.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Palette } from 'lucide-react'

interface StyleEditorProps {
  styles: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    fontFamily: string
  }
  onStyleUpdate: (field: string, value: string) => void
}

const colorPresets = [
  { name: 'Royal Blue', primary: '#2563eb', secondary: '#7c3aed' },
  { name: 'Rose Gold', primary: '#f43f5e', secondary: '#ec4899' },
  { name: 'Emerald Green', primary: '#059669', secondary: '#10b981' },
  { name: 'Sunset Orange', primary: '#ea580c', secondary: '#f97316' },
  { name: 'Deep Purple', primary: '#7c3aed', secondary: '#a855f7' },
  { name: 'Burgundy', primary: '#991b1b', secondary: '#dc2626' },
]

const fontOptions = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display, serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Lora', value: 'Lora, serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
]

export function StyleEditor({ styles, onStyleUpdate }: StyleEditorProps) {
  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    onStyleUpdate('primaryColor', preset.primary)
    onStyleUpdate('secondaryColor', preset.secondary)
  }

  return (
    <div className="space-y-4">
      {/* Color Schemes */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Palette className="h-5 w-5 mr-2 text-blue-500" />
            <CardTitle className="text-base">Color Scheme</CardTitle>
          </div>
          <CardDescription>
            Choose colors for your wedding website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Quick Color Presets</Label>
            <div className="grid grid-cols-1 gap-3">
              {colorPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyColorPreset(preset)}
                  className="flex items-center p-3 border rounded-lg hover:border-gray-400 transition-colors text-left"
                >
                  <div className="flex space-x-1 mr-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Custom Colors</Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center space-x-3">
                  <input
                    id="primary-color"
                    type="color"
                    value={styles.primaryColor}
                    onChange={(e) => onStyleUpdate('primaryColor', e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <Input
                    value={styles.primaryColor}
                    onChange={(e) => onStyleUpdate('primaryColor', e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center space-x-3">
                  <input
                    id="secondary-color"
                    type="color"
                    value={styles.secondaryColor}
                    onChange={(e) => onStyleUpdate('secondaryColor', e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <Input
                    value={styles.secondaryColor}
                    onChange={(e) => onStyleUpdate('secondaryColor', e.target.value)}
                    placeholder="#7c3aed"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Typography</Label>
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select 
                value={styles.fontFamily} 
                onChange={(e) => onStyleUpdate('fontFamily', e.target.value)}
              >
                <option value="" disabled>Choose a font</option>
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}